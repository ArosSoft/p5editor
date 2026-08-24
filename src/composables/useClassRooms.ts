import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { ClassRoomWithCount } from '../types/supabase'

const { user } = useAuth()

// Глобальное состояние (единое на сессию, как в useSketches)
const rooms = ref<ClassRoomWithCount[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const searchQuery = ref('')
// Состояние баннера успешного присоединения
const joinSuccess = ref<{ roomId: string; roomTitle: string } | null>(null)
// Есть ли у текущего пользователя хотя бы одна комната (для условного показа ссылки)
const hasRoom = ref(false)

// Скетчи текущего пользователя, связанные с комнатами
const linkedSketches = ref<
  {
    room_sketch_id: string
    room_id: string
    room_title: string
    sketch_id: string
    sketch_title: string
    numeric_sketch_id: number | null
    rating: number
  }[]
>([])
const linkedLoading = ref(false)

// Получение списка связанных со мной скетчей
async function getMyLinkedSketches() {
  linkedLoading.value = true
  error.value = null
  try {
    if (!user.value) {
      linkedSketches.value = []
      return { success: true, data: [] as never[] }
    }

    const { data, error: rpcError } = await supabase.rpc('get_my_linked_sketches')
    if (rpcError) throw rpcError

    const rows = (Array.isArray(data) ? data : [data]).filter(Boolean) as {
      room_sketch_id: string
      room_id: string
      room_title: string
      sketch_id: string
      sketch_title: string
      numeric_sketch_id: number | null
      rating: number
    }[]
    linkedSketches.value = rows
    return { success: true, data: rows }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки связанных скетчей'
    console.error('[useClassRooms] getMyLinkedSketches:', e)
    return { success: false, error: error.value, data: [] as never[] }
  } finally {
    linkedLoading.value = false
  }
}

// Проверка существования комнаты по ключу (без привязки скетча)
async function getRoomInfo(roomKey: string) {
  try {
    error.value = null
    if (!user.value) throw new Error('Не авторизован')

    const { data, error: rpcError } = await supabase.rpc('get_room_info', {
      p_room_key: roomKey
    })

    if (rpcError) throw rpcError

    const row = (Array.isArray(data) ? data[0] : data) as
      | { room_id: string; title: string }
      | undefined
    return { success: true, data: row || null }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка проверки комнаты'
    console.error('[useClassRooms] getRoomInfo:', e)
    return { success: false, error: error.value, data: null }
  }
}

async function loadHasRoom() {
  try {
    if (!user.value) {
      hasRoom.value = false
      return { success: true, hasRoom: false }
    }
    // limit(1) вместо точного count — проверка существования за O(1) по индексу user_id
    const { data, error: cntError } = await supabase
      .from('class_rooms')
      .select('id')
      .eq('user_id', user.value.id)
      .limit(1)

    if (cntError) throw cntError
    hasRoom.value = Array.isArray(data) && data.length > 0
    return { success: true, hasRoom: hasRoom.value }
  } catch (e) {
    console.error('[useClassRooms] loadHasRoom:', e)
    hasRoom.value = false
    return { success: false, hasRoom: false }
  }
}

async function fetchRooms() {
  try {
    loading.value = true
    error.value = null

    if (!user.value) {
      rooms.value = []
      return { success: true, data: [] }
    }

    const { data, error: fetchError } = await supabase
      .from('class_rooms')
      .select('*')
      .eq('user_id', user.value.id)
      .order('updated_at', { ascending: false })

    if (fetchError) throw fetchError

    const roomsData = (data || []) as ClassRoomWithCount[]

    // Количество скетчей считаем одним лёгким запросом (только room_id), а не
    // вложенным точным count на каждую комнату — это быстрее и не нагружает БД.
    const counts: Record<string, number> = {}
    if (roomsData.length) {
      const { data: rs, error: rsError } = await supabase
        .from('room_sketches')
        .select('room_id')
        .in('room_id', roomsData.map((r) => r.id))
      if (!rsError && rs) {
        for (const row of rs as { room_id: string }[]) {
          counts[row.room_id] = (counts[row.room_id] || 0) + 1
        }
      }
    }

    rooms.value = roomsData.map((r) => ({ ...r, sketch_count: counts[r.id] || 0 }))

    return { success: true, data: rooms.value }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки комнат'
    console.error('[useClassRooms] fetchRooms:', e)
    return { success: false, error: error.value }
  } finally {
    loading.value = false
  }
}

async function createRoom(title: string, description: string) {
  try {
    loading.value = true
    error.value = null

    if (!user.value) throw new Error('Не авторизован')

    // create_room возвращает композитный тип (объект), а не TABLE
    const { data, error: rpcError } = await supabase.rpc('create_room', {
      p_title: title,
      p_description: description
    })

    if (rpcError) throw rpcError

    await fetchRooms()
    return { success: true, data }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка создания комнаты'
    console.error('[useClassRooms] createRoom:', e)
    return { success: false, error: error.value }
  } finally {
    loading.value = false
  }
}

async function deleteRoom(roomId: string) {
  try {
    loading.value = true
    error.value = null

    const { error: delError } = await supabase
      .from('class_rooms')
      .delete()
      .eq('id', roomId)

    if (delError) throw delError

    rooms.value = rooms.value.filter((r) => r.id !== roomId)
    return { success: true }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка удаления комнаты'
    console.error('[useClassRooms] deleteRoom:', e)
    return { success: false, error: error.value }
  } finally {
    loading.value = false
  }
}

// Присоединение скетча к комнате по ключу. Возвращает room_title для баннера.
async function joinRoom(roomKey: string, sketchId: string) {
  try {
    loading.value = true
    error.value = null

    if (!user.value) throw new Error('Не авторизован')

    // join_room_by_key возвращает TABLE(room_id, room_title) — массив строк
    const { data, error: rpcError } = await supabase.rpc('join_room_by_key', {
      p_room_key: roomKey,
      p_sketch_id: sketchId
    })

    if (rpcError) throw rpcError

    const row = (Array.isArray(data) ? data[0] : data) as {
      room_id: string
      room_title: string
    }
    joinSuccess.value = { roomId: row.room_id, roomTitle: row.room_title }
    return { success: true, data: row }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка присоединения к комнате'
    console.error('[useClassRooms] joinRoom:', e)
    return { success: false, error: error.value }
  } finally {
    loading.value = false
  }
}

function clearJoinSuccess() {
  joinSuccess.value = null
}

const filteredRooms = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return rooms.value
  return rooms.value.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.room_key.toLowerCase().includes(q)
  )
})

export function useClassRooms() {
  return {
    rooms,
    filteredRooms,
    loading,
    error,
    searchQuery,
    joinSuccess,
    hasRoom,
    loadHasRoom,
    getRoomInfo,
    getMyLinkedSketches,
    linkedSketches,
    linkedLoading,
    fetchRooms,
    createRoom,
    deleteRoom,
    joinRoom,
    clearJoinSuccess
  }
}
