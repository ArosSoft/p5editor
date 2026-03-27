<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSketches } from '../composables/useSketches'
import { useAuth } from '../composables/useAuth'
import type { SketchWithProfile } from '../types/supabase'

const route = useRoute()
const router = useRouter()
const { getSketchById, toggleLike, checkLike, incrementViews, deleteSketch } = useSketches()
const { user, isAuthenticated } = useAuth()

// Состояние
const sketch = ref<SketchWithProfile | null>(null)
const isLoading = ref(true)
const isCopied = ref(false)
const hasLiked = ref(false)
const localLikes = ref(0)

// Удаление скетча
const showDeleteModal = ref(false)
const isDeleting = ref(false)

// Загрузка скетча
onMounted(async () => {
  const id = route.params.id as string
  
  const result = await getSketchById(id)
  
  if (result.success && result.data) {
    sketch.value = result.data as SketchWithProfile
    localLikes.value = sketch.value.likes
    
    // Увеличиваем счётчик просмотров
    await incrementViews(id)
    
    // Проверяем, лайкнул ли текущий пользователь
    if (user.value) {
      const likeResult = await checkLike(id, user.value.id)
      hasLiked.value = likeResult.liked || false
    }
  } else {
    sketch.value = null
  }
  
  isLoading.value = false
})

// Навигация назад
function goBack() {
  router.push('/explore')
}

// Копирование кода
function copyCode() {
  if (sketch.value) {
    navigator.clipboard.writeText(sketch.value.code)
    isCopied.value = true
    setTimeout(() => {
      isCopied.value = false
    }, 2000)
  }
}

// Открыть модальное окно удаления
function confirmDelete() {
  showDeleteModal.value = true
}

// Закрыть модальное окно
function closeDeleteModal() {
  showDeleteModal.value = false
}

// Удаление скетча
async function handleDeleteSketch() {
  if (!sketch.value || !user.value) return
  
  isDeleting.value = true
  try {
    const result = await deleteSketch(sketch.value.id)
    
    if (result.success) {
      // Закрываем модальное окно и переходим в галерею
      closeDeleteModal()
      router.push('/explore')
    } else {
      alert(result.error || 'Ошибка удаления скетча')
    }
  } catch (error) {
    console.error('Delete sketch error:', error)
    alert('Ошибка при удалении скетча')
  } finally {
    isDeleting.value = false
  }
}

// Лайк
async function handleToggleLike() {
  if (!user.value) {
    alert('Для лайка необходимо войти в систему')
    return
  }
  
  if (!sketch.value) return
  
  const result = await toggleLike(sketch.value.id, user.value.id)
  
  if (result.success) {
    hasLiked.value = result.liked || false
    localLikes.value = result.liked 
      ? localLikes.value + 1 
      : Math.max(0, localLikes.value - 1)
  } else {
    alert(result.error || 'Ошибка при установке лайка')
  }
}

// Запуск в редакторе
function openInEditor() {
  if (!sketch.value) return
  
  const currentUserId = user.value?.id
  const isAuthor = currentUserId === sketch.value.user_id
  
  console.log('[SketchDetailPage] openInEditor:', {
    sketchId: sketch.value.id,
    currentUserId,
    sketchAuthorId: sketch.value.user_id,
    isAuthor
  })
  
  if (isAuthor) {
    // Автор скетча - сохраняем ID для редактирования в БД
    console.log('[SketchDetailPage] Пользователь является автором, сохраняем ID скетча')
    localStorage.setItem('p5editor_current_sketch_id', sketch.value.id)
    localStorage.setItem('p5editor_current_code', sketch.value.code)
    localStorage.setItem('p5editor_current_name', sketch.value.title)
    router.push({ path: '/', query: { sketch: sketch.value.id, t: Date.now() } })
  } else {
    // Не автор - открываем как копию без ID
    console.log('[SketchDetailPage] Пользователь не является автором, открываем как копию')
    localStorage.removeItem('p5editor_current_sketch_id')
    localStorage.setItem('p5editor_current_code', sketch.value.code)
    localStorage.setItem('p5editor_current_name', sketch.value.title + ' (копия)')
    router.push('/')
  }
}

// Форматирование даты
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Вычисляемые
const authorName = computed(() => {
  if (!sketch.value) return ''
  return sketch.value.profiles?.display_name || 
         sketch.value.profiles?.email?.split('@')[0] || 
         'Аноним'
})

const authorAvatar = computed(() => {
  if (!sketch.value?.profiles?.avatar_url) return null
  return sketch.value.profiles.avatar_url
})
</script>

<template>
  <div class="sketch-detail-page">
    <!-- Заголовок -->
    <header class="detail-header">
      <button @click="goBack" class="back-btn">
        ← Назад к галерее
      </button>
      <div class="header-actions">
        <button @click="openInEditor" class="editor-btn">
          📝 Открыть в редакторе
        </button>
      </div>
    </header>

    <!-- Загрузка -->
    <div v-if="isLoading" class="loading">
      <span class="loading-spinner">⏳</span>
      <p>Загрузка скетча...</p>
    </div>

    <!-- Контент -->
    <div v-else-if="sketch" class="detail-content">
      <!-- Ответ модератора (в начале страницы) -->
      <div v-if="sketch.moderation_log" class="moderation-section moderation-section-top">
        <h3 class="moderation-title">📋 Информация о модерации</h3>
        
        <div class="moderation-log">
          <div class="moderation-status">
            <span :class="['status-badge', sketch.moderation_log.action === 'approved' ? 'approved' : 'rejected']">
              {{ sketch.moderation_log.action === 'approved' ? '✅ Одобрено' : '❌ Отклонено' }}
            </span>
            <span class="moderation-date">{{ formatDate(sketch.moderation_log.created_at) }}</span>
          </div>
          
          <div v-if="sketch.moderation_log.comment" class="moderation-comment">
            <span class="comment-label">📝 Комментарий модератора:</span>
            <p class="comment-text">{{ sketch.moderation_log.comment }}</p>
          </div>
          
          <div class="moderator-info">
            <span class="moderator-label">👤 Модератор:</span>
            <span class="moderator-name">{{ sketch.moderation_log.moderator_name }}</span>
          </div>
        </div>
      </div>

      <!-- Основная информация -->
      <div class="sketch-main">
        <!-- Превью -->
        <div class="sketch-preview">
          <img
            v-if="sketch.thumbnail_url"
            :src="sketch.thumbnail_url"
            :alt="sketch.title"
            class="preview-image"
          />
          <div v-else class="preview-placeholder">
            <span class="preview-icon">🎨</span>
          </div>
        </div>

        <!-- Информация -->
        <div class="sketch-header-info">
          <h1 class="sketch-title">{{ sketch.title }}</h1>
          <p class="sketch-description">{{ sketch.description }}</p>

          <!-- Автор -->
          <div class="author-section">
            <div class="author-info">
              <img
                v-if="authorAvatar"
                :src="authorAvatar"
                class="author-avatar-img"
                alt="Аватар автора"
              />
              <div v-else class="author-avatar-placeholder">
                {{ authorName.charAt(0).toUpperCase() }}
              </div>
              <div class="author-details">
                <span class="author-label">Автор</span>
                <span class="author-name">{{ authorName }}</span>
              </div>
            </div>
          </div>

          <!-- Статистика -->
          <div class="stats-section">
            <div class="stat-box">
              <span class="stat-icon">❤️</span>
              <span class="stat-value">{{ localLikes }}</span>
              <span class="stat-label">Лайков</span>
            </div>
            <div class="stat-box">
              <span class="stat-icon">👁️</span>
              <span class="stat-value">{{ sketch.views }}</span>
              <span class="stat-label">Просмотров</span>
            </div>
            <div class="stat-box">
              <span class="stat-icon">📅</span>
              <span class="stat-value">{{ formatDate(sketch.created_at) }}</span>
              <span class="stat-label">Дата</span>
            </div>
          </div>

          <!-- Бейджи -->
          <div class="badges-section">
            <span
              class="difficulty-badge"
              :class="`difficulty-${(sketch.difficulty || 'Средняя').toLowerCase()}`"
            >
              {{ sketch.difficulty || 'Средняя' }}
            </span>
            <span class="category-badge">
              {{ sketch.category || 'Другое' }}
            </span>
          </div>

          <!-- Теги -->
          <div class="tags-section">
            <span
              v-for="tag in (sketch.tags || [])"
              :key="tag"
              class="detail-tag"
            >
              🏷️ {{ tag }}
            </span>
          </div>

          <!-- Действия -->
          <div class="action-buttons">
            <button
              @click="handleToggleLike"
              class="action-btn like-btn"
              :class="{ 'liked': hasLiked }"
            >
              {{ hasLiked ? '❤️' : '🤍' }} {{ hasLiked ? 'Понравилось!' : 'Лайк' }}
            </button>
            <button
              v-if="isAuthenticated && user && sketch.user_id === user.id"
              @click="confirmDelete"
              class="action-btn delete-btn"
            >
              🗑️ Удалить скетч
            </button>
            <button @click="copyCode" class="action-btn copy-btn">
              {{ isCopied ? '✅ Скопировано!' : '📋 Копировать код' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Код -->
      <div class="code-section">
        <div class="code-header">
          <span class="code-title">📄 Код скетча</span>
          <button @click="copyCode" class="copy-code-btn">
            {{ isCopied ? '✅ Скопировано' : '📋 Копировать' }}
          </button>
        </div>
        <pre class="code-block"><code>{{ sketch.code }}</code></pre>
      </div>
    </div>

    <!-- Не найдено -->
    <div v-else class="not-found">
      <span class="not-found-icon">😕</span>
      <h2>Скетч не найден</h2>
      <p>К сожалению, скетч с таким ID не существует или не прошёл модерацию</p>
      <button @click="goBack" class="back-to-gallery-btn">
        ← Вернуться к галерее
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
.sketch-detail-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #ffffff;
}

/* Заголовок */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.header-actions {
  display: flex;
  gap: 1rem;
}

.editor-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.editor-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

/* Загрузка */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
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

/* Контент */
.detail-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Основная информация */
.sketch-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

.sketch-preview {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.preview-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.preview-placeholder {
  width: 100%;
  height: 400px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-icon {
  font-size: 6rem;
  opacity: 0.5;
}

.sketch-header-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sketch-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sketch-description {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  margin: 0;
}

/* Автор */
.author-section {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.author-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.author-avatar-img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.author-avatar-placeholder {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.5rem;
  font-weight: 600;
}

.author-details {
  display: flex;
  flex-direction: column;
}

.author-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.author-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #fff;
}

/* Статистика */
.stats-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-box {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

.stat-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Бейджи */
.badges-section {
  display: flex;
  gap: 0.75rem;
}

.difficulty-badge,
.category-badge {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
}

.difficulty-лёгкая {
  background: rgba(100, 200, 100, 0.2);
  color: #64c864;
  border: 1px solid rgba(100, 200, 100, 0.3);
}

.difficulty-средняя {
  background: rgba(255, 200, 100, 0.2);
  color: #ffc864;
  border: 1px solid rgba(255, 200, 100, 0.3);
}

.difficulty-тяжёлая {
  background: rgba(255, 100, 100, 0.2);
  color: #ff6464;
  border: 1px solid rgba(255, 100, 100, 0.3);
}

.category-badge {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Теги */
.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.detail-tag {
  padding: 0.5rem 1rem;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 20px;
  font-size: 0.9rem;
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

/* Кнопки действий */
.action-buttons {
  display: flex;
  gap: 1rem;
}

.action-btn {
  flex: 1;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.like-btn {
  background: rgba(255, 100, 100, 0.2);
  border: 1px solid rgba(255, 100, 100, 0.3);
  color: #ff6464;
}

.like-btn:hover,
.like-btn.liked {
  background: rgba(255, 100, 100, 0.3);
  transform: scale(1.02);
}

.copy-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.delete-btn {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ef4444;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  border-color: #ef4444;
}

/* Код */
.code-section {
  margin-top: 2rem;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px 12px 0 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: none;
}

.code-title {
  font-size: 1.1rem;
  font-weight: 600;
}

.copy-code-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-code-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.code-block {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0 0 12px 12px;
  padding: 1.5rem;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #e0e0e0;
  margin: 0;
  white-space: pre;
}

/* Ответ модератора */
.moderation-section {
  margin-top: 2rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
}

/* Ответ модератора в начале страницы */
.moderation-section-top {
  margin-top: 0;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
}

.moderation-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  color: #fff;
}

.moderation-log {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.moderation-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-badge.approved {
  background: rgba(100, 200, 100, 0.2);
  color: #64c864;
}

.status-badge.rejected {
  background: rgba(255, 100, 100, 0.2);
  color: #ff6464;
}

.moderation-date {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.moderation-comment {
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border-left: 3px solid rgba(255, 255, 255, 0.2);
}

.comment-label {
  display: block;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.comment-text {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0;
  font-style: italic;
}

.moderator-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.85rem;
}

.moderator-label {
  color: rgba(255, 255, 255, 0.5);
}

.moderator-name {
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

/* Не найдено */
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  text-align: center;
}

.not-found-icon {
  font-size: 4rem;
}

.not-found h2 {
  font-size: 2rem;
  margin: 0;
  color: #fff;
}

.not-found p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.back-to-gallery-btn {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.back-to-gallery-btn:hover {
  transform: scale(1.05);
}

/* Адаптивность */
@media (max-width: 900px) {
  .sketch-main {
    grid-template-columns: 1fr;
  }

  .preview-placeholder,
  .preview-image {
    height: 300px;
  }

  .sketch-title {
    font-size: 1.75rem;
  }

  .stats-section {
    grid-template-columns: 1fr;
  }

  .detail-header {
    padding: 1rem 1.5rem;
  }

  .detail-content {
    padding: 1rem;
  }

  .action-buttons {
    flex-direction: column;
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
