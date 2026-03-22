<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSketches } from '../composables/useSketches'
import type { Sketch, SketchWithProfile } from '../types/supabase'

const router = useRouter()
const { user, profile, isAuthenticated, isAdmin, isModerator } = useAuth()
const { getGallerySketches, getUserSketches, getPendingSketches } = useSketches()

// Состояние
const loading = ref(false)
const userSketches = ref<Sketch[]>([])
const recentSketches = ref<SketchWithProfile[]>([])
const pendingSketchesCount = ref(0)

// Загрузка данных
onMounted(async () => {
  // Проверяем localStorage, так как initAuth может ещё работать
  const userRole = localStorage.getItem('user_role')
  const isAuth = userRole === 'user' || userRole === 'moderator' || userRole === 'admin'
  
  if (!isAuth) {
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
  <div class="dashboard-page">
    <!-- Заголовок -->
    <header class="dashboard-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">📊</span>
          Личный кабинет
        </h1>
        <p class="page-subtitle">
          Добро пожаловать, {{ displayName }}!
        </p>
      </div>
      <div class="header-actions">
        <button @click="navigateTo('/')" class="header-btn">
          🏠 В редактор
        </button>
        <button @click="navigateTo('/profile')" class="header-btn profile-btn">
          👤 Профиль
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
        <h2 class="section-title">📈 Моя статистика</h2>
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
            <span class="stat-label">Всего лайков</span>
          </div>
          <div class="stat-card stat-views">
            <span class="stat-value">{{ stats.totalViews }}</span>
            <span class="stat-label">Всего просмотров</span>
          </div>
        </div>
      </div>

      <!-- Последние скетчи пользователя -->
      <div class="sketches-section">
        <div class="section-header">
          <h2 class="section-title">📁 Мои скетчи</h2>
          <button @click="navigateTo('/profile')" class="view-all-btn">
            Все скетчи →
          </button>
        </div>

        <div v-if="loading" class="loading-state">
          <span class="loading-spinner">⏳</span>
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
                  {{ statusText(sketch.status) }}
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
          <button @click="navigateTo('/')" class="create-btn">
            🎨 Создать скетч
          </button>
        </div>
      </div>

      <!-- Последние скетчи в галерее -->
      <div class="gallery-section">
        <div class="section-header">
          <h2 class="section-title">🌍 Новое в галерее</h2>
          <button @click="navigateTo('/explore')" class="view-all-btn">
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
                👤 {{ sketch.profiles?.display_name || 'Аноним' }}
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
      <button @click="navigateTo('/')" class="login-btn">
        Войти в систему
      </button>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #ffffff;
  padding-bottom: 3rem;
}

/* Заголовок */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem 3rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.page-title {
  font-size: 2rem;
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
  font-size: 2.5rem;
  -webkit-text-fill-color: initial;
}

.page-subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.header-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.header-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.profile-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.profile-btn:hover {
  transform: scale(1.05);
}

/* Контент */
.dashboard-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Быстрые действия */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.action-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-card:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(102, 126, 234, 0.5);
  transform: translateY(-5px);
}

.moderator-card {
  border-color: rgba(139, 92, 246, 0.3);
}

.moderator-card:hover {
  border-color: rgba(139, 92, 246, 0.6);
  background: rgba(139, 92, 246, 0.1);
}

.action-icon {
  font-size: 3rem;
}

.action-label {
  font-size: 1rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.pending-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: #ef4444;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 20px;
}

/* Статистика */
.stats-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 1.5rem 0;
  color: #fff;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.stat-card.stat-approved {
  border-color: rgba(100, 200, 100, 0.3);
  background: rgba(100, 200, 100, 0.1);
}

.stat-card.stat-pending {
  border-color: rgba(255, 200, 100, 0.3);
  background: rgba(255, 200, 100, 0.1);
}

.stat-card.stat-rejected {
  border-color: rgba(255, 100, 100, 0.3);
  background: rgba(255, 100, 100, 0.1);
}

.stat-card.stat-likes {
  border-color: rgba(102, 126, 234, 0.3);
  background: rgba(102, 126, 234, 0.1);
}

.stat-card.stat-views {
  border-color: rgba(118, 75, 162, 0.3);
  background: rgba(118, 75, 162, 0.1);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: #667eea;
}

.stat-card.stat-approved .stat-value {
  color: #64c864;
}

.stat-card.stat-pending .stat-value {
  color: #ffc864;
}

.stat-card.stat-rejected .stat-value {
  color: #ff6464;
}

.stat-card.stat-likes .stat-value {
  color: #667eea;
}

.stat-card.stat-views .stat-value {
  color: #764ba2;
}

.stat-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Скетчи */
.sketches-section {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.view-all-btn {
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 8px;
  color: #667eea;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.view-all-btn:hover {
  background: rgba(102, 126, 234, 0.3);
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

/* Сетка скетчей */
.sketches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.sketch-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.sketch-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
  transform: translateY(-5px);
}

.sketch-thumbnail {
  height: 160px;
  overflow: hidden;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.sketch-card:hover .thumbnail-image {
  transform: scale(1.05);
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}

.sketch-info {
  padding: 1rem;
}

.sketch-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sketch-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
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
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.sketch-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

/* Нет скетчей */
.no-sketches {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
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

.create-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.create-btn:hover {
  transform: scale(1.05);
}

/* Галерея */
.gallery-section {
  margin-bottom: 2rem;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.gallery-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.gallery-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
  transform: translateY(-5px);
}

.gallery-thumbnail {
  height: 140px;
  overflow: hidden;
}

.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.gallery-card:hover .gallery-image {
  transform: scale(1.05);
}

.gallery-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
}

.gallery-info {
  padding: 1rem;
}

.gallery-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-author {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 0.75rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gallery-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
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
@media (max-width: 1024px) {
  .dashboard-header {
    padding: 1.5rem;
  }

  .dashboard-content {
    padding: 1.5rem;
  }

  .sketches-grid,
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
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
