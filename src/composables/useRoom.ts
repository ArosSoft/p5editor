import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { ClassRoom, RoomSketch, SketchWithProfile } from '../types/supabase'

// Надёжное извлечение текста ошибки (PostgrestError может не быть instanceof Error)
function errMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object') {
    const msg = (e as { message?: unknown }).message
    if (typeof msg === 'string' && msg.length) return msg
    try {
      const s = JSON.stringify(e)
      if (s && s !== '{}') return s
    } catch {
      /* ignore */
    }
  }
  if (typeof e === 'string' && e.length) return e
  return fallback
}

export interface RoomSketchWithDetails extends RoomSketch {
  sketch?: SketchWithProfile & {
    profiles?: { id: string; display_name: string | null; avatar_url: string | null } | null
  }
}

const room = ref<ClassRoom | null>(null)
const roomSketches = ref<RoomSketchWithDetails[]>([])
const selectedSketch = ref<(SketchWithProfile & { profiles?: any }) | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function fetchRoom(roomId: string) {
  try {
    loading.value = true
    error.value = null
    const { data, error: fetchError } = await supabase
      .from('class_rooms')
      .select('*')
      .eq('id', roomId)
      .single()
    if (fetchError) throw fetchError
    room.value = data as ClassRoom
    return { success: true, data }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки комнаты'
    console.error('[useRoom] fetchRoom:', e)
    return { success: false, error: error.value }
  } finally {
    loading.value = false
  }
}

async function fetchRoomSketches(roomId: string) {
  try {
    loading.value = true
    error.value = null
    const { data, error: fetchError } = await supabase
      .from('room_sketches')
      .select(
        '*, sketch:sketches ( id, title, description, code, thumbnail_url, numeric_sketch_id, profiles:user_id ( id, display_name, avatar_url ) )'
      )
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
    if (fetchError) throw fetchError

    const list = (data || []).map((r: any) => ({
      ...r,
      sketch: r.sketch
    })) as RoomSketchWithDetails[]

    roomSketches.value = list
    const first = list[0]
    if (list.length > 0 && !selectedSketch.value && first) {
      selectSketch(first.sketch_id)
    }
    return { success: true, data: list }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки скетчей комнаты'
    console.error('[useRoom] fetchRoomSketches:', e)
    return { success: false, error: error.value }
  } finally {
    loading.value = false
  }
}

function selectSketch(sketchId: string) {
  const item = roomSketches.value.find((r) => r.sketch_id === sketchId)
  selectedSketch.value = (item?.sketch as any) || null
}

async function updateRoom(roomId: string, title: string, description: string) {
  try {
    loading.value = true
    error.value = null
    const { data, error: rpcError } = await supabase.rpc('update_room', {
      p_room_id: roomId,
      p_title: title,
      p_description: description
    })
    if (rpcError) throw rpcError
    room.value = data as ClassRoom
    return { success: true, data }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка сохранения комнаты'
    console.error('[useRoom] updateRoom:', e)
    return { success: false, error: error.value }
  } finally {
    loading.value = false
  }
}

async function removeSketchFromRoom(roomSketchId: string, roomId: string) {
  try {
    loading.value = true
    error.value = null
    const { error: rpcError } = await supabase
      .rpc('remove_sketch_from_room', { p_room_sketch_id: roomSketchId })
    if (rpcError) throw rpcError

    roomSketches.value = roomSketches.value.filter((r) => r.id !== roomSketchId)
    if (selectedSketch.value && !roomSketches.value.some((r) => r.sketch_id === selectedSketch.value?.id)) {
      const next = roomSketches.value[0]
      selectedSketch.value = (next?.sketch as any) || null
    }
    return { success: true }
  } catch (e) {
    error.value = errMessage(e, 'Ошибка удаления скетча из комнаты')
    console.error('[useRoom] removeSketchFromRoom:', e)
    return { success: false, error: error.value }
  } finally {
    loading.value = false
  }
}

async function changeRating(roomSketchId: string, delta: number) {
  try {
    error.value = null
    const { data, error: rpcError } = await supabase.rpc('update_room_sketch_rating', {
      p_room_sketch_id: roomSketchId,
      p_delta: delta
    })
    if (rpcError) throw rpcError

    const updated = data as RoomSketch
    const idx = roomSketches.value.findIndex((r) => r.id === roomSketchId)
    const item = roomSketches.value[idx]
    if (idx !== -1 && item) {
      roomSketches.value[idx] = { ...item, rating: updated.rating }
    }
    return { success: true, data: updated }
  } catch (e) {
    error.value = errMessage(e, 'Ошибка изменения оценки')
    console.error('[useRoom] changeRating:', e)
    return { success: false, error: error.value }
  }
}

export function useRoom(_roomId: string) {
  return {
    room,
    roomSketches,
    selectedSketch,
    loading,
    error,
    fetchRoom,
    fetchRoomSketches,
    selectSketch,
    updateRoom,
    removeSketchFromRoom,
    changeRating
  }
}
