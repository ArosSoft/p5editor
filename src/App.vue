<script setup lang="ts">
import { RouterView } from 'vue-router'
import { ref, onMounted, onUnmounted, watch } from 'vue'
import LoadingPanel from './components/LoadingPanel.vue'

const isLoading = ref(true)
const networkSpeed = ref<'fast' | 'slow'>('fast')

// Проверка скорости соединения
const checkNetworkSpeed = () => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  
  if (connection) {
    // effectiveType: 'slow-2g', '2g', '3g', '4g'
    const type = connection.effectiveType
    const isSlow = type === 'slow-2g' || type === '2g' || type === '3g'
    networkSpeed.value = isSlow ? 'slow' : 'fast'
  }
}

// Имитация загрузки с проверкой сети
const simulateLoading = () => {
  checkNetworkSpeed()
  
  // Панель показывается минимум 3 секунды всегда
  const loadTime = 3000
  
  setTimeout(() => {
    isLoading.value = false
  }, loadTime)
}

onMounted(() => {
  simulateLoading()
  
  // Слушаем изменения качества соединения
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  if (connection) {
    connection.addEventListener('change', checkNetworkSpeed)
  }
})

onUnmounted(() => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  if (connection) {
    connection.removeEventListener('change', checkNetworkSpeed)
  }
})
</script>

<template>
  <div id="app">
    <LoadingPanel :visible="isLoading" />
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style>
:root {
  --bg-primary: #1e1e1e;
  --bg-secondary: #2a2a2a;
  --bg-tertiary: #333333;
  --text-primary: #ffffff;
  --text-secondary: #aaaaaa;
  --accent-color: #42b883;
  --accent-hover: #36a76f;
  --border-color: #333333;
  --error-color: #ef4444;
  --success-color: #42b883;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Main */
.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
