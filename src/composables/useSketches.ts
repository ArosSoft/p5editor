import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { Sketch, SketchDifficulty, SketchStatus, SketchWithProfile } from '../types/supabase'

export function useSketches() {
  const sketches = ref<SketchWithProfile[]>([])
  const sketch = ref<Sketch | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  // Получение скетча по ID
  async function getSketchById(id: string) {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('sketches')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      sketch.value = data as Sketch
      return { success: true, data }
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
    sortBy = 'created_at',
    sortOrder = 'desc'
  }: {
    page?: number
    limit?: number
    category?: string
    difficulty?: SketchDifficulty
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  } = {}) {
    try {
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

      // Поиск по названию, описанию
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Маппинг имени сортировки на реальные колонки
      const sortColumnMap: Record<string, string> = {
        'popular': 'likes',
        'new': 'created_at',
        'title': 'title',
        'views': 'views',
        'created_at': 'created_at'
      }
      const sortColumn = sortColumnMap[sortBy] || 'created_at'

      // Сортировка
      query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

      // Пагинация
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      // Добавляем таймаут для запроса
      const queryPromise = query
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Таймаут запроса (10 секунд)')), 10000)
      })

      const { data, error: fetchError, count } = await Promise.race([queryPromise, timeoutPromise])

      if (fetchError) throw fetchError

      sketches.value = (data as SketchWithProfile[]) || []
      total.value = count || 0

      return { success: true, data: sketches.value as SketchWithProfile[], total: total.value }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки галереи'
      console.error('Get gallery sketches error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Получение скетчей пользователя
  async function getUserSketches(userId: string, status?: SketchStatus) {
    try {
      loading.value = true
      error.value = null

      let query = supabase
        .from('sketches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      sketches.value = (data as Sketch[]) || []
      return { success: true, data: sketches.value }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки скетчей пользователя'
      console.error('Get user sketches error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
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

      const { data, error: createError } = await supabase
        .from('sketches')
        .insert(sketchData)
        .select()
        .single()

      if (createError) throw createError

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
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
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

      if (fetchError) throw fetchError

      sketches.value = (data as Sketch[]) || []
      return { success: true, data: sketches.value }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки скетчей на модерацию'
      console.error('Get pending sketches error:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // Одобрение скетча
  async function approveSketch(sketchId: string, moderatorId: string, comment?: string) {
    try {
      loading.value = true
      error.value = null

      // Обновляем статус скетча
      const { data: sketchData, error: updateError } = await supabase
        .from('sketches')
        .update({ status: 'approved' })
        .eq('id', sketchId)
        .select()
        .single()

      if (updateError) throw updateError

      // Логируем действие модерации
      if (moderatorId) {
        await supabase
          .from('sketch_moderation_logs')
          .insert({
            sketch_id: sketchId,
            moderator_id: moderatorId,
            action: 'approved',
            comment: comment || null
          })
      }

      return { success: true, data: sketchData }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка одобрения скетча'
      console.error('Approve sketch error:', e)
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

      // Обновляем статус скетча
      const { data: sketchData, error: updateError } = await supabase
        .from('sketches')
        .update({ 
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', sketchId)
        .select()
        .single()

      if (updateError) throw updateError

      // Логируем действие модерации
      if (moderatorId) {
        await supabase
          .from('sketch_moderation_logs')
          .insert({
            sketch_id: sketchId,
            moderator_id: moderatorId,
            action: 'rejected',
            comment: reason
          })
      }

      return { success: true, data: sketchData }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка отклонения скетча'
      console.error('Reject sketch error:', e)
      return { success: false, error: error.value }
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
