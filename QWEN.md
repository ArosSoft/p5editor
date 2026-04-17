## Qwen Added Memories
- В проекте p5editor для прокрутки редактора CodeMirror 6 к найденному слову по центру используется: view.dispatch({ selection: { anchor: match.from, head: match.to }, effects: [EditorView.scrollIntoView(match.from, { y: 'center', yMargin: 300 })] }). Параметр yMargin: 300 обеспечивает правильное центрирование. Прямая прокрутка через scrollEl.scrollTop не работает корректно в vue-codemirror6.
- В проекте p5editor используется vue-codemirror6. Прокрутка редактора к найденному слову через view.scrollDOM.scrollTop не работает, т.к. scrollDOM растягивается по контенту. Реальный контейнер с прокруткой — внешний .editor-content (overflow: auto). Для центрирования строки нужно: 1) Найти wrapper через view.dom.closest('.editor-content'), 2) Получить coords = view.coordsAtPos(match.from), 3) Вычислить lineAbsTop = coords.top - view.dom.getBoundingClientRect().top + wrapper.scrollTop, 4) wrapper.scrollTop = lineAbsTop - viewportHeight/2, где viewportHeight берётся из родителя с overflow:auto/hidden.
- В проекте p5editor кастомная панель поиска в CodeEditor.vue реализована так:

1. **Структура**: `.code-editor-wrapper` — flex-колонка (`display: flex; flex-direction: column; overflow: hidden`). Панель поиска идёт ПЕРЕД `<CodeMirror>`, оба внутри wrapper.

2. **Панель поиска**: `flex-shrink: 0` — не сжимается, всегда вверху. CodeMirror имеет `flex: 1; min-height: 0` (класс `.codemirror-area`) и занимает оставшееся пространство. Скролл внутри `.cm-scroller` (CodeMirror), панель не уезжает.

3. **Дизайн** (стиль Atom One Dark):
   - Фон `#282c34`, бордер `#3e4451`
   - Инпут: `#1e2127` с бордером `#3e4451`, фокус — `#61afef`
   - Счётчик совпадений `{{index}}/{{count}}` — absolute справа внутри input-wrapper
   - Кнопки: навигация ▲▼ (`#3e4451`), toggle замены ↕, закрытие ✕ (`#e06c75`)
   - Replace-секция сворачивается через `showReplaceSection` + `<transition name="slide">`
   - Кнопки replace: "Заменить" (`#61afef`), "Заменить всё" (`#98c379`)

4. **Логика**:
   - `openSearch()` — открывает Ctrl+F, подставляет выделенный текст
   - `findAllMatches()` — находит все совпадения (case-insensitive)
   - `selectMatch()` — выделяет и скроллит через `EditorView.scrollIntoView(match.from, { y: 'start', yMargin: lineHeight * 5 })`
   - `doReplaceNext()` — заменяет текущее выделенное совпадение, обновляет матчи
   - `doReplaceAll()` — заменяет все через RegExp
   - `toggleReplace()` — показывает/скрывает replace-строку
   - Горячие клавиши: Enter — следующее, Shift+Enter — предыдущее, Esc — закрыть

5. **SearchPanel.vue — НЕ используется**, это unused файл, всю логику делает CodeEditor.vue внутри себя.
