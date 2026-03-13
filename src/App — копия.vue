<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import CodeEditor from './components/CodeEditor.vue'
import P5Canvas from './components/P5Canvas.vue'
import ConsoleOutput from './components/ConsoleOutput.vue'
import ExamplesPanel from './components/ExamplesPanel.vue'
import { saveAs } from 'file-saver'
import beautify from 'js-beautify'
import AIChat from './components/AIChat.vue'

const code = ref(`function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  ellipse(mouseX, mouseY, 50, 50);
}`)

// Сохраняем оригинальный код для сброса
const originalCode = ref(code.value)

const messages = ref<string[]>([])
const canvasRef = ref<InstanceType<typeof P5Canvas> | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Управление видимостью панели с примерами
const showExamples = ref(false)

// Параметры шрифта
const fontSize = ref(15)
const fontFamily = ref('Consolas, Monaco, monospace')

// Параметры темы
type Theme = 'dark' | 'light'
const theme = ref<Theme>('dark')

// История изменений для Undo/Redo
const history = ref<string[]>([])
const historyIndex = ref(-1)

// Управление консолью
const consoleHeight = ref(150)
const isConsoleVisible = ref(true)
const isDragging = ref(false)
const startY = ref(0)
const startHeight = ref(150)

// Управление шириной блока редактора
const editorWidth = ref(50) // в процентах
const isResizing = ref(false)

// Управление боковым меню
const isMenuExpanded = ref(false)
const activeMenuItem = ref<string | null>(null)

// AI chat
const showAIChat = ref(false)

// Название скетча
const sketchName = ref('Мой первый скетч')

// Координаты мыши
const mouseX = ref(0)
const mouseY = ref(0)

// Функция для обновления координат мыши
function updateMouseCoordinates(x: number, y: number) {
  mouseX.value = Math.round(x)
  mouseY.value = Math.round(y)
}

// Добавить функцию для обработки сообщений от AI
function handleAIMessage(message: string) {
  addMessage(`🤖 AI запрос: ${message}`)
  // Здесь можно добавить логику для влияния на скетч через AI
  // Например, модификация кода на основе сообщения
}

// Обработчики для изменения размера консоли
function startResize(e: MouseEvent) {
  isDragging.value = true
  startY.value = e.clientY
  startHeight.value = consoleHeight.value
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
}

function onResize(e: MouseEvent) {
  if (!isDragging.value) return
  
  const deltaY = startY.value - e.clientY
  const newHeight = Math.min(
    Math.max(50, startHeight.value + deltaY),
    window.innerHeight * 0.5
  )
  consoleHeight.value = newHeight
}

function stopResize() {
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// Обработчики для изменения ширины редактора - ОПТИМИЗИРОВАНО
function startHorizontalResize(e: MouseEvent) {
  isResizing.value = true
  startX = e.clientX
  startWidth = editorWidth.value
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  
  // Добавляем класс для отключения transition во время перетаскивания
  const editorPanel = document.querySelector('.editor-panel') as HTMLElement
  const canvasPanel = document.querySelector('.canvas-panel') as HTMLElement
  if (editorPanel) editorPanel.style.transition = 'none'
  if (canvasPanel) canvasPanel.style.transition = 'none'
}

// Используем обычные переменные для более быстрого обновления
let startX = 0
let startWidth = 50

function onHorizontalResize(e: MouseEvent) {
  if (!isResizing.value) return
  
  const mainContent = document.querySelector('.main-content') as HTMLElement
  if (!mainContent) return
  
  // Прямое обновление DOM для плавности
  const deltaX = e.clientX - startX
  const containerWidth = mainContent.clientWidth
  const newWidth = Math.min(
    Math.max(30, startWidth + (deltaX / containerWidth) * 100),
    70
  )
  
  // Обновляем CSS переменную напрямую
  document.documentElement.style.setProperty('--editor-width', newWidth + '%')
  
  // Обновляем ref только после окончания перетаскивания
  editorWidth.value = newWidth
}

function stopHorizontalResize() {
  isResizing.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  
  // Возвращаем transition
  const editorPanel = document.querySelector('.editor-panel') as HTMLElement
  const canvasPanel = document.querySelector('.canvas-panel') as HTMLElement
  if (editorPanel) editorPanel.style.transition = ''
  if (canvasPanel) canvasPanel.style.transition = ''
}

function toggleConsole() {
  isConsoleVisible.value = !isConsoleVisible.value
  if (isConsoleVisible.value) {
    addMessage('📋 Консоль показана')
  } else {
    addMessage('📋 Консоль скрыта')
  }
}

onMounted(() => {
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', stopResize)
  window.addEventListener('mousemove', onHorizontalResize)
  window.addEventListener('mouseup', stopHorizontalResize)
  window.addEventListener('keydown', handleKeyDown)
  
  // Устанавливаем начальное значение CSS переменной
  document.documentElement.style.setProperty('--editor-width', editorWidth.value + '%')
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
  window.removeEventListener('mousemove', onHorizontalResize)
  window.removeEventListener('mouseup', stopHorizontalResize)
  window.removeEventListener('keydown', handleKeyDown)
})

function addMessage(msg: string) {
  messages.value.push(msg)
  setTimeout(() => {
    const console = document.querySelector('.console-content')
    if (console) {
      console.scrollTop = console.scrollHeight
    }
  }, 100)
}

function clearConsole() {
  messages.value = []
  addMessage('🧹 Консоль очищена')
}

function startSketch() {
  addMessage('🚀 Запуск скетча...')
  try {
    canvasRef.value?.start(code.value)
  } catch (e: any) {
    addMessage(`❌ Ошибка запуска: ${e.message}`)
  }
}

function stopSketch() {
  addMessage('⏹️ Остановка скетча...')
  canvasRef.value?.stop()
}

// ОБНОВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ
function saveSketch() {
  // Очищаем название от недопустимых символов для имени файла
  const cleanName = sketchName.value
    .replace(/[^a-zа-яё0-9\s_-]/gi, '') // Удаляем спецсимволы
    .replace(/\s+/g, '_') // Заменяем пробелы на подчеркивания
    .toLowerCase() || 'sketch' // Если имя пустое, используем 'sketch'
  
  const fileName = `${cleanName}.js`
  
  const blob = new Blob([code.value], { type: 'text/javascript;charset=utf-8' })
  saveAs(blob, fileName)
  addMessage(`💾 Скетч сохранён как "${fileName}"`)
}

function loadSketch() {
  fileInput.value?.click()
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      saveToHistory()
      code.value = e.target?.result as string
      // Извлекаем имя файла без расширения для поля названия
      const fileName = file.name.replace('.js', '').replace(/_/g, ' ')
      sketchName.value = fileName
      addMessage(`📂 Скетч загружен: ${file.name}`)
    }
    reader.readAsText(file)
  }
}

function increaseFontSize() {
  fontSize.value = Math.min(32, fontSize.value + 1)
}

function decreaseFontSize() {
  fontSize.value = Math.max(8, fontSize.value - 1)
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  addMessage(`🎨 Тема изменена на ${theme.value === 'dark' ? 'тёмную' : 'светлую'}`)
}

function resetToExample() {
  if (confirm('Восстановить пример кода?')) {
    saveToHistory()
    code.value = originalCode.value
    addMessage('🔄 Восстановлен пример кода')
  }
}

function copyToClipboard() {
  navigator.clipboard.writeText(code.value).then(() => {
    addMessage('📋 Код скопирован в буфер обмена')
  }).catch(() => {
    addMessage('❌ Не удалось скопировать код')
  })
}

function formatCode() {
  try {
    saveToHistory()
    
    const formatted = beautify(code.value, {
      indent_size: 2,
      indent_char: ' ',
      max_preserve_newlines: 2,
      preserve_newlines: true,
      keep_array_indentation: false,
      break_chained_methods: false,
      indent_scripts: 'normal',
      brace_style: 'collapse',
      space_before_conditional: true,
      unescape_strings: false,
      jslint_happy: false,
      end_with_newline: true,
      wrap_line_length: 80,
      indent_inner_html: false,
      comma_first: false,
      e4x: false,
      indent_empty_lines: false
    })
    
    code.value = formatted
    addMessage('✨ Код отформатирован')
  } catch (e) {
    console.error('Ошибка форматирования:', e)
    addMessage('❌ Ошибка форматирования')
  }
}

function saveToHistory() {
  if (code.value !== history.value[historyIndex.value]) {
    history.value = history.value.slice(0, historyIndex.value + 1)
    history.value.push(code.value)
    historyIndex.value = history.value.length - 1
  }
}

function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--
    code.value = history.value[historyIndex.value]
    addMessage('↩️ Отмена действия')
  } else {
    addMessage('⚠️ Нечего отменять')
  }
}

function redo() {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++
    code.value = history.value[historyIndex.value]
    addMessage('↪️ Возврат действия')
  } else {
    addMessage('⚠️ Нечего возвращать')
  }
}

function showShortcuts() {
  addMessage('⌨️ Горячие клавиши: Ctrl+Enter - запуск, Ctrl+S - сохранить, Ctrl+Z - отмена, Ctrl+Y - повтор, Ctrl+` - консоль')
}

function toggleExamples() {
  showExamples.value = !showExamples.value
  if (showExamples.value) {
    addMessage('📚 Открыта галерея примеров')
  } else {
    addMessage('📚 Галерея примеров закрыта')
  }
}

function loadExample(exampleCode: string) {
  saveToHistory()
  code.value = exampleCode
  addMessage('📋 Пример загружен в редактор')
  startSketch()
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault()
    startSketch()
  }
  
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    saveSketch()
  }
  
  if (e.ctrlKey && e.key === 'z' && !(e.target as HTMLElement)?.matches?.('textarea, input, .cm-content')) {
    e.preventDefault()
    undo()
  }
  
  if (e.ctrlKey && e.key === 'y' && !(e.target as HTMLElement)?.matches?.('textarea, input, .cm-content')) {
    e.preventDefault()
    redo()
  }
  
  if (e.ctrlKey && e.key === '`') {
    e.preventDefault()
    toggleConsole()
  }
}

// Функции для бокового меню
function toggleMenuExpand() {
  isMenuExpanded.value = !isMenuExpanded.value
}

function setActiveMenuItem(item: string | null) {
  activeMenuItem.value = item
}
</script>

<template>
  <div class="app" :class="`theme-${theme}`">
    <!-- Декоративные элементы фона -->
    <div class="bg-decoration">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
      <div class="bg-grid"></div>
    </div>

    <!-- Верхняя панель (шапка сайта) -->
    <header class="top-bar" :class="`theme-${theme}`">
      <div class="top-bar-left">
        <button @click="startSketch" class="top-btn" title="Запустить скетч (Ctrl+Enter)">
          <span class="btn-icon">▶</span>
          <span class="btn-text">Старт</span>
        </button>
        <button @click="stopSketch" class="top-btn" title="Остановить скетч">
          <span class="btn-icon">■</span>
          <span class="btn-text">Стоп</span>
        </button>
        <button @click="formatCode" class="top-btn" title="Форматировать код">
          <span class="btn-icon">✨</span>
          <span class="btn-text">Форматировать</span>
        </button>
        
        <div class="sketch-name-wrapper">
          <input 
            type="text" 
            class="sketch-name-input" 
            placeholder="Название скетча" 
            v-model="sketchName"
          />
        </div>

        <button @click="toggleExamples" class="top-btn examples-btn" :class="{ 'active': showExamples }" title="Учебник по примерам">
          <span class="btn-icon">📚</span>
          <span class="btn-text">Учебник по примерам</span>
        </button>
      </div>

      <div class="top-bar-right">
        <button class="top-btn auth-btn" title="Войти">
          <span class="btn-icon">🔑</span>
          <span class="btn-text">Войти</span>
        </button>
        <button class="top-btn auth-btn register-btn" title="Регистрация">
          <span class="btn-icon">📝</span>
          <span class="btn-text">Регистрация</span>
        </button>
      </div>
    </header>

    <!-- Основной контент (под верхней панелью) -->
    <div class="main-content">
      <!-- Боковое меню -->
      <div class="side-menu" 
           :class="{ 'expanded': isMenuExpanded }"
           @mouseenter="toggleMenuExpand"
           @mouseleave="toggleMenuExpand">
        
        <!-- Логотип -->
        <div class="menu-logo">
          <svg class="logo-icon" viewBox="0 0 24 24" width="28" height="28">
            <path d="M12 2L2 7v10l10 5 10-5V7l-10-5z" fill="#646cff" stroke="currentColor" stroke-width="1"/>
            <path d="M12 12l4-2v4l-4 2-4-2v-4l4 2z" fill="#ffffff" opacity="0.8"/>
            <circle cx="12" cy="12" r="2" fill="#ff6b6b"/>
          </svg>
          <span class="logo-text" v-show="isMenuExpanded">p5.js</span>
        </div>

        <!-- Основные кнопки бокового меню -->
        <button @click="saveSketch" class="menu-item" title="Сохранить скетч (Ctrl+S)"
                @mouseenter="setActiveMenuItem('save')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">💾</span>
          <span class="menu-text" v-show="isMenuExpanded">Сохранить</span>
        </button>
        
        <button @click="loadSketch" class="menu-item" title="Загрузить скетч"
                @mouseenter="setActiveMenuItem('load')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">📂</span>
          <span class="menu-text" v-show="isMenuExpanded">Загрузить</span>
        </button>
        
        <button @click="showAIChat = true" class="menu-item" title="Deepseek AI помощник"
                @mouseenter="setActiveMenuItem('ai')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">🤖</span>
          <span class="menu-text" v-show="isMenuExpanded">AI помощник</span>
        </button>

        <!-- Кнопки изменения шрифта -->
        <button @click="increaseFontSize" class="menu-item" title="Увеличить шрифт"
                @mouseenter="setActiveMenuItem('font-up')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">+</span>
          <span class="menu-text" v-show="isMenuExpanded">Увеличить</span>
        </button>
        
        <button @click="decreaseFontSize" class="menu-item" title="Уменьшить шрифт"
                @mouseenter="setActiveMenuItem('font-down')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">−</span>
          <span class="menu-text" v-show="isMenuExpanded">Уменьшить</span>
        </button>

        <!-- Остальные кнопки -->
        <button @click="undo" class="menu-item" title="Отмена (Ctrl+Z)"
                @mouseenter="setActiveMenuItem('undo')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">↩️</span>
          <span class="menu-text" v-show="isMenuExpanded">Отмена</span>
        </button>
        
        <button @click="redo" class="menu-item" title="Повтор (Ctrl+Y)"
                @mouseenter="setActiveMenuItem('redo')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">↪️</span>
          <span class="menu-text" v-show="isMenuExpanded">Повтор</span>
        </button>
        
        <button @click="copyToClipboard" class="menu-item" title="Копировать код"
                @mouseenter="setActiveMenuItem('copy')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">📋</span>
          <span class="menu-text" v-show="isMenuExpanded">Копировать</span>
        </button>
        
        <button @click="resetToExample" class="menu-item" title="Восстановить пример"
                @mouseenter="setActiveMenuItem('reset')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">🔄</span>
          <span class="menu-text" v-show="isMenuExpanded">Сброс</span>
        </button>
        
        <button @click="clearConsole" class="menu-item" title="Очистить консоль"
                @mouseenter="setActiveMenuItem('console-clear')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">🧹</span>
          <span class="menu-text" v-show="isMenuExpanded">Очистить консоль</span>
        </button>
        
        <button @click="toggleConsole" class="menu-item" :title="isConsoleVisible ? 'Скрыть консоль (Ctrl+`)' : 'Показать консоль (Ctrl+`)'"
                @mouseenter="setActiveMenuItem('console-toggle')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">{{ isConsoleVisible ? '📋' : '📭' }}</span>
          <span class="menu-text" v-show="isMenuExpanded">{{ isConsoleVisible ? 'Скрыть' : 'Показать' }}</span>
        </button>
        
        <button @click="toggleTheme" class="menu-item" :title="`Тема: ${theme === 'dark' ? 'тёмная' : 'светлая'}`"
                @mouseenter="setActiveMenuItem('theme')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">{{ theme === 'dark' ? '🌙' : '☀️' }}</span>
          <span class="menu-text" v-show="isMenuExpanded">{{ theme === 'dark' ? 'Тёмная' : 'Светлая' }}</span>
        </button>
        
        <button @click="showShortcuts" class="menu-item" title="Горячие клавиши"
                @mouseenter="setActiveMenuItem('shortcuts')" @mouseleave="setActiveMenuItem(null)">
          <span class="menu-icon">⌨️</span>
          <span class="menu-text" v-show="isMenuExpanded">Клавиши</span>
        </button>

        <!-- Всплывающая подсказка для узкого меню -->
        <div class="menu-tooltip" v-if="!isMenuExpanded && activeMenuItem">
          {{ getTooltipText(activeMenuItem) }}
        </div>
      </div>

      <div class="main">
        <input type="file" ref="fileInput" style="display: none" @change="handleFileUpload" accept=".js" />
        
        <!-- Панель с примерами -->
        <ExamplesPanel 
          v-if="showExamples" 
          :theme="theme"
          @load-example="loadExample"
          @close="toggleExamples"
        />
        
        <!-- Левая панель: редактор + консоль -->
        <div class="editor-panel">
          <div class="editor-container" :class="`theme-${theme}`">
            <div class="editor-header">
              <div class="window-controls">
                <span class="window-control red"></span>
                <span class="window-control yellow"></span>
                <span class="window-control green"></span>
              </div>
              <span class="editor-title">sketch.js</span>
              <div class="editor-badge" v-if="history.length > 0">
                {{ historyIndex + 1 }}/{{ history.length }}
              </div>
            </div>
            <div class="editor-content">
              <CodeEditor 
                v-model="code" 
                :font-size="fontSize"
                :font-family="fontFamily"
                :theme="theme"
                @update:model-value="saveToHistory"
              />
            </div>
          </div>
          
          <!-- Консоль под редактором -->
          <div class="console-wrapper" :style="{ height: isConsoleVisible ? consoleHeight + 'px' : '0px' }">
            <div 
              class="console-resize-handle" 
              @mousedown="startResize"
              :class="{ 'dragging': isDragging }"
            >
              <div class="handle-line"></div>
              <div class="handle-line"></div>
              <div class="handle-line"></div>
            </div>
            <ConsoleOutput :messages="messages" :theme="theme" />
          </div>
        </div>

        <!-- Разделитель для изменения ширины -->
        <div 
          class="resize-handle-vertical"
          @mousedown="startHorizontalResize"
          :class="{ 'resizing': isResizing }"
        ></div>

        <!-- Правая панель: холст -->
        <div class="canvas-panel">
          <div class="canvas-container">
            <div class="canvas-header">
                <span class="canvas-title">Холст p5.js</span>
                <div class="mouse-coordinates">
                  <span class="coord-item">X = {{ mouseX }}</span>
                  <span class="coord-separator">/</span>
                  <span class="coord-item">Y = {{ mouseY }}</span>
                </div>
                <div class="canvas-indicator"></div>
              </div>
            <div class="canvas-content">
              <P5Canvas 
                ref="canvasRef" 
                :add-message="addMessage" 
                :theme="theme"
                @mouse-move="updateMouseCoordinates"
              />
            </div>
          </div>
        </div>

        <!-- Компонент AI чата -->
        <AIChat 
          v-model:is-visible="showAIChat"
          :theme="theme"
          :code="code"
          @send-message="handleAIMessage"
          @suggest-code="(newCode) => { code = newCode; addMessage('🤖 AI предложил код'); }"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// Функция для получения текста подсказки
function getTooltipText(item: string): string {
  const tooltips: Record<string, string> = {
    'save': 'Сохранить скетч (Ctrl+S)',
    'load': 'Загрузить скетч',
    'ai': 'Deepseek AI помощник',
    'font-up': 'Увеличить шрифт',
    'font-down': 'Уменьшить шрифт',
    'undo': 'Отмена (Ctrl+Z)',
    'redo': 'Повтор (Ctrl+Y)',
    'copy': 'Копировать код',
    'reset': 'Восстановить пример',
    'console-clear': 'Очистить консоль',
    'console-toggle': 'Показать/скрыть консоль (Ctrl+`)',
    'theme': 'Сменить тему',
    'shortcuts': 'Горячие клавиши'
  }
  return tooltips[item] || item
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  transition: background-color 0.3s, color 0.3s;
  position: relative;
  overflow: hidden;
}

/* Декоративные элементы фона */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.03;
  filter: blur(60px);
}

.app.theme-dark .bg-circle {
  background: #646cff;
}

.app.theme-light .bg-circle {
  background: #ff6b6b;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
}

.circle-3 {
  width: 200px;
  height: 200px;
  bottom: 200px;
  right: 200px;
}

.bg-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(rgba(100, 108, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100, 108, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
}

/* Тёмная тема */
.app.theme-dark {
  background-color: #1a1a1a;
  color: #ffffff;
}

/* Светлая тема */
.app.theme-light {
  background-color: #f8f9fa;
  color: #2c3e50;
}

/* Верхняя панель */
.top-bar {
  height: 60px;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #404040;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
  position: relative;
  flex-shrink: 0;
}

.top-bar.theme-light {
  background: rgba(255, 255, 255, 0.8);
  border-bottom-color: #e0e0e0;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.top-btn:hover {
  background: rgba(100, 108, 255, 0.3);
  transform: translateY(-2px);
}

.top-btn.active {
  background: rgba(100, 108, 255, 0.4);
  border-left: 2px solid #646cff;
}

.top-btn .btn-icon {
  font-size: 16px;
}

.top-btn .btn-text {
  font-size: 13px;
}

.theme-light .top-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.theme-light .top-btn:hover {
  background: rgba(100, 108, 255, 0.2);
}

/* Поле для названия скетча */
.sketch-name-wrapper {
  margin: 0 10px;
}

.sketch-name-input {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
  color: inherit;
  font-size: 14px;
  min-width: 200px;
  transition: all 0.2s;
}

.sketch-name-input:focus {
  outline: none;
  border-color: #646cff;
  background: rgba(0, 0, 0, 0.3);
}

.theme-light .sketch-name-input {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.2);
  color: #333;
}

.theme-light .sketch-name-input:focus {
  background: white;
  border-color: #646cff;
}

/* Кнопки авторизации */
.auth-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.auth-btn.register-btn {
  background: linear-gradient(135deg, #646cff, #9089fc);
  color: white;
  border: none;
}

.theme-light .auth-btn {
  border-color: rgba(0, 0, 0, 0.2);
}

.theme-light .auth-btn.register-btn {
  color: white;
}

/* Боковое меню (ВОССТАНОВЛЕНО) */
.side-menu {
  width: 60px;
  height: 100%;
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid #404040;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 2px;
  transition: width 0.3s ease;
  z-index: 90;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
}

.side-menu.expanded {
  width: 180px;
}

.app.theme-light .side-menu {
  background: rgba(255, 255, 255, 0.95);
  border-right-color: #e0e0e0;
}

.menu-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  width: 100%;
  margin-bottom: 8px;
}

.logo-icon {
  flex-shrink: 0;
}

.logo-text {
  font-weight: bold;
  font-size: 13px;
  white-space: nowrap;
  background: linear-gradient(135deg, #646cff, #9089fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  width: 100%;
  position: relative;
  white-space: nowrap;
  font-size: 13px;
}

.menu-item:hover {
  background: rgba(100, 108, 255, 0.2);
}

.menu-item.active {
  background: rgba(100, 108, 255, 0.3);
  border-left: 2px solid #646cff;
}

.menu-icon {
  font-size: 18px;
  min-width: 26px;
  text-align: center;
}

.menu-text {
  font-size: 12px;
  font-weight: 500;
}

/* Всплывающая подсказка */
.menu-tooltip {
  position: fixed;
  left: 70px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
  animation: fadeIn 0.2s;
  border: 1px solid #646cff;
}

.app.theme-light .menu-tooltip {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  border: 1px solid #646cff;
}

/* Основной контент */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* Левая панель (редактор + консоль) - используем CSS переменную */
.editor-panel {
  width: var(--editor-width, 50%);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  transition: width 0.1s ease;
}

/* Правая панель (холст) - используем calc */
.canvas-panel {
  width: calc(100% - var(--editor-width, 50%));
  height: 100%;
  overflow: hidden;
  transition: width 0.1s ease;
}

/* Вертикальный разделитель */
.resize-handle-vertical {
  width: 8px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
  position: relative;
  flex-shrink: 0;
}

.resize-handle-vertical:hover,
.resize-handle-vertical.resizing {
  background: rgba(100, 108, 255, 0.2);
}

.resize-handle-vertical::after {
  content: '';
  width: 2px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  transition: background-color 0.2s;
}

.resize-handle-vertical:hover::after,
.resize-handle-vertical.resizing::after {
  background: #646cff;
}

.app.theme-light .resize-handle-vertical::after {
  background: rgba(0, 0, 0, 0.2);
}

/* Заголовки редактора и холста */
.editor-header, .canvas-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.app.theme-light .editor-header,
.app.theme-light .canvas-header {
  background: rgba(255, 255, 255, 0.5);
  border-bottom-color: rgba(0, 0, 0, 0.1);
}

.window-controls {
  display: flex;
  gap: 6px;
}

.window-control {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.window-control.red {
  background: #ff5f56;
}

.window-control.yellow {
  background: #ffbd2e;
}

.window-control.green {
  background: #27c93f;
}

.editor-title, .canvas-title {
  font-size: 12px;
  opacity: 0.7;
}

.canvas-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4caf50;
  animation: pulse 1.5s infinite;
}

.editor-badge {
  margin-left: auto;
  font-size: 10px;
  padding: 2px 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #888;
}

.editor-container, .canvas-container {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-content, .canvas-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

/* Консоль и её разделитель */
.console-wrapper {
  position: relative;
  z-index: 10;
  transition: height 0.2s ease;
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.app.theme-light .console-wrapper {
  border-top-color: rgba(0, 0, 0, 0.1);
}

.console-resize-handle {
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 8px;
  cursor: row-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  z-index: 20;
  background: transparent;
  transition: background-color 0.2s;
}

.console-resize-handle:hover,
.console-resize-handle.dragging {
  background: rgba(100, 108, 255, 0.2);
}

.handle-line {
  width: 25px;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  transition: background-color 0.2s;
}

.console-resize-handle:hover .handle-line,
.console-resize-handle.dragging .handle-line {
  background: #646cff;
}

/* Анимации */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}

/* Скроллбары */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 108, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 108, 255, 0.5);
}

/* Стили для скроллбара в боковом меню */
.side-menu::-webkit-scrollbar {
  width: 2px;
}

.side-menu::-webkit-scrollbar-thumb {
  background: rgba(100, 108, 255, 0.3);
}

/* Координаты мыши */
.mouse-coordinates {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  margin-right: 10px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.app.theme-light .mouse-coordinates {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(0, 0, 0, 0.1);
}

.coord-item {
  color: #646cff;
  font-weight: 600;
}

.coord-separator {
  opacity: 0.5;
  font-size: 14px;
}

</style>