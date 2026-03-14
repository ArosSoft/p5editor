<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

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

function buildSystemPrompt(stepTitle: string): string {
  return `Инструкции для проведения занятия по изучению javascript с помощью P5.js для детей 6 класса на основе текстового описания очередного шага занятия (текст ниже правил).
1. Структура шага (Жесткая последовательность):
• Сначала я должен рассказать про цель шага.
• Затем я должен кратко пересказать текст шага, останавливаясь на ключевых моментах и особенностях. Написать один-два абзаца и ждать пока ученик прочитает и поймет.
• Предлагать ученику добавить строки кода в программу и пробовать запускать.
• Предлагать запускать код после ключевых вставок кода и наблюдать за результатом.
• Если результат не соответствует ожиданиям, предложить ученику изменить код и запустить заново.
• Спрашивать какие баги появились на экране и есть ли ошибки в консоли.
• Поздравь ученика в конце шага и дай вдохновляющий совет.
2. Моя роль и стиль общения:
• Я — учитель, который направляет, а не пишет код за ученика.
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

onMounted(async () => {
  try {
    const response = await fetch('examples/index.json')
    if (!response.ok) throw new Error('')
    examples.value = await response.json()
  } catch {
    error.value = 'Не удалось загрузить'
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
      steps.value = await response.json()
    } else {
      steps.value = [
        { title: 'Шаг 1: Введение', file: 'step1.txt' },
        { title: 'Шаг 2: Настройка', file: 'step2.txt' },
        { title: 'Шаг 3: Код', file: 'step3.txt' },
        { title: 'Демо', file: 'sketch.js' }
      ]
    }
    await Promise.all(steps.value.map(s => loadStep(s, false)))
  } catch {
    steps.value = []
  }
}

async function loadStep(step: Step, show = true) {
  if (!selectedExample.value) return ''
  if (stepContentsMap.value.has(step.file)) {
    if (show) switchToStep(step)
    return stepContentsMap.value.get(step.file)
  }
  try {
    const response = await fetch(`/examples/${selectedExample.value.id}/${step.file}`)
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
  if (step.title === 'Демо') emit('loadExample', stepContent.value)
}

function goBack() {
  view.value = view.value === 'detail' ? 'steps' : 'list'
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
  const ext = isDemo ? 'js' : 'txt'
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

const filteredExamples = computed(() => {
  if (!searchQuery.value) return examples.value
  const q = searchQuery.value.toLowerCase()
  return examples.value.filter(e =>
    e.title.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q)
  )
})
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
      <button class="btn-icon" @click="emit('close')">×</button>
    </div>

    <div v-if="view === 'list'" class="search-wrap">
      <input v-model="searchQuery" placeholder="Поиск..." class="search" />
    </div>

    <div v-if="view === 'list'" class="scroll">
      <div v-if="loading" class="empty">Загрузка...</div>
      <div v-else-if="error" class="empty">Ошибка</div>
      <div v-else-if="!filteredExamples.length" class="empty">Нет результатов</div>
      <div v-else class="grid">
        <div v-for="ex in filteredExamples" :key="ex.id" class="card" @click="loadSteps(ex)">
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
      <div v-for="step in steps" :key="step.file" class="step-row" @click="loadStep(step)">
        <span class="step-title">{{ step.title }}</span>
        <span class="step-actions">
          <button class="btn-s" @click.stop="copy(step)">📋</button>
          <button class="btn-s" @click.stop="download(step)">↓</button>
        </span>
      </div>
    </div>

    <div v-else class="scroll detail">
      <div class="code">{{ stepContent }}</div>
      <div class="actions">
        <button class="btn" @click="copy()">📋 Скопировать с промптом</button>
        <button class="btn" @click="download()">↓ Скачать</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  width: 420px;
  height: 100%;
  background: #1a1a2e;
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
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
  transition: background 0.15s;
  overflow: hidden;
}
.card:hover { background: #2a2a50; }
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
  transition: background 0.15s;
  gap: 8px;
}
.step-row:hover { background: #2a2a50; }
.panel.light .step-row:hover { background: #f0f0f5; }

.step-title {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: break-word;
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

.detail { display: flex; flex-direction: column; }
.code {
  flex: 1;
  overflow-y: auto;
  font-family: 'JetBrains Mono', 'Cascadia Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  padding: 12px;
  background: #12122a;
  border-radius: 8px;
  margin-bottom: 12px;
}
.panel.light .code { background: #f8f8fa; }

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