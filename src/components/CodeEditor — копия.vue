<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CodeMirror from 'vue-codemirror6'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import type { EditorState, Transaction } from '@codemirror/state'
import { StateField } from '@codemirror/state'
import type { Range } from '@codemirror/state'
import { EditorView, Decoration, type DecorationSet, keymap } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { indentWithTab } from '@codemirror/commands'
import { UNIQUE_P5_KEYWORDS } from '../lib/p5-keywords'

const props = defineProps<{
  modelValue: string,
  fontSize?: number,
  fontFamily?: string,
  theme?: 'dark' | 'light'
}>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const value = ref(props.modelValue)
const editorRef = ref<InstanceType<typeof CodeMirror> | null>(null)

// Создаем расширение для подсветки ключевых слов p5.js
function p5KeywordsHighlight() {
  const keywordSet = new Set(UNIQUE_P5_KEYWORDS)
  
  // Создаем поле состояния для декораций
  const p5KeywordsField = StateField.define<DecorationSet>({
    create(state: EditorState) {
      return highlightKeywords(state)
    },
    update(decorations: DecorationSet, transaction: Transaction) {
      // Пересоздаем декорации при изменении документа
      if (transaction.docChanged) {
        return highlightKeywords(transaction.state)
      }
      return decorations.map(transaction.changes)
    },
    provide: (field: StateField<DecorationSet>) => EditorView.decorations.from(field),
  })

  // Функция для подсветки ключевых слов
  function highlightKeywords(state: EditorState): DecorationSet {
    const decorations: Range<Decoration>[] = []
    const tree = syntaxTree(state)
    
    // Проходим по всем токенам в документе
    tree.iterate({
      enter: (node: any) => {
        // Проверяем, является ли узел идентификатором
        if (node.name === 'VariableName' || node.name === 'PropertyName') {
          const text = state.sliceDoc(node.from, node.to)
          
          // Если это ключевое слово p5.js, добавляем декорацию
          if (keywordSet.has(text)) {
            decorations.push(
              Decoration.mark({
                class: 'cm-p5-keyword',
                attributes: {
                  style: 'color: #61afef; font-weight: bold;',
                },
              }).range(node.from, node.to)
            )
          }
        }
        
        // Также проверяем имена функций
        if (node.name === 'VariableName') {
          const text = state.sliceDoc(node.from, node.to)
          
          // Проверяем, является ли это функцией p5.js (setup, draw, и т.д.)
          const isP5Function = [
            'setup', 'draw', 'preload',
            'mousePressed', 'mouseDragged', 'mouseMoved', 'mouseReleased', 'mouseClicked',
            'touchStarted', 'touchMoved', 'touchEnded',
            'keyPressed', 'keyReleased', 'keyTyped',
            'windowResized'
          ].includes(text)
          
          if (isP5Function) {
            decorations.push(
              Decoration.mark({
                class: 'cm-p5-function',
                attributes: {
                  style: 'color: #e5c07b; font-weight: bold;',
                },
              }).range(node.from, node.to)
            )
          }
        }
      },
    })
    
    return Decoration.set(decorations)
  }

  return [p5KeywordsField]
}

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
    baseTheme,
    keymap.of([indentWithTab]),
    ...p5KeywordsHighlight()
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

/* Стили для ключевых слов p5.js */
.cm-p5-keyword {
  color: #61afef !important;
  font-weight: bold !important;
}

.cm-p5-function {
  color: #e5c07b !important;
  font-weight: bold !important;
}

/* Дополнительные стили для темной темы */
.theme-dark .cm-p5-keyword {
  color: #61afef !important;
  font-weight: bold !important;
}

.theme-dark .cm-p5-function {
  color: #e5c07b !important;
  font-weight: bold !important;
}
</style>