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

// Проверка доступа при загрузке
onMounted(async () => {
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
  <div class="admin-dashboard">
    <!-- Уведомление -->
    <Transition name="fade">
      <div v-if="notification" :class="['notification', notification.type]">
        {{ notification.message }}
      </div>
    </Transition>

    <!-- Заголовок -->
    <header class="header">
      <div class="header-left">
        <button @click="router.push('/')" class="back-btn" title="Назад к редактору">
          ← Назад
        </button>
        <div class="header-content">
          <h1>🛡️ Панель модератора</h1>
          <p class="subtitle">Управление скетчами сообщества</p>
        </div>
      </div>
    </header>

    <!-- Основной контент -->
    <div class="content">
      <!-- Список скетчей на модерации -->
      <div class="sketches-panel">
        <div class="panel-header">
          <h2>📋 На модерации</h2>
          <button 
            class="refresh-btn" 
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
                👤 {{ sketch.profiles?.display_name || sketch.profiles?.email?.split('@')[0] || 'Аноним' }}
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
            <div class="status-badge pending">На модерации</div>
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
              ✅ Одобрить
            </button>
            <button class="btn btn-reject" @click="openRejectModal">
              ❌ Отклонить
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
              <h3>✅ Одобрение скетча</h3>
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
              <h3>❌ Отклонение скетча</h3>
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
.admin-dashboard {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

/* Уведомление */
.notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.notification.success {
  background: #10b981;
  color: white;
}

.notification.error {
  background: #ef4444;
  color: white;
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
.header {
  margin-bottom: 2rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.back-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.header-content h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.header .subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}

/* Контент */
.content {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
}

/* Панель скетчей */
.sketches-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.panel-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.refresh-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background 0.2s;
}

.refresh-btn:hover {
  background: #f3f4f6;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Загрузка */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
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
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-hint {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* Список скетчей */
.sketches-list {
  overflow-y: auto;
  flex: 1;
}

.sketch-item {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background 0.2s;
}

.sketch-item:hover {
  background: #f9fafb;
}

.sketch-item.selected {
  background: #eff6ff;
  border-left: 3px solid #3b82f6;
}

.sketch-preview {
  flex-shrink: 0;
}

.thumbnail {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
}

.thumbnail-placeholder {
  width: 80px;
  height: 60px;
  background: #f3f4f6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.sketch-info {
  flex: 1;
  min-width: 0;
}

.sketch-info h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.author {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.25rem 0;
}

.date {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0 0 0.5rem 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tag {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: #e5e7eb;
  border-radius: 9999px;
  color: #4b5563;
}

/* Панель деталей */
.details-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  color: #9ca3af;
  text-align: center;
}

.no-selection-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

/* Детали скетча */
.sketch-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.details-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

/* Информация об авторе */
.author-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.author-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.author-avatar-placeholder {
  width: 48px;
  height: 48px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.25rem;
}

.author-name {
  display: flex;
  flex-direction: column;
}

.author-name strong {
  color: #1f2937;
  font-size: 1rem;
}

.author-email {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Секции */
.detail-section h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.description {
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}

/* Метаданные */
.metadata-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metadata-item .label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metadata-item .value {
  font-size: 0.875rem;
  color: #1f2937;
}

.difficulty-Лёгкая {
  color: #10b981;
}

.difficulty-Средняя {
  color: #f59e0b;
}

.difficulty-Тяжёлая {
  color: #ef4444;
}

/* Код */
.code-preview {
  background: #1f2937;
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}

.code-preview pre {
  margin: 0;
}

.code-preview code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 0.875rem;
  color: #e5e7eb;
  white-space: pre;
}

/* Кнопки действий */
.actions {
  display: flex;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-approve {
  background: #10b981;
  color: white;
}

.btn-approve:hover {
  background: #059669;
}

.btn-reject {
  background: #ef4444;
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
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

/* Модальные окна */
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
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
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
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
}

.modal-body p {
  color: #4b5563;
  margin: 0 0 1rem 0;
}

.hint {
  color: #6b7280;
  font-size: 0.875rem;
}

.form-group {
  margin-top: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.reason-hints {
  margin-top: 1rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.hint-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.hint-list {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.hint-list li {
  margin-bottom: 0.25rem;
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.modal-footer .btn {
  flex: none;
  min-width: 100px;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  opacity: 0;
  transform: scale(0.95);
}

.modal-enter-from .modal-overlay,
.modal-leave-to .modal-overlay {
  opacity: 0;
}

/* Адаптивность */
@media (max-width: 1024px) {
  .content {
    grid-template-columns: 1fr;
  }

  .sketches-panel {
    max-height: 400px;
  }
}

@media (max-width: 640px) {
  .admin-dashboard {
    padding: 1rem;
  }

  .metadata-grid {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }
}
</style>
