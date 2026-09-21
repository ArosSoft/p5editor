<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
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

// === Данные вопросов ===
type Dim = 0 | 1 | 2 | 3

interface Question {
  dim: Dim
  pole: 1 | -1
  text: string
  inverse: string
}

const POS = ['E', 'N', 'F', 'P'] as const
const NEG = ['I', 'S', 'T', 'J'] as const

const questions: Question[] = [
  {
    dim: 0,
    pole: 1,
    text: 'Ква-компания! На вечеринке я распухаю от энергии: болтаю со всеми, знакомлюсь и веду хороводы.',
    inverse: 'На вечеринке я маскируюсь под кувшинку: схвачу напиток и тихо шуршу в уголке.'
  },
  {
    dim: 0,
    pole: 1,
    text: 'Мне жизненно необходимо каждый день общаться с людьми, иначе я вяну, как лягушка без лужи.',
    inverse: 'Мне жизненно необходимо каждый день побыть одному(ой), иначе я раздуваюсь от перенапряжения.'
  },
  {
    dim: 0,
    pole: 1,
    text: 'Новые знакомства меня заряжают: я готов(а) знакомиться хоть каждый комариный вечер.',
    inverse: 'Новые знакомства меня утомляют: лучше обниму свою кувшинку, чем потрясу лапку незнакомцу.'
  },
  {
    dim: 0,
    pole: 1,
    text: 'Если в комнате скучно — это повод для меня её развеселить, а не скучать вместе со всеми.',
    inverse: 'Если в комнате шумно — я мечтаю, чтобы все разлетелись, как комары от фумигатора.'
  },
  {
    dim: 1,
    pole: -1,
    text: 'Я человек конкретики: план, шаги и инструкция — вот мои вернейшие ква-друзья.',
    inverse: 'Я человек идей: дайте мне фантазию вместо инструкции — и я улечу выше облаков.'
  },
  {
    dim: 1,
    pole: -1,
    text: 'Важен житейский смысл: если работаю — копаю конкретно и по фактам, без философии на ровном месте.',
    inverse: 'Мне интереснее, что ИМЕЕТСЯ В ВИДУ за словами, чем сами слова: я вечно ищу подтексты.'
  },
  {
    dim: 1,
    pole: -1,
    text: 'Я замечаю мелочи: травинку не туда, пятнышко поперёк — внимание к деталям моё фирменное наваждение.',
    inverse: 'Детали меня утомляют: я сразу хватаю общую картину, а в мелочах плаваю.'
  },
  {
    dim: 1,
    pole: -1,
    text: 'Прагматика побеждает: зачем фантазировать, если можно просто сделать и получить результат.',
    inverse: 'Я обожаю фантазировать о возможностях: «а что если...» — мой любимый спорт.'
  },
  {
    dim: 2,
    pole: -1,
    text: 'Я решаю головой: в спорах включаю логику, а чувства отправляю пить чай из кувшинки.',
    inverse: 'Я решаю сердцем: если логика против чувств — чувства почти всегда выигрывают.'
  },
  {
    dim: 2,
    pole: -1,
    text: 'Правда дороже: я скажу всё как есть, даже если кому-то станет немного грустно.',
    inverse: 'Мне важнее не ранить: лучше мягко приукрашу, чем бить правдой по лапкам.'
  },
  {
    dim: 2,
    pole: -1,
    text: 'Критика — топливо прогресса: спокойно разбираю замечания и дорабатываю, без обид.',
    inverse: 'Критика — удар по сердцу: даже справедливое замечание расстраивает меня так, что ква-ква.'
  },
  {
    dim: 2,
    pole: -1,
    text: 'В споре я гонюсь за истиной, а не за тем, чтобы всем вокруг стало приятно.',
    inverse: 'Мне важнее, чтобы всем было уютно, чем установить, кто из нас прав.'
  },
  {
    dim: 3,
    pole: -1,
    text: 'У меня всё по плану: списки задач, дедлайны и заметочки. Спонтанность? Пфф, нет уж.',
    inverse: 'План — это рамка, которую я рад сломать: спонтанность меня вдохновляет!'
  },
  {
    dim: 3,
    pole: -1,
    text: 'Готовлюсь заранее: чемодан собран за неделю, доклад написан ещё вчера.',
    inverse: 'Готовлюсь в последнюю секунду: дедлайн — мой учитель, стресс — моя муза.'
  },
  {
    dim: 3,
    pole: -1,
    text: 'Порядок в болоте — порядок в голове: всё лежит по фирменным коробочкам и подписано.',
    inverse: 'Творческий хаос меня не смущает: тапки, кисточки и кувшинки уютно живут вперемешку.'
  },
  {
    dim: 3,
    pole: -1,
    text: 'Я люблю закрывать задачи раньше срока и потом спокойно не дёргаться.',
    inverse: 'Я люблю оставлять всё открытым до последнего: неизвестность добавляет остроты!'
  }
]

const QUIPS_FORWARD = [
  'Ква-ква! Отвечай честно, не жульничай!',
  'Запомни: я умею читать мысли на расстоянии трёх кувшинок.',
  'Думай как взрослая лягушка, а не как головастик!',
  'Щёлкни по самому честному кружку!',
  'Не спеши: большие кружки — для смелых ответов.',
  'Хитришь? Я чувствую подвох кончиком язычка.'
]

const QUIPS_INVERSE = [
  'Ха! Тот же вопрос — только с другой стороны. Попался бы ты, если бы хитрил!',
  'Ква-проверка! Отвечай так же, как в первый раз, или я всё пойму.',
  'Я перевернул(а) вопрос шиворот-навыворот. Держись!',
  'Смотри, не запутайся: я специально перевернул формулировку.',
  'Угу-угу... Сверяю с первым ответом. Хм-хм.'
]

const FROG_QUIP_INTRO =
  'Я — Лягушонок Ква, волшебный знаток лягушачьих душ. Квакну 16 хитрых вопросов, а потом повторю их задом наперёд и проверю, не мухлюешь ли ты.'

// === Типы личности ===
interface TypeInfo {
  code: string
  vec: [number, number, number, number]
  name: string
  color: string
  desc: string
  cardImg: string
}

const TYPES: TypeInfo[] = [
  { code: 'ISTJ', vec: [-1, -1, -1, -1], name: 'Хранитель', color: '#5b8def', cardImg: 'istj.png', desc: 'Вы надёжны, как семейный устав: порядок, долг и ни одного нерешённого дела.' },
  { code: 'ISFJ', vec: [-1, -1, 1, -1], name: 'Защитник', color: '#3fb27f', cardImg: 'isfj.png', desc: 'Вы носите тёплый плед для всех знакомых лягушек. Забота — ваша суперсила.' },
  { code: 'INFJ', vec: [-1, 1, 1, -1], name: 'Вдохновитель', color: '#9b6cf0', cardImg: 'infj.png', desc: 'Вы читаете чужие мысли на расстоянии и тайно мечтаете изменить всё болото.' },
  { code: 'INTJ', vec: [-1, 1, -1, -1], name: 'Стратег', color: '#f5a623', cardImg: 'intj.png', desc: 'Вы уже продумали план на семь ходов вперёд, пока остальные ищут тапочки.' },
  { code: 'ISTP', vec: [-1, -1, -1, 1], name: 'Мастер', color: '#e15b8d', cardImg: 'istp.png', desc: 'Вы разберёте и соберёте всё, от будильника до лягушачьего гамака.' },
  { code: 'ISFP', vec: [-1, -1, 1, 1], name: 'Художник', color: '#22c1c3', cardImg: 'isfp.png', desc: 'Вы украшаете кувшинки и видите красоту там, где остальные видят тину.' },
  { code: 'INFP', vec: [-1, 1, 1, 1], name: 'Идеалист', color: '#f0d23c', cardImg: 'infp.png', desc: 'Вы живёте в мире больших мечт и искренних «а вдруг».' },
  { code: 'INTP', vec: [-1, 1, -1, 1], name: 'Философ', color: '#e84d4d', cardImg: 'intp.png', desc: 'Вы задаёте вопросы, от которых у других лягушек кружится голова.' },
  { code: 'ESTP', vec: [1, -1, -1, 1], name: 'Делец', color: '#7a9de0', cardImg: 'estp.png', desc: 'Вы двигаетесь быстро, хватаете момент за хвост и не даёте скучать ни себе, ни другим.' },
  { code: 'ESFP', vec: [1, -1, 1, 1], name: 'Зажигалка', color: '#57c785', cardImg: 'esfp.png', desc: 'Вы душа любого ква-концерта, вечеринки и просто подоконника.' },
  { code: 'ENFP', vec: [1, 1, 1, 1], name: 'Искатель', color: '#c07fe8', cardImg: 'enfp.png', desc: 'Вы фонтанируете идеями и умеете зажечь целое болото энтузиазмом.' },
  { code: 'ENTP', vec: [1, 1, -1, 1], name: 'Изобретатель', color: '#ffb86c', cardImg: 'entp.png', desc: 'Вы любите спорить ради интереса — даже с собственной кувшинкой.' },
  { code: 'ESTJ', vec: [1, -1, -1, -1], name: 'Управленец', color: '#4aa8c7', cardImg: 'estj.png', desc: 'Вы организуете праздник строго по регламенту, и все довольны.' },
  { code: 'ESFJ', vec: [1, -1, 1, -1], name: 'Заводила', color: '#d38f8f', cardImg: 'esfj.png', desc: 'Вы первым делом спросите, как дела у каждой лягушки в пруду.' },
  { code: 'ENFJ', vec: [1, 1, 1, -1], name: 'Наставник', color: '#6fce9e', cardImg: 'enfj.png', desc: 'Вы ведёте других к мечте и заряжаете уверенностью на расстояние всей лужи.' },
  { code: 'ENTJ', vec: [1, 1, -1, -1], name: 'Командир', color: '#a89fe0', cardImg: 'entj.png', desc: 'Вы строите болото по своему проекту — и никто не смеет спорить.' }
]

const GRID_ORDER = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ',
  'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP',
  'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ'
]

// === Состояние теста ===
type Phase = 'intro' | 'test' | 'result'

const phase = ref<Phase>('intro')
const steps = ref<{ qid: number; kind: 'forward' | 'inverse' }[]>([])
const answers = ref<(number | null)[]>([])
const currentIndex = ref(0)

const CIRCLE_SIZES = [36, 28, 22, 18, 22, 28, 36] as const
const SCALE_GAP = 18

const rowWidth = CIRCLE_SIZES.reduce((a, b) => a + b, 0) + SCALE_GAP * (CIRCLE_SIZES.length - 1)

function circleCenterX(idx: number): number {
  let x = 0
  for (let i = 0; i < idx; i++) x += CIRCLE_SIZES[i]! + SCALE_GAP
  return x + CIRCLE_SIZES[idx]! / 2
}

const capPositions = computed(() => {
  const toPct = (x: number) => ((x / rowWidth) * 100).toFixed(2) + '%'
  return {
    left: toPct(circleCenterX(0)),
    center: toPct(circleCenterX(3)),
    right: toPct(circleCenterX(6))
  }
})

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  let m = a.length
  while (m) {
    const i = Math.floor(Math.random() * m--)
    const t = a[i]!
    a[i] = a[m]!
    a[m] = t
  }
  return a
}

function startTest() {
  const order = shuffle(questions.map((_, i) => i))
  steps.value = [
    ...order.map((qid) => ({ qid, kind: 'forward' as const })),
    ...[...order].reverse().map((qid) => ({ qid, kind: 'inverse' as const }))
  ]
  answers.value = new Array(32).fill(null)
  currentIndex.value = 0
  phase.value = 'test'
}

function restartTest() {
  phase.value = 'intro'
}

const currentStep = computed(() => steps.value[currentIndex.value] ?? null)
const currentQ = computed<Question | null>(() => {
  const st = currentStep.value
  return st ? (questions[st.qid] ?? null) : null
})
const currentKind = computed<'forward' | 'inverse'>(() => currentStep.value?.kind ?? 'forward')
const currentText = computed(() => {
  const q = currentQ.value
  if (!q) return ''
  return currentKind.value === 'forward' ? q.text : q.inverse
})
const isSecondHalf = computed(() => currentIndex.value >= 16)
const frogQuip = computed(() => {
  const qs = isSecondHalf.value ? QUIPS_INVERSE : QUIPS_FORWARD
  return qs[currentIndex.value % qs.length]
})
const stepNumber = computed(() => currentIndex.value + 1)
const totalSteps = computed(() => steps.value.length)
const answeredCount = computed(() => answers.value.filter((a) => a != null).length)
const progressPct = computed(() =>
  totalSteps.value ? Math.round((answeredCount.value / totalSteps.value) * 100) : 0
)

function setAnswer(v: number) {
  answers.value[currentIndex.value] = v
}

const canGoPrev = computed(() => currentIndex.value > 0)
const canGoNext = computed(() => answers.value[currentIndex.value] != null)

function goPrev() {
  if (currentIndex.value > 0) currentIndex.value--
}

function goNext() {
  if (answers.value[currentIndex.value] == null) return
  if (currentIndex.value >= totalSteps.value - 1) {
    phase.value = 'result'
    return
  }
  currentIndex.value++
}

// === Вычисления по осям ===
interface DimCore {
  sums: number[]
  counts: number[]
  scores: number[]
}

const dimsCore = computed<DimCore>(() => {
  const sums = [0, 0, 0, 0]
  const counts = [0, 0, 0, 0]
  for (let i = 0; i < steps.value.length; i++) {
    const v = answers.value[i]
    const st = steps.value[i]
    if (v == null || !st) continue
    const q = questions[st.qid]
    if (!q) continue
    const base = (v - 4) / 3
    const c = st.kind === 'forward' ? q.pole * base : -q.pole * base
    sums[q.dim] = (sums[q.dim] ?? 0) + c
    counts[q.dim] = (counts[q.dim] ?? 0) + 1
  }
  const scores = sums.map((s, i) => (counts[i] ? s / counts[i] : 0))
  return { sums, counts, scores }
})

function typeFit(vec: [number, number, number, number]): number {
  const s = dimsCore.value.scores
  const dot =
    (s[0] ?? 0) * vec[0] +
    (s[1] ?? 0) * vec[1] +
    (s[2] ?? 0) * vec[2] +
    (s[3] ?? 0) * vec[3]
  return (4 + dot) / 8
}

interface TypeState {
  type: TypeInfo
  fit: number
  tier: 'neutral' | 'best' | 'strong' | 'mid' | 'dim'
  opacity: number
}

const typeStates = computed<TypeState[]>(() => {
  const answered = answeredCount.value
  const fits = TYPES.map((type) => ({ type, fit: typeFit(type.vec) }))
  const maxFit = Math.max(...fits.map((f) => f.fit))
  const neutral = answered < 2
  return fits.map(({ type, fit }) => {
    const ratio = neutral ? 0 : fit / maxFit
    let tier: TypeState['tier']
    if (neutral) tier = 'neutral'
    else if (ratio > 0.98) tier = 'best'
    else if (ratio > 0.85) tier = 'strong'
    else if (ratio > 0.7) tier = 'mid'
    else tier = 'dim'
    const opacity = neutral ? 0.45 : 0.3 + 0.7 * Math.pow(fit, 2)
    return { type, fit, tier, opacity }
  })
})

const forecast = computed(() => {
  const sorted = [...typeStates.value].sort((a, b) => b.fit - a.fit)
  const top = sorted.find((s) => s.tier === 'best') ?? sorted[0]
  if (!top) return null
  const ties = sorted.filter((s) => (top.fit - s.fit) < 1e-9)
  return ties.slice(0, 4).map((s) => s.type)
})

// === Результат ===
const result = computed(() => {
  const s = dimsCore.value.scores.map((v) => v ?? 0)
  const letters = s.map((v, i) => (v > 0 ? POS[i] : NEG[i]))
  const code = letters.join('')
  const type = TYPES.find((t) => t.code === code) ?? TYPES.find((t) => t.code === 'ENFP')!

  let totalDev = 0
  let pairs = 0
  for (let i = 0; i < 16; i++) {
    const a = answers.value[i]
    const b = answers.value[31 - i]
    if (a != null && b != null) {
      totalDev += Math.abs(a + b - 8)
      pairs++
    }
  }
  const truth = pairs ? Math.round((1 - totalDev / (6 * pairs)) * 100) : 0

  const dimRows = [
    { left: 'Экстраверт (E)', right: 'Интроверт (I)', score: s[0] ?? 0 },
    { left: 'Интуиция (N)', right: 'Конкретика (S)', score: s[1] ?? 0 },
    { left: 'Чувства (F)', right: 'Логика (T)', score: s[2] ?? 0 },
    { left: 'Свобода (P)', right: 'Порядок (J)', score: s[3] ?? 0 }
  ].map((row) => {
    const leftPct = Math.round(((1 + row.score) / 2) * 100)
    return { ...row, leftPct, rightPct: 100 - leftPct }
  })

  return { type, truth, dimRows }
})

function truthVerdict(p: number): string {
  if (p >= 85) return 'Честнейший жабин! С тобой можно идти в разведку.'
  if (p >= 70) return 'Весьма честная ква-душа. Лягушонок доволен!'
  if (p >= 55) return 'Бывают мелкие хитрости, но в целом ты большой молодец.'
  if (p >= 40) return 'Хм, кое-что ты приукрасил(а), но мы почти тебе верим.'
  return 'Уф! Ты наврал(а) больше, чем няшные куклы поют. Лягушонок огорчён, но результат всё равно выдаст.'
}

const AXES_LEGEND: { a: string; b: string; note: string }[] = [
  { a: 'E', b: 'I', note: 'Экстраверт / Интроверт' },
  { a: 'N', b: 'S', note: 'Интуиция / Конкретика' },
  { a: 'F', b: 'T', note: 'Чувства / Логика' },
  { a: 'P', b: 'J', note: 'Свобода / Порядок' }
]

function circleTitle(v: number): string {
  if (v === 1) return 'Совсем не про меня'
  if (v === 7) return 'Абсолютно про меня'
  if (v === 4) return 'Пятьдесят на пятьдесят'
  return v < 4 ? 'Скорее не про меня' : 'Скорее про меня'
}

function typeByCode(code: string): TypeInfo {
  return TYPES.find((t) => t.code === code) ?? TYPES.find((t) => t.code === 'ISTJ')!
}

const brokenCards = reactive(new Set<string>())
const imgAttempts = reactive(new Map<string, number>())

function cardImgUrl(file: string): string {
  const attempt = imgAttempts.get(file) ?? 0
  if (attempt === 0) return `/cards/${file}`
  return `${import.meta.env.BASE_URL}cards/${file}`
}

function onCardImgError(file: string) {
  const attempt = (imgAttempts.get(file) ?? 0) + 1
  if (attempt >= 2) {
    brokenCards.add(file)
    return
  }
  imgAttempts.set(file, attempt)
}

const previewImg = ref<string | null>(null)

function openPreview(file: string) {
  if (!brokenCards.has(file)) previewImg.value = file
}

function closePreview() {
  previewImg.value = null
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closePreview()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="mbti-page" :class="themeClass">
    <!-- Заголовок -->
    <header class="mbti-header">
      <button class="side-btn" @click="router.push('/')">← Редактор</button>
      <div class="header-title-wrap">
        <h1 class="page-title">🐸 Тест от лягушонка Ква</h1>
        <p class="page-subtitle">Определи свой тип личности по MBTI — с гарантированной проверкой честности</p>
      </div>
      <div v-if="phase === 'test'" class="header-progress">
        <span class="progress-num">{{ stepNumber }} / {{ totalSteps }}</span>
        <div class="progress-track"><div class="progress-fill" :style="{ width: progressPct + '%' }"></div></div>
        <span class="progress-pct">{{ progressPct }}%</span>
      </div>
    </header>

    <!-- Экран приветствия -->
    <section v-if="phase === 'intro'" class="intro-wrap">
      <div class="intro-card">
        <div class="frog-big">🐸</div>
        <h2>Привет, жабина!</h2>
        <p class="frog-speech">{{ FROG_QUIP_INTRO }}</p>
        <div class="rules">
          <div class="rule"><span class="rule-icon">🎯</span> 16 вопросов — и каждый прозвучит дважды: в лоб и с обратной стороны.</div>
          <div class="rule"><span class="rule-icon">⭕</span> Отвечай, нажимая на один из семи кружков: большие — сильное «ква-да» или «ква-нет», маленький в середине — «сомневаюсь».</div>
          <div class="rule"><span class="rule-icon">🔍</span> Слева таблица типов: чем честнее отвечаешь, тем быстрее я найду твой самый родной тип.</div>
          <div class="rule"><span class="rule-icon">🧪</span> В конце — твой тип и процент правдивости. Ква-обещаю: без обид.</div>
        </div>
        <div class="intro-actions">
          <button class="primary-btn" @click="startTest">Начать квакать →</button>
          <button class="ghost-btn" @click="router.push('/test-belbin')">🦅 Другой тест — у орлёнка Орлика</button>
        </div>
      </div>
    </section>

    <!-- Экран теста -->
    <div v-else-if="phase === 'test'" class="test-layout">
      <aside class="types-panel">
        <h3 class="panel-title">Таблица типов</h3>

        <div class="forecast-card">
          <h4 class="forecast-title">🐸 Ква-прогноз</h4>
          <div v-if="forecast && forecast.length" class="forecast-list">
            <div
              v-for="t in forecast"
              :key="t.code"
              class="forecast-thumb"
              :class="{ clickable: !brokenCards.has(t.cardImg) }"
              :style="{ '--tc': t.color, borderColor: t.color + '55', background: t.color + '14' }"
              @click="openPreview(t.cardImg)"
            >
              <div class="thumb-name">{{ t.name }}</div>
              <img
                v-if="!brokenCards.has(t.cardImg)"
                class="thumb-img-real"
                :src="cardImgUrl(t.cardImg)"
                :alt="t.cardImg"
                @error="onCardImgError(t.cardImg)"
              />
              <div v-else class="thumb-img">{{ t.cardImg }}</div>
              <div class="thumb-code">{{ t.code }}</div>
            </div>
          </div>
          <p v-else class="forecast-empty">Ещё присматриваюсь...</p>
        </div>

        <div class="types-grid">
          <div
            v-for="code in GRID_ORDER"
            :key="code"
            class="type-tile"
            :class="typeStates.find((s) => s.type.code === code)?.tier ?? 'neutral'"
            :style="{
              '--tc': typeByCode(code).color,
              opacity: typeStates.find((s) => s.type.code === code)?.opacity ?? 0.45,
              background: typeByCode(code).color + '14',
              borderColor: typeByCode(code).color + '44',
              boxShadow: typeStates.find((s) => s.type.code === code)?.tier === 'best' ? `0 0 16px ${typeByCode(code).color}88` : 'none'
            }"
          >
            <div class="type-code">{{ code }}</div>
            <div class="type-name">{{ typeByCode(code).name }}</div>
          </div>
        </div>

        <div class="axes-legend">
          <div v-for="(ax, i) in AXES_LEGEND" :key="i" class="axis-row">
            <span class="axis-letters">{{ ax.a }} — {{ ax.b }}</span>
            <span class="axis-note">{{ ax.note }}</span>
          </div>
        </div>
      </aside>

      <section class="quiz-area">
        <div class="phase-badge" :class="{ second: isSecondHalf }">
          {{ isSecondHalf ? '⏪ Проверка: те же вопросы задом наперёд' : '🎯 Прямые вопросы' }}
        </div>

        <div class="question-card">
          <div class="frog-bubble">
            <span class="frog-face">🐸</span>
            <span class="frog-quip">{{ frogQuip }}</span>
          </div>
          <p class="question-text">{{ currentText }}</p>

          <div class="scale-container">
            <div class="scale-positioner">
              <div class="circles-row" :style="{ gap: SCALE_GAP + 'px' }">
                <button
                  v-for="v in 7"
                  :key="v"
                  class="circle-btn"
                  :class="{ selected: answers[currentIndex] === v }"
                  :style="{
                    width: CIRCLE_SIZES[v - 1] + 'px',
                    height: CIRCLE_SIZES[v - 1] + 'px'
                  }"
                  :title="circleTitle(v)"
                  @click="setAnswer(v)"
                >
                  <span class="circle-inner"></span>
                </button>
              </div>
              <div class="scale-captions">
                <span class="cap cap-left" :style="{ left: capPositions.left }">Это не про меня</span>
                <span class="cap cap-mid" :style="{ left: capPositions.center }">Сомневаюсь</span>
                <span class="cap cap-right" :style="{ left: capPositions.right }">Точно про меня</span>
              </div>
            </div>
          </div>

          <div class="scale-hint">Большие кружки по краям — для сильных «ква-да» и «ква-нет». Маленький в середине — для честного «не знаю».</div>
        </div>

        <div class="quiz-nav">
          <button class="ghost-btn" :disabled="!canGoPrev" @click="goPrev">← Назад</button>
          <span class="answered-hint" v-if="answeredCount">{{ answeredCount }} / {{ totalSteps }} ответов</span>
          <button class="primary-btn" :disabled="!canGoNext" @click="goNext">
            {{ currentIndex >= totalSteps - 1 ? 'Показать результат →' : 'Дальше →' }}
          </button>
        </div>
      </section>
    </div>

    <!-- Экран результата -->
    <div v-else class="result-layout">
      <aside class="types-panel result-panel">
        <h3 class="panel-title">Таблица типов</h3>
        <div class="types-grid">
          <div
            v-for="code in GRID_ORDER"
            :key="code"
            class="type-tile"
            :class="typeStates.find((s) => s.type.code === code)?.tier ?? 'neutral'"
            :style="{
              '--tc': typeByCode(code).color,
              opacity: typeStates.find((s) => s.type.code === code)?.opacity ?? 0.45,
              background: typeByCode(code).color + '14',
              borderColor: typeByCode(code).color + '44',
              boxShadow: typeStates.find((s) => s.type.code === code)?.tier === 'best' ? `0 0 16px ${typeByCode(code).color}88` : 'none'
            }"
          >
            <div class="type-code">{{ code }}</div>
            <div class="type-name">{{ typeByCode(code).name }}</div>
          </div>
        </div>
        <div class="axes-legend">
          <div v-for="(ax, i) in AXES_LEGEND" :key="i" class="axis-row">
            <span class="axis-letters">{{ ax.a }} — {{ ax.b }}</span>
            <span class="axis-note">{{ ax.note }}</span>
          </div>
        </div>
      </aside>

      <section class="result-card">
        <div class="result-type" :style="{ '--tc': result.type.color }">
          <div
            class="type-card-img"
            :style="{
              '--tc': result.type.color,
              borderColor: result.type.color + '55',
              background: result.type.color + '12'
            }"
          >
            <img
              v-if="!brokenCards.has(result.type.cardImg)"
              class="card-img-real"
              :src="cardImgUrl(result.type.cardImg)"
              :alt="result.type.cardImg"
              @error="onCardImgError(result.type.cardImg)"
            />
            <template v-else>
              <div class="card-img-icon">🖼️</div>
              <div class="card-img-name">{{ result.type.cardImg }}</div>
              <div class="card-img-note">картинка карточки появится позже</div>
            </template>
          </div>
          <div class="result-code" :style="{ color: result.type.color }">{{ result.type.code }}</div>
          <div class="result-name">{{ result.type.name }}</div>
          <p class="result-desc">{{ result.type.desc }}</p>
        </div>

        <div class="truth-block">
          <div class="truth-title">Честность ответов</div>
          <div class="truth-gauge">
            <div class="truth-track">
              <div class="truth-fill" :style="{
                width: result.truth + '%',
                background: result.truth >= 70 ? 'linear-gradient(90deg, #2d9d6f, #42b883)' : result.truth >= 40 ? 'linear-gradient(90deg, #d8a13c, #f5a623)' : 'linear-gradient(90deg, #d65c5c, #e84d4d)'
              }"></div>
            </div>
            <div class="truth-value">{{ result.truth }}%</div>
          </div>
          <p class="truth-verdict">🐸 {{ truthVerdict(result.truth) }}</p>
        </div>

        <div class="dim-bars">
          <div v-for="(row, i) in result.dimRows" :key="i" class="dim-row">
            <span class="dim-name dim-left">{{ row.left }}</span>
            <div class="bar-track">
              <div class="bar-fill bar-positive" :style="{ width: row.leftPct + '%' }"></div>
              <div class="bar-fill bar-negative" :style="{ width: row.rightPct + '%' }"></div>
            </div>
            <span class="dim-name dim-right">{{ row.right }}</span>
            <span class="dim-pct">{{ row.leftPct }}%</span>
          </div>
        </div>

        <div class="result-actions">
          <button class="ghost-btn" @click="restartTest">Пройти ещё раз</button>
          <button class="primary-btn" @click="router.push('/')">← В редактор</button>
        </div>
      </section>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="fade">
      <div v-if="previewImg" class="preview-overlay" @click.self="closePreview">
        <div class="preview-box">
          <button class="preview-close" aria-label="Закрыть" @click="closePreview">✕</button>
          <img class="preview-img" :src="cardImgUrl(previewImg)" :alt="previewImg" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mbti-page {
  --bg: #0b0f14;
  --panel: #12161c;
  --card: #161b22;
  --card2: #1c232d;
  --border: #2b323d;
  --text: #e6edf3;
  --muted: #8b949e;
  --accent: #42b883;
  --accent2: #646cff;
  min-height: 100vh;
  background: var(--bg);
  background-image:
    radial-gradient(circle at 20% 10%, rgba(66, 184, 131, 0.12), transparent 40%),
    radial-gradient(circle at 90% 20%, rgba(100, 108, 255, 0.12), transparent 40%);
  color: var(--text);
  display: flex;
  flex-direction: column;
}

.mbti-page.theme-light {
  --bg: #f5f7fa;
  --panel: #ffffff;
  --card: #ffffff;
  --card2: #f1f4f7;
  --border: #dde3ea;
  --text: #1f2430;
  --muted: #5f6b7a;
  --accent: #2d9d6f;
  background-image:
    radial-gradient(circle at 20% 10%, rgba(45, 157, 111, 0.1), transparent 40%),
    radial-gradient(circle at 90% 20%, rgba(100, 108, 255, 0.08), transparent 40%);
}

/* === Шапка === */
.mbti-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  position: sticky;
  top: 0;
  z-index: 50;
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

.header-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 220px;
}

.progress-num {
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
}

.progress-pct {
  font-size: 13px;
  color: var(--accent);
  font-weight: 600;
  white-space: nowrap;
  min-width: 38px;
  text-align: right;
}

.progress-track {
  flex: 1;
  height: 8px;
  border-radius: 6px;
  background: var(--card2);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  transition: width 0.3s ease;
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
  max-width: 680px;
  width: 100%;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 36px 40px;
  text-align: center;
}

.frog-big {
  font-size: 72px;
  line-height: 1;
  margin-bottom: 8px;
}

.intro-card h2 {
  font-size: 28px;
  margin-bottom: 12px;
}

.frog-speech {
  font-size: 16px;
  color: var(--muted);
  line-height: 1.5;
  margin-bottom: 22px;
}

.rules {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: left;
  margin-bottom: 26px;
}

.intro-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
}

.rule {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: var(--card2);
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.45;
}

.rule-icon {
  font-size: 18px;
  flex-shrink: 0;
}

/* === Раскладка теста === */
.test-layout,
.result-layout {
  display: flex;
  gap: 20px;
  padding: 20px 24px;
  flex: 1;
  align-items: flex-start;
}

.types-panel {
  width: 408px;
  flex-shrink: 0;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 16px;
  position: sticky;
  top: 80px;
}

.panel-title {
  font-size: 16px;
  margin: 0 0 12px;
}

.forecast-card {
  background: var(--card2);
  border: 1px dashed var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
}

.forecast-title {
  font-size: 13px;
  color: var(--muted);
  margin: 0 0 8px;
}

.forecast-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.forecast-thumb {
  width: 86px;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  padding: 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.forecast-thumb.clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.forecast-thumb.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
}

.thumb-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.thumb-img {
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--tc);
  border: 1px dashed var(--tc);
  word-break: break-all;
  padding: 0 4px;
  line-height: 1.2;
}

.thumb-img-real {
  width: 100%;
  height: 88px;
  object-fit: cover;
  border-radius: 6px;
  display: block;
}

.thumb-code {
  margin-top: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--tc);
}

.forecast-empty {
  font-size: 13px;
  color: var(--muted);
  margin: 0;
}

.types-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.type-tile {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 4px;
  text-align: center;
  transition: opacity 0.3s ease, transform 0.2s ease;
  min-height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
}

.type-tile.best {
  transform: scale(1.06);
  z-index: 2;
}

.type-code {
  font-size: 15px;
  font-weight: 700;
}

.type-name {
  font-size: 12px;
  color: var(--muted);
}

.axes-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.axis-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-size: 12px;
}

.axis-letters {
  font-weight: 700;
  color: var(--accent);
  white-space: nowrap;
}

.axis-note {
  color: var(--muted);
  text-align: right;
}

/* === Зона вопроса === */
.quiz-area,
.result-card {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.phase-badge {
  align-self: flex-start;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(66, 184, 131, 0.14);
  color: var(--accent);
}

.phase-badge.second {
  background: rgba(245, 166, 35, 0.16);
  color: #f5a623;
}

.question-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
}

.frog-bubble {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--card2);
  border-radius: 14px;
  padding: 10px 14px;
  margin-bottom: 18px;
}

.frog-face {
  font-size: 26px;
  flex-shrink: 0;
}

.frog-quip {
  font-size: 14px;
  color: var(--muted);
  line-height: 1.4;
}

.question-text {
  font-size: 19px;
  line-height: 1.55;
  margin-bottom: 6px;
  text-align: center;
}

.scale-container {
  margin-top: 18px;
}

.scale-positioner {
  position: relative;
  width: max-content;
  max-width: 100%;
  margin: 0 auto;
}

.circles-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 0;
}

.circle-btn {
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--card2);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.18s ease;
  flex-shrink: 0;
}

.circle-btn:hover {
  transform: scale(1.12);
  border-color: var(--accent);
}

.circle-btn.selected {
  border-color: var(--accent);
  background: var(--accent);
  transform: scale(1.12);
  box-shadow: 0 0 14px rgba(66, 184, 131, 0.6);
}

.circle-btn.selected .circle-inner {
  background: #fff;
}

.circle-inner {
  width: 34%;
  height: 34%;
  border-radius: 50%;
  background: transparent;
  transition: background 0.18s ease;
}

.scale-captions {
  position: relative;
  margin-top: 4px;
  height: 18px;
}

.cap {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.scale-hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--muted);
  text-align: center;
}

.quiz-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.answered-hint {
  font-size: 13px;
  color: var(--muted);
}

.primary-btn {
  padding: 10px 22px;
  border-radius: 24px;
  border: none;
  background: linear-gradient(135deg, var(--accent), #2d9d6f);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(66, 184, 131, 0.4);
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

/* === Результат === */
.result-card {
  max-width: 760px;
}

.result-type {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.type-card-img {
  width: 220px;
  height: 300px;
  border: 2px solid var(--border);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 18px;
  overflow: hidden;
}

.card-img-real {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: var(--card);
}

.card-img-icon {
  font-size: 42px;
}

.card-img-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--tc);
  word-break: break-all;
  padding: 0 12px;
}

.card-img-note {
  font-size: 12px;
  color: var(--muted);
}

.result-code {
  font-size: 52px;
  font-weight: 800;
  letter-spacing: 2px;
}

.result-name {
  font-size: 22px;
  font-weight: 600;
  margin-top: 4px;
}

.result-desc {
  margin-top: 10px;
  font-size: 15px;
  color: var(--muted);
  max-width: 560px;
  line-height: 1.5;
}

.truth-block {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px 24px;
}

.truth-title {
  font-size: 14px;
  color: var(--muted);
  margin-bottom: 10px;
}

.truth-gauge {
  display: flex;
  align-items: center;
  gap: 14px;
}

.truth-track {
  flex: 1;
  height: 16px;
  border-radius: 10px;
  background: var(--card2);
  overflow: hidden;
}

.truth-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.5s ease;
}

.truth-value {
  font-size: 24px;
  font-weight: 800;
}

.truth-verdict {
  margin-top: 10px;
  font-size: 14px;
  color: var(--text);
}

.dim-bars {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dim-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dim-name {
  font-size: 12px;
  color: var(--muted);
  width: 150px;
  flex-shrink: 0;
}

.dim-left {
  text-align: right;
}

.dim-right {
  text-align: left;
}

.bar-track {
  flex: 1;
  height: 12px;
  border-radius: 8px;
  background: var(--card2);
  overflow: hidden;
  display: flex;
}

.bar-positive {
  background: linear-gradient(90deg, var(--accent), #2d9d6f);
}

.bar-negative {
  background: linear-gradient(90deg, #5b8def, #646cff);
}

.dim-pct {
  font-size: 12px;
  color: var(--muted);
  width: 42px;
  flex-shrink: 0;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

/* === Адаптивность === */
@media (max-width: 1080px) {
  .test-layout,
  .result-layout {
    flex-direction: column;
    align-items: stretch;
  }

  .types-panel {
    width: 100%;
    position: static;
  }

  .mbti-header {
    flex-wrap: wrap;
  }

  .header-progress {
    order: 3;
    width: 100%;
  }

  .dim-name {
    width: 110px;
  }
}

@media (max-width: 560px) {
  .types-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .intro-card {
    padding: 24px 18px;
  }

  .dim-name {
    display: none;
  }
}

.preview-overlay {
  position: fixed;
  inset: 0;
  z-index: 20000;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.preview-box {
  position: relative;
  max-width: 96vw;
  max-height: 92vh;
}

.preview-img {
  display: block;
  max-width: 96vw;
  max-height: 92vh;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.55);
}

.preview-close {
  position: absolute;
  top: -14px;
  right: -14px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-close:hover {
  background: rgba(0, 0, 0, 0.85);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>