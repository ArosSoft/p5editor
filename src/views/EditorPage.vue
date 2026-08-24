<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onUnmounted,
  computed,
  shallowRef,
  defineAsyncComponent,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import P5Canvas from '../components/P5Canvas.vue';
import { useClassRooms } from '../composables/useClassRooms';
import ConsoleOutput from '../components/ConsoleOutput.vue';
import AuthModal from '../components/AuthModal.vue';
import UserProfile from '../components/UserProfile.vue';
import ReportErrorModal from '../components/ReportErrorModal.vue';
import { useAuth } from '../composables/useAuth';
import { useSketches } from '../composables/useSketches';
import { saveAs } from 'file-saver';
import beautify from 'js-beautify';
import { supabase } from '../lib/supabase';

// Ленивая загрузка тяжёлых компонентов
const CodeEditor = defineAsyncComponent(
  () => import('../components/CodeEditor.vue')
);
const ExamplesPanel = defineAsyncComponent(
  () => import('../components/ExamplesPanel.vue')
);
const PalettePanel = defineAsyncComponent(
  () => import('../components/PalettePanel.vue')
);
const AIChat = defineAsyncComponent(() => import('../components/AIChat.vue'));

const route = useRoute();
const router = useRouter();
const { isAuthenticated, user } = useAuth();
const { createSketch, updateSketch, getSketchById, generateNumericSketchId } = useSketches();
const { hasRoom, loadHasRoom } = useClassRooms();
const showAuthModal = ref(false);
const showReportModal = ref(false);

// ID текущего скетча (если загружен из БД)
const currentSketchId = ref<string | null>(null);
const isSaving = ref(false);

const code = ref(`function setup() {
  // установка размеров холста
  createCanvas(800, 600);
  // настройка модели цвета
  colorMode(HSB, 256, 100, 100);
}

function draw() {
  // background(220);
  ellipse(mouseX, mouseY, 50, 50);
  // смена цвета при нажатии
  if (mouseIsPressed)
    fill(frameCount % 256, 100, 100);
  // напиши свой код ниже

}`);

const originalCode = ref(code.value);

const messages = ref<string[]>([]);
const canvasRef = ref<InstanceType<typeof P5Canvas> | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const showExamples = ref(false);
const showPalette = ref(false);

const fontSize = ref(19);
const fontFamily = ref('Consolas, Monaco, monospace');

type Theme = 'dark' | 'light';
const theme = ref<Theme>('dark');

const history = ref<string[]>([]);
const historyIndex = ref(-1);

const consoleHeight = ref(150);
const isConsoleVisible = ref(true);
const isDragging = ref(false);
const startY = ref(0);
const startHeight = ref(150);

// Минимальные ширины панелей (в пикселях)
const MIN_EXAMPLES_WIDTH = 250;
const MIN_EDITOR_WIDTH = 300;
const MIN_CANVAS_WIDTH = 450;

// Ширины панелей в пикселях (будут рассчитаны при монтировании)
const examplesWidth = ref(420);
const canvasWidth = ref(810);

// Состояние перетаскивания разделителей
const draggingDivider = ref<'examples-editor' | 'editor-canvas' | null>(null);
let dragStartX = 0;
let dragStartExamplesWidth = 0;
let dragStartCanvasWidth = 0;

// Управление боковым меню
const isMenuExpanded = ref(false);
const activeMenuItem = ref<string | null>(null);

const AUTO_OPEN_AI_CHAT_KEY = 'p5editor_ai_chat_last_auto_open_at';
const AUTO_OPEN_AI_CHAT_INTERVAL_MS = 60 * 60 * 1000;

const showAIChat = ref(false);

const sketchName = ref('Мой первый скетч');

const mouseX = ref(0);
const mouseY = ref(0);

// Настройки версии p5.js
type P5Source = 'cdn' | 'local';
const savedSource = localStorage.getItem('p5editor-p5-source');
const p5Source = ref<P5Source>(
  savedSource === 'cdn' || savedSource === 'local' ? savedSource : 'local'
);
const savedVersion = localStorage.getItem('p5editor-p5-cdn-version');
const p5CdnVersion = ref(savedVersion || '1.11.13');
const p5LocalVersion = '1.11.13'; // Версия локальных файлов в папке p5/
const savedCsg = localStorage.getItem('p5editor-p5-csg-enabled');
const p5CsgEnabled = ref(savedCsg === 'true');

// Состояние подключения к БД
const supabaseStatus = ref<'checking' | 'connected' | 'error'>('checking');

// Ref на main контейнер для расчётов
const mainRef = ref<HTMLElement | null>(null);

// Добавляем новые переменные для "призрачного" ресайза
const ghostDividerX = ref<number | null>(null); // позиция призрачной линии

let autoOpenAIChatTimer: ReturnType<typeof setTimeout> | null = null;

// Переменные для таймеров автосохранения
let saveHistoryTimer: ReturnType<typeof setTimeout> | null = null;
let saveCodeTimer: ReturnType<typeof setTimeout> | null = null;
let lastSavedCode = '';

function shouldAutoOpenAIChat() {
  try {
    const raw = localStorage.getItem(AUTO_OPEN_AI_CHAT_KEY);
    if (!raw) return true;

    const lastOpenedAt = Number(raw);
    if (!Number.isFinite(lastOpenedAt)) return true;

    return Date.now() - lastOpenedAt >= AUTO_OPEN_AI_CHAT_INTERVAL_MS;
  } catch {
    return true;
  }
}

function markAIChatAutoOpened() {
  try {
    localStorage.setItem(AUTO_OPEN_AI_CHAT_KEY, String(Date.now()));
  } catch {
    // ignore storage errors
  }
}

function updateMouseCoordinates(x: number, y: number) {
  mouseX.value = Math.round(x);
  mouseY.value = Math.round(y);
}

function handleAIMessage(message: string) {
  // Сообщение от помощника не выводится в консоль
}

// Функция проверки подключения к Supabase
async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from('sketches').select('id').limit(1);

    if (error) {
      // Если есть ошибка, но это не ошибка сети - считаем что соединение есть
      if (error.code && ['400', '401', '403'].includes(error.code)) {
        supabaseStatus.value = 'connected';
      } else {
        supabaseStatus.value = 'error';
      }
    } else {
      supabaseStatus.value = 'connected';
    }
  } catch (e) {
    // Ошибка сети или таймаут
    supabaseStatus.value = 'error';
  }
}

// === Обработчики для изменения размера консоли ===
function startConsoleResize(e: MouseEvent) {
  isDragging.value = true;
  startY.value = e.clientY;
  startHeight.value = consoleHeight.value;
  document.body.style.cursor = 'row-resize';
  document.body.style.userSelect = 'none';
}

function onConsoleResize(e: MouseEvent) {
  if (!isDragging.value) return;
  const deltaY = startY.value - e.clientY;
  const newHeight = Math.min(
    Math.max(50, startHeight.value + deltaY),
    window.innerHeight * 0.5
  );
  consoleHeight.value = newHeight;
}

function stopConsoleResize() {
  if (!isDragging.value) return;
  isDragging.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
}

// === Обработчики для перетаскивания вертикальных разделителей ===
function startDividerDrag(
  divider: 'examples-editor' | 'editor-canvas',
  e: MouseEvent
) {
  draggingDivider.value = divider;
  dragStartX = e.clientX;
  dragStartExamplesWidth = examplesWidth.value;
  dragStartCanvasWidth = canvasWidth.value;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';

  // Отключаем transition во время перетаскивания
  document.documentElement.classList.add('resizing-panels');
}

function onDividerDrag(e: MouseEvent) {
  if (!draggingDivider.value || !mainRef.value) return;

  // Вместо обновления реальных размеров — просто двигаем "призрачную линию"
  ghostDividerX.value = e.clientX;
}

function stopDividerDrag() {
  if (!draggingDivider.value || !mainRef.value) return;

  // Теперь применяем финальные размеры ОДИН раз
  const deltaX = (ghostDividerX.value ?? dragStartX) - dragStartX;
  const totalWidth = mainRef.value.clientWidth;
  const dividerCount = showExamples.value || showPalette.value ? 2 : 1;
  const availableWidth = totalWidth - dividerCount * 8;

  if (draggingDivider.value === 'examples-editor') {
    const newExamplesWidth = dragStartExamplesWidth + deltaX;
    const editorWidth = availableWidth - newExamplesWidth - canvasWidth.value;
    if (
      newExamplesWidth >= MIN_EXAMPLES_WIDTH &&
      editorWidth >= MIN_EDITOR_WIDTH
    ) {
      examplesWidth.value = newExamplesWidth;
    }
  } else if (draggingDivider.value === 'editor-canvas') {
    const newCanvasWidth = dragStartCanvasWidth - deltaX;
    const exW =
      showExamples.value || showPalette.value ? examplesWidth.value : 0;
    const editorWidth = availableWidth - exW - newCanvasWidth;
    if (newCanvasWidth >= MIN_CANVAS_WIDTH && editorWidth >= MIN_EDITOR_WIDTH) {
      canvasWidth.value = newCanvasWidth;
    }
  }

  // Очищаем состояние
  ghostDividerX.value = null;
  draggingDivider.value = null;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  document.documentElement.classList.remove('resizing-panels');
}

function toggleConsole() {
  isConsoleVisible.value = !isConsoleVisible.value;
}

// Вычисляемая ширина редактора
const editorFlexStyle = computed(() => {
  // Редактор занимает всё оставшееся пространство
  return { flex: '1', minWidth: MIN_EDITOR_WIDTH + 'px' };
});

// Watch для обработки изменения sketch_id в route и localStorage
let isFirstWatchRun = true;
watch(
  () => ({
    routeId: route.params.id,
    querySketch: route.query.sketch,
    queryT: route.query.t,
    storageSketchId: localStorage.getItem('p5editor_current_sketch_id'),
  }),
  async (newVal, oldVal) => {
    const sketchId =
      (newVal.routeId as string) ||
      (newVal.querySketch as string) ||
      newVal.storageSketchId;
    const oldId =
      (oldVal?.routeId as string) ||
      (oldVal?.querySketch as string) ||
      oldVal?.storageSketchId;

    // Пропускаем первый запуск если нет sketch_id
    if (isFirstWatchRun && !sketchId) {
      isFirstWatchRun = false;
      // Загружаем код из localStorage только если есть
      const savedCode = localStorage.getItem('p5editor_current_code');
      const savedName = localStorage.getItem('p5editor_current_name');
      if (savedCode) {
        console.log('[EditorPage] Загрузка кода из localStorage при старте');
        code.value = savedCode;
        originalCode.value = savedCode;
        lastSavedCode = savedCode;
      }
      if (savedName) {
        sketchName.value = savedName;
      }
      return;
    }

    isFirstWatchRun = false;

    // Загружаем только если ID изменился или появился новый
    if (sketchId && sketchId !== oldId) {
      console.log(
        '[EditorPage] sketch_id изменился, загружаю скетч:',
        sketchId
      );
      await loadSketchFromDatabase(sketchId);
    }
  },
  { immediate: true } // Вызвать сразу при создании watch
);

// Watch для автосохранения названия скетча в localStorage
watch(sketchName, (newVal) => {
  if (newVal) {
    localStorage.setItem('p5editor_current_name', newVal);
  }
});

onMounted(async () => {
  if (shouldAutoOpenAIChat()) {
    autoOpenAIChatTimer = setTimeout(() => {
      showAIChat.value = true;
      markAIChatAutoOpened();
    }, 5000);
  }

  window.addEventListener('mousemove', onGlobalMouseMove);
  window.addEventListener('mouseup', onGlobalMouseUp);
  window.addEventListener('keydown', handleKeyDown);

  // Обработка изменения localStorage из других вкладок/окон
  window.addEventListener('storage', handleStorageChange);

  // Загрузка темы из localStorage
  const savedTheme = localStorage.getItem('p5editor-theme') as Theme | null;
  if (savedTheme === 'dark' || savedTheme === 'light') {
    theme.value = savedTheme;
  }

  console.log('[EditorPage] onMounted');

  // Проверка подключения к Supabase
  checkSupabaseConnection();

  // Проверка параметра auth:required для открытия модального окна входа
  if (route.query.auth === 'required') {
    showAuthModal.value = true;
    // Очищаем query параметр
    router.replace({ query: {} });
  }

  // Показывать ссылку «Класс» только тем, у кого уже есть комнаты.
  // Не блокируем рендер редактора ожиданием запроса.
  if (isAuthenticated.value && user.value) {
    loadHasRoom();
  }
});

// Обновляем флаг при входе/выходе пользователя
watch(user, async (u) => {
  if (u) await loadHasRoom();
  else hasRoom.value = false;
});

// Обработка изменений localStorage
function handleStorageChange(event: StorageEvent) {
  if (event.key === 'p5editor_current_sketch_id' && event.newValue) {
    console.log(
      '[EditorPage] storage change: p5editor_current_sketch_id =',
      event.newValue
    );
    loadSketchFromDatabase(event.newValue);
  }
}

// Загрузка скетча из базы данных
async function loadSketchFromDatabase(sketchId: string) {
  try {
    addMessage(`📂 Загрузка скетча из облака...`);
    const result = await getSketchById(sketchId);

    if (result.success && result.data) {
      const sketch = result.data as any;
      code.value = sketch.code;
      sketchName.value = sketch.title || 'Скетч из БД';
      currentSketchId.value = sketchId;

      // Сохраняем в localStorage
      localStorage.setItem('p5editor_current_code', sketch.code);
      localStorage.setItem(
        'p5editor_current_name',
        sketch.title || 'Скетч из БД'
      );
      localStorage.setItem('p5editor_current_sketch_id', sketchId);

      // Обновляем lastSavedCode для корректной работы автосохранения
      lastSavedCode = sketch.code;

      addMessage(`✅ Скетч "${sketch.title}" загружен`);
    } else {
      addMessage(`❌ Ошибка загрузки скетча: ${result.error}`);
      // Очищаем ID и загружаем из localStorage
      currentSketchId.value = null;
      localStorage.removeItem('p5editor_current_sketch_id');
    }
  } catch (error) {
    console.error('Load sketch error:', error);
    addMessage('❌ Ошибка загрузки скетча из базы данных');
    currentSketchId.value = null;
    localStorage.removeItem('p5editor_current_sketch_id');
  }
}

onUnmounted(() => {
  if (autoOpenAIChatTimer) {
    clearTimeout(autoOpenAIChatTimer);
    autoOpenAIChatTimer = null;
  }

  window.removeEventListener('mousemove', onGlobalMouseMove);
  window.removeEventListener('mouseup', onGlobalMouseUp);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('storage', handleStorageChange);
});

// Единый обработчик mousemove
function onGlobalMouseMove(e: MouseEvent) {
  onConsoleResize(e);
  onDividerDrag(e);
}

// Единый обработчик mouseup
function onGlobalMouseUp() {
  stopConsoleResize();
  stopDividerDrag();
}

function addMessage(msg: string) {
  messages.value.push(msg);
  setTimeout(() => {
    const consoleEl = document.querySelector('.console-content');
    if (consoleEl) {
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
  }, 100);
}

function clearConsole() {
  messages.value = [];
}

function startSketch() {
  try {
    canvasRef.value?.start(code.value);
  } catch (e: any) {
    addMessage(`❌ Ошибка запуска: ${e.message}`);
  }
}

function stopSketch() {
  canvasRef.value?.stop();
}

async function saveSketch() {
  console.log('[EditorPage] saveSketch вызвана');
  console.log('[EditorPage] currentSketchId:', currentSketchId.value);
  console.log('[EditorPage] isAuthenticated:', isAuthenticated.value);
  console.log('[EditorPage] user:', user.value);

  const cleanName =
    sketchName.value
      .replace(/[^a-zа-яё0-9\s_-]/gi, '')
      .replace(/\s+/g, '_')
      .toLowerCase() || 'sketch';
  const fileName = `${cleanName}.js`;
  const blob = new Blob([code.value], {
    type: 'text/javascript;charset=utf-8',
  });

  console.log('[EditorPage] Сохраняю файл:', fileName);
  saveAs(blob, fileName);
  console.log('[EditorPage] Файл сохранён');

  // Если пользователь авторизован — сохраняем/создаём скетч в облаке
  // (saveToDatabase сам решает: создать новый или обновить существующий)
  if (isAuthenticated.value && user.value) {
    console.log('[EditorPage] Вызываю saveToDatabase');
    try {
      await saveToDatabase();
      console.log('[EditorPage] saveToDatabase завершена успешно');
    } catch (e) {
      console.error('[EditorPage] Ошибка в saveToDatabase:', e);
    }
  } else {
    addMessage(
      `💾 Скетч сохранён как "${fileName}". Войдите, чтобы сохранить в облако`
    );
  }
}

// Сохранение в базу данных Supabase
async function saveToDatabase() {
  if (!user.value) {
    addMessage('❌ Войдите, чтобы сохранить в облако');
    console.error('[EditorPage] saveToDatabase: нет user');
    return;
  }

  isSaving.value = true;
  try {
    // Уникальный цифровой ID (для URL и присоединения к комнатам)
    const numericId = (await generateNumericSketchId()).data ?? null;

    // Новый скетч (ещё не в БД) — создаём со статусом 'saved'
    if (!currentSketchId.value) {
      console.log('[EditorPage] saveToDatabase: создаю новый скетч со статусом saved');
      const createResult = await createSketch({
        user_id: user.value.id,
        title: sketchName.value || 'Без названия',
        description: '',
        code: code.value,
        status: 'saved',
        numeric_sketch_id: numericId ?? undefined
      });

      if (!createResult.success || !createResult.data) {
        addMessage(`❌ Ошибка сохранения: ${createResult.error}`);
        console.error('[EditorPage] saveToDatabase: createSketch не удался');
        return;
      }

      const newSketchId = (createResult.data as any).id as string;
      currentSketchId.value = newSketchId;
      localStorage.setItem('p5editor_current_sketch_id', newSketchId);

      const freshResult = await getSketchById(newSketchId);
      if (freshResult.success && freshResult.data) {
        const freshSketch = freshResult.data as any;
        code.value = freshSketch.code;
        lastSavedCode = freshSketch.code;
      }

      addMessage('💾 Скетч сохранён в облако');
      localStorage.setItem('p5editor_current_code', code.value);
      localStorage.setItem('p5editor_current_name', sketchName.value);
      return;
    }

    // Существующий скетч — обновляем (статус не меняем, numeric ID только дописываем)
    console.log('[EditorPage] saveToDatabase: обновляю скетч', currentSketchId.value);
    const pre = await getSketchById(currentSketchId.value);
    const existingNumId = (pre.data as any)?.numeric_sketch_id ?? null;
    const finalNumId = existingNumId ?? numericId;

    const result = await updateSketch(currentSketchId.value, {
      code: code.value,
      ...(finalNumId != null ? { numeric_sketch_id: finalNumId } : {}),
    });

    console.log('[EditorPage] saveToDatabase: результат updateSketch:', result);

    if (result.success) {
      const freshResult = await getSketchById(currentSketchId.value);
      if (freshResult.success && freshResult.data) {
        const freshSketch = freshResult.data as any;
        code.value = freshSketch.code;
        lastSavedCode = freshSketch.code;
      }

      addMessage('💾 Скетч сохранён в облако');
      localStorage.setItem('p5editor_current_code', code.value);
      localStorage.setItem('p5editor_current_name', sketchName.value);
      localStorage.setItem('p5editor_current_sketch_id', currentSketchId.value);
    } else {
      addMessage(`❌ Ошибка сохранения: ${result.error}`);
    }
  } catch (error) {
    console.error('[EditorPage] saveToDatabase: ошибка:', error);
    addMessage('❌ Ошибка сохранения в базу данных');
  } finally {
    isSaving.value = false;
  }
}

function loadSketch() {
  fileInput.value?.click();
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      saveToHistory();
      code.value = e.target?.result as string;
      const fileName = file.name.replace('.js', '').replace(/_/g, ' ');
      sketchName.value = fileName;
      // Сбрасываем ID скетча, так как это теперь новый локальный файл
      currentSketchId.value = null;
      localStorage.removeItem('p5editor_current_sketch_id');
      addMessage(`📂 Скетч загружен: ${file.name}`);
    };
    reader.readAsText(file);
  }
}

function increaseFontSize() {
  fontSize.value = Math.min(40, fontSize.value + 1);
}

function decreaseFontSize() {
  fontSize.value = Math.max(8, fontSize.value - 1);
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  localStorage.setItem('p5editor-theme', theme.value);
}

function resetToExample() {
  if (confirm('Восстановить стартовый шаблон?')) {
    saveToHistory();
    // Сбрасываем ID скетча, чтобы не сохранять в облако
    currentSketchId.value = null;
    localStorage.removeItem('p5editor_current_sketch_id');
    // Восстанавливаем стартовый шаблон
    code.value = `function setup() {
  // установка размеров холста
  createCanvas(800, 600);
  // настройка модели цвета
  colorMode(HSB, 256, 100, 100);
}

function draw() {
  // background(220);
  ellipse(mouseX, mouseY, 50, 50);
  // смена цвета при нажатии
  if (mouseIsPressed)
    fill(frameCount % 256, 100, 100);
  // напиши свой код ниже

}`;
    originalCode.value = code.value;
    // Устанавливаем название "Шаблон"
    sketchName.value = 'Шаблон';
    localStorage.setItem('p5editor_current_name', 'Шаблон');

    // Очищаем адресную строку от ID скетча
    // Это нужно чтобы случайно не перезаписать сохранённый скетч
    if (route.params.id || route.query.sketch) {
      router.replace({ path: '/', query: {} });
      console.log('[EditorPage] Адресная строка очищена от ID скетча');
    }

    addMessage('🔄 Скетч сброшен к стартовому шаблону');
  }
}

function copyToClipboard() {
  navigator.clipboard
    .writeText(code.value)
    .then(() => {
      addMessage('📋 Код скопирован в буфер обмена');
    })
    .catch(() => {
      addMessage('❌ Не удалось скопировать код');
    });
}

// Сохранение холста
function saveCanvas() {
  try {
    const iframe = canvasRef.value?.$el?.querySelector('iframe');
    if (!iframe || !iframe.contentWindow) {
      addMessage('❌ Не удалось найти холст');
      return;
    }

    const canvas = iframe.contentWindow.document.querySelector('canvas');
    if (!canvas) {
      addMessage('❌ Холст не найден');
      return;
    }

    // Получаем данные из canvas
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${sketchName.value || 'sketch'}.png`;
    link.href = dataURL;
    link.click();

    // Сохраняем изображение в localStorage для страницы "Поделиться"
    try {
      localStorage.setItem('p5editor_canvas_snapshot', dataURL);
      addMessage('📸 Холст сохранён и скопирован в память');
    } catch (e) {
      // Если localStorage переполнен (DataURL может быть большим)
      addMessage(
        '📸 Холст сохранён. Изображение слишком большое для автосохранения'
      );
    }
  } catch (e) {
    console.error('Ошибка сохранения холста:', e);
    addMessage('❌ Ошибка сохранения: ' + (e as Error).message);
  }
}

function formatCode() {
  try {
    saveToHistory();
    const formatted = beautify(code.value, {
      indent_size: 2,
      indent_char: ' ',
      max_preserve_newlines: 2,
      preserve_newlines: true,
      keep_array_indentation: false,
      break_chained_methods: false,
      brace_style: 'collapse' as const,
      space_before_conditional: true,
      unescape_strings: false,
      jslint_happy: false,
      end_with_newline: true,
      wrap_line_length: 80,
      comma_first: false,
      e4x: false,
      indent_empty_lines: false,
    });
    code.value = formatted;
    addMessage('✨ Код отформатирован');
  } catch (e) {
    console.error('Ошибка форматирования:', e);
    addMessage('❌ Ошибка форматирования');
  }
}

function saveToHistory() {
  if (code.value !== history.value[historyIndex.value]) {
    history.value = history.value.slice(0, historyIndex.value + 1);
    history.value.push(code.value);
    historyIndex.value = history.value.length - 1;
  }
}

function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    const prevCode = history.value[historyIndex.value];
    if (prevCode) {
      code.value = prevCode;
    }
    addMessage('↩️ Отмена действия');
  } else {
    addMessage('⚠️ Нечего отменять');
  }
}

function redo() {
  if (historyIndex.value < history.value.length - 1) {
    historyIndex.value++;
    const nextCode = history.value[historyIndex.value];
    if (nextCode) {
      code.value = nextCode;
    }
    addMessage('↪️ Возврат действия');
  } else {
    addMessage('⚠️ Нечего возвращать');
  }
}

function showShortcuts() {
  addMessage(
    '⌨️ Горячие клавиши: Ctrl+F - поиск и замена, Ctrl+S - сохранить, Ctrl+Z - отмена, Ctrl+Y - повтор, Ctrl+` - консоль'
  );
}

function toggleExamples() {
  showExamples.value = !showExamples.value;
  if (showExamples.value) showPalette.value = false;
}

function togglePalette() {
  showPalette.value = !showPalette.value;
  if (showPalette.value) showExamples.value = false;
}

function loadExample(exampleCode: string) {
  saveToHistory();
  code.value = exampleCode;
  startSketch();
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    startSketch();
  }
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    saveSketch();
  }
  if (
    e.ctrlKey &&
    e.key === 'z' &&
    !(e.target as HTMLElement)?.matches?.('textarea, input, .cm-content')
  ) {
    e.preventDefault();
    undo();
  }
  if (
    e.ctrlKey &&
    e.key === 'y' &&
    !(e.target as HTMLElement)?.matches?.('textarea, input, .cm-content')
  ) {
    e.preventDefault();
    redo();
  }
  if (e.ctrlKey && e.key === '`') {
    e.preventDefault();
    toggleConsole();
  }
}

function toggleMenuExpand() {
  isMenuExpanded.value = !isMenuExpanded.value;
}

function setActiveMenuItem(item: string | null) {
  activeMenuItem.value = item;
}

function getTooltipText(item: string): string {
  const tooltips: Record<string, string> = {
    save: 'Сохранить скетч (Ctrl+S)',
    load: 'Загрузить скетч',
    ai: 'p5.js помощник (справочник)',
    palette: 'Палитра цветов',
    'font-up': 'Увеличить шрифт',
    'font-down': 'Уменьшить шрифт',
    undo: 'Отмена (Ctrl+Z)',
    redo: 'Повтор (Ctrl+Y)',
    copy: 'Копировать код',
    reset: 'Удалить код и начать с шаблона',
    'console-clear': 'Очистить консоль',
    'console-toggle': 'Показать/скрыть консоль (Ctrl+`)',
    theme: 'Сменить тему',
    shortcuts: 'Горячие клавиши',
    csg: 'p5.csg библиотека для 3D CSG операций',
  };
  return tooltips[item] || item;
}

function debouncedSaveToHistory() {
  if (saveHistoryTimer) clearTimeout(saveHistoryTimer);
  saveHistoryTimer = setTimeout(() => saveToHistory(), 500);
  saveCodeToStorage();
}

// Автосохранение кода в localStorage (только если код изменился)
function saveCodeToStorage() {
  if (saveCodeTimer) clearTimeout(saveCodeTimer);
  saveCodeTimer = setTimeout(() => {
    if (code.value !== lastSavedCode) {
      localStorage.setItem('p5editor_current_code', code.value);
      localStorage.setItem('p5editor_current_name', sketchName.value);
      lastSavedCode = code.value;
    }
  }, 2000);
}

// Навигация к странице «Исследуй»
function navigateToExplore() {
  router.push('/explore');
}

// Навигация к странице «Поделиться»
async function navigateToShare() {
  console.log('[EditorPage] navigateToShare: начинаем переход на SharePage');
  console.log('[EditorPage] currentSketchId:', currentSketchId.value);
  console.log('[EditorPage] isAuthenticated:', isAuthenticated.value);

  // Если скетч загружен из БД и пользователь авторизован — сохраняем в БД
  if (currentSketchId.value && isAuthenticated.value && user.value) {
    console.log('[EditorPage] Сохраняем код в БД перед переходом...');
    addMessage('💾 Сохранение перед публикацией...');
    try {
      const result = await updateSketch(currentSketchId.value, {
        code: code.value,
      });
      if (result.success) {
        lastSavedCode = code.value;
        console.log('[EditorPage] Код сохранён в БД перед публикацией');
        addMessage('✅ Скетч сохранён в облако');
      } else {
        console.warn('[EditorPage] Не удалось сохранить в БД:', result.error);
        addMessage(
          '⚠️ Не удалось сохранить в облако, но переходим на публикацию'
        );
      }
    } catch (e) {
      console.error('[EditorPage] Ошибка сохранения в БД:', e);
      addMessage('⚠️ Ошибка сохранения, но переходим на публикацию');
    }
  }

  // Сохраняем код и название в localStorage (синхронно, без задержки)
  localStorage.setItem('p5editor_current_code', code.value);
  localStorage.setItem('p5editor_current_name', sketchName.value);
  if (code.value !== lastSavedCode) {
    lastSavedCode = code.value;
  }
  console.log(
    '[EditorPage] Код сохранён в localStorage перед переходом на SharePage'
  );
  router.push('/share');
}

// Навигация к странице «Личный кабинет»
function navigateToDashboard() {
  router.push('/dashboard');
}

// Функции переключения версии p5.js
function setP5Source(source: P5Source) {
  p5Source.value = source;
  localStorage.setItem('p5editor-p5-source', source);
  addMessage(
    `📦 Источник p5.js: ${source === 'cdn' ? 'CDN' : 'локальная папка'}`
  );
}

function updateP5CdnVersion() {
  localStorage.setItem('p5editor-p5-cdn-version', p5CdnVersion.value);
  addMessage(`📦 Версия CDN обновлена: ${p5CdnVersion.value}`);
}

function toggleP5Csg() {
  p5CsgEnabled.value = !p5CsgEnabled.value;
  localStorage.setItem('p5editor-p5-csg-enabled', String(p5CsgEnabled.value));
  addMessage(`🔧 p5.csg: ${p5CsgEnabled.value ? 'включён' : 'выключен'}`);
}

// Вычисляемое свойство для отображения текущей версии
const currentP5Version = computed(() => {
  if (p5Source.value === 'cdn') {
    return `CDN ${p5CdnVersion.value}`;
  }
  return `Local ${p5LocalVersion}`;
});
</script>

<template>
  <div class="app" :class="`theme-${theme}`">
    <!-- Декоративные элементы фона -->
    <div class="bg-decoration">
      <div class="bg-circle circle-1"></div>
      <div class="bg-circle circle-2"></div>
      <div class="bg-circle circle-3"></div>
      <div class="bg-grid"></div>
    </div>

    <!-- Верхняя панель -->
    <header class="top-bar" :class="`theme-${theme}`">
      <div class="top-bar-left">
        <button
          @click="startSketch"
          class="top-btn"
          title="Запустить скетч (Ctrl+Enter)"
        >
          <span class="btn-icon">▶</span>
          <span class="btn-text">Старт</span>
        </button>
        <button @click="stopSketch" class="top-btn" title="Остановить скетч">
          <span class="btn-icon">■</span>
          <span class="btn-text">Стоп</span>
        </button>
        <button @click="formatCode" class="top-btn format-btn" title="Форматировать код">
          <span class="btn-icon">✨</span>
          <span class="btn-text">Форматировать</span>
        </button>

        <div class="sketch-name-wrapper">
          <input
            type="text"
            class="sketch-name-input"
            placeholder="Название скетча"
            v-model="sketchName"
          />
        </div>

        <button
          @click="navigateToExplore"
          class="top-btn explore-btn"
          title="Галерея скетчей сообщества"
        >
          <span class="btn-icon">🌍</span>
          <span class="btn-text">Исследуй</span>
        </button>

        <button
          @click="navigateToShare"
          class="top-btn share-btn"
          title="Поделиться скетчем"
        >
          <span class="btn-icon">📤</span>
          <span class="btn-text">Поделиться</span>
        </button>

        <button
          @click="router.push('/class')"
          class="top-btn class-btn"
          title="Класс"
        >
          <span class="btn-icon">🏫</span>
          <span class="btn-text">Класс</span>
        </button>
      </div>

      <div class="top-bar-right">
        <button
          @click="showReportModal = true"
          class="top-btn report-btn"
          title="Сообщить об ошибке"
        >
          <span class="btn-icon">⚠️</span>
          <span class="btn-text">Сообщить об ошибке</span>
        </button>

        <template v-if="isAuthenticated">
          <UserProfile :theme="theme" />
        </template>
        <template v-else>
          <button
            @click="showAuthModal = true"
            class="top-btn auth-btn"
            title="Войти"
          >
            <span class="btn-icon">🔑</span>
            <span class="btn-text">Войти</span>
          </button>
        </template>
      </div>
    </header>

    <!-- Основной контент -->
    <div class="main-content">
      <!-- Боковое меню -->
      <div
        class="side-menu"
        :class="{ expanded: isMenuExpanded }"
        @mouseenter="toggleMenuExpand"
        @mouseleave="toggleMenuExpand"
      >
        <div class="menu-logo">
          <img src="/images/logo.png" alt="p5.js" class="logo-image" />
        </div>

        <button
          @click="resetToExample"
          class="menu-item"
          title="Удалить код и начать с шаблона"
          @mouseenter="setActiveMenuItem('reset')"
          @mouseleave="setActiveMenuItem(null)"
        >
          <span class="menu-icon">➕</span>
          <span class="menu-text" v-show="isMenuExpanded">Новый скетч</span>
        </button>

        <button
          @click="saveSketch"
          class="menu-item"
          title="Сохранить скетч (Ctrl+S)"
          @mouseenter="setActiveMenuItem('save')"
          @mouseleave="setActiveMenuItem(null)"
          :disabled="isSaving"
        >
          <span class="menu-icon">{{ isSaving ? '⏳' : '💾' }}</span>
          <span class="menu-text" v-show="isMenuExpanded">{{
            isSaving ? 'Сохранение...' : 'Сохранить'
          }}</span>
        </button>

        <button
          @click="loadSketch"
          class="menu-item"
          title="Загрузить скетч"
          @mouseenter="setActiveMenuItem('load')"
          @mouseleave="setActiveMenuItem(null)"
        >
          <span class="menu-icon">📂</span>
          <span class="menu-text" v-show="isMenuExpanded">Загрузить</span>
        </button>

        <button
          @click="showAIChat = !showAIChat"
          class="menu-item"
          :class="{ active: showAIChat }"
          title="p5.js помощник (справочник)"
          @mouseenter="setActiveMenuItem('ai')"
          @mouseleave="setActiveMenuItem(null)"
        >
          <span class="menu-icon">📖</span>
          <span class="menu-text" v-show="isMenuExpanded">Справочник</span>
        </button>

        <button
          @click="toggleExamples"
          class="menu-item"
          :class="{ active: showExamples }"
          title="Примеры"
          @mouseenter="setActiveMenuItem('examples')"
          @mouseleave="setActiveMenuItem(null)"
        >
          <span class="menu-icon">📚</span>
          <span class="menu-text" v-show="isMenuExpanded">Примеры</span>
        </button>

        <button
          @click="togglePalette"
          class="menu-item"
          :class="{ active: showPalette }"
          title="Палитра цветов"
          @mouseenter="setActiveMenuItem('palette')"
          @mouseleave="setActiveMenuItem(null)"
        >
          <span class="menu-icon">🎨</span>
          <span class="menu-text" v-show="isMenuExpanded">Палитра</span>
        </button>

        <button
          @click="increaseFontSize"
          class="menu-item"
          title="Увеличить шрифт"
          @mouseenter="setActiveMenuItem('font-up')"
          @mouseleave="setActiveMenuItem(null)"
        >
          <span class="menu-icon">+</span>
          <span class="menu-text" v-show="isMenuExpanded">Увеличить</span>
        </button>

        <button
          @click="decreaseFontSize"
          class="menu-item"
          title="Уменьшить шрифт"
          @mouseenter="setActiveMenuItem('font-down')"
          @mouseleave="setActiveMenuItem(null)"
        >
          <span class="menu-icon">−</span>
          <span class="menu-text" v-show="isMenuExpanded">Уменьшить</span>
        </button>

        <button
          @click="undo"
          class="menu-item"
          title="Отмена (Ctrl+Z)"
          @mouseenter="setActiveMenuItem('undo')"
          @mouseleave="setActiveMenuItem(null)"
          style="display: none"
        >
          <span class="menu-icon">↩️</span>
          <span class="menu-text" v-show="isMenuExpanded">Отмена</span>
        </button>

        <button
          @click="redo"
          class="menu-item"
          title="Повтор (Ctrl+Y)"
          @mouseenter="setActiveMenuItem('redo')"
          @mouseleave="setActiveMenuItem(null)"
          style="display: none"
        >
          <span class="menu-icon">↪️</span>
          <span class="menu-text" v-show="isMenuExpanded">Повтор</span>
        </button>

        <button
          @click="copyToClipboard"
          class="menu-item"
          title="Копировать код"
          @mouseenter="setActiveMenuItem('copy')"
          @mouseleave="setActiveMenuItem(null)"
          style="display: none"
        >
          <span class="menu-icon">📋</span>
          <span class="menu-text" v-show="isMenuExpanded">Копировать</span>
        </button>

        <button
          @click="toggleTheme"
          class="menu-item"
          :title="`Тема: ${theme === 'dark' ? 'тёмная' : 'светлая'}`"
          @mouseenter="setActiveMenuItem('theme')"
          @mouseleave="setActiveMenuItem(null)"
        >
          <span class="menu-icon">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
          <span class="menu-text" v-show="isMenuExpanded">{{
            theme === 'dark' ? 'Светлая' : 'Тёмная'
          }}</span>
        </button>

        <button
          @click="showShortcuts"
          class="menu-item"
          title="Горячие клавиши"
          @mouseenter="setActiveMenuItem('shortcuts')"
          @mouseleave="setActiveMenuItem(null)"
        >
          <span class="menu-icon">⌨️</span>
          <span class="menu-text" v-show="isMenuExpanded">Клавиши</span>
        </button>

        <!-- Переключатель версии p5.js -->
        <div class="menu-divider" v-show="isMenuExpanded"></div>

        <div class="p5-version-section" v-show="isMenuExpanded">
          <div class="version-label">Версия p5.js</div>
          <div class="version-source-toggle">
            <button
              class="version-btn"
              :class="{ active: p5Source === 'local' }"
              @click="setP5Source('local')"
            >
              Папка
            </button>
            <button
              class="version-btn"
              :class="{ active: p5Source === 'cdn' }"
              @click="setP5Source('cdn')"
            >
              CDN
            </button>
          </div>
          <div v-if="p5Source === 'cdn'" class="version-input-wrapper">
            <input
              type="text"
              class="version-input"
              v-model="p5CdnVersion"
              placeholder="например: 1.11.13"
              @change="updateP5CdnVersion"
            />
          </div>
          <div v-else class="version-display">
            {{ p5LocalVersion }}
          </div>
        </div>

        <!-- Переключатель p5.csg -->
        <div class="p5-version-section" v-show="isMenuExpanded">
          <div class="version-label">Библиотека CSG</div>
          <button
            class="version-btn"
            :class="{ active: p5CsgEnabled }"
            @click="toggleP5Csg"
            @mouseenter="setActiveMenuItem('csg')"
            @mouseleave="setActiveMenuItem(null)"
          >
            {{ p5CsgEnabled ? 'Включено' : 'Выключено' }}
          </button>
        </div>

        <div class="menu-tooltip" v-if="!isMenuExpanded && activeMenuItem">
          {{ getTooltipText(activeMenuItem) }}
        </div>
      </div>

      <!-- Рабочая область -->
      <div class="main" ref="mainRef">
        <input
          type="file"
          ref="fileInput"
          style="display: none"
          @change="handleFileUpload"
          accept=".js"
        />

        <!-- Левая панель: примеры / палитра -->
        <div
          v-if="showExamples || showPalette"
          class="examples-panel-wrapper"
          :style="{ width: examplesWidth + 'px' }"
        >
          <ExamplesPanel
            v-if="showExamples"
            :theme="theme"
            @load-example="loadExample"
            @close="toggleExamples"
          />
          <PalettePanel v-else :theme="theme" @close="togglePalette" />
        </div>

        <!-- Разделитель: примеры ↔ редактор -->
        <div
          v-if="showExamples || showPalette"
          class="resize-handle-vertical"
          :class="{ resizing: draggingDivider === 'examples-editor' }"
          @mousedown.prevent="startDividerDrag('examples-editor', $event)"
        >
          <div class="resize-handle-grip"></div>
        </div>

        <!-- Редактор + консоль -->
        <div class="editor-panel" :style="editorFlexStyle">
          <div class="editor-container" :class="`theme-${theme}`">
            <div class="editor-header">
              <div class="window-controls">
                <span class="window-control red"></span>
                <span class="window-control yellow"></span>
                <span class="window-control green"></span>
              </div>
              <span class="editor-title">sketch.js</span>
            </div>
            <div class="editor-content">
              <CodeEditor
                v-model="code"
                :font-size="fontSize"
                :font-family="fontFamily"
                :theme="theme"
                @update:model-value="debouncedSaveToHistory"
              />
            </div>
          </div>

          <!-- Консоль под редактором -->
          <div
            class="console-wrapper"
            :style="{ height: isConsoleVisible ? consoleHeight + 'px' : 'auto' }"
          >
            <div
              class="console-resize-handle"
              v-show="isConsoleVisible"
              @mousedown.prevent="startConsoleResize"
              :class="{ dragging: isDragging }"
            >
              <div class="handle-line"></div>
              <div class="handle-line"></div>
              <div class="handle-line"></div>
            </div>
            <ConsoleOutput :messages="messages" :theme="theme" :collapsed="!isConsoleVisible" @toggle="toggleConsole" @clear="clearConsole" />
          </div>
        </div>

        <!-- Разделитель: редактор ↔ холст -->
        <div
          class="resize-handle-vertical"
          :class="{ resizing: draggingDivider === 'editor-canvas' }"
          @mousedown.prevent="startDividerDrag('editor-canvas', $event)"
        >
          <div class="resize-handle-grip"></div>
        </div>

        <!-- Панель холста -->
        <div class="canvas-panel" :style="{ width: canvasWidth + 'px' }">
          <div class="canvas-container">
            <div class="canvas-header">
              <span class="canvas-title"></span>
              <div class="mouse-coordinates">
                <span class="coords-label">координаты на холсте:</span>
                <span class="coord-item">X = {{ mouseX }}</span>
                <span class="coord-separator">/</span>
                <span class="coord-item">Y = {{ mouseY }}</span>
              </div>
              <button
                @click="saveCanvas"
                class="canvas-btn"
                title="Сохранить холст"
              >
                📸
              </button>
              <div
                class="canvas-indicator"
                :class="'status-' + supabaseStatus"
              ></div>
            </div>
            <div class="canvas-content">
              <P5Canvas
                ref="canvasRef"
                :add-message="addMessage"
                :theme="theme"
                :p5-source="p5Source"
                :p5-cdn-version="p5CdnVersion"
                :p5-csg-enabled="p5CsgEnabled"
                @mouse-move="updateMouseCoordinates"
              />
            </div>
          </div>
        </div>

        <!-- AI чат -->
        <AIChat
          v-model:is-visible="showAIChat"
          :theme="theme"
          :code="code"
          @send-message="handleAIMessage"
          @suggest-code="
            (newCode) => {
              code = newCode;
              addMessage('🤖 AI предложил код');
            }
          "
        />

        <!-- Призрачная линия при ресайзе -->
        <div
          v-if="ghostDividerX !== null"
          class="ghost-divider"
          :style="{ left: ghostDividerX + 'px' }"
        />

        <!-- Оверлей, чтобы iframe не перехватывал мышь -->
        <div v-if="draggingDivider" class="drag-overlay" />
      </div>
    </div>

    <!-- Модальное окно авторизации -->
    <AuthModal v-model="showAuthModal" />

    <ReportErrorModal
      v-if="showReportModal"
      :theme="theme"
      @close="showReportModal = false"
    />
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  transition:
    background-color 0.3s,
    color 0.3s;
  position: relative;
  overflow: hidden;
}

/* Класс для отключения transition при перетаскивании */
.resizing-panels .examples-panel-wrapper,
.resizing-panels .editor-panel,
.resizing-panels .canvas-panel {
  transition: none !important;
}

/* Декоративные элементы фона */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.03;
  filter: blur(60px);
}

.app.theme-dark .bg-circle {
  background: #646cff;
}

.app.theme-light .bg-circle {
  background: #ff6b6b;
}

.circle-1 {
  width: 400px;
  height: 400px;
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 300px;
  height: 300px;
  bottom: -50px;
  left: -50px;
}

.circle-3 {
  width: 200px;
  height: 200px;
  bottom: 200px;
  right: 200px;
}

.bg-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(100, 108, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100, 108, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
}

/* Тёмная тема */
.app.theme-dark {
  background-color: #0d1117;
  color: #ffffff;
  --bg-primary: #1e1e1e;
  --bg-secondary: #2a2a2a;
  --bg-tertiary: #333333;
  --text-primary: #ffffff;
  --text-secondary: #aaaaaa;
  --border-color: #333333;
  --accent-color: #42b883;
}

/* Светлая тема */
.app.theme-light {
  background-color: #f8f9fa;
  color: #2c3e50;
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --bg-tertiary: #e5e7eb;
  --text-primary: #2c3e50;
  --text-secondary: #64748b;
  --border-color: #e0e0e0;
  --accent-color: #646cff;
}

/* Верхняя панель */
.top-bar {
  height: 60px;
  background: rgba(15, 15, 15, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 100;
  position: relative;
  flex-shrink: 0;
}

.top-bar.theme-light {
  background: rgba(255, 255, 255, 0.8);
  border-bottom-color: #e0e0e0;
}

.top-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.top-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: inherit;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}
/* Базовая спокойная кнопка */
.top-btn {
  background: rgba(255, 255, 255, 0.08);
}

.top-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  transform: translateY(-1px);
}

.top-btn.active {
  background: rgba(255, 255, 255, 0.18);
  border-left: 2px solid rgba(255, 255, 255, 0.35);
}

.top-btn .btn-icon {
  font-size: 16px;
}

.top-btn .btn-text {
  font-size: 13px;
}

.theme-light .top-btn {
  background: rgba(0, 0, 0, 0.04);
  color: #333;
}

.theme-light .top-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

/* Поле для названия скетча */
.sketch-name-wrapper {
  margin: 0 10px;
}

.sketch-name-input {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.35);
  color: inherit;
  font-size: 14px;
  min-width: 200px;
  transition: all 0.2s;
}

.sketch-name-input:focus {
  outline: none;
  border-color: #646cff;
  background: rgba(0, 0, 0, 0.45);
}

.theme-light .sketch-name-input {
  background: rgba(255, 255, 255, 0.8);
  border-color: rgba(0, 0, 0, 0.2);
  color: #333;
}

.theme-light .sketch-name-input:focus {
  background: white;
  border-color: #646cff;
}

/* Индивидуальные спокойные цвета верхних кнопок (низкая насыщенность) */

/* Старт — мягкий зелёный */
.top-btn:nth-of-type(1) {
  background-color: rgba(46, 160, 67, 0.16);
}
.top-btn:nth-of-type(1):hover {
  background-color: rgba(46, 160, 67, 0.22);
}

/* Стоп — мягкий красный */
.top-btn:nth-of-type(2) {
  background-color: rgba(212, 76, 64, 0.16);
}
.top-btn:nth-of-type(2):hover {
  background-color: rgba(212, 76, 64, 0.22);
}

/* Форматировать — мягкий синий */
.format-btn {
  background-color: transparent;
}
.format-btn:hover {
  background-color: rgba(86, 156, 214, 0.24);
}

/* Учебник по примерам — мягкий фиолетовый */
.examples-btn {
  background-color: rgba(147, 112, 219, 0.2);
}
.examples-btn:hover,
.examples-btn.active {
  background-color: rgba(147, 112, 219, 0.28);
}

/* Исследуй — мягкий бирюзовый */
.explore-btn {
  background-color: transparent;
}
.explore-btn:hover {
  background-color: rgba(64, 179, 162, 0.28);
}

/* Личный кабинет — мягкий фиолетовый */
.dashboard-btn {
  background-color: rgba(139, 92, 246, 0.2);
}
.dashboard-btn:hover {
  background-color: rgba(139, 92, 246, 0.28);
}

/* Поделиться — мягкий оранжевый */
.share-btn {
  background-color: transparent;
}
.share-btn:hover {
  background-color: rgba(242, 153, 74, 0.3);
}

/* Класс — без фона до наведения */
.class-btn {
  background-color: transparent;
}
.class-btn:hover {
  background-color: rgba(255, 255, 255, 0.14);
}

/* Войти — спокойный контурный серо-синий */
.auth-btn {
  background-color: transparent;
  border: 1px solid rgba(148, 163, 184, 0.6);
}
.auth-btn:hover {
  background-color: rgba(148, 163, 184, 0.12);
}

.theme-light .auth-btn {
  border-color: rgba(148, 163, 184, 0.8);
}
.theme-light .auth-btn:hover {
  background-color: rgba(148, 163, 184, 0.14);
}

.theme-light .explore-btn,
.theme-light .share-btn,
.theme-light .class-btn,
.theme-light .report-btn,
.theme-light .format-btn {
  background-color: transparent;
}
.theme-light .explore-btn:hover,
.theme-light .share-btn:hover,
.theme-light .class-btn:hover,
.theme-light .report-btn:hover,
.theme-light .format-btn:hover {
  background-color: rgba(0, 0, 0, 0.08);
}

/* Сообщить об ошибке — приглушённый серо-синий, менее заметный */
.report-btn {
  background-color: transparent;
}
.report-btn:hover {
  background-color: rgba(148, 163, 184, 0.16);
}

.theme-light .report-btn {
  background-color: transparent;
}
.theme-light .report-btn:hover {
  background-color: rgba(100, 116, 139, 0.13);
}

/* Боковое меню */
.side-menu {
  width: 60px;
  height: 100%;
  background: rgba(20, 20, 20, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  gap: 2px;
  transition: width 0.3s ease;
  z-index: 90;
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  flex-shrink: 0;
}

.side-menu.expanded {
  width: 180px;
}

.app.theme-light .side-menu {
  background: rgba(255, 255, 255, 0.95);
  border-right-color: #e0e0e0;
}

.menu-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  width: 100%;
  margin-bottom: 8px;
}

.logo-image {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  width: 100%;
  position: relative;
  white-space: nowrap;
  font-size: 13px;
}

.menu-item:hover {
  background: rgba(100, 108, 255, 0.2);
}

.menu-item.active {
  background: rgba(100, 108, 255, 0.3);
  border-left: 2px solid #646cff;
}

.menu-icon {
  font-size: 18px;
  min-width: 26px;
  text-align: center;
  filter: grayscale(100%);
  opacity: 0.7;
  transition: filter 0.2s, opacity 0.2s;
}

.menu-item:hover .menu-icon,
.menu-item.active .menu-icon {
  filter: grayscale(0%);
  opacity: 1;
}

.menu-text {
  font-size: 12px;
  font-weight: 500;
}

/* Всплывающая подсказка */
.menu-tooltip {
  position: fixed;
  left: 70px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  z-index: 1000;
  pointer-events: none;
  animation: fadeIn 0.2s;
  border: 1px solid #646cff;
}

.app.theme-light .menu-tooltip {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  border: 1px solid #646cff;
}

/* Переключатель версии p5.js */
.menu-divider {
  width: 80%;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px auto;
}

.app.theme-light .menu-divider {
  background: rgba(0, 0, 0, 0.1);
}

.p5-version-section {
  padding: 8px;
  width: 100%;
  margin-top: -15px;
}

.version-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 6px;
  text-align: center;
}

.app.theme-light .version-label {
  color: rgba(0, 0, 0, 0.6);
}

.version-source-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 6px;
}

.version-btn {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.05);
  color: inherit;
  cursor: pointer;
  border-radius: 4px;
  font-size: 11px;
  transition: all 0.2s;
}

.version-btn:hover {
  background: rgba(100, 108, 255, 0.2);
}

.version-btn.active {
  background: rgba(100, 108, 255, 0.4);
  border-color: #646cff;
}

.app.theme-light .version-btn {
  border-color: rgba(0, 0, 0, 0.2);
  background: rgba(0, 0, 0, 0.05);
}

.app.theme-light .version-btn:hover {
  background: rgba(100, 108, 255, 0.1);
}

.app.theme-light .version-btn.active {
  background: rgba(100, 108, 255, 0.2);
  border-color: #646cff;
}

.version-input-wrapper {
  margin-top: 4px;
}

.version-input {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  color: inherit;
  border-radius: 4px;
  font-size: 11px;
  outline: none;
  box-sizing: border-box;
}

.version-input:focus {
  border-color: #646cff;
}

.app.theme-light .version-input {
  border-color: rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.8);
}

.version-display {
  font-size: 11px;
  padding: 4px 8px;
  background: rgba(100, 108, 255, 0.1);
  border-radius: 4px;
  text-align: center;
  color: #9089fc;
}

/* Основной контент */
.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* ============================================
   Панели с изменяемой шириной
   ============================================ */

/* Панель примеров */
.examples-panel-wrapper {
  height: 100%;
  overflow: hidden;
  flex-shrink: 0;
  min-width: 250px;
  display: flex;
  flex-direction: column;
}

/* Редактор занимает всё оставшееся пространство */
.editor-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Панель холста — фиксированная ширина, задаётся через style */
.canvas-panel {
  height: 100%;
  overflow: hidden;
  flex-shrink: 0;
  min-width: 410px;
}

/* ============================================
   Вертикальный разделитель (перетаскиваемый)
   ============================================ */
.resize-handle-vertical {
  width: 8px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 15;
  position: relative;
  flex-shrink: 0;
  transition: background-color 0.15s;
}

.resize-handle-vertical:hover,
.resize-handle-vertical.resizing {
  background: rgba(100, 108, 255, 0.15);
}

.resize-handle-grip {
  width: 3px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  transition: all 0.15s;
}

.resize-handle-vertical:hover .resize-handle-grip,
.resize-handle-vertical.resizing .resize-handle-grip {
  background: #646cff;
  height: 60px;
  width: 4px;
  box-shadow: 0 0 8px rgba(100, 108, 255, 0.4);
}

.app.theme-light .resize-handle-grip {
  background: rgba(0, 0, 0, 0.15);
}

.app.theme-light .resize-handle-vertical:hover .resize-handle-grip,
.app.theme-light .resize-handle-vertical.resizing .resize-handle-grip {
  background: #646cff;
}

/* Заголовки редактора и холста */
.editor-header,
.canvas-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
  min-height: 26px;
}

.app.theme-light .editor-header,
.app.theme-light .canvas-header {
  background: rgba(255, 255, 255, 0.5);
  border-bottom-color: rgba(0, 0, 0, 0.1);
}

.window-controls {
  display: flex;
  gap: 6px;
}

.window-control {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.window-control.red {
  background: #ff5f56;
}

.window-control.yellow {
  background: #ffbd2e;
}

.window-control.green {
  background: #27c93f;
}

.editor-title,
.canvas-title {
  font-size: 12px;
  opacity: 0.7;
}

/* Кнопка сохранения холста */
.canvas-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.app.theme-light .canvas-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.canvas-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4caf50; /* по умолчанию зеленый */
}

/* Динамические классы для статуса БД */
.canvas-indicator.status-checking {
  background: #ff9800;
  animation: pulse 1.5s infinite;
}

.canvas-indicator.status-connected {
  background: #4caf50;
  animation: none;
}

.canvas-indicator.status-error {
  background: #f44336;
  animation: pulse-error 1s infinite;
}

@keyframes pulse-error {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.editor-container,
.canvas-container {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-content,
.canvas-content {
  flex: 1;
  overflow: auto;
  min-height: 0;
}

/* Консоль и её разделитель */
.console-wrapper {
  position: relative;
  z-index: 10;
  transition: height 0.2s ease;
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.app.theme-light .console-wrapper {
  border-top-color: rgba(0, 0, 0, 0.1);
}

.console-resize-handle {
  position: absolute;
  top: -4px;
  left: 0;
  right: 0;
  height: 8px;
  cursor: row-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  z-index: 20;
  background: transparent;
  transition: background-color 0.2s;
}

.console-resize-handle:hover,
.console-resize-handle.dragging {
  background: rgba(100, 108, 255, 0.2);
}

.handle-line {
  width: 25px;
  height: 2px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  transition: background-color 0.2s;
}

.console-resize-handle:hover .handle-line,
.console-resize-handle.dragging .handle-line {
  background: #646cff;
}

/* Координаты мыши */
.mouse-coordinates {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-right: 10px;
  font-family: 'Consolas', monospace;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.35);
  padding: 4px 10px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.app.theme-light .mouse-coordinates {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(0, 0, 0, 0.1);
}

.coords-label {
  opacity: 0.7;
  margin-right: 4px;
}

.coord-item {
  color: #646cff;
  font-weight: 600;
}

.coord-separator {
  opacity: 0.5;
  font-size: 14px;
}

/* Анимации */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Скроллбары */
::-webkit-scrollbar {
  width: 9px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

::-webkit-scrollbar-thumb {
  background: rgba(100, 108, 255, 0.4);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 108, 255, 0.6);
}

.side-menu::-webkit-scrollbar {
  width: 2px;
}

.side-menu::-webkit-scrollbar-thumb {
  background: rgba(100, 108, 255, 0.3);
}

/* Призрачная линия при перетаскивании */
.ghost-divider {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #646cff;
  box-shadow: 0 0 8px rgba(100, 108, 255, 0.6);
  z-index: 10000;
  pointer-events: none;
  transition: none;
}

/* Оверлей, блокирующий iframe во время перетаскивания */
.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  cursor: col-resize;
  background: transparent;
}

/* Запрещаем перерисовку содержимого панелей при ресайзе */
.resizing-panels .editor-content,
.resizing-panels .canvas-content {
  pointer-events: none;
}
</style>
