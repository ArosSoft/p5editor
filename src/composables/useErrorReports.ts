import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { ErrorReport, ErrorReportInsert, ErrorReportUpdate } from '../types/supabase'
import { useAuth } from './useAuth'

// Состояние для списка сообщений (используется окном просмотра у админов/модераторов)
const globalReports = ref<ErrorReport[]>([])
const globalLoading = ref(false)
const globalError = ref<string | null>(null)

export function useErrorReports() {
  const { user, profile, isModerator, isAdmin } = useAuth()

  async function submitReport(message: string) {
    try {
      globalLoading.value = true
      globalError.value = null

      const payload: ErrorReportInsert = {
        user_id: user.value?.id ?? null,
        reporter_email: profile.value?.email ?? user.value?.email ?? null,
        message
      }

      const { data, error: insertError } = await supabase
        .from('error_reports')
        .insert(payload)
        .select()
        .single()

      if (insertError) throw insertError

      return { success: true, data: data as ErrorReport }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Не удалось отправить сообщение'
      console.error('[ErrorReports] submitReport:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  async function fetchReports() {
    try {
      globalLoading.value = true
      globalError.value = null

      const { data, error: fetchError } = await supabase
        .from('error_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      globalReports.value = (data as ErrorReport[]) ?? []
      return { success: true, data: globalReports.value }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Не удалось загрузить сообщения'
      console.error('[ErrorReports] fetchReports:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  // Сообщения только текущего пользователя (для окна отправки)
  async function fetchMyReports() {
    try {
      globalLoading.value = true
      globalError.value = null

      if (!user.value) {
        return { success: true, data: [] as ErrorReport[] }
      }

      const { data, error: fetchError } = await supabase
        .from('error_reports')
        .select('*')
        .eq('user_id', user.value.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return { success: true, data: (data as ErrorReport[]) ?? [] }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Не удалось загрузить сообщения'
      console.error('[ErrorReports] fetchMyReports:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  async function updateReport(id: string, updates: ErrorReportUpdate) {
    try {
      globalLoading.value = true
      globalError.value = null

      const { data, error: updateError } = await supabase
        .from('error_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      const idx = globalReports.value.findIndex((r) => r.id === id)
      if (idx !== -1) {
        globalReports.value[idx] = data as ErrorReport
      }

      return { success: true, data: data as ErrorReport }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Не удалось обновить сообщение'
      console.error('[ErrorReports] updateReport:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  async function replyToReport(id: string, reply: string) {
    try {
      globalLoading.value = true
      globalError.value = null

      const { data, error: updateError } = await supabase
        .from('error_reports')
        .update({
          reply: reply.trim() || null,
          replied_at: reply.trim() ? new Date().toISOString() : null
        } as ErrorReportUpdate)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      const idx = globalReports.value.findIndex((r) => r.id === id)
      if (idx !== -1) {
        globalReports.value[idx] = data as ErrorReport
      }

      return { success: true, data: data as ErrorReport }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Не удалось отправить ответ'
      console.error('[ErrorReports] replyToReport:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  async function deleteReport(id: string) {
    try {
      globalLoading.value = true
      globalError.value = null

      const { error: deleteError } = await supabase
        .from('error_reports')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      globalReports.value = globalReports.value.filter((r) => r.id !== id)
      return { success: true }
    } catch (e) {
      globalError.value = e instanceof Error ? e.message : 'Не удалось удалить сообщение'
      console.error('[ErrorReports] deleteReport:', e)
      return { success: false, error: globalError.value }
    } finally {
      globalLoading.value = false
    }
  }

  return {
    user,
    profile,
    isModerator,
    isAdmin,
    reports: globalReports,
    loading: globalLoading,
    error: globalError,
    submitReport,
    fetchReports,
    fetchMyReports,
    updateReport,
    replyToReport,
    deleteReport
  }
}
