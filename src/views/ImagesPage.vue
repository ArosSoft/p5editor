<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import {
  useCloudinary,
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES
} from '../composables/useCloudinary'
import CloudinaryOnboarding from '../components/images/CloudinaryOnboarding.vue'
import type { CloudinaryImage } from '../types/supabase'

const route = useRoute()
const router = useRouter()
const { user, session, isAuthenticated, isReady, readyPromise } = useAuth()

// Состояние Cloudinary (refs раскрываются в шаблоне автоматически)
const {
  account,
  accountLoading,
  images,
  imagesLoading,
  imagesError,
  imagesLoaded,
  totalCount,
  nextCursor,
  unlinking,
  loadAccount,
  loadImages,
  loadMoreImages,
  loadUsage,
  unlinkAccount,
  uploadImage,
  deleteImage,
  deletingId,
  usage,
  usageLoading
} = useCloudinary()

// Тема (синхронизация с редактором)
type Theme = 'dark' | 'light'
const currentTheme = ref<Theme>('dark')

function syncThemeFromStorage() {
  const savedTheme = localStorage.getItem('p5editor-theme') as Theme | null
  if (savedTheme === 'dark' || savedTheme === 'light') {
    currentTheme.value = savedTheme
  }
}

const themeClass = computed(() =>
  currentTheme.value === 'dark' ? 'theme-dark' : 'theme-light'
)

// Показывать форму привязки заново (обновление ключей)
const showOnboarding = ref(false)

// Отвязка аккаунта
const showUnlinkModal = ref(false)

// Вид списка: плитка или список (запоминаем выбор)
type ViewMode = 'grid' | 'list'
const viewMode = ref<ViewMode>('grid')

function syncViewModeFromStorage() {
  const saved = localStorage.getItem('p5editor-images-view')
  if (saved === 'grid' || saved === 'list') {
    viewMode.value = saved
  }
}

function setViewMode(mode: ViewMode) {
  viewMode.value = mode
  localStorage.setItem('p5editor-images-view', mode)
}

// Просмотр картинки (модальное окно)
const selectedImage = ref<CloudinaryImage | null>(null)
const urlInput = ref<HTMLInputElement | null>(null)

// Уведомление
const notification = ref<{ message: string; type: 'success' | 'error' } | null>(null)

function showNotification(message: string, type: 'success' | 'error') {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 3000)
}

const displayName = computed(() => {
  return user.value?.email || 'Аноним'
})

const isLinked = computed(() => account.value !== null)

// Использование аккаунта Cloudinary (для блока «План и кредиты»)
const usagePercent = computed(() => {
  const credits = usage.value?.credits
  if (!credits) return null
  if (typeof credits.used_percent === 'number') {
    return Math.max(0, Math.min(100, Math.round(credits.used_percent)))
  }
  if (credits.limit) {
    return Math.max(0, Math.min(100, Math.round((credits.usage / credits.limit) * 100)))
  }
  return null
})

const planLabel = computed(() => {
  const plan = usage.value?.plan
  if (!plan) return 'Cloudinary'
  return plan.toLowerCase() === 'free' ? 'Бесплатный план' : plan
})

// ─── Демо-режим: только для разработки ───────────────────────────────
// Позволяет посмотреть интерфейс списка без подключённого аккаунта:
//   /#/images?demo=1
// В production-сборке этот код недоступен (import.meta.env.DEV === false).
const isDemoMode = ref(false)

const DEMO_IMAGES: CloudinaryImage[] = [
  { public_id: 'sample', format: 'jpg', bytes: 120253, width: 864, height: 576, created_at: '2026-11-01T12:00:00Z', secure_url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg', display_name: 'Кот в очках', folder: null, cloud_name: 'demo' },
  { public_id: 'cld-sample', format: 'jpg', bytes: 304429, width: 960, height: 640, created_at: '2026-10-24T09:30:00Z', secure_url: 'https://res.cloudinary.com/demo/image/upload/cld-sample.jpg', display_name: 'Закат на море', folder: null, cloud_name: 'demo' },
  { public_id: 'cld-sample-2', format: 'jpg', bytes: 235986, width: 960, height: 640, created_at: '2026-10-18T15:10:00Z', secure_url: 'https://res.cloudinary.com/demo/image/upload/cld-sample-2.jpg', display_name: 'Лесная тропинка', folder: null, cloud_name: 'demo' },
  { public_id: 'cld-sample-3', format: 'jpg', bytes: 181113, width: 960, height: 640, created_at: '2026-10-05T08:45:00Z', secure_url: 'https://res.cloudinary.com/demo/image/upload/cld-sample-3.jpg', display_name: 'Воздушный шар', folder: null, cloud_name: 'demo' },
  { public_id: 'cld-sample-4', format: 'jpg', bytes: 255472, width: 960, height: 640, created_at: '2026-09-27T19:20:00Z', secure_url: 'https://res.cloudinary.com/demo/image/upload/cld-sample-4.jpg', display_name: 'Горный пейзаж', folder: null, cloud_name: 'demo' },
  { public_id: 'cld-sample-5', format: 'jpg', bytes: 212034, width: 960, height: 640, created_at: '2026-09-11T11:05:00Z', secure_url: 'https://res.cloudinary.com/demo/image/upload/cld-sample-5.jpg', display_name: 'Цветы', folder: null, cloud_name: 'demo' }
]

function startDemoMode() {
  isDemoMode.value = true
  account.value = {
    user_id: 'demo-user-id',
    cloud_name: 'demo-cloud',
    api_key: '123456789012345',
    cloudinary_email: user.value?.email ?? 'demo@example.com',
    verified: true,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z'
  }
  images.value = DEMO_IMAGES
  imagesLoaded.value = true
  totalCount.value = DEMO_IMAGES.length
  nextCursor.value = null
  usage.value = { plan: 'Free', credits: { usage: 7.5, limit: 25, used_percent: 30 } }
}

async function refreshImages() {
  if (isDemoMode.value) {
    showNotification('Демо-режим: обновление недоступно', 'error')
    return
  }
  await loadImages(true)
  loadUsage()
}

function switchStorageProvider() {
  const query: Record<string, string> = { choose: '1' }
  if (isDemoMode.value) query.demo = '1'
  router.push({ path: '/images', query })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatBytes(bytes: number): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
}

/**
 * Ссылка на превью через трансформации Cloudinary:
 * res.cloudinary.com/<cloud>/image/upload/<трансформация>/<public_id>.<format>
 */
function imageUrl(img: CloudinaryImage, transform: string): string {
  if (!img.format) return img.secure_url
  const publicId = img.public_id
    .split('/')
    .map(segment => encodeURIComponent(segment))
    .join('/')
  return `https://res.cloudinary.com/${img.cloud_name}/image/upload/${transform}/${publicId}.${img.format}`
}

function thumbUrl(img: CloudinaryImage): string {
  return imageUrl(img, 'c_fill,w_320,h_240,q_auto,f_auto')
}

function smallUrl(img: CloudinaryImage): string {
  return imageUrl(img, 'c_fill,w_72,h_72,q_auto,f_auto')
}

function bigUrl(img: CloudinaryImage): string {
  return imageUrl(img, 'c_limit,w_900,q_auto')
}

onMounted(async () => {
  syncThemeFromStorage()
  syncViewModeFromStorage()

  if (import.meta.env.DEV && route.query.demo === '1') {
    startDemoMode()
    return
  }

  if (!isReady.value && readyPromise.value) {
    await readyPromise.value
  }

  if (!user.value && !session.value) {
    router.push('/')
    return
  }

  await loadAccount()
  if (account.value) {
    await loadImages(true)
    loadUsage()
  }
})

async function handleLinked() {
  showOnboarding.value = false
  showNotification('Аккаунт Cloudinary подключён!', 'success')
  await loadImages(true)
  loadUsage()
}

function startEditingKeys() {
  showOnboarding.value = true
}

async function handleUnlink() {
  const result = await unlinkAccount()
  showUnlinkModal.value = false
  if (result.success) {
    showNotification('Аккаунт Cloudinary отвязан', 'success')
  } else {
    showNotification(result.error || 'Не удалось отвязать аккаунт', 'error')
  }
}

function openImage(img: CloudinaryImage) {
  deleteConfirm.value = false
  deleteError.value = null
  selectedImage.value = img
}

function closeImage() {
  if (deletingId.value) return
  selectedImage.value = null
  deleteConfirm.value = false
  deleteError.value = null
}

// Удаление картинки (с подтверждением в окне просмотра)
const deleteConfirm = ref(false)
const deleteError = ref<string | null>(null)

async function handleDelete() {
  const img = selectedImage.value
  if (!img || deletingId.value) return
  deleteError.value = null

  // Демо-режим: удаляем только из локального списка
  if (isDemoMode.value) {
    images.value = images.value.filter(item => item.public_id !== img.public_id)
    if (totalCount.value !== null) totalCount.value = Math.max(0, totalCount.value - 1)
    closeImage()
    showNotification('Демо: картинка удалена', 'success')
    return
  }

  const result = await deleteImage(img.public_id)
  if (result.success) {
    closeImage()
    showNotification('Картинка удалена', 'success')
  } else {
    deleteError.value = result.error || 'Не удалось удалить картинку. Попробуй ещё раз.'
  }
}

async function copyImageUrl() {
  if (!selectedImage.value) return
  try {
    await navigator.clipboard.writeText(selectedImage.value.secure_url)
    showNotification('Ссылка скопирована!', 'success')
  } catch {
    // Браузер не дал доступ к буферу — выделяем ссылку, чтобы скопировать вручную
    urlInput.value?.select()
    showNotification('Выдели ссылку и нажми Ctrl+C', 'error')
  }
}

// ─── Загрузка картинки ──────────────────────────────────────────────
const showUploadModal = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadFile = ref<File | null>(null)
const uploadPreviewUrl = ref<string | null>(null)
const uploadError = ref<string | null>(null)
const uploading = ref(false)
const uploadProgress = ref(0)
const dragActive = ref(false)

function openUpload() {
  resetUploadSelection()
  uploadError.value = null
  uploadProgress.value = 0
  showUploadModal.value = true
}

function resetUploadSelection() {
  if (uploadPreviewUrl.value) URL.revokeObjectURL(uploadPreviewUrl.value)
  uploadPreviewUrl.value = null
  uploadFile.value = null
}

function closeUpload() {
  if (uploading.value) return
  showUploadModal.value = false
  resetUploadSelection()
  uploadError.value = null
  uploadProgress.value = 0
}

/** Проверить файл и поставить его на загрузку (из выбора или drag&drop). */
function setUploadFile(file: File) {
  uploadError.value = null
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    uploadError.value = 'Это не картинка. Подходят PNG, JPG, GIF и WebP.'
    return
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    uploadError.value = 'Файл больше 10 МБ. Выбери картинку поменьше.'
    return
  }
  if (uploadPreviewUrl.value) URL.revokeObjectURL(uploadPreviewUrl.value)
  uploadFile.value = file
  uploadPreviewUrl.value = URL.createObjectURL(file)
}

function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) setUploadFile(file)
  // Сбрасываем input, чтобы можно было выбрать тот же файл ещё раз
  input.value = ''
}

function onDrop(event: DragEvent) {
  dragActive.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) setUploadFile(file)
}

async function handleUpload() {
  const file = uploadFile.value
  if (!file || uploading.value) return

  uploadError.value = null
  uploading.value = true
  uploadProgress.value = 0

  // Демо-режим: показываем прогресс и добавляем картинку локально
  if (isDemoMode.value) {
    for (const percent of [20, 45, 70, 90, 100]) {
      await new Promise(resolve => setTimeout(resolve, 180))
      uploadProgress.value = percent
    }
    images.value = [
      {
        public_id: `demo-${Date.now()}`,
        format: '',
        bytes: file.size,
        width: 0,
        height: 0,
        created_at: new Date().toISOString(),
        secure_url: URL.createObjectURL(file),
        display_name: file.name.replace(/\.[^.]+$/, ''),
        folder: null,
        cloud_name: 'demo'
      },
      ...images.value
    ]
    if (totalCount.value !== null) totalCount.value += 1
    uploading.value = false
    closeUpload()
    showNotification('Демо: картинка «загружена» 🎉', 'success')
    return
  }

  const result = await uploadImage(file, percent => {
    uploadProgress.value = percent
  })
  uploading.value = false

  if (result.success) {
    if (result.image) {
      images.value = [result.image, ...images.value]
      if (totalCount.value !== null) totalCount.value += 1
    }
    closeUpload()
    showNotification('Картинка загружена! 🎉', 'success')
    loadUsage()
  } else {
    uploadProgress.value = 0
    uploadError.value = result.error || 'Не удалось загрузить картинку. Попробуй ещё раз.'
  }
}
</script>

<template>
  <div :class="['images-page', themeClass]">
    <!-- Уведомление -->
    <Transition name="fade">
      <div v-if="notification" :class="['notification', notification.type]">
        {{ notification.message }}
      </div>
    </Transition>

    <!-- Заголовок -->
    <header class="ip-header">
      <button @click="$router.push('/')" class="back-btn">
        ← Назад к редактору
      </button>
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">🖼️</span>
          Мои изображения
        </h1>
        <p class="page-subtitle">{{ displayName }}</p>
      </div>
    </header>

    <!-- Загрузка состояния аккаунта -->
    <div v-if="accountLoading" class="loading-state">
      <span class="loading-spinner">⏳</span>
      <p>Проверяем подключение к Cloudinary...</p>
    </div>

    <!-- Нет авторизации -->
    <div v-else-if="!isAuthenticated && !isDemoMode" class="not-auth">
      <span class="not-auth-icon">🔐</span>
      <h2>Требуется авторизация</h2>
      <p>Для просмотра изображений необходимо войти в систему</p>
      <button @click="$router.push('/')" class="login-btn">Войти в систему</button>
    </div>

    <!-- Аккаунт не привязан (или обновляем ключи) -->
    <div v-else-if="!isLinked || showOnboarding" class="onboarding-wrap">
      <CloudinaryOnboarding
        :user-email="user?.email ?? null"
        @linked="handleLinked"
      />
      <button class="switch-storage-link" @click="switchStorageProvider">
        ← Выбрать другое хранилище
      </button>
    </div>

    <!-- Аккаунт подключён -->
    <section v-else class="ip-content" aria-label="Изображения из Cloudinary">
      <!-- Компактная панель аккаунта -->
      <div class="account-bar">
        <span class="account-icon" aria-hidden="true">☁️</span>
        <div class="account-bar-info">
          <span class="account-bar-name mono">{{ account?.cloud_name }}</span>
          <span class="account-bar-email">{{ account?.cloudinary_email || user?.email }}</span>
        </div>
        <span v-if="account?.verified" class="account-badge" title="Ключи проверены">
          ✅ Проверен
        </span>
        <div class="account-bar-actions">
          <button
            class="icon-btn"
            :disabled="imagesLoading"
            title="Обновить список"
            aria-label="Обновить список"
            @click="refreshImages"
          >
            🔄
          </button>
          <button class="icon-btn" title="Сменить хранилище" aria-label="Сменить хранилище" @click="switchStorageProvider">
            🔀
          </button>
          <button class="icon-btn" title="Изменить ключи" aria-label="Изменить ключи" @click="startEditingKeys">
            🔑
          </button>
          <button
            class="icon-btn icon-btn-danger"
            title="Отвязать аккаунт"
            aria-label="Отвязать аккаунт"
            @click="showUnlinkModal = true"
          >
            🔌
          </button>
        </div>
      </div>

      <!-- Использование аккаунта Cloudinary -->
      <div v-if="usage" class="usage-strip">
        <span class="usage-plan">☁️ {{ planLabel }}</span>
        <div v-if="usagePercent !== null" class="usage-progress">
          <div
            :class="['usage-progress-fill', { warning: usagePercent >= 85 }]"
            :style="{ width: usagePercent + '%' }"
          ></div>
        </div>
        <span v-if="usagePercent !== null" class="usage-text">
          Использовано {{ usagePercent }}%
        </span>
        <span v-else class="usage-text">Информация о плане</span>
      </div>

      <!-- Список картинок -->
      <div class="images-section">
        <div class="images-toolbar">
          <h2 class="images-title">
            Мои картинки
            <span v-if="totalCount !== null" class="images-count">({{ totalCount }})</span>
          </h2>
          <div class="toolbar-actions">
            <button class="add-image-btn" @click="openUpload">
              ➕ Добавить картинку
            </button>
            <div class="view-toggle" role="group" aria-label="Вид списка">
              <button
                :class="['view-toggle-btn', { active: viewMode === 'grid' }]"
                title="Плитка"
                aria-label="Показать плиткой"
                @click="setViewMode('grid')"
              >
                ▦
              </button>
              <button
                :class="['view-toggle-btn', { active: viewMode === 'list' }]"
                title="Список"
                aria-label="Показать списком"
                @click="setViewMode('list')"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        <!-- Первая загрузка -->
        <div v-if="imagesLoading && !imagesLoaded" class="images-state">
          <span class="state-icon">⏳</span>
          <p>Загружаем твои картинки...</p>
        </div>

        <!-- Ошибка -->
        <div v-else-if="imagesError" class="images-state images-state-error">
          <span class="state-icon">😕</span>
          <p>{{ imagesError }}</p>
          <button class="state-btn" @click="loadImages(true)">Попробовать снова</button>
        </div>

        <!-- Пусто -->
        <div v-else-if="images.length === 0" class="images-state">
          <span class="state-icon">🖼️</span>
          <p class="state-title">Здесь пока пусто</p>
          <p class="state-hint">Твои картинки появятся тут. Добавь первую!</p>
          <button class="state-btn" @click="openUpload">➕ Добавить картинку</button>
        </div>

        <!-- Плитка -->
        <div v-else-if="viewMode === 'grid'" class="images-grid">
          <button
            v-for="img in images"
            :key="img.public_id"
            class="image-card"
            :title="img.display_name || img.public_id"
            @click="openImage(img)"
          >
            <span class="image-card-thumb-wrap">
              <img :src="thumbUrl(img)" :alt="img.display_name || ''" class="image-thumb" loading="lazy" />
            </span>
            <span class="image-name">{{ img.display_name || img.public_id }}</span>
            <span class="image-meta">
              {{ formatBytes(img.bytes) }}<template v-if="img.width && img.height"> · {{ img.width }}×{{ img.height }}</template>
            </span>
          </button>
        </div>

        <!-- Список -->
        <ul v-else class="images-list">
          <li v-for="img in images" :key="img.public_id">
            <button class="image-row" :title="img.display_name || img.public_id" @click="openImage(img)">
              <img :src="smallUrl(img)" :alt="img.display_name || ''" class="image-row-thumb" loading="lazy" />
              <span class="image-row-name">{{ img.display_name || img.public_id }}</span>
              <span class="image-row-size">{{ formatBytes(img.bytes) }}</span>
              <span class="image-row-date">{{ formatDate(img.created_at) }}</span>
            </button>
          </li>
        </ul>

        <!-- Показать ещё -->
        <button
          v-if="nextCursor"
          class="load-more-btn"
          :disabled="imagesLoading"
          @click="loadMoreImages()"
        >
          {{ imagesLoading ? '⏳ Загружаем...' : 'Показать ещё' }}
        </button>
      </div>
    </section>

    <!-- Модальное окно: просмотр картинки -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="selectedImage" :class="['modal-overlay', themeClass]" @click="closeImage">
          <div class="modal image-modal" role="dialog" aria-modal="true" @click.stop>
            <div class="modal-header">
              <h3 class="image-modal-title">{{ selectedImage.display_name || selectedImage.public_id }}</h3>
              <button class="modal-close" aria-label="Закрыть" @click="closeImage">&times;</button>
            </div>
            <div class="image-modal-content">
              <img :src="bigUrl(selectedImage)" :alt="selectedImage.display_name || ''" class="image-modal-preview" />
              <dl class="image-details">
                <div class="detail-row">
                  <dt>Размер</dt>
                  <dd>{{ formatBytes(selectedImage.bytes) }}</dd>
                </div>
                <div class="detail-row">
                  <dt>Разрешение</dt>
                  <dd>
                    {{ selectedImage.width && selectedImage.height ? `${selectedImage.width}×${selectedImage.height}` : '—' }}
                  </dd>
                </div>
                <div class="detail-row">
                  <dt>Добавлена</dt>
                  <dd>{{ formatDate(selectedImage.created_at) }}</dd>
                </div>
              </dl>
              <label class="url-field">
                <span class="url-label">Ссылка на картинку</span>
                <span class="url-row">
                  <input ref="urlInput" class="url-input mono" type="text" readonly :value="selectedImage.secure_url" @focus="($event.target as HTMLInputElement)?.select()" />
                  <button class="url-copy-btn" @click="copyImageUrl">📋 Скопировать</button>
                </span>
              </label>
            </div>
            <p v-if="deleteError" class="delete-error">😕 {{ deleteError }}</p>
            <div class="modal-actions">
              <template v-if="!deleteConfirm">
                <a
                  class="modal-btn modal-btn-link"
                  :href="selectedImage.secure_url"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ↗ Открыть оригинал
                </a>
                <button class="modal-btn delete-btn" :disabled="!!deletingId" @click="deleteConfirm = true">
                  🗑️ Удалить
                </button>
                <button class="modal-btn cancel-btn" @click="closeImage">Закрыть</button>
              </template>
              <template v-else>
                <p class="delete-question">
                  Удалить «{{ selectedImage.display_name || selectedImage.public_id }}» навсегда?
                </p>
                <button class="modal-btn cancel-btn" :disabled="!!deletingId" @click="deleteConfirm = false">
                  Отмена
                </button>
                <button class="modal-btn unlink-btn" :disabled="!!deletingId" @click="handleDelete">
                  {{ deletingId ? '⏳ Удаляем...' : '🗑️ Да, удалить' }}
                </button>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модальное окно загрузки картинки -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showUploadModal" :class="['modal-overlay', themeClass]" @click="closeUpload">
          <div class="modal upload-modal" role="dialog" aria-modal="true" @click.stop>
            <div class="modal-header">
              <h3>➕ Добавить картинку</h3>
              <button class="modal-close" aria-label="Закрыть" :disabled="uploading" @click="closeUpload">
                &times;
              </button>
            </div>
            <div class="upload-content">
              <input
                ref="fileInput"
                class="file-input-hidden"
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                @change="onFileInputChange"
              />

              <!-- Пока файл не выбран — зона перетаскивания -->
              <div
                v-if="!uploadFile"
                :class="['dropzone', { active: dragActive }]"
                @click="fileInput?.click()"
                @dragover.prevent="dragActive = true"
                @dragleave.prevent="dragActive = false"
                @drop.prevent="onDrop"
              >
                <span class="dropzone-icon">🖼️</span>
                <p class="dropzone-title">Перетащи картинку сюда</p>
                <p class="dropzone-hint">или нажми, чтобы выбрать файл</p>
                <p class="dropzone-formats">PNG, JPG, GIF или WebP · до 10 МБ</p>
              </div>

              <!-- Файл выбран — превью и прогресс -->
              <div v-else class="upload-preview">
                <img
                  v-if="uploadPreviewUrl"
                  :src="uploadPreviewUrl"
                  :alt="uploadFile.name"
                  class="upload-preview-img"
                />
                <p class="upload-file-name">{{ uploadFile.name }}</p>
                <p class="upload-file-size">{{ formatBytes(uploadFile.size) }}</p>

                <template v-if="uploading">
                  <div class="progress">
                    <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
                  </div>
                  <p class="progress-text">{{ uploadProgress }}%</p>
                </template>
                <button v-else class="replace-btn" @click="fileInput?.click()">
                  Выбрать другую
                </button>
              </div>

              <p v-if="uploadError" class="upload-error">😕 {{ uploadError }}</p>
            </div>
            <div class="modal-actions">
              <button class="modal-btn cancel-btn" :disabled="uploading" @click="closeUpload">
                Отмена
              </button>
              <button
                class="modal-btn upload-btn"
                :disabled="!uploadFile || uploading"
                @click="handleUpload"
              >
                {{ uploading ? `⏳ Загружаем... ${uploadProgress}%` : 'Загрузить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модальное окно отвязки -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showUnlinkModal" :class="['modal-overlay', themeClass]" @click="showUnlinkModal = false">
          <div class="modal" @click.stop>
            <div class="modal-header">
              <h3>🔌 Отвязать Cloudinary</h3>
              <button @click="showUnlinkModal = false" class="modal-close">&times;</button>
            </div>
            <div class="modal-content">
              <p>Отвязать аккаунт Cloudinary от твоего профиля?</p>
              <p class="warning">
                Картинки останутся в твоём аккаунте Cloudinary, но сайт перестанет их
                показывать. Привязку можно будет сделать заново в любой момент.
              </p>
            </div>
            <div class="modal-actions">
              <button @click="showUnlinkModal = false" class="modal-btn cancel-btn" :disabled="unlinking">
                Отмена
              </button>
              <button @click="handleUnlink" class="modal-btn unlink-btn" :disabled="unlinking">
                {{ unlinking ? '⏳ Отвязываем...' : 'Отвязать' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Темы */
.theme-dark {
  --bg-primary: #1a1a2e;
  --bg-secondary: rgba(255, 255, 255, 0.05);
  --bg-card: rgba(255, 255, 255, 0.05);
  --bg-card-hover: rgba(255, 255, 255, 0.08);
  --border-color: rgba(255, 255, 255, 0.1);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-muted: rgba(255, 255, 255, 0.5);
  --accent-color: #667eea;
  --success-color: #64c864;
  --warning-color: #ffc864;
  --error-color: #ff6464;
  --accent-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --icon-btn-bg: rgba(255, 255, 255, 0.1);
  --icon-btn-border: rgba(255, 255, 255, 0.15);
  --icon-btn-hover-bg: rgba(255, 255, 255, 0.2);
}
.theme-light {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f3f4f6;
  --border-color: #e5e7eb;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --accent-color: #646cff;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --accent-gradient: linear-gradient(135deg, #646cff 0%, #764ba2 100%);
  --icon-btn-bg: rgba(0, 0, 0, 0.04);
  --icon-btn-border: #e5e7eb;
  --icon-btn-hover-bg: rgba(0, 0, 0, 0.08);
}

.images-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding-bottom: 3rem;
  transition: background 0.3s ease, color 0.3s ease;
}

/* Уведомление */
.notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.notification.success { background: #10b981; color: white; }
.notification.error { background: #ef4444; color: white; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Заголовок */
.ip-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}
.back-btn {
  padding: 0.75rem 1.5rem;
  background: var(--icon-btn-bg);
  border: 1px solid var(--icon-btn-border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.back-btn:hover { background: var(--icon-btn-hover-bg); transform: translateX(-2px); }
.header-content { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
.page-title {
  font-size: 1.225rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.title-icon { font-size: 1.4rem; -webkit-text-fill-color: initial; }
.page-subtitle { font-size: 0.8rem; color: var(--text-secondary); margin: 0; }

/* Состояния загрузки */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 4rem 1rem;
  color: var(--text-secondary);
}
.loading-spinner { font-size: 2rem; }

/* Нет авторизации */
.not-auth {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 5rem 1rem;
  text-align: center;
}
.not-auth-icon { font-size: 3rem; }
.not-auth h2 { margin: 0; }
.not-auth p { color: var(--text-secondary); margin: 0; }
.login-btn {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: var(--accent-color);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 48px;
}
.login-btn:hover { filter: brightness(1.1); }

/* Онбординг Cloudinary + возврат к выбору хранилища */
.onboarding-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 2rem;
}
.switch-storage-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.6rem 1rem;
  border-radius: 8px;
}
.switch-storage-link:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

/* Контент */
.ip-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Компактная панель аккаунта */
.account-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.9rem;
  padding: 0.9rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
}
.account-icon { font-size: 1.6rem; line-height: 1; }
.account-bar-info {
  flex: 1;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.account-bar-name { font-weight: 700; font-size: 1rem; word-break: break-all; }
.account-bar-email { color: var(--text-secondary); font-size: 0.82rem; word-break: break-all; }
.account-badge {
  flex: none;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: rgba(100, 200, 100, 0.15);
  border: 1px solid rgba(100, 200, 100, 0.4);
  color: var(--success-color);
  font-size: 0.78rem;
  font-weight: 600;
}
.account-bar-actions { display: flex; gap: 0.5rem; }
.icon-btn {
  width: 46px;
  height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.15rem;
  background: var(--icon-btn-bg);
  border: 1px solid var(--icon-btn-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}
.icon-btn:hover:not(:disabled) { background: var(--icon-btn-hover-bg); }
.icon-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.icon-btn-danger:hover { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.4); }

/* Использование аккаунта Cloudinary */
.usage-strip {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  flex-wrap: wrap;
  padding: 0.55rem 1.25rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
}
.usage-plan {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}
.usage-progress {
  flex: 1;
  min-width: 100px;
  height: 8px;
  border-radius: 999px;
  background: var(--icon-btn-bg);
  border: 1px solid var(--icon-btn-border);
  overflow: hidden;
}
.usage-progress-fill {
  height: 100%;
  background: var(--accent-gradient);
  transition: width 0.3s ease;
}
.usage-progress-fill.warning { background: linear-gradient(135deg, #f59e0b, #ef4444); }
.usage-text {
  font-size: 0.82rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* Секция картинок */
.images-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.images-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.images-title { margin: 0; font-size: 1.15rem; font-weight: 700; }
.images-count { color: var(--text-secondary); font-weight: 500; font-size: 0.95rem; }
.view-toggle {
  display: inline-flex;
  background: var(--icon-btn-bg);
  border: 1px solid var(--icon-btn-border);
  border-radius: 10px;
  padding: 3px;
  gap: 3px;
}
.view-toggle-btn {
  width: 42px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}
.view-toggle-btn:hover { background: var(--icon-btn-hover-bg); }
.view-toggle-btn.active { background: var(--accent-color); color: #fff; }

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.add-image-btn {
  padding: 0.7rem 1.4rem;
  background: var(--accent-gradient);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  min-height: 46px;
  transition: filter 0.2s ease, transform 0.15s ease;
  white-space: nowrap;
}
.add-image-btn:hover { filter: brightness(1.08); transform: translateY(-1px); }

/* Состояния списка */
.images-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3.5rem 1rem;
  text-align: center;
  border: 1px dashed var(--border-color);
  border-radius: 14px;
  color: var(--text-secondary);
}
.images-state p { margin: 0; }
.state-icon { font-size: 2.5rem; }
.state-title { font-size: 1.05rem; font-weight: 600; color: var(--text-primary); }
.state-hint { font-size: 0.88rem; max-width: 340px; line-height: 1.5; }
.state-btn {
  margin-top: 0.5rem;
  padding: 0.65rem 1.4rem;
  background: var(--accent-color);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
}
.state-btn:hover { filter: brightness(1.1); }

/* Плитка */
.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
.image-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.6rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.image-card:hover {
  transform: translateY(-2px);
  border-color: var(--accent-color);
  background: var(--bg-card-hover);
}
.image-card-thumb-wrap {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 10px;
  overflow: hidden;
  background: var(--icon-btn-bg);
}
.image-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.image-name {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.image-meta { font-size: 0.78rem; color: var(--text-secondary); }

/* Список */
.images-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.image-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 0.6rem 0.9rem;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.image-row:hover { background: var(--bg-card-hover); border-color: var(--accent-color); }
.image-row-thumb {
  width: 48px;
  height: 48px;
  flex: none;
  object-fit: cover;
  border-radius: 8px;
  background: var(--icon-btn-bg);
}
.image-row-name {
  flex: 1;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.image-row-size { flex: none; font-size: 0.82rem; color: var(--text-secondary); width: 80px; text-align: right; }
.image-row-date { flex: none; font-size: 0.82rem; color: var(--text-muted); width: 130px; text-align: right; }

/* Показать ещё */
.load-more-btn {
  align-self: center;
  padding: 0.8rem 2.5rem;
  background: var(--icon-btn-bg);
  border: 1px solid var(--icon-btn-border);
  border-radius: 12px;
  color: var(--text-primary);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 48px;
}
.load-more-btn:hover:not(:disabled) { background: var(--icon-btn-hover-bg); }
.load-more-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Модальные окна */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}
.modal {
  background: var(--bg-primary, #1a1a2e);
  border: 1px solid var(--border-color);
  border-radius: 14px;
  max-width: 420px;
  width: 100%;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}
.image-modal { max-width: 640px; }
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}
.modal-header h3 { margin: 0; font-size: 1.1rem; }
.image-modal-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.modal-close {
  flex: none;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  padding: 0.25rem;
}
.modal-close:hover { color: var(--text-primary); }
.modal-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
.modal-content p { margin: 0; line-height: 1.55; font-size: 0.95rem; }
.modal-content .warning { color: var(--warning-color); font-size: 0.9rem; }

/* Просмотр картинки */
.image-modal-content {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.image-modal-preview {
  width: 100%;
  max-height: 46vh;
  object-fit: contain;
  border-radius: 10px;
  background: var(--icon-btn-bg);
}
.image-details {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.55rem 0.9rem;
  background: var(--icon-btn-bg);
  border: 1px solid var(--icon-btn-border);
  border-radius: 10px;
}
.detail-row dt { color: var(--text-secondary); font-size: 0.88rem; }
.detail-row dd { margin: 0; font-weight: 600; font-size: 0.92rem; text-align: right; word-break: break-all; }
.mono { font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace; }

.url-field { display: flex; flex-direction: column; gap: 0.35rem; }
.url-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); }
.url-row { display: flex; gap: 0.5rem; }
.url-input {
  flex: 1;
  min-width: 0;
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  border: 1px solid var(--icon-btn-border);
  background: var(--icon-btn-bg);
  color: var(--text-primary);
  font-size: 0.82rem;
  min-height: 44px;
}
.url-input:focus { outline: none; border-color: var(--accent-color); }
.url-copy-btn {
  flex: none;
  padding: 0.65rem 1.1rem;
  background: var(--accent-color);
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  min-height: 44px;
  transition: filter 0.2s;
}
.url-copy-btn:hover { filter: brightness(1.1); }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.1rem 1.5rem;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}
.modal-btn {
  padding: 0.7rem 1.4rem;
  border-radius: 10px;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 48px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.modal-btn-link {
  background: var(--icon-btn-bg);
  color: var(--text-primary);
  margin-right: auto;
}
.modal-btn-link:hover { background: var(--icon-btn-hover-bg); }
.cancel-btn {
  background: var(--icon-btn-bg);
  color: var(--text-primary);
}
.unlink-btn {
  background: var(--error-color);
  color: #fff;
}
.unlink-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Удаление картинки */
.delete-btn {
  background: rgba(239, 68, 68, 0.12);
  color: var(--error-color);
  border: 1px solid rgba(239, 68, 68, 0.35);
}
.delete-btn:hover:not(:disabled) { background: rgba(239, 68, 68, 0.2); }
.delete-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.delete-question {
  margin: 0;
  margin-right: auto;
  font-size: 0.92rem;
  font-weight: 600;
}
.delete-error {
  margin: 0 1.5rem 0.75rem;
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: var(--error-color);
  font-size: 0.88rem;
  line-height: 1.45;
}

/* Загрузка картинки */
.upload-modal { max-width: 460px; }
.upload-content {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.file-input-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 2.25rem 1.25rem;
  border: 2px dashed var(--icon-btn-border);
  border-radius: 14px;
  background: var(--icon-btn-bg);
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s ease, background 0.2s ease;
}
.dropzone:hover,
.dropzone.active {
  border-color: var(--accent-color);
  background: var(--bg-card-hover);
}
.dropzone-icon { font-size: 2.6rem; }
.dropzone-title { margin: 0; font-size: 1.05rem; font-weight: 700; }
.dropzone-hint { margin: 0; font-size: 0.9rem; color: var(--text-secondary); }
.dropzone-formats { margin: 0.35rem 0 0; font-size: 0.78rem; color: var(--text-muted); }

.upload-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}
.upload-preview-img {
  max-width: 100%;
  max-height: 34vh;
  object-fit: contain;
  border-radius: 10px;
  background: var(--icon-btn-bg);
}
.upload-file-name {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  word-break: break-all;
  text-align: center;
}
.upload-file-size { margin: 0; font-size: 0.82rem; color: var(--text-secondary); }

.progress {
  width: 100%;
  height: 12px;
  border-radius: 999px;
  background: var(--icon-btn-bg);
  border: 1px solid var(--icon-btn-border);
  overflow: hidden;
  margin-top: 0.5rem;
}
.progress-bar {
  height: 100%;
  background: var(--accent-gradient);
  transition: width 0.15s linear;
}
.progress-text {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--accent-color);
}
.replace-btn {
  margin-top: 0.35rem;
  padding: 0.55rem 1.1rem;
  background: var(--icon-btn-bg);
  border: 1px solid var(--icon-btn-border);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 0.88rem;
  cursor: pointer;
  min-height: 42px;
}
.replace-btn:hover { background: var(--icon-btn-hover-bg); }
.upload-error {
  margin: 0;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: var(--error-color);
  font-size: 0.88rem;
  line-height: 1.45;
}
.upload-btn { background: var(--accent-color); color: #fff; }
.upload-btn:disabled { opacity: 0.55; cursor: not-allowed; }

@media (max-width: 640px) {
  .ip-content { padding: 1.25rem 0.9rem; }
  .images-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 0.75rem; }
  .image-row-size { display: none; }
  .image-row-date { width: auto; font-size: 0.75rem; }
  .account-bar { padding: 0.8rem 1rem; }
  .url-row { flex-direction: column; }
  .toolbar-actions { width: 100%; justify-content: space-between; }
  .add-image-btn { flex: 1; }
}
</style>
