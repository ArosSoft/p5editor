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
  
  // Если передан внешний signal, используем его для отмены
  // Иначе создаём свой таймаут на 60 секунд
  let timeout: ReturnType<typeof setTimeout> | null = null
  
  if (init?.signal) {
    // Если есть внешний signal, просто передаём его
    // и не создаём свой таймаут
    const fetchInit: RequestInit = {
      ...init,
      signal: init.signal
    }

    return fetch(input, fetchInit)
  }
  
  // Если нет внешнего signal, используем свой таймаут
  timeout = setTimeout(() => {
    controller.abort()
  }, 60000) // 60 секунд таймаут на любой запрос

  const fetchInit: RequestInit = {
    ...init,
    signal: controller.signal
  }

  return fetch(input, fetchInit).finally(() => {
    if (timeout) {
      clearTimeout(timeout)
    }
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
