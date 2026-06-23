import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { clickOutside } from './directives/clickOutside'
import { initAuth } from './composables/useAuth'

async function bootstrap() {
  await initAuth()

  const app = createApp(App)
  app.use(router)
  app.directive('click-outside', clickOutside)
  app.mount('#app')
}

bootstrap()