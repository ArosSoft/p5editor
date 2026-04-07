import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { Sketch, SketchDifficulty, SketchStatus, SketchWithProfile } from '../types/supabase'

// Настраиваемые таймауты (в миллисекундах)
const DEFAULT_TIMEOUT = 8000
const LONG_TIMEOUT = 15000

// Вспомогательная функция для выполнения запроса с таймаутом + настоящей отменой
async function withTimeout<T>(
  queryBuilder: any,
  timeoutMs: number = DEFAULT_TIMEOUT,
  timeoutMessage: string = 'Таймаут запроса'
): Promise<{ data: T | null; error: any; count?: number | null }> {
  const controller = new AbortController()

  // Автоматически отменяем запрос по таймауту
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    const queryWithSignal = queryBuilder.abortSignal(controller.signal)

    const result = await queryWithSignal

    clearTimeout(timeoutId)
    return result
  } catch (err: any) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError' || controller.signal.aborted) {
      throw new Error(timeoutMessage)
    }

    throw err
  }
}

export function useSketches() {
  const sketches = ref<SketchWithProfile[]>([])
  const sketch = ref<Sketch | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  // AbortController для отмены предыдущих запросов
  let currentAbortController: AbortController | null = null
  let pendingSketchesAbortController: AbortController | null = null
  let userSketchesAbortController: AbortController | null = null

  // Получение скетча по ID
  async function getSketchById(id: string) {
    try {
      loading.value = true
      error.value = null

      const query = supabase
        .from('sketches')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          ),
          sketch_moderation_logs (
            id,
            action,
            comment,
            created_at,
            profiles:moderator_id (
              display_name
            )
          )
        `, { count: 'exact' })
        .eq('id', id)
        .single()

      const { data, error: fetchError } = await withTimeout(query, DEFAULT_TIMEOUT, 'Ошибка загрузки скетча (таймаут)')

      if (fetchError) throw fetchError

      // Обрабатываем данные: берём последний лог модерации для каждого скетча
      const sketchData = data as any
      const logs = sketchData.sketch_moderation_logs || []
      const lastLog = logs.length > 0
        ? logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        : null

      const sketchWithLog = {
        ...sketchData,
        moderation_log: lastLog ? {
          action: lastLog.action,
          comment: lastLog.comment,
          moderator_name: lastLog.profiles?.display_name || 'Модератор',
          created_at: lastLog.created_at
        } : null
      }

      sketch.value = sketchWithLog as SketchWithProfile
      return { success: true, data: sketchWithLog }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки скетча'
      console.error('Get sketch error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Получение всех скетчей для галереи (только approved)
  async function getGallerySketches({
    page = 1,
    limit = 12,
    category,
    difficulty,
    search,
    tags,
    sortBy = 'created_at',
    sortOrder = 'desc'
  }: {
    page?: number
    limit?: number
    category?: string
    difficulty?: SketchDifficulty
    search?: string
    tags?: string[]
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    try {
      // Отменяем предыдущий запрос, если он ещё выполняется
      if (currentAbortController) {
        currentAbortController.abort()
      }
      currentAbortController = new AbortController()

      loading.value = true
      error.value = null

      let query = supabase
        .from('sketches')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('status', 'approved')

      // Фильтр по категории
      if (category) {
        query = query.eq('category', category)
      }

      // Фильтр по сложности
      if (difficulty) {
        query = query.eq('difficulty', difficulty)
      }

      // Фильтр по тэгам (если выбраны тэги, ищем скетчи, содержащие хотя бы один из них)
      if (tags && tags.length > 0) {
        // Используем contains для поиска по JSON-массиву tags
        // Для нескольких тэгов - используем or с contains для каждого
        const tagFilters = tags.map(tag => `tags.cs.{${JSON.stringify(tag)}}`).join(',')
        query = query.or(tagFilters)
      }

      // Поиск по названию, описанию
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Маппинг имени сортировки на реальные колонки
      const sortColumnMap: Record<string, string> = {
        'new': 'created_at',
        'title': 'title',
        'views': 'views',
        'created_at': 'created_at'
      }

      // Для сортировки "popular" используем комбинированный рейтинг
      const isPopularSort = sortBy === 'popular'
      const sortColumn = isPopularSort ? 'created_at' : (sortColumnMap[sortBy] || 'created_at')

      // Сортировка
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

      // Пагинация
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Добавляем abortSignal к финальному query
      const finalQuery = query.abortSignal(currentAbortController.signal)

      const { data, error: fetchError, count } = await withTimeout(
        finalQuery,
        DEFAULT_TIMEOUT,
        'Таймаут загрузки галереи'
      )

      if (fetchError) throw fetchError

      let resultData = (data as SketchWithProfile[]) || []

      // Для сортировки "popular" используем комбинированный рейтинг на клиенте
      // Формула: рейтинг = (просмотры * 0.7) + (лайки * 10 * 0.3)
      // Приоритет отдаётся просмотрам (70%), лайки влияют на 30%
      if (isPopularSort) {
        resultData = resultData.sort((a, b) => {
          const scoreA = (a.views || 0) * 0.7 + (a.likes || 0) * 10 * 0.3
          const scoreB = (b.views || 0) * 0.7 + (b.likes || 0) * 10 * 0.3
          return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA
        })
      }

      sketches.value = resultData
      total.value = count || 0

      return { success: true, data: sketches.value as SketchWithProfile[], total: total.value }
    } catch (e: any) {
      // Игнорируем AbortError от нашего собственного таймаута — он уже обработан в withTimeout
      if (e.message?.includes('Таймаут')) {
        error.value = e.message
      } else {
        error.value = e instanceof Error ? e.message : 'Ошибка загрузки галереи'
      }
      console.error('Get gallery sketches error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
      // Не сбрасываем currentAbortController сразу — он уже aborted
      currentAbortController = null
    }
  }

  // Получение скетчей пользователя
  async function getUserSketches(userId: string, status?: SketchStatus) {
    try {
      // Отменяем предыдущий запрос, если он ещё выполняется
      if (userSketchesAbortController) {
        userSketchesAbortController.abort()
      }
      userSketchesAbortController = new AbortController()

      loading.value = true
      error.value = null

      let query = supabase
        .from('sketches')
        .select(`
          *,
          sketch_moderation_logs (
            id,
            action,
            comment,
            created_at,
            profiles:moderator_id (
              display_name
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error: fetchError } = await withTimeout(query, DEFAULT_TIMEOUT, 'Таймаут загрузки скетчей пользователя')

      if (fetchError) throw fetchError

      // Обрабатываем данные: берём последний лог модерации для каждого скетча
      sketches.value = ((data as any[]) || []).map(sketch => {
        const logs = sketch.sketch_moderation_logs || []
        const lastLog = logs.length > 0
          ? logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null

        return {
          ...sketch,
          moderation_log: lastLog ? {
            action: lastLog.action,
            comment: lastLog.comment,
            moderator_name: lastLog.profiles?.display_name || 'Модератор',
            created_at: lastLog.created_at
          } : null
        }
      }) as SketchWithProfile[]

      return { success: true, data: sketches.value }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки скетчей пользователя'
      console.error('Get user sketches error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
      userSketchesAbortController = null
    }
  }

  // Создание нового скетча
  async function createSketch(sketchData: {
    user_id: string
    title: string
    description: string
    code: string
    thumbnail_url?: string | null
    tags?: string[]
    category?: string | null
    difficulty?: SketchDifficulty | null
    status?: SketchStatus
  }) {
    try {
      loading.value = true
      error.value = null

      console.log('[createSketch] Начинаем создание скетча:', sketchData.title)
      console.log('[createSketch] User ID:', sketchData.user_id)
      console.log('[createSketch] Статус:', sketchData.status)

      const query = supabase
        .from('sketches')
        .insert(sketchData)
        .select()
        .single()

      const { data, error: createError } = await withTimeout<{ id: string } & Sketch>(query, LONG_TIMEOUT, 'Таймаут создания скетча')

      if (createError) {
        console.error('[createSketch] Ошибка создания скетча:', createError)
        console.error('[createSketch] Код ошибки:', createError.code)
        console.error('[createSketch] Сообщение:', createError.message)
        throw createError
      }

      console.log('[createSketch] Скетч успешно создан с ID:', data?.id)
      console.log('[createSketch] Данные созданного скетча:', data)

      return { success: true, data }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка создания скетча'
      console.error('Create sketch error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Обновление скетча
  async function updateSketch(id: string, updates: {
    title?: string
    description?: string
    code?: string
    thumbnail_url?: string | null
    tags?: string[]
    category?: string | null
    difficulty?: SketchDifficulty | null
    status?: SketchStatus
    views?: number
    likes?: number
  }) {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('sketches')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      if (sketch.value?.id === id) {
        sketch.value = data as Sketch
      }

      return { success: true, data }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка обновления скетча'
      console.error('Update sketch error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Удаление скетча
  async function deleteSketch(id: string) {
    try {
      loading.value = true
      error.value = null

      const { error: deleteError } = await supabase
        .from('sketches')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      sketches.value = sketches.value.filter(s => s.id !== id)

      return { success: true }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка удаления скетча'
      console.error('Delete sketch error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Увеличение счётчика просмотров
  async function incrementViews(id: string) {
    try {
      // Альтернативный метод через update
      if (sketch.value?.id === id) {
        const { data, error: updateError } = await supabase
          .from('sketches')
          .update({ views: sketch.value.views + 1 })
          .eq('id', id)
          .select()
          .single()

        if (updateError) throw updateError
        sketch.value = data as Sketch
      }
      return { success: true }
    } catch (e) {
      console.error('Increment views error:', e)
      return { success: false, error: e instanceof Error ? e.message : 'Ошибка увеличения просмотров' }
    }
  }

  // Лайк скетча
  async function toggleLike(sketchId: string, userId: string) {
    try {
      loading.value = true
      error.value = null

      // Проверка, есть ли уже лайк
      const { data: existingLike, error: fetchError } = await supabase
        .from('sketch_likes')
        .select('id')
        .eq('sketch_id', sketchId)
        .eq('user_id', userId)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (existingLike) {
        // Удалить лайк
        const { error: deleteError } = await supabase
          .from('sketch_likes')
          .delete()
          .eq('id', existingLike.id)

        if (deleteError) throw deleteError

        if (sketch.value?.id === sketchId) {
          sketch.value = { ...sketch.value, likes: Math.max(0, sketch.value.likes - 1) }
        }

        return { success: true, liked: false }
      } else {
        // Добавить лайк
        const { error: insertError } = await supabase
          .from('sketch_likes')
          .insert({ sketch_id: sketchId, user_id: userId })

        if (insertError) throw insertError

        if (sketch.value?.id === sketchId) {
          sketch.value = { ...sketch.value, likes: sketch.value.likes + 1 }
        }

        return { success: true, liked: true }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка лайка'
      console.error('Toggle like error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Проверка, лайкнул ли пользователь скетч
  async function checkLike(sketchId: string, userId: string) {
    try {
      const { data } = await supabase
        .from('sketch_likes')
        .select('id')
        .eq('sketch_id', sketchId)
        .eq('user_id', userId)
        .maybeSingle()

      return { success: true, liked: !!data }
    } catch (e) {
      return { success: false, liked: false }
    }
  }

  // Получение всех категорий
  async function getCategories() {
    try {
      const { data, error: fetchError } = await supabase
        .from('sketches')
        .select('category')
        .eq('status', 'approved')
        .not('category', 'is', null)

      if (fetchError) throw fetchError

      const categories = [...new Set(((data as Sketch[]) || []).map(s => s.category).filter(Boolean))] as string[]
      return { success: true, categories }
    } catch (e) {
      console.error('Get categories error:', e)
      return { success: false, categories: [] }
    }
  }

  // Получение скетчей на модерацию (для админов и модераторов)
  async function getPendingSketches() {
    try {
      // Отменяем предыдущий запрос, если он ещё выполняется
      if (pendingSketchesAbortController) {
        pendingSketchesAbortController.abort()
      }
      pendingSketchesAbortController = new AbortController()

      loading.value = true
      error.value = null

      const query = supabase
        .from('sketches')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      const { data, error: fetchError } = await withTimeout(query, DEFAULT_TIMEOUT, 'Таймаут загрузки скетчей на модерацию')

      if (fetchError) throw fetchError

      sketches.value = (data as Sketch[]) || []
      return { success: true, data: sketches.value }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки скетчей на модерацию'
      console.error('Get pending sketches error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
      pendingSketchesAbortController = null
    }
  }

  // Одобрение скетча
  async function approveSketch(sketchId: string, moderatorId: string, comment?: string) {
    try {
      loading.value = true
      error.value = null

      console.log('[approveSketch] Начало одобрения скетча:', sketchId)

      // Обновляем статус скетча с таймаутом
      const query = supabase
        .from('sketches')
        .update({ status: 'approved' })
        .eq('id', sketchId)
        .select()
        .single()

      const { data: sketchData, error: updateError } = await withTimeout(query, LONG_TIMEOUT, 'Таймаут одобрения скетча')

      if (updateError) {
        console.error('[approveSketch] Ошибка обновления скетча:', updateError)
        throw updateError
      }

      console.log('[approveSketch] Скетч одобрен успешно')

      // Логируем действие модерации (не критично, если ошибка)
      if (moderatorId) {
        try {
          const { error: logError } = await supabase
            .from('sketch_moderation_logs')
            .insert({
              sketch_id: sketchId,
              moderator_id: moderatorId,
              action: 'approved',
              comment: comment || null
            })

          if (logError) {
            console.warn('[approveSketch] Не удалось сохранить лог модерации:', logError)
          }
        } catch (logError) {
          console.warn('[approveSketch] Исключение при логировании:', logError)
        }
      }

      return { success: true, data: sketchData }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка одобрения скетча'
      console.error('[approveSketch] Approve sketch error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Отклонение скетча
  async function rejectSketch(sketchId: string, moderatorId: string, reason: string) {
    try {
      loading.value = true
      error.value = null

      console.log('[rejectSketch] Начало отклонения скетча:', sketchId)
      console.log('[rejectSketch] Moderator ID:', moderatorId)
      console.log('[rejectSketch] Причина:', reason)

      // Проверяем, можем ли вообще получить доступ к скетчу
      const checkQuery = supabase
        .from('sketches')
        .select('id, status, user_id')
        .eq('id', sketchId)
        .single()

      const { data: sketchCheck, error: checkError } = await withTimeout(checkQuery, DEFAULT_TIMEOUT, 'Таймаут проверки скетча')

      if (checkError) {
        console.error('[rejectSketch] Ошибка проверки скетча:', checkError)
        // Если ошибка 400/401/403 - проблема с RLS
        if (checkError.code === '400' || checkError.code === '401' || checkError.code === '403') {
          throw new Error('Нет прав доступа к скетчу. Проверьте RLS политики.')
        }
        throw checkError
      }

      console.log('[rejectSketch] Скетч найден:', sketchCheck)

      // Обновляем статус скетча
      const updateQuery = supabase
        .from('sketches')
        .update({ status: 'rejected' })
        .eq('id', sketchId)
        .select()
        .single()

      const { data: sketchData, error: updateError } = await withTimeout(updateQuery, LONG_TIMEOUT, 'Таймаут отклонения скетча')

      if (updateError) {
        console.error('[rejectSketch] Ошибка обновления скетча:', updateError)
        // Детальная информация об ошибке
        if ('details' in updateError) {
          console.error('[rejectSketch] Details:', updateError.details)
        }
        if ('hint' in updateError) {
          console.error('[rejectSketch] Hint:', updateError.hint)
        }
        if ('message' in updateError) {
          console.error('[rejectSketch] Message:', updateError.message)
        }
        throw updateError
      }

      console.log('[rejectSketch] Скетч отклонён успешно')

      // Логируем действие модерации только если таблица существует
      if (moderatorId) {
        try {
          const { error: logError } = await supabase
            .from('sketch_moderation_logs')
            .insert({
              sketch_id: sketchId,
              moderator_id: moderatorId,
              action: 'rejected',
              comment: reason
            })

          if (logError) {
            console.warn('[rejectSketch] Не удалось сохранить лог модерации:', logError)
          } else {
            console.log('[rejectSketch] Лог модерации сохранён')
          }
        } catch (logError) {
          console.warn('[rejectSketch] Исключение при логировании:', logError)
          // Не прерываем выполнение, так как скетч уже отклонён
        }
      }

      return { success: true, data: sketchData }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Ошибка отклонения скетча'
      error.value = errorMessage
      console.error('[rejectSketch] Reject sketch error:', e)
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  // Получение истории модерации скетча
  async function getSketchModerationHistory(sketchId: string) {
    try {
      const { data, error: fetchError } = await supabase
        .from('sketch_moderation_logs')
        .select(`
          *,
          profiles:moderator_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('sketch_id', sketchId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      return { success: true, data: data || [] }
    } catch (e) {
      console.error('Get moderation history error:', e)
      return { success: false, error: e instanceof Error ? e.message : 'Ошибка загрузки истории' }
    }
  }

  return {
    sketches,
    sketch,
    loading,
    error,
    total,
    getSketchById,
    getGallerySketches,
    getUserSketches,
    createSketch,
    updateSketch,
    deleteSketch,
    incrementViews,
    toggleLike,
    checkLike,
    getCategories,
    getPendingSketches,
    approveSketch,
    rejectSketch,
    getSketchModerationHistory
  }
}
