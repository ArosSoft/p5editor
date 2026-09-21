<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// === Тема (синхронизация с редактором) ===
type Theme = 'dark' | 'light'
const currentTheme = ref<Theme>('dark')
function syncThemeFromStorage() {
  const savedTheme = localStorage.getItem('p5editor-theme') as Theme | null
  if (savedTheme === 'dark' || savedTheme === 'light') {
    currentTheme.value = savedTheme
  }
}
syncThemeFromStorage()
const themeClass = computed(() =>
  currentTheme.value === 'dark' ? 'theme-dark' : 'theme-light'
)

// === Роли ===
interface RoleInfo {
  code: string
  name: string
  blag: string
  color: string
  desc: string
  fit: string
  caut: string
}

const ROLES: Record<string, RoleInfo> = {
  PL: {
    code: 'PL',
    name: 'Генератор идей',
    blag: 'Изобретатель',
    color: '#8e5bd5',
    desc: 'Ты придумываешь необычные идеи и решения там, где другие зашли в тупик. Тебя ценят за фантазию, свежий взгляд и оригинальные подходы.',
    fit: 'Придумывать идеи для игры или сайта, сюжеты, необычные функции, нестандартные решения задач.',
    caut: 'Доводи идеи до конца и слушай команду — иногда полезно вернуться к реальности и деталям.'
  },
  RI: {
    code: 'RI',
    name: 'Исследователь ресурсов',
    blag: 'Поисковик и связной',
    color: '#3fae4a',
    desc: 'Ты общительный и любознательный: быстро находишь нужную информацию, интересных людей и полезные инструменты для команды.',
    fit: 'Искать информацию и обзоры, спрашивать мнение будущих пользователей, находить картинки, шрифты, сервисы и готовые решения.',
    caut: 'Интерес поначалу сильный, но может гаснуть — старайся доводить начатое до конца, а не переключаться на всё новое.'
  },
  CO: {
    code: 'CO',
    name: 'Координатор',
    blag: 'Капитан команды',
    color: '#4f5bd5',
    desc: 'Ты хорошо видишь, кто что умеет, и помогаешь всем договориться. Умеешь распределять задачи и вести команду к общей цели.',
    fit: 'Вести собрания команды, распределять задачи между участниками, помогать договариваться, задавать вопросы руководителю.',
    caut: 'Распределяя задачи между другими, показывай и личный вклад — делай часть работы сам.'
  },
  SH: {
    code: 'SH',
    name: 'Формирователь (Шейпер)',
    blag: 'Двигатель результата',
    color: '#e8842c',
    desc: 'Ты энергичный и нацелен на результат. Задаёшь темп, не боишься трудностей и умеешь «завести» команду вперёд.',
    fit: 'Держать проект в графике, готовить демо-версию к сроку, выступать с защитой проекта в конце.',
    caut: 'Твоё желание «разогнать» команду должно быть дружеским — следи, чтобы твоя требовательность никого не обижала.'
  },
  ME: {
    code: 'ME',
    name: 'Аналитик-стратег',
    blag: 'Разумный критик',
    color: '#d0576b',
    desc: 'Ты спокойно и внимательно взвешиваешь варианты, видишь плюсы и минусы, находишь ошибки в планах. Тебя трудно обмануть.',
    fit: 'Проверять идеи и планы, сравнивать варианты решений, находить слабые места и ошибки в рассуждениях.',
    caut: 'Не будь слишком строгим к идеям других — помогай улучшать, а не только критиковать.'
  },
  TW: {
    code: 'TW',
    name: 'Коллективист',
    blag: 'Душа команды',
    color: '#2f8fd6',
    desc: 'Ты умеешь слушать, помогать и сглаживать конфликты. В команде с тобой всем спокойно, дружно и уютно.',
    fit: 'Поддерживать дружную атмосферу, помогать договариваться, тестировать проект вместе с пользователями, давать добрые советы.',
    caut: 'Иногда ради мира ты соглашаешься с тем, с чем не согласен. Учись спокойно говорить своё мнение.'
  },
  IM: {
    code: 'IM',
    name: 'Реализатор',
    blag: 'Надёжный практик',
    color: '#0e9f8b',
    desc: 'Ты превращаешь идеи в конкретный результат. Любишь чёткие задачи, план и порядок. На тебя можно положиться: если взялся — сделаешь.',
    fit: 'Писать код по готовым задачам, собирать проект из частей, вести список дел, следить за сроками.',
    caut: 'Старайся не теряться, когда всё меняется на ходу, и пробуй новые идеи, даже если они кажутся «не по плану».'
  },
  CF: {
    code: 'CF',
    name: 'Педант (Доводчик)',
    blag: 'Хранитель качества',
    color: '#5a6b8c',
    desc: 'Ты внимательный к деталям, аккуратный и надёжный. Не успокаиваешься, пока всё не будет сделано правильно и до конца.',
    fit: 'Тестировать программу и находить ошибки-«баги», вычитывать тексты, оформлять отчёт и презентацию.',
    caut: 'Стремление к идеалу хорошо, но иногда «готово» лучше, чем «идеально». Учись вовремя завершать работу.'
  }
}

const KEY_ORDER = ['CO', 'SH', 'PL', 'RI', 'ME', 'TW', 'IM', 'CF']
const MAX_TOTAL = 70

function role(k: string): RoleInfo {
  return ROLES[k]!
}

// === Блоки вопросов ===
interface BelbinItem {
  t: string
  r: string
}

interface BelbinSection {
  title: string
  hint: string
  items: BelbinItem[]
}

const SECTIONS: BelbinSection[] = [
  {
    title: 'Блок 1. Что я приношу команде',
    hint: 'Всё это — про командную работу. Отметь, где твоя сила. Балл «10» — если это очень сильно про тебя.',
    items: [
      { t: 'Я быстро замечаю новые возможности и умею ими пользоваться.', r: 'RI' },
      { t: 'Я умею находить общий язык с самыми разными людьми.', r: 'TW' },
      { t: 'Придумывать идеи — моё природное умение.', r: 'PL' },
      { t: 'Я умею «разговорить» человека и помочь каждому высказаться.', r: 'CO' },
      { t: 'Я довожу начатое до конца — в этом моя сила.', r: 'IM' },
      { t: 'Я готов(а) поспорить, если вижу, что это принесёт пользу делу.', r: 'SH' },
      { t: 'Я обычно чувствую, что реально сработает, а что — нет.', r: 'ME' },
      { t: 'Я помогаю навести порядок в делах группы.', r: 'CF' }
    ]
  },
  {
    title: 'Блок 2. Мои слабые стороны',
    hint: 'У каждого есть места, где труднее. Честно отметь, что бывает непросто. Десятку можно никому не отдавать, если всё не про тебя.',
    items: [
      { t: 'Мне трудно отказать людям — я часто беру на себя слишком много.', r: 'TW' },
      { t: 'Иногда я кажусь слишком строгим: замечаю ошибки даже у друзей.', r: 'ME' },
      { t: 'Я могу быть таким нетерпеливым, что «подгоняю» всех вокруг.', r: 'SH' },
      { t: 'Я так увлекаюсь своей идеей, что забываю про детали и про всё вокруг.', r: 'PL' },
      { t: 'Мне легче поставить задачу другим, чем сделать её самому.', r: 'CO' },
      { t: 'Мне спокойнее, когда всё понятно и по плану; перемены меня сбивают.', r: 'IM' },
      { t: 'Я переживаю за мелочи и хочу перепроверить всё сам(а), даже когда другие говорят, что уже готово.', r: 'CF' },
      { t: 'Я быстро загораюсь, а потом могу остыть к делу.', r: 'RI' }
    ]
  },
  {
    title: 'Блок 3. Как я люблю работать',
    hint: 'Какая манера работы тебе ближе всего? Распредели 10 баллов между утверждениями.',
    items: [
      { t: 'Мне нравится, когда есть чёткий план и понятные задачи.', r: 'IM' },
      { t: 'Мне нравится, когда всё идет аккуратно, по шагам, без сюрпризов.', r: 'CF' },
      { t: 'Мне нравится обсуждать задачи с командой и договариваться о решении.', r: 'CO' },
      { t: 'Мне нравится искать новые идеи и экспериментировать.', r: 'PL' },
      { t: 'Мне нравится узнавать новое, общаться с людьми, находить необычные вещи.', r: 'RI' },
      { t: 'Мне нравится ставить трудную цель и добиваться её, не отступая.', r: 'SH' },
      { t: 'Мне нравится спокойно анализировать и проверять факты.', r: 'ME' },
      { t: 'Мне нравится работать в дружной команде, где все поддерживают друг друга.', r: 'TW' }
    ]
  },
  {
    title: 'Блок 4. Я в команде',
    hint: 'Как ты обычно ведёшь себя, когда работаешь вместе с другими?',
    items: [
      { t: 'Когда все зашли в тупик, я предлагаю неожиданное решение.', r: 'PL' },
      { t: 'Я знакомлю команду с новыми людьми и новыми возможностями.', r: 'RI' },
      { t: 'Я направляю разговор к цели и помогаю каждому высказаться.', r: 'CO' },
      { t: 'Я тороплю команду и не даю ей останавливаться.', r: 'SH' },
      { t: 'Я первым замечаю слабые места планов и риски.', r: 'ME' },
      { t: 'Я стараюсь, чтобы в команде было хорошее настроение и никто не ссорился.', r: 'TW' },
      { t: 'Я превращаю обсуждения в конкретные действия и списки дел.', r: 'IM' },
      { t: 'Я замечаю недоработки и ошибки, которые все пропустили.', r: 'CF' }
    ]
  },
  {
    title: 'Блок 5. Что мне нравится',
    hint: 'Какой тип работы увлекает тебя больше всего? Больше баллов — тому, что нравится сильнее.',
    items: [
      { t: 'Придумывать что-то новое и необычное.', r: 'PL' },
      { t: 'Общаться с людьми и узнавать, что нового происходит вокруг.', r: 'RI' },
      { t: 'Руководить командой и распределять задачи.', r: 'CO' },
      { t: 'Достигать трудных целей и добиваться победы.', r: 'SH' },
      { t: 'Разбираться в сложных задачах и проверять решения.', r: 'ME' },
      { t: 'Помогать другим и работать в дружном коллективе.', r: 'TW' },
      { t: 'Делать практичную работу по плану и в срок.', r: 'IM' },
      { t: 'Доводить работу до идеала: проверять, исправлять, «полировать».', r: 'CF' }
    ]
  },
  {
    title: 'Блок 6. Если что-то пошло не так',
    hint: 'Как ты реагируешь на трудности и препятствия?',
    items: [
      { t: 'Я направляю энергию команды на новую цель, не даю опустить руки.', r: 'SH' },
      { t: 'Я предлагаю посмотреть на проблему с новой стороны.', r: 'PL' },
      { t: 'Я ищу нужную информацию и нужных людей, чтобы решить проблему.', r: 'RI' },
      { t: 'Я собираю всех вместе и помогаю договориться о решении.', r: 'CO' },
      { t: 'Я спокойно разбираюсь в причинах и не тороплюсь с выводами.', r: 'ME' },
      { t: 'Я поддерживаю тех, кто расстроился, и сохраняю командный дух.', r: 'TW' },
      { t: 'Я составляю чёткий план, как исправить ситуацию.', r: 'IM' },
      { t: 'Я проверяю все детали, чтобы ошибка не повторилась.', r: 'CF' }
    ]
  },
  {
    title: 'Блок 7. Мой собственный проект',
    hint: 'Как ты работаешь, когда делаешь своё собственное дело?',
    items: [
      { t: 'Я сначала придумываю много идей, а потом выбираю самую интересную.', r: 'PL' },
      { t: 'Я быстро нахожу полезные знакомства и ресурсы для своего дела.', r: 'RI' },
      { t: 'Я продумываю, кто и что будет делать, чтобы всё складывалось вместе.', r: 'CO' },
      { t: 'Я ставлю себе срок и успеваю, даже если пришлось потрудиться много.', r: 'SH' },
      { t: 'Я заранее взвешиваю плюсы и минусы, прежде чем начинать.', r: 'ME' },
      { t: 'Я часто советуюсь с другими и учитываю их мнение.', r: 'TW' },
      { t: 'Я разбиваю дело на конкретные шаги и делаю их по порядку.', r: 'IM' },
      { t: 'Я не успокаиваюсь, пока всё не сделано аккуратно и до конца.', r: 'CF' }
    ]
  }
]

const EAGLE_QUIP_INTRO =
  'Я — Орлёнок Орлик, горный знаток командных ролей. Расскажу, какое дело в компьютерном проекте тебе подходит лучше всего: кто-то придумывает, кто-то планирует, кто-то делает, а кто-то проверяет.'

// === Состояние ===
type Page = 'start' | 'test' | 'result'
const page = ref<Page>('start')

const state = reactive({
  name: '',
  grade: '',
  team: '',
  idx: 0
})

const answers = ref<Record<string, number>[]>(makeAnswers())

function makeAnswers(): Record<string, number>[] {
  return SECTIONS.map(() => {
    const a: Record<string, number> = {}
    KEY_ORDER.forEach((k) => {
      a[k] = 0
    })
    return a
  })
}

function curSection(): BelbinSection {
  return SECTIONS[state.idx]!
}

function curAnswers(): Record<string, number> {
  return answers.value[state.idx]!
}

function val(item: BelbinItem): number {
  return curAnswers()[item.r] || 0
}

function sumSec(): number {
  return curSection().items.reduce((acc, item) => acc + val(item), 0)
}

const remaining = computed(() => 10 - sumSec())
const canGoNext = computed(() => remaining.value === 0)

const balanceClass = computed(() => (remaining.value === 0 ? 'ok' : 'warn'))

const balanceMsg = computed(() => {
  if (remaining.value === 0) return 'Всё распределено. Отлично!'
  if (remaining.value > 0) {
    return 'В этом блоке нужно набрать ровно 10 баллов (сейчас поставлено ' + (10 - remaining.value) + ').'
  }
  return 'Слишком много баллов! Убери лишнее: всего можно 10.'
})

function change(item: BelbinItem, delta: number): void {
  const v = Math.max(0, Math.min(10, val(item) + delta))
  curAnswers()[item.r] = v
}

function onInput(item: BelbinItem, raw: string): void {
  const v = parseInt(raw, 10)
  curAnswers()[item.r] = isNaN(v) ? 0 : Math.max(0, Math.min(10, v))
}

const minusDisabled = (item: BelbinItem): boolean => val(item) <= 0
const plusDisabled = (item: BelbinItem): boolean => {
  const v = val(item)
  const diff = 10 - sumSec() + v
  return v >= 10 || diff <= 0
}

function resetSec(): void {
  curSection().items.forEach((item) => {
    curAnswers()[item.r] = 0
  })
}

function startTest(): void {
  if (!state.name.trim()) return
  if (!state.grade) return
  state.idx = 0
  page.value = 'test'
}

function next(): void {
  if (remaining.value !== 0) return
  if (state.idx < SECTIONS.length - 1) {
    state.idx++
  } else {
    showResult()
  }
}

function prev(): void {
  if (state.idx > 0) state.idx--
}

function restart(): void {
  state.name = ''
  state.grade = ''
  state.team = ''
  state.idx = 0
  answers.value = makeAnswers()
  res.value = null
  page.value = 'start'
}

// === Результат ===
interface ResultInfo {
  totals: Record<string, number>
  sorted: string[]
  main: string
  second: string
  mainPct: number
  secPct: number
  zones: string[]
}

const res = ref<ResultInfo | null>(null)

function roundPct(v: number): number {
  return Math.round((v / MAX_TOTAL) * 100)
}

function showResult(): void {
  const totals: Record<string, number> = {}
  KEY_ORDER.forEach((k) => {
    totals[k] = 0
  })
  answers.value.forEach((a) => {
    KEY_ORDER.forEach((k) => {
      totals[k] = (totals[k] ?? 0) + (a[k] || 0)
    })
  })
  const sorted = KEY_ORDER.slice().sort((a, b) => (totals[b] ?? 0) - (totals[a] ?? 0))
  const main = sorted[0]!
  const second = sorted[1] ?? main
  res.value = {
    totals,
    sorted,
    main,
    second,
    mainPct: roundPct(totals[main] ?? 0),
    secPct: roundPct(totals[second] ?? 0),
    zones: sorted.filter((k) => (totals[k] ?? 0) <= 2)
  }
  page.value = 'result'
}

function pctOf(k: string): number {
  if (!res.value) return 0
  return roundPct(res.value.totals[k] ?? 0)
}

const mainNote = computed(() => {
  const r = res.value
  if (!r) return ''
  if (r.mainPct >= 40) {
    return 'Роль «' + role(r.main).name + '» — <b>сильно выраженная</b> (40% и больше). Тебе комфортно именно в этой работе — предложи руководителю задачи из списка выше.'
  }
  if (r.mainPct >= 25) {
    return 'Скорее всего, тебе подходит сочетание «' + role(r.main).name + '» и «' + role(r.second).name + '». В проекте можно попробовать задачи из обеих ролей.'
  }
  return 'Ярко выраженной главной роли пока нет — это нормально. Используй результат как направление и пробуй разные задачи в проекте.'
})

const zoneNote = computed(() => {
  const r = res.value
  if (!r) return ''
  if (r.zones.length) {
    return '<b>Зона роста (мало баллов):</b> ' + r.zones.map((k) => '«' + role(k).name + '»').join(', ') +
      '. Не обязательно делать это своей ролью, но полезно хотя бы один раз попробовать такие задачи — так ты станешь разностороннее.'
  }
  return 'Зон роста почти нет: ты готов(а) попробовать себя в самых разных ролях. Осталось выбрать, какая больше нравится!'
})

const orgLines = computed(() => {
  const r = res.value
  if (!r) return [] as string[]
  const g = state.grade || 'класс не указан'
  return [
    'Результаты участника: ' + state.name + ' (' + g + ')',
    'Главная роль: ' + role(r.main).name + ' — ' + r.mainPct + '%',
    'Вторая роль: ' + role(r.second).name + ' — ' + r.secPct + '%',
    'Баллы: ' + r.sorted.map((k) => role(k).name + ' ' + (r.totals[k] ?? 0) + ' (' + roundPct(r.totals[k] ?? 0) + '%)').join('; '),
    'Рекомендуемые задачи: ' + role(r.main).fit,
    'Комментарий: ' + role(r.main).caut
  ]
})

// === Затемнение цвета ===
function shade(hex: string, p: number): string {
  const n = hex.replace('#', '')
  let r = parseInt(n.substr(0, 2), 16) + p
  let g = parseInt(n.substr(2, 2), 16) + p
  let b = parseInt(n.substr(4, 2), 16) + p
  r = Math.max(0, Math.min(255, r))
  g = Math.max(0, Math.min(255, g))
  b = Math.max(0, Math.min(255, b))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
}

function roleGradient(k: string): string {
  const c = role(k).color
  return 'linear-gradient(135deg, ' + c + ', ' + shade(c, -22) + ')'
}

async function copyResult(): Promise<void> {
  const r = res.value
  if (!r) return
  const lines: string[] = []
  lines.push('РЕЗУЛЬТАТ ТЕСТА БЕЛБИНА (детский компьютерный проект)')
  lines.push('Участник: ' + state.name + (state.grade ? ' (' + state.grade + ')' : ''))
  if (state.team) lines.push('Команда: ' + state.team)
  lines.push('')
  lines.push('Главная роль: ' + role(r.main).name + ' — ' + r.mainPct + '%')
  if (r.second && (r.totals[r.second] ?? 0) > 0) {
    lines.push('Вторая роль: ' + role(r.second).name + ' — ' + r.secPct + '%')
  }
  lines.push('')
  lines.push('Баллы (из 70):')
  r.sorted.forEach((k) => {
    lines.push('  ' + role(k).name + ': ' + (r.totals[k] ?? 0) + ' (' + roundPct(r.totals[k] ?? 0) + '%)')
  })
  lines.push('')
  lines.push('Рекомендуемые задачи в проекте: ' + role(r.main).fit)
  lines.push('Комментарий: ' + role(r.main).caut)

  try {
    await navigator.clipboard.writeText(lines.join('\n'))
    alert('Результат скопирован в буфер обмена — можно вставить в общую таблицу руководителя.')
  } catch {
    alert('Не удалось скопировать автоматически. Скопируй текст результата вручную.')
  }
}

const GRADES = ['5 класс', '6 класс', '7 класс', '8 класс', '9 класс']
</script>

<template>
  <div class="belbin-page" :class="themeClass">
    <!-- Заголовок -->
    <header class="belbin-header">
      <button class="side-btn" @click="router.push('/')">← Редактор</button>
      <div class="header-title-wrap">
        <h1 class="page-title">🦅 Тест от орлёнка Орлика</h1>
        <p class="page-subtitle">Командные роли Белбина — найди своё дело в компьютерном проекте</p>
      </div>
      <div v-if="page === 'test'" class="header-progress">
        <span class="section-pos">Блок {{ state.idx + 1 }}/{{ SECTIONS.length }}</span>
        <div class="progress-track">
          <div v-for="(s, i) in SECTIONS" :key="i" class="dot" :class="{ done: i < state.idx }"></div>
        </div>
      </div>
      <div v-if="page !== 'start'" class="who-tag">{{ state.name }} · {{ state.grade }}</div>
    </header>

    <!-- Стартовая страница -->
    <section v-if="page === 'start'" class="intro-wrap">
      <div class="intro-card">
        <div class="eagle-big">🦅</div>
        <h2>Привет, орлёнок!</h2>
        <p class="eagle-speech">{{ EAGLE_QUIP_INTRO }}</p>
        <div class="rules">
          <div class="rule"><span class="rule-icon">🎯</span> 7 блоков, в каждом по 8 утверждений — по одному на каждую командную роль.</div>
          <div class="rule"><span class="rule-icon">⚖️</span> Распределяй ровно 10 баллов между утверждениями каждого блока.</div>
          <div class="rule"><span class="rule-icon">🏆</span> Роль с максимумом баллов — твоя главная, роль со вторым результатом — запасная.</div>
          <div class="rule"><span class="rule-icon">🌱</span> Роли с 0–1 баллом — твоя «зона роста»: их тоже стоит попробовать.</div>
        </div>

        <div class="form-grid">
          <div>
            <label class="field-label" for="b-name">Имя и фамилия</label>
            <input id="b-name" v-model="state.name" type="text" placeholder="Например, Маша Смирнова" />
          </div>
          <div>
            <label class="field-label" for="b-grade">Класс (5–9)</label>
            <select id="b-grade" v-model="state.grade">
              <option value="">— выбери —</option>
              <option v-for="g in GRADES" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
        </div>
        <div class="form-full">
          <label class="field-label" for="b-team">Название команды или школы (необязательно)</label>
          <input id="b-team" v-model="state.team" type="text" placeholder="Например, Дом юных техников" />
        </div>

        <div class="row-btns">
          <button class="primary-btn" @click="startTest">Начать тест →</button>
          <button class="ghost-btn" @click="router.push('/test')">🐸 У лягушонка Ква есть MBTI</button>
        </div>

        <details class="panel">
          <summary>Информация для руководителя проекта</summary>
          <div class="panel-body">
            <ul>
              <li>Тест построен по схеме опросника Белбина (SPI): <b>7 блоков</b>, в каждом по <b>8 утверждений</b> (по одному на роль). Участник распределяет между ними <b>ровно 10 баллов</b>.</li>
              <li>Баллы по каждой из 8 ролей суммируются, максимум — 70 (10 × 7). Главная роль — набравшая больше всего баллов; вторая по величине — запасная.</li>
              <li>Для команды 4–6 человек идеально, когда роли <b>не повторяются</b>: тогда в ней есть и «генератор идей», и «реализатор», и «педант», который всё проверит.</li>
              <li>Результат — не оценка и не рейтинг, а способ подобрать каждому интересное и полезное дело в проекте. Роли, набравшие 0–1 баллов, лучше дать ребёнку попробовать как «зону роста».</li>
              <li>В конце теста есть кнопка «Скопировать результат для руководителя» — удобно собирать данные по всем участникам.</li>
            </ul>
          </div>
        </details>
      </div>
    </section>

    <!-- Экран теста -->
    <section v-else-if="page === 'test'" class="test-wrap">
      <div class="card">
        <h2 class="sec-title">{{ curSection().title }}</h2>
        <p class="sec-hint">{{ curSection().hint }}</p>

        <div v-for="(item, i) in curSection().items" :key="i" class="item">
          <div class="num">{{ String.fromCharCode(1040 + i) }}</div>
          <div class="txt">{{ item.t }}</div>
          <div class="stepper">
            <button type="button" class="step" :disabled="minusDisabled(item)" @click="change(item, -1)">−</button>
            <input
              class="pnt"
              type="number"
              min="0"
              max="10"
              step="1"
              :value="val(item)"
              @input="onInput(item, ($event.target as HTMLInputElement).value)"
              @change="onInput(item, ($event.target as HTMLInputElement).value)"
            />
            <button type="button" class="step" :disabled="plusDisabled(item)" @click="change(item, 1)">+</button>
          </div>
        </div>

        <div class="balance" :class="balanceClass">
          <span>Осталось распределить:</span>
          <span class="bal-val">{{ remaining }}</span>
          <span class="bal-msg">{{ balanceMsg }}</span>
        </div>

        <div class="row-btns">
          <button class="ghost-btn" :disabled="state.idx === 0" @click="prev">Назад</button>
          <button class="ghost-btn" @click="resetSec">Сбросить блок</button>
          <span class="spacer"></span>
          <button class="primary-btn" :disabled="!canGoNext" @click="next">
            {{ state.idx === SECTIONS.length - 1 ? 'Показать результат →' : 'Вперёд →' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Экран результата -->
    <section v-else-if="page === 'result' && res" class="result-wrap">
      <div class="card hero">
        <span class="hero-tag">РЕЗУЛЬТАТ ТЕСТА БЕЛБИНА</span>
        <h1>{{ state.name }}</h1>
        <p>{{ state.grade || 'Участник' }}<template v-if="state.team"> · {{ state.team }}</template> · дата: {{ new Date().toLocaleDateString('ru-RU') }}</p>
      </div>

      <div class="card">
        <h2>Твоя роль в команде</h2>
        <div class="barchart">
          <div v-for="k in res.sorted" :key="k" class="bar-row">
            <div class="bar-name"><b>{{ role(k).name }}</b><small>{{ role(k).blag }}</small></div>
            <div class="bar-track"><div class="bar-fill" :style="{ background: role(k).color, width: Math.max(pctOf(k), 1) + '%' }"></div></div>
            <div class="bar-pct">{{ pctOf(k) }}%</div>
          </div>
        </div>

        <div class="rolecard" :style="{ background: roleGradient(res.main) }">
          <div class="rc-top">
            <span class="rc-badge">ТВОЯ ГЛАВНАЯ РОЛЬ</span>
            <b>{{ role(res.main).name }}</b>
            <span>{{ role(res.main).blag }} · {{ res.mainPct }}%</span>
          </div>
          <p>{{ role(res.main).desc }}</p>
          <div class="rc-tiles"><b>В КОМПЬЮТЕРНОМ ПРОЕКТЕ ТЕБЕ ПОДОЙДЁТ</b>{{ role(res.main).fit }}</div>
          <div class="rc-tiles"><b>НА ЧТО ОБРАТИТЬ ВНИМАНИЕ</b>{{ role(res.main).caut }}</div>
        </div>

        <div v-if="res.second && (res.totals[res.second] ?? 0) > 0" class="rolecard" :style="{ background: roleGradient(res.second) }">
          <div class="rc-top">
            <span class="rc-badge">ВТОРАЯ РОЛЬ — ЗАПАСНАЯ</span>
            <b>{{ role(res.second).name }}</b>
            <span>{{ role(res.second).blag }} · {{ res.secPct }}%</span>
          </div>
          <p>{{ role(res.second).desc }}</p>
          <div class="rc-tiles"><b>В КОМПЬЮТЕРНОМ ПРОЕКТЕ ТЕБЕ ПОДОЙДЁТ</b>{{ role(res.second).fit }}</div>
          <div class="rc-tiles"><b>НА ЧТО ОБРАТИТЬ ВНИМАНИЕ</b>{{ role(res.second).caut }}</div>
        </div>

        <div class="notice" v-html="mainNote"></div>
        <div class="notice zona" v-html="zoneNote"></div>
      </div>

      <div class="card rule-card">
        <b>Как использовать результат</b>
        Расскажи руководителю проекта о своей главной роли. В команде полезно, чтобы роли были разными: кто-то придумывает, кто-то планирует, кто-то делает, а кто-то проверяет. Попробуй в течение проекта выполнить хотя бы один раз задачу из своей «зоны роста» — так ты станешь ещё разностороннее.
      </div>

      <div class="card">
        <h2>Все 8 ролей</h2>
        <div v-for="k in KEY_ORDER" :key="k" class="all-role">
          <span class="role-dot" :style="{ background: role(k).color }"></span>
          <div class="role-text">
            <b>{{ role(k).name }}</b> — {{ role(k).blag }}
            <br /><span class="small">{{ role(k).desc }}</span>
          </div>
        </div>
        <details class="panel">
          <summary>Информация для руководителя проекта</summary>
          <div class="panel-body">
            <ul>
              <li v-for="(line, i) in orgLines" :key="i">{{ line }}</li>
            </ul>
          </div>
        </details>
      </div>

      <div class="row-btns">
        <button class="primary-btn" @click="copyResult">Скопировать результат для руководителя</button>
        <button class="ghost-btn" @click="router.push('/test')">🐸 К тесту лягушонка Ква</button>
        <button class="ghost-btn" @click="restart">Пройти тест ещё раз</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.belbin-page {
  --bg: #0b0f14;
  --panel: #12161c;
  --card: #161b22;
  --card2: #1c232d;
  --border: #2b323d;
  --text: #e6edf3;
  --muted: #8b949e;
  --accent: #f0a341;
  --accent2: #e05b8d;
  min-height: 100vh;
  background: var(--bg);
  background-image:
    radial-gradient(circle at 20% 10%, rgba(240, 163, 65, 0.12), transparent 40%),
    radial-gradient(circle at 90% 20%, rgba(224, 91, 141, 0.12), transparent 40%);
  color: var(--text);
  display: flex;
  flex-direction: column;
}

.belbin-page.theme-light {
  --bg: #faf7f3;
  --panel: #ffffff;
  --card: #ffffff;
  --card2: #f4f1ea;
  --border: #e4ded4;
  --text: #26242a;
  --muted: #6d6a70;
  --accent: #d9822b;
  --accent2: #c94e7d;
  background-image:
    radial-gradient(circle at 20% 10%, rgba(217, 130, 43, 0.1), transparent 40%),
    radial-gradient(circle at 90% 20%, rgba(201, 78, 125, 0.08), transparent 40%);
}

/* === Шапка === */
.belbin-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  position: sticky;
  top: 0;
  z-index: 50;
  flex-wrap: wrap;
}

.side-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font-size: 14px;
  white-space: nowrap;
  transition: all 0.2s;
}

.side-btn:hover {
  background: var(--card2);
  border-color: var(--accent);
}

.header-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.page-title {
  font-size: 20px;
  margin: 0;
}

.page-subtitle {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
}

.who-tag {
  font-size: 13px;
  color: var(--muted);
  border: 1px solid var(--border);
  padding: 6px 12px;
  border-radius: 20px;
  background: var(--card);
}

.header-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.section-pos {
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
}

.progress-track {
  flex: 1;
  display: flex;
  gap: 6px;
}

.dot {
  height: 8px;
  flex: 1;
  border-radius: 6px;
  background: var(--card2);
}

.dot.done {
  background: linear-gradient(90deg, var(--accent), var(--accent2));
}

/* === Кнопки === */
.primary-btn {
  padding: 10px 22px;
  border-radius: 24px;
  border: none;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(240, 163, 65, 0.4);
}

.primary-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ghost-btn {
  padding: 10px 18px;
  border-radius: 24px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.ghost-btn:hover:not(:disabled) {
  border-color: var(--accent);
  background: var(--card2);
}

.ghost-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.row-btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 18px;
  align-items: center;
}

.spacer {
  flex: 1;
}

/* === Интро === */
.intro-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.intro-card {
  max-width: 720px;
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 32px 28px;
  text-align: center;
}

.eagle-big {
  font-size: 78px;
  line-height: 1;
  margin-bottom: 12px;
  filter: drop-shadow(0 6px 16px rgba(240, 163, 65, 0.35));
}

.intro-card h2 {
  margin: 0 0 8px;
  font-size: 26px;
}

.eagle-speech {
  color: var(--muted);
  font-size: 16px;
  line-height: 1.55;
  margin: 0 auto 18px;
  max-width: 560px;
}

.rules {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
  margin-bottom: 20px;
}

.rule {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: var(--card2);
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.45;
}

.rule-icon {
  flex: 0 0 auto;
  font-size: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  text-align: left;
  margin-bottom: 12px;
}

.form-full {
  text-align: left;
  margin-bottom: 4px;
}

@media (max-width: 560px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.field-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 6px;
}

input[type='text'],
input[type='number'],
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  color: var(--text);
  background: var(--panel);
}

input:focus,
select:focus {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
  border-color: var(--accent);
}

input.pnt {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* === Вопросы === */
.test-wrap {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 30px 20px 60px;
}

.test-wrap .card {
  max-width: 780px;
  width: 100%;
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 24px 26px;
  margin-bottom: 16px;
}

.sec-title {
  margin: 0 0 4px;
  font-size: 21px;
}

.sec-hint {
  color: var(--muted);
  font-size: 14px;
  margin: 0 0 12px;
  line-height: 1.5;
}

.item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 4px;
  border-bottom: 1px solid var(--border);
}

.item:last-of-type {
  border-bottom: none;
}

.num {
  flex: 0 0 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--card2);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.item .txt {
  flex: 1;
  font-size: 14.5px;
  line-height: 1.45;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.step {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid var(--border);
  background: var(--card);
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
  color: var(--accent);
  font-family: inherit;
  line-height: 1;
  transition: all 0.12s;
}

.step:hover:not(:disabled) {
  background: var(--card2);
}

.step:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.pnt {
  width: 54px;
  text-align: center;
  padding: 8px 4px;
  border: 1px solid var(--border);
  border-radius: 9px;
  font-size: 15px;
  font-weight: 700;
  background: var(--card);
}

.balance {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--card2);
  border: 1px dashed var(--border);
  font-size: 14px;
  font-weight: 600;
}

.balance .bal-val {
  font-size: 17px;
  font-weight: 800;
  color: var(--accent);
}

.balance.ok .bal-val {
  color: var(--accent);
}

.balance.warn .bal-val {
  color: #d0576b;
}

.balance .bal-msg {
  font-weight: 500;
  color: var(--muted);
  font-size: 13px;
}

/* === Результат === */
.result-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px 60px;
}

.result-wrap .card {
  max-width: 780px;
  width: 100%;
}

.hero {
  text-align: center;
}

.hero-tag {
  display: inline-block;
  background: var(--card2);
  color: var(--accent);
  font-size: 12px;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  letter-spacing: 0.4px;
  margin-bottom: 10px;
}

.hero h1 {
  margin: 0;
  font-size: 28px;
}

.hero p {
  color: var(--muted);
  margin: 6px 0 0;
  font-size: 14px;
}

.barchart {
  margin-top: 6px;
}

.bar-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
}

.bar-name {
  flex: 0 0 150px;
  font-size: 13.5px;
  line-height: 1.2;
}

.bar-name small {
  display: block;
  color: var(--muted);
  font-size: 11.5px;
}

.bar-track {
  flex: 1;
  background: var(--card2);
  border-radius: 8px;
  height: 22px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 8px;
  min-width: 3px;
  transition: width 0.6s ease;
}

.bar-pct {
  flex: 0 0 44px;
  text-align: right;
  font-weight: 800;
  font-size: 13.5px;
}

.rolecard {
  border-radius: 16px;
  padding: 18px 20px;
  margin-top: 14px;
  color: #fff;
}

.rc-top {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.rc-top b {
  font-size: 18px;
}

.rc-top span {
  font-size: 12.5px;
  opacity: 0.9;
}

.rc-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  align-self: center;
}

.rolecard p {
  font-size: 14px;
  line-height: 1.55;
  margin-top: 8px;
  opacity: 0.97;
}

.rc-tiles {
  margin-top: 12px;
  font-size: 13.5px;
  line-height: 1.5;
}

.rc-tiles b {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  letter-spacing: 0.5px;
  opacity: 0.85;
}

.notice {
  background: var(--card2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--text);
  margin-top: 14px;
}

.notice.zona {
  border-color: rgba(240, 163, 65, 0.5);
  background: rgba(240, 163, 65, 0.12);
  color: var(--text);
}

.rule-card {
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  color: #fff;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
}

.rule-card b {
  font-size: 15px;
  display: block;
  margin-bottom: 4px;
}

.all-role {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 4px;
  border-bottom: 1px solid var(--border);
}

.all-role:last-of-type {
  border-bottom: none;
}

.role-dot {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  margin-top: 4px;
}

.role-text {
  flex: 1;
  font-size: 13.5px;
  line-height: 1.5;
}

.small {
  font-size: 12.5px;
  color: var(--muted);
}

.panel {
  border: 1px solid var(--border);
  border-radius: 14px;
  margin-top: 14px;
  overflow: hidden;
}

.panel summary {
  cursor: pointer;
  list-style: none;
  padding: 14px 18px;
  font-weight: 600;
  font-size: 14.5px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--card2);
}

.panel summary::-webkit-details-marker {
  display: none;
}

.panel summary::before {
  content: '+';
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--card);
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  flex: 0 0 20px;
}

.panel[open] summary::before {
  content: '−';
}

.panel-body {
  padding: 6px 18px 16px;
  font-size: 13.5px;
  line-height: 1.6;
}

.panel-body ul {
  margin: 8px 0 0 18px;
}
</style>