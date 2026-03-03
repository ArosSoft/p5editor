<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Example {
  id: string
  title: string
  description: string
  theme: string
  difficulty: string
  tags: string[]
  codePath: string
  icon?: string
  color?: string
}

const props = defineProps<{
  theme?: 'dark' | 'light'
}>()

const emit = defineEmits<{
  (e: 'loadExample', code: string): void
  (e: 'close'): void
}>()

const examples = ref<Example[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedTheme = ref('Все')

// Загружаем список примеров
onMounted(async () => {
  try {
    const response = await fetch('/examples/index.json')
    if (!response.ok) throw new Error('Не удалось загрузить примеры')
    const data = await response.json()
    examples.value = data
  } catch (err) {
    error.value = 'Не удалось загрузить примеры'
    console.error(err)
  } finally {
    loading.value = false
  }
})

// Загружаем код примера
async function loadExampleCode(example: Example) {
  try {
    const response = await fetch(example.codePath)
    const code = await response.text()
    emit('loadExample', code)
  } catch (err) {
    console.error('Ошибка загрузки кода:', err)
  }
}

// Получаем уникальные темы для фильтрации
const themes = computed(() => {
  const themeSet = new Set(examples.value.map(e => e.theme))
  return ['Все', ...Array.from(themeSet)]
})

// Фильтруем примеры
const filteredExamples = computed(() => {
  return examples.value.filter(example => {
    const matchesSearch = 
      example.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      example.description.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      example.tags.some(tag => tag.includes(searchQuery.value.toLowerCase()))
    
    const matchesTheme = selectedTheme.value === 'Все' || example.theme === selectedTheme.value
    
    return matchesSearch && matchesTheme
  })
})

function closePanel() {
  emit('close')
}
</script>

<template>
  <div class="examples-panel" :class="`theme-${theme}`">
    <div class="panel-header">
      <h3 class="panel-title">
        <span class="title-icon">🎨</span>
        Галерея примеров
        <span v-if="!loading" class="examples-count">{{ examples.length }}</span>
      </h3>
      <button class="close-btn" @click="closePanel">✕</button>
    </div>

    <!-- Поиск и фильтры -->
    <div class="panel-filters">
      <input 
        type="text" 
        v-model="searchQuery"
        placeholder="🔍 Найти пример..."
        class="search-input"
      />
      
      <select v-model="selectedTheme" class="theme-select">
        <option v-for="theme in themes" :key="theme" :value="theme">
          {{ theme }}
        </option>
      </select>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Загружаем примеры...</p>
    </div>

    <!-- Ошибка -->
    <div v-else-if="error" class="error-state">
      <span class="error-icon">⚠️</span>
      <p>{{ error }}</p>
    </div>

    <!-- Список примеров -->
    <div v-else class="examples-list">
      <div v-if="filteredExamples.length === 0" class="no-results">
        <span class="no-results-icon">🔍</span>
        <p>Ничего не найдено</p>
        <p class="no-results-hint">Попробуй изменить поиск</p>
      </div>

      <div 
        v-for="example in filteredExamples" 
        :key="example.id"
        class="example-card"
        @click="loadExampleCode(example)"
      >
        <div class="card-preview" :style="{ backgroundColor: example.color || '#646cff' }">
          <span class="preview-icon">{{ example.icon || '🎨' }}</span>
        </div>
        
        <div class="card-info">
          <h4 class="card-title">{{ example.title }}</h4>
          <p class="card-desc">{{ example.description }}</p>
          
          <div class="card-meta">
            <span class="difficulty" :class="example.difficulty.toLowerCase()">
              {{ example.difficulty }}
            </span>
            <span class="theme-badge">{{ example.theme }}</span>
          </div>
          
          <div class="card-tags">
            <span v-for="tag in example.tags" :key="tag" class="tag">
              #{{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Подсказка -->
    <div class="panel-footer">
      <span class="hint-icon">💡</span>
      <span class="hint-text">Кликни по примеру — код загрузится и запустится!</span>
    </div>
  </div>
</template>

<style scoped>
.examples-panel {
  width: 380px;
  height: 100%;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid #404040;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn 0.3s ease;
}

.examples-panel.theme-light {
  background: rgba(255, 255, 255, 0.95);
  border-right-color: #e0e0e0;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.theme-light .panel-header {
  border-bottom-color: rgba(0, 0, 0, 0.1);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: white;
}

.theme-light .panel-title {
  color: #333;
}

.examples-count {
  background: #646cff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 8px;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.theme-light .close-btn {
  color: rgba(0, 0, 0, 0.6);
}

.theme-light .close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: black;
}

.panel-filters {
  padding: 15px;
  display: flex;
  gap: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 13px;
}

.theme-light .search-input {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
  color: #333;
}

.theme-select {
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 13px;
  cursor: pointer;
}

.theme-light .theme-select {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
  color: #333;
}

.loading-state, .error-state, .no-results {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: rgba(255, 255, 255, 0.6);
}

.theme-light .loading-state,
.theme-light .error-state,
.theme-light .no-results {
  color: rgba(0, 0, 0, 0.6);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(100, 108, 255, 0.3);
  border-top-color: #646cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-icon, .no-results-icon {
  font-size: 48px;
}

.no-results-hint {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 8px;
}

.examples-list {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.example-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.example-card:hover {
  background: rgba(100, 108, 255, 0.2);
  border-color: #646cff;
  transform: translateX(5px);
}

.theme-light .example-card {
  background: rgba(0, 0, 0, 0.02);
}

.theme-light .example-card:hover {
  background: rgba(100, 108, 255, 0.1);
}

.card-preview {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 24px;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: white;
}

.theme-light .card-title {
  color: #333;
}

.card-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.theme-light .card-desc {
  color: rgba(0, 0, 0, 0.7);
}

.card-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
}

.difficulty {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  font-weight: 600;
}

.difficulty.лёгкая {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
}

.difficulty.средняя {
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
}

.difficulty.сложная {
  background: rgba(244, 67, 54, 0.2);
  color: #f44336;
}

.theme-badge {
  font-size: 10px;
  padding: 2px 8px;
  background: rgba(100, 108, 255, 0.2);
  border-radius: 12px;
  color: #646cff;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.theme-light .tag {
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.7);
}

.panel-footer {
  padding: 12px 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.theme-light .panel-footer {
  border-top-color: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.5);
}

.hint-icon {
  font-size: 14px;
}

.hint-text {
  flex: 1;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 108, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 108, 255, 0.5);
}
</style>