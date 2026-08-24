<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSketches } from '../composables/useSketches'
import { useStorage } from '../composables/useStorage'
import type { Sketch, SketchWithProfile } from '../types/supabase'

const router = useRouter()
const { user, profile, session, isAuthenticated, updateProfile, uploadAvatar, isReady, readyPromise, isModerator, isAdmin } = useAuth()
const { getUserSketches, getPendingSketches, deleteSketch } = useSketches()
const { uploadAvatar: uploadAvatarStorage, uploading: uploadingAvatar } = useStorage()

// Тема (синхронизация с редактором)
type Theme = 'dark' | 'light'
const currentTheme = ref<Theme>('dark')

function syncThemeFromStorage() {
  const savedTheme = localStorage.getItem('p5editor-theme') as Theme | null
  if (savedTheme === 'dark' || savedTheme === 'light') {
    currentTheme.value = savedTheme
  }
}

const themeClass = computed(() =>
  currentTheme.value === 'dark' ? 'theme-dark' : 'theme-light'
)

// Состояние
const loading = ref(false)
const userSketches = ref<SketchWithProfile[]>([])
const activeTab = ref<'all' | 'pending' | 'approved' | 'rejected' | 'draft'>('all')
const pendingSketchesCount = ref(0)

// Ракурс отображения списка скетчей: плитки или строки
const viewMode = ref<'grid' | 'list'>('grid')

// Редактирование профиля
const isEditing = ref(false)
const editForm = ref({ display_name: '', bio: '' })
const avatarInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const notification = ref<{ message: string; type: 'success' | 'error' } | null>(null)

// Удаление скетча
const showDeleteModal = ref(false)
const sketchToDelete = ref<string | null>(null)
const isDeleting = ref(false)

// Загрузка данных
onMounted(async () => {
  syncThemeFromStorage()

  if (!isReady.value && readyPromise.value) {
    await readyPromise.value
  }

  if (!user.value && !session.value) {
    router.push('/')
    return
  }

  await loadUserSketches()
})

async function loadUserSketches(status?: string) {
  if (!user.value) return
  loading.value = true
  const result = await getUserSketches(user.value.id, status as any)
  if (result.success) {
    userSketches.value = result.data || []
  }

  if (isModerator.value) {
    const pendingResult = await getPendingSketches()
    if (pendingResult.success) {
      pendingSketchesCount.value = pendingResult.data?.length || 0
    }
  }

  loading.value = false
}

function filterByStatus(status: 'all' | 'pending' | 'approved' | 'rejected' | 'draft') {
  activeTab.value = status
  loadUserSketches(status === 'all' ? undefined : status)
}

// Переключение ракурса выполняется напрямую через viewMode в шаблоне

function navigateTo(path: string) {
  router.push(path)
}

function openSketch(id: string) {
  const currentHash = window.location.hash.replace('#', '') || '/my-programs'
  sessionStorage.setItem('sketch_previous_route', currentHash)
  router.push(`/sketch/${id}`)
}

function openSketchInEditor(id: string) {
  localStorage.setItem('p5editor_current_sketch_id', id)
  localStorage.setItem('p5editor_load_sketch_id', id)
  router.push({ path: '/', query: { sketch: id, t: Date.now() } })
}

async function copySketchLink(id: string) {
  const baseUrl = window.location.origin + window.location.pathname
  const sketchUrl = `${baseUrl}#/sketch/${id}`
  try {
    await navigator.clipboard.writeText(sketchUrl)
    showNotification('Ссылка скопирована в буфер обмена', 'success')
  } catch (err) {
    const textarea = document.createElement('textarea')
    textarea.value = sketchUrl
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    showNotification('Ссылка скопирована в буфер обмена', 'success')
  }
}

function confirmDelete(sketchId: string) {
  sketchToDelete.value = sketchId
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  sketchToDelete.value = null
}

async function handleDeleteSketch() {
  if (!sketchToDelete.value || !user.value) return
  isDeleting.value = true
  try {
    const result = await deleteSketch(sketchToDelete.value)
    if (result.success) {
      showNotification('Скетч удалён', 'success')
      closeDeleteModal()
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

// Редактирование профиля
function startEditing() {
  editForm.value = {
    display_name: profile.value?.display_name || '',
    bio: profile.value?.bio || ''
  }
  isEditing.value = true
}

function cancelEditing() {
  isEditing.value = false
}

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

function handleAvatarClick() {
  avatarInput.value?.click()
}

function showNotification(message: string, type: 'success' | 'error') {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  })
}

const displayName = computed(() => {
  return profile.value?.display_name || user.value?.email?.split('@')[0] || 'Аноним'
})

const avatarUrl = computed(() => {
  return profile.value?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=42b883&color=fff&size=128`
})

// Статистика (минималистичные блоки)
const stats = computed(() => {
  const total = userSketches.value.length
  const approved = userSketches.value.filter(s => s.status === 'approved').length
  const pending = userSketches.value.filter(s => s.status === 'pending').length
  const rejected = userSketches.value.filter(s => s.status === 'rejected').length
  const totalLikes = userSketches.value.reduce((sum, s) => sum + s.likes, 0)
  const totalViews = userSketches.value.reduce((sum, s) => sum + s.views, 0)
  return { total, approved, pending, rejected, totalLikes, totalViews }
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

// В режиме плиток показываем не более 42 на странице
const GRID_PAGE_LIMIT = 42
const visibleSketches = computed(() => {
  if (viewMode.value === 'grid' && userSketches.value.length > GRID_PAGE_LIMIT) {
    return userSketches.value.slice(0, GRID_PAGE_LIMIT)
  }
  return userSketches.value
})
</script>

<template>
  <div :class="['my-programs', themeClass]">
    <!-- Уведомление -->
    <Transition name="fade">
      <div v-if="notification" :class="['notification', notification.type]">
        {{ notification.message }}
      </div>
    </Transition>

    <!-- Заголовок -->
    <header class="mp-header">
      <button @click="$router.push('/')" class="back-btn">
        ← Назад к редактору
      </button>
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">📂</span>
          Мои программы
        </h1>
        <p class="page-subtitle">{{ displayName }}</p>
      </div>

      <!-- Блоки статистики -->
      <div class="stats-layout">
        <!-- Минималистичные блоки статистики -->
        <div class="stats-grid">
          <div class="stat-block" v-if="stats.total > 0">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">Всего</span>
          </div>
          <div class="stat-block stat-pending" v-if="stats.pending > 0">
            <span class="stat-value">{{ stats.pending }}</span>
            <span class="stat-label">На модерации</span>
          </div>
          <div class="stat-block stat-rejected" v-if="stats.rejected > 0">
            <span class="stat-value">{{ stats.rejected }}</span>
            <span class="stat-label">Отклонено</span>
          </div>
          <div class="stat-block stat-likes" v-if="stats.totalLikes > 0">
            <span class="stat-value">{{ stats.totalLikes }}</span>
            <span class="stat-label">❤️ Лайки</span>
          </div>
          <div class="stat-block stat-views" v-if="stats.totalViews > 0">
            <span class="stat-value">{{ stats.totalViews }}</span>
            <span class="stat-label">👁️ Просмотры</span>
          </div>
        </div>
      </div>
    </header>

    <div v-if="isAuthenticated && user && profile" class="mp-content">
      <!-- Скетчи -->
      <div class="sketches-section">
        <div class="tabs-header">
          <div class="tabs">
            <button @click="filterByStatus('all')" class="tab-btn" :class="{ active: activeTab === 'all' }">Все ({{ stats.total }})</button>
            <button @click="filterByStatus('pending')" class="tab-btn" :class="{ active: activeTab === 'pending' }">⏳ На модерации</button>
            <button @click="filterByStatus('approved')" class="tab-btn" :class="{ active: activeTab === 'approved' }">✅ Одобрены</button>
            <button @click="filterByStatus('rejected')" class="tab-btn" :class="{ active: activeTab === 'rejected' }">❌ Отклонены</button>
          </div>
          <!-- Переключатель ракурсов вывода списка скетчей -->
          <div class="view-toggle" role="group" aria-label="Ракурс отображения скетчей">
            <button
              class="view-toggle-btn"
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
              title="Плитки"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
              </svg>
            </button>
            <button
              class="view-toggle-btn"
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
              title="Строки"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M3 5h18v3H3V5zm0 5h18v3H3v-3zm0 5h18v3H3v-3z"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          <span class="loading-spinner">⏳</span>
          <p>Загрузка скетчей...</p>
        </div>

        <!-- Плитки -->
        <div v-else-if="userSketches.length > 0 && viewMode === 'grid'" class="sketches-grid">
          <div
            v-for="sketch in visibleSketches"
            :key="sketch.id"
            class="sketch-card"
          >
            <div class="sketch-thumbnail" @click="openSketch(sketch.id)">
              <img v-if="sketch.thumbnail_url" :src="sketch.thumbnail_url" :alt="sketch.title" class="thumbnail-image" />
              <div v-else class="thumbnail-placeholder"><span>🎨</span></div>
            </div>
            <div class="sketch-info">
              <h3 class="sketch-title" @click="openSketch(sketch.id)">{{ sketch.title }}</h3>
              <p class="sketch-desc">{{ sketch.description }}</p>
              <div class="sketch-meta">
                <span class="sketch-date">{{ formatDate(sketch.created_at) }}</span>
                <span class="sketch-stats">❤️ {{ sketch.likes }} 👁️ {{ sketch.views }}</span>
              </div>
            </div>
          </div>
          <p v-if="userSketches.length > GRID_PAGE_LIMIT" class="grid-more-hint">
            Показано {{ visibleSketches.length }} из {{ userSketches.length }}. Переключитесь в режим строк для полного списка.
          </p>
        </div>

        <!-- Строки -->
        <div v-else-if="userSketches.length > 0 && viewMode === 'list'" class="sketches-table">
          <div v-for="sketch in visibleSketches" :key="sketch.id" class="table-row">
            <div class="col-thumbnail">
              <div class="thumbnail-square" @click="openSketch(sketch.id)">
                <img v-if="sketch.thumbnail_url" :src="sketch.thumbnail_url" :alt="sketch.title" class="thumbnail-image" />
                <div v-else class="thumbnail-placeholder-square"><span>🎨</span></div>
              </div>
            </div>
            <div class="col-title">
              <div class="title-content" @click="openSketch(sketch.id)">
                <h3 class="row-title">{{ sketch.title }}</h3>
                <p class="row-description">{{ sketch.description }}</p>
              </div>
            </div>
            <div class="col-status">
              <span :class="['status-badge', statusBadgeClass(sketch.status)]">{{ statusText(sketch.status) }}</span>
            </div>
            <div class="col-date">{{ formatDate(sketch.created_at) }}</div>
            <div class="col-stats">
              <span class="stat-icon">❤️ {{ sketch.likes }}</span>
              <span class="stat-icon">👁️ {{ sketch.views }}</span>
            </div>
            <div class="col-actions">
              <button @click="openSketchInEditor(sketch.id)" class="icon-btn" title="Открыть в редакторе">📝</button>
              <button @click="copySketchLink(sketch.id)" class="icon-btn link-btn" title="Копировать ссылку">🔗</button>
              <button @click="confirmDelete(sketch.id)" class="icon-btn delete-btn" title="Удалить">🗑️</button>
            </div>
          </div>
        </div>

        <div v-else class="no-sketches">
          <span class="no-sketches-icon">📭</span>
          <h3>У вас пока нет скетчей</h3>
          <p>Создайте первый скетч в редакторе и опубликуйте его</p>
          <button @click="$router.push('/')" class="create-sketch-btn">🎨 Создать скетч</button>
        </div>
      </div>
    </div>

    <div v-else class="not-auth">
      <span class="not-auth-icon">🔐</span>
      <h2>Требуется авторизация</h2>
      <p>Для просмотра «Моих программ» необходимо войти в систему</p>
      <button @click="$router.push('/')" class="login-btn">Войти в систему</button>
    </div>

    <!-- Модальное окно удаления -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showDeleteModal" :class="['modal-overlay', themeClass]" @click="closeDeleteModal">
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
              <button @click="closeDeleteModal" class="modal-btn cancel-btn" :disabled="isDeleting">Отмена</button>
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
/* Темы */
.theme-dark {
  --bg-primary: #1a1a2e;
  --bg-secondary: rgba(255, 255, 255, 0.05);
  --bg-card: rgba(255, 255, 255, 0.05);
  --bg-card-hover: rgba(255, 255, 255, 0.08);
  --border-color: rgba(255, 255, 255, 0.1);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-muted: rgba(255, 255, 255, 0.5);
  --accent-color: #667eea;
  --success-color: #64c864;
  --warning-color: #ffc864;
  --error-color: #ff6464;
  --accent-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --icon-btn-bg: rgba(255, 255, 255, 0.1);
  --icon-btn-border: rgba(255, 255, 255, 0.15);
  --icon-btn-hover-bg: rgba(255, 255, 255, 0.2);
}

.theme-light {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f3f4f6;
  --border-color: #e5e7eb;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --accent-color: #646cff;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --accent-gradient: linear-gradient(135deg, #646cff 0%, #764ba2 100%);
  --icon-btn-bg: rgba(0, 0, 0, 0.04);
  --icon-btn-border: #e5e7eb;
  --icon-btn-hover-bg: rgba(0, 0, 0, 0.08);
}

.my-programs {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding-bottom: 3rem;
  transition: background 0.3s ease, color 0.3s ease;
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
.notification.success { background: #10b981; color: white; }
.notification.error { background: #ef4444; color: white; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Заголовок */
.mp-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.back-btn {
  padding: 0.75rem 1.5rem;
  background: var(--icon-btn-bg);
  border: 1px solid var(--icon-btn-border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.back-btn:hover { background: var(--icon-btn-hover-bg); transform: translateX(-2px); }

.header-content { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
.page-title {
  font-size: 1.225rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.title-icon { font-size: 1.4rem; -webkit-text-fill-color: initial; }
.page-subtitle { font-size: 0.6125rem; color: var(--text-secondary); margin: 0; }

.header-actions { display: flex; gap: 0.5rem; align-items: center; }
.btn-ghost {
  padding: 0.5rem 1rem;
  background: var(--icon-btn-bg);
  border: 1px solid var(--icon-btn-border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}
.btn-ghost:hover { background: var(--icon-btn-hover-bg); }
.moderator-link { border-color: rgba(139, 92, 246, 0.4); }
.pending-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--error-color);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
}

.mp-content { max-width: 1200px; margin: 0 auto; padding: 2rem; }

/* Блок статистики + переключатель */
.stats-layout {
  display: flex;
  align-items: stretch;
  gap: 1.5rem;
  flex: 1;
  min-width: 300px;
  margin-bottom: 0;
}

.view-toggle {
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.5rem;
  justify-content: center;
}
.view-toggle-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--icon-btn-border);
  background: var(--icon-btn-bg);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.view-toggle-btn:hover { background: var(--icon-btn-hover-bg); }
.view-toggle-btn.active {
  background: var(--accent-gradient);
  border-color: transparent;
  color: #fff;
}

.stats-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}
.stat-block {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  text-align: center;
}
.stat-value { font-size: 1.225rem; font-weight: 700; color: var(--accent-color); }
.stat-label { font-size: 0.525rem; color: var(--text-secondary); }
.stat-block.stat-approved { border-color: rgba(100, 200, 100, 0.4); background: rgba(100, 200, 100, 0.08); }
.stat-block.stat-approved .stat-value { color: var(--success-color); }
.stat-block.stat-pending { border-color: rgba(255, 200, 100, 0.4); background: rgba(255, 200, 100, 0.08); }
.stat-block.stat-pending .stat-value { color: var(--warning-color); }
.stat-block.stat-rejected { border-color: rgba(255, 100, 100, 0.4); background: rgba(255, 100, 100, 0.08); }
.stat-block.stat-rejected .stat-value { color: var(--error-color); }
.stat-block.stat-likes .stat-value { color: var(--accent-color); }
.stat-block.stat-views .stat-value { color: #764ba2; }

/* Карточка профиля */
.profile-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}
.profile-header-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.avatar-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  cursor: pointer;
  flex-shrink: 0;
}
.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--accent-color);
}
.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }
.profile-meta-info { flex: 1; min-width: 0; }
.profile-name { font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--text-primary); }
.profile-email { font-size: 0.9rem; color: var(--text-secondary); margin: 0.25rem 0 0; }
.profile-bio { font-size: 0.9rem; color: var(--text-secondary); margin: 0.5rem 0 0; }
.edit-btn {
  padding: 0.5rem 1rem;
  background: var(--icon-btn-bg);
  border: 1px solid var(--icon-btn-border);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.edit-btn:hover { background: var(--icon-btn-hover-bg); }

.profile-card-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  margin-left: auto;
}

.edit-mode { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-label { font-size: 0.9rem; font-weight: 500; color: var(--text-primary); }
.form-input, .form-textarea {
  padding: 0.6rem 0.9rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-family: inherit;
}
.form-input:focus, .form-textarea:focus { outline: none; border-color: var(--accent-color); }
.form-textarea { resize: vertical; }
.edit-actions { display: flex; gap: 0.75rem; }
.cancel-btn, .save-btn {
  flex: 1;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.cancel-btn { background: var(--icon-btn-bg); border: 1px solid var(--icon-btn-border); color: var(--text-primary); }
.cancel-btn:hover:not(:disabled) { background: var(--icon-btn-hover-bg); }
.save-btn { background: var(--accent-gradient); border: none; color: #fff; }
.save-btn:hover:not(:disabled) { transform: scale(1.02); }
.cancel-btn:disabled, .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Скетчи */
.sketches-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
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
.section-title { font-size: 1.25rem; font-weight: 600; margin: 0; color: var(--text-primary); }
.tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.tab-btn {
  padding: 0.5rem 1rem;
  background: var(--icon-btn-bg);
  border: 1px solid var(--icon-btn-border);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn:hover { background: var(--icon-btn-hover-bg); }
.tab-btn.active { background: var(--accent-gradient); border-color: transparent; color: #fff; }

.view-switch-btn {
  padding: 0.5rem 1rem;
  background: var(--accent-gradient);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.view-switch-btn:hover { transform: scale(1.03); }

.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 3rem; gap: 1rem; color: var(--text-secondary);
}
.loading-spinner { font-size: 3rem; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }

/* Плитки */
.sketches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}
.sketch-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
}
.sketch-card:hover { border-color: var(--accent-color); transform: translateY(-2px); }
.sketch-thumbnail {
  position: relative;
  height: 140px;
  overflow: hidden;
  cursor: pointer;
}
.thumbnail-image { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
.sketch-card:hover .thumbnail-image { transform: scale(1.05); }
.thumbnail-placeholder {
  width: 100%; height: 100%;
  background: var(--accent-gradient);
  display: flex; align-items: center; justify-content: center; font-size: 2rem;
}
.status-badge {
  padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; display: inline-block;
}
.sketch-info { padding: 0.875rem; flex: 1; display: flex; flex-direction: column; }
.sketch-title { font-size: 0.95rem; font-weight: 600; margin: 0 0 0.35rem; color: var(--text-primary); cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sketch-desc { font-size: 0.8rem; color: var(--text-muted); margin: 0 0 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; }
.sketch-meta { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary); margin-top: auto; }
.sketch-stats { white-space: nowrap; }
.sketch-actions { display: flex; gap: 0.5rem; }
.grid-more-hint { font-size: 0.8rem; color: var(--text-secondary); text-align: center; margin-top: 1rem; }
.icon-btn {
  flex: 1;
  height: 36px;
  border-radius: 6px;
  border: 1px solid var(--icon-btn-border);
  background: var(--icon-btn-bg);
  color: var(--text-primary);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.icon-btn:hover { background: var(--icon-btn-hover-bg); }
.icon-btn.link-btn { border-color: rgba(102, 126, 234, 0.3); color: #667eea; }
.icon-btn.delete-btn { border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }
.icon-btn.delete-btn:hover { background: rgba(239, 68, 68, 0.2); }

/* Строки */
.sketches-table { display: flex; flex-direction: column; gap: 0; }
.table-row {
  display: grid;
  grid-template-columns: 100px 1fr 140px 120px 100px 140px;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  transition: all 0.2s;
  align-items: center;
}
.table-row:first-of-type { border-radius: 8px 8px 0 0; }
.table-row:last-of-type { border-radius: 0 0 8px 8px; }
.table-row:only-of-type { border-radius: 8px; }
.table-row + .table-row { border-top: 1px solid var(--border-color); }
.table-row:hover { background: var(--bg-card-hover); border-color: var(--accent-color); }
.thumbnail-square { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; cursor: pointer; transition: transform 0.2s; }
.thumbnail-square:hover { transform: scale(1.05); }
.thumbnail-image { width: 100%; height: 100%; object-fit: cover; }
.thumbnail-placeholder-square { width: 100%; height: 100%; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; font-size: 2rem; }
.title-content { cursor: pointer; display: flex; flex-direction: column; gap: 0.25rem; }
.row-title { font-size: 0.95rem; font-weight: 600; margin: 0; color: var(--text-primary); display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
.row-description { font-size: 0.8rem; color: var(--text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; }
.col-status { display: flex; }
.col-date { display: flex; align-items: center; font-size: 0.85rem; color: var(--text-secondary); }
.col-stats { display: flex; flex-direction: column; gap: 0.25rem; align-items: center; justify-content: center; }
.stat-icon { font-size: 0.8rem; color: var(--text-secondary); }
.col-actions { display: flex; gap: 0.5rem; align-items: center; justify-content: center; }

/* Статусы */
.status-approved { background: rgba(100, 200, 100, 0.2); color: var(--success-color); border: 1px solid rgba(100, 200, 100, 0.3); }
.status-pending { background: rgba(255, 200, 100, 0.2); color: var(--warning-color); border: 1px solid rgba(255, 200, 100, 0.3); }
.status-rejected { background: rgba(255, 100, 100, 0.2); color: var(--error-color); border: 1px solid rgba(255, 100, 100, 0.3); }
.status-draft { background: var(--icon-btn-bg); color: var(--text-secondary); border: 1px solid var(--icon-btn-border); }

/* Нет скетчей */
.no-sketches { text-align: center; padding: 3rem 2rem; }
.no-sketches-icon { font-size: 4rem; display: block; margin-bottom: 1rem; }
.no-sketches h3 { font-size: 1.5rem; margin: 0 0 0.5rem; color: var(--text-primary); }
.no-sketches p { color: var(--text-secondary); margin-bottom: 1.5rem; }
.create-sketch-btn {
  padding: 0.75rem 2rem;
  background: var(--accent-gradient);
  border: none; border-radius: 8px; color: #fff; font-size: 1rem; cursor: pointer; transition: all 0.2s;
}
.create-sketch-btn:hover { transform: scale(1.05); }

/* Не авторизован */
.not-auth { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; gap: 1rem; }
.not-auth-icon { font-size: 5rem; }
.not-auth h2 { font-size: 1.75rem; margin: 0; }
.not-auth p { color: var(--text-secondary); margin: 0; }
.login-btn { margin-top: 1rem; padding: 0.75rem 2rem; background: var(--accent-gradient); border: none; border-radius: 8px; color: #fff; font-size: 1rem; font-weight: 600; cursor: pointer; }
.login-btn:hover { transform: scale(1.05); }

/* Модальное окно */
.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
.modal { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 16px; max-width: 400px; width: 100%; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5); color: var(--text-primary); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--border-color); }
.modal-header h3 { font-size: 1.25rem; margin: 0; }
.modal-close { background: none; border: none; font-size: 2rem; color: var(--text-secondary); cursor: pointer; }
.modal-content { padding: 1.5rem; }
.modal-content p { margin: 0 0 1rem; }
.modal-content .warning { color: #ef4444; font-weight: 600; }
.modal-actions { display: flex; gap: 1rem; padding: 1.5rem; border-top: 1px solid var(--border-color); }
.modal-btn { flex: 1; padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; border: none; }
.modal-actions .cancel-btn { background: var(--icon-btn-bg); color: var(--text-primary); border: 1px solid var(--icon-btn-border); }
.modal-btn.delete-btn { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff; }
.modal-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Адаптивность */
@media (max-width: 900px) {
  .mp-header { flex-direction: column; gap: 0.75rem; padding: 0.5rem 1rem; text-align: center; }
  .mp-content { padding: 1rem; }
  .stats-layout { flex-direction: column; }
  .view-toggle { flex-direction: row; }
  .table-header, .table-row { grid-template-columns: 80px 1fr 100px 80px; gap: 0.5rem; }
  .col-date, .col-stats { display: none; }
  .profile-header-row { flex-direction: column; text-align: center; }
}
@media (max-width: 640px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .tabs-header { flex-direction: column; align-items: flex-start; }
  .table-header { display: none; }
  .table-row { grid-template-columns: 1fr; gap: 1rem; padding: 1rem; margin-bottom: 1rem; border-radius: 12px; border: 1px solid var(--border-color); }
  .col-thumbnail { display: flex; justify-content: center; }
  .col-status { align-items: center; justify-content: center; }
  .col-actions { justify-content: center; }
  .col-date, .col-stats { display: flex; justify-content: center; gap: 0.75rem; }
}
</style>
