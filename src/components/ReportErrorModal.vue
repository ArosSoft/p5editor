<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useErrorReports } from '../composables/useErrorReports'
import { linkify } from '../lib/linkify'
import type { ErrorReport } from '../types/supabase'

const props = withDefaults(
  defineProps<{
    theme?: 'dark' | 'light'
  }>(),
  { theme: 'dark' }
)

const emit = defineEmits<{
  close: []
}>()

const { submitReport, fetchMyReports, user } = useErrorReports()

const message = ref('')
const sent = ref(false)
const sendError = ref<string | null>(null)
const myReports = ref<ErrorReport[]>([])
const loadingHistory = ref(false)

async function loadMyReports() {
  if (!user.value) return
  loadingHistory.value = true
  const result = await fetchMyReports()
  loadingHistory.value = false
  if (result.success) {
    myReports.value = result.data ?? []
  }
}

onMounted(() => {
  loadMyReports()
})

async function handleSubmit() {
  if (!message.value.trim() || loadingHistory.value) return

  sendError.value = null
  const result = await submitReport(message.value.trim())

  if (result.success) {
    sent.value = true
    message.value = ''
    await loadMyReports()
  } else {
    sendError.value = result.error || 'Не удалось отправить сообщение'
  }
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return ''
  }
}

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="report-overlay" @click="close">
        <div class="report-modal" :class="`theme-${theme}`" @click.stop>
          <div class="report-header">
            <h2>Сообщить об ошибке</h2>
            <button class="close-btn" @click="close" aria-label="Закрыть">✕</button>
          </div>

          <div v-if="sent" class="report-success-note">
            ✓ Спасибо! Ваше сообщение отправлено администратору.
          </div>

          <form class="report-body" @submit.prevent="handleSubmit">
            <p class="report-hint">
              Опишите проблему как можно подробнее — это поможет нам быстрее её исправить.
            </p>

            <textarea
              v-model="message"
              class="report-textarea"
              placeholder="Опишите ошибку или проблему..."
              rows="6"
              :disabled="loadingHistory"
            ></textarea>

            <p v-if="sendError" class="report-error">{{ sendError }}</p>

            <div class="report-actions">
              <button type="button" class="cancel-btn" @click="close" :disabled="loadingHistory">
                Отмена
              </button>
              <button
                type="submit"
                class="submit-btn"
                :disabled="loadingHistory || !message.trim()"
              >
                {{ loadingHistory && !sent ? 'Отправка...' : 'Отправить' }}
              </button>
            </div>
          </form>

          <div v-if="user" class="report-history">
            <div class="report-history-header">Ваши сообщения</div>

            <div v-if="loadingHistory" class="report-history-empty">Загрузка...</div>

            <div v-else-if="myReports.length === 0" class="report-history-empty">
              Ранее вы не отправляли сообщений.
            </div>

            <ul v-else class="report-history-list">
              <li
                v-for="report in myReports"
                :key="report.id"
                class="report-history-item"
                :title="report.message"
              >
                <div class="report-history-main">
                  <span class="report-history-text">{{ report.message }}</span>
                  <span
                    class="report-history-status"
                    :class="report.status === 'resolved' ? 'resolved' : 'new'"
                  >
                    {{ report.status === 'resolved' ? 'Решено' : 'Новое' }}
                  </span>
                  <span class="report-history-date">{{ formatDate(report.created_at) }}</span>
                </div>
                <div v-if="report.reply" class="report-history-reply">
                  <span class="report-history-reply-label">Ответ:</span>
                  <span v-html="linkify(report.reply)"></span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.report-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.report-modal {
  background: var(--bg-primary, #1e1e1e);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  color: var(--text-primary, #ffffff);
}

.report-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.report-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary, #888);
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: var(--bg-secondary, #2a2a2a);
}

.report-hint {
  font-size: 14px;
  color: var(--text-secondary, #aaa);
  margin: 0 0 12px;
  line-height: 1.4;
}

.report-textarea {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-secondary, #2a2a2a);
  border: 1px solid var(--border-color, #333);
  border-radius: 8px;
  color: var(--text-primary, #fff);
  font-size: 14px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.report-textarea:focus {
  outline: none;
  border-color: var(--accent-color, #42b883);
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.2);
}

.report-error {
  color: #ef4444;
  font-size: 13px;
  margin: 12px 0 0;
}

.report-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn,
.submit-btn {
  flex: 1;
  padding: 11px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: transparent;
  border: 1px solid var(--border-color, #333);
  color: var(--text-primary, #fff);
}

.cancel-btn:hover:not(:disabled) {
  background: var(--bg-secondary, #2a2a2a);
}

.submit-btn {
  background: var(--accent-color, #42b883);
  border: none;
  color: #fff;
}

.submit-btn:hover:not(:disabled) {
  background: #36a76f;
}

.cancel-btn:disabled,
.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.report-history {
  margin-top: 20px;
  border-top: 1px solid var(--border-color, #333);
  padding-top: 16px;
}

.report-history-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary, #aaa);
  margin-bottom: 10px;
}

.report-history-empty {
  font-size: 13px;
  color: var(--text-secondary, #888);
  padding: 8px 0;
}

.report-history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
}

.report-history-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: var(--bg-secondary, #2a2a2a);
  border: 1px solid var(--border-color, #333);
  border-radius: 8px;
}

.report-history-main {
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-history-text {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--text-primary, #fff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.report-history-reply {
  font-size: 12px;
  color: var(--text-secondary, #aaa);
  background: rgba(66, 184, 131, 0.08);
  border: 1px solid rgba(66, 184, 131, 0.3);
  border-radius: 6px;
  padding: 6px 8px;
  line-height: 1.4;
  word-break: break-word;
}

.report-history-reply-label {
  color: var(--accent-color, #42b883);
  font-weight: 600;
  margin-right: 4px;
}

.report-history-reply :deep(a) {
  color: #f5c518;
  text-decoration: underline;
  word-break: break-all;
}

.report-history-status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.report-history-status.new {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.report-history-status.resolved {
  background: rgba(66, 184, 131, 0.15);
  color: var(--accent-color, #42b883);
}

.report-history-date {
  font-size: 11px;
  color: var(--text-secondary, #888);
  flex-shrink: 0;
}

.theme-light .report-history-item {
  background: rgba(0, 0, 0, 0.03);
}

.report-success-note {
  background: rgba(66, 184, 131, 0.12);
  border: 1px solid rgba(66, 184, 131, 0.4);
  color: var(--accent-color, #42b883);
  font-size: 13px;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.theme-light .report-overlay {
  background: rgba(0, 0, 0, 0.4);
}

.theme-light .report-modal {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .report-modal,
.modal-leave-active .report-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .report-modal,
.modal-leave-to .report-modal {
  transform: scale(0.95) translateY(-10px);
}
</style>
