<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  sketches,
  type Sketch,
  getAllTags,
  getAllCategories,
  searchSketches,
  getSketchesByCategory,
  getSketchesByDifficulty
} from '../mock/sketches'

const router = useRouter()

// Состояние
const searchQuery = ref('')
const selectedCategory = ref<string>('Все')
const selectedDifficulty = ref<string>('Все')
const selectedTags = ref<string[]>([])
const sortBy = ref<'popular' | 'new' | 'title'>('popular')

// Получение данных
const allTags = getAllTags()
const allCategories = ['Все', ...getAllCategories()]
const difficulties = ['Все', 'Лёгкая', 'Средняя', 'Тяжёлая']

// Фильтрация скетчей
const filteredSketches = computed(() => {
  let result = [...sketches]

  // Поиск
  if (searchQuery.value) {
    result = searchSketches(searchQuery.value)
  }

  // Категория
  if (selectedCategory.value !== 'Все') {
    result = result.filter(s => s.category === selectedCategory.value)
  }

  // Сложность
  if (selectedDifficulty.value !== 'Все') {
    result = result.filter(s => s.difficulty === selectedDifficulty.value)
  }

  // Теги
  if (selectedTags.value.length > 0) {
    result = result.filter(s =>
      selectedTags.value.every(tag => s.tags.includes(tag))
    )
  }

  // Сортировка
  switch (sortBy.value) {
    case 'popular':
      result.sort((a, b) => b.likes - a.likes)
      break
    case 'new':
      result.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      break
    case 'title':
      result.sort((a, b) => a.title.localeCompare(b.title))
      break
  }

  return result
})

// Переключение тега
function toggleTag(tag: string) {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

// Навигация к скетчу
function openSketch(id: string) {
  router.push(`/sketch/${id}`)
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
}
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
      <button @click="$router.push('/')" class="back-btn">
        ← Назад к редактору
      </button>
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
          placeholder="Название, теги, автор..."
        />
      </div>

      <!-- Категория -->
      <div class="filter-group">
        <label class="filter-label">📁 Категория</label>
        <select v-model="selectedCategory" class="filter-select">
          <option v-for="cat in allCategories" :key="cat" :value="cat">
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
    <div class="tags-panel">
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
        Найдено: <strong>{{ filteredSketches.length }}</strong> скетчей
      </span>
    </div>

    <!-- Сетка скетчей -->
    <div class="sketches-grid">
      <!-- Карточка скетча -->
      <div
        v-for="sketch in filteredSketches"
        :key="sketch.id"
        class="sketch-card"
        @click="openSketch(sketch.id)"
      >
        <!-- Превью -->
        <div class="sketch-thumbnail">
          <div class="thumbnail-placeholder" :style="{ background: sketch.author.id }">
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
            <span class="author-avatar">👤</span>
            <span class="author-name">{{ sketch.author.name }}</span>
          </div>

          <!-- Теги -->
          <div class="sketch-tags">
            <span
              v-for="tag in sketch.tags"
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
            <span class="sketch-date">{{ formatDate(sketch.createdAt) }}</span>
          </div>

          <!-- Бейджи -->
          <div class="sketch-badges">
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
        </div>
      </div>

      <!-- Нет результатов -->
      <div v-if="filteredSketches.length === 0" class="no-results">
        <span class="no-results-icon">😕</span>
        <h3>Ничего не найдено</h3>
        <p>Попробуйте изменить параметры поиска или фильтры</p>
        <button @click="resetFilters" class="reset-filters-btn">
          Сбросить все фильтры
        </button>
      </div>
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
}
</style>
