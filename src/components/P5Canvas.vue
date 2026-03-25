<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  addMessage: (msg: string) => void,
  theme?: 'dark' | 'light'
}>()

const emit = defineEmits<{
  (e: 'mouseMove', x: number, y: number): void
}>()

const iframeRef = ref<HTMLIFrameElement | null>(null)
let currentIframeSrc: string | null = null
let currentCode: string = ''

watch(() => props.theme, () => {
  if (iframeRef.value && iframeRef.value.src !== 'about:blank' && currentCode) {
    start(currentCode)
  }
})

defineExpose({ start, stop })

function start(userCode: string) {
  stop()
  currentCode = userCode

  const isDark = props.theme === 'dark'
  const backgroundColor = isDark ? '#1a1a1a' : '#f8f9fa'
  const textColor = isDark ? '#ffffff' : '#333333'
  const gridColor = isDark ? 'rgba(100, 108, 255, 0.1)' : 'rgba(100, 108, 255, 0.05)'

  // ✅ Исправление для GitHub Pages
  // BASE_URL из Vite (например, '/p5editor/') или '/' для корня
  const basePath = import.meta.env.BASE_URL || '/'
  // Убираем trailing slash для baseHref
  const baseHref = window.location.origin + (basePath.endsWith('/') ? basePath.slice(0, -1) : basePath)

  const encodedCode = JSON.stringify(userCode)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/<\//g, '\\u003c\\u002f')

  const htmlContent = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <base href="${baseHref}">
  <title>p5.js Sketch</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"><\/script>
  <style>
    body {
      margin: 0;
      overflow: hidden;
      background: ${backgroundColor};
      color: ${textColor};
    }
    canvas { display: block; }
    body::after {
      content: "";
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background-image:
        linear-gradient(${gridColor} 1px, transparent 1px),
        linear-gradient(90deg, ${gridColor} 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
      z-index: -1;
    }
  </style>
</head>
<body>
  <script>
    // === Проксирование консоли ===
    (function() {
      var _log = console.log, _err = console.error, _warn = console.warn;
      function send(type, args) {
        try {
          window.parent.postMessage({
            type: type,
            message: Array.prototype.slice.call(args).map(String).join(" ")
          }, "*");
        } catch(e) {}
      }
      console.log  = function() { _log.apply(console, arguments);  send("log", arguments); };
      console.error = function() { _err.apply(console, arguments);  send("error", arguments); };
      console.warn  = function() { _warn.apply(console, arguments); send("warn", arguments); };
    })();

    window.onerror = function(msg, url, line) {
      window.parent.postMessage({
        type: "error",
        message: "Ошибка: " + msg + " (строка " + line + ")"
      }, "*");
      return true;
    };

    // === Координаты мыши ===
    document.addEventListener("mousemove", function(e) {
      var c = document.querySelector("canvas");
      if (c) {
        var r = c.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        if (x >= 0 && x <= r.width && y >= 0 && y <= r.height) {
          window.parent.postMessage({
            type: "mouseMove",
            x: Math.round(x),
            y: Math.round(y)
          }, "*");
        }
      }
    });

    // ✅ НОВОЕ: Исправление путей к ресурсам
    // /images/file.png → /p5editor/images/file.png
    var APP_BASE = "${basePath}";

    function fixResourcePath(path) {
      if (typeof path !== 'string') return path;
      // Пропускаем URL-ы с протоколом и data-URI
      if (path.indexOf('://') !== -1 || path.indexOf('data:') === 0) return path;
      // Абсолютный путь /... → добавляем базовый путь
      if (path.charAt(0) === '/' && path.indexOf(APP_BASE) !== 0) {
        return APP_BASE + path.substring(1);
      }
      return path;
    }

    // Патчим ВСЕ функции загрузки p5.js
    if (typeof p5 !== 'undefined') {
      var loadFunctions = [
        'loadImage', 'loadFont', 'loadJSON',
        'loadStrings', 'loadTable', 'loadXML',
        'loadBytes', 'loadModel', 'loadShader'
      ];
      loadFunctions.forEach(function(fnName) {
        if (p5.prototype[fnName]) {
          var original = p5.prototype[fnName];
          p5.prototype[fnName] = function() {
            var args = Array.prototype.slice.call(arguments);
            if (args.length > 0 && typeof args[0] === 'string') {
              args[0] = fixResourcePath(args[0]);
            }
            return original.apply(this, args);
          };
        }
      });
    }

    // === Выполнение пользовательского кода ===
    try {
      (0, eval)(${encodedCode});
    } catch(e) {
      console.error("Ошибка выполнения кода: " + e.message);
    }
  <\/script>
</body>
</html>`

  const blob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)

  if (iframeRef.value) {
    iframeRef.value.src = url
    currentIframeSrc = url
  }
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
}

let handler: ((event: MessageEvent) => void) | null = null

onMounted(() => {
  handler = (event: MessageEvent) => {
    const data = event.data
    if (data?.type) {
      if (data.type === 'log') {
        props.addMessage(data.message)
      } else if (data.type === 'error') {
        props.addMessage(data.message)
      } else if (data.type === 'warn') {
        props.addMessage(`Предупреждение: ${data.message}`)
      } else if (data.type === 'mouseMove') {
        emit('mouseMove', data.x, data.y)
      }
    }
  }
  window.addEventListener('message', handler)
})

onUnmounted(() => {
  if (handler) {
    window.removeEventListener('message', handler)
  }
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
iframe {
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1);
}
</style>