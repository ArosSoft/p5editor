import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/supabase'
import router from '../router'

const AUTH_CACHE_KEY = 'p5editor-auth-cache'
const AUTH_GRACE_MS = 15 * 60 * 1000

// Глобальное состояние для хранения данных авторизации
const globalUser = ref<User | null>(null)
const globalProfile = ref<Profile | null>(null)
const globalSession = ref<Session | null>(null)
const globalLoading = ref(false)
const globalError = ref<string | null>(null)
const authReady = ref(false)
const readyPromise = ref<Promise<void> | null>(null)
let authInitialized = false
let authUnsubscribe: (() => void) | null = null
let profileLoadPromise: Promise<void> | null = null

// Состояние для сброса пароля
const passwordRecoveryMode = ref(false)

function saveAuthCache(session: Session | null) {
  try {
    if (!session?.user) {
      localStorage.removeItem(AUTH_CACHE_KEY)
      return
    }

    localStorage.setItem(
      AUTH_CACHE_KEY,
      JSON.stringify({
        session,
        savedAt: Date.now()
      })
    )
  } catch (e) {
    console.warn('[Auth] Не удалось сохранить кеш сессии', e)
  }
}

function loadAuthCache(): { session: Session; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as { session?: Session; savedAt?: number }
    if (!parsed.session?.user || !parsed.savedAt) return null

    return { session: parsed.session, savedAt: parsed.savedAt }
  } catch (e) {
    console.warn('[Auth] Не удалось прочитать кеш сессии', e)
    return null
  }
}

async function hydrateSession(session: Session | null) {
  globalSession.value = session
  globalUser.value = session?.user ?? null
  saveAuthCache(session)

  if (session?.user) {
    await loadProfileInternal(session.user.id)
  } else {
    globalProfile.value = null
    localStorage.removeItem('user_role')
  }
}

// Инициализация авторизации (вызывается один раз при старте приложения)
export async function initAuth() {
  if (authInitialized) {
    return readyPromise.value
  }

  authInitialized = true
  globalLoading.value = true

  readyPromise.value = (async () => {
    try {
      const cached = loadAuthCache()
      if (cached?.session) {
        const age = Date.now() - cached.savedAt
        if (age <= AUTH_GRACE_MS) {
          await hydrateSession(cached.session)
        }
      }

      // Загрузка текущей сессии
      const { data: { session } } = await supabase.auth.getSession()
      await hydrateSession(session)

      // Подписка на изменения авторизации
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log('[Auth] Event:', event)
        const eventStr = event as string

        if (eventStr === 'TOKEN_REFRESH_FAILED' || eventStr === 'SIGNED_OUT') {
          globalSession.value = null
          globalUser.value = null
          globalProfile.value = null
          localStorage.removeItem('user_role')
          localStorage.removeItem(AUTH_CACHE_KEY)
          passwordRecoveryMode.value = false
          globalError.value = 'Сессия истекла. Пожалуйста, войдите снова.'
          console.warn('[Auth] Сессия истекла или токен не обновился')
          return
        }

        if (eventStr === 'PASSWORD_RECOVERY') {
          console.log('[Auth] Режим восстановления пароля — пользователь авторизован')
          passwordRecoveryMode.value = true
          await hydrateSession(newSession)
          // По ссылке из письма пользователь просто авторизуется на сайте,
          // чтобы сменить пароль в личном кабинете (модалка редактирования
          // профиля), а не на отдельной странице /update-password.
          try {
            router.push('/')
          } catch (e) {
            console.error('[Auth] Ошибка перенаправления:', e)
          }
          // Убираем параметры авторизации (code/access_token/error/...) из URL,
          // чтобы они не висели в адресной строке и не мешали при reload.
          if (typeof window !== 'undefined') {
            try {
              const url = new URL(window.location.href)
              const authParams = ['code', 'access_token', 'refresh_token', 'expires_in', 'token_type', 'error', 'error_code', 'error_description', 'type']
              let changed = false
              authParams.forEach((p) => {
                if (url.searchParams.has(p)) {
                  url.searchParams.delete(p)
                  changed = true
                }
              })
              if (changed) {
                const cleaned = url.origin + url.pathname + (url.search || '') + (url.hash || '#/')
                window.history.replaceState(null, '', cleaned)
              }
            } catch {
              /* noop */
            }
          }
          return
        }

        if (eventStr === 'SIGNED_IN' || eventStr === 'INITIAL_SESSION' || eventStr === 'TOKEN_REFRESHED') {
          passwordRecoveryMode.value = false
        }

        await hydrateSession(newSession)
      })

      authUnsubscribe = authListener.subscription.unsubscribe
      authReady.value = true
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Ошибка инициализации сессии'
      console.error('Session init error:', e)
      authReady.value = true
    } finally {
      globalLoading.value = false
    }
  })()

  await readyPromise.value
}

// Очистка подписки при закрытии приложения
export function cleanupAuth() {
  if (authUnsubscribe) {
    authUnsubscribe()
    authUnsubscribe = null
    authInitialized = false
  }
}

// Внутренняя функция загрузки профиля
async function loadProfileInternal(userId: string) {
  // Если уже идёт загрузка — дожидаемся её, но НЕ прерываем текущий запрос,
  // иначе при конкурентных вызовах (recovery -> login) профиль нужного
  // пользователя может не установиться и останется профиль предыдущего.
  if (profileLoadPromise) {
    await profileLoadPromise
  }

  profileLoadPromise = (async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError
      globalProfile.value = data as Profile

      if (data?.role) {
        localStorage.setItem('user_role', data.role)
      }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Ошибка загрузки профиля'
      console.error('Error loading profile:', e)
    } finally {
      profileLoadPromise = null
    }
  })()

  await profileLoadPromise
}

export function useAuth() {
  const user = computed(() => globalUser.value)
  const profile = computed(() => globalProfile.value)
  const session = computed(() => globalSession.value)
  const loading = computed(() => globalLoading.value)
  const error = computed(() => globalError.value)

  const isAuthenticated = computed(() => !!globalUser.value)
  const isAdmin = computed(() => globalProfile.value?.role === 'admin')
  const isModerator = computed(() =>
    globalProfile.value?.role === 'moderator' || globalProfile.value?.role === 'admin'
  )

  async function loadProfile(userId: string) {
    await loadProfileInternal(userId)
  }

  async function login(email: string, password: string) {
    try {
      globalLoading.value = true
      globalError.value = null

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (loginError) throw loginError

      await hydrateSession(data.session)
      return { success: true }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Ошибка входа'
      console.error('Login error:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  async function register(email: string, password: string, displayName?: string) {
    try {
      globalLoading.value = true
      globalError.value = null

      const { data, error: registerError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      })

      if (registerError) throw registerError

      await hydrateSession(data.session)
      return { success: true }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Ошибка регистрации'
      console.error('Register error:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  async function logout() {
    try {
      globalLoading.value = true
      globalError.value = null

      const { error: logoutError } = await supabase.auth.signOut()
      if (logoutError) {
        console.warn('[Auth] signOut вернул ошибку, но локальное состояние очищается:', logoutError)
      }
    } catch (e) {
      console.warn('[Auth] Ошибка signOut, очищаем локально:', e)
    } finally {
      // Всегда очищаем локальное состояние, иначе может остаться «осиротевшая»
      // (например, захваченная recovery) сессия и админ не вернёт панель.
      globalUser.value = null
      globalSession.value = null
      globalProfile.value = null
      localStorage.removeItem('user_role')
      localStorage.removeItem(AUTH_CACHE_KEY)
      passwordRecoveryMode.value = false
      globalLoading.value = false
    }
  }

  async function resetPassword(email: string) {
    try {
      globalLoading.value = true
      globalError.value = null

      let basePath = '/'
      const pathname = window.location.pathname
      if (pathname === '/p5editor' || pathname.startsWith('/p5editor/')) {
        basePath = '/p5editor/'
      }

      const redirectTo = `${window.location.origin}${basePath}`
      console.log('[Auth] Password reset redirectTo:', redirectTo)

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      })

      if (resetError) throw resetError

      return { success: true }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Ошибка сброса пароля'
      console.error('Reset password error:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  async function updatePassword(newPassword: string) {
    try {
      globalLoading.value = true
      globalError.value = null

      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      passwordRecoveryMode.value = false

      if (data.user) {
        globalUser.value = data.user
        // НЕ вызываем supabase.auth.getSession() после updateUser: в recovery-
        // сессии этот запрос может надолго зависнуть на локе lock:p5editor-auth,
        // из-за чего кнопка остаётся в состоянии «Смена...». gotrue сам обновляет
        // и сохраняет сессию после updateUser, поэтому просто актуализируем
        // наш локальный кэш текущей сессией.
        if (globalSession.value) saveAuthCache(globalSession.value)
      }

      return { success: true }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Ошибка обновления пароля'
      console.error('Update password error:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  async function updateProfile(updates: { display_name?: string | null; bio?: string | null; avatar_url?: string | null }) {
    try {
      globalLoading.value = true
      globalError.value = null

      if (!globalUser.value) {
        throw new Error('Пользователь не авторизован')
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', globalUser.value.id)
        .select()
        .single()

      if (updateError) throw updateError

      globalProfile.value = data as Profile
      return { success: true, data }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Ошибка обновления профиля'
      console.error('Update profile error:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  async function uploadAvatar(file: File) {
    try {
      globalLoading.value = true
      globalError.value = null

      if (!globalUser.value) {
        throw new Error('Пользователь не авторизован')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${globalUser.value.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath)

      const { success, error: updateError } = await updateProfile({
        avatar_url: urlData.publicUrl
      })

      if (!success) throw new Error(updateError)

      return { success: true, url: urlData.publicUrl }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Ошибка загрузки аватара'
      console.error('Upload avatar error:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  return {
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isModerator,
    isReady: computed(() => authReady.value),
    readyPromise: computed(() => readyPromise.value),
    passwordRecoveryMode: computed(() => passwordRecoveryMode.value),
    login,
    register,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
    uploadAvatar,
    loadProfile
  }
}
