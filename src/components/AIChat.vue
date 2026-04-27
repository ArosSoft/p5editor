<!-- components/AIChat.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { P5_EXAMPLES } from '../lib/p5-examples'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'

// Импортируем worker как Vite worker
// @ts-ignore
import PDFWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker&url'
pdfjsLib.GlobalWorkerOptions.workerSrc = PDFWorker

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

type TabType = 'chat' | 'pdf'
const activeTab = ref<TabType>('chat')

// PDF viewer state
const pdfCanvas = ref<HTMLCanvasElement | null>(null)
const pdfLoading = ref(false)
const pdfError = ref('')
const pdfPageNum = ref(1)
const pdfTotalPages = ref(0)
const pdfScale = ref(1.5)
const isPdfFullscreen = ref(false)
const pdfPageInput = ref('')
let pdfDoc: any = null
let currentRenderTask: any = null

/**
 * Вычисляет оптимальный масштаб PDF под размер контейнера
 */
async function calcPdfScale(): Promise<number> {
  const container = pdfCanvas.value?.parentElement
  if (!container || !pdfDoc) return 1.5

  const containerWidth = container.clientWidth - 40 // padding
  const containerHeight = container.clientHeight - 40

  // Получаем размер первой страницы при scale=1
  const page = await pdfDoc.getPage(1)
  const viewport = page.getViewport({ scale: 1 })
  
  return Math.min(
    containerWidth / viewport.width,
    containerHeight / viewport.height,
    3 // максимум 3x
  )
}

const messages = ref<Array<{ role: 'user' | 'assistant', content: string }>>([])
const inputMessage = ref('')
const isTyping = ref(false)
const chatContainer = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startY = ref(0)
const startHeight = ref(560)
const chatHeight = ref(560)
const isMinimized = ref(false)
const typingInterval = ref<number | null>(null)

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
  
  // Перерисовываем PDF при разворачивании
  if (!isMinimized.value && activeTab.value === 'pdf' && pdfDoc) {
    nextTick(() => {
      renderPDFPage(pdfPageNum.value)
    })
  }
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
    { name: 'preload()', description: 'Вызывается для предзагрузки ресурсов', section: 'Environment' },
    { name: 'resizeCanvas(w, h)', description: 'Изменяет размер холста', section: 'Environment' },
    { name: 'noCanvas()', description: 'Удаляет холст по умолчанию', section: 'Environment' },
    { name: 'blendMode(mode)', description: 'Устанавливает режим смешивания цветов', section: 'Environment' },
    { name: 'print(content)', description: 'Выводит содержимое в консоль браузера', section: 'Environment' },
    { name: 'frameRate(fps)', description: 'Устанавливает частоту кадров в секунду', section: 'Environment' },
    { name: 'width', description: 'Ширина холста (свойство)', section: 'Environment' },
    { name: 'height', description: 'Высота холста (свойство)', section: 'Environment' },
    { name: 'windowWidth', description: 'Ширина окна браузера (свойство)', section: 'Environment' },
    { name: 'windowHeight', description: 'Высота окна браузера (свойство)', section: 'Environment' },
    { name: 'displayWidth', description: 'Ширина экрана устройства (свойство)', section: 'Environment' },
    { name: 'displayHeight', description: 'Высота экрана устройства (свойство)', section: 'Environment' },
    { name: 'frameCount', description: 'Количество кадров с начала работы программы (свойство)', section: 'Environment' },
    { name: 'cursor(type)', description: 'Устанавливает тип курсора', section: 'Environment' },
    { name: 'noCursor()', description: 'Скрывает курсор', section: 'Environment' },
    { name: 'pixelDensity([density])', description: 'Устанавливает плотность пикселей', section: 'Environment' },
    { name: 'displayDensity()', description: 'Возвращает плотность пикселей дисплея', section: 'Environment' },
    { name: 'fullscreen([value])', description: 'Получает/устанавливает полноэкранный режим', section: 'Environment' },
    { name: 'getURL()', description: 'Возвращает текущий URL', section: 'Environment' },
    { name: 'getURLPath()', description: 'Возвращает путь URL как массив', section: 'Environment' },
    { name: 'getURLParams()', description: 'Возвращает параметры URL как объект', section: 'Environment' },
    { name: 'windowResized()', description: 'Вызывается при изменении размера окна', section: 'Environment' },
    { name: 'noLoop()', description: 'Останавливает цикл draw()', section: 'Environment' },
    { name: 'loop()', description: 'Снова запускает цикл draw()', section: 'Environment' },
    { name: 'redraw()', description: 'Вручную вызывает draw() один раз', section: 'Environment' },
    { name: 'push()', description: 'Сохраняет текущие настройки рисования', section: 'Environment' },
    { name: 'pop()', description: 'Восстанавливает сохранённые настройки рисования', section: 'Environment' },
    { name: 'smooth()', description: 'Включает сглаживание', section: 'Environment' },
    { name: 'noSmooth()', description: 'Отключает сглаживание', section: 'Environment' },
    { name: 'background(v1, v2, v3)', description: 'Устанавливает цвет фона', section: 'Environment' },
    { name: 'clear()', description: 'Очищает буфер пикселей', section: 'Environment' },

    // Color
    { name: 'color(v1, v2, v3, [a])', description: 'Создаёт цвет из RGB/HSB значений', section: 'Color' },
    { name: 'red(c)', description: 'Извлекает красную компоненту из цвета', section: 'Color' },
    { name: 'green(c)', description: 'Извлекает зелёную компоненту из цвета', section: 'Color' },
    { name: 'blue(c)', description: 'Извлекает синюю компоненту из цвета', section: 'Color' },
    { name: 'alpha(c)', description: 'Извлекает альфа-канал из цвета', section: 'Color' },
    { name: 'hue(c)', description: 'Извлекает оттенок (HSB/HSL)', section: 'Color' },
    { name: 'saturation(c)', description: 'Извлекает насыщенность (HSB/HSL)', section: 'Color' },
    { name: 'brightness(c)', description: 'Извлекает яркость (HSB)', section: 'Color' },
    { name: 'lightness(c)', description: 'Извлекает светлоту (HSL)', section: 'Color' },
    { name: 'lerpColor(c1, c2, amt)', description: 'Интерполирует между двумя цветами', section: 'Color' },
    { name: 'fill(v1, v2, v3, [a])', description: 'Устанавливает цвет заливки фигур', section: 'Color' },
    { name: 'noFill()', description: 'Отключает заливку фигур', section: 'Color' },
    { name: 'stroke(v1, v2, v3, [a])', description: 'Устанавливает цвет обводки', section: 'Color' },
    { name: 'noStroke()', description: 'Отключает обводку', section: 'Color' },
    { name: 'colorMode(mode, [max1], [max2], [max3], [maxA])', description: 'Устанавливает режим цвета (RGB/HSB/HSL)', section: 'Color' },
    { name: 'erase([strength], [shadowStrength])', description: 'Включает режим стирания', section: 'Color' },
    { name: 'noErase()', description: 'Отключает режим стирания', section: 'Color' },

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
    { name: 'ellipseMode(mode)', description: 'Устанавливает режим отрисовки эллипсов', section: 'Shape' },
    { name: 'rectMode(mode)', description: 'Устанавливает режим отрисовки прямоугольников', section: 'Shape' },
    { name: 'strokeWeight(weight)', description: 'Устанавливает толщину обводки', section: 'Shape' },
    { name: 'strokeCap(cap)', description: 'Устанавливает стиль концов линий', section: 'Shape' },
    { name: 'strokeJoin(join)', description: 'Устанавливает стиль соединения линий', section: 'Shape' },
    { name: 'bezier(x1, y1, x2, y2, x3, y3, x4, y4)', description: 'Рисует кривую Безье', section: 'Shape' },
    { name: 'bezierDetail(detail)', description: 'Устанавливает детализацию кривых Безье', section: 'Shape' },
    { name: 'bezierPoint(a, b, c, d, t)', description: 'Вычисляет точку на кривой Безье', section: 'Shape' },
    { name: 'curve(x1, y1, x2, y2, x3, y3, x4, y4)', description: 'Рисует сплайн-кривую', section: 'Shape' },
    { name: 'curveDetail(detail)', description: 'Устанавливает детализацию кривых', section: 'Shape' },
    { name: 'curveTightness(tightness)', description: 'Устанавливает натяжение кривых', section: 'Shape' },
    { name: 'curvePoint(a, b, c, d, t)', description: 'Вычисляет точку на сплайн-кривой', section: 'Shape' },
    { name: 'beginShape([kind])', description: 'Начинает определение сложной формы', section: 'Shape' },
    { name: 'endShape([mode])', description: 'Завершает определение формы', section: 'Shape' },
    { name: 'vertex(x, y, [z], [u], [v])', description: 'Добавляет вершину к форме', section: 'Shape' },
    { name: 'bezierVertex(x2, y2, x3, y3, x4, y4)', description: 'Добавляет вершину кривой Безье', section: 'Shape' },
    { name: 'curveVertex(x, y)', description: 'Добавляет вершину сплайн-кривой', section: 'Shape' },
    { name: 'quadraticVertex(cx, cy, x3, y3)', description: 'Добавляет квадратичную вершину Безье', section: 'Shape' },
    { name: 'beginContour()', description: 'Начинает внутренний контур (дырку)', section: 'Shape' },
    { name: 'endContour()', description: 'Завершает внутренний контур', section: 'Shape' },
    { name: 'box([width], [height], [depth], [detail])', description: 'Рисует коробку (3D)', section: 'Shape' },
    { name: 'plane([width], [height], [detailX], [detailY])', description: 'Рисует плоскость (3D)', section: 'Shape' },
    { name: 'sphere([radius], [detailX], [detailY])', description: 'Рисует сферу (3D)', section: 'Shape' },
    { name: 'cylinder([radius], [height], [detailX], [detailY])', description: 'Рисует цилиндр (3D)', section: 'Shape' },
    { name: 'cone([radius], [height], [detailX], [detailY])', description: 'Рисует конус (3D)', section: 'Shape' },
    { name: 'ellipsoid([radiusX], [radiusY], [radiusZ])', description: 'Рисует эллипсоид (3D)', section: 'Shape' },
    { name: 'torus([radius], [tube], [detailX], [detailY])', description: 'Рисует тор (3D)', section: 'Shape' },
    { name: 'loadModel(path, [successCallback])', description: 'Загружает 3D модель из файла', section: 'Shape' },
    { name: 'model(model, [x], [y], [z])', description: 'Отрисовывает 3D модель', section: 'Shape' },

    // Math
    { name: 'abs(n)', description: 'Возвращает абсолютное значение', section: 'Math' },
    { name: 'ceil(n)', description: 'Округляет вверх до ближайшего целого', section: 'Math' },
    { name: 'constrain(n, low, high)', description: 'Ограничивает число диапазоном', section: 'Math' },
    { name: 'dist(x1, y1, x2, y2)', description: 'Вычисляет расстояние между точками', section: 'Math' },
    { name: 'floor(n)', description: 'Округляет вниз до ближайшего целого', section: 'Math' },
    { name: 'lerp(start, stop, amt)', description: 'Линейная интерполяция', section: 'Math' },
    { name: 'log(n)', description: 'Натуральный логарифм', section: 'Math' },
    { name: 'mag(x, y)', description: 'Длина вектора (магнитуда)', section: 'Math' },
    { name: 'max(n1, n2, n3, ...)', description: 'Максимальное значение', section: 'Math' },
    { name: 'min(n1, n2, n3, ...)', description: 'Минимальное значение', section: 'Math' },
    { name: 'pow(n, exponent)', description: 'Возведение в степень', section: 'Math' },
    { name: 'round(n)', description: 'Округление до ближайшего целого', section: 'Math' },
    { name: 'sq(n)', description: 'Квадрат числа', section: 'Math' },
    { name: 'sqrt(n)', description: 'Квадратный корень', section: 'Math' },
    { name: 'fract(n)', description: 'Дробная часть числа', section: 'Math' },
    { name: 'map(value, start1, stop1, start2, stop2)', description: 'Переводит число из одного диапазона в другой', section: 'Math' },
    { name: 'noise(x, [y], [z])', description: 'Возвращает значение шума Перлина', section: 'Math' },
    { name: 'noiseSeed(seed)', description: 'Устанавливает зерно для шума', section: 'Math' },
    { name: 'noiseDetail(lod, [falloff])', description: 'Устанавливает детализацию шума', section: 'Math' },
    { name: 'random([min], [max])', description: 'Возвращает случайное число', section: 'Math' },
    { name: 'randomSeed(seed)', description: 'Устанавливает зерно для случайных чисел', section: 'Math' },
    { name: 'randomGaussian([mean], [deviation])', description: 'Возвращает случайное число по Гауссу', section: 'Math' },
    { name: 'sin(angle)', description: 'Синус угла', section: 'Math' },
    { name: 'cos(angle)', description: 'Косинус угла', section: 'Math' },
    { name: 'tan(angle)', description: 'Тангенс угла', section: 'Math' },
    { name: 'asin(value)', description: 'Арксинус', section: 'Math' },
    { name: 'acos(value)', description: 'Арккосинус', section: 'Math' },
    { name: 'atan(value)', description: 'Арктангенс', section: 'Math' },
    { name: 'atan2(y, x)', description: 'Арктангенс от y/x с учётом квадранта', section: 'Math' },
    { name: 'degrees(radians)', description: 'Конвертирует радианы в градусы', section: 'Math' },
    { name: 'radians(degrees)', description: 'Конвертирует градусы в радианы', section: 'Math' },
    { name: 'angleMode(mode)', description: 'Устанавливает режим углов (DEGREES/RADIANS)', section: 'Math' },
    { name: 'createVector([x], [y], [z])', description: 'Создаёт новый вектор p5.Vector', section: 'Math' },

    // Input/Events
    { name: 'keyIsPressed', description: 'true, если любая клавиша нажата', section: 'Input/Events' },
    { name: 'key', description: 'Значение последней нажатой клавиши', section: 'Input/Events' },
    { name: 'keyCode', description: 'Код последней нажатой клавиши', section: 'Input/Events' },
    { name: 'keyIsDown(code)', description: 'Проверяет, нажата ли клавиша с данным кодом', section: 'Input/Events' },
    { name: 'keyPressed()', description: 'Вызывается при нажатии клавиши', section: 'Input/Events' },
    { name: 'keyReleased()', description: 'Вызывается при отпускании клавиши', section: 'Input/Events' },
    { name: 'keyTyped()', description: 'Вызывается при вводе символа', section: 'Input/Events' },
    { name: 'doubleClicked()', description: 'Вызывается при двойном клике', section: 'Input/Events' },
    { name: 'mouseX', description: 'Текущая X-координата мыши на холсте', section: 'Input/Events' },
    { name: 'mouseY', description: 'Текущая Y-координата мыши на холсте', section: 'Input/Events' },
    { name: 'pmouseX', description: 'Предыдущая X-координата мыши', section: 'Input/Events' },
    { name: 'pmouseY', description: 'Предыдущая Y-координата мыши', section: 'Input/Events' },
    { name: 'winMouseX', description: 'X-координата мыши относительно окна', section: 'Input/Events' },
    { name: 'winMouseY', description: 'Y-координата мыши относительно окна', section: 'Input/Events' },
    { name: 'mouseIsPressed', description: 'true, если кнопка мыши нажата', section: 'Input/Events' },
    { name: 'mouseButton', description: 'Какая кнопка мыши нажата (LEFT/RIGHT/CENTER)', section: 'Input/Events' },
    { name: 'mouseMoved()', description: 'Вызывается при перемещении мыши', section: 'Input/Events' },
    { name: 'mouseDragged()', description: 'Вызывается при перетаскивании мыши', section: 'Input/Events' },
    { name: 'mousePressed()', description: 'Вызывается при нажатии кнопки мыши', section: 'Input/Events' },
    { name: 'mouseReleased()', description: 'Вызывается при отпускании кнопки мыши', section: 'Input/Events' },
    { name: 'mouseClicked()', description: 'Вызывается при клике мыши', section: 'Input/Events' },
    { name: 'mouseWheel(event)', description: 'Вызывается при прокрутке колеса', section: 'Input/Events' },
    { name: 'touches', description: 'Массив активных касаний', section: 'Input/Events' },
    { name: 'touchStarted()', description: 'Вызывается при начале касания', section: 'Input/Events' },
    { name: 'touchMoved()', description: 'Вызывается при перемещении касания', section: 'Input/Events' },
    { name: 'touchEnded()', description: 'Вызывается при окончании касания', section: 'Input/Events' },

    // Image
    { name: 'loadImage(path, [successCallback])', description: 'Загружает изображение как p5.Image', section: 'Image' },
    { name: 'image(img, x, y, [w], [h])', description: 'Отрисовывает изображение', section: 'Image' },
    { name: 'imageMode(mode)', description: 'Устанавливает режим отрисовки изображений', section: 'Image' },
    { name: 'tint(v1, v2, v3, [a])', description: 'Устанавливает тонирование для изображений', section: 'Image' },
    { name: 'noTint()', description: 'Отключает тонирование', section: 'Image' },
    { name: 'filter(mode, [param])', description: 'Применяет фильтр к изображению/холсту', section: 'Image' },
    { name: 'mask(img)', description: 'Применяет маску к изображению', section: 'Image' },
    { name: 'resize(w, h)', description: 'Изменяет размер изображения (метод p5.Image)', section: 'Image' },
    { name: 'copy([src], [sx], [sy], [sw], [sh], [dx], [dy], [dw], [dh])', description: 'Копирует участок изображения', section: 'Image' },
    { name: 'blend([src], [sx], [sy], [sw], [sh], [dx], [dy], [dw], [dh], [mode])', description: 'Смешивает изображения', section: 'Image' },
    { name: 'get(x, y, [w], [h])', description: 'Получает пиксель или участок изображения', section: 'Image' },
    { name: 'set(x, y, c)', description: 'Задаёт пиксель или участок', section: 'Image' },
    { name: 'loadPixels()', description: 'Загружает массив пикселей', section: 'Image' },
    { name: 'updatePixels()', description: 'Применяет изменения пикселей', section: 'Image' },
    { name: 'saveCanvas([selectedCanvas], [filename], [extension])', description: 'Сохраняет холст как изображение', section: 'Image' },
    { name: 'save([object], [filename], [options])', description: 'Сохраняет данные или изображение', section: 'Image' },

    // Typography
    { name: 'text(str, x, y, [w], [h])', description: 'Рисует текст на холсте', section: 'Typography' },
    { name: 'textAlign([horizontal], [vertical])', description: 'Устанавливает выравнивание текста', section: 'Typography' },
    { name: 'textLeading(leading)', description: 'Устанавливает межстрочный интервал', section: 'Typography' },
    { name: 'textSize(size)', description: 'Устанавливает размер шрифта', section: 'Typography' },
    { name: 'textStyle(style)', description: 'Устанавливает стиль текста (NORMAL/BOLD/ITALIC)', section: 'Typography' },
    { name: 'textWidth(str)', description: 'Вычисляет ширину текста', section: 'Typography' },
    { name: 'textAscent()', description: 'Возвращает подъём текущего шрифта', section: 'Typography' },
    { name: 'textDescent()', description: 'Возвращает спуск текущего шрифта', section: 'Typography' },
    { name: 'loadFont(path, [successCallback])', description: 'Загружает шрифт как p5.Font', section: 'Typography' },
    { name: 'textFont(font, [size])', description: 'Устанавливает шрифт для текста', section: 'Typography' },
    { name: 'textBounds(str, x, y, [fontSize])', description: 'Возвращает ограничивающую рамку текста', section: 'Typography' },

    // Transform
    { name: 'push()', description: 'Сохраняет текущие настройки стиля и трансформации', section: 'Transform' },
    { name: 'pop()', description: 'Восстанавливает последние сохранённые настройки', section: 'Transform' },
    { name: 'translate(x, [y], [z])', description: 'Перемещает начало координат', section: 'Transform' },
    { name: 'rotate(angle)', description: 'Поворачивает холст вокруг начала координат', section: 'Transform' },
    { name: 'rotateZ(angle)', description: 'Поворачивает вокруг оси Z (3D)', section: 'Transform' },
    { name: 'scale(s, [y], [z])', description: 'Масштабирует холст', section: 'Transform' },
    { name: 'shearX(angle)', description: 'Наклоняет холст по оси X', section: 'Transform' },
    { name: 'shearY(angle)', description: 'Наклоняет холст по оси Y', section: 'Transform' },
    { name: 'applyMatrix(a, b, c, d, e, f)', description: 'Применяет матрицу трансформации', section: 'Transform' },
    { name: 'resetMatrix()', description: 'Сбрасывает матрицу трансформации к единичной', section: 'Transform' },
    { name: 'rotateX(angle)', description: 'Поворачивает вокруг оси X (3D)', section: 'Transform' },
    { name: 'rotateY(angle)', description: 'Поворачивает вокруг оси Y (3D)', section: 'Transform' },

    // Lights & Camera
    { name: 'lights()', description: 'Включает стандартное освещение', section: 'Lights & Camera' },
    { name: 'noLights()', description: 'Отключает все источники света', section: 'Lights & Camera' },
    { name: 'ambientLight(r, g, b)', description: 'Добавляет окружающий свет', section: 'Lights & Camera' },
    { name: 'directionalLight(r, g, b, nx, ny, nz)', description: 'Добавляет направленный свет', section: 'Lights & Camera' },
    { name: 'pointLight(r, g, b, x, y, z)', description: 'Добавляет точечный источник света', section: 'Lights & Camera' },
    { name: 'spotLight(r, g, b, x, y, z, nx, ny, nz, angle, [conc])', description: 'Добавляет прожектор', section: 'Lights & Camera' },
    { name: 'lightFalloff(constant, linear, quadratic)', description: 'Устанавливает затухание света', section: 'Lights & Camera' },
    { name: 'specularColor(r, g, b)', description: 'Устанавливает цвет зеркального блика', section: 'Lights & Camera' },
    { name: 'normalMaterial()', description: 'Использует нормали для окраски', section: 'Lights & Camera' },
    { name: 'ambientMaterial(r, g, b)', description: 'Устанавливает окружающий материал', section: 'Lights & Camera' },
    { name: 'emissiveMaterial(r, g, b)', description: 'Устанавливает излучающий материал', section: 'Lights & Camera' },
    { name: 'specularMaterial(r, g, b)', description: 'Устанавливает зеркальный материал', section: 'Lights & Camera' },
    { name: 'shininess(n)', description: 'Устанавливает блеск материала', section: 'Lights & Camera' },
    { name: 'texture(tex)', description: 'Применяет текстуру к геометрии', section: 'Lights & Camera' },
    { name: 'camera([x], [y], [z], [cx], [cy], [cz])', description: 'Устанавливает камеру', section: 'Lights & Camera' },
    { name: 'perspective([fovy], [aspect], [near], [far])', description: 'Устанавливает перспективную проекцию', section: 'Lights & Camera' },
    { name: 'ortho([left], [right], [bottom], [top], [near], [far])', description: 'Устанавливает ортогональную проекцию', section: 'Lights & Camera' },
    { name: 'createCamera()', description: 'Создаёт объект камеры', section: 'Lights & Camera' },
    { name: 'setCamera(cam)', description: 'Устанавливает камеру для рендерера', section: 'Lights & Camera' },
    { name: 'orbitControl([sensitivity], [maxZoom], [minZoom])', description: 'Включает управление камерой мышью', section: 'Lights & Camera' },
    { name: 'debugMode([mode], [x], [y], [z], [size], [xOff], [yOff], [zOff])', description: 'Включает режим отладки', section: 'Lights & Camera' },
    { name: 'noDebugMode()', description: 'Отключает режим отладки', section: 'Lights & Camera' },

    // DOM
    { name: 'createDiv([html])', description: 'Создаёт элемент div', section: 'DOM' },
    { name: 'createP([html])', description: 'Создаёт элемент p (параграф)', section: 'DOM' },
    { name: 'createSpan([html])', description: 'Создаёт элемент span', section: 'DOM' },
    { name: 'createButton([label])', description: 'Создаёт кнопку', section: 'DOM' },
    { name: 'createCheckbox([label], [checked])', description: 'Создаёт чекбокс', section: 'DOM' },
    { name: 'createSlider(min, max, [value], [step])', description: 'Создаёт ползунок', section: 'DOM' },
    { name: 'createInput([value])', description: 'Создаёт текстовое поле ввода', section: 'DOM' },
    { name: 'createSelect([multiple])', description: 'Создаёт выпадающий список', section: 'DOM' },
    { name: 'createRadio([name])', description: 'Создаёт группу радио-кнопок', section: 'DOM' },
    { name: 'createColorPicker([value])', description: 'Создаёт выбор цвета', section: 'DOM' },
    { name: 'createFileInput(callback, [multiple])', description: 'Создаёт поле загрузки файла', section: 'DOM' },
    { name: 'createImg(src, [alt])', description: 'Создаёт изображение', section: 'DOM' },
    { name: 'createA(href, html, [target])', description: 'Создаёт ссылку', section: 'DOM' },
    { name: 'createVideo([src])', description: 'Создаёт видео элемент', section: 'DOM' },
    { name: 'createAudio([src])', description: 'Создаёт аудио элемент', section: 'DOM' },
    { name: 'createElement(tag, [value])', description: 'Создаёт произвольный элемент', section: 'DOM' },
    { name: 'select(query)', description: 'Находит первый элемент по селектору', section: 'DOM' },
    { name: 'selectAll(query)', description: 'Находит все элементы по селектору', section: 'DOM' },
    { name: 'removeElements()', description: 'Удаляет все DOM-элементы, созданные через p5', section: 'DOM' },
    { name: 'html([html])', description: 'Изменяет HTML-содержимое элемента', section: 'DOM' },
    { name: 'value([value])', description: 'Получает или задаёт значение элемента', section: 'DOM' },
    { name: 'style(property, [value])', description: 'Изменяет стиль элемента', section: 'DOM' },
    { name: 'remove()', description: 'Удаляет DOM-элемент', section: 'DOM' },
    { name: 'changed(callback)', description: 'Вызывается при изменении значения элемента', section: 'DOM' },
    { name: 'input(callback)', description: 'Вызывается при вводе данных в элемент', section: 'DOM' },

    // Data
    { name: 'append(array, value)', description: 'Добавляет элемент в конец массива', section: 'Data' },
    { name: 'arrayCopy(src, dst, [length])', description: 'Копирует элементы между массивами', section: 'Data' },
    { name: 'concat(array1, array2)', description: 'Объединяет два массива', section: 'Data' },
    { name: 'reverse(array)', description: 'Переворачивает массив', section: 'Data' },
    { name: 'shorten(array)', description: 'Удаляет последний элемент массива', section: 'Data' },
    { name: 'shuffle(array, [bool])', description: 'Перемешивает массив', section: 'Data' },
    { name: 'sort(array, [count])', description: 'Сортирует массив', section: 'Data' },
    { name: 'splice(array, index, count)', description: 'Вставляет/удаляет элементы массива', section: 'Data' },
    { name: 'subset(array, start, [count])', description: 'Возвращает подмассив', section: 'Data' },
    { name: 'float(str)', description: 'Преобразует в число с плавающей точкой', section: 'Data' },
    { name: 'int(str)', description: 'Преобразует в целое число', section: 'Data' },
    { name: 'str(num)', description: 'Преобразует в строку', section: 'Data' },
    { name: 'boolean(value)', description: 'Преобразует в булево значение', section: 'Data' },
    { name: 'byte(value)', description: 'Преобразует в байт', section: 'Data' },
    { name: 'char(value)', description: 'Преобразует в символ', section: 'Data' },
    { name: 'unchar(str)', description: 'Преобразует символ в код', section: 'Data' },
    { name: 'hex(value, [digits])', description: 'Преобразует в шестнадцатеричную строку', section: 'Data' },
    { name: 'unhex(str)', description: 'Преобразует из шестнадцатеричной строки', section: 'Data' },
    { name: 'join(array, separator)', description: 'Объединяет массив в строку', section: 'Data' },
    { name: 'split(str, delimiter)', description: 'Разбивает строку на массив', section: 'Data' },
    { name: 'splitTokens(str, [tokens])', description: 'Разбивает строку по токенам', section: 'Data' },
    { name: 'trim(str)', description: 'Удаляет пробелы по краям строки', section: 'Data' },
    { name: 'nf(num, left, [right])', description: 'Форматирует число', section: 'Data' },
    { name: 'nfc(num, [right])', description: 'Форматирует число с разделителями', section: 'Data' },
    { name: 'nfp(num, left, [right])', description: 'Форматирует число со знаком', section: 'Data' },
    { name: 'nfs(num, left, [right])', description: 'Форматирует число с пробелом', section: 'Data' },
    { name: 'createStringDict()', description: 'Создаёт строковый словарь', section: 'Data' },
    { name: 'createNumberDict()', description: 'Создаёт числовой словарь', section: 'Data' },
    { name: 'storeItem(key, value)', description: 'Сохраняет в localStorage', section: 'Data' },
    { name: 'getItem(key)', description: 'Получает из localStorage', section: 'Data' },
    { name: 'removeItem(key)', description: 'Удаляет из localStorage', section: 'Data' },
    { name: 'clearStorage()', description: 'Очищает localStorage', section: 'Data' },

    // IO
    { name: 'loadJSON(path, [callback])', description: 'Загружает JSON файл', section: 'IO' },
    { name: 'loadStrings(path, [callback])', description: 'Загружает текстовый файл построчно', section: 'IO' },
    { name: 'loadTable(path, [options], [callback])', description: 'Загружает CSV/TSV файл как таблицу', section: 'IO' },
    { name: 'loadXML(path, [callback])', description: 'Загружает XML файл', section: 'IO' },
    { name: 'loadBytes(path, [callback])', description: 'Загружает файл как байты', section: 'IO' },
    { name: 'httpGet(path, [data], [callback])', description: 'Выполняет HTTP GET запрос', section: 'IO' },
    { name: 'httpPost(path, [data], [callback])', description: 'Выполняет HTTP POST запрос', section: 'IO' },
    { name: 'httpDo(path, [method], [data], [callback])', description: 'Выполняет HTTP запрос', section: 'IO' },
    { name: 'createWriter([filename])', description: 'Создаёт объект для записи в файл', section: 'IO' },
    { name: 'saveJSON(data, filename, [optimize])', description: 'Сохраняет JSON файл', section: 'IO' },
    { name: 'saveStrings(data, filename)', description: 'Сохраняет массив строк в файл', section: 'IO' },
    { name: 'saveTable(table, filename, [options])', description: 'Сохраняет таблицу в файл', section: 'IO' },
    { name: 'save([object], [filename], [options])', description: 'Сохраняет данные или изображение', section: 'IO' },
    { name: 'saveCanvas([selectedCanvas], [filename], [extension])', description: 'Сохраняет холст как изображение', section: 'IO' },
    { name: 'millis()', description: 'Возвращает миллисекунды с начала программы', section: 'IO' },
    { name: 'year()', description: 'Возвращает текущий год', section: 'IO' },
    { name: 'month()', description: 'Возвращает текущий месяц', section: 'IO' },
    { name: 'day()', description: 'Возвращает текущий день', section: 'IO' },
    { name: 'hour()', description: 'Возвращает текущий час', section: 'IO' },
    { name: 'minute()', description: 'Возвращает текущую минуту', section: 'IO' },
    { name: 'second()', description: 'Возвращает текущую секунду', section: 'IO' },

    // Constants - Alignment
    { name: 'CENTER', description: 'Выравнивание по центру', section: 'Constants' },
    { name: 'CORNER', description: 'Координаты от угла', section: 'Constants' },
    { name: 'CORNERS', description: 'Координаты по двум углам', section: 'Constants' },
    { name: 'RADIUS', description: 'Координаты по радиусу', section: 'Constants' },
    { name: 'LEFT', description: 'Выравнивание влево', section: 'Constants' },
    { name: 'RIGHT', description: 'Выравнивание вправо', section: 'Constants' },
    { name: 'TOP', description: 'Выравнивание сверху', section: 'Constants' },
    { name: 'BOTTOM', description: 'Выравнивание снизу', section: 'Constants' },
    { name: 'BASELINE', description: 'Выравнивание по базовой линии', section: 'Constants' },
    { name: 'OPEN', description: 'Открытая фигура', section: 'Constants' },
    { name: 'CLOSE', description: 'Замкнутая фигура', section: 'Constants' },

    // Constants - Math
    { name: 'PI', description: 'Число π (пи)', section: 'Constants' },
    { name: 'HALF_PI', description: 'Половина π', section: 'Constants' },
    { name: 'QUARTER_PI', description: 'Четверть π', section: 'Constants' },
    { name: 'TAU', description: '2π (Тау)', section: 'Constants' },
    { name: 'TWO_PI', description: '2π', section: 'Constants' },

    // Constants - Angle modes
    { name: 'DEGREES', description: 'Градусы', section: 'Constants' },
    { name: 'RADIANS', description: 'Радианы', section: 'Constants' },

    // Constants - Color modes
    { name: 'RGB', description: 'Цветовая модель RGB', section: 'Constants' },
    { name: 'HSB', description: 'Цветовая модель HSB', section: 'Constants' },
    { name: 'HSL', description: 'Цветовая модель HSL', section: 'Constants' },

    // Constants - Renderer
    { name: 'WEBGL', description: 'Режим WebGL', section: 'Constants' },
    { name: 'P2D', description: '2D-рендерер', section: 'Constants' },
    { name: 'P3D', description: '3D-рендерер', section: 'Constants' },

    // Constants - Blend modes
    { name: 'BLEND', description: 'Обычное смешивание', section: 'Constants' },
    { name: 'DARKEST', description: 'Затемнение', section: 'Constants' },
    { name: 'LIGHTEST', description: 'Осветление', section: 'Constants' },
    { name: 'DIFFERENCE', description: 'Разность', section: 'Constants' },
    { name: 'MULTIPLY', description: 'Умножение', section: 'Constants' },
    { name: 'SCREEN', description: 'Экранное смешивание', section: 'Constants' },
    { name: 'OVERLAY', description: 'Наложение', section: 'Constants' },
    { name: 'HARD_LIGHT', description: 'Жёсткий свет', section: 'Constants' },
    { name: 'SOFT_LIGHT', description: 'Мягкий свет', section: 'Constants' },
    { name: 'DODGE', description: 'Осветление', section: 'Constants' },
    { name: 'BURN', description: 'Затемнение', section: 'Constants' },
    { name: 'ADD', description: 'Сложение', section: 'Constants' },
    { name: 'REMOVE', description: 'Удаление', section: 'Constants' },
    { name: 'EXCLUSION', description: 'Исключение', section: 'Constants' },
    { name: 'NORMAL', description: 'Нормальный режим', section: 'Constants' },
    { name: 'THRESHOLD', description: 'Пороговый эффект', section: 'Constants' },
    { name: 'GRAY', description: 'Оттенки серого', section: 'Constants' },
    { name: 'OPAQUE', description: 'Непрозрачный', section: 'Constants' },
    { name: 'INVERT', description: 'Инверсия', section: 'Constants' },
    { name: 'POSTERIZE', description: 'Постеризация', section: 'Constants' },
    { name: 'DILATE', description: 'Расширение', section: 'Constants' },
    { name: 'ERODE', description: 'Эрозия', section: 'Constants' },

    // Constants - Cursors
    { name: 'ARROW', description: 'Курсор-стрелка', section: 'Constants' },
    { name: 'CROSS', description: 'Курсор-крест', section: 'Constants' },
    { name: 'HAND', description: 'Курсор-рука', section: 'Constants' },
    { name: 'MOVE', description: 'Курсор перемещения', section: 'Constants' },
    { name: 'TEXT', description: 'Текстовый курсор', section: 'Constants' },
    { name: 'WAIT', description: 'Курсор ожидания', section: 'Constants' },
    { name: 'AUTO', description: 'Автоматический режим', section: 'Constants' },

    // Constants - Keys
    { name: 'ALT', description: 'Клавиша Alt', section: 'Constants' },
    { name: 'BACKSPACE', description: 'Клавиша Backspace', section: 'Constants' },
    { name: 'CONTROL', description: 'Клавиша Ctrl', section: 'Constants' },
    { name: 'DELETE', description: 'Клавиша Delete', section: 'Constants' },
    { name: 'DOWN_ARROW', description: 'Стрелка вниз', section: 'Constants' },
    { name: 'ENTER', description: 'Клавиша Enter', section: 'Constants' },
    { name: 'ESCAPE', description: 'Клавиша Esc', section: 'Constants' },
    { name: 'LEFT_ARROW', description: 'Стрелка влево', section: 'Constants' },
    { name: 'OPTION', description: 'Клавиша Option', section: 'Constants' },
    { name: 'RETURN', description: 'Клавиша Return', section: 'Constants' },
    { name: 'RIGHT_ARROW', description: 'Стрелка вправо', section: 'Constants' },
    { name: 'SHIFT', description: 'Клавиша Shift', section: 'Constants' },
    { name: 'TAB', description: 'Клавиша Tab', section: 'Constants' },
    { name: 'UP_ARROW', description: 'Стрелка вверх', section: 'Constants' },

    // Constants - Other
    { name: 'VERSION', description: 'Текущая версия p5.js', section: 'Constants' }
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

  matchedFunctions.forEach((fn, index) => {
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

    // Добавляем тонкую горизонтальную черту между функциями (но не после последней)
    if (index < matchedFunctions.length - 1) {
      response += `---\n`
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

/**
 * Эффект печатающей машинки для вывода текста
 */
function typeWriterEffect(text: string, messageIndex: number, speed: number = 10): Promise<void> {
  return new Promise((resolve) => {
    let index = 0
    const message = messages.value[messageIndex]
    if (!message) {
      resolve()
      return
    }
    message.content = ''
    
    typingInterval.value = window.setInterval(() => {
      if (index < text.length) {
        // Добавляем по одному символу
        const msg = messages.value[messageIndex]
        if (msg) {
          msg.content = text.substring(0, index + 1)
        }
        index++
        
        // Прокручиваем вниз при каждом символе
        nextTick(() => {
          if (chatContainer.value) {
            chatContainer.value.scrollTop = chatContainer.value.scrollHeight
          }
        })
      } else {
        // Завершаем печать
        if (typingInterval.value) {
          clearInterval(typingInterval.value)
          typingInterval.value = null
        }
        resolve()
      }
    }, speed)
  })
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

    // Создаём пустое сообщение для ассистента
    const assistantMessageIndex = messages.value.length
    messages.value.push({
      role: 'assistant',
      content: ''
    })

    // Запускаем эффект печатающей машинки
    await typeWriterEffect(response, assistantMessageIndex, 8)
    
    emit('sendMessage', userMessage)
  } catch (error) {
    console.error('Error sending message:', error)
    messages.value.push({
      role: 'assistant',
      content: '😵 Произошла ошибка. Пожалуйста, попробуй еще раз.'
    })
  } finally {
    isTyping.value = false
    if (typingInterval.value) {
      clearInterval(typingInterval.value)
      typingInterval.value = null
    }
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
  // Очищаем интервал печатающей машинки
  if (typingInterval.value) {
    clearInterval(typingInterval.value)
    typingInterval.value = null
  }
  // Отменяем текущий рендер PDF
  if (currentRenderTask) {
    try {
      currentRenderTask.cancel()
    } catch (e) {
      // Игнорируем
    }
    currentRenderTask = null
  }
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

// PDF Viewer функции
async function loadPDF() {
  pdfLoading.value = true
  pdfError.value = ''

  try {
    // Путь к PDF файлу (из папки public)
    const pdfUrl = '/p5editor/p5/coding_course.pdf'

    const loadingTask = pdfjsLib.getDocument(pdfUrl)
    pdfDoc = await loadingTask.promise

    pdfTotalPages.value = pdfDoc.numPages
    pdfPageNum.value = 1
    pdfPageInput.value = '1'
    
    // Вычисляем начальный масштаб под контейнер
    await nextTick()
    const initialScale = await calcPdfScale()
    pdfScale.value = initialScale

    await renderPDFPage(1)
  } catch (error: any) {
    console.error('Error loading PDF:', error)
    pdfError.value = `Ошибка загрузки PDF: ${error.message || 'неизвестная ошибка'}`
  } finally {
    pdfLoading.value = false
  }
}

async function renderPDFPage(pageNum: number) {
  if (!pdfDoc) return

  // Отменяем предыдущий рендер, если он ещё идёт
  if (currentRenderTask) {
    try {
      currentRenderTask.cancel()
    } catch (e) {
      // Игнорируем ошибки отмены
    }
    currentRenderTask = null
  }

  try {
    const page = await pdfDoc.getPage(pageNum)
    const viewport = page.getViewport({ scale: pdfScale.value })

    const canvas = pdfCanvas.value
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }

    const task = page.render(renderContext)
    currentRenderTask = task
    await task.promise
    currentRenderTask = null
  } catch (error: any) {
    // Игнорируем ошибки отмены рендера
    if (error?.name === 'RenderingCancelledException') return
    
    console.error('Error rendering PDF page:', error)
    pdfError.value = `Ошибка отображения страницы: ${error.message || 'неизвестная ошибка'}`
  }
}

function pdfPrevPage() {
  if (pdfPageNum.value > 1) {
    pdfPageNum.value--
    pdfPageInput.value = String(pdfPageNum.value)
    renderPDFPage(pdfPageNum.value)
  }
}

function pdfNextPage() {
  if (pdfPageNum.value < pdfTotalPages.value) {
    pdfPageNum.value++
    pdfPageInput.value = String(pdfPageNum.value)
    renderPDFPage(pdfPageNum.value)
  }
}

function pdfGoToPage() {
  const pageNum = parseInt(pdfPageInput.value, 10)
  if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= pdfTotalPages.value) {
    pdfPageNum.value = pageNum
    renderPDFPage(pageNum)
  } else {
    // Сбросить ввод к текущей странице
    pdfPageInput.value = String(pdfPageNum.value)
  }
}

async function togglePdfFullscreen() {
  isPdfFullscreen.value = !isPdfFullscreen.value

  // Ждём применения CSS и layout
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 50))
  
  if (isPdfFullscreen.value) {
    // Вычисляем оптимальный масштаб для полного экрана
    const newScale = await calcPdfScale()
    pdfScale.value = newScale
  } else {
    // Возвращаем стандартный масштаб
    pdfScale.value = 1.5
  }
  
  // Перерисовываем с новым масштабом
  renderPDFPage(pdfPageNum.value)
}

// Загружаем PDF при переключении на вкладку
watch(activeTab, (newTab) => {
  if (newTab === 'pdf' && !pdfDoc) {
    loadPDF()
  } else if (newTab === 'pdf' && pdfDoc) {
    // Перерисовываем при переключении обратно на PDF
    nextTick(() => {
      renderPDFPage(pdfPageNum.value)
    })
  }
})

// Перерисовываем PDF при повторном открытии панели
watch(() => props.isVisible, (isVisible) => {
  if (isVisible && activeTab.value === 'pdf' && pdfDoc) {
    nextTick(() => {
      renderPDFPage(pdfPageNum.value)
    })
  }
})

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

    <!-- Окно чата (немодальное) -->
    <div
      v-if="isVisible"
      class="ai-chat-overlay non-modal"
      :class="`theme-${props.theme}`"
    >
      <div 
        class="ai-chat-window"
        :class="{ 'minimized': isMinimized }"
        :style="{ height: isMinimized ? '60px' : chatHeight + 'px' }"
      >
        <!-- Заголовок -->
        <div class="chat-header unified-header">
          <!-- Вкладки-кнопки -->
          <div class="header-tabs">
            <button
              class="header-tab-btn"
              :class="{ active: activeTab === 'chat' }"
              @click="activeTab = 'chat'"
              title="Справочник по командам"
            >
              Справочник по командам
            </button>
            <button
              class="header-tab-btn"
              :class="{ active: activeTab === 'pdf' }"
              @click="activeTab = 'pdf'"
              title="Книга"
            >
              Книга
            </button>
          </div>

          <!-- Навигация PDF (показывается только на вкладке PDF) -->
          <div v-if="activeTab === 'pdf' && !isMinimized" class="pdf-nav-inline">
            <button
              class="header-nav-btn"
              @click="pdfPrevPage"
              :disabled="pdfPageNum <= 1"
              title="Предыдущая страница"
            >
              ◀
            </button>
            <input
              v-model="pdfPageInput"
              @keydown.enter="pdfGoToPage"
              @blur="pdfGoToPage"
              class="header-page-input"
              type="text"
              :placeholder="String(pdfPageNum)"
              size="3"
            />
            <span class="header-page-separator">/ {{ pdfTotalPages || '—' }}</span>
            <button
              class="header-nav-btn"
              @click="pdfNextPage"
              :disabled="pdfPageNum >= pdfTotalPages"
              title="Следующая страница"
            >
              ▶
            </button>
            <button
              class="header-nav-btn fullscreen-btn"
              @click="togglePdfFullscreen"
              :title="isPdfFullscreen ? 'Выйти из полноэкранного режима' : 'Во весь экран'"
            >
              {{ isPdfFullscreen ? '⊡' : '⛶' }}
            </button>
          </div>

          <!-- Управление окном -->
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

          <!-- Вкладка чата -->
          <template v-if="activeTab === 'chat'">
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
              placeholder="Введите любое слово (например, circle, rect, color, цвет)"
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

          <!-- Вкладка PDF -->
          <template v-if="activeTab === 'pdf'">
            <div class="pdf-viewer" :class="{ fullscreen: isPdfFullscreen }">
              <!-- Боковая панель навигации (видна только в полноэкранном режиме) -->
              <div v-if="isPdfFullscreen" class="pdf-side-nav">
                <button
                  class="side-nav-btn"
                  @click="pdfPrevPage"
                  :disabled="pdfPageNum <= 1"
                  title="Предыдущая страница"
                >
                  ◀
                </button>
                <input
                  v-model="pdfPageInput"
                  @keydown.enter="pdfGoToPage"
                  @blur="pdfGoToPage"
                  class="side-page-input"
                  type="text"
                  :placeholder="String(pdfPageNum)"
                  size="3"
                />
                <button
                  class="side-nav-btn"
                  @click="pdfNextPage"
                  :disabled="pdfPageNum >= pdfTotalPages"
                  title="Следующая страница"
                >
                  ▶
                </button>
                <button
                  class="side-nav-btn fullscreen-exit-btn"
                  @click="togglePdfFullscreen"
                  title="Выйти из полноэкранного режима"
                >
                  ⊡
                </button>
              </div>

              <!-- Canvas для PDF -->
              <div class="pdf-canvas-container">
                <canvas ref="pdfCanvas" class="pdf-canvas"></canvas>
                <div v-if="pdfLoading" class="pdf-loading">Загрузка PDF...</div>
                <div v-if="pdfError" class="pdf-error">{{ pdfError }}</div>
              </div>
            </div>
          </template>
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

/* Немодальный оверлей - пропускает клики */
.ai-chat-overlay.non-modal {
  pointer-events: none;
}

.ai-chat-overlay.non-modal .ai-chat-window {
  pointer-events: auto;
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
  padding: 0;
  background: v-bind('props.theme === "dark" ? "rgba(100, 108, 255, 0.1)" : "rgba(100, 108, 255, 0.05)"');
  border-bottom: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"');
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: move;
  flex-wrap: nowrap;
}

.unified-header {
  padding: 8px 12px;
}

.header-tabs {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.header-tab-btn {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"');
  border-radius: 6px;
  color: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)"');
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.header-tab-btn:hover {
  background: v-bind('props.theme === "dark" ? "rgba(100, 108, 255, 0.15)" : "rgba(100, 108, 255, 0.1)"');
  border-color: #646cff;
  color: #646cff;
}

.header-tab-btn.active {
  background: rgba(100, 108, 255, 0.3);
  border-color: #646cff;
  color: white;
}

/* Навигация PDF в заголовке */
.pdf-nav-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.header-nav-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"');
  background: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"');
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-nav-btn:hover:not(:disabled) {
  background: rgba(100, 108, 255, 0.3);
  border-color: #646cff;
}

.header-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.header-page-info {
  font-size: 12px;
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
  font-weight: 500;
  min-width: 70px;
  text-align: center;
}

.header-page-input {
  width: 40px;
  height: 28px;
  text-align: center;
  background: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"');
  border: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"');
  border-radius: 4px;
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
  font-size: 12px;
  font-weight: 500;
  outline: none;
  transition: all 0.2s;
}

.header-page-input:focus {
  border-color: #646cff;
  background: v-bind('props.theme === "dark" ? "rgba(100, 108, 255, 0.15)" : "rgba(100, 108, 255, 0.1)"');
}

.header-page-separator {
  font-size: 12px;
  color: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)"');
  margin: 0 4px;
}

.fullscreen-btn {
  margin-left: 4px;
}

.fullscreen-btn:hover:not(:disabled) {
  background: rgba(100, 108, 255, 0.4);
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

/* PDF Viewer */
.pdf-viewer {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: v-bind('props.theme === "dark" ? "#1e1e1e" : "#ffffff"');
  overflow: hidden;
}

.pdf-canvas-container {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  position: relative;
  background: v-bind('props.theme === "dark" ? "#0a0a0a" : "#f5f5f5"');
}

.pdf-canvas {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  background: white;
  max-width: 100%;
  height: auto;
}

.pdf-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 18px;
  color: #646cff;
}

.pdf-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 8px;
  color: #ff4444;
  font-size: 14px;
  text-align: center;
  max-width: 80%;
}

/* Fullscreen кнопка и режим */
.fullscreen-btn {
  margin-left: 8px;
}

.fullscreen-btn:hover:not(:disabled) {
  background: rgba(100, 108, 255, 0.4);
}

.pdf-viewer.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
  background: v-bind('props.theme === "dark" ? "#0a0a0a" : "#f5f5f5"');
}

.pdf-viewer.fullscreen .pdf-canvas-container {
  height: calc(100vh - 50px);
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pdf-viewer.fullscreen .pdf-canvas {
  max-width: 100%;
  max-height: 100vh;
  object-fit: contain;
}

/* Боковая навигация в полноэкранном режиме */
.pdf-side-nav {
  position: fixed;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 10px;
  background: v-bind('props.theme === "dark" ? "rgba(30, 30, 30, 0.95)" : "rgba(255, 255, 255, 0.95)"');
  border: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.15)"');
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  z-index: 10001;
}

.side-nav-btn {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  border: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"');
  background: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"');
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.side-nav-btn:hover:not(:disabled) {
  background: rgba(100, 108, 255, 0.3);
  border-color: #646cff;
  transform: scale(1.1);
}

.side-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.side-page-input {
  width: 44px;
  height: 44px;
  text-align: center;
  background: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"');
  border: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"');
  border-radius: 8px;
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
  font-size: 16px;
  font-weight: 600;
  outline: none;
  transition: all 0.2s;
}

.side-page-input:focus {
  border-color: #646cff;
  background: v-bind('props.theme === "dark" ? "rgba(100, 108, 255, 0.2)" : "rgba(100, 108, 255, 0.1)"');
}

.fullscreen-exit-btn {
  margin-top: 8px;
  background: rgba(255, 95, 86, 0.2);
  border-color: rgba(255, 95, 86, 0.4);
}

.fullscreen-exit-btn:hover {
  background: rgba(255, 95, 86, 0.5);
  border-color: #ff5f56;
}

.side-page-info {
  font-size: 16px;
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
  font-weight: 700;
  text-align: center;
  padding: 8px 0;
}
</style>