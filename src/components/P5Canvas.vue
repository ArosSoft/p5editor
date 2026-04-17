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

  const basePath = import.meta.env.BASE_URL || '/'
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
    body { margin: 0; overflow: hidden; background: ${backgroundColor}; color: ${textColor}; }
    canvas { display: block; }
    body::after {
      content: "";
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background-image: linear-gradient(${gridColor} 1px, transparent 1px),
                        linear-gradient(90deg, ${gridColor} 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
      z-index: -1;
    }
  </style>
</head>
<body>
  <script>
    // Проксирование консоли
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
      console.log = function() { _log.apply(console, arguments); send("log", arguments); };
      console.error = function() { _err.apply(console, arguments); send("error", arguments); };
      console.warn = function() { _warn.apply(console, arguments); send("warn", arguments); };
    })();

    let lastErrorSent = '';

    function getErrorLine(error) {
      if (!error) return 'неизвестно';
      let stack = error.stack || '';

      const setupMatch = stack.match(/at setup \\((?:<anonymous>|VM|blob):(\\d+)/i);
      if (setupMatch && setupMatch[1]) return parseInt(setupMatch[1]);

      const anonMatch = stack.match(/<anonymous>:(\\d+)/i);
      if (anonMatch && anonMatch[1]) return parseInt(anonMatch[1]);

      const lineMatch = stack.match(/:(\\d+):/);
      if (lineMatch && lineMatch[1]) return parseInt(lineMatch[1]);

      return error.lineNumber || error.line || 'неизвестно';
    }

    function translateError(msg) {
      let clean = String(msg || '');
      const colonIndex = clean.indexOf(':');
      if (colonIndex !== -1) clean = clean.substring(colonIndex + 1).trim();

      clean = clean
        .replace(/is not defined/g, 'не определена')
        .replace(/Unexpected end of input/g, ': возможно где-то в программе не поставлена } (закрывающая фигурная скобка)')
        .replace(/Unexpected token/g, 'Неожиданный токен')
        .replace(/Cannot read properties of undefined/g, 'Невозможно прочитать свойства undefined');

      return clean;
    }

    function sendError(prefix, message, line) {
      const fullMsg = "❌ " + prefix + " " + message + " (строка " + line + ")";
      if (fullMsg === lastErrorSent) return;
      lastErrorSent = fullMsg;
      window.parent.postMessage({ type: "error", message: fullMsg }, "*");
    }

    // Основной обработчик ошибок
    window.addEventListener('error', function(e) {
      const err = e.error || e;
      const line = getErrorLine(err);
      const cleanMsg = translateError(e.message || err.message);

      let prefix = 'Ошибка';
      if ((e.message || '').includes('setup')) prefix = 'Ошибка в setup()';
      else if ((e.message || '').includes('draw')) prefix = 'Ошибка в draw()';

      sendError(prefix, cleanMsg, line);
    });

    window.addEventListener('unhandledrejection', function(e) {
      const line = getErrorLine(e.reason);
      const cleanMsg = translateError(e.reason?.message || e.reason);
      sendError('Ошибка', cleanMsg, line);
    });

    window.onerror = function(msg, url, lineNum) {
      if (lineNum && lineNum > 0) {
        const cleanMsg = translateError(msg);
        sendError('Ошибка выполнения', cleanMsg, lineNum);
      }
      return true;
    };

    // Monkey-patch p5 колбэков
    const p5Callbacks = ['setup', 'draw', 'preload', 'mousePressed', 'mouseReleased', 
                         'mouseClicked', 'mouseMoved', 'mouseDragged', 'keyPressed', 
                         'keyReleased', 'keyTyped', 'windowResized'];

    const originalP5 = window.p5;
    window.p5 = function(...args) {
      const instance = new originalP5(...args);

      setTimeout(() => {
        p5Callbacks.forEach(cb => {
          if (typeof instance[cb] === 'function') {
            const originalFn = instance[cb];
            instance[cb] = function(...fnArgs) {
              try {
                return originalFn.apply(this, fnArgs);
              } catch (err) {
                const line = getErrorLine(err);
                const cleanMsg = translateError(err.message);
                sendError("Ошибка в " + cb + "()", cleanMsg, line);
                throw err;
              }
            };
          }
        });
      }, 10);

      return instance;
    };
    window.p5.prototype = originalP5.prototype;

    // Координаты мыши
    document.addEventListener("mousemove", function(e) {
      const c = document.querySelector("canvas");
      if (c) {
        const r = c.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        if (x >= 0 && x <= r.width && y >= 0 && y <= r.height) {
          window.parent.postMessage({ type: "mouseMove", x: Math.round(x), y: Math.round(y) }, "*");
        }
      }
    });

    // Фикс путей ресурсов
    var APP_BASE = "${basePath}";
    function fixResourcePath(path) {
      if (typeof path !== 'string') return path;
      if (path.indexOf('://') !== -1 || path.indexOf('data:') === 0) return path;
      if (path.startsWith('/') && !path.startsWith(APP_BASE)) return APP_BASE + path.substring(1);
      if (!path.startsWith('/') && !path.startsWith(APP_BASE)) return APP_BASE + path;
      return path;
    }

    if (typeof p5 !== 'undefined') {
      const loadFns = ['loadImage','loadFont','loadJSON','loadStrings','loadTable','loadXML','loadBytes','loadModel','loadShader'];
      loadFns.forEach(fnName => {
        if (p5.prototype[fnName]) {
          const orig = p5.prototype[fnName];
          p5.prototype[fnName] = function(...args) {
            if (args.length > 0 && typeof args[0] === 'string') {
              args[0] = fixResourcePath(args[0]);
            }
            return orig.apply(this, args);
          };
        }
      });
    }

    // Выполнение кода пользователя
    try {
      (0, eval)(${encodedCode});
    } catch(e) {
      const lineNum = getErrorLine(e);
      const cleanMsg = translateError(e.message);
      const prefix = e.name === 'SyntaxError' ? 'Синтаксическая ошибка' : 'Ошибка';
      sendError(prefix, cleanMsg, lineNum);
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
  if (iframeRef.value) iframeRef.value.src = 'about:blank'
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
        props.addMessage("Предупреждение: " + data.message)
      } else if (data.type === 'mouseMove') {
        emit('mouseMove', data.x, data.y)
      }
    }
  }
  window.addEventListener('message', handler)
})

onUnmounted(() => {
  if (handler) window.removeEventListener('message', handler)
})
</script>

<template>
  <div class="iframe-container" :class="{ 'theme-dark': theme === 'dark', 'theme-light': theme === 'light' }">
    <iframe
      ref="iframeRef"
      sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
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
.iframe-container.theme-dark { background: #1a1a1a; }
.iframe-container.theme-light { background: #f8f9fa; }
iframe { box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.1); }
</style>