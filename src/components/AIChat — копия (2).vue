<!-- components/AIChat.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { P5_EXAMPLES } from '../lib/p5-examples'

const props = defineProps<{
  theme?: 'dark' | 'light'
  isVisible: boolean
  code?: string
}>()

const emit = defineEmits<{
  (e: 'update:isVisible', value: boolean): void
  (e: 'sendMessage', message: string): void
  (e: 'suggestCode', code: string): void
}>()

const messages = ref<Array<{ role: 'user' | 'assistant', content: string }>>([])
const inputMessage = ref('')
const isTyping = ref(false)
const chatContainer = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startY = ref(0)
const startHeight = ref(560)
const chatHeight = ref(560)
const isMinimized = ref(false)

// Временная заглушка - API отключено
// const DEEPSEEK_API_KEY = 'sk-de29f369b0f44d0081ec017c27daae20'
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

onMounted(() => {
  if (messages.value.length === 0) {
    messages.value.push({
      role: 'assistant',
      content: '👋 Привет! Я p5.js помощник. Введите ключевое слово (например, "circle", "rect", "color"), и я найду информацию в справочнике p5.js!'
    })
  }
})

watch(messages, () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}, { deep: true })

function closeChat() {
  emit('update:isVisible', false)
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value
}

/**
 * Поиск информации в справочнике p5.js
 * @param query - любой текст для поиска
 * @returns найденная информация или сообщение об отсутствии результатов
 */
function searchInReference(query: string): string {
  const normalizedQuery = query.toLowerCase().trim()

  // Разбиваем запрос на отдельные слова для поиска
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0)

  // База данных функций p5.js с описаниями
  const functions: Array<{ name: string; description: string; section: string }> = [
    // Environment
    { name: 'createCanvas(w, h)', description: 'Создаёт холст заданной ширины и высоты', section: 'Environment' },
    { name: 'setup()', description: 'Вызывается один раз при инициализации программы', section: 'Environment' },
    { name: 'draw()', description: 'Вызывается непрерывно для отрисовки кадров', section: 'Environment' },
    { name: 'resizeCanvas(w, h)', description: 'Изменяет размер холста', section: 'Environment' },
    { name: 'frameRate(fps)', description: 'Устанавливает частоту кадров в секунду', section: 'Environment' },
    { name: 'width', description: 'Ширина холста (свойство)', section: 'Environment' },
    { name: 'height', description: 'Высота холста (свойство)', section: 'Environment' },
    { name: 'windowWidth', description: 'Ширина окна браузера (свойство)', section: 'Environment' },
    { name: 'windowHeight', description: 'Высота окна браузера (свойство)', section: 'Environment' },
    { name: 'cursor(type)', description: 'Устанавливает тип курсора', section: 'Environment' },
    { name: 'noCursor()', description: 'Скрывает курсор', section: 'Environment' },
    { name: 'background(v1, v2, v3)', description: 'Устанавливает цвет фона', section: 'Environment' },

    // Color
    { name: 'color(v1, v2, v3, [a])', description: 'Создаёт цвет из RGB/HSB значений', section: 'Color' },
    { name: 'red(c)', description: 'Извлекает красную компоненту из цвета', section: 'Color' },
    { name: 'green(c)', description: 'Извлекает зелёную компоненту из цвета', section: 'Color' },
    { name: 'blue(c)', description: 'Извлекает синюю компоненту из цвета', section: 'Color' },
    { name: 'alpha(c)', description: 'Извлекает альфа-канал из цвета', section: 'Color' },
    { name: 'hue(c)', description: 'Извлекает оттенок (HSB/HSL)', section: 'Color' },
    { name: 'saturation(c)', description: 'Извлекает насыщенность (HSB/HSL)', section: 'Color' },
    { name: 'brightness(c)', description: 'Извлекает яркость (HSB)', section: 'Color' },
    { name: 'lerpColor(c1, c2, amt)', description: 'Интерполирует между двумя цветами', section: 'Color' },
    { name: 'fill(v1, v2, v3, [a])', description: 'Устанавливает цвет заливки фигур', section: 'Color' },
    { name: 'noFill()', description: 'Отключает заливку фигур', section: 'Color' },
    { name: 'stroke(v1, v2, v3, [a])', description: 'Устанавливает цвет обводки', section: 'Color' },
    { name: 'noStroke()', description: 'Отключает обводку', section: 'Color' },
    { name: 'colorMode(mode, [max1], [max2], [max3], [maxA])', description: 'Устанавливает режим цвета (RGB/HSB/HSL)', section: 'Color' },

    // Shape
    { name: 'arc(x, y, w, h, start, stop, [mode])', description: 'Рисует дугу', section: 'Shape' },
    { name: 'circle(x, y, d)', description: 'Рисует круг', section: 'Shape' },
    { name: 'ellipse(x, y, w, [h])', description: 'Рисует эллипс', section: 'Shape' },
    { name: 'line(x1, y1, x2, y2)', description: 'Рисует линию между двумя точками', section: 'Shape' },
    { name: 'point(x, y, [z])', description: 'Рисует точку', section: 'Shape' },
    { name: 'quad(x1, y1, x2, y2, x3, y3, x4, y4)', description: 'Рисует четырёхугольник', section: 'Shape' },
    { name: 'rect(x, y, w, h, [tl, tr, br, bl])', description: 'Рисует прямоугольник', section: 'Shape' },
    { name: 'square(x, y, s)', description: 'Рисует квадрат', section: 'Shape' },
    { name: 'triangle(x1, y1, x2, y2, x3, y3)', description: 'Рисует треугольник', section: 'Shape' },
    { name: 'bezier(x1, y1, x2, y2, x3, y3, x4, y4)', description: 'Рисует кривую Безье', section: 'Shape' },
    { name: 'curve(x1, y1, x2, y2, x3, y3, x4, y4)', description: 'Рисует сплайн-кривую', section: 'Shape' },
    { name: 'beginShape([kind])', description: 'Начинает определение сложной формы', section: 'Shape' },
    { name: 'endShape([mode])', description: 'Завершает определение формы', section: 'Shape' },
    { name: 'vertex(x, y, [z], [u], [v])', description: 'Добавляет вершину к форме', section: 'Shape' },
    { name: 'box([width], [height], [depth], [detail])', description: 'Рисует коробку (3D)', section: 'Shape' },
    { name: 'sphere([radius], [detailX], [detailY])', description: 'Рисует сферу (3D)', section: 'Shape' },

    // Math
    { name: 'abs(n)', description: 'Возвращает абсолютное значение', section: 'Math' },
    { name: 'ceil(n)', description: 'Округляет вверх до ближайшего целого', section: 'Math' },
    { name: 'constrain(n, low, high)', description: 'Ограничивает число диапазоном', section: 'Math' },
    { name: 'dist(x1, y1, x2, y2)', description: 'Вычисляет расстояние между точками', section: 'Math' },
    { name: 'floor(n)', description: 'Округляет вниз до ближайшего целого', section: 'Math' },
    { name: 'lerp(start, stop, amt)', description: 'Линейная интерполяция', section: 'Math' },
    { name: 'mag(x, y)', description: 'Длина вектора (магнитуда)', section: 'Math' },
    { name: 'max(n1, n2, n3, ...)', description: 'Максимальное значение', section: 'Math' },
    { name: 'min(n1, n2, n3, ...)', description: 'Минимальное значение', section: 'Math' },
    { name: 'pow(n, exponent)', description: 'Возведение в степень', section: 'Math' },
    { name: 'round(n)', description: 'Округление до ближайшего целого', section: 'Math' },
    { name: 'sqrt(n)', description: 'Квадратный корень', section: 'Math' },
    { name: 'noise(x, [y], [z])', description: 'Возвращает значение шума Перлина', section: 'Math' },
    { name: 'random([min], [max])', description: 'Возвращает случайное число', section: 'Math' },
    { name: 'sin(angle)', description: 'Синус угла', section: 'Math' },
    { name: 'cos(angle)', description: 'Косинус угла', section: 'Math' },
    { name: 'tan(angle)', description: 'Тангенс угла', section: 'Math' },
    { name: 'degrees(radians)', description: 'Конвертирует радианы в градусы', section: 'Math' },
    { name: 'radians(degrees)', description: 'Конвертирует градусы в радианы', section: 'Math' },
    { name: 'createVector([x], [y], [z])', description: 'Создаёт новый вектор p5.Vector', section: 'Math' },

    // Input/Events
    { name: 'keyIsPressed', description: 'true, если любая клавиша нажата', section: 'Input/Events' },
    { name: 'key', description: 'Значение последней нажатой клавиши', section: 'Input/Events' },
    { name: 'keyCode', description: 'Код последней нажатой клавиши', section: 'Input/Events' },
    { name: 'keyPressed()', description: 'Вызывается при нажатии клавиши', section: 'Input/Events' },
    { name: 'keyReleased()', description: 'Вызывается при отпускании клавиши', section: 'Input/Events' },
    { name: 'mouseX', description: 'Текущая X-координата мыши на холсте', section: 'Input/Events' },
    { name: 'mouseY', description: 'Текущая Y-координата мыши на холсте', section: 'Input/Events' },
    { name: 'pmouseX', description: 'Предыдущая X-координата мыши', section: 'Input/Events' },
    { name: 'pmouseY', description: 'Предыдущая Y-координата мыши', section: 'Input/Events' },
    { name: 'mouseIsPressed', description: 'true, если кнопка мыши нажата', section: 'Input/Events' },
    { name: 'mouseButton', description: 'Какая кнопка мыши нажата (LEFT/RIGHT/CENTER)', section: 'Input/Events' },
    { name: 'mousePressed()', description: 'Вызывается при нажатии кнопки мыши', section: 'Input/Events' },
    { name: 'mouseReleased()', description: 'Вызывается при отпускании кнопки мыши', section: 'Input/Events' },
    { name: 'mouseClicked()', description: 'Вызывается при клике мыши', section: 'Input/Events' },
    { name: 'mouseWheel(event)', description: 'Вызывается при прокрутке колеса', section: 'Input/Events' },
    { name: 'touches', description: 'Массив активных касаний', section: 'Input/Events' },

    // Image
    { name: 'loadImage(path, [successCallback])', description: 'Загружает изображение как p5.Image', section: 'Image' },
    { name: 'image(img, x, y, [w], [h])', description: 'Отрисовывает изображение', section: 'Image' },
    { name: 'tint(v1, v2, v3, [a])', description: 'Устанавливает тонирование для изображений', section: 'Image' },
    { name: 'noTint()', description: 'Отключает тонирование', section: 'Image' },
    { name: 'filter(mode, [param])', description: 'Применяет фильтр к изображению/холсту', section: 'Image' },
    { name: 'saveCanvas([selectedCanvas], [filename], [extension])', description: 'Сохраняет холст как изображение', section: 'Image' },

    // Typography
    { name: 'text(str, x, y, [w], [h])', description: 'Рисует текст на холсте', section: 'Typography' },
    { name: 'textAlign([horizontal], [vertical])', description: 'Устанавливает выравнивание текста', section: 'Typography' },
    { name: 'textSize(size)', description: 'Устанавливает размер шрифта', section: 'Typography' },
    { name: 'textStyle(style)', description: 'Устанавливает стиль текста (NORMAL/BOLD/ITALIC)', section: 'Typography' },
    { name: 'textWidth(str)', description: 'Вычисляет ширину текста', section: 'Typography' },
    { name: 'loadFont(path, [successCallback])', description: 'Загружает шрифт как p5.Font', section: 'Typography' },
    { name: 'textFont(font, [size])', description: 'Устанавливает шрифт для текста', section: 'Typography' },

    // Transform
    { name: 'push()', description: 'Сохраняет текущие настройки стиля и трансформации', section: 'Transform' },
    { name: 'pop()', description: 'Восстанавливает последние сохранённые настройки', section: 'Transform' },
    { name: 'translate(x, [y], [z])', description: 'Перемещает начало координат', section: 'Transform' },
    { name: 'rotate(angle)', description: 'Поворачивает холст вокруг начала координат', section: 'Transform' },
    { name: 'scale(s, [y], [z])', description: 'Масштабирует холст', section: 'Transform' },
    { name: 'rotateX(angle)', description: 'Поворачивает вокруг оси X (3D)', section: 'Transform' },
    { name: 'rotateY(angle)', description: 'Поворачивает вокруг оси Y (3D)', section: 'Transform' },

    // Lights & Camera
    { name: 'lights()', description: 'Включает стандартное освещение', section: 'Lights & Camera' },
    { name: 'ambientLight(r, g, b)', description: 'Добавляет окружающий свет', section: 'Lights & Camera' },
    { name: 'directionalLight(r, g, b, nx, ny, nz)', description: 'Добавляет направленный свет', section: 'Lights & Camera' },
    { name: 'pointLight(r, g, b, x, y, z)', description: 'Добавляет точечный источник света', section: 'Lights & Camera' },
    { name: 'specularMaterial(r, g, b)', description: 'Устанавливает зеркальный материал', section: 'Lights & Camera' },
    { name: 'shininess(n)', description: 'Устанавливает блеск материала', section: 'Lights & Camera' },
    { name: 'orbitControl()', description: 'Включает управление камерой мышью', section: 'Lights & Camera' },
    { name: 'camera([x], [y], [z], [cx], [cy], [cz])', description: 'Устанавливает камеру', section: 'Lights & Camera' },

    // DOM
    { name: 'createDiv([html])', description: 'Создаёт элемент div', section: 'DOM' },
    { name: 'createButton([label])', description: 'Создаёт кнопку', section: 'DOM' },
    { name: 'createSlider(min, max, [value], [step])', description: 'Создаёт ползунок', section: 'DOM' },
    { name: 'createInput([value])', description: 'Создаёт текстовое поле ввода', section: 'DOM' },
    { name: 'createSelect([multiple])', description: 'Создаёт выпадающий список', section: 'DOM' },
    { name: 'select(query)', description: 'Находит первый элемент по селектору', section: 'DOM' },

    // Data
    { name: 'append(array, value)', description: 'Добавляет элемент в конец массива', section: 'Data' },
    { name: 'concat(array1, array2)', description: 'Объединяет два массива', section: 'Data' },
    { name: 'reverse(array)', description: 'Переворачивает массив', section: 'Data' },
    { name: 'shuffle(array)', description: 'Перемешивает массив', section: 'Data' },
    { name: 'sort(array)', description: 'Сортирует массив', section: 'Data' },
    { name: 'float(str)', description: 'Преобразует в число с плавающей точкой', section: 'Data' },
    { name: 'int(str)', description: 'Преобразует в целое число', section: 'Data' },
    { name: 'str(num)', description: 'Преобразует в строку', section: 'Data' },
    { name: 'join(array, separator)', description: 'Объединяет массив в строку', section: 'Data' },
    { name: 'split(str, delimiter)', description: 'Разбивает строку на массив', section: 'Data' },
    { name: 'trim(str)', description: 'Удаляет пробелы по краям строки', section: 'Data' },
    { name: 'storeItem(key, value)', description: 'Сохраняет в localStorage', section: 'Data' },
    { name: 'getItem(key)', description: 'Получает из localStorage', section: 'Data' },

    // IO
    { name: 'loadJSON(path, [callback])', description: 'Загружает JSON файл', section: 'IO' },
    { name: 'loadStrings(path, [callback])', description: 'Загружает текстовый файл построчно', section: 'IO' },
    { name: 'httpGet(path, [data], [callback])', description: 'Выполняет HTTP GET запрос', section: 'IO' },
    { name: 'httpPost(path, [data], [callback])', description: 'Выполняет HTTP POST запрос', section: 'IO' },
    { name: 'saveJSON(data, filename)', description: 'Сохраняет JSON файл', section: 'IO' },
    { name: 'saveStrings(data, filename)', description: 'Сохраняет массив строк в файл', section: 'IO' },
    { name: 'millis()', description: 'Возвращает миллисекунды с начала программы', section: 'IO' },
    { name: 'year()', description: 'Возвращает текущий год', section: 'IO' },
    { name: 'month()', description: 'Возвращает текущий месяц', section: 'IO' },
    { name: 'day()', description: 'Возвращает текущий день', section: 'IO' },
    { name: 'hour()', description: 'Возвращает текущий час', section: 'IO' },
    { name: 'minute()', description: 'Возвращает текущую минуту', section: 'IO' },
    { name: 'second()', description: 'Возвращает текущую секунду', section: 'IO' }
  ]

  // Поиск функций по любому тексту в имени ИЛИ описании
  const matchedFunctions = functions.map(fn => {
    const fnNameClean = fn.name.split('(')[0] || ''
    const fnNameLower = fnNameClean.toLowerCase()
    const fnDescLower = fn.description.toLowerCase()

    // Подсчёт релевантности: сколько слов из запроса найдено
    let relevanceScore = 0
    let matchedWords: string[] = []

    queryWords.forEach(word => {
      const nameMatch = fnNameLower.includes(word)
      const descMatch = fnDescLower.includes(word)
      const exactNameMatch = fnNameLower === word

      if (exactNameMatch) {
        relevanceScore += 10 // Точное совпадение имени
        matchedWords.push(word)
      } else if (nameMatch) {
        relevanceScore += 5 // Совпадение в имени
        matchedWords.push(word)
      } else if (descMatch) {
        relevanceScore += 2 // Совпадение в описании
        matchedWords.push(word)
      }
    })

    return {
      ...fn,
      relevanceScore,
      matchedWords
    }
  })
  .filter(fn => fn.relevanceScore > 0)
  .sort((a, b) => b.relevanceScore - a.relevanceScore) // Сортируем по релевантности

  if (matchedFunctions.length === 0) {
    return `❌ По запросу "${query}" ничего не найдено.\n\nПопробуйте ввести любой текст, и я найду команды p5.js, в описании которых он встречается (например, "цвет", "рисует", "случайное", "вектор" и т.д.)`
  }

  // Формирование ответа
  let response = `📚 **Найдено функций: ${matchedFunctions.length}**\n`
  response += `🔍 **Запрос:** "${query}"\n---\n`

  matchedFunctions.forEach(fn => {
    // Подсвечиваем совпавшие слова в описании
    let highlightedDesc = fn.description
    fn.matchedWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi')
      highlightedDesc = highlightedDesc.replace(regex, '**$1**')
    })

    response += `**${fn.name}** — ${highlightedDesc}\n`

    // Добавляем пример использования, если он есть
    const fnNameClean = fn.name.split('(')[0] || ''
    const example = P5_EXAMPLES[fnNameClean as keyof typeof P5_EXAMPLES]
    if (example) {
      response += `\`\`\`javascript\n${example}\n\`\`\`\n`
    }
  })

  return response
}

/**
 * Парсинг Markdown в HTML
 */
function parseMarkdown(text: string): string {
  let html = text
    // Экранирование HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Блоки кода
    .replace(/```(\w+)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
    // Жирный текст
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Курсив
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Заголовки
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Разделитель
    .replace(/^---$/gm, '<hr>')
    // Переносы строк
    .replace(/\n/g, '<br>')

  return html
}

async function sendMessage() {
  if (!inputMessage.value.trim()) return

  const userMessage = inputMessage.value

  messages.value.push({
    role: 'user',
    content: userMessage
  })

  inputMessage.value = ''
  isTyping.value = true

  try {
    // Используем локальный поиск вместо API
    const response = searchInReference(userMessage)

    messages.value.push({
      role: 'assistant',
      content: response
    })

    emit('sendMessage', userMessage)
  } catch (error) {
    console.error('Error sending message:', error)
    messages.value.push({
      role: 'assistant',
      content: '😵 Произошла ошибка. Пожалуйста, попробуй еще раз.'
    })
  } finally {
    isTyping.value = false
  }
}

function startResize(e: MouseEvent) {
  isDragging.value = true
  startY.value = e.clientY
  startHeight.value = chatHeight.value
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
}

function onResize(e: MouseEvent) {
  if (!isDragging.value) return
  
  const deltaY = startY.value - e.clientY
  const newHeight = Math.min(
    Math.max(300, startHeight.value + deltaY),
    window.innerHeight * 0.8
  )
  chatHeight.value = newHeight
}

function stopResize() {
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onMounted(() => {
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', stopResize)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
})

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  const text = event.dataTransfer?.getData('text/plain')
  if (text) inputMessage.value = text
}

</script>

<template>
  <Teleport to="body">
    <!-- Плавающая кнопка ИИ -->
    <button 
      class="ai-float-button" 
      :class="[`theme-${props.theme}`, { 'hidden': isVisible }]"
      @click="emit('update:isVisible', true)"
      :title="isVisible ? '' : 'Открыть Deepseek AI'"
    >
      <span class="ai-icon">🤖</span>
      <span class="ai-pulse"></span>
    </button>

    <!-- Окно чата (БЕЗ РАЗМЫТИЯ ФОНА) -->
    <div 
      v-if="isVisible"
      class="ai-chat-overlay"
      :class="`theme-${props.theme}`"
      @click.self="closeChat"
    >
      <div 
        class="ai-chat-window"
        :class="{ 'minimized': isMinimized }"
        :style="{ height: isMinimized ? '60px' : chatHeight + 'px' }"
      >
        <!-- Заголовок -->
        <div class="chat-header">
          <div class="header-left">
            <span class="header-icon">📚</span>
            <span class="header-title">p5.js помощник</span>
            <span class="header-badge">справочник</span>
          </div>
          <div class="header-controls">
            <button class="control-btn" @click="toggleMinimize" :title="isMinimized ? 'Развернуть' : 'Свернуть'">
              {{ isMinimized ? '□' : '−' }}
            </button>
            <button class="control-btn close" @click="closeChat" title="Закрыть">✕</button>
          </div>
        </div>

        <!-- Тело чата -->
        <template v-if="!isMinimized">
          <!-- Ручка изменения размера -->
          <div 
            class="chat-resize-handle"
            @mousedown="startResize"
            :class="{ 'dragging': isDragging }"
          >
            <div class="handle-dots">⋯</div>
          </div>

          <!-- Сообщения -->
          <div class="chat-messages" ref="chatContainer">
            <div
              v-for="(msg, index) in messages"
              :key="index"
              class="message"
              :class="msg.role"
            >
              <div class="message-avatar">
                {{ msg.role === 'user' ? '👤' : '🤖' }}
              </div>
              <div class="message-content">
                <div class="message-text" v-html="parseMarkdown(msg.content)"></div>
                <div class="message-time">{{ new Date().toLocaleTimeString() }}</div>
              </div>
            </div>
            
            <!-- Индикатор печатания -->
            <div v-if="isTyping" class="message assistant typing">
              <div class="message-avatar">🤖</div>
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Поле ввода (без кнопок под ним) -->
          <div class="chat-input-area" @dragover.prevent @drop="onDrop">
            <textarea
              v-model="inputMessage"
              @keydown="handleKeyDown"
              placeholder="Введите функцию p5.js (например, circle, rect, color)..."
              rows="1"
            ></textarea>
            <button 
              class="send-btn" 
              @click="sendMessage"
              :disabled="!inputMessage.trim() || isTyping"
            >
              📤
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Плавающая кнопка */
.ai-float-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(135deg, #646cff, #9089fc);
  border: none;
  cursor: pointer;
  display: none; /* Скрыто, но не удалено */
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(100, 108, 255, 0.4);
  transition: all 0.3s ease;
  z-index: 9998;
}

.ai-float-button.hidden {
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
}

.ai-float-button:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 25px rgba(100, 108, 255, 0.6);
}

.ai-icon {
  font-size: 28px;
  animation: pulse 2s infinite;
}

.ai-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 30px;
  background: rgba(100, 108, 255, 0.4);
  animation: pulse-ring 2s infinite;
}

/* Оверлей чата - БЕЗ РАЗМЫТИЯ */
.ai-chat-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 20px;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

/* Окно чата */
.ai-chat-window {
  width: 800px;
  background: v-bind('props.theme === "dark" ? "#1e1e1e" : "#ffffff"');
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"');
  transition: height 0.3s ease;
  position: relative;
}

/* Заголовок */
.chat-header {
  padding: 15px 20px;
  background: v-bind('props.theme === "dark" ? "rgba(100, 108, 255, 0.1)" : "rgba(100, 108, 255, 0.05)"');
  border-bottom: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"');
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
}

.header-title {
  font-weight: 600;
  font-size: 14px;
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
}

.header-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(100, 108, 255, 0.3);
  border-radius: 12px;
  color: #646cff;
}

.header-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  background: transparent;
  border: none;
  color: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)"');
  font-size: 18px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.control-btn:hover {
  background: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"');
  color: v-bind('props.theme === "dark" ? "white" : "black"');
}

.control-btn.close:hover {
  background: #ff5f56;
  color: white;
}

/* Ручка изменения размера */
.chat-resize-handle {
  height: 8px;
  cursor: row-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background-color 0.2s;
}

.chat-resize-handle:hover,
.chat-resize-handle.dragging {
  background: rgba(100, 108, 255, 0.2);
}

.handle-dots {
  color: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"');
  font-size: 16px;
  line-height: 1;
}

/* Сообщения */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  background: v-bind('props.theme === "dark" ? "#1e1e1e" : "#ffffff"');
  max-height: calc(100% - 120px); /* Учитываем высоту input */
}

.message {
  display: flex;
  gap: 10px;
  animation: slideIn 0.3s ease;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: rgba(100, 108, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
}

.message.user .message-content {
  text-align: right;
}

.message-text {
  padding: 15px 20px;
  background: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"');
  border-radius: 18px;
  font-size: 22px;
  line-height: 1.6;
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
}

.message-text strong {
  color: #646cff;
  font-weight: 700;
}

.message-text em {
  font-style: italic;
  color: v-bind('props.theme === "dark" ? "#aaa" : "#666"');
}

.message-text h1, .message-text h2, .message-text h3 {
  margin: 10px 0;
  color: #646cff;
}

.message-text h1 { font-size: 32px; }
.message-text h2 { font-size: 28px; }
.message-text h3 { font-size: 24px; }

.message-text hr {
  border: none;
  border-top: 2px solid rgba(100, 108, 255, 0.3);
  margin: 15px 0;
}

/* Сообщения */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  background: v-bind('props.theme === "dark" ? "#1e1e1e" : "#ffffff"');
  max-height: calc(100% - 120px); /* Учитываем высоту input */
}

.message {
  display: flex;
  gap: 10px;
  animation: slideIn 0.3s ease;
  max-width: 100%;
  overflow-wrap: break-word;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: rgba(100, 108, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  min-width: 0; /* Важно для работы flex-shrink */
}

.message.user .message-content {
  text-align: right;
}

.message-text {
  padding: 15px 20px;
  background: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"');
  border-radius: 18px;
  font-size: 22px;
  line-height: 1.6;
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  max-width: 100%;
}

.message-text strong {
  color: #646cff;
  font-weight: 700;
}

.message-text em {
  font-style: italic;
  color: v-bind('props.theme === "dark" ? "#aaa" : "#666"');
}

.message-text h1, .message-text h2, .message-text h3 {
  margin: 10px 0;
  color: #646cff;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.message-text h1 { font-size: 32px; }
.message-text h2 { font-size: 28px; }
.message-text h3 { font-size: 24px; }

.message-text hr {
  border: none;
  border-top: 2px solid rgba(100, 108, 255, 0.3);
  margin: 15px 0;
}

.message.user .message-text {
  background: rgba(100, 108, 255, 0.3);
}

.message-time {
  font-size: 16px;
  opacity: 0.5;
  margin-top: 8px;
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
}

.message-text pre {
  background: v-bind('props.theme === "dark" ? "#2d2d2d" : "#f5f5f5"');
  padding: 15px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 15px 0;
  border-left: 4px solid #646cff;
  max-width: 100%;
  word-wrap: normal;
  overflow-wrap: normal;
}

.message-text pre code {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.5;
  background: transparent;
  padding: 0;
  white-space: pre;
  word-wrap: normal;
  overflow-wrap: normal;
}

.message-text code {
  font-family: 'Consolas', 'Courier New', monospace;
  background: v-bind('props.theme === "dark" ? "#2d2d2d" : "#f5f5f5"');
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
}

/* Индикатор печатания */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 15px;
  background: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"');
  border-radius: 18px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #646cff;
  border-radius: 4px;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

/* Поле ввода */
.chat-input-area {
  padding: 20px;
  display: flex;
  gap: 15px;
  border-top: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"');
  background: v-bind('props.theme === "dark" ? "#1e1e1e" : "#ffffff"');
}

.chat-input-area textarea {
  flex: 1;
  padding: 15px;
  border-radius: 20px;
  border: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"');
  background: v-bind('props.theme === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)"');
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
  resize: none;
  font-family: inherit;
  font-size: 22px;
  max-height: 200px;
}

.chat-input-area textarea:focus {
  outline: none;
  border-color: #646cff;
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(135deg, #646cff, #9089fc);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 18px;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Минимизированное состояние */
.ai-chat-window.minimized {
  height: 60px !important;
  overflow: hidden;
}

/* Анимации */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes typing {
  0%, 100% { opacity: 0.4; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-5px); }
}

/* Скроллбар */
.chat-messages::-webkit-scrollbar {
  width: 5px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(100, 108, 255, 0.3);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 108, 255, 0.5);
}

/* Мобильная адаптация */
@media (max-width: 768px) {
  .ai-chat-window {
    width: 100%;
    height: 80vh !important;
  }
  
  .ai-chat-overlay {
    padding: 10px;
  }
}
</style>