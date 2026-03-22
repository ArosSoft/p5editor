import { createClient } from '@supabase/supabase-js'

// Переменные окружения с значениями по умолчанию для GitHub Pages
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gfupycrmnegbcafuoxdx.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Yrru1vT4XDUZPY3_sm1XQ_j0YIdHLy'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Используем упрощённый клиент без строгих типов
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
