import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { clickOutside } from './directives/clickOutside'

const app = createApp(App)
app.use(router)
app.directive('click-outside', clickOutside)

// Монтируем приложение сразу для быстрой отрисовки
app.mount('#app')

// Инициализация авторизации в фоне (не блокирует рендеринг)
import('./composables/useAuth').then(({ initAuth }) => {
  initAuth()
})