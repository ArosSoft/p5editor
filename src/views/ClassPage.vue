<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClassRooms } from '../composables/useClassRooms'
import { useAuth } from '../composables/useAuth'
import CreateRoomModal from '../components/class/CreateRoomModal.vue'
import JoinRoomModal from '../components/class/JoinRoomModal.vue'
import JoinSuccessBanner from '../components/class/JoinSuccessBanner.vue'
import RoomsTable from '../components/class/RoomsTable.vue'

const router = useRouter()
const {
  rooms,
  filteredRooms,
  loading,
  searchQuery,
  joinSuccess,
  fetchRooms,
  deleteRoom,
  clearJoinSuccess,
  getMyLinkedSketches,
  linkedSketches,
  linkedLoading
} = useClassRooms()
const { user } = useAuth()

const showCreate = ref(false)
const showJoin = ref(false)
const showLinked = ref(false)

onMounted(() => {
  if (user.value) {
    fetchRooms()
    getMyLinkedSketches()
  }
})

async function onDelete(roomId: string) {
  await deleteRoom(roomId)
}

function onJoined(roomTitle: string) {
  // joinSuccess уже установлен в composable; баннер появится реактивно
  void roomTitle
  // обновляем список связанных скетчей
  getMyLinkedSketches()
}
</script>

<template>
  <div class="class-page">
    <header class="top-bar">
      <button class="back-btn" @click="router.push('/my-programs')" title="В личный кабинет">
        ←
      </button>
      <h1>Класс</h1>
      <div class="actions">
        <button class="btn-primary" @click="showCreate = true">Создать комнату</button>
        <button class="btn-secondary" @click="showJoin = true">Присоединиться</button>
      </div>
    </header>

    <JoinSuccessBanner
      v-if="joinSuccess"
      :room-title="joinSuccess.roomTitle"
      @dismiss="clearJoinSuccess"
    />

    <div class="search">
      <input v-model="searchQuery" type="text" placeholder="Поиск по названию, описанию, ключу…" />
    </div>

    <!-- Раскрывающийся список связанных со мной скетчей -->
    <section class="linked-section">
      <button class="linked-toggle" @click="showLinked = !showLinked">
        <span class="caret">{{ showLinked ? '▾' : '▸' }}</span>
        Мои скетчи в комнатах
        <span class="count">({{ linkedSketches.length }})</span>
      </button>
      <div v-if="showLinked" class="linked-body">
        <p v-if="linkedLoading" class="hint">Загрузка…</p>
        <p v-else-if="!linkedSketches.length" class="hint">
          Вы ещё не добавили свои скетчи ни в одну комнату.
        </p>
        <ul v-else class="linked-list">
          <li
            v-for="item in linkedSketches"
            :key="item.room_sketch_id"
            class="linked-item"
            @click="router.push('/sketch/' + item.numeric_sketch_id)"
          >
            <span class="linked-sketch">{{ item.sketch_title }}</span>
            <span class="linked-room">в комнате «{{ item.room_title }}»</span>
            <span class="linked-rating">★ {{ item.rating }}</span>
          </li>
        </ul>
      </div>
    </section>

    <p v-if="loading" class="hint">Загрузка…</p>
    <RoomsTable v-else :rooms="filteredRooms" @delete="onDelete" />

    <CreateRoomModal v-model="showCreate" @created="fetchRooms" />
    <JoinRoomModal v-model="showJoin" @joined="onJoined" />
  </div>
</template>

<style scoped>
.class-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 16px;
  color: #e0e0e0;
}
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.top-bar h1 {
  margin: 0;
}
.back-btn {
  background: #45475a;
  color: #e0e0e0;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  font: inherit;
}
.actions {
  display: flex;
  gap: 8px;
}
.search {
  margin: 16px 0;
}
.search input {
  width: 100%;
  background: #11111b;
  border: 1px solid #45475a;
  color: #e0e0e0;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
}
.btn-primary,
.btn-secondary {
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font: inherit;
}
.btn-primary {
  background: #89b4fa;
  color: #11111b;
}
.btn-secondary {
  background: #45475a;
  color: #e0e0e0;
}
.hint {
  color: #a6adc8;
  font-size: 14px;
}
.linked-section {
  margin: 16px 0;
  border: 1px solid #45475a;
  border-radius: 8px;
  overflow: hidden;
}
.linked-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1e1e2e;
  color: #e0e0e0;
  border: none;
  padding: 12px 14px;
  cursor: pointer;
  font: inherit;
  text-align: left;
}
.linked-toggle .caret {
  color: #89b4fa;
}
.linked-toggle .count {
  color: #a6adc8;
}
.linked-body {
  padding: 8px 14px 14px;
  background: #181825;
}
.linked-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.linked-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #11111b;
  cursor: pointer;
}
.linked-item:hover {
  background: #313244;
}
.linked-sketch {
  font-weight: 600;
}
.linked-room {
  color: #a6adc8;
  flex: 1;
}
.linked-rating {
  color: #f9e2af;
}
</style>
