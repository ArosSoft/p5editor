<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Step {
  title: string
  file: string
  description?: string
}

interface Example {
  id: string
  title: string
  description: string
  theme: string
  difficulty: string
  tags: string[]
  codePath: string
  steps?: Step[]
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

type View = 'list' | 'steps' | 'description'
const view = ref<View>('list')
const selectedExample = ref<Example | null>(null)
const steps = ref<Step[]>([])
const currentStep = ref<Step | null>(null)
const stepContent = ref('')
const stepContentsMap = ref<Map<string, string>>(new Map())

const examples = ref<Example[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const selectedTheme = ref('Все')

const notification = ref<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)
let notificationTimer: ReturnType<typeof setTimeout> | null = null

function showNotification(message: string, type: 'success' | 'info' | 'error' = 'info') {
  if (notificationTimer) clearTimeout(notificationTimer)
  notification.value = { message, type }
  notificationTimer = setTimeout(() => {
    notification.value = null
  }, 3000)
}

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

async function loadSteps(example: Example) {
  selectedExample.value = example
  view.value = 'steps'
  steps.value = []
  stepContentsMap.value.clear()

  try {
    const response = await fetch(`/examples/${example.id}/steps.json`)
    if (response.ok) {
      const stepsData = await response.json()
      steps.value = stepsData
    } else {
      steps.value = [
        { title: 'Шаг 1: Введение', file: 'step1.txt' },
        { title: 'Шаг 2: Настройка', file: 'step2.txt' },
        { title: 'Шаг 3: Код', file: 'step3.txt' }
      ]
    }

    steps.value.push({ title: 'Демо', file: 'sketch.js' })
    await Promise.all(steps.value.map(step => loadStepDescription(step, false)))
  } catch (e) {
    console.error('Failed to load steps', e)
    steps.value = []
  }
}

async function loadStepDescription(step: Step, show = true) {
  if (!selectedExample.value) return

  if (step.title === 'Демо' && step.file === 'sketch.js') {
    try {
      const response = await fetch(`/examples/${selectedExample.value.id}/${step.file}`)
      const code = await response.text()
      stepContentsMap.value.set(step.file, code)
      if (show) {
        currentStep.value = step
        stepContent.value = code
        view.value = 'description'
        emit('loadExample', code)
      }
      return code
    } catch (e) {
      console.error('Failed to load demo code', e)
      return 'Не удалось загрузить демо-код.'
    }
  }

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

function goBack() {
  if (view.value === 'description') {
    view.value = 'steps'
  } else if (view.value === 'steps') {
    view.value = 'list'
  }
}

// ==========================================
// Копирование в буфер обмена
// ==========================================
async function copyToClipboard(step: Step) {
  const content = stepContentsMap.value.get(step.file)
  if (!content) return

  try {
    await navigator.clipboard.writeText(content)
    showNotification(`📋 «${step.title}» скопирован — вставьте в чат (Ctrl+V)`, 'success')
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = content
    textarea.style.cssText = 'position:fixed;opacity:0;top:0;left:0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    showNotification(`📋 «${step.title}» скопирован — вставьте в чат (Ctrl+V)`, 'success')
  }
}

// ==========================================
// Скачивание файла
// ==========================================
function getFileName(step: Step): string {
  if (!selectedExample.value) return step.file
  const exampleId = selectedExample.value.id
  const isDemo = step.title === 'Демо'
  const ext = isDemo ? 'js' : 'txt'
  return `${exampleId}_${step.title.replace(/\s+/g, '_')}.${ext}`
}

function downloadFile(step: Step) {
  const content = stepContentsMap.value.get(step.file)
  if (!content) return

  const isDemo = step.title === 'Демо'
  const fileType = isDemo ? 'application/javascript' : 'text/plain'
  const fileName = getFileName(step)

  const blob = new Blob([content], { type: fileType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)

  showNotification(`💾 «${fileName}» скачан — загрузите через 📎 в чат`, 'success')
}

// ==========================================
// Копирование как файл в буфер обмена (ClipboardItem)
//   Позволяет вставить как файл в некоторых чатах
// ==========================================
async function copyAsFile(step: Step) {
  const content = stepContentsMap.value.get(step.file)
  if (!content) return

  const isDemo = step.title === 'Демо'
  const mimeType = isDemo ? 'text/javascript' : 'text/plain'

  try {
    const blob = new Blob([content], { type: mimeType })
    const item = new ClipboardItem({ [mimeType]: blob })
    await navigator.clipboard.write([item])
    showNotification(`📎 «${step.title}» скопирован как файл — вставьте Ctrl+V`, 'success')
  } catch {
    // Fallback: обычное копирование текста
    await copyToClipboard(step)
  }
}

// ==========================================
// Открыть содержимое в новой вкладке
//   (оттуда можно Ctrl+A, Ctrl+C)
// ==========================================
function openInNewTab(step: Step) {
  const content = stepContentsMap.value.get(step.file)
  if (!content) return

  const isDemo = step.title === 'Демо'
  const mimeType = isDemo ? 'application/javascript' : 'text/plain'
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')

  showNotification(`🌐 Открыто в новой вкладке`, 'info')
}

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
    <!-- Уведомление -->
    <Transition name="notification">
      <div v-if="notification" class="notification" :class="notification.type">
        {{ notification.message }}
      </div>
    </Transition>

    <div class="panel-header">
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

    <div v-if="view === 'list'" class="panel-filters">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="🔍 Найти пример..."
        class="search-input"
      />
      <select v-model="selectedTheme" class="theme-select">
        <option v-for="t in themes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

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

    <!-- Steps list -->
    <div v-else-if="view === 'steps'" class="steps-list">
      <div class="steps-header">
        <div class="steps-hint">
          <span class="hint-icon">💡</span>
          <span class="hint-text">Скопируйте или скачайте шаг, затем отправьте в чат ИИ</span>
        </div>
      </div>

      <div v-if="steps.length === 0" class="no-results">
        <span class="no-results-icon">📭</span>
        <p>Нет шагов для этого примера</p>
      </div>

      <div v-else v-for="step in steps" :key="step.file" class="step-item">
        <div class="step-content" @click="loadStepDescription(step)">
          <span class="step-icon">{{ step.title === 'Демо' ? '🎮' : '📘' }}</span>
          <span class="step-title">{{ step.title }}</span>
          <span v-if="step.title === 'Демо'" class="demo-badge">JS</span>
          <span v-else class="step-badge">TXT</span>
        </div>
        <div class="step-actions">
          <button
            class="action-btn"
            @click.stop="copyToClipboard(step)"
            title="Скопировать текст (Ctrl+V в чат)"
          >📋</button>
          <button
            class="action-btn"
            @click.stop="downloadFile(step)"
            title="Скачать файл (загрузить через 📎)"
          >💾</button>
          <button
            class="action-btn"
            @click.stop="openInNewTab(step)"
            title="Открыть в новой вкладке"
          >🌐</button>
        </div>
      </div>

      <div class="steps-footer">
        <div class="footer-methods">
          <div class="method-item">
            <span class="method-icon">📋</span>
            <div class="method-info">
              <span class="method-title">Копировать → Вставить</span>
              <span class="method-desc">Скопируйте текст и вставьте Ctrl+V в поле чата</span>
            </div>
          </div>
          <div class="method-item">
            <span class="method-icon">💾</span>
            <div class="method-info">
              <span class="method-title">Скачать → Прикрепить</span>
              <span class="method-desc">Скачайте файл и загрузите через кнопку 📎 в чате</span>
            </div>
          </div>
          <div class="method-item">
            <span class="method-icon">🌐</span>
            <div class="method-info">
              <span class="method-title">Открыть в вкладке</span>
              <span class="method-desc">Откроется текст — выделите всё (Ctrl+A) и скопируйте</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Step description -->
    <div v-else-if="view === 'description'" class="step-description">
      <div class="description-content">{{ stepContent }}</div>
      <div class="description-footer">
        <div class="description-actions">
          <button class="action-btn-large primary" @click="copyToClipboard(currentStep!)">
            <span class="btn-icon">📋</span>
            <div class="btn-info">
              <span class="btn-text">Скопировать текст</span>
              <span class="btn-hint">затем Ctrl+V в чат</span>
            </div>
          </button>
          <button class="action-btn-large secondary" @click="downloadFile(currentStep!)">
            <span class="btn-icon">💾</span>
            <div class="btn-info">
              <span class="btn-text">Скачать файл</span>
              <span class="btn-hint">затем 📎 в чат</span>
            </div>
          </button>
          <button class="action-btn-large tertiary" @click="openInNewTab(currentStep!)">
            <span class="btn-icon">🌐</span>
            <div class="btn-info">
              <span class="btn-text">В новой вкладке</span>
              <span class="btn-hint">Ctrl+A → Ctrl+C</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div v-if="view === 'list'" class="panel-footer">
      <span class="hint-icon">💡</span>
      <span class="hint-text">Кликни по примеру — откроются шаги с инструкциями!</span>
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
  position: relative;
  z-index: 100;
}

.examples-panel.theme-light {
  background: rgba(255, 255, 255, 0.95);
  border-right-color: #e0e0e0;
}

/* Уведомление */
.notification {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  padding: 12px 28px;
  border-radius: 28px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  pointer-events: none;
  white-space: nowrap;
  max-width: 90%;
  text-align: center;
}

.notification.success {
  background: linear-gradient(135deg, #2e7d32, #43a047);
  color: white;
}

.notification.info {
  background: linear-gradient(135deg, #1565c0, #1e88e5);
  color: white;
}

.notification.error {
  background: linear-gradient(135deg, #c62828, #e53935);
  color: white;
}

.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
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

.title-icon {
  font-size: 22px;
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
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #646cff;
  background: rgba(0, 0, 0, 0.3);
}

.theme-light .search-input {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
  color: #333;
}

.theme-light .search-input:focus {
  background: white;
  border-color: #646cff;
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

.steps-header {
  padding: 0 0 12px 0;
  border-bottom: 1px dashed rgba(100, 108, 255, 0.3);
  margin-bottom: 8px;
}

.steps-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(100, 108, 255, 0.1);
  border-radius: 20px;
  color: #646cff;
  font-size: 13px;
}

.hint-icon {
  font-size: 16px;
}

.hint-text {
  font-weight: 500;
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
  font-family: 'Consolas', monospace;
}

.theme-light .description-content {
  color: #333;
}

.description-footer {
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 20px;
  flex-shrink: 0;
}

.theme-light .description-footer {
  border-top-color: rgba(0,0,0,0.1);
}

.description-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
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
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.step-item:hover {
  background: rgba(100, 108, 255, 0.15);
  border-color: rgba(100, 108, 255, 0.3);
  transform: translateX(4px);
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
  cursor: pointer;
  min-width: 0;
}

.step-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.step-title {
  font-size: 15px;
  color: white;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.theme-light .step-title {
  color: #333;
}

.demo-badge, .step-badge {
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 12px;
  text-transform: uppercase;
  margin-left: 8px;
  font-weight: 600;
  flex-shrink: 0;
}

.demo-badge {
  background: #ff6b6b;
  color: white;
}

.step-badge {
  background: #4caf50;
  color: white;
}

/* Кнопки действий в списке шагов */
.step-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 12px;
}

.action-btn {
  width: 38px;
  height: 38px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  cursor: pointer;
  font-size: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: white;
  position: relative;
}

.action-btn:hover {
  transform: scale(1.12);
  background: rgba(100, 108, 255, 0.3);
}

.action-btn:active {
  transform: scale(0.95);
}

.theme-light .action-btn {
  background: rgba(0, 0, 0, 0.06);
  color: #333;
}

.theme-light .action-btn:hover {
  background: rgba(100, 108, 255, 0.2);
}

/* Большие кнопки на странице описания */
.action-btn-large {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 14px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  flex: 1;
  min-width: 150px;
}

.theme-light .action-btn-large {
  background: rgba(0, 0, 0, 0.04);
  color: #333;
}

.action-btn-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.action-btn-large:active {
  transform: translateY(0);
}

.action-btn-large.primary {
  border-color: rgba(100, 108, 255, 0.4);
}

.action-btn-large.primary:hover {
  background: rgba(100, 108, 255, 0.2);
  border-color: #646cff;
}

.action-btn-large.secondary {
  border-color: rgba(76, 175, 80, 0.4);
}

.action-btn-large.secondary:hover {
  background: rgba(76, 175, 80, 0.2);
  border-color: #4caf50;
}

.action-btn-large.tertiary {
  border-color: rgba(255, 193, 7, 0.4);
}

.action-btn-large.tertiary:hover {
  background: rgba(255, 193, 7, 0.2);
  border-color: #ffc107;
}

.btn-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.btn-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: left;
}

.btn-text {
  font-weight: 600;
  font-size: 14px;
}

.btn-hint {
  font-size: 11px;
  opacity: 0.6;
}

/* Footer с методами */
.steps-footer {
  margin-top: 16px;
  padding: 0;
}

.footer-methods {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.method-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.theme-light .method-item {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.06);
}

.method-icon {
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 2px;
}

.method-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.method-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.theme-light .method-title {
  color: rgba(0, 0, 0, 0.9);
}

.method-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.3;
}

.theme-light .method-desc {
  color: rgba(0, 0, 0, 0.5);
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

/* Скроллбары */
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

@media (max-width: 768px) {
  .examples-panel {
    width: 100%;
  }

  .description-actions {
    flex-direction: column;
  }

  .action-btn-large {
    min-width: unset;
  }

  .step-actions {
    gap: 2px;
  }

  .action-btn {
    width: 34px;
    height: 34px;
    font-size: 15px;
  }
}
</style>