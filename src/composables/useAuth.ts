import { ref, computed } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/supabase'

// Глобальное состояние для хранения данных авторизации
const globalUser = ref<User | null>(null)
const globalProfile = ref<Profile | null>(null)
const globalSession = ref<Session | null>(null)
const globalLoading = ref(false)
const globalError = ref<string | null>(null)
let authInitialized = false
let authUnsubscribe: (() => void) | null = null

// Инициализация авторизации (вызывается один раз при старте приложения)
export async function initAuth() {
  if (authInitialized) {
    return
  }

  authInitialized = true
  globalLoading.value = true

  try {
    // Загрузка текущей сессии
    const { data: { session } } = await supabase.auth.getSession()
    globalSession.value = session
    globalUser.value = session?.user ?? null

    if (session?.user) {
      await loadProfileInternal(session.user.id)
    }

    // Подписка на изменения авторизации
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      globalSession.value = newSession
      globalUser.value = newSession?.user ?? null

      if (newSession?.user) {
        await loadProfileInternal(newSession.user.id)
      } else {
        globalProfile.value = null
        localStorage.removeItem('user_role')
      }
    })

    authUnsubscribe = authListener.subscription.unsubscribe
  } catch (e) {
    globalError.value = e instanceof Error ? e.message : 'Ошибка инициализации сессии'
    console.error('Session init error:', e)
  } finally {
    globalLoading.value = false
  }
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
  try {
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError) throw fetchError
    globalProfile.value = data as Profile

    // Сохраняем роль в localStorage для защиты маршрутов
    if (data?.role) {
      localStorage.setItem('user_role', data.role)
    }
  } catch (e) {
    globalError.value = e instanceof Error ? e.message : 'Ошибка загрузки профиля'
    console.error('Error loading profile:', e)
  }
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

  // Загрузка профиля пользователя
  async function loadProfile(userId: string) {
    await loadProfileInternal(userId)
  }

  // Вход (email + пароль)
  async function login(email: string, password: string) {
    try {
      globalLoading.value = true
      globalError.value = null

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (loginError) throw loginError

      globalUser.value = data.user
      globalSession.value = data.session

      if (data.user) {
        await loadProfileInternal(data.user.id)
      }

      return { success: true }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Ошибка входа'
      console.error('Login error:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  // Регистрация (email + пароль + display name)
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

      globalUser.value = data.user
      globalSession.value = data.session

      // Профиль создаётся автоматически через триггер в БД
      if (data.user) {
        await loadProfileInternal(data.user.id)
      }

      return { success: true }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Ошибка регистрации'
      console.error('Register error:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  // Выход
  async function logout() {
    try {
      globalLoading.value = true
      globalError.value = null

      const { error: logoutError } = await supabase.auth.signOut()
      if (logoutError) throw logoutError

      globalUser.value = null
      globalSession.value = null
      globalProfile.value = null

      // Очищаем роль из localStorage
      localStorage.removeItem('user_role')
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Ошибка выхода'
      console.error('Logout error:', e)
    } finally {
      globalLoading.value = false
    }
  }

  // Сброс пароля
  async function resetPassword(email: string) {
    try {
      globalLoading.value = true
      globalError.value = null

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`
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

  // Обновление профиля
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

  // Загрузка аватара
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

      // Загрузка файла в Storage
      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Получение публичной ссылки
      const { data: urlData } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath)

      // Обновление профиля
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
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    uploadAvatar,
    loadProfile
  }
}
