<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CodeMirror from 'vue-codemirror6'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'

const props = defineProps<{ 
  modelValue: string,
  fontSize?: number,
  fontFamily?: string,
  theme?: 'dark' | 'light'
}>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const value = ref(props.modelValue)
const editorRef = ref<InstanceType<typeof CodeMirror> | null>(null)

// Следим за изменениями modelValue
watch(() => props.modelValue, (newVal) => {
  value.value = newVal
})

// Используем computed для динамического обновления расширений
const extensions = computed(() => {
  const fontSize = props.fontSize || 15
  const fontFamily = props.fontFamily || 'Consolas, Monaco, monospace'
  const isDark = props.theme !== 'light'
  
  console.log('Применяем шрифт:', fontFamily, 'размер:', fontSize) // для отладки
  
  // Базовая тема
  const themeExtension = isDark ? oneDark : EditorView.theme({
    '&': {
      backgroundColor: '#ffffff',
      color: '#333333',
    },
    '.cm-content': {
      backgroundColor: '#ffffff',
      color: '#333333',
      fontFamily: fontFamily, // Явно указываем шрифт для содержимого
    },
    '.cm-line': {
      backgroundColor: '#ffffff',
      color: '#333333',
      fontFamily: fontFamily, // Явно указываем шрифт для строк
    },
    '.cm-gutters': {
      backgroundColor: '#f5f5f5',
      color: '#666666',
      borderRight: '1px solid #e0e0e0',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#e8e8e8',
    },
    '.cm-activeLine': {
      backgroundColor: '#f0f0f0',
    },
    '.cm-cursor': {
      borderLeftColor: '#333333',
    },
    '.cm-selectionBackground': {
      backgroundColor: '#b0d0ff',
    },
  })
  
  return [
    javascript(),
    themeExtension,
    EditorView.theme({
      '&': {
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily,
        height: '100%',
      },
      '.cm-content': {
        fontFamily: fontFamily + ' !important', // Принудительно применяем шрифт
        fontSize: `${fontSize}px`,
        minHeight: '100%',
      },
      '.cm-line': {
        fontFamily: fontFamily + ' !important', // Принудительно применяем шрифт к строкам
      },
      '.cm-scroller': {
        overflow: 'auto',
        fontFamily: fontFamily,
      },
      '.cm-gutter': {
        fontFamily: fontFamily,
      }
    })
  ]
})

// Следим за изменениями шрифта для принудительного обновления
watch(() => [props.fontFamily, props.fontSize], () => {
  // Принудительно обновляем редактор
  // Эта функция может быть недоступна в некоторых версиях vue-codemirror6
}, { deep: true })
</script>

<template>
  <div class="code-editor-wrapper" :style="{ fontFamily: fontFamily, fontSize: fontSize + 'px' }">
    <CodeMirror
      ref="editorRef"
      v-model="value"
      :extensions="extensions"
      :basic="true"
      :wrap="true"
      placeholder="Напиши свой p5.js скетч здесь..."
      @update:model-value="emit('update:modelValue', $event as string)"
    />
  </div>
</template>

<style>
.code-editor-wrapper {
  height: 100%;
  width: 100%;
}

.cm-editor {
  height: 100%;
}

.cm-scroller {
  overflow: auto;
}

/* Стили для CodeMirror */
.cm-editor .cm-content {
  caret-color: currentColor;
  padding: 10px 0;
  line-height: 1.5;
}

.cm-editor .cm-line {
  padding: 0 8px;
}

/* Стили для светлой темы */
.light-theme .cm-editor {
  background-color: #ffffff;
}

/* Принудительное применение шрифта ко всем элементам */
.cm-editor, 
.cm-content,
.cm-line,
.cm-gutter,
.cm-gutterElement,
.cm-activeLine,
.cm-activeLineGutter {
  font-family: inherit !important;
}

/* Стили для скроллбара в светлой теме */
.theme-light .cm-editor ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.theme-light .cm-editor ::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.theme-light .cm-editor ::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 5px;
}

.theme-light .cm-editor ::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>