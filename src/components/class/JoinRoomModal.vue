<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useClassRooms } from '../../composables/useClassRooms'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'joined', roomTitle: string): void
}>()

const { joinRoom, getRoomInfo } = useClassRooms()

const isVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

type Step = 'input' | 'confirm'
const step = ref<Step>('input')
const roomKey = ref('')
const roomInfo = ref<{ room_id: string; title: string } | null>(null)
const currentSketchId = ref<string | null>(null)
const checking = ref(false)
const joining = ref(false)
const formError = ref('')

watch(isVisible, (visible) => {
  formError.value = ''
  roomKey.value = ''
  roomInfo.value = null
  step.value = 'input'
  if (visible) {
    // Текущий (написанный) скетч берём из localStorage, как это делает редактор
    currentSketchId.value = localStorage.getItem('p5editor_current_sketch_id')
  }
})

async function checkRoom() {
  formError.value = ''
  if (!/^\d{4}$/.test(roomKey.value.trim())) {
    formError.value = 'Ключ комнаты должен состоять из 4 цифр'
    return
  }
  checking.value = true
  const { success, data } = await getRoomInfo(roomKey.value.trim())
  checking.value = false

  if (!success) {
    formError.value = 'Не удалось проверить комнату'
    return
  }
  if (!data) {
    formError.value = 'Комната с таким ключом не найдена'
    return
  }
  roomInfo.value = data
  step.value = 'confirm'
}

async function confirmJoin() {
  formError.value = ''
  if (!currentSketchId.value) {
    formError.value = 'Сначала откройте скетч в редакторе и сохраните его — он будет добавлен в комнату'
    return
  }
  if (!roomInfo.value) return

  joining.value = true
  const { success, error, data } = await joinRoom(roomKey.value.trim(), currentSketchId.value)
  joining.value = false

  if (!success) {
    formError.value = error || 'Не удалось присоединиться к комнате'
    return
  }
  const roomTitle = (data as { room_title: string })?.room_title || roomInfo.value.title
  isVisible.value = false
  emit('joined', roomTitle)
}

function close() {
  formError.value = ''
  isVisible.value = false
}
</script>

<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="close">
    <div class="modal">
      <h2>Присоединиться к комнате</h2>

      <!-- Шаг 1: ввод кода -->
      <template v-if="step === 'input'">
        <p v-if="!currentSketchId" class="hint">
          Откройте скетч в редакторе и сохраните его — он будет добавлен в комнату.
        </p>
        <label>
          Код комнаты
          <input v-model="roomKey" type="text" inputmode="numeric" maxlength="4" placeholder="4 цифры" />
        </label>
        <p v-if="formError" class="error">{{ formError }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" :disabled="checking || joining" @click="close">Отмена</button>
          <button class="btn-primary" :disabled="checking || joining" @click="checkRoom">
            {{ checking ? 'Проверка…' : 'Проверить' }}
          </button>
        </div>
      </template>

      <!-- Шаг 2: подтверждение связи текущего скетча -->
      <template v-else>
        <p class="confirm-text">
          Комната «{{ roomInfo?.title }}» найдена. Добавить ваш текущий скетч в эту комнату?
        </p>
        <p v-if="formError" class="error">{{ formError }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" :disabled="joining" @click="step = 'input'">Назад</button>
          <button class="btn-primary" :disabled="joining" @click="confirmJoin">
            {{ joining ? 'Добавление…' : 'Добавить скетч' }}
          </button>
        </div>
      </template>
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
input {
  background: #11111b;
  border: 1px solid #45475a;
  color: #e0e0e0;
  border-radius: 6px;
  padding: 8px;
  font: inherit;
}
.confirm-text {
  font-size: 14px;
  margin: 0;
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
.hint {
  font-size: 13px;
  color: #a6adc8;
  margin: 0;
}
</style>
