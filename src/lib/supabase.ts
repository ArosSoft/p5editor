import { createClient } from '@supabase/supabase-js'

// Переменные окружения с значениями по умолчанию для GitHub Pages
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gfupycrmnegbcafuoxdx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Yrru1vT4XDUZPY3_sm1XQ_j0YIdHLy'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Создаем кастомный fetch с таймаутом для работы на медленном соединении
const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, 60000) // 60 секунд таймаут на любой запрос

  const fetchInit: RequestInit = {
    ...init,
    signal: controller.signal
  }

  return fetch(input, fetchInit).finally(() => {
    clearTimeout(timeout)
  })
}

// Используем упрощённый клиент с настройками таймаутов
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  // @ts-ignore - кастомный fetch для таймаутов
  fetch: customFetch
})
