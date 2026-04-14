<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import CodeMirror from 'vue-codemirror6'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import type { EditorState, Transaction } from '@codemirror/state'
import { StateField } from '@codemirror/state'
import type { Range } from '@codemirror/state'
import {
  EditorView,
  Decoration,
  type DecorationSet,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
} from '@codemirror/view'
import { syntaxTree, defaultHighlightStyle, syntaxHighlighting, foldGutter, foldKeymap, bracketMatching, indentOnInput } from '@codemirror/language'
import { indentWithTab, history, historyKeymap } from '@codemirror/commands'
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from '@codemirror/autocomplete'
import { UNIQUE_P5_KEYWORDS } from '../lib/p5-keywords'
import { setSearchQuery, SearchQuery } from '@codemirror/search'

const props = defineProps<{
  modelValue: string,
  fontSize?: number,
  fontFamily?: string,
  theme?: 'dark' | 'light'
}>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const value = ref(props.modelValue)
const editorRef = ref<InstanceType<typeof CodeMirror> | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)

// === Рефы для кастомной панели поиска ===
const showSearchPanel = ref(false)
const showReplaceSection = ref(false)
const currentQuery = ref('')
const currentReplace = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const matchCount = ref(0)
const currentMatchIndex = ref(-1)
const allMatches = ref<Array<{ from: number; to: number }>>([])

// Вычисляемый EditorView
const editorView = computed(() => editorRef.value?.view ?? null)

// === Синхронизация modelValue -> value ===
watch(() => props.modelValue, (newVal) => {
  value.value = newVal
})

// === Функции поиска и замены ===
function findAllMatches(query: string): Array<{ from: number; to: number }> {
  if (!editorView.value || !query) return []
  const doc = editorView.value.state.doc.toString()
  const matches: Array<{ from: number; to: number }> = []
  const lowerDoc = doc.toLowerCase()
  const lowerQuery = query.toLowerCase()
  let idx = 0
  while (true) {
    const pos = lowerDoc.indexOf(lowerQuery, idx)
    if (pos === -1) break
    matches.push({ from: pos, to: pos + query.length })
    idx = pos + 1
  }
  return matches
}

function updateMatches() {
  allMatches.value = findAllMatches(currentQuery.value)
  matchCount.value = allMatches.value.length
}

function selectMatch(index: number) {
  if (!editorView.value || allMatches.value.length === 0) return
  const wrapIndex = ((index % allMatches.value.length) + allMatches.value.length) % allMatches.value.length
  const match = allMatches.value[wrapIndex]
  if (!match) return
  currentMatchIndex.value = wrapIndex

  const scrollMargin = Math.round(editorView.value.defaultLineHeight * 5)

  editorView.value.dispatch({
    selection: { anchor: match.from, head: match.to },
    effects: EditorView.scrollIntoView(match.from, {
      y: 'start',
      yMargin: scrollMargin,
    }),
  })
}

function openSearch() {
  if (editorView.value) {
    const sel = editorView.value.state.selection.main
    if (sel.from < sel.to) {
      currentQuery.value = editorView.value.state.sliceDoc(sel.from, sel.to)
    } else {
      currentQuery.value = ''
    }
  }
  currentReplace.value = ''
  showReplaceSection.value = false
  showSearchPanel.value = true

  nextTick(() => {
    updateMatches()
    searchInput.value?.focus()
    searchInput.value?.select()
  })
}

function closeSearch() {
  if (editorView.value) {
    const emptyQuery = new SearchQuery({ search: '' })
    editorView.value.dispatch({
      effects: setSearchQuery.of(emptyQuery),
    })
    editorView.value.focus()
  }
  showSearchPanel.value = false
  showReplaceSection.value = false
  allMatches.value = []
  matchCount.value = 0
  currentMatchIndex.value = -1
}

function toggleReplace() {
  showReplaceSection.value = !showReplaceSection.value
}

function updateSearchQuery() {
  if (!editorView.value) return
  const q = new SearchQuery({
    search: currentQuery.value,
    caseSensitive: false,
    wholeWord: false,
    regexp: false,
    replace: currentReplace.value || undefined,
  })
  editorView.value.dispatch({
    effects: setSearchQuery.of(q),
  })
  updateMatches()
  if (allMatches.value.length > 0) {
    selectMatch(0)
  }
}

watch([currentQuery, currentReplace], updateSearchQuery)

function customFindNext() {
  if (allMatches.value.length === 0) return
  const nextIdx = currentMatchIndex.value < 0 ? 0 : currentMatchIndex.value + 1
  selectMatch(nextIdx)
}

function customFindPrevious() {
  if (allMatches.value.length === 0) return
  const prevIdx = currentMatchIndex.value <= 0 ? allMatches.value.length - 1 : currentMatchIndex.value - 1
  selectMatch(prevIdx)
}

function doReplaceNext() {
  if (!editorView.value || allMatches.value.length === 0) return
  const sel = editorView.value.state.selection.main
  const matchIdx = allMatches.value.findIndex(
    (m) => m.from === sel.from && m.to === sel.to
  )
  if (matchIdx !== -1) {
    editorView.value.dispatch({
      changes: { from: sel.from, to: sel.to, insert: currentReplace.value },
    })
    nextTick(() => {
      updateMatches()
      const nextIdx = currentMatchIndex.value >= allMatches.value.length ? 0 : currentMatchIndex.value
      if (allMatches.value.length > 0) selectMatch(nextIdx)
    })
  } else {
    customFindNext()
  }
}

function doReplaceAll() {
  if (!editorView.value || !currentQuery.value) return
  const doc = editorView.value.state.doc.toString()
  const regex = new RegExp(
    currentQuery.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    'gi'
  )
  const newDoc = doc.replace(regex, currentReplace.value)
  editorView.value.dispatch({
    changes: { from: 0, to: editorView.value.state.doc.length, insert: newDoc },
  })
  updateMatches()
}

function handleSearchKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeSearch()
    e.preventDefault()
    e.stopPropagation()
  }
}

// === Подсветка p5.js ===
function p5KeywordsHighlight() {
  const keywordSet = new Set(UNIQUE_P5_KEYWORDS)

  const p5KeywordsField = StateField.define<DecorationSet>({
    create(state: EditorState) {
      return highlightKeywords(state)
    },
    update(decorations: DecorationSet, transaction: Transaction) {
      if (transaction.docChanged) {
        return highlightKeywords(transaction.state)
      }
      return decorations.map(transaction.changes)
    },
    provide: (f: StateField<DecorationSet>) => EditorView.decorations.from(f),
  })

  function highlightKeywords(state: EditorState): DecorationSet {
    const decorations: Range<Decoration>[] = []
    const tree = syntaxTree(state)

    tree.iterate({
      enter(node: any) {
        if (node.name === 'VariableName' || node.name === 'PropertyName') {
          const text = state.sliceDoc(node.from, node.to)
          if (keywordSet.has(text)) {
            decorations.push(
              Decoration.mark({
                class: 'cm-p5-keyword',
                attributes: { style: 'color: #61afef; font-weight: bold;' },
              }).range(node.from, node.to)
            )
          }
        }

        if (node.name === 'VariableName') {
          const text = state.sliceDoc(node.from, node.to)
          const p5Functions = [
            'setup', 'draw', 'preload',
            'mousePressed', 'mouseDragged', 'mouseMoved', 'mouseReleased', 'mouseClicked',
            'touchStarted', 'touchMoved', 'touchEnded',
            'keyPressed', 'keyReleased', 'keyTyped',
            'windowResized'
          ]
          if (p5Functions.includes(text)) {
            decorations.push(
              Decoration.mark({
                class: 'cm-p5-function',
                attributes: { style: 'color: #e5c07b; font-weight: bold;' },
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

// === Расширения CodeMirror ===
const extensions = computed(() => {
  const isDark = props.theme === 'dark'

  const baseTheme = EditorView.theme({
    '&': {
      fontSize: `${props.fontSize || 15}px`,
      fontFamily: props.fontFamily || 'Consolas, Monaco, monospace',
      height: '100%',
    },
    '.cm-content': {
      fontFamily: `${props.fontFamily || 'Consolas, Monaco, monospace'} !important`,
      fontSize: `${props.fontSize || 15}px`,
      minHeight: '100%',
      backgroundColor: 'transparent',
    },
    '.cm-line': {
      fontFamily: `${props.fontFamily || 'Consolas, Monaco, monospace'} !important`,
      backgroundColor: 'transparent',
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: props.fontFamily || 'Consolas, Monaco, monospace',
    },
    '.cm-gutter': {
      fontFamily: props.fontFamily || 'Consolas, Monaco, monospace',
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

  // Перехват Ctrl+F / Ctrl+H (физическая клавиша — работает в любой раскладке)
  const searchKeyHandler = EditorView.domEventHandlers({
    keydown(e) {
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyF' || e.code === 'KeyH')) {
        e.preventDefault()
        e.stopPropagation()
        openSearch()
        return true
      }
      return false
    },
  })

  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    javascript(),
    isDark ? oneDark : syntaxHighlighting(defaultHighlightStyle),
    isDark ? EditorView.theme({}) : EditorView.theme({
      '&': { backgroundColor: '#ffffff', color: '#333333' },
      '.cm-content': { backgroundColor: 'transparent', color: '#333333', caretColor: '#333333' },
      '.cm-line': { backgroundColor: 'transparent', color: '#333333' },
      '.cm-gutters': { backgroundColor: '#f5f5f5', color: '#666666', borderRight: '1px solid #e0e0e0' },
      '.cm-cursor': { borderLeftColor: '#333333' },
      '.cm-selectionBackground': { backgroundColor: '#b0d0ff !important' },
      '&.cm-focused .cm-selectionBackground': { backgroundColor: '#90c0ff !important' },
    }, { dark: false }),
    baseTheme,
    keymap.of([
      indentWithTab,
      ...historyKeymap,
      ...closeBracketsKeymap,
      ...foldKeymap,
      ...completionKeymap,
    ]),
    searchKeyHandler,
    ...p5KeywordsHighlight()
  ]
})

// Инициализация при монтировании
onMounted(() => {
  value.value = props.modelValue
})
</script>

<template>
  <div
    ref="wrapperRef"
    class="code-editor-wrapper"
    :class="{ 'theme-light': theme === 'light', 'theme-dark': theme === 'dark' }"
  >
    <!-- Кастомная панель поиска -->
    <div
      v-if="showSearchPanel"
      class="custom-search-panel"
      :class="{ 'theme-dark': theme === 'dark' }"
      @keydown="handleSearchKeydown"
    >
      <div class="search-row">
        <div class="search-input-wrapper">
          <input
            ref="searchInput"
            v-model="currentQuery"
            class="search-input"
            placeholder="Найти..."
            @keyup.enter="customFindNext"
          />
          <span v-if="currentQuery && matchCount > 0" class="match-counter">
            {{ currentMatchIndex + 1 }}/{{ matchCount }}
          </span>
        </div>

        <div class="search-buttons">
          <button @click="customFindPrevious" title="Предыдущее совпадение (Shift+Enter)" class="nav-btn">
            ▲
          </button>
          <button @click="customFindNext" title="Следующее совпадение (Enter)" class="nav-btn">
            ▼
          </button>
          <button @click="toggleReplace" title="Заменить" class="toggle-replace-btn">
            ↕
          </button>
          <button @click="closeSearch" title="Закрыть (Esc)" class="close-btn">
            ✕
          </button>
        </div>
      </div>

      <transition name="slide">
        <div v-if="showReplaceSection" class="replace-row">
          <input
            v-model="currentReplace"
            class="replace-input"
            placeholder="Заменить на..."
            @keyup.enter="doReplaceNext"
          />
          <button @click="doReplaceNext" class="replace-btn">
            Заменить
          </button>
          <button @click="doReplaceAll" class="replace-btn replace-all-btn">
            Заменить всё
          </button>
        </div>
      </transition>
    </div>

    <CodeMirror
      ref="editorRef"
      v-model="value"
      :extensions="extensions"
      :wrap="true"
      class="codemirror-area"
      placeholder="Напиши свой p5.js скетч здесь..."
      @update:model-value="emit('update:modelValue', $event as string)"
    />
  </div>
</template>

<style>
.code-editor-wrapper {
  height: 100%;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ==================== КАСТОМНАЯ ПАНЕЛЬ ПОИСКА ==================== */
.custom-search-panel {
  flex-shrink: 0;
  background: #282c34;
  border-bottom: 1px solid #3e4451;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 100;
  animation: searchPanelPop 0.2s ease;
}

@keyframes searchPanelPop {
  from { opacity: 0; transform: translateY(-10px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-input,
.replace-input {
  width: 100%;
  padding: 6px 10px;
  background: #1e2127;
  border: 1px solid #3e4451;
  border-radius: 4px;
  color: #abb2bf;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus,
.replace-input:focus {
  border-color: #61afef;
}

.search-input::placeholder,
.replace-input::placeholder {
  color: #5c6370;
}

.match-counter {
  position: absolute;
  right: 8px;
  color: #5c6370;
  font-size: 12px;
  white-space: nowrap;
}

.search-buttons {
  display: flex;
  gap: 4px;
}

.nav-btn,
.toggle-replace-btn,
.close-btn {
  padding: 6px 10px;
  background: #3e4451;
  border: none;
  border-radius: 4px;
  color: #abb2bf;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.nav-btn:hover,
.toggle-replace-btn:hover,
.close-btn:hover {
  background: #4b5263;
}

.close-btn {
  background: #e06c75;
}

.close-btn:hover {
  background: #c45a63;
}

.replace-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.replace-input {
  flex: 1;
}

.replace-btn,
.replace-all-btn {
  padding: 6px 12px;
  background: #61afef;
  border: none;
  border-radius: 4px;
  color: #1e2127;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background 0.2s;
  white-space: nowrap;
}

.replace-btn:hover,
.replace-all-btn:hover {
  background: #4a9bdc;
}

.replace-all-btn {
  background: #98c379;
}

.replace-all-btn:hover {
  background: #85b265;
}

/* Анимация для панели замены */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  max-height: 50px;
  opacity: 1;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
}

.codemirror-area {
  flex: 1;
  min-height: 0;
}

/* Скрыть встроенную панель поиска */
.cm-editor .cm-panel {
  display: none !important;
}

/* p5.js подсветка */
.cm-p5-keyword {
  color: #61afef !important;
  font-weight: bold !important;
}

.cm-p5-function {
  color: #e5c07b !important;
  font-weight: bold !important;
}

.theme-dark .cm-p5-keyword,
.theme-dark .cm-p5-function {
  color: inherit !important;
}
</style>
