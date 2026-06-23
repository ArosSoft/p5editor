import { createClient } from '@supabase/supabase-js'

// Переменные окружения с значениями по умолчанию для GitHub Pages
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gfupycrmnegbcafuoxdx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Yrru1vT4XDUZPY3_sm1XQ_j0YIdHLy'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const isSlowConnection = (() => {
  if (typeof navigator === 'undefined') return false

  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  const effectiveType = connection?.effectiveType

  return effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g'
})()

// Создаем кастомный fetch с адаптивным таймаутом для нестабильных соединений
const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController()
  const timeoutMs = isSlowConnection ? 180000 : 60000
  let timeout: ReturnType<typeof setTimeout> | null = null

  if (init?.signal) {
    const fetchInit: RequestInit = {
      ...init,
      signal: init.signal
    }

    return fetch(input, fetchInit)
  }

  timeout = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'p5editor-auth',
    storage: localStorage
  },
  // @ts-ignore - кастомный fetch для таймаутов
  fetch: customFetch
})
