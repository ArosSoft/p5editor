import { ref, computed, onMounted } from 'vue'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types/supabase'

export function useAuth() {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const session = ref<Session | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isModerator = computed(() =>
    profile.value?.role === 'moderator' || profile.value?.role === 'admin'
  )

  // Загрузка профиля пользователя
  async function loadProfile(userId: string) {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError
      profile.value = data as Profile
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки профиля'
      console.error('Error loading profile:', e)
    } finally {
      loading.value = false
    }
  }

  // Вход (email + пароль)
  async function login(email: string, password: string) {
    try {
      loading.value = true
      error.value = null

      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (loginError) throw loginError

      user.value = data.user
      session.value = data.session

      if (data.user) {
        await loadProfile(data.user.id)
      }

      return { success: true }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка входа'
      console.error('Login error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Регистрация (email + пароль + display name)
  async function register(email: string, password: string, displayName?: string) {
    try {
      loading.value = true
      error.value = null

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

      user.value = data.user
      session.value = data.session

      // Профиль создаётся автоматически через триггер в БД
      if (data.user) {
        await loadProfile(data.user.id)
      }

      return { success: true }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка регистрации'
      console.error('Register error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Выход
  async function logout() {
    try {
      loading.value = true
      error.value = null

      const { error: logoutError } = await supabase.auth.signOut()
      if (logoutError) throw logoutError

      user.value = null
      session.value = null
      profile.value = null
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка выхода'
      console.error('Logout error:', e)
    } finally {
      loading.value = false
    }
  }

  // Сброс пароля
  async function resetPassword(email: string) {
    try {
      loading.value = true
      error.value = null

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/#access_token=YOUR_ACCESS_TOKEN`
      })

      if (resetError) throw resetError

      return { success: true }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка сброса пароля'
      console.error('Reset password error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Обновление профиля
  async function updateProfile(updates: { display_name?: string | null; bio?: string | null; avatar_url?: string | null }) {
    try {
      loading.value = true
      error.value = null

      if (!user.value) {
        throw new Error('Пользователь не авторизован')
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.value.id)
        .select()
        .single()

      if (updateError) throw updateError

      profile.value = data as Profile
      return { success: true, data }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка обновления профиля'
      console.error('Update profile error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Загрузка аватара
  async function uploadAvatar(file: File) {
    try {
      loading.value = true
      error.value = null

      if (!user.value) {
        throw new Error('Пользователь не авторизован')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.value.id}-${Date.now()}.${fileExt}`
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
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки аватара'
      console.error('Upload avatar error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Инициализация сессии при загрузке приложения
  onMounted(async () => {
    try {
      loading.value = true

      const { data: { session: currentSession } } = await supabase.auth.getSession()
      session.value = currentSession
      user.value = currentSession?.user ?? null

      if (currentSession?.user) {
        await loadProfile(currentSession.user.id)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка инициализации сессии'
      console.error('Session init error:', e)
    } finally {
      loading.value = false
    }

    // Подписка на изменения авторизации
    supabase.auth.onAuthStateChange(async (event, newSession) => {
      session.value = newSession
      user.value = newSession?.user ?? null

      if (newSession?.user) {
        await loadProfile(newSession.user.id)
      } else {
        profile.value = null
      }
    })
  })

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
    uploadAvatar
  }
}
