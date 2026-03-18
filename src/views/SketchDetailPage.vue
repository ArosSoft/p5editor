<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSketchById, type Sketch } from '../mock/sketches'

const route = useRoute()
const router = useRouter()

// Состояние
const sketch = ref<Sketch | null>(null)
const isLoading = ref(true)
const isCopied = ref(false)
const likes = ref(0)
const hasLiked = ref(false)

// Загрузка скетча
onMounted(() => {
  const id = route.params.id as string
  const found = getSketchById(id)
  
  if (found) {
    sketch.value = found
    likes.value = found.likes
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

// Лайк
function toggleLike() {
  if (hasLiked.value) {
    likes.value--
  } else {
    likes.value++
  }
  hasLiked.value = !hasLiked.value
}

// Запуск в редакторе
function openInEditor() {
  if (sketch.value) {
    // Сохраняем код в localStorage для передачи в редактор
    localStorage.setItem('p5editor_shared_code', sketch.value.code)
    localStorage.setItem('p5editor_shared_name', sketch.value.title)
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
      <!-- Основная информация -->
      <div class="sketch-main">
        <!-- Превью -->
        <div class="sketch-preview">
          <div class="preview-placeholder">
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
              <span class="author-avatar-large">👤</span>
              <div class="author-details">
                <span class="author-label">Автор</span>
                <span class="author-name">{{ sketch.author.name }}</span>
              </div>
            </div>
          </div>

          <!-- Статистика -->
          <div class="stats-section">
            <div class="stat-box">
              <span class="stat-icon">❤️</span>
              <span class="stat-value">{{ likes }}</span>
              <span class="stat-label">Лайков</span>
            </div>
            <div class="stat-box">
              <span class="stat-icon">👁️</span>
              <span class="stat-value">{{ sketch.views }}</span>
              <span class="stat-label">Просмотров</span>
            </div>
            <div class="stat-box">
              <span class="stat-icon">📅</span>
              <span class="stat-value">{{ formatDate(sketch.createdAt) }}</span>
              <span class="stat-label">Дата</span>
            </div>
          </div>

          <!-- Бейджи -->
          <div class="badges-section">
            <span
              class="difficulty-badge"
              :class="`difficulty-${sketch.difficulty.toLowerCase()}`"
            >
              {{ sketch.difficulty }}
            </span>
            <span class="category-badge">
              {{ sketch.category }}
            </span>
          </div>

          <!-- Теги -->
          <div class="tags-section">
            <span
              v-for="tag in sketch.tags"
              :key="tag"
              class="detail-tag"
            >
              🏷️ {{ tag }}
            </span>
          </div>

          <!-- Действия -->
          <div class="action-buttons">
            <button @click="toggleLike" class="action-btn like-btn" :class="{ 'liked': hasLiked }">
              {{ hasLiked ? '❤️' : '🤍' }} {{ hasLiked ? 'Понравилось!' : 'Лайк' }}
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
      <p>К сожалению, скетч с таким ID не существует</p>
      <button @click="goBack" class="back-to-gallery-btn">
        ← Вернуться к галерее
      </button>
    </div>
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

.author-avatar-large {
  font-size: 3rem;
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

  .preview-placeholder {
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
</style>
