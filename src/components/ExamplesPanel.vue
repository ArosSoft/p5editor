<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { marked } from 'marked'
import type { Tokens } from 'marked'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'

// Регистрируем язык JavaScript для подсветки
hljs.registerLanguage('javascript', javascript)

interface Step {
  title: string
  file: string
}

interface Example {
  id: string
  title: string
  description: string
  theme: string
  difficulty: string
  tags: string[]
  codePath: string
  color?: string
  steps?: Step[]
}

const props = defineProps<{
  theme?: 'dark' | 'light'
}>()

const emit = defineEmits<{
  (e: 'loadExample', code: string): void
  (e: 'close'): void
}>()

type View = 'list' | 'steps' | 'detail'
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

// Настройка marked с кастомным рендерером для добавления кнопок копирования
const renderer = new marked.Renderer()

// Переопределяем рендеринг code блоков с подсветкой синтаксиса
renderer.code = (token: Tokens.Code) => {
  const lang = token.lang || 'javascript'
  const code = token.text

  // Используем highlight.js для подсветки синтаксиса
  let highlightedCode: string
  try {
    // Пытаемся подсветить как JavaScript
    const detected = hljs.highlight(code, { language: 'javascript', ignoreIllegals: true })
    highlightedCode = detected.value
  } catch {
    // Fallback: экранируем без подсветки
    highlightedCode = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  return `
<div class="code-block-wrapper">
  <div class="code-block-header">
    <span class="code-lang">${lang}</span>
    <button class="copy-code-btn" onclick="copyCodeBlock(this)" title="Скопировать код">
      📋 Копировать
    </button>
  </div>
  <pre><code class="language-${lang}">${highlightedCode}</code></pre>
</div>
`.trim()
}

marked.setOptions({
  breaks: true,
  gfm: true,
  renderer: renderer
})

// Определяем, является ли файл markdown
function isMarkdownFile(filename: string): boolean {
  return filename.endsWith('.md') || filename.endsWith('.markdown')
}

// Рендерим markdown в HTML
function renderMarkdown(content: string): string {
  return marked.parse(content) as string
}

// Computed: отрендеренный контент текущего шага
const renderedStepContent = computed(() => {
  if (!currentStep.value) return ''
  if (isMarkdownFile(currentStep.value.file)) {
    return renderMarkdown(stepContent.value)
  }
  return ''
})

// Является ли текущий шаг markdown-файлом
const isCurrentStepMarkdown = computed(() => {
  return currentStep.value ? isMarkdownFile(currentStep.value.file) : false
})

// Является ли текущий шаг демо
const isCurrentStepDemo = computed(() => {
  return currentStep.value?.title === 'Демо' && currentStep.value?.file === 'sketch.js'
})

// Ключи для localStorage
const STORAGE_KEYS = {
  SELECTED_EXAMPLE: 'p5js_selected_example',
  CURRENT_STEP: 'p5js_current_step',
  VIEW: 'p5js_view'
}

function buildSystemPrompt(stepTitle: string): string {
  return `Твоя роль - ИИ ассистент, который помогает ученику изучать javascript с помощью P5.js для детей 6 класса
  на основе текстового описания очередного шага занятия (текст ниже правил).
1. Структура шага (Жесткая последовательность):
• Сначала я должен рассказать про цель шага.
• Затем я должен кратко пересказать текст шага, останавливаясь на ключевых моментах и особенностях. Написать один-два абзаца и ждать пока ученик прочитает и поймет.
• Предлагать ученику добавить строки кода в программу и пробовать запускать.
• Предлагать запускать код после ключевых вставок кода и наблюдать за результатом.
• Если результат не соответствует ожиданиям, предложить ученику изменить код и запустить заново.
• Спрашивать какие баги появились на экране и есть ли ошибки в консоли.
• Поздравь ученика в конце шага и дай вдохновляющий совет.
2. Моя роль и стиль общения:
• Я — учитель, который направляет, но не пишет код за ученика.
• Я должен поощрять и поддерживать ученика.
• Я должен быть терпеливым и помогать ученику, если он этого попросит, пока не будет достигнуто полное понимание.
3. Действия при непонимании ученика:
• Если ученик не понял, что нужно сделать на текущем шаге, я должен задать уточняющий вопрос: «Что именно не ясно?».
• На основе его ответа — объяснить этот момент еще проще и доступнее.
• Запрещено двигаться дальше, если текущий шаг не закончен.
4. Работа с кодом (Важное ограничение):
• Категорически запрещено показывать ученику полный, готовый код программы.
• Разрешается показывать только небольшие фрагменты кода для иллюстрации текущего шага или концепции (например, синтаксис if).

--- ТЕКСТ ШАГА: "${stepTitle}" ---
`
}

const notification = ref<string | null>(null)
let notificationTimer: ReturnType<typeof setTimeout> | null = null

function showNotification(message: string) {
  if (notificationTimer) clearTimeout(notificationTimer)
  notification.value = message
  notificationTimer = setTimeout(() => notification.value = null, 2500)
}

// Функция для копирования кода из блока (вызывается из HTML)
function copyCodeBlock(button: HTMLElement) {
  const wrapper = button.closest('.code-block-wrapper')
  if (!wrapper) return

  const codeElement = wrapper.querySelector('pre code')
  if (!codeElement) return

  const code = codeElement.textContent || ''

  navigator.clipboard.writeText(code).then(() => {
    const originalText = button.textContent
    button.textContent = '✓ Скопировано!'
    button.classList.add('copied')

    setTimeout(() => {
      button.textContent = originalText || '📋 Копировать'
      button.classList.remove('copied')
    }, 2000)
  }).catch(() => {
    // Fallback для старых браузеров
    const textArea = document.createElement('textarea')
    textArea.value = code
    textArea.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)

    const originalText = button.textContent
    button.textContent = '✓ Скопировано!'
    button.classList.add('copied')

    setTimeout(() => {
      button.textContent = originalText || '📋 Копировать'
      button.classList.remove('copied')
    }, 2000)
  })
}

// Делаем функцию доступной глобально для onclick из HTML
if (typeof window !== 'undefined') {
  (window as any).copyCodeBlock = copyCodeBlock
}

// Функции для сохранения и загрузки состояния
function saveState() {
  if (selectedExample.value) {
    localStorage.setItem(STORAGE_KEYS.SELECTED_EXAMPLE, JSON.stringify({
      id: selectedExample.value.id,
      title: selectedExample.value.title
    }))
  }
  
  if (currentStep.value) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STEP, JSON.stringify({
      title: currentStep.value.title,
      file: currentStep.value.file
    }))
  }
  
  localStorage.setItem(STORAGE_KEYS.VIEW, view.value)
}

function loadSavedState() {
  try {
    const savedExample = localStorage.getItem(STORAGE_KEYS.SELECTED_EXAMPLE)
    if (savedExample) {
      const exampleData = JSON.parse(savedExample)
      const example = examples.value.find(e => e.id === exampleData.id)
      if (example) {
        setTimeout(() => {
          loadSteps(example, false).then(() => {
            const savedStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP)
            if (savedStep) {
              const stepData = JSON.parse(savedStep)
              const step = steps.value.find(s => s.file === stepData.file)
              if (step) {
                loadStep(step, true)
              }
            }
            
            const savedView = localStorage.getItem(STORAGE_KEYS.VIEW) as View
            if (savedView && ['list', 'steps', 'detail'].includes(savedView)) {
              view.value = savedView
            }
          })
        }, 100)
      }
    }
  } catch (e) {
    console.error('Ошибка при загрузке сохраненного состояния:', e)
    clearSavedState()
  }
}

function clearSavedState() {
  localStorage.removeItem(STORAGE_KEYS.SELECTED_EXAMPLE)
  localStorage.removeItem(STORAGE_KEYS.CURRENT_STEP)
  localStorage.removeItem(STORAGE_KEYS.VIEW)
}

watch([selectedExample, currentStep, view], () => {
  if (selectedExample.value || currentStep.value) {
    saveState()
  }
}, { deep: true })

onMounted(async () => {
  try {
    // Используем относительный путь для работы в dev и deploy
    const response = await fetch('./examples/index.json')
    if (!response.ok) throw new Error('')
    examples.value = await response.json()

    loadSavedState()
  } catch {
    error.value = 'Не удалось загрузить'
  } finally {
    loading.value = false
  }
})

async function loadSteps(example: Example, autoSelectStep = true) {
  selectedExample.value = example
  view.value = 'steps'
  steps.value = []
  stepContentsMap.value.clear()

  try {
    const response = await fetch(`./examples/${example.id}/steps.json`)
    if (response.ok) {
      steps.value = await response.json()
    } else {
      steps.value = [
        { title: 'Шаг 1: Введение', file: 'step1.md' },
        { title: 'Шаг 2: Настройка', file: 'step2.md' },
        { title: 'Шаг 3: Код', file: 'step3.md' }
      ]
    }

    // Добавляем шаг "Демо" в конец списка
    steps.value.push({
      title: 'Демо',
      file: 'sketch.js'
    })

    await Promise.all(steps.value.map(s => loadStep(s, false)))

    if (!autoSelectStep) return

    const savedStep = localStorage.getItem(STORAGE_KEYS.CURRENT_STEP)
    if (savedStep) {
      const stepData = JSON.parse(savedStep)
      const savedStepObj = steps.value.find(s => s.file === stepData.file)
      if (savedStepObj) {
        await loadStep(savedStepObj, true)
      }
    }
  } catch {
    steps.value = []
  }
}

async function loadStep(step: Step, show = true) {
  if (!selectedExample.value) return ''

  // Если это шаг "Демо", загружаем код и эмитим событие
  if (step.title === 'Демо' && step.file === 'sketch.js') {
    try {
      const response = await fetch(`./examples/${selectedExample.value.id}/${step.file}`)
      const code = await response.text()

      stepContentsMap.value.set(step.file, code)

      if (show) {
        switchToStep(step)
        emit('loadExample', code)
      }
      return code
    } catch (e) {
      console.error('Failed to load demo code', e)
      return 'Не удалось загрузить демо-код.'
    }
  }

  if (stepContentsMap.value.has(step.file)) {
    if (show) switchToStep(step)
    return stepContentsMap.value.get(step.file)
  }
  try {
    const response = await fetch(`./examples/${selectedExample.value.id}/${step.file}`)
    const text = await response.text()
    stepContentsMap.value.set(step.file, text)
    if (show) switchToStep(step)
    return text
  } catch {
    return ''
  }
}

function switchToStep(step: Step) {
  currentStep.value = step
  stepContent.value = stepContentsMap.value.get(step.file) || ''
  view.value = 'detail'
  
  saveState()
}

function goBack() {
  if (view.value === 'detail') {
    view.value = 'steps'
  } else if (view.value === 'steps') {
    view.value = 'list'
    selectedExample.value = null
    currentStep.value = null
    clearSavedState()
  }
}

function prepareContent(step: Step, body: string): string {
  const isDemo = step.title === 'Демо'

  if (isDemo) {
    return `// ${step.title}\n\n${body}`
  }

  return `${buildSystemPrompt(step.title)}\n${body}`
}

async function copy(step?: Step) {
  const s = step || currentStep.value
  if (!s) return
  const body = stepContentsMap.value.get(s.file) || stepContent.value
  const content = prepareContent(s, body)

  try {
    await navigator.clipboard.writeText(content)
    showNotification('Скопировано → вставьте в чат')
  } catch {
    const ta = document.createElement('textarea')
    ta.value = content
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    showNotification('Скопировано → вставьте в чат')
  }
}

function download(step?: Step) {
  const s = step || currentStep.value
  if (!s) return
  const body = stepContentsMap.value.get(s.file) || stepContent.value
  const content = prepareContent(s, body)

  const isDemo = s.title === 'Демо'
  const ext = isDemo ? 'js' : (isMarkdownFile(s.file) ? 'md' : 'txt')
  const name = `${selectedExample.value?.id}_${s.title.replace(/\s+/g, '_')}.${ext}`

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 100)
  showNotification(`Скачан: ${name}`)
}

// Переключение между markdown-рендером и исходником
const showRawMarkdown = ref(false)

function toggleMarkdownView() {
  showRawMarkdown.value = !showRawMarkdown.value
}

function scrollToTop() {
  setTimeout(() => {
    // Прокручиваем внешний контейнер
    const scrollContainer = document.querySelector('.scroll.detail')
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
    }
    
    // Прокручиваем markdown-body (если есть)
    const markdownBody = document.querySelector('.scroll.detail .markdown-body')
    if (markdownBody) {
      markdownBody.scrollTop = 0
    }
    
    // Прокручиваем code блок (если есть)
    const codeBlock = document.querySelector('.scroll.detail .code')
    if (codeBlock) {
      codeBlock.scrollTop = 0
    }
  }, 50)
}

// Следим за изменением текущего шага и прокручиваем вверх
watch(currentStep, () => {
  nextTick(() => {
    scrollToTop()
  })
})

const filteredExamples = computed(() => {
  if (!searchQuery.value) return examples.value
  const q = searchQuery.value.toLowerCase()
  return examples.value.filter(e =>
    e.title.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q)
  )
})

function handleClose() {
  emit('close')
}

// Навигация по шагам (исключая Демо)
const stepsWithoutDemo = computed(() => steps.value.filter(s => s.title !== 'Демо'))

const currentStepIndex = computed(() => {
  if (!currentStep.value) return -1
  return stepsWithoutDemo.value.findIndex(s => s.file === currentStep.value!.file)
})

const hasPrevStep = computed(() => currentStepIndex.value > 0)
const hasNextStep = computed(() => {
  return currentStepIndex.value < stepsWithoutDemo.value.length - 1
})

function goToPrevStep() {
  if (hasPrevStep.value) {
    const prevStep = stepsWithoutDemo.value[currentStepIndex.value - 1]
    if (prevStep) {
      loadStep(prevStep)
    }
  }
}

function goToNextStep() {
  if (hasNextStep.value) {
    const nextStep = stepsWithoutDemo.value[currentStepIndex.value + 1]
    if (nextStep) {
      loadStep(nextStep)
    }
  }
}
</script>

<template>
  <div class="panel" :class="theme">
    <Transition name="fade">
      <div v-if="notification" class="notif">{{ notification }}</div>
    </Transition>

    <div class="header">
      <button v-if="view !== 'list'" class="btn-icon" @click="goBack">←</button>
      <span class="title">
        <template v-if="view === 'list'">Примеры</template>
        <template v-else-if="view === 'steps'">{{ selectedExample?.title }}</template>
        <template v-else>{{ currentStep?.title }}</template>
      </span>
      <!-- Кнопка переключения Markdown/Raw для detail view -->
      <button
        v-if="view === 'detail' && isCurrentStepMarkdown"
        class="btn-icon toggle-md"
        :title="showRawMarkdown ? 'Показать форматированный' : 'Показать исходник'"
        @click="toggleMarkdownView"
      >
        {{ showRawMarkdown ? '📖' : '{ }' }}
      </button>
      <button class="btn-icon" @click="handleClose">×</button>
    </div>

    <div v-if="view === 'list'" class="search-wrap">
      <input v-model="searchQuery" placeholder="Поиск..." class="search" />
    </div>

    <div v-if="view === 'list'" class="scroll">
      <div v-if="loading" class="empty">Загрузка...</div>
      <div v-else-if="error" class="empty">Ошибка</div>
      <div v-else-if="!filteredExamples.length" class="empty">Нет результатов</div>
      <div v-else class="grid">
        <div 
          v-for="ex in filteredExamples" 
          :key="ex.id" 
          class="card" 
          :class="{ 'active': selectedExample?.id === ex.id }"
          @click="loadSteps(ex)"
        >
          <div class="card-top" :style="{ background: ex.color || '#5b5bd6' }" />
          <div class="card-body">
            <strong class="card-title">{{ ex.title }}</strong>
            <span class="card-tag">{{ ex.difficulty }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="view === 'steps'" class="scroll">
      <div v-if="!steps.length" class="empty">Нет шагов</div>
      <div 
        v-for="(step, idx) in steps" 
        :key="step.file" 
        class="step-row"
        :class="{ 'active-step': currentStep?.file === step.file }"
        @click="loadStep(step)"
      >
        <span class="step-num">{{ idx + 1 }}</span>
        <span class="step-title">
          {{ step.title }}
          <span v-if="step.title === 'Демо'" class="demo-badge">загрузит код</span>
          <span v-else-if="isMarkdownFile(step.file)" class="md-badge">md</span>
        </span>
        <span class="step-actions">
          <button class="btn-s" @click.stop="copy(step)" title="Копировать">📋</button>
          <button class="btn-s" @click.stop="download(step)" title="Скачать">↓</button>
        </span>
      </div>
    </div>

    <div v-else class="scroll detail">
      <!-- Markdown рендер -->
      <div
        v-if="isCurrentStepMarkdown && !showRawMarkdown"
        class="markdown-body"
        v-html="renderedStepContent"
      />
      <!-- Обычный текст / исходник markdown / код -->
      <div v-else class="code">{{ stepContent }}</div>

      <!-- Навигация между шагами -->
      <div class="step-nav">
        <button
          class="btn btn-nav"
          :disabled="!hasPrevStep"
          @click="goToPrevStep"
        >
          ← Назад
        </button>
        <span class="step-counter">
          {{ currentStepIndex + 1 }} / {{ stepsWithoutDemo.length }}
        </span>
        <button
          class="btn btn-nav"
          :disabled="!hasNextStep"
          @click="goToNextStep"
        >
          Далее →
        </button>
      </div>

      <div class="actions">
        <button class="btn" @click="copy()">📋 Скопировать с промптом</button>
        <button class="btn" @click="download()">↓ Скачать</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  /* Убрана фиксированная ширина — теперь растягивается по родителю */
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 16px;
  position: relative;
  z-index: 100;
}
.panel.light { background: #f5f5f7; color: #1a1a2e; }

.header {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #2a2a4a;
  gap: 12px;
  flex-shrink: 0;
}
.panel.light .header { border-color: #e0e0e0; }

.title {
  flex: 1;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-icon {
  background: none;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.btn-icon:hover { background: rgba(255,255,255,0.1); }
.panel.light .btn-icon:hover { background: rgba(0,0,0,0.06); }

.toggle-md {
  font-size: 14px;
  padding: 4px 10px;
  background: rgba(91, 91, 214, 0.15);
  border-radius: 6px;
}
.toggle-md:hover { background: rgba(91, 91, 214, 0.3); }

.search-wrap { padding: 12px 16px; border-bottom: 1px solid #2a2a4a; }
.panel.light .search-wrap { border-color: #e0e0e0; }
.search {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #3a3a5a;
  border-radius: 8px;
  background: #12122a;
  color: inherit;
  font-size: 14px;
}
.panel.light .search { background: #fff; border-color: #d0d0d0; }

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}
.scroll::-webkit-scrollbar { width: 4px; }
.scroll::-webkit-scrollbar-thumb { background: #4a4a6a; border-radius: 2px; }

.empty {
  text-align: center;
  padding: 40px;
  color: #888;
}

.grid { display: flex; flex-direction: column; gap: 10px; }
.card {
  background: #222240;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
  overflow: hidden;
  border: 1px solid transparent;
}
.card:hover { background: #2a2a50; }
.card.active {
  border-color: #5b5bd6;
  box-shadow: 0 0 0 2px rgba(91, 91, 214, 0.3);
}
.panel.light .card { background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.panel.light .card:hover { background: #f0f0f5; }

.card-top { height: 4px; }
.card-body { padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 14px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(91,91,214,0.2);
  color: #9b9bf0;
  flex-shrink: 0;
  margin-left: 8px;
}

.step-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  gap: 8px;
  border: 1px solid transparent;
}
.step-row:hover { background: #2a2a50; }
.step-row.active-step {
  background: rgba(91, 91, 214, 0.2);
  border-color: #5b5bd6;
}
.panel.light .step-row:hover { background: #f0f0f5; }
.panel.light .step-row.active-step {
  background: rgba(91, 91, 214, 0.1);
  border-color: #5b5bd6;
}

.step-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: rgba(91, 91, 214, 0.2);
  color: #9b9bf0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}
.step-row.active-step .step-num {
  background: #5b5bd6;
  color: white;
}

.step-title {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: break-word;
}

.demo-badge {
  font-size: 10px;
  padding: 2px 8px;
  background: #5b5bd6;
  color: white;
  border-radius: 12px;
  text-transform: uppercase;
  margin-left: 8px;
}

.md-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(46, 160, 67, 0.2);
  color: #3fb950;
  border-radius: 8px;
  font-weight: 600;
  margin-left: 6px;
  text-transform: uppercase;
}

.step-actions { display: flex; gap: 4px; flex-shrink: 0; }

.btn-s {
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  color: inherit;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-s:hover { background: rgba(91,91,214,0.3); }
.panel.light .btn-s { background: rgba(0,0,0,0.04); }

.detail { display: flex; flex-direction: column; gap: 12px; }

.code {
  flex: 1;
  overflow-y: auto;
  font-family: 'JetBrains Mono', 'Cascadia Code', monospace;
  font-variant-ligatures: none;
  font-feature-settings: 'liga' 0, 'calt' 0;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 12px;
  background: #12122a;
  border-radius: 8px;
}
.panel.light .code { background: #f8f8fa; }

/* ==========================================
   Markdown rendered content styles
   ========================================== */
.markdown-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #12122a;
  border-radius: 8px;
  line-height: 1.7;
  font-size: 16px;
}
.panel.light .markdown-body {
  background: #fff;
}

/* Deep styles for rendered markdown HTML */
.markdown-body :deep(h1) {
  font-size: 1.6em;
  font-weight: 700;
  margin: 0 0 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #2a2a4a;
  color: #c9b1ff;
}
.panel.light .markdown-body :deep(h1) {
  color: #5b5bd6;
  border-color: #e0e0e0;
}

.markdown-body :deep(h2) {
  font-size: 1.35em;
  font-weight: 600;
  margin: 24px 0 12px;
  color: #a8c7fa;
}
.panel.light .markdown-body :deep(h2) {
  color: #333;
}

.markdown-body :deep(h3) {
  font-size: 1.15em;
  font-weight: 600;
  margin: 20px 0 8px;
  color: #9ecbff;
}
.panel.light .markdown-body :deep(h3) {
  color: #444;
}

.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  font-size: 1em;
  font-weight: 600;
  margin: 16px 0 8px;
}

.markdown-body :deep(p) {
  margin: 0 0 12px;
  line-height: 1.7;
}

.markdown-body :deep(a) {
  color: #7c9dff;
  text-decoration: none;
}
.markdown-body :deep(a:hover) {
  text-decoration: underline;
}
.panel.light .markdown-body :deep(a) {
  color: #5b5bd6;
}

.markdown-body :deep(strong) {
  font-weight: 600;
  color: #f0e6ff;
}
.panel.light .markdown-body :deep(strong) {
  color: #1a1a2e;
}

.markdown-body :deep(em) {
  font-style: italic;
  color: #c0c0d0;
}
.panel.light .markdown-body :deep(em) {
  color: #555;
}

/* Inline code */
.markdown-body :deep(code) {
  font-family: 'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace;
  font-variant-ligatures: none;
  font-feature-settings: 'liga' 0, 'calt' 0;
  font-size: 0.88em;
  padding: 2px 6px;
  background: rgba(91, 91, 214, 0.15);
  border-radius: 4px;
  color: #c9b1ff;
}
.panel.light .markdown-body :deep(code) {
  background: rgba(91, 91, 214, 0.08);
  color: #5b5bd6;
}

/* Code blocks */
.markdown-body :deep(pre) {
  margin: 12px 0;
  padding: 14px;
  background: #0d0d1a;
  border-radius: 8px;
  overflow-x: auto;
  border: 1px solid #2a2a4a;
}
.panel.light .markdown-body :deep(pre) {
  background: #f5f5f7;
  border-color: #e0e0e0;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  border-radius: 0;
  font-size: 13px;
  line-height: 1.5;
  color: #d4d4d4;
  font-variant-ligatures: none;
  font-feature-settings: 'liga' 0, 'calt' 0;
}
.panel.light .markdown-body :deep(pre code) {
  color: #333;
}

/* Code blocks with copy button */
.markdown-body :deep(.code-block-wrapper) {
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #2a2a4a;
}
.panel.light .markdown-body :deep(.code-block-wrapper) {
  border-color: #e0e0e0;
}

.markdown-body :deep(.code-block-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #1a1a2e;
  border-bottom: 1px solid #2a2a4a;
}
.panel.light .markdown-body :deep(.code-block-header) {
  background: #e8e8ea;
  border-color: #d0d0d0;
}

.markdown-body :deep(.code-lang) {
  font-size: 12px;
  font-weight: 600;
  color: #9b9bf0;
  text-transform: uppercase;
}
.panel.light .markdown-body :deep(.code-lang) {
  color: #5b5bd6;
}

.markdown-body :deep(.copy-code-btn) {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: none;
  border-radius: 6px;
  background: rgba(91, 91, 214, 0.2);
  color: #9b9bf0;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.markdown-body :deep(.copy-code-btn:hover) {
  background: rgba(91, 91, 214, 0.35);
  color: #c9b1ff;
}
.panel.light .markdown-body :deep(.copy-code-btn) {
  background: rgba(91, 91, 214, 0.15);
  color: #5b5bd6;
}
.panel.light .markdown-body :deep(.copy-code-btn:hover) {
  background: rgba(91, 91, 214, 0.25);
  color: #333;
}

.markdown-body :deep(.copy-code-btn.copied) {
  background: #2ea043;
  color: white;
}
.panel.light .markdown-body :deep(.copy-code-btn.copied) {
  background: #2ea043;
  color: white;
}

.markdown-body :deep(.code-block-wrapper pre) {
  margin: 0;
  padding: 14px;
  background: #0d0d1a;
  border-radius: 0;
  overflow-x: auto;
  border: none;
}
.panel.light .markdown-body :deep(.code-block-wrapper pre) {
  background: #f5f5f7;
}

/* Details/Summary (спойлеры) */
.markdown-body :deep(details) {
  margin: 12px 0;
  border: 1px solid #2a2a4a;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(91, 91, 214, 0.05);
}

.panel.light .markdown-body :deep(details) {
  border-color: #e0e0e0;
  background: rgba(91, 91, 214, 0.03);
}

.markdown-body :deep(summary) {
  padding: 10px 14px;
  background: rgba(91, 91, 214, 0.15);
  cursor: pointer;
  font-weight: 600;
  user-select: none;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s;
}

.panel.light .markdown-body :deep(summary) {
  background: rgba(91, 91, 214, 0.08);
}

.markdown-body :deep(summary:hover) {
  background: rgba(91, 91, 214, 0.25);
}

.panel.light .markdown-body :deep(summary:hover) {
  background: rgba(91, 91, 214, 0.15);
}

.markdown-body :deep(summary::-webkit-details-marker) {
  display: none;
}

.markdown-body :deep(summary::before) {
  content: '▶';
  font-size: 10px;
  color: #9b9bf0;
  transition: transform 0.2s;
}

.markdown-body :deep(details[open] summary::before) {
  transform: rotate(90deg);
}

.markdown-body :deep(details[open] summary) {
  border-bottom: 1px solid #2a2a4a;
}

.panel.light .markdown-body :deep(details[open] summary) {
  border-bottom-color: #e0e0e0;
}

.markdown-body :deep(.details-content) {
  padding: 14px;
}

/* Highlight.js syntax highlighting */
.markdown-body :deep(.hljs-keyword) { color: #ff79c6; }
.markdown-body :deep(.hljs-function) { color: #8be9fd; }
.markdown-body :deep(.hljs-built_in) { color: #8be9fd; }
.markdown-body :deep(.hljs-number) { color: #bd93f9; }
.markdown-body :deep(.hljs-string) { color: #f1fa8c; }
.markdown-body :deep(.hljs-comment) { color: #6272a4; font-style: italic; }
.markdown-body :deep(.hljs-operator) { color: #ff79c6; }
.markdown-body :deep(.hljs-variable) { color: #f8f8f2; }
.markdown-body :deep(.hljs-params) { color: #ffb86c; }
.markdown-body :deep(.hljs-property) { color: #50fa7b; }
.markdown-body :deep(.hljs-class) { color: #8be9fd; }
.markdown-body :deep(.hljs-title) { color: #50fa7b; }
.markdown-body :deep(.hljs-title.class_) { color: #8be9fd; }
.markdown-body :deep(.hljs-title.function_) { color: #50fa7b; }

/* Light theme syntax colors */
.panel.light .markdown-body :deep(.hljs-keyword) { color: #d73a49; }
.panel.light .markdown-body :deep(.hljs-function) { color: #6f42c1; }
.panel.light .markdown-body :deep(.hljs-built_in) { color: #005cc5; }
.panel.light .markdown-body :deep(.hljs-number) { color: #005cc5; }
.panel.light .markdown-body :deep(.hljs-string) { color: #032f62; }
.panel.light .markdown-body :deep(.hljs-comment) { color: #6a737d; font-style: italic; }
.panel.light .markdown-body :deep(.hljs-operator) { color: #d73a49; }
.panel.light .markdown-body :deep(.hljs-variable) { color: #24292e; }
.panel.light .markdown-body :deep(.hljs-params) { color: #e36209; }
.panel.light .markdown-body :deep(.hljs-property) { color: #22863a; }
.panel.light .markdown-body :deep(.hljs-class) { color: #22863a; }
.panel.light .markdown-body :deep(.hljs-title) { color: #22863a; }
.panel.light .markdown-body :deep(.hljs-title.class_) { color: #6f42c1; }
.panel.light .markdown-body :deep(.hljs-title.function_) { color: #6f42c1; }

/* Lists */
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 8px 0 16px;
  padding-left: 24px;
}

.markdown-body :deep(li) {
  margin: 4px 0;
  line-height: 1.6;
}

.markdown-body :deep(ul li::marker) {
  color: #5b5bd6;
}

.markdown-body :deep(ol li::marker) {
  color: #5b5bd6;
  font-weight: 600;
}

/* Blockquote */
.markdown-body :deep(blockquote) {
  margin: 12px 0;
  padding: 10px 16px;
  border-left: 3px solid #5b5bd6;
  background: rgba(91, 91, 214, 0.08);
  border-radius: 0 8px 8px 0;
  color: #b0b0c0;
}
.panel.light .markdown-body :deep(blockquote) {
  background: rgba(91, 91, 214, 0.05);
  color: #555;
}

.markdown-body :deep(blockquote p) {
  margin: 0;
}

/* Horizontal rule */
.markdown-body :deep(hr) {
  border: none;
  border-top: 1px solid #2a2a4a;
  margin: 20px 0;
}
.panel.light .markdown-body :deep(hr) {
  border-color: #e0e0e0;
}

/* Tables */
.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 13px;
}

.markdown-body :deep(th) {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 2px solid #3a3a5a;
  font-weight: 600;
  color: #c9b1ff;
}
.panel.light .markdown-body :deep(th) {
  border-color: #d0d0d0;
  color: #333;
}

.markdown-body :deep(td) {
  padding: 8px 12px;
  border-bottom: 1px solid #2a2a4a;
}
.panel.light .markdown-body :deep(td) {
  border-color: #e8e8e8;
}

.markdown-body :deep(tr:hover td) {
  background: rgba(255, 255, 255, 0.03);
}
.panel.light .markdown-body :deep(tr:hover td) {
  background: rgba(0, 0, 0, 0.02);
}

/* Images */
.markdown-body :deep(img) {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
  display: block;
  object-fit: contain;
}

/* Task lists */
.markdown-body :deep(input[type="checkbox"]) {
  margin-right: 6px;
  accent-color: #5b5bd6;
}

/* Step navigation */
.step-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.step-counter {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.btn-nav {
  padding: 8px 14px !important;
  font-size: 12px !important;
  background: rgba(91, 91, 214, 0.15) !important;
  color: #9b9bf0 !important;
}
.btn-nav:hover:not(:disabled) {
  background: rgba(91, 91, 214, 0.3) !important;
}
.btn-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed !important;
}

.actions { display: flex; gap: 8px; }
.btn {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: #5b5bd6;
  color: white;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: background 0.15s;
}
.btn:hover { background: #6e6ee0; }

.notif {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 20px;
  background: #333;
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

.fade-enter-active, .fade-leave-active { transition: all 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }
</style>