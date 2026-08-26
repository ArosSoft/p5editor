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

// Создаем кастомный fetch с адаптивным таймаутом для нестабильных соединений.
// ВАЖНО: таймаут ставится ВСЕГДА, даже если Supabase передаёт свой AbortSignal
// (при updateUser/PKCE-обмене). Иначе зависший запрос (напр. из-за гонки за
// lock:p5editor-auth) никогда не резолвится и UI «зависает» на disabled-кнопке.
const customFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const timeoutMs = isSlowConnection ? 180000 : 60000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  const signals: AbortSignal[] = [controller.signal]
  if (init?.signal) signals.push(init.signal)

  let combined: AbortSignal
  if (typeof AbortSignal !== 'undefined' && 'any' in AbortSignal && typeof (AbortSignal as any).any === 'function') {
    combined = (AbortSignal as any).any(signals)
  } else {
    // Fallback: наш таймер всё равно сработает; подпишемся на внешний сигнал
    if (init?.signal) {
      init.signal.addEventListener('abort', () => controller.abort(), { once: true })
    }
    combined = controller.signal
  }

  const fetchInit: RequestInit = {
    ...init,
    signal: combined
  }

  return fetch(input, fetchInit).finally(() => clearTimeout(timer))
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
