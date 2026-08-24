<script setup lang="ts">
import RatingControl from './RatingControl.vue'
import type { RoomSketchWithDetails } from '../../composables/useRoom'

const props = defineProps<{ item: RoomSketchWithDetails }>()
const emit = defineEmits<{
  (e: 'select', sketchId: string): void
  (e: 'remove', roomSketchId: string): void
  (e: 'rate', roomSketchId: string, delta: number): void
}>()

const authorName = props.item.sketch?.profiles?.display_name || 'Ученик'
</script>

<template>
  <li class="room-sketch-item">
    <button class="view-btn" @click="emit('select', item.sketch_id)">Посмотреть</button>
    <div class="info">
      <div class="title">{{ item.sketch?.title || 'Без названия' }}</div>
      <div class="author">{{ authorName }}</div>
    </div>
    <RatingControl :rating="item.rating" @rate="(d: number) => emit('rate', item.id, d)" />
    <button class="remove-btn" @click="emit('remove', item.id)">Удалить из комнаты</button>
  </li>
</template>

<style scoped>
.room-sketch-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #313244;
}
.info {
  flex: 1;
  min-width: 0;
}
.title {
  color: #e0e0e0;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.author {
  color: #a6adc8;
  font-size: 12px;
}
.view-btn {
  background: #89b4fa;
  color: #11111b;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
}
.remove-btn {
  background: transparent;
  color: #f38ba8;
  border: 1px solid #f38ba8;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
}
</style>
