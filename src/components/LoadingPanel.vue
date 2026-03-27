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
            <span class="joke-emoji">{{ currentJoke.emoji }}</span>
            <span class="joke-text">{{ currentJoke.text }}</span>
          </div>
          <div class="loading-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progress + '%' }"></div>
            </div>
            <div class="progress-text">{{ progress }}%</div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const progress = ref(0)

const jokes = [
  { text: 'Загружаю... Как программисты считают овец: 1, 2, 3, 4, 5... overflow!', emoji: '🐑' },
  { text: 'Почему программисты путают Хэллоуин и Рождество? Потому что 31 OCT = 25 DEC!', emoji: '🎃' },
  { text: 'Сколько программистов нужно, чтобы поменять лампочку? Ни одного, это аппаратная проблема!', emoji: '💡' },
  { text: 'Почему Java-программисты носят очки? Потому что они плохо видят без C#!', emoji: '👓' },
  { text: 'Алгоритм загрузки: если работает — не трогай, если не работает — перезагрузи!', emoji: '🔄' },
  { text: 'Почему программисты не любят природу? Там слишком много багов!', emoji: '🐛' },
  { text: 'Загрузка... 99% завершено. Осталось только понять, куда делись остальные 1%!', emoji: '📊' },
  { text: 'Почему Python-разработчики всегда спокойны? Потому что у них есть try-except!', emoji: '🐍' },
  { text: 'Компилятор компилирует, интерпретатор интерпретирует, а загрузчик... загружает!', emoji: '⚙️' },
  { text: 'Почему JavaScript-разработчики не играют в прятки? Потому что их код всё равно везде!', emoji: '🔍' },
  { text: 'Загрузка... Если долго смотреть на прогресс-бар, он загрузится быстрее!', emoji: '👀' },
  { text: 'Почему C++ программисты не ходят на вечеринки? Потому что там нет указателей на веселье!', emoji: '🎉' },
  { text: 'Ваш код загружается. Помните: работает — не трогай!', emoji: '🛠️' },
  { text: 'Почему базы данных грустные? У них слишком много связей!', emoji: '🗄️' },
  { text: 'Загрузка... CSS позиционирует этот текст ровно там, где вы не ожидали!', emoji: '📐' },
  { text: 'Почему Go-разработчики оптимисты? Потому что они верят в goroutines!', emoji: '🐹' },
  { text: 'Загружаю ресурсы... Git говорит, что всё закоммичено, но где файлы?', emoji: '📦' },
  { text: 'Почему PHP-разработчики не грустят? Потому что они уже привыкли ко всему!', emoji: '🐘' },
  { text: 'Загрузка... Помните: сначала попробуй выключить и включить!', emoji: '🔌' },
  { text: 'Почему Rust-разработчики в безопасности? Потому что borrow checker их защитит!', emoji: '🦀' },
  { text: 'Не переживай, если не все работает как надо. Если бы все  работало хорошо , то ты бы здесь давно уже не работал.', emoji: '🐹' }
]

const currentJokeIndex = ref(0)
const currentJoke = computed(() => jokes[currentJokeIndex.value])

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

onMounted(() => {
  // Выбираем случайную шутку при монтировании
  currentJokeIndex.value = getRandomJokeIndex()
  
  progressInterval = window.setInterval(() => {
    progress.value = Math.min(progress.value + Math.random() * 3, 95)
  }, 200)

  jokeInterval = window.setInterval(() => {
    currentJokeIndex.value = getRandomJokeIndex()
  }, 3000)
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
  background: rgba(0, 0, 0, 0.85);
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
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  width: 60px;
  height: 60px;
  border-right-color: #36a76f;
  animation-delay: -0.4s;
  top: 10px;
  left: 10px;
}

.spinner-ring:nth-child(3) {
  width: 40px;
  height: 40px;
  border-bottom-color: #42b883;
  animation-delay: -0.8s;
  top: 20px;
  left: 20px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
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
  border: 1px solid rgba(66, 184, 131, 0.2);
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

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
