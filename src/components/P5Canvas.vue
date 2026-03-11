<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  addMessage: (msg: string) => void,
  theme?: 'dark' | 'light'
}>()

// Добавляем emit для передачи координат мыши
const emit = defineEmits<{
  (e: 'mouseMove', x: number, y: number): void
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
let currentIframeSrc: string | null = null
let currentCode: string = ''

// Следим за изменением темы
watch(() => props.theme, () => {
  // Если есть запущенный скетч, перезапускаем его с новой темой
  if (iframeRef.value && iframeRef.value.src !== 'about:blank' && currentCode) {
    start(currentCode)
  }
})

defineExpose({ start, stop })

function start(userCode: string) {
  stop() // очищаем предыдущий
  currentCode = userCode // сохраняем код для возможного перезапуска

  props.addMessage('Запуск скетча в iframe...')

  // Определяем цвета в зависимости от темы
  const isDark = props.theme === 'dark'
  const backgroundColor = isDark ? '#1a1a1a' : '#f8f9fa'
  const textColor = isDark ? '#ffffff' : '#333333'
  const gridColor = isDark ? 'rgba(100, 108, 255, 0.1)' : 'rgba(100, 108, 255, 0.05)'

  // Код для отслеживания мыши через события DOM (3-й вариант)
  const mouseTrackerCode = `
    // Функция для отправки координат мыши
    function sendMouseCoordinates(x, y) {
      window.parent.postMessage({
        type: 'mouseMove',
        x: Math.round(x),
        y: Math.round(y)
      }, '*');
    }

    // Добавляем слушатель событий мыши на canvas после его создания
    function setupMouseTracking() {
      // Ищем canvas на странице
      const canvas = document.querySelector('canvas');
      if (canvas) {
        // Удаляем старый слушатель, если был
        canvas.removeEventListener('mousemove', window._mouseMoveHandler);
        
        // Создаем новый обработчик
        window._mouseMoveHandler = function(e) {
          const rect = canvas.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          
          // Проверяем, что координаты в пределах canvas
          if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            sendMouseCoordinates(x, y);
          }
        };
        
        // Добавляем слушатель
        canvas.addEventListener('mousemove', window._mouseMoveHandler);
      }
    }

    // Запускаем отслеживание после загрузки страницы
    window.addEventListener('load', function() {
      // Ждем немного, чтобы canvas точно создался
      setTimeout(setupMouseTracking, 100);
    });

    // Также запускаем отслеживание при каждом вызове draw (если p5.js пересоздает canvas)
    const originalDraw = window.draw;
    window.draw = function() {
      if (originalDraw) {
        originalDraw();
      }
      // Проверяем, есть ли canvas и слушатель
      const canvas = document.querySelector('canvas');
      if (canvas && !window._mouseMoveHandler) {
        setupMouseTracking();
      }
    };
  `

  const htmlContent = [
    '<!DOCTYPE html>',
    '<html lang="ru">',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <title>p5.js Sketch</title>',
    '  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/2.0.5/p5.min.js"><\/script>',
    '  <style>',
    '    body {',
    '      margin: 0;',
    '      overflow: hidden;',
    '      background: ' + backgroundColor + ';',
    '      color: ' + textColor + ';',
    '    }',
    '    canvas {',
    '      display: block;',
    '    }',
    '    /* Добавляем декоративную сетку на фон */',
    '    body::after {',
    '      content: "";',
    '      position: fixed;',
    '      top: 0;',
    '      left: 0;',
    '      right: 0;',
    '      bottom: 0;',
    '      background-image: ',
    '        linear-gradient(' + gridColor + ' 1px, transparent 1px),',
    '        linear-gradient(90deg, ' + gridColor + ' 1px, transparent 1px);',
    '      background-size: 50px 50px;',
    '      pointer-events: none;',
    '      z-index: -1;',
    '    }',
    '  </style>',
    '</head>',
    '<body>',
    '  <script>',
    '    const originalLog = console.log;',
    '    console.log = function(...args) {',
    '      originalLog.apply(console, args);',
    '      window.parent.postMessage({',
    '        type: "log",',
    '        message: args.map(a => String(a)).join(" ")',
    '      }, "*");',
    '    };',
    '',
    '    window.onerror = function(msg, url, line) {',
    '      window.parent.postMessage({',
    '        type: "error",',
    '        message: "Ошибка: " + msg + " (строка " + line + ")"',
    '      }, "*");',
    '      return true;',
    '    };',
    '',
    '    // Добавляем код отслеживания мыши',
    '    ' + mouseTrackerCode,
    '',
    '    try {',
    userCode,
    '    } catch (e) {',
    '      console.error("Ошибка выполнения кода:", e);',
    '    }',
    '  <\/script>',
    '</body>',
    '</html>'
  ].join('\n')

  const blob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  if (iframeRef.value) {
    iframeRef.value.src = url
    currentIframeSrc = url
  }

  props.addMessage(`Скетч запущен в изолированном iframe (тема: ${isDark ? 'тёмная' : 'светлая'})`)
}

function stop() {
  if (iframeRef.value) {
    iframeRef.value.src = 'about:blank'
  }
  if (currentIframeSrc) {
    URL.revokeObjectURL(currentIframeSrc)
    currentIframeSrc = null
  }
  currentCode = ''
  props.addMessage('Скетч остановлен')
}

onMounted(() => {
  const handler = (event: MessageEvent) => {
    const data = event.data
    if (data?.type) {
      if (data.type === 'log') {
        props.addMessage(data.message)
      } else if (data.type === 'error') {
        props.addMessage(data.message)
      } else if (data.type === 'warn') {
        props.addMessage(`Предупреждение: ${data.message}`)
      } else if (data.type === 'mouseMove') {
        // Передаём координаты мыши в родительский компонент
        emit('mouseMove', data.x, data.y)
      }
    }
  }

  window.addEventListener('message', handler)
})

onUnmounted(() => {
  window.removeEventListener('message', handler)
})
</script>

<template>
  <div class="iframe-container" :class="{ 'theme-dark': theme === 'dark', 'theme-light': theme === 'light' }">
    <iframe
      ref="iframeRef"
      sandbox="allow-scripts allow-same-origin allow-popups"
      style="width:100%; height:100%; border:none;"
    ></iframe>
  </div>
</template>

<style scoped>
.iframe-container {
  width: 100%;
  height: 100%;
  transition: background-color 0.3s;
  position: relative;
  overflow: hidden;
}

.iframe-container.theme-dark {
  background: #1a1a1a;
}

.iframe-container.theme-light {
  background: #f8f9fa;
}

/* Добавляем небольшую тень для iframe */
iframe {
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);
}
</style>