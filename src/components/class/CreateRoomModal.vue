<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClassRooms } from '../../composables/useClassRooms'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'created'): void
}>()

const { createRoom } = useClassRooms()

const isVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const title = ref('')
const description = ref('')
const saving = ref(false)
const formError = ref('')

async function submit() {
  formError.value = ''
  if (!title.value.trim()) {
    formError.value = 'Введите название комнаты'
    return
  }
  saving.value = true
  const { success, error } = await createRoom(title.value.trim(), description.value.trim())
  saving.value = false

  if (!success) {
    formError.value = error || 'Не удалось создать комнату'
    return
  }
  title.value = ''
  description.value = ''
  isVisible.value = false
  emit('created')
}

function close() {
  formError.value = ''
  isVisible.value = false
}
</script>

<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="close">
    <div class="modal">
      <h2>Создать комнату</h2>
      <label>
        Название
        <input v-model="title" type="text" maxlength="120" placeholder="Название комнаты" />
      </label>
      <label>
        Описание
        <textarea v-model="description" rows="3" placeholder="Описание (необязательно)" />
      </label>
      <p v-if="formError" class="error">{{ formError }}</p>
      <div class="modal-actions">
        <button class="btn-secondary" :disabled="saving" @click="close">Отмена</button>
        <button class="btn-primary" :disabled="saving" @click="submit">
          {{ saving ? 'Создание…' : 'Создать' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal {
  background: #1e1e2e;
  color: #e0e0e0;
  padding: 24px;
  border-radius: 12px;
  width: 420px;
  max-width: 92vw;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.modal h2 {
  margin: 0;
}
label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
}
input,
textarea {
  background: #11111b;
  border: 1px solid #45475a;
  color: #e0e0e0;
  border-radius: 6px;
  padding: 8px;
  font: inherit;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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
.error {
  color: #f38ba8;
  font-size: 13px;
  margin: 0;
}
</style>
