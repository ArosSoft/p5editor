<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useRoom } from '../composables/useRoom'
import RoomHeader from '../components/class/RoomHeader.vue'
import RoomSketchList from '../components/class/RoomSketchList.vue'
import SketchPreviewPane from '../components/class/SketchPreviewPane.vue'

const route = useRoute()
const roomId = route.params.roomId as string

const { room, roomSketches, selectedSketch, loading, error, fetchRoom, fetchRoomSketches, selectSketch, updateRoom, removeSketchFromRoom, changeRating } =
  useRoom(roomId)

onMounted(async () => {
  await fetchRoom(roomId)
  await fetchRoomSketches(roomId)
})

async function onSave(title: string, description: string) {
  await updateRoom(roomId, title, description)
}

async function onRemove(roomSketchId: string) {
  if (window.confirm('Удалить скетч из комнаты? Сам скетч останется в кабинете ученика.')) {
    await removeSketchFromRoom(roomSketchId, roomId)
  }
}

async function onRate(roomSketchId: string, delta: number) {
  await changeRating(roomSketchId, delta)
}
</script>

<template>
  <div class="room-page">
    <p v-if="loading" class="hint">Загрузка…</p>
    <p v-else-if="error" class="error">{{ error }}</p>

    <template v-else-if="room">
      <RoomHeader :room="room" @save="onSave" />

      <div class="columns">
        <section class="left">
          <SketchPreviewPane :sketch="selectedSketch" />
        </section>
        <section class="right">
          <h3>Скетчи комнаты</h3>
          <RoomSketchList
            :items="roomSketches"
            @select="selectSketch"
            @remove="onRemove"
            @rate="onRate"
          />
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.room-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 16px;
  color: #e0e0e0;
}
.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}
.right h3 {
  margin: 0 0 4px;
  font-size: 16px;
}
.hint {
  color: #a6adc8;
}
.error {
  color: #f38ba8;
}
@media (max-width: 800px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
</style>
