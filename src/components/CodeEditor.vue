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

// Создаем тему для светлой темы
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#333333',
  },
  '.cm-content': {
    backgroundColor: 'transparent',  // ← КЛЮЧЕВОЕ ИЗМЕНЕНИЕ
    color: '#333333',
    caretColor: '#333333',
  },
  '.cm-line': {
    backgroundColor: 'transparent',  // ← КЛЮЧЕВОЕ ИЗМЕНЕНИЕ
    color: '#333333',
  },
  '.cm-gutters': {
    backgroundColor: '#f5f5f5',
    color: '#666666',
    borderRight: '1px solid #e0e0e0',
  },
  '.cm-cursor': {
    borderLeftColor: '#333333',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#b0d0ff !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#90c0ff !important',
  },
}, { dark: false })

// Создаем тему для темной темы
const darkTheme = oneDark

// Используем computed для динамического обновления расширений
const extensions = computed(() => {
  const fontSize = props.fontSize || 15
  const fontFamily = props.fontFamily || 'Consolas, Monaco, monospace'
  const isDark = props.theme === 'dark'

  console.log('Применяем шрифт:', fontFamily, 'размер:', fontSize, 'тема:', isDark ? 'dark' : 'light')

  // Базовая тема
const baseTheme = EditorView.theme({
  '&': {
    fontSize: `${fontSize}px`,
    fontFamily: fontFamily,
    height: '100%',
  },
  '.cm-content': {
    fontFamily: fontFamily + ' !important',
    fontSize: `${fontSize}px`,
    minHeight: '100%',
    backgroundColor: 'transparent',  // ← ДОБАВИТЬ
  },
  '.cm-line': {
    fontFamily: fontFamily + ' !important',
    backgroundColor: 'transparent',  // ← ДОБАВИТЬ
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: fontFamily,
  },
  '.cm-gutter': {
    fontFamily: fontFamily,
  },
  '.cm-activeLine': {
    backgroundColor: 'transparent',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '.cm-selectionBackground': {
    backgroundColor: (isDark ? '#3e4451' : '#b0d0ff') + ' !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: (isDark ? '#3e4451' : '#90c0ff') + ' !important',
  },
}, { dark: isDark })

  return [
    javascript(),
    isDark ? darkTheme : lightTheme,
    baseTheme
  ]
})

// Следим за изменениями шрифта для принудительного обновления
watch(() => [props.fontFamily, props.fontSize, props.theme], () => {
  // Принудительно обновляем редактор
}, { deep: true })
</script>

<template>
  <div
    class="code-editor-wrapper"
    :class="{ 'theme-light': theme === 'light', 'theme-dark': theme === 'dark' }"
  >
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

/* Стили для скроллбара в светлой теме */
.theme-light .cm-editor ::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
</style>