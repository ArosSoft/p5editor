import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { clickOutside } from './directives/clickOutside'
import { initAuth } from './composables/useAuth'

const app = createApp(App)
app.use(router)
app.directive('click-outside', clickOutside)

// Инициализация авторизации перед монтированием
initAuth().then(() => {
  app.mount('#app')
})