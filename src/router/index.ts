import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'

// Lazy loading компонентов
const EditorPage = () => import('../views/EditorPage.vue')
const ExplorePage = () => import('../views/ExplorePage.vue')
const SketchDetailPage = () => import('../views/SketchDetailPage.vue')
const SharePage = () => import('../views/SharePage.vue')
const AdminDashboard = () => import('../views/AdminDashboard.vue')
const CreateUsersPage = () => import('../views/CreateUsersPage.vue')
const ProfilePage = () => import('../views/ProfilePage.vue')
const DashboardPage = () => import('../views/DashboardPage.vue')
const UpdatePasswordPage = () => import('../views/UpdatePasswordPage.vue')

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
    path: '/create-users',
    name: 'create-users',
    component: CreateUsersPage,
    meta: { title: 'Создание пользователей', requiresModerator: true }
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
  },
  {
    path: '/update-password',
    name: 'update-password',
    component: UpdatePasswordPage,
    meta: { title: 'Обновление пароля' }
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

  // Получаем состояние авторизации
  const { user, session, isReady, readyPromise } = useAuth()
  
  // Ждём готовности авторизации перед проверкой прав
  if (!isReady.value && readyPromise.value) {
    await readyPromise.value
  }

  // Проверка авторизации через восстанавливаемую сессию
  if (to.meta.requiresAuth) {
    if (!user.value && !session.value) {
      next({ path: '/', query: { auth: 'required' } })
      return
    }
  }

  // Проверка доступа к модераторским разделам
  if (to.meta.requiresModerator) {
    if (!user.value && !session.value) {
      next('/')
      return
    }
    const { isModerator } = useAuth()
    if (!isModerator.value) {
      next('/')
      return
    }
  }

  next()
})

export default router
