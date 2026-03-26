<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSketches } from '../composables/useSketches'
import type { Sketch, SketchWithProfile } from '../types/supabase'

const router = useRouter()
const { profile, isAuthenticated, isAdmin, isModerator } = useAuth()
const { sketches, loading, error, getPendingSketches, approveSketch, rejectSketch } = useSketches()

// Состояние
const selectedSketch = ref<SketchWithProfile | null>(null)
const showRejectModal = ref(false)
const rejectReason = ref('')
const approveComment = ref('')
const showApproveModal = ref(false)
const notification = ref<{ message: string; type: 'success' | 'error' } | null>(null)

// Тема (синхронизация с редактором)
type Theme = 'dark' | 'light'
const currentTheme = ref<Theme>('dark')

// Проверка доступа при загрузке
onMounted(async () => {
  // Загрузка темы из localStorage
  const savedTheme = localStorage.getItem('p5editor-theme') as Theme | null
  if (savedTheme === 'dark' || savedTheme === 'light') {
    currentTheme.value = savedTheme
  }

  // Ждём загрузки профиля
  await new Promise(resolve => setTimeout(resolve, 500))

  if (!isModerator.value) {
    router.push('/')
    return
  }

  await loadPendingSketches()
})

// Загрузка скетчей на модерацию
async function loadPendingSketches() {
  await getPendingSketches()
}

// Выбор скетча для просмотра
function selectSketch(sketch: Sketch) {
  selectedSketch.value = sketch
}

// Открытие модального окна одобрения
function openApproveModal() {
  approveComment.value = ''
  showApproveModal.value = true
}

// Открытие модального окна отклонения
function openRejectModal() {
  rejectReason.value = ''
  showRejectModal.value = true
}

// Одобрение скетча
async function handleApprove() {
  if (!selectedSketch.value || !profile.value) return
  
  const result = await approveSketch(selectedSketch.value.id, profile.value.id, approveComment.value || undefined)
  
  if (result.success) {
    showNotification('Скетч одобрен!', 'success')
    showApproveModal.value = false
    selectedSketch.value = null
    await loadPendingSketches()
  } else {
    showNotification(result.error || 'Ошибка одобрения', 'error')
  }
}

// Отклонение скетча
async function handleReject() {
  if (!selectedSketch.value || !profile.value) return
  
  if (!rejectReason.value.trim()) {
    showNotification('Укажите причину отклонения', 'error')
    return
  }
  
  const result = await rejectSketch(selectedSketch.value.id, profile.value.id, rejectReason.value)
  
  if (result.success) {
    showNotification('Скетч отклонён', 'success')
    showRejectModal.value = false
    selectedSketch.value = null
    await loadPendingSketches()
  } else {
    showNotification(result.error || 'Ошибка отклонения', 'error')
  }
}

// Показ уведомления
function showNotification(message: string, type: 'success' | 'error') {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

// Закрытие модальных окон
function closeApproveModal() {
  showApproveModal.value = false
}

function closeRejectModal() {
  showRejectModal.value = false
}

// Форматирование даты
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Вычисляемые
const hasSketches = computed(() => sketches.value.length > 0)
</script>

<template>
  <div :class="['admin-dashboard', currentTheme === 'dark' ? 'theme-dark' : 'theme-light']">
    <!-- Уведомление -->
    <Transition name="fade">
      <div v-if="notification" :class="['notification', notification.type]">
        {{ notification.message }}
      </div>
    </Transition>

    <!-- Заголовок -->
    <header class="dashboard-header">
      <div class="header-left">
        <button @click="router.push('/')" class="btn btn-ghost">
          ← Назад
        </button>
        <div class="header-content">
          <h1>Панель модератора</h1>
          <p class="subtitle">Управление скетчами сообщества</p>
        </div>
      </div>
    </header>

    <!-- Основной контент -->
    <div class="content">
      <!-- Список скетчей на модерации -->
      <div class="sketches-panel">
        <div class="panel-header">
          <h2>На модерации</h2>
          <button
            class="btn btn-icon"
            @click="loadPendingSketches"
            :disabled="loading"
            title="Обновить список"
          >
            🔄
          </button>
        </div>

        <div v-if="loading && sketches.length === 0" class="loading">
          <span class="spinner"></span>
          <p>Загрузка...</p>
        </div>

        <div v-else-if="!hasSketches" class="empty-state">
          <span class="empty-icon">✅</span>
          <p>Все скетчи проверены!</p>
          <p class="empty-hint">Новые скетчи появятся здесь</p>
        </div>

        <div v-else class="sketches-list">
          <div
            v-for="sketch in sketches"
            :key="sketch.id"
            :class="['sketch-item', { selected: selectedSketch?.id === sketch.id }]"
            @click="selectSketch(sketch)"
          >
            <div class="sketch-preview">
              <img
                v-if="sketch.thumbnail_url"
                :src="sketch.thumbnail_url"
                :alt="sketch.title"
                class="thumbnail"
              />
              <div v-else class="thumbnail-placeholder">
                <span>📷</span>
              </div>
            </div>
            <div class="sketch-info">
              <h3>{{ sketch.title }}</h3>
              <p class="author">
                {{ sketch.profiles?.display_name || sketch.profiles?.email?.split('@')[0] || 'Аноним' }}
              </p>
              <p class="date">{{ formatDate(sketch.created_at) }}</p>
              <div class="tags">
                <span
                  v-for="tag in (sketch.tags || []).slice(0, 3)"
                  :key="tag"
                  class="tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Детали скетча -->
      <div class="details-panel">
        <div v-if="!selectedSketch" class="no-selection">
          <span class="no-selection-icon">👈</span>
          <p>Выберите скетч из списка для просмотра деталей</p>
        </div>

        <div v-else class="sketch-details">
          <div class="details-header">
            <h2>{{ selectedSketch.title }}</h2>
            <span class="status-badge pending">На модерации</span>
          </div>

          <div class="author-info">
            <img
              v-if="selectedSketch.profiles?.avatar_url"
              :src="selectedSketch.profiles.avatar_url"
              class="author-avatar"
              alt="Аватар автора"
            />
            <div class="author-avatar-placeholder" v-else>
              {{ ((selectedSketch.profiles?.display_name || 'A')[0] || 'A').toUpperCase() }}
            </div>
            <div class="author-name">
              <strong>{{ selectedSketch.profiles?.display_name || selectedSketch.profiles?.email?.split('@')[0] || 'Аноним' }}</strong>
              <span class="author-email">{{ selectedSketch.profiles?.email }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h3>Описание</h3>
            <p class="description">{{ selectedSketch.description || 'Нет описания' }}</p>
          </div>

          <div class="detail-section">
            <h3>Метаданные</h3>
            <div class="metadata-grid">
              <div class="metadata-item">
                <span class="label">Категория:</span>
                <span class="value">{{ selectedSketch.category || 'Не указана' }}</span>
              </div>
              <div class="metadata-item">
                <span class="label">Сложность:</span>
                <span :class="['value', 'difficulty-' + selectedSketch.difficulty]">
                  {{ selectedSketch.difficulty || 'Не указана' }}
                </span>
              </div>
              <div class="metadata-item">
                <span class="label">Теги:</span>
                <div class="tags">
                  <span v-for="tag in (selectedSketch.tags || [])" :key="tag" class="tag">
                    {{ tag }}
                  </span>
                </div>
              </div>
              <div class="metadata-item">
                <span class="label">Дата создания:</span>
                <span class="value">{{ formatDate(selectedSketch.created_at) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <h3>Код скетча</h3>
            <div class="code-preview">
              <pre><code>{{ selectedSketch.code }}</code></pre>
            </div>
          </div>

          <!-- Кнопки действий -->
          <div class="actions">
            <button class="btn btn-approve" @click="openApproveModal">
              Одобрить
            </button>
            <button class="btn btn-reject" @click="openRejectModal">
              Отклонить
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно одобрения -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showApproveModal" class="modal-overlay" @click="closeApproveModal">
          <div class="modal" @click.stop>
            <div class="modal-header">
              <h3>Одобрение скетча</h3>
              <button class="close-btn" @click="closeApproveModal">×</button>
            </div>
            <div class="modal-body">
              <p>Вы уверены, что хотите одобрить этот скетч?</p>
              <p class="hint">Он появится в галерее после одобрения.</p>

              <div class="form-group">
                <label for="approve-comment">Комментарий (необязательно)</label>
                <textarea
                  id="approve-comment"
                  v-model="approveComment"
                  placeholder="Добавьте комментарий для автора..."
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeApproveModal">Отмена</button>
              <button class="btn btn-approve" @click="handleApprove">Одобрить</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модальное окно отклонения -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showRejectModal" class="modal-overlay" @click="closeRejectModal">
          <div class="modal" @click.stop>
            <div class="modal-header">
              <h3>Отклонение скетча</h3>
              <button class="close-btn" @click="closeRejectModal">×</button>
            </div>
            <div class="modal-body">
              <p>Укажите причину отклонения скетча:</p>

              <div class="form-group">
                <label for="reject-reason">Причина *</label>
                <textarea
                  id="reject-reason"
                  v-model="rejectReason"
                  placeholder="Опишите, что нужно исправить..."
                  rows="4"
                  required
                ></textarea>
              </div>

              <div class="reason-hints">
                <p class="hint-title">Возможные причины:</p>
                <ul class="hint-list">
                  <li>Код не работает или содержит ошибки</li>
                  <li>Неподходящий контент</li>
                  <li>Нарушение правил сообщества</li>
                  <li>Пустой или слишком простой скетч</li>
                </ul>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closeRejectModal">Отмена</button>
              <button class="btn btn-reject" @click="handleReject" :disabled="!rejectReason.trim()">
                Отклонить
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Переменные тем */
.theme-dark {
  --bg-primary: #1a1a1a;
  --bg-secondary: rgba(30, 30, 30, 0.8);
  --bg-card: #ffffff;
  --bg-panel: rgba(255, 255, 255, 0.05);
  --bg-input: rgba(255, 255, 255, 0.08);
  --border-color: rgba(255, 255, 255, 0.1);
  --border-light: #404040;
  --text-primary: #ffffff;
  --text-secondary: #aaaaaa;
  --text-muted: #666666;
  --accent-color: #646cff;
  --accent-soft: #eef2ff;
  --success-color: #10b981;
  --success-bg: #d1fae5;
  --success-text: #065f46;
  --error-color: #ef4444;
  --error-bg: #fee2e2;
  --error-text: #991b1b;
  --warning-color: #f59e0b;
  --warning-bg: #fef3c7;
  --warning-text: #92400e;
  --code-bg: #1f2937;
  --code-text: #e5e7eb;
}

.theme-light {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-panel: #ffffff;
  --bg-input: #f9fafb;
  --border-color: #e5e7eb;
  --border-light: #e5e7eb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --accent-color: #646cff;
  --accent-soft: #eef2ff;
  --success-color: #10b981;
  --success-bg: #d1fae5;
  --success-text: #065f46;
  --error-color: #ef4444;
  --error-bg: #fee2e2;
  --error-text: #991b1b;
  --warning-color: #f59e0b;
  --warning-bg: #fef3c7;
  --warning-text: #92400e;
  --code-bg: #1f2937;
  --code-text: #e5e7eb;
}

.admin-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background-color: var(--bg-primary);
  transition: background-color 0.3s ease;
}

/* Уведомление */
.notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification.success {
  background: var(--success-bg);
  color: var(--success-text);
}

.notification.error {
  background: var(--error-bg);
  color: var(--error-text);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Заголовок */
.dashboard-header {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-content h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.125rem 0;
}

.dashboard-header .subtitle {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

/* Кнопки */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.theme-light .btn-ghost {
  background: rgba(0, 0, 0, 0.04);
  color: #374151;
}

.theme-light .btn-ghost:hover {
  background: rgba(0, 0, 0, 0.08);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.14);
}

.btn-icon {
  background: transparent;
  font-size: 1.25rem;
  padding: 0.5rem;
  border-radius: 4px;
}

.btn-icon:hover {
  background: var(--bg-input);
}

.btn-icon:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-approve {
  background: var(--success-color);
  color: white;
}

.btn-approve:hover {
  background: #059669;
}

.btn-reject {
  background: var(--error-color);
  color: white;
}

.btn-reject:hover {
  background: #dc2626;
}

.btn-reject:disabled {
  background: #fca5a5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: #d1d5db;
}

/* Контент */
.content {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 1.5rem;
}

/* Панель скетчей */
.sketches-panel {
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  max-height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* Загрузка */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Пустое состояние */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.empty-hint {
  font-size: 0.8125rem;
  color: var(--text-muted);
}

/* Список скетчей */
.sketches-list {
  overflow-y: auto;
  flex: 1;
}

.sketch-item {
  display: flex;
  gap: 0.875rem;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.15s;
}

.sketch-item:hover {
  background: var(--bg-input);
}

.sketch-item.selected {
  background: var(--accent-soft);
  border-left: 3px solid var(--accent-color);
}

.sketch-preview {
  flex-shrink: 0;
}

.thumbnail {
  width: 72px;
  height: 54px;
  object-fit: cover;
  border-radius: 4px;
}

.thumbnail-placeholder {
  width: 72px;
  height: 54px;
  background: var(--bg-input);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.sketch-info {
  flex: 1;
  min-width: 0;
}

.sketch-info h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.375rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.date {
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin: 0 0 0.5rem 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tag {
  font-size: 0.6875rem;
  padding: 0.125rem 0.5rem;
  background: var(--bg-input);
  border-radius: 9999px;
  color: var(--text-secondary);
}

/* Панель деталей */
.details-panel {
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 1.5rem;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  color: var(--text-muted);
  text-align: center;
}

.no-selection-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

/* Детали скетча */
.sketch-details {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.details-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.pending {
  background: var(--warning-bg);
  color: var(--warning-text);
}

/* Информация об авторе */
.author-info {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem;
  background: var(--bg-input);
  border-radius: 6px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.author-avatar-placeholder {
  width: 40px;
  height: 40px;
  background: var(--accent-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

.author-name {
  display: flex;
  flex-direction: column;
}

.author-name strong {
  color: var(--text-primary);
  font-size: 0.875rem;
}

.author-email {
  color: var(--text-secondary);
  font-size: 0.75rem;
}

/* Секции */
.detail-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
  font-size: 0.875rem;
}

/* Метаданные */
.metadata-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.metadata-item .label {
  font-size: 0.6875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metadata-item .value {
  font-size: 0.8125rem;
  color: var(--text-primary);
}

.difficulty-Лёгкая {
  color: var(--success-color);
}

.difficulty-Средняя {
  color: var(--warning-color);
}

.difficulty-Тяжёлая {
  color: var(--error-color);
}

/* Код */
.code-preview {
  background: var(--code-bg);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
  max-height: 350px;
  overflow-y: auto;
}

.code-preview pre {
  margin: 0;
}

.code-preview code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.8125rem;
  color: var(--code-text);
  white-space: pre;
}

/* Кнопки действий */
.actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.actions .btn {
  flex: 1;
}

/* Модальные окна */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-card);
  border-radius: 8px;
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: var(--bg-input);
}

.modal-body {
  padding: 1.25rem;
}

.modal-body p {
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
}

.hint {
  color: var(--text-muted);
  font-size: 0.8125rem;
}

.form-group {
  margin-top: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
  transition: border-color 0.2s;
  background: var(--bg-input);
  color: var(--text-primary);
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.1);
}

.reason-hints {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-input);
  border-radius: 6px;
}

.hint-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.hint-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.hint-list li {
  margin-bottom: 0.25rem;
}

.modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color);
}

.modal-footer .btn {
  flex: none;
  min-width: 90px;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: scale(0.95);
}

/* Адаптивность */
@media (max-width: 1024px) {
  .content {
    grid-template-columns: 1fr;
  }

  .sketches-panel {
    max-height: 300px;
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 1rem;
  }

  .dashboard-header {
    padding: 1rem;
  }

  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .content {
    gap: 1rem;
  }

  .metadata-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }
}
</style>
