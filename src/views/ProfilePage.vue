<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSketches } from '../composables/useSketches'
import { useStorage } from '../composables/useStorage'
import type { Sketch } from '../types/supabase'

const router = useRouter()
const route = useRoute()
const { user, profile, isAuthenticated, updateProfile, uploadAvatar } = useAuth()
const { getUserSketches, deleteSketch } = useSketches()
const { uploadAvatar: uploadAvatarStorage, uploading: uploadingAvatar } = useStorage()

// Состояние
const isEditing = ref(false)
const loading = ref(false)
const userSketches = ref<Sketch[]>([])
const activeTab = ref<'all' | 'pending' | 'approved' | 'rejected' | 'draft'>('all')

// Удаление скетча
const showDeleteModal = ref(false)
const sketchToDelete = ref<string | null>(null)
const isDeleting = ref(false)

// Форма редактирования
const editForm = ref({
  display_name: '',
  bio: ''
})

const avatarInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const notification = ref<{ message: string; type: 'success' | 'error' } | null>(null)

// Проверка авторизации
onMounted(async () => {
  // Проверяем localStorage, так как initAuth может ещё работать
  const userRole = localStorage.getItem('user_role')
  const isAuth = userRole === 'user' || userRole === 'moderator' || userRole === 'admin'
  
  if (!isAuth) {
    router.push('/')
    return
  }

  await loadUserSketches()
})

// Загрузка скетчей пользователя
async function loadUserSketches(status?: string) {
  if (!user.value) return
  
  loading.value = true
  const result = await getUserSketches(user.value.id, status as any)
  
  if (result.success) {
    userSketches.value = result.data || []
  }
  
  loading.value = false
}

// Фильтрация по статусу
function filterByStatus(status: 'all' | 'pending' | 'approved' | 'rejected' | 'draft') {
  activeTab.value = status
  if (status === 'all') {
    loadUserSketches()
  } else {
    loadUserSketches(status)
  }
}

// Начало редактирования профиля
function startEditing() {
  editForm.value = {
    display_name: profile.value?.display_name || '',
    bio: profile.value?.bio || ''
  }
  isEditing.value = true
}

// Отмена редактирования
function cancelEditing() {
  isEditing.value = false
}

// Сохранение профиля
async function saveProfile() {
  if (!user.value) return
  
  uploading.value = true
  const result = await updateProfile({
    display_name: editForm.value.display_name || null,
    bio: editForm.value.bio || null
  })
  
  if (result.success) {
    showNotification('Профиль сохранён', 'success')
    isEditing.value = false
  } else {
    showNotification(result.error || 'Ошибка сохранения', 'error')
  }
  
  uploading.value = false
}

// Загрузка аватара
async function handleAvatarChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !user.value) return

  uploading.value = true
  const result = await uploadAvatar(file)
  
  if (result.success) {
    showNotification('Аватар обновлён', 'success')
  } else {
    showNotification(result.error || 'Ошибка загрузки аватара', 'error')
  }
  
  uploading.value = false
  target.value = ''
}

// Клик по аватару
function handleAvatarClick() {
  avatarInput.value?.click()
}

// Показ уведомления
function showNotification(message: string, type: 'success' | 'error') {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

// Переход к скетчу
function openSketch(id: string) {
  router.push(`/sketch/${id}`)
}

// Открыть скетч в редакторе
function openSketchInEditor(id: string) {
  console.log('[ProfilePage] openSketchInEditor:', id)
  // Сохраняем ID скетча в localStorage для загрузки в редакторе
  localStorage.setItem('p5editor_current_sketch_id', id)
  localStorage.setItem('p5editor_load_sketch_id', id) // Дополнительный флаг
  console.log('[ProfilePage] sketch_id сохранён в localStorage:', localStorage.getItem('p5editor_current_sketch_id'))
  // Переходим в редактор с query параметром
  router.push({ path: '/', query: { sketch: id, t: Date.now() } })
}

// Открыть модальное окно удаления
function confirmDelete(sketchId: string) {
  sketchToDelete.value = sketchId
  showDeleteModal.value = true
}

// Закрыть модальное окно
function closeDeleteModal() {
  showDeleteModal.value = false
  sketchToDelete.value = null
}

// Удаление скетча
async function handleDeleteSketch() {
  if (!sketchToDelete.value || !user.value) return
  
  isDeleting.value = true
  try {
    const result = await deleteSketch(sketchToDelete.value)
    
    if (result.success) {
      showNotification('Скетч удалён', 'success')
      closeDeleteModal()
      // Перезагружаем список скетчей
      await loadUserSketches()
    } else {
      showNotification(result.error || 'Ошибка удаления', 'error')
    }
  } catch (error) {
    console.error('Delete sketch error:', error)
    showNotification('Ошибка при удалении скетча', 'error')
  } finally {
    isDeleting.value = false
  }
}

// Форматирование даты
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  })
}

// Вычисляемые
const displayName = computed(() => {
  return profile.value?.display_name || user.value?.email?.split('@')[0] || 'Аноним'
})

const avatarUrl = computed(() => {
  return profile.value?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=42b883&color=fff&size=128`
})

const stats = computed(() => {
  const total = userSketches.value.length
  const pending = userSketches.value.filter(s => s.status === 'pending').length
  const approved = userSketches.value.filter(s => s.status === 'approved').length
  const rejected = userSketches.value.filter(s => s.status === 'rejected').length
  const totalLikes = userSketches.value.reduce((sum, s) => sum + s.likes, 0)
  const totalViews = userSketches.value.reduce((sum, s) => sum + s.views, 0)
  
  return { total, pending, approved, rejected, totalLikes, totalViews }
})

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'approved': return 'status-approved'
    case 'pending': return 'status-pending'
    case 'rejected': return 'status-rejected'
    case 'draft': return 'status-draft'
    default: return ''
  }
}

const statusText = (status: string) => {
  switch (status) {
    case 'approved': return '✅ Одобрен'
    case 'pending': return '⏳ На модерации'
    case 'rejected': return '❌ Отклонён'
    case 'draft': return '📝 Черновик'
    default: return status
  }
}
</script>

<template>
  <div class="profile-page">
    <!-- Уведомление -->
    <Transition name="fade">
      <div v-if="notification" :class="['notification', notification.type]">
        {{ notification.message }}
      </div>
    </Transition>

    <!-- Заголовок -->
    <header class="profile-header">
      <button @click="$router.push('/')" class="back-btn">
        ← Назад к редактору
      </button>
      <h1 class="page-title">
        <span class="title-icon">👤</span>
        Профиль
      </h1>
    </header>

    <!-- Контент -->
    <div v-if="isAuthenticated && user && profile" class="profile-content">
      <!-- Карточка профиля -->
      <div class="profile-card">
        <!-- Аватар -->
        <div class="avatar-section">
          <div class="avatar-wrapper" @click="handleAvatarClick">
            <img :src="avatarUrl" :alt="displayName" class="avatar" />
            <div class="avatar-overlay">
              <span>📷</span>
            </div>
          </div>
          <input
            ref="avatarInput"
            type="file"
            accept="image/*"
            hidden
            @change="handleAvatarChange"
          />
          <p class="avatar-hint">Кликните для изменения</p>
        </div>

        <!-- Информация -->
        <div class="profile-info">
          <div v-if="!isEditing" class="view-mode">
            <h2 class="profile-name">{{ displayName }}</h2>
            <p class="profile-email">{{ user.email }}</p>
            <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>
            <div class="profile-meta">
              <span class="meta-item">
                <span class="meta-icon">📅</span>
                {{ new Date(profile.created_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' }) }}
              </span>
              <span class="meta-item role-badge" :class="`role-${profile.role}`">
                {{ profile.role === 'admin' ? '🛡️ Админ' : profile.role === 'moderator' ? '✅ Модератор' : '👤 Пользователь' }}
              </span>
            </div>
            <button @click="startEditing" class="edit-btn">
              ✏️ Редактировать профиль
            </button>
          </div>

          <div v-else class="edit-mode">
            <div class="form-group">
              <label class="form-label">Имя</label>
              <input
                v-model="editForm.display_name"
                type="text"
                class="form-input"
                placeholder="Ваше имя"
                :disabled="uploading || uploadingAvatar"
              />
            </div>
            <div class="form-group">
              <label class="form-label">О себе</label>
              <textarea
                v-model="editForm.bio"
                class="form-textarea"
                placeholder="Расскажите о себе"
                rows="4"
                :disabled="uploading || uploadingAvatar"
              ></textarea>
            </div>
            <div class="edit-actions">
              <button @click="cancelEditing" class="cancel-btn" :disabled="uploading">
                Отмена
              </button>
              <button @click="saveProfile" class="save-btn" :disabled="uploading || uploadingAvatar">
                {{ uploading || uploadingAvatar ? 'Сохранение...' : 'Сохранить' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Статистика -->
      <div class="stats-section">
        <div class="stat-card">
          <span class="stat-value">{{ stats.total }}</span>
          <span class="stat-label">Всего скетчей</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" style="color: #64c864">{{ stats.approved }}</span>
          <span class="stat-label">Одобренные</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" style="color: #ffc864">{{ stats.pending }}</span>
          <span class="stat-label">На модерации</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" style="color: #ff6464">{{ stats.rejected }}</span>
          <span class="stat-label">Отклонённые</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" style="color: #667eea">{{ stats.totalLikes }}</span>
          <span class="stat-label">Лайков</span>
        </div>
        <div class="stat-card">
          <span class="stat-value" style="color: #764ba2">{{ stats.totalViews }}</span>
          <span class="stat-label">Просмотров</span>
        </div>
      </div>

      <!-- Скетчи пользователя -->
      <div class="sketches-section">
        <div class="tabs-header">
          <h2 class="section-title">📁 Мои скетчи</h2>
          <div class="tabs">
            <button
              @click="filterByStatus('all')"
              class="tab-btn"
              :class="{ active: activeTab === 'all' }"
            >
              Все ({{ stats.total }})
            </button>
            <button
              @click="filterByStatus('pending')"
              class="tab-btn"
              :class="{ active: activeTab === 'pending' }"
            >
              ⏳ На модерации
            </button>
            <button
              @click="filterByStatus('approved')"
              class="tab-btn"
              :class="{ active: activeTab === 'approved' }"
            >
              ✅ Одобрены
            </button>
            <button
              @click="filterByStatus('rejected')"
              class="tab-btn"
              :class="{ active: activeTab === 'rejected' }"
            >
              ❌ Отклонены
            </button>
          </div>
        </div>

        <!-- Загрузка -->
        <div v-if="loading" class="loading-state">
          <span class="loading-spinner">⏳</span>
          <p>Загрузка скетчей...</p>
        </div>

        <!-- Список скетчей -->
        <div v-else-if="userSketches.length > 0" class="sketches-list">
          <div
            v-for="sketch in userSketches"
            :key="sketch.id"
            class="sketch-item"
          >
            <div class="sketch-preview" @click="openSketch(sketch.id)">
              <img
                v-if="sketch.thumbnail_url"
                :src="sketch.thumbnail_url"
                :alt="sketch.title"
                class="sketch-thumbnail"
              />
              <div v-else class="thumbnail-placeholder">
                <span>🎨</span>
              </div>
            </div>
            <div class="sketch-details">
              <h3 class="sketch-title">{{ sketch.title }}</h3>
              <p class="sketch-description">{{ sketch.description }}</p>
              <div class="sketch-meta">
                <span :class="['status-badge', statusBadgeClass(sketch.status)]">
                  {{ statusText(sketch.status) }}
                </span>
                <span class="sketch-date">{{ formatDate(sketch.created_at) }}</span>
              </div>
              <div class="sketch-stats">
                <span>❤️ {{ sketch.likes }}</span>
                <span>👁️ {{ sketch.views }}</span>
              </div>
              <div class="sketch-actions">
                <button @click="openSketch(sketch.id)" class="action-btn view-btn" title="Просмотр">
                  👁️
                </button>
                <button
                  v-if="sketch.status === 'approved' || sketch.status === 'draft'"
                  @click="openSketchInEditor(sketch.id)"
                  class="action-btn edit-btn"
                  title="Открыть в редакторе"
                >
                  ✏️ Редактировать
                </button>
                <button
                  @click="confirmDelete(sketch.id)"
                  class="action-btn delete-btn"
                  title="Удалить скетч"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Нет скетчей -->
        <div v-else class="no-sketches">
          <span class="no-sketches-icon">📭</span>
          <h3>У вас пока нет скетчей</h3>
          <p>Создайте первый скетч в редакторе и опубликуйте его</p>
          <button @click="$router.push('/')" class="create-sketch-btn">
            🎨 Создать скетч
          </button>
        </div>
      </div>
    </div>

    <!-- Не авторизован -->
    <div v-else class="not-auth">
      <span class="not-auth-icon">🔐</span>
      <h2>Требуется авторизация</h2>
      <p>Для просмотра профиля необходимо войти в систему</p>
      <button @click="$router.push('/')" class="login-btn">
        Войти в систему
      </button>
    </div>

    <!-- Модальное окно подтверждения удаления -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
          <div class="modal" @click.stop>
            <div class="modal-header">
              <h3>🗑️ Удаление скетча</h3>
              <button @click="closeDeleteModal" class="modal-close">&times;</button>
            </div>
            <div class="modal-content">
              <p>Вы уверены, что хотите удалить этот скетч?</p>
              <p class="warning">⚠️ Это действие нельзя отменить</p>
            </div>
            <div class="modal-actions">
              <button @click="closeDeleteModal" class="modal-btn cancel-btn" :disabled="isDeleting">
                Отмена
              </button>
              <button @click="handleDeleteSketch" class="modal-btn delete-btn" :disabled="isDeleting">
                {{ isDeleting ? '⏳ Удаление...' : '🗑️ Удалить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #ffffff;
  padding-bottom: 3rem;
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
.profile-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem 3rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.back-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-2px);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-icon {
  font-size: 2rem;
  -webkit-text-fill-color: initial;
}

/* Контент */
.profile-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Карточка профиля */
.profile-card {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.avatar-wrapper {
  position: relative;
  width: 180px;
  height: 180px;
  cursor: pointer;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(102, 126, 234, 0.5);
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.profile-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.view-mode {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.profile-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #fff;
}

.profile-email {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.profile-bio {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0.5rem 0;
  line-height: 1.6;
}

.profile-meta {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  margin: 0.5rem 0;
}

.meta-item {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-icon {
  font-size: 1.1rem;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.role-admin {
  background: rgba(139, 92, 246, 0.2);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.3);
}

.role-moderator {
  background: rgba(102, 126, 234, 0.2);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.role-user {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.edit-btn {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
}

.edit-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.form-input,
.form-textarea {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.15);
}

.form-textarea {
  resize: vertical;
}

.edit-actions {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.cancel-btn,
.save-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
}

.save-btn:hover:not(:disabled) {
  transform: scale(1.02);
}

.cancel-btn:disabled,
.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Статистика */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Скетчи */
.sketches-section {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
}

.tabs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

/* Загрузка */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.loading-spinner {
  font-size: 3rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.1); }
}

/* Список скетчей */
.sketches-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sketch-item {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.sketch-item:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
  transform: translateX(5px);
}

.sketch-preview {
  flex-shrink: 0;
}

.sketch-thumbnail {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.thumbnail-placeholder {
  width: 100%;
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
}

.sketch-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sketch-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: #fff;
}

.sketch-description {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sketch-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-top: auto;
}

.sketch-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.action-btn {
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.view-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.view-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.edit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.edit-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-approved {
  background: rgba(100, 200, 100, 0.2);
  color: #64c864;
}

.status-pending {
  background: rgba(255, 200, 100, 0.2);
  color: #ffc864;
}

.status-rejected {
  background: rgba(255, 100, 100, 0.2);
  color: #ff6464;
}

.status-draft {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
}

.sketch-date {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.sketch-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.sketch-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.action-btn {
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.view-btn {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.view-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.edit-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.edit-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* Нет скетчей */
.no-sketches {
  text-align: center;
  padding: 3rem 2rem;
}

.no-sketches-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.no-sketches h3 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: #fff;
}

.no-sketches p {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
}

.create-sketch-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.create-sketch-btn:hover {
  transform: scale(1.05);
}

/* Не авторизован */
.not-auth {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
}

.not-auth-icon {
  font-size: 5rem;
}

.not-auth h2 {
  font-size: 1.75rem;
  margin: 0;
  color: #fff;
}

.not-auth p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 1.1rem;
}

.login-btn {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

/* Адаптивность */
@media (max-width: 900px) {
  .profile-card {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .avatar-section {
    margin-bottom: 1rem;
  }

  .profile-meta {
    justify-content: center;
  }

  .edit-btn {
    align-self: center;
  }

  .sketch-item {
    grid-template-columns: 1fr;
  }

  .sketch-preview {
    width: 100%;
  }

  .sketch-thumbnail,
  .thumbnail-placeholder {
    height: 180px;
  }
}

@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 1.5rem;
  }

  .profile-content {
    padding: 1rem;
  }

  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .tabs-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .tabs {
    width: 100%;
  }

  .tab-btn {
    flex: 1;
    text-align: center;
  }
}

/* Модальное окно удаления */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header h3 {
  font-size: 1.25rem;
  margin: 0;
  color: #fff;
}

.modal-close {
  background: none;
  border: none;
  font-size: 2rem;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.2s;
}

.modal-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.modal-content {
  padding: 1.5rem;
}

.modal-content p {
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
}

.modal-content .warning {
  color: #ef4444;
  font-weight: 600;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-btn {
  flex: 1;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cancel-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.modal-btn.delete-btn {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #fff;
}

.modal-btn.delete-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
}

.modal-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
