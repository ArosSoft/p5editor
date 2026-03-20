import { createRouter, createWebHashHistory } from 'vue-router'

// Lazy loading компонентов
const EditorPage = () => import('../views/EditorPage.vue')
const ExplorePage = () => import('../views/ExplorePage.vue')
const SketchDetailPage = () => import('../views/SketchDetailPage.vue')
const SharePage = () => import('../views/SharePage.vue')

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
    meta: { title: 'Поделиться' }
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

// Обновление заголовка страницы при навигации
router.beforeEach((to, from, next) => {
  const title = to.meta.title as string
  if (title) {
    document.title = `${title} — p5editor`
  }
  next()
})

export default router
