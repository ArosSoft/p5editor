import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { clickOutside } from './directives/clickOutside'
import { initAuth } from './composables/useAuth'

/**
 * Авторизацию и профиль грузим уже ПОСЛЕ отрисовки основного интерфейса.
 *
 * На новом компьютере (пустой localStorage, нет кэша сессии)
 * supabase.auth.getSession() уходит в сеть и может отвечать ~10 секунд.
 * Раньше initAuth() вызывался до mount(), поэтому первая загрузка ждала сеть:
 * пользователь видел пустую страницу даже без заставки.
 */
function startAuthAfterFirstPaint() {
  const start = () => {
    initAuth().catch((error) => {
      console.error('[Auth] Ошибка фоновой инициализации:', error)
    })
  }

  if (typeof requestAnimationFrame === 'function' && document.visibilityState === 'visible') {
    // Ждём первую отрисовку (заставка загрузки + редактор), затем стартуем сеть
    requestAnimationFrame(() => window.setTimeout(start, 0))
  } else {
    // Фоновая вкладка: rAF не тикает, но запрос можно начинать сразу
    window.setTimeout(start, 0)
  }
}

function bootstrap() {
  const app = createApp(App)
  app.use(router)
  app.directive('click-outside', clickOutside)
  app.mount('#app')

  startAuthAfterFirstPaint()
}

bootstrap()