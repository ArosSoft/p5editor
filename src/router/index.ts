import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

// Lazy loading компонентов
const EditorPage = () => import('../views/EditorPage.vue')
const ExplorePage = () => import('../views/ExplorePage.vue')
const SketchDetailPage = () => import('../views/SketchDetailPage.vue')
const SharePage = () => import('../views/SharePage.vue')
const AdminDashboard = () => import('../views/AdminDashboard.vue')
const ProfilePage = () => import('../views/ProfilePage.vue')
const DashboardPage = () => import('../views/DashboardPage.vue')

const routes = [
  {
    path: '/',
    name: 'editor',
    component: EditorPage,
    meta: { title: 'Редактор' }
  },
  {
    path: '/explore',
    name: 'explore',
    component: ExplorePage,
    meta: { title: 'Исследуй' }
  },
  {
    path: '/sketch/:id',
    name: 'sketch-detail',
    component: SketchDetailPage,
    meta: { title: 'Скетч' }
  },
  {
    path: '/share',
    name: 'share',
    component: SharePage,
    meta: { title: 'Поделиться', requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminDashboard,
    meta: { title: 'Админ-панель', requiresModerator: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
    meta: { title: 'Профиль', requiresAuth: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardPage,
    meta: { title: 'Личный кабинет', requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Обновление заголовка страницы при навигации и защита маршрутов
router.beforeEach(async (to, from, next) => {
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} — p5editor`
  }

  // Ждём готовности авторизации перед проверкой прав
  const { isReady, readyPromise } = useAuth()
  if (!isReady.value && readyPromise.value) {
    await readyPromise.value
  }

  // Проверка авторизации через localStorage (роль сохраняется при входе)
  // user_role устанавливается в useAuth при загрузке профиля
  if (to.meta.requiresAuth) {
    const userRole = localStorage.getItem('user_role')
    // Если роль есть (user, moderator, admin) - доступ разрешён
    const hasUserRole = userRole === 'user' || userRole === 'moderator' || userRole === 'admin'

    if (!hasUserRole) {
      // Перенаправляем на главную с параметром для открытия модального окна входа
      next({ path: '/', query: { auth: 'required' } })
      return
    }
  }

  // Проверка доступа к админ-панели
  if (to.meta.requiresModerator) {
    const userRole = localStorage.getItem('user_role')
    const isModerator = userRole === 'moderator' || userRole === 'admin'

    if (!isModerator) {
      next('/')
      return
    }
  }

  next()
})

export default router
