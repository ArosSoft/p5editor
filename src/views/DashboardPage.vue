<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSketches } from '../composables/useSketches'
import type { Sketch, SketchWithProfile } from '../types/supabase'

const router = useRouter()
const { user, profile, isAuthenticated, isAdmin, isModerator, isReady, readyPromise } = useAuth()
const { getGallerySketches, getUserSketches, getPendingSketches } = useSketches()

// Состояние
const loading = ref(false)
const userSketches = ref<Sketch[]>([])
const recentSketches = ref<SketchWithProfile[]>([])
const pendingSketchesCount = ref(0)

// Тема (синхронизация с редактором)
type Theme = 'dark' | 'light'
const currentTheme = ref<Theme>('dark')

// Загрузка данных
onMounted(async () => {
  // Загрузка темы из localStorage
  const savedTheme = localStorage.getItem('p5editor-theme') as Theme | null
  if (savedTheme === 'dark' || savedTheme === 'light') {
    currentTheme.value = savedTheme
  }

  // Ждём готовности авторизации
  if (!isReady.value && readyPromise.value) {
    await readyPromise.value
  }

  // Проверяем авторизацию через user.value (надёжнее, чем localStorage)
  if (!user.value) {
    router.push('/')
    return
  }

  await loadDashboardData()
})

// Загрузка всех данных
async function loadDashboardData() {
  loading.value = true
  
  // Загрузка скетчей пользователя
  const userSketchesResult = await getUserSketches(user.value!.id)
  if (userSketchesResult.success) {
    userSketches.value = userSketchesResult.data || []
  }
  
  // Загрузка последних скетчей из галереи
  const galleryResult = await getGallerySketches({ page: 1, limit: 5, sortBy: 'new' })
  if (galleryResult.success) {
    recentSketches.value = galleryResult.data || []
  }
  
  // Если модератор - загрузка скетчей на модерации
  if (isModerator.value) {
    const pendingResult = await getPendingSketches()
    if (pendingResult.success) {
      pendingSketchesCount.value = pendingResult.data?.length || 0
    }
  }
  
  loading.value = false
}

// Навигация
function navigateTo(path: string) {
  router.push(path)
}

function openSketch(id: string) {
  router.push(`/sketch/${id}`)
}

// Вычисляемые
const stats = computed(() => {
  const total = userSketches.value.length
  const approved = userSketches.value.filter(s => s.status === 'approved').length
  const pending = userSketches.value.filter(s => s.status === 'pending').length
  const rejected = userSketches.value.filter(s => s.status === 'rejected').length
  const totalLikes = userSketches.value.reduce((sum, s) => sum + s.likes, 0)
  const totalViews = userSketches.value.reduce((sum, s) => sum + s.views, 0)
  
  return { total, approved, pending, rejected, totalLikes, totalViews }
})

const displayName = computed(() => {
  return profile.value?.display_name || user.value?.email?.split('@')[0] || 'Аноним'
})

const avatarUrl = computed(() => {
  return profile.value?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=42b883&color=fff&size=128`
})

// Форматирование даты
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short'
  })
}

// Статус скетча
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
  <div :class="['dashboard', currentTheme === 'dark' ? 'theme-dark' : 'theme-light']">
    <!-- Заголовок -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="page-title">Личный кабинет</h1>
        <p class="page-subtitle">
          {{ displayName }}
        </p>
      </div>
      <div class="header-actions">
        <button @click="navigateTo('/')" class="btn btn-ghost">
          Редактор
        </button>
        <button @click="navigateTo('/profile')" class="btn btn-primary">
          Профиль
        </button>
      </div>
    </header>

    <!-- Контент -->
    <div v-if="isAuthenticated && user && profile" class="dashboard-content">
      <!-- Быстрые действия -->
      <div class="quick-actions">
        <button @click="navigateTo('/')" class="action-card">
          <span class="action-icon">🎨</span>
          <span class="action-label">Создать скетч</span>
        </button>
        <button @click="navigateTo('/share')" class="action-card">
          <span class="action-icon">📤</span>
          <span class="action-label">Опубликовать</span>
        </button>
        <button @click="navigateTo('/explore')" class="action-card">
          <span class="action-icon">🌍</span>
          <span class="action-label">Галерея</span>
        </button>
        <button
          v-if="isModerator"
          @click="navigateTo('/admin')"
          class="action-card moderator-card"
        >
          <span class="action-icon">🛡️</span>
          <span class="action-label">Модерация</span>
          <span v-if="pendingSketchesCount > 0" class="pending-badge">
            {{ pendingSketchesCount }}
          </span>
        </button>
      </div>

      <!-- Статистика -->
      <div class="stats-section">
        <h2 class="section-title">Статистика</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ stats.total }}</span>
            <span class="stat-label">Всего скетчей</span>
          </div>
          <div class="stat-card stat-approved">
            <span class="stat-value">{{ stats.approved }}</span>
            <span class="stat-label">Одобренные</span>
          </div>
          <div class="stat-card stat-pending">
            <span class="stat-value">{{ stats.pending }}</span>
            <span class="stat-label">На модерации</span>
          </div>
          <div class="stat-card stat-rejected">
            <span class="stat-value">{{ stats.rejected }}</span>
            <span class="stat-label">Отклонённые</span>
          </div>
          <div class="stat-card stat-likes">
            <span class="stat-value">{{ stats.totalLikes }}</span>
            <span class="stat-label">Лайки</span>
          </div>
          <div class="stat-card stat-views">
            <span class="stat-value">{{ stats.totalViews }}</span>
            <span class="stat-label">Просмотры</span>
          </div>
        </div>
      </div>

      <!-- Мои скетчи -->
      <div class="sketches-section">
        <div class="section-header">
          <h2 class="section-title">Мои скетчи</h2>
          <button @click="navigateTo('/profile')" class="btn btn-text">
            Все скетчи →
          </button>
        </div>

        <div v-if="loading" class="loading-state">
          <span class="loading-spinner"></span>
          <p>Загрузка...</p>
        </div>

        <div v-else-if="userSketches.length > 0" class="sketches-grid">
          <div
            v-for="sketch in userSketches.slice(0, 6)"
            :key="sketch.id"
            class="sketch-card"
            @click="openSketch(sketch.id)"
          >
            <div class="sketch-thumbnail">
              <img
                v-if="sketch.thumbnail_url"
                :src="sketch.thumbnail_url"
                :alt="sketch.title"
                class="thumbnail-image"
              />
              <div v-else class="thumbnail-placeholder">
                <span>🎨</span>
              </div>
            </div>
            <div class="sketch-info">
              <h3 class="sketch-title">{{ sketch.title }}</h3>
              <div class="sketch-meta">
                <span :class="['status-badge', statusBadgeClass(sketch.status)]">
                  {{ statusText(sketch.status).replace(/[✅⏳❌📝] /g, '') }}
                </span>
                <span class="sketch-date">{{ formatDate(sketch.created_at) }}</span>
              </div>
              <div class="sketch-stats">
                <span>❤️ {{ sketch.likes }}</span>
                <span>👁️ {{ sketch.views }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="no-sketches">
          <span class="no-sketches-icon">📭</span>
          <h3>У вас пока нет скетчей</h3>
          <p>Создайте первый скетч в редакторе</p>
          <button @click="navigateTo('/')" class="btn btn-primary">
            Создать скетч
          </button>
        </div>
      </div>

      <!-- Новое в галерее -->
      <div class="gallery-section">
        <div class="section-header">
          <h2 class="section-title">Новое в галерее</h2>
          <button @click="navigateTo('/explore')" class="btn btn-text">
            Вся галерея →
          </button>
        </div>

        <div class="gallery-grid">
          <div
            v-for="sketch in recentSketches"
            :key="sketch.id"
            class="gallery-card"
            @click="openSketch(sketch.id)"
          >
            <div class="gallery-thumbnail">
              <img
                v-if="sketch.thumbnail_url"
                :src="sketch.thumbnail_url"
                :alt="sketch.title"
                class="gallery-image"
              />
              <div v-else class="gallery-placeholder">
                <span>🎨</span>
              </div>
            </div>
            <div class="gallery-info">
              <h3 class="gallery-title">{{ sketch.title }}</h3>
              <p class="gallery-author">
                {{ sketch.profiles?.display_name || 'Аноним' }}
              </p>
              <div class="gallery-stats">
                <span>❤️ {{ sketch.likes }}</span>
                <span>👁️ {{ sketch.views }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Не авторизован -->
    <div v-else class="not-auth">
      <span class="not-auth-icon">🔐</span>
      <h2>Требуется авторизация</h2>
      <p>Для просмотра личного кабинета необходимо войти в систему</p>
      <button @click="navigateTo('/')" class="btn btn-primary">
        Войти в систему
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Переменные тем */
.theme-dark {
  --bg-primary: #1a1a1a;
  --bg-secondary: rgba(30, 30, 30, 0.8);
  --bg-card: rgba(255, 255, 255, 0.05);
  --bg-card-hover: rgba(255, 255, 255, 0.08);
  --border-color: rgba(255, 255, 255, 0.1);
  --border-focus: #646cff;
  --text-primary: #ffffff;
  --text-secondary: #aaaaaa;
  --text-muted: #666666;
  --accent-color: #646cff;
  --accent-hover: #7a85ff;
  --accent-soft: rgba(100, 108, 255, 0.1);
  --accent-soft-border: rgba(100, 108, 255, 0.4);
  --success-color: #10b981;
  --success-bg: rgba(16, 185, 129, 0.1);
  --success-border: rgba(16, 185, 129, 0.4);
  --warning-color: #f59e0b;
  --warning-bg: rgba(245, 158, 11, 0.1);
  --warning-border: rgba(245, 158, 11, 0.4);
  --error-color: #ef4444;
  --error-bg: rgba(239, 68, 68, 0.1);
  --error-border: rgba(239, 68, 68, 0.4);
  --purple-color: #8b5cf6;
  --purple-bg: rgba(139, 92, 246, 0.1);
  --purple-border: rgba(139, 92, 246, 0.4);
}

.theme-light {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f3f4f6;
  --border-color: #e5e7eb;
  --border-focus: #646cff;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --accent-color: #646cff;
  --accent-hover: #7a85ff;
  --accent-soft: rgba(100, 108, 255, 0.1);
  --accent-soft-border: rgba(100, 108, 255, 0.4);
  --success-color: #10b981;
  --success-bg: #f0fdf4;
  --success-border: #10b981;
  --warning-color: #f59e0b;
  --warning-bg: #fffbeb;
  --warning-border: #f59e0b;
  --error-color: #ef4444;
  --error-bg: #fef2f2;
  --error-border: #ef4444;
  --purple-color: #8b5cf6;
  --purple-bg: #f5f3ff;
  --purple-border: #8b5cf6;
}

/* Основной контейнер */
.dashboard {
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Заголовок */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* Кнопки */
.btn {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: var(--accent-color);
  color: #ffffff;
}

.btn-primary:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.theme-light .btn-ghost {
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-primary);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.14);
  transform: translateY(-1px);
}

.theme-light .btn-ghost:hover {
  background: rgba(0, 0, 0, 0.08);
}

.btn-text {
  background: transparent;
  color: var(--accent-color);
  padding: 0.25rem 0.5rem;
}

.btn-text:hover {
  color: var(--accent-hover);
  text-decoration: underline;
}

/* Контент */
.dashboard-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Быстрые действия */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.action-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-card:hover {
  background: var(--bg-card-hover);
  border-color: var(--accent-color);
  transform: translateY(-2px);
}

.moderator-card {
  border-color: var(--purple-border);
}

.moderator-card:hover {
  border-color: var(--purple-color);
  background: var(--purple-bg);
}

.action-icon {
  font-size: 2rem;
}

.action-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.pending-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: var(--error-color);
  color: #fff;
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
}

/* Статистика */
.stats-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  text-align: center;
}

.stat-card.stat-approved {
  border-color: var(--success-border);
  background: var(--success-bg);
}

.stat-card.stat-pending {
  border-color: var(--warning-border);
  background: var(--warning-bg);
}

.stat-card.stat-rejected {
  border-color: var(--error-border);
  background: var(--error-bg);
}

.stat-card.stat-likes {
  border-color: var(--accent-soft-border);
  background: var(--accent-soft);
}

.stat-card.stat-views {
  border-color: var(--purple-border);
  background: var(--purple-bg);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--accent-color);
}

.stat-card.stat-approved .stat-value {
  color: var(--success-color);
}

.stat-card.stat-pending .stat-value {
  color: var(--warning-color);
}

.stat-card.stat-rejected .stat-value {
  color: var(--error-color);
}

.stat-card.stat-likes .stat-value {
  color: var(--accent-color);
}

.stat-card.stat-views .stat-value {
  color: var(--purple-color);
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--text-secondary);
}

/* Скетчи */
.sketches-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

/* Загрузка */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 0.75rem;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Сетка скетчей */
.sketches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.sketch-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sketch-card:hover {
  border-color: var(--accent-color);
  background: var(--bg-card-hover);
  transform: translateY(-2px);
}

.sketch-thumbnail {
  height: 140px;
  overflow: hidden;
  background: var(--bg-card);
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.sketch-card:hover .thumbnail-image {
  transform: scale(1.05);
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--accent-color) 0%, var(--purple-color) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.sketch-info {
  padding: 0.875rem;
}

.sketch-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sketch-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.status-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.625rem;
  font-weight: 500;
}

.status-approved {
  background: var(--success-bg);
  color: var(--success-color);
}

.status-pending {
  background: var(--warning-bg);
  color: var(--warning-color);
}

.status-rejected {
  background: var(--error-bg);
  color: var(--error-color);
}

.status-draft {
  background: var(--bg-card-hover);
  color: var(--text-secondary);
}

.sketch-date {
  font-size: 0.625rem;
  color: var(--text-muted);
}

.sketch-stats {
  display: flex;
  gap: 0.75rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

/* Нет скетчей */
.no-sketches {
  text-align: center;
  padding: 3rem 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}

.no-sketches-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.75rem;
}

.no-sketches h3 {
  font-size: 1.125rem;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
}

.no-sketches p {
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  font-size: 0.875rem;
}

/* Галерея */
.gallery-section {
  margin-bottom: 2rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.gallery-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
}

.gallery-card:hover {
  border-color: var(--accent-color);
  background: var(--bg-card-hover);
  transform: translateY(-2px);
}

.gallery-thumbnail {
  height: 120px;
  overflow: hidden;
  background: var(--bg-card);
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.gallery-card:hover .gallery-image {
  transform: scale(1.05);
}

.gallery-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--accent-color) 0%, var(--purple-color) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.gallery-info {
  padding: 0.75rem;
}

.gallery-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.375rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-author {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-stats {
  display: flex;
  gap: 0.5rem;
  font-size: 0.6875rem;
  color: var(--text-muted);
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
  font-size: 4rem;
}

.not-auth h2 {
  font-size: 1.25rem;
  margin: 0;
  color: var(--text-primary);
}

.not-auth p {
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.875rem;
}

/* Адаптивность */
@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
    padding: 1rem;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
  }

  .dashboard-content {
    padding: 1rem;
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .sketches-grid,
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
