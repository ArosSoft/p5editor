<script setup lang="ts">
import RoomSketchListItem from './RoomSketchListItem.vue'
import type { RoomSketchWithDetails } from '../../composables/useRoom'

defineProps<{ items: RoomSketchWithDetails[] }>()
const emit = defineEmits<{
  (e: 'select', sketchId: string): void
  (e: 'remove', roomSketchId: string): void
  (e: 'rate', roomSketchId: string, delta: number): void
}>()
</script>

<template>
  <div class="room-sketch-list">
    <p v-if="items.length === 0" class="empty">В комнате пока нет скетчей.</p>
    <ul v-else>
      <RoomSketchListItem
        v-for="item in items"
        :key="item.id"
        :item="item"
        @select="(id: string) => emit('select', id)"
        @remove="(id: string) => emit('remove', id)"
        @rate="(id: string, d: number) => emit('rate', id, d)"
      />
    </ul>
  </div>
</template>

<style scoped>
.room-sketch-list {
  margin-top: 8px;
}
.empty {
  color: #a6adc8;
  font-size: 14px;
  padding: 16px;
  text-align: center;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
