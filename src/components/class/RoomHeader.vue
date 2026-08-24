<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ClassRoom } from '../../types/supabase'

const props = defineProps<{ room: ClassRoom | null }>()
const emit = defineEmits<{ (e: 'save', title: string, description: string): void }>()

const title = ref('')
const description = ref('')
const saving = ref(false)

watch(
  () => props.room,
  (r) => {
    if (r) {
      title.value = r.title
      description.value = r.description
    }
  },
  { immediate: true }
)

function save() {
  saving.value = true
  emit('save', title.value.trim(), description.value.trim())
  saving.value = false
}
</script>

<template>
  <div class="room-header">
    <button class="back" @click="$router.push('/class')">← Назад</button>
    <div class="fields">
      <input v-model="title" class="title-input" placeholder="Название комнаты" />
      <input v-model="description" class="desc-input" placeholder="Описание" />
    </div>
    <button class="save" :disabled="saving" @click="save">Сохранить</button>
  </div>
</template>

<style scoped>
.room-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.back {
  background: #45475a;
  color: #e0e0e0;
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
}
.fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.title-input,
.desc-input {
  background: #11111b;
  border: 1px solid #45475a;
  color: #e0e0e0;
  border-radius: 6px;
  padding: 8px;
  font: inherit;
}
.save {
  background: #89b4fa;
  color: #11111b;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  align-self: flex-start;
}
</style>
