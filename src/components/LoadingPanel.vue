<template>
  <transition name="fade">
    <div v-if="visible" class="loading-overlay">
      <div class="loading-panel">
        <div class="loading-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>

        <div class="loading-content">
          <div class="loading-title">Загрузка</div>
          <div class="loading-joke">
            <span class="joke-emoji">{{ currentJoke!.emoji }}</span>
            <span class="joke-text">{{ currentJoke!.text }}</span>
          </div>
          <div class="loading-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
            <div class="progress-text">{{ progress }}%</div>
          </div>
          <div class="supabase-status" :class="statusClass">
            <span class="status-indicator"></span>
            <span class="status-text">{{ statusText }}</span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'

const props = defineProps<{
  visible: boolean
}>()

const progress = ref(0)
const supabaseStatus = ref<'checking' | 'connected' | 'error'>('checking')
const avgResponseTime = ref<number | null>(null)

const statusClass = computed(() => ({
  'status-checking': supabaseStatus.value === 'checking',
  'status-connected': supabaseStatus.value === 'connected',
  'status-error': supabaseStatus.value === 'error'
}))

const statusText = computed(() => {
  if (supabaseStatus.value === 'checking') {
    return 'Проверка Supabase...'
  } else if (supabaseStatus.value === 'connected') {
    return avgResponseTime.value 
      ? `Supabase: подключено (${Math.round(avgResponseTime.value)}мс)` 
      : 'Supabase: подключено'
  } else {
    return 'Supabase: ошибка соединения'
  }
})

const jokes = [
  { text: 'Не переживай, если не все работает как надо. Если бы все работало хорошо, то ты бы здесь давно уже не работал.', emoji: '😄' },
  { text: 'С программистами есть страшная проблема — ты не сможешь понять, что он делает, пока не будет совсем поздно.', emoji: '😱' },
  { text: 'Тру-программист всегда смотрит и налево, и направо до того, как перейти улицу с односторонним движением.', emoji: '🚦' },
  { text: 'Плохо написанное ПО одного — кропотливая работа другого.', emoji: '📋' },
  { text: 'Код писать надо так, словно человек, который будет его поддерживать — психопат, который знает, где ты живешь.', emoji: '😈' },
  { text: 'Не получилось написать хорошую программу с первого раза, тогда назовите ее "первой версией".', emoji: '📌' },
  { text: 'Только придя на работу, не торопись приступать к ней — пускай персональный компьютер прогреется минут 20.', emoji: '🖥️' },
  { text: 'Компьютер — это настоящее зло, но если его выключить, появляются два новых зла: телевизор и холодильник.', emoji: '📺' },
  { text: 'Есть два основных языка программирования: одним – все недовольны, а другими никто не пользовался.', emoji: '�' },
  { text: 'Всегда мало времени, чтобы разработать проект, но его всегда хватает, чтобы сделать в 2 раза больше багов.', emoji: '🐞' },
  { text: 'Между практикой и теорией нету никакой разницы. Но во время практики она есть.', emoji: '📚' },
  { text: 'Доверять компьютерам можно до тех пор, пока они не научатся мыслить самостоятельно.', emoji: '🤖' },
  { text: 'Нет плохого кода, есть тот, который неправильно поняли.', emoji: '🤔' },
  { text: 'Прежде чем удалить файл, посмотри — твой ли он.', emoji: '🗑️' },
  { text: 'Надежные компоненты те, которых нету.', emoji: '🗑️' },
  { text: 'Если айтишник пришел вовремя — значит он был там всю ночь.', emoji: '🌙' },
  { text: 'Проблема с большим количеством мыслей в голове — воспользуйся архиватором!', emoji: '📁' },
  { text: 'Бог создал весь мир за 6 дней по одной причине – у него не было предыдущих версий.', emoji: '⚡' },
  { text: 'Хотите получать только пользу от программирования? Ответ прост! Не программируйте.', emoji: '🚫' },
  { text: 'ПК хорошо выполняет инструкции, а не читает ваши мысли.', emoji: '🎯' },
  { text: 'Баг — это еще не записанная фича.', emoji: '✨' }
]

const currentJokeIndex = ref(0)
const currentJoke = computed(() => jokes[currentJokeIndex.value] || jokes[0])

let progressInterval: number | null = null
let jokeInterval: number | null = null

// Функция для выбора случайной шутки (без повторений подряд)
const getRandomJokeIndex = () => {
  let newIndex
  do {
    newIndex = Math.floor(Math.random() * jokes.length)
  } while (newIndex === currentJokeIndex.value && jokes.length > 1)
  return newIndex
}

// Функция проверки доступности Supabase
const checkSupabaseConnection = async () => {
  const startTime = Date.now()
  try {
    // Пробуем сделать простой запрос к API
    const { data, error } = await supabase
      .from('sketches')
      .select('id')
      .limit(1)
    
    const responseTime = Date.now() - startTime
    
    if (error) {
      // Если есть ошибка, но это не ошибка сети - считаем что соединение есть
      if (error.status === 400 || error.status === 401 || error.status === 403) {
        supabaseStatus.value = 'connected'
        avgResponseTime.value = responseTime
      } else {
        supabaseStatus.value = 'error'
      }
    } else {
      supabaseStatus.value = 'connected'
      avgResponseTime.value = responseTime
    }
  } catch (e) {
    // Ошибка сети или таймаут
    supabaseStatus.value = 'error'
  }
}

onMounted(() => {
  // Выбираем случайную шутку при монтировании
  currentJokeIndex.value = getRandomJokeIndex()

  // Проверяем соединение с Supabase
  checkSupabaseConnection()

  progressInterval = window.setInterval(() => {
    progress.value = Math.min(progress.value + 5, 100)
  }, 200)

  jokeInterval = window.setInterval(() => {
    currentJokeIndex.value = getRandomJokeIndex()
  }, 7000)
})

onUnmounted(() => {
  if (progressInterval) clearInterval(progressInterval)
  if (jokeInterval) clearInterval(jokeInterval)
})

// Сброс прогресса при повторном показе
watch(() => props.visible, (newVal) => {
  if (newVal) {
    progress.value = 0
  }
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7) url('/images/lighthouse.png') left center / contain no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.loading-panel {
  background: linear-gradient(145deg, #2a2a2a, #1e1e1e);
  border: 1px solid #333;
  border-radius: 16px;
  padding: 40px 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  min-width: 400px;
  margin-left: auto;
  margin-right: 10%;
}

.loading-spinner {
  position: relative;
  width: 80px;
  height: 80px;
}

.spinner-ring {
  position: absolute;
  border: 4px solid transparent;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.spinner-ring:nth-child(1) {
  width: 80px;
  height: 80px;
  border-top-color: #42b883;
  animation: spin 2s linear infinite;
}

.spinner-ring:nth-child(2) {
  width: 60px;
  height: 60px;
  border-right-color: #36a76f;
  animation: spin-reverse 1.5s linear infinite;
  top: 10px;
  left: 10px;
}

.spinner-ring:nth-child(3) {
  width: 40px;
  height: 40px;
  border-bottom-color: #42b883;
  animation: spin 1s linear infinite;
  top: 20px;
  left: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes spin-reverse {
  to {
    transform: rotate(-360deg);
  }
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 16px;
}

.loading-title {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.loading-joke {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(66, 184, 131, 0.1);
  border-radius: 8px;
  padding: 12px 16px;
  width: 100%;
}

.joke-emoji {
  font-size: 28px;
  flex-shrink: 0;
}

.joke-text {
  font-size: 14px;
  color: #cccccc;
  line-height: 1.4;
  text-align: center;
}

.loading-progress {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #42b883, #36a76f);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #42b883;
  font-weight: 600;
  min-width: 45px;
  text-align: right;
}

.supabase-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.status-text {
  color: #999999;
  font-weight: 500;
}

.status-checking .status-indicator {
  background: #ff9800;
  animation: pulse 1.5s ease-in-out infinite;
}

.status-checking .status-text {
  color: #ff9800;
}

.status-connected .status-indicator {
  background: #42b883;
  box-shadow: 0 0 8px rgba(66, 184, 131, 0.5);
}

.status-connected .status-text {
  color: #42b883;
}

.status-error .status-indicator {
  background: #f44336;
  box-shadow: 0 0 8px rgba(244, 67, 54, 0.5);
}

.status-error .status-text {
  color: #f44336;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
