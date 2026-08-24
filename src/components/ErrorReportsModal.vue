<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useErrorReports } from '../composables/useErrorReports'
import { linkify } from '../lib/linkify'

const props = withDefaults(
  defineProps<{
    theme?: 'dark' | 'light'
  }>(),
  { theme: 'dark' }
)

const emit = defineEmits<{
  close: []
}>()

const { reports, loading, fetchReports, updateReport, replyToReport, deleteReport } = useErrorReports()

const actionError = ref<string | null>(null)
const replyingId = ref<string | null>(null)
const replyText = ref('')
const replying = ref(false)

onMounted(() => {
  load()
})

async function load() {
  actionError.value = null
  const result = await fetchReports()
  if (!result.success) {
    actionError.value = result.error || 'Не удалось загрузить сообщения'
  }
}

async function toggleStatus(id: string, current: string) {
  actionError.value = null
  const next = current === 'new' ? 'resolved' : 'new'
  const result = await updateReport(id, { status: next })
  if (!result.success) {
    actionError.value = result.error || 'Не удалось обновить статус'
    await load()
  }
}

function startReply(report: { id: string; reply: string | null }) {
  replyingId.value = report.id
  replyText.value = report.reply ?? ''
}

function cancelReply() {
  replyingId.value = null
  replyText.value = ''
}

async function saveReply(id: string) {
  if (replying.value) return
  replying.value = true
  actionError.value = null
  const result = await replyToReport(id, replyText.value)
  replying.value = false
  if (result.success) {
    cancelReply()
  } else {
    actionError.value = result.error || 'Не удалось отправить ответ'
  }
}

async function removeReport(id: string) {
  actionError.value = null
  const result = await deleteReport(id)
  if (!result.success) {
    actionError.value = result.error || 'Не удалось удалить сообщение'
    await load()
  }
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString('ru-RU', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  } catch {
    return value
  }
}

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div class="reports-overlay" @click="close">
        <div class="reports-modal" :class="`theme-${theme}`" @click.stop>
          <div class="reports-header">
            <h2>Сообщения об ошибках</h2>
            <button class="close-btn" @click="close" aria-label="Закрыть">✕</button>
          </div>

          <p v-if="actionError" class="reports-error">{{ actionError }}</p>

          <div class="reports-list">
            <div v-if="loading" class="reports-empty">Загрузка...</div>

            <div v-else-if="reports.length === 0" class="reports-empty">
              Сообщений пока нет.
            </div>

            <div v-for="report in reports" :key="report.id" class="report-item">
              <div class="report-item-top">
                <span
                  class="report-status"
                  :class="report.status === 'resolved' ? 'resolved' : 'new'"
                >
                  {{ report.status === 'resolved' ? 'Решено' : 'Новое' }}
                </span>
                <span class="report-date">{{ formatDate(report.created_at) }}</span>
              </div>

              <p class="report-message">{{ report.message }}</p>

              <div class="report-meta">
                <span v-if="report.reporter_email">От: {{ report.reporter_email }}</span>
                <span v-else>От: неизвестно</span>
              </div>

              <div v-if="report.reply" class="report-reply">
                <div class="report-reply-label">Ответ:</div>
                <p class="report-reply-text" v-html="linkify(report.reply)"></p>
                <div v-if="report.replied_at" class="report-reply-date">
                  {{ formatDate(report.replied_at) }}
                </div>
              </div>

              <div v-if="replyingId === report.id" class="report-reply-editor">
                <textarea
                  v-model="replyText"
                  class="report-reply-textarea"
                  placeholder="Введите ответ пользователю..."
                  rows="3"
                  :disabled="replying"
                ></textarea>
                <div class="report-reply-actions">
                  <button class="cancel-btn" @click="cancelReply" :disabled="replying">Отмена</button>
                  <button class="submit-btn" @click="saveReply(report.id)" :disabled="replying">
                    {{ replying ? 'Отправка...' : 'Отправить ответ' }}
                  </button>
                </div>
              </div>

              <div class="report-item-actions">
                <button class="reply-btn" @click="startReply(report)">Ответить</button>
                <button class="toggle-btn" @click="toggleStatus(report.id, report.status)">
                  {{ report.status === 'new' ? 'Отметить решённым' : 'Снять отметку' }}
                </button>
                <button class="delete-btn" @click="removeReport(report.id)">Удалить</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.reports-overlay {
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

.reports-modal {
  background: var(--bg-primary, #1e1e1e);
  border-radius: 12px;
  padding: 24px;
  width: 100%;
  max-width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  color: var(--text-primary, #ffffff);
}

.reports-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.reports-header h2 {
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

.reports-error {
  color: #ef4444;
  font-size: 13px;
  margin: 0 0 12px;
}

.reports-list {
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.reports-empty {
  text-align: center;
  color: var(--text-secondary, #888);
  padding: 40px 0;
  font-size: 14px;
}

.report-item {
  background: var(--bg-secondary, #2a2a2a);
  border: 1px solid var(--border-color, #333);
  border-radius: 10px;
  padding: 14px 16px;
}

.report-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.report-status {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
}

.report-status.new {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.report-status.resolved {
  background: rgba(66, 184, 131, 0.15);
  color: var(--accent-color, #42b883);
}

.report-date {
  font-size: 12px;
  color: var(--text-secondary, #888);
}

.report-message {
  font-size: 14px;
  color: var(--text-primary, #fff);
  margin: 0 0 8px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.45;
}

.report-meta {
  font-size: 12px;
  color: var(--text-secondary, #888);
  margin-bottom: 12px;
}

.report-reply {
  background: rgba(66, 184, 131, 0.08);
  border: 1px solid rgba(66, 184, 131, 0.3);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.report-reply-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent-color, #42b883);
  margin-bottom: 4px;
}

.report-reply-text {
  font-size: 13px;
  color: var(--text-primary, #fff);
  margin: 0 0 4px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.45;
}

.report-reply-text :deep(a) {
  color: #f5c518;
  text-decoration: underline;
  word-break: break-all;
}

.report-reply-date {
  font-size: 11px;
  color: var(--text-secondary, #888);
}

.report-reply-editor {
  margin-bottom: 12px;
}

.report-reply-textarea {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-primary, #1e1e1e);
  border: 1px solid var(--border-color, #333);
  border-radius: 8px;
  color: var(--text-primary, #fff);
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.report-reply-textarea:focus {
  outline: none;
  border-color: var(--accent-color, #42b883);
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.2);
}

.report-reply-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.report-reply-actions .cancel-btn,
.report-reply-actions .submit-btn {
  flex: 1;
  padding: 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.report-reply-actions .cancel-btn {
  background: transparent;
  border: 1px solid var(--border-color, #333);
  color: var(--text-primary, #fff);
}

.report-reply-actions .cancel-btn:hover:not(:disabled) {
  background: var(--bg-secondary, #2a2a2a);
}

.report-reply-actions .submit-btn {
  background: var(--accent-color, #42b883);
  border: none;
  color: #fff;
}

.report-reply-actions .submit-btn:hover:not(:disabled) {
  background: #36a76f;
}

.report-reply-actions .cancel-btn:disabled,
.report-reply-actions .submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.report-item-actions {
  display: flex;
  gap: 8px;
}

.toggle-btn,
.delete-btn,
.reply-btn {
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.reply-btn {
  background: var(--accent-color, #42b883);
  border: 1px solid var(--accent-color, #42b883);
  color: #fff;
}

.reply-btn:hover {
  background: #36a76f;
  border-color: #36a76f;
}

.toggle-btn {
  background: var(--bg-tertiary, #333);
  border: 1px solid var(--border-color, #444);
  color: var(--text-primary, #fff);
}

.toggle-btn:hover {
  border-color: var(--accent-color, #42b883);
}

.delete-btn {
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.theme-light .reports-overlay {
  background: rgba(0, 0, 0, 0.4);
}

.theme-light .reports-modal {
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
}

.theme-light .report-item {
  background: rgba(0, 0, 0, 0.03);
}

/* Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .reports-modal,
.modal-leave-active .reports-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .reports-modal,
.modal-leave-to .reports-modal {
  transform: scale(0.95) translateY(-10px);
}
</style>
