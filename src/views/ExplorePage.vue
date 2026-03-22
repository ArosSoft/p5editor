<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSketches } from '../composables/useSketches'
import { useAuth } from '../composables/useAuth'
import type { SketchWithProfile } from '../types/supabase'

const router = useRouter()
const { getGallerySketches, getCategories } = useSketches()
const { user, isAuthenticated } = useAuth()

// Состояние
const sketches = ref<SketchWithProfile[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const total = ref(0)

// Фильтры
const searchQuery = ref('')
const selectedCategory = ref<string>('Все')
const selectedDifficulty = ref<string>('Все')
const selectedTags = ref<string[]>([])
const sortBy = ref<'popular' | 'new' | 'title'>('popular')

// Пагинация
const currentPage = ref(1)
const itemsPerPage = ref(12)

// Данные для фильтров
const categories = ref<string[]>(['Все'])
const difficulties = ['Все', 'Лёгкая', 'Средняя', 'Тяжёлая']

// Загрузка категорий
async function loadCategories() {
  const result = await getCategories()
  if (result.success && result.categories.length > 0) {
    categories.value = ['Все', ...result.categories]
  }
}

// Загрузка скетчей
async function loadSketches() {
  console.log('[ExplorePage] loadSketches вызвана')
  loading.value = true
  error.value = null

  const difficultyValue = selectedDifficulty.value !== 'Все'
    ? selectedDifficulty.value as 'Лёгкая' | 'Средняя' | 'Тяжёлая'
    : undefined

  console.log('[ExplorePage] Параметры загрузки:', {
    page: currentPage.value,
    limit: itemsPerPage.value,
    category: selectedCategory.value,
    difficulty: difficultyValue,
    search: searchQuery.value
  })

  const result = await getGallerySketches({
    page: currentPage.value,
    limit: itemsPerPage.value,
    category: selectedCategory.value !== 'Все' ? selectedCategory.value : undefined,
    difficulty: difficultyValue,
    search: searchQuery.value || undefined,
    sortBy: sortBy.value,
    sortOrder: sortBy.value === 'title' ? 'asc' : 'desc'
  })

  console.log('[ExplorePage] Результат загрузки:', result)

  if (result.success) {
    sketches.value = result.data || []
    total.value = result.total || 0
    console.log('[ExplorePage] Загружено скетчей:', sketches.value.length)
    
    if (sketches.value.length === 0) {
      console.warn('[ExplorePage] В галерее нет одобренных скетчей!')
      console.warn('[ExplorePage] Проверьте Supabase: есть ли скетчи со status=approved?')
    }
  } else {
    error.value = result.error || 'Ошибка загрузки скетчей'
    console.error('[ExplorePage] Ошибка:', error.value)
  }

  loading.value = false
}

// Отслеживание изменений фильтров
watch([searchQuery, selectedCategory, selectedDifficulty, sortBy], () => {
  currentPage.value = 1
  loadSketches()
})

// Загрузка при монтировании
onMounted(() => {
  loadCategories()
  loadSketches()
})

// Переключение тега
function toggleTag(tag: string) {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
  loadSketches()
}

// Навигация к скетчу
function openSketch(id: string) {
  router.push(`/sketch/${id}`)
}

// Открыть скетч в редакторе с проверкой авторства
function openSketchInEditor(sketch: SketchWithProfile) {
  const currentUserId = user.value?.id
  const isAuthor = currentUserId === sketch.user_id
  
  console.log('[ExplorePage] openSketchInEditor:', {
    sketchId: sketch.id,
    currentUserId,
    sketchAuthorId: sketch.user_id,
    isAuthor
  })
  
  if (isAuthor) {
    // Автор скетча - сохраняем ID для редактирования в БД
    console.log('[ExplorePage] Пользователь является автором, сохраняем ID скетча')
    localStorage.setItem('p5editor_current_sketch_id', sketch.id)
    localStorage.setItem('p5editor_current_code', sketch.code)
    localStorage.setItem('p5editor_current_name', sketch.title)
    router.push({ path: '/', query: { sketch: sketch.id, t: Date.now() } })
  } else {
    // Не автор - открываем как копию без ID
    console.log('[ExplorePage] Пользователь не является автором, открываем как копию')
    localStorage.removeItem('p5editor_current_sketch_id')
    localStorage.setItem('p5editor_current_code', sketch.code)
    localStorage.setItem('p5editor_current_name', sketch.title + ' (копия)')
    router.push('/')
  }
}

// Форматирование даты
function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long'
  })
}

// Сброс фильтров
function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'Все'
  selectedDifficulty.value = 'Все'
  selectedTags.value = []
  sortBy.value = 'popular'
  currentPage.value = 1
  loadSketches()
}

// Извлечение всех тегов из текущих скетчей
const allTags = computed(() => {
  const tagSet = new Set<string>()
  sketches.value.forEach(sketch => {
    sketch.tags?.forEach(tag => tagSet.add(tag))
  })
  return Array.from(tagSet)
})

// Пагинация
const totalPages = computed(() => Math.ceil(total.value / itemsPerPage.value))

const paginatedSketches = computed(() => sketches.value)

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadSketches()
}

const pages = computed(() => {
  const pagesArray: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) {
    pagesArray.push(i)
  }
  return pagesArray
})
</script>

<template>
  <div class="explore-page">
    <!-- Заголовок -->
    <header class="explore-header">
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">🌍</span>
          Исследуй
        </h1>
        <p class="page-subtitle">
          Галерея скетчей сообщества p5.js
        </p>
      </div>
      <div class="header-actions">
        <button @click="$router.push('/')" class="back-btn">
          ← Назад к редактору
        </button>
      </div>
    </header>

    <!-- Панель фильтров -->
    <div class="filters-panel">
      <!-- Поиск -->
      <div class="filter-group search-group">
        <label class="filter-label">🔍 Поиск</label>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Название, описание, автор..."
        />
      </div>

      <!-- Категория -->
      <div class="filter-group">
        <label class="filter-label">📁 Категория</label>
        <select v-model="selectedCategory" class="filter-select">
          <option v-for="cat in categories" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <!-- Сложность -->
      <div class="filter-group">
        <label class="filter-label">📊 Сложность</label>
        <select v-model="selectedDifficulty" class="filter-select">
          <option v-for="diff in difficulties" :key="diff" :value="diff">
            {{ diff }}
          </option>
        </select>
      </div>

      <!-- Сортировка -->
      <div class="filter-group">
        <label class="filter-label">🔽 Сортировка</label>
        <select v-model="sortBy" class="filter-select">
          <option value="popular">Популярные</option>
          <option value="new">Новые</option>
          <option value="title">По названию</option>
        </select>
      </div>

      <!-- Кнопка сброса -->
      <button @click="resetFilters" class="reset-btn" title="Сбросить фильтры">
        🔄 Сброс
      </button>
    </div>

    <!-- Теги -->
    <div v-if="allTags.length > 0" class="tags-panel">
      <span class="tags-label">🏷️ Теги:</span>
      <button
        v-for="tag in allTags"
        :key="tag"
        @click="toggleTag(tag)"
        class="tag-btn"
        :class="{ 'active': selectedTags.includes(tag) }"
      >
        {{ tag }}
      </button>
    </div>

    <!-- Счётчик результатов -->
    <div class="results-info">
      <span class="results-count">
        Найдено: <strong>{{ total }}</strong> скетчей
      </span>
    </div>

    <!-- Загрузка -->
    <div v-if="loading && sketches.length === 0" class="loading-state">
      <span class="loading-spinner">⏳</span>
      <p>Загрузка скетчей...</p>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <h3>Ошибка загрузки</h3>
      <p>{{ error }}</p>
      <button @click="loadSketches" class="retry-btn">
        🔄 Попробовать снова
      </button>
    </div>

    <!-- Сетка скетчей -->
    <div v-else class="sketches-grid">
      <!-- Карточка скетча -->
      <div
        v-for="sketch in paginatedSketches"
        :key="sketch.id"
        class="sketch-card"
        @click="openSketch(sketch.id)"
      >
        <!-- Превью -->
        <div class="sketch-thumbnail">
          <img
            v-if="sketch.thumbnail_url"
            :src="sketch.thumbnail_url"
            :alt="sketch.title"
            class="thumbnail-image"
          />
          <div v-else class="thumbnail-placeholder" :style="{ background: `linear-gradient(135deg, ${sketch.id.slice(0, 6)} 0%, ${sketch.id.slice(-6)} 100%)` }">
            <span class="thumbnail-icon">🎨</span>
          </div>
          <div class="sketch-overlay">
            <span class="view-btn">👁️ Просмотр</span>
          </div>
        </div>

        <!-- Информация -->
        <div class="sketch-info">
          <h3 class="sketch-title">{{ sketch.title }}</h3>
          <p class="sketch-description">{{ sketch.description }}</p>

          <!-- Автор -->
          <div class="sketch-author">
            <img
              v-if="sketch.profiles?.avatar_url"
              :src="sketch.profiles.avatar_url"
              class="author-avatar-img"
              alt="Аватар автора"
            />
            <span v-else class="author-avatar">👤</span>
            <span class="author-name">{{ sketch.profiles?.display_name || sketch.profiles?.email?.split('@')[0] || 'Аноним' }}</span>
          </div>

          <!-- Теги -->
          <div class="sketch-tags">
            <span
              v-for="tag in (sketch.tags || []).slice(0, 3)"
              :key="tag"
              class="sketch-tag"
            >
              {{ tag }}
            </span>
          </div>

          <!-- Статистика и дата -->
          <div class="sketch-meta">
            <div class="sketch-stats">
              <span class="stat-item" title="Лайки">
                ❤️ {{ sketch.likes }}
              </span>
              <span class="stat-item" title="Просмотры">
                👁️ {{ sketch.views }}
              </span>
            </div>
            <span class="sketch-date">{{ formatDate(sketch.created_at) }}</span>
          </div>

          <!-- Кнопка редактирования (только для автора) -->
          <div class="sketch-actions" v-if="isAuthenticated && user">
            <button
              @click.stop="openSketchInEditor(sketch)"
              class="edit-in-editor-btn"
              :title="sketch.user_id === user.id ? 'Редактировать в редакторе' : 'Открыть копию в редакторе'"
            >
              {{ sketch.user_id === user.id ? '✏️ Редактировать' : '📋 Открыть копию' }}
            </button>
          </div>

          <!-- Бейджи -->
          <div class="sketch-badges">
            <span
              class="difficulty-badge"
              :class="`difficulty-${sketch.difficulty?.toLowerCase() || 'средняя'}`"
            >
              {{ sketch.difficulty || 'Средняя' }}
            </span>
            <span class="category-badge">
              {{ sketch.category || 'Другое' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Нет результатов -->
      <div v-if="!loading && sketches.length === 0" class="no-results">
        <span class="no-results-icon">😕</span>
        <h3>Ничего не найдено</h3>
        <p>Попробуйте изменить параметры поиска или фильтры</p>
        <button @click="resetFilters" class="reset-filters-btn">
          Сбросить все фильтры
        </button>
      </div>
    </div>

    <!-- Пагинация -->
    <div v-if="totalPages > 1" class="pagination">
      <button
        @click="goToPage(1)"
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        ⏮️ Первая
      </button>
      <button
        @click="goToPage(currentPage - 1)"
        :disabled="currentPage === 1"
        class="pagination-btn"
      >
        ← Пред.
      </button>

      <button
        v-for="page in pages"
        :key="page"
        @click="goToPage(page)"
        class="pagination-btn page-number"
        :class="{ active: currentPage === page }"
      >
        {{ page }}
      </button>

      <button
        @click="goToPage(currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        След. →
      </button>
      <button
        @click="goToPage(totalPages)"
        :disabled="currentPage === totalPages"
        class="pagination-btn"
      >
        Последняя ⏭️
      </button>
    </div>
  </div>
</template>

<style scoped>
.explore-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #ffffff;
  padding: 0;
}

/* Заголовок */
.explore-header {
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
  font-size: 2.5rem;
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

/* Панель фильтров */
.filters-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 1.5rem 3rem;
  background: rgba(0, 0, 0, 0.2);
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 150px;
}

.search-group {
  flex: 1;
  min-width: 250px;
}

.filter-label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

.search-input {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.15);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.filter-select {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #667eea;
}

.filter-select option {
  background: #1a1a2e;
  color: #fff;
}

.reset-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 100, 100, 0.2);
  border: 1px solid rgba(255, 100, 100, 0.3);
  border-radius: 8px;
  color: #ff6464;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.reset-btn:hover {
  background: rgba(255, 100, 100, 0.3);
}

/* Панель тегов */
.tags-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 1rem 3rem;
  background: rgba(0, 0, 0, 0.1);
  align-items: center;
}

.tags-label {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  margin-right: 0.5rem;
}

.tag-btn {
  padding: 0.4rem 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: #667eea;
}

.tag-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

/* Информация о результатах */
.results-info {
  padding: 1rem 3rem;
}

.results-count {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
}

.results-count strong {
  color: #667eea;
  font-size: 1.1rem;
}

/* Загрузка */
.loading-state {
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

/* Ошибка */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
}

.error-state h3 {
  font-size: 1.5rem;
  margin: 0;
  color: #ff6464;
}

.error-state p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
}

.retry-btn {
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

.retry-btn:hover {
  transform: scale(1.05);
}

/* Сетка скетчей */
.sketches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
  padding: 2rem 3rem;
}

/* Карточка скетча */
.sketch-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sketch-card:hover {
  transform: translateY(-8px);
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(102, 126, 234, 0.5);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.sketch-thumbnail {
  position: relative;
  height: 200px;
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
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.thumbnail-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.sketch-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.sketch-card:hover .sketch-overlay {
  opacity: 1;
}

.view-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
}

.sketch-info {
  padding: 1.5rem;
}

.sketch-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #fff;
}

.sketch-description {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 1rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sketch-author {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.author-avatar-img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.author-avatar {
  font-size: 1.2rem;
}

.sketch-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.sketch-tag {
  padding: 0.25rem 0.6rem;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 0.75rem;
  color: #667eea;
}

.sketch-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.sketch-actions {
  margin-bottom: 1rem;
}

.edit-in-editor-btn {
  width: 100%;
  padding: 0.6rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.edit-in-editor-btn:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.sketch-stats {
  display: flex;
  gap: 1rem;
}

.stat-item {
  font-size: 0.85rem;
  cursor: default;
}

.sketch-date {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.sketch-badges {
  display: flex;
  gap: 0.5rem;
}

.difficulty-badge,
.category-badge {
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
}

.difficulty-лёгкая {
  background: rgba(100, 200, 100, 0.2);
  color: #64c864;
}

.difficulty-средняя {
  background: rgba(255, 200, 100, 0.2);
  color: #ffc864;
}

.difficulty-тяжёлая {
  background: rgba(255, 100, 100, 0.2);
  color: #ff6464;
}

.category-badge {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

/* Нет результатов */
.no-results {
  grid-column: 1 / -1;
  text-align: center;
  padding: 4rem 2rem;
}

.no-results-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.no-results h3 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: #fff;
}

.no-results p {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 1.5rem;
}

.reset-filters-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.reset-filters-btn:hover {
  transform: scale(1.05);
}

/* Пагинация */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem 3rem;
  flex-wrap: wrap;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.pagination-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination-btn.page-number.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  font-weight: 600;
}

/* Адаптивность */
@media (max-width: 768px) {
  .explore-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .filters-panel,
  .tags-panel,
  .sketches-grid {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .sketches-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    padding: 1.5rem;
  }
}
</style>
