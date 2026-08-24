<script setup lang="ts">
defineProps<{ roomTitle: string }>()
const emit = defineEmits<{ (e: 'dismiss'): void }>()
</script>

<template>
  <div class="banner">
    <span>Ваш скетч присоединен к комнате «{{ roomTitle }}»</span>
    <button class="banner-close" @click="emit('dismiss')" aria-label="Закрыть">×</button>
  </div>
</template>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: #1e3a2f;
  border: 1px solid #4ad295;
  color: #c8f5dd;
  padding: 10px 14px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}
.banner-close {
  background: transparent;
  border: none;
  color: #c8f5dd;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
}
</style>
