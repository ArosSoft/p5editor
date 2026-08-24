<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { ClassRoomWithCount } from '../../types/supabase'

const props = defineProps<{ rooms: ClassRoomWithCount[] }>()
const emit = defineEmits<{ (e: 'delete', roomId: string): void }>()

const router = useRouter()

function open(roomId: string) {
  router.push(`/class/${roomId}`)
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return value
  }
}

function onDelete(room: ClassRoomWithCount) {
  if (window.confirm(`Удалить комнату «${room.title}»? Это действие необратимо.`)) {
    emit('delete', room.id)
  }
}
</script>

<template>
  <div class="rooms-table">
    <p v-if="rooms.length === 0" class="empty">У вас пока нет комнат. Создайте первую.</p>

    <table v-else>
      <thead>
        <tr>
          <th></th>
          <th>Название</th>
          <th>Ключ</th>
          <th>Описание</th>
          <th>Изменено</th>
          <th>Скетчей</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="room in rooms" :key="room.id">
          <td>
            <button class="link-btn" @click="open(room.id)">Открыть</button>
          </td>
          <td>{{ room.title }}</td>
          <td><code>{{ room.room_key }}</code></td>
          <td class="desc">{{ room.description || '—' }}</td>
          <td>{{ formatDate(room.updated_at) }}</td>
          <td>{{ room.sketch_count ?? 0 }}</td>
          <td>
            <button class="delete-btn" @click="onDelete(room)">Удалить</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.rooms-table {
  margin-top: 8px;
}
.empty {
  color: #a6adc8;
  font-size: 14px;
  padding: 24px;
  text-align: center;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #e0e0e0;
}
th,
td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid #313244;
}
th {
  color: #a6adc8;
  font-weight: 600;
}
.desc {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
code {
  background: #11111b;
  padding: 2px 6px;
  border-radius: 4px;
}
.link-btn {
  background: #89b4fa;
  color: #11111b;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
}
.delete-btn {
  background: transparent;
  color: #f38ba8;
  border: 1px solid #f38ba8;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
}
</style>
