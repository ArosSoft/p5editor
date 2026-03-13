<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Step {
  title: string
  file: string
  description?: string // loaded later
}

interface Example {
  id: string
  title: string
  description: string
  theme: string
  difficulty: string
  tags: string[]
  codePath: string
  steps?: Step[]          // optional steps list
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

// Navigation state
type View = 'list' | 'steps' | 'description'
const view = ref<View>('list')
const selectedExample = ref<Example | null>(null)
const steps = ref<Step[]>([])
const currentStep = ref<Step | null>(null)
const stepContent = ref('')
const stepContentsMap = ref<Map<string, string>>(new Map()) // cache step descriptions

const examples = ref<Example[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedTheme = ref('Все')

// Load examples list
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

// Load steps for the selected example
async function loadSteps(example: Example) {
  selectedExample.value = example
  view.value = 'steps'
  steps.value = []
  stepContentsMap.value.clear()

  // Try to fetch steps.json from the example folder
  try {
    const response = await fetch(`/examples/${example.id}/steps.json`)
    if (response.ok) {
      const stepsData = await response.json()
      steps.value = stepsData
    } else {
      // Fallback: generate dummy steps
      steps.value = [
        { title: 'Шаг 1: Введение', file: 'step1.txt' },
        { title: 'Шаг 2: Настройка', file: 'step2.txt' },
        { title: 'Шаг 3: Код', file: 'step3.txt' }
      ]
    }
    
    // Добавляем шаг "Демо" в конец списка
    steps.value.push({
      title: 'Демо',
      file: 'sketch.js'
    })
    
    // Preload descriptions for drag & drop
    await Promise.all(steps.value.map(step => loadStepDescription(step, false)))
  } catch (e) {
    console.error('Failed to load steps', e)
    steps.value = []
  }
}

// Load a single step's description, optionally switch view
async function loadStepDescription(step: Step, show = true) {
  if (!selectedExample.value) return
  
  // Если это шаг "Демо", загружаем код и эмитим событие
  if (step.title === 'Демо' && step.file === 'sketch.js') {
    try {
      const response = await fetch(`/examples/${selectedExample.value.id}/${step.file}`)
      const code = await response.text()
      
      // Кэшируем содержимое
      stepContentsMap.value.set(step.file, code)
      
      if (show) {
        // Показываем описание шага
        currentStep.value = step
        stepContent.value = code
        view.value = 'description'
        
        // Также загружаем код в редактор
        emit('loadExample', code)
      }
      return code
    } catch (e) {
      console.error('Failed to load demo code', e)
      return 'Не удалось загрузить демо-код.'
    }
  }
  
  // If already cached, use it
  if (stepContentsMap.value.has(step.file)) {
    if (show) {
      currentStep.value = step
      stepContent.value = stepContentsMap.value.get(step.file)!
      view.value = 'description'
    }
    return stepContentsMap.value.get(step.file)
  }
  
  try {
    const response = await fetch(`/examples/${selectedExample.value.id}/${step.file}`)
    const text = await response.text()
    stepContentsMap.value.set(step.file, text)
    if (show) {
      currentStep.value = step
      stepContent.value = text
      view.value = 'description'
    }
    return text
  } catch (e) {
    console.error('Failed to load step description', e)
    return 'Не удалось загрузить описание шага.'
  }
}

// Navigate back
function goBack() {
  if (view.value === 'description') {
    view.value = 'steps'
  } else if (view.value === 'steps') {
    view.value = 'list'
  }
}

// Handle drag start for a step
function onDragStart(event: DragEvent, step: Step) {
  const description = stepContentsMap.value.get(step.file)
  if (description) {
    event.dataTransfer?.setData('text/plain', description)
    event.dataTransfer.effectAllowed = 'copy'
  }
}

// Filtering
const themes = computed(() => {
  const themeSet = new Set(examples.value.map(e => e.theme))
  return ['Все', ...Array.from(themeSet)]
})

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
      <!-- Back button -->
      <button v-if="view !== 'list'" class="back-btn" @click="goBack">← Назад</button>
      <h3 class="panel-title">
        <span class="title-icon">🎨</span>
        <span v-if="view === 'list'">Галерея примеров</span>
        <span v-else-if="view === 'steps'">{{ selectedExample?.title }} – шаги</span>
        <span v-else-if="view === 'description'">{{ currentStep?.title }}</span>
        <span v-if="view === 'list' && !loading" class="examples-count">{{ examples.length }}</span>
      </h3>
      <button class="close-btn" @click="closePanel">✕</button>
    </div>

    <!-- Search/filters – only in list view -->
    <div v-if="view === 'list'" class="panel-filters">
      <input 
        type="text" 
        v-model="searchQuery"
        placeholder="🔍 Найти пример..."
        class="search-input"
      />
      <select v-model="selectedTheme" class="theme-select">
        <option v-for="theme in themes" :key="theme" :value="theme">{{ theme }}</option>
      </select>
    </div>

    <!-- Loading / error / empty states (only for list view) -->
    <template v-if="view === 'list'">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Загружаем примеры...</p>
      </div>
      <div v-else-if="error" class="error-state">
        <span class="error-icon">⚠️</span>
        <p>{{ error }}</p>
      </div>
      <div v-else-if="filteredExamples.length === 0" class="no-results">
        <span class="no-results-icon">🔍</span>
        <p>Ничего не найдено</p>
        <p class="no-results-hint">Попробуй изменить поиск</p>
      </div>
      <div v-else class="examples-list">
        <div 
          v-for="example in filteredExamples" 
          :key="example.id"
          class="example-card"
          @click="loadSteps(example)"
        >
          <div class="card-preview" :style="{ backgroundColor: example.color || '#646cff' }">
            <span class="preview-icon">{{ example.icon || '🎨' }}</span>
          </div>
          <div class="card-info">
            <h4 class="card-title">{{ example.title }}</h4>
            <p class="card-desc">{{ example.description }}</p>
            <div class="card-meta">
              <span class="difficulty" :class="example.difficulty.toLowerCase()">{{ example.difficulty }}</span>
              <span class="theme-badge">{{ example.theme }}</span>
            </div>
            <div class="card-tags">
              <span v-for="tag in example.tags" :key="tag" class="tag">#{{ tag }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Steps list view -->
    <div v-else-if="view === 'steps'" class="steps-list">
      <div v-if="steps.length === 0" class="no-results">
        <span class="no-results-icon">📭</span>
        <p>Нет шагов для этого примера</p>
      </div>
      <div v-else v-for="step in steps" :key="step.file" class="step-item">
        <div class="step-content" @click="loadStepDescription(step)">
          <span class="step-icon">{{ step.title === 'Демо' ? '🎮' : '📘' }}</span>
          <span class="step-title">{{ step.title }}</span>
          <span v-if="step.title === 'Демо'" class="demo-badge">загрузит код</span>
        </div>
        <!-- Draggable icon -->
        <span 
          class="step-drag-icon" 
          draggable="true"
          @dragstart="onDragStart($event, step)"
          :title="step.title === 'Демо' ? 'Перетащи код в AI чат' : 'Перетащи описание в AI чат'"
        >📄</span>
      </div>
    </div>

    <!-- Step description view -->
    <div v-else-if="view === 'description'" class="step-description">
      <div class="description-content">{{ stepContent }}</div>
      <!-- Optional: drag icon for the whole description -->
      <div class="description-footer">
        <span 
          class="drag-description-icon" 
          draggable="true"
          @dragstart="onDragStart($event, currentStep!)"
          :title="currentStep?.title === 'Демо' ? 'Перетащи код в AI чат' : 'Перетащи описание в AI чат'"
        >{{ currentStep?.title === 'Демо' ? '🎮 Перетащи код в AI чат' : '📄 Перетащи описание в AI чат' }}</span>
      </div>
    </div>

    <!-- Footer hint (only in list view) -->
    <div v-if="view === 'list'" class="panel-footer">
      <span class="hint-icon">💡</span>
      <span class="hint-text">Кликни по примеру — откроются шаги!</span>
    </div>
  </div>
</template>

<style scoped>
.examples-panel {
  width: 570px;
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
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.theme-light .panel-header {
  border-bottom-color: rgba(0, 0, 0, 0.1);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
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
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 13px;
  margin-left: 10px;
}

.close-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 20px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
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

.back-btn {
  background: transparent;
  border: none;
  color: #646cff;
  font-size: 15px;
  cursor: pointer;
  margin-right: 12px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: rgba(100, 108, 255, 0.2);
}

.panel-filters {
  padding: 15px 20px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 14px;
}

.theme-light .search-input {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
  color: #333;
}

.theme-select {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  color: white;
  font-size: 14px;
  cursor: pointer;
  min-width: 120px;
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
  font-size: 16px;
  min-height: 200px;
}

.theme-light .loading-state,
.theme-light .error-state,
.theme-light .no-results {
  color: rgba(0, 0, 0, 0.6);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(100, 108, 255, 0.3);
  border-top-color: #646cff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-icon, .no-results-icon {
  font-size: 60px;
}

.no-results-hint {
  font-size: 14px;
  opacity: 0.7;
  margin-top: 10px;
}

.examples-list,
.steps-list,
.step-description {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  height: 100%;
  position: relative;
}

.examples-list {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.steps-list {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step-description {
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.description-content {
  font-size: 15px;
  line-height: 1.7;
  white-space: pre-wrap;
  color: white;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding-right: 10px;
}

.theme-light .description-content {
  color: #333;
}

.description-footer {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 20px;
  text-align: center;
  flex-shrink: 0;
}

.theme-light .description-footer {
  border-top-color: rgba(0,0,0,0.1);
}

.example-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.example-card:hover {
  background: rgba(100, 108, 255, 0.2);
  border-color: #646cff;
  transform: translateX(8px);
}

.theme-light .example-card {
  background: rgba(0, 0, 0, 0.02);
}

.theme-light .example-card:hover {
  background: rgba(100, 108, 255, 0.1);
}

.card-preview {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 32px;
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px 0;
  color: white;
}

.theme-light .card-title {
  color: #333;
}

.card-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 10px 0;
  line-height: 1.5;
}

.theme-light .card-desc {
  color: rgba(0, 0, 0, 0.7);
}

.card-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}

.difficulty {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 14px;
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
  font-size: 11px;
  padding: 3px 10px;
  background: rgba(100, 108, 255, 0.2);
  border-radius: 14px;
  color: #646cff;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 11px;
  padding: 3px 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.theme-light .tag {
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.7);
}

.step-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.step-item:hover {
  background: rgba(100, 108, 255, 0.2);
  border-color: #646cff;
  transform: translateX(8px);
}

.theme-light .step-item {
  background: rgba(0, 0, 0, 0.02);
}

.theme-light .step-item:hover {
  background: rgba(100, 108, 255, 0.1);
}

.step-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.step-icon {
  font-size: 22px;
}

.step-title {
  font-size: 16px;
  color: white;
}

.theme-light .step-title {
  color: #333;
}

.demo-badge {
  font-size: 10px;
  padding: 2px 8px;
  background: #646cff;
  color: white;
  border-radius: 12px;
  text-transform: uppercase;
  margin-left: 8px;
}

.step-drag-icon {
  font-size: 22px;
  cursor: grab;
  opacity: 0.7;
  padding: 6px 10px;
  border-radius: 6px;
  transition: all 0.2s;
  user-select: none;
  flex-shrink: 0;
}

.step-drag-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  opacity: 1;
}

.step-drag-icon:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.theme-light .step-drag-icon:hover {
  background: rgba(0, 0, 0, 0.1);
}

.drag-description-icon {
  display: inline-block;
  padding: 12px 24px;
  background: rgba(100,108,255,0.2);
  border-radius: 30px;
  font-size: 16px;
  cursor: grab;
  color: #646cff;
  transition: all 0.2s;
}

.drag-description-icon:hover {
  background: rgba(100,108,255,0.3);
  transform: scale(1.05);
}

.drag-description-icon:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.panel-footer {
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
}

.theme-light .panel-footer {
  border-top-color: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.5);
}

.hint-icon {
  font-size: 16px;
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
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.examples-list::-webkit-scrollbar,
.steps-list::-webkit-scrollbar,
.step-description::-webkit-scrollbar,
.description-content::-webkit-scrollbar {
  width: 8px;
}

.examples-list::-webkit-scrollbar-track,
.steps-list::-webkit-scrollbar-track,
.step-description::-webkit-scrollbar-track,
.description-content::-webkit-scrollbar-track {
  background: transparent;
}

.examples-list::-webkit-scrollbar-thumb,
.steps-list::-webkit-scrollbar-thumb,
.step-description::-webkit-scrollbar-thumb,
.description-content::-webkit-scrollbar-thumb {
  background: rgba(100, 108, 255, 0.3);
  border-radius: 4px;
}

.examples-list::-webkit-scrollbar-thumb:hover,
.steps-list::-webkit-scrollbar-thumb:hover,
.step-description::-webkit-scrollbar-thumb:hover,
.description-content::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 108, 255, 0.5);
}
</style>