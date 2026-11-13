<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import {
  useYandexStorage,
  YANDEX_ALLOWED_TYPES,
  YANDEX_MAX_UPLOAD_BYTES
} from '../composables/useYandexStorage'
import type { YandexFile } from '../types/storage'

const route = useRoute()
const router = useRouter()
const { user, session, isReady, readyPromise } = useAuth()

const {
  files,
  loading,
  loadingMore,
  loaded,
  error,
  nextToken,
  isConfigured,
  loadFiles,
  uploadImage
} = useYandexStorage()

// Тема (синхронизация с редактором)
type Theme = 'dark' | 'light'
const currentTheme = ref<Theme>('dark')
const savedTheme = localStorage.getItem('p5editor-theme')
if (savedTheme === 'dark' || savedTheme === 'light') currentTheme.value = savedTheme
const themeClass = computed(() =>
  currentTheme.value === 'dark' ? 'theme-dark' : 'theme-light'
)

// Вид списка
type ViewMode = 'grid' | 'list'
const viewMode = ref<ViewMode>('grid')
const savedView = localStorage.getItem('p5editor-images-view')
if (savedView === 'grid' || savedView === 'list') viewMode.value = savedView

function setViewMode(mode: ViewMode) {
  viewMode.value = mode
  localStorage.setItem('p5editor-images-view', mode)
}

// Демо-режим — только в разработке (?demo=1)
const isDemoMode = computed(
  () => import.meta.env.DEV && route.query.demo === '1'
)

// Уведомления
const notification = ref<{ message: string; type: 'success' | 'error' } | null>(null)
let notificationTimer: ReturnType<typeof setTimeout> | null = null

function showNotification(message: string, type: 'success' | 'error') {
  notification.value = { message, type }
  if (notificationTimer) clearTimeout(notificationTimer)
  notificationTimer = setTimeout(() => {
    notification.value = null
    notificationTimer = null
  }, 2600)
}

// Просмотр картинки
const selectedFile = ref<YandexFile | null>(null)
const urlInput = ref<HTMLInputElement | null>(null)

// Загрузка
const showUploadModal = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadFile = ref<File | null>(null)
const uploadPreviewUrl = ref<string | null>(null)
const uploadProgress = ref(0)
const uploadBusy = ref(false)
const uploadError = ref<string | null>(null)
const dragActive = ref(false)

function formatDate(dateStr: string | null): string {
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

function openImage(file: YandexFile) {
  selectedFile.value = file
}

function closeImage() {
  selectedFile.value = null
}

async function copyImageUrl() {
  const url = selectedFile.value?.url
  if (!url) return
  try {
    await navigator.clipboard.writeText(url)
    showNotification('Ссылка скопирована!', 'success')
  } catch {
    urlInput.value?.select()
    document.execCommand('copy')
    showNotification('Выдели ссылку и нажми Ctrl+C', 'error')
  }
}

// ─── Загрузка картинки ───────────────────────────────────────────────────────

function releasePreview() {
  if (uploadPreviewUrl.value) {
    URL.revokeObjectURL(uploadPreviewUrl.value)
    uploadPreviewUrl.value = null
  }
}

function openUpload() {
  uploadFile.value = null
  uploadError.value = null
  uploadProgress.value = 0
  releasePreview()
  showUploadModal.value = true
}

function closeUpload() {
  if (uploadBusy.value) return
  showUploadModal.value = false
  uploadFile.value = null
  uploadError.value = null
  uploadProgress.value = 0
  releasePreview()
}

function setUploadFile(file: File | null | undefined) {
  if (!file) return

  if (!YANDEX_ALLOWED_TYPES.includes(file.type)) {
    uploadFile.value = null
    releasePreview()
    uploadError.value = 'Это не картинка. Подойдёт PNG, JPG, GIF или WebP.'
    return
  }
  if (file.size === 0) {
    uploadFile.value = null
    releasePreview()
    uploadError.value = 'Файл пустой. Выбери другую картинку.'
    return
  }
  if (file.size > YANDEX_MAX_UPLOAD_BYTES) {
    uploadFile.value = null
    releasePreview()
    uploadError.value = 'Файл больше 10 МБ. Выбери картинку поменьше.'
    return
  }

  releasePreview()
  uploadError.value = null
  uploadProgress.value = 0
  uploadFile.value = file
  uploadPreviewUrl.value = URL.createObjectURL(file)
}

function onFileInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  setUploadFile(input.files?.[0])
  input.value = ''
}

function onDrop(event: DragEvent) {
  dragActive.value = false
  setUploadFile(event.dataTransfer?.files?.[0])
}

function simulateUpload(): Promise<void> {
  return new Promise((resolve) => {
    let percent = 0
    const tick = () => {
      percent = Math.min(100, percent + 7 + Math.round(Math.random() * 11))
      uploadProgress.value = percent
      if (percent >= 100) {
        setTimeout(resolve, 180)
        return
      }
      setTimeout(tick, 70)
    }
    tick()
  })
}

async function handleUpload() {
  const file = uploadFile.value
  if (!file || uploadBusy.value) return

  uploadBusy.value = true
  uploadProgress.value = 0
  uploadError.value = null

  try {
    if (isDemoMode.value) {
      await simulateUpload()
      const demoFile: YandexFile = {
        key: `demo/${Date.now()}.png`,
        size: file.size,
        lastModified: new Date().toISOString(),
        url: URL.createObjectURL(file)
      }
      files.value = [demoFile, ...files.value]
    } else {
      const uploaded = await uploadImage(file, (percent) => {
        uploadProgress.value = percent
      })
      files.value = [uploaded, ...files.value]
    }

    uploadBusy.value = false
    closeUpload()
    showNotification('Картинка загружена! 🎉', 'success')
  } catch (e) {
    uploadProgress.value = 0
    uploadError.value =
      e instanceof Error
        ? e.message
        : 'Не удалось загрузить картинку. Попробуй ещё раз.'
  } finally {
    uploadBusy.value = false
  }
}

// ─── Демо-данные ─────────────────────────────────────────────────────────────

function makeDemoImage(title: string, from: string, to: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>` +
    `</linearGradient></defs>` +
    `<rect width="960" height="640" fill="url(#g)"/>` +
    `<circle cx="760" cy="150" r="90" fill="rgba(255,255,255,0.18)"/>` +
    `<text x="480" y="345" font-family="Arial, sans-serif" font-size="56" font-weight="700" ` +
    `fill="#ffffff" text-anchor="middle">${title}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function demoFiles(): YandexFile[] {
  const today = new Date()
  const daysAgo = (days: number) =>
    new Date(today.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

  return [
    {
      key: 'demo/zakat.png',
      size: 482_000,
      lastModified: daysAgo(0),
      url: makeDemoImage('Закат', '#f97316', '#db2777')
    },
    {
      key: 'demo/more.png',
      size: 318_000,
      lastModified: daysAgo(2),
      url: makeDemoImage('Море', '#0ea5e9', '#2563eb')
    },
    {
      key: 'demo/les.png',
      size: 265_000,
      lastModified: daysAgo(5),
      url: makeDemoImage('Лес', '#16a34a', '#065f46')
    },
    {
      key: 'demo/kosmos.png',
      size: 527_000,
      lastModified: daysAgo(9),
      url: makeDemoImage('Космос', '#312e81', '#7c3aed')
    },
    {
      key: 'demo/limon.png',
      size: 174_000,
      lastModified: daysAgo(14),
      url: makeDemoImage('Лимон', '#facc15', '#f59e0b')
    },
    {
      key: 'demo/roza.png',
      size: 296_000,
      lastModified: daysAgo(21),
      url: makeDemoImage('Роза', '#fb7185', '#be123c')
    }
  ]
}

function startDemo() {
  files.value = demoFiles()
  nextToken.value = null
  loaded.value = true
  error.value = null
}

// ─── Действия страницы ───────────────────────────────────────────────────────

async function refreshImages() {
  if (isDemoMode.value) {
    showNotification('Демо-режим: обновление недоступно', 'error')
    return
  }
  await loadFiles(true)
}

function switchProvider() {
  const query: Record<string, string> = { choose: '1' }
  if (isDemoMode.value) query.demo = '1'
  router.push({ path: '/images', query })
}

const countLabel = computed(() => {
  if (nextToken.value) return `(${files.value.length}+)`
  return `(${files.value.length})`
})

onMounted(async () => {
  if (isDemoMode.value) {
    startDemo()
    return
  }

  if (!isReady.value && readyPromise.value) {
    await readyPromise.value
  }
  if (!user.value && !session.value) {
    router.push('/')
    return
  }
  await loadFiles(true)
})
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
      <button class="back-btn" @click="router.push('/')">
        ← Назад к редактору
      </button>
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">🖼️</span>
          Мои изображения
        </h1>
        <p class="page-subtitle">{{ user?.email }}</p>
      </div>
    </header>

    <main class="ip-content" aria-label="Изображения из Яндекс Облака">
      <p v-if="isDemoMode" class="demo-banner">
        Демо-режим: картинки ненастоящие, загрузка имитируется.
      </p>

      <!-- Панель хранилища -->
      <div class="account-bar">
        <span class="account-icon" aria-hidden="true">📦</span>
        <div class="account-bar-info">
          <span class="account-bar-name">Яндекс Облако</span>
          <span class="account-bar-email">Общее хранилище p5editor</span>
        </div>
        <span class="account-badge">Без регистрации</span>
        <div class="account-bar-actions">
          <button
            class="icon-btn"
            :disabled="loading"
            title="Обновить список"
            aria-label="Обновить список"
            @click="refreshImages"
          >
            🔄
          </button>
          <button
            class="icon-btn"
            title="Сменить хранилище"
            aria-label="Сменить хранилище"
            @click="switchProvider"
          >
            🔀
          </button>
        </div>
      </div>

      <!-- Список картинок -->
      <div class="images-section">
        <div class="images-toolbar">
          <h2 class="images-title">
            Мои картинки
            <span class="images-count">{{ countLabel }}</span>
          </h2>
          <div class="toolbar-actions">
            <button class="add-image-btn" :disabled="!isDemoMode && !isConfigured" @click="openUpload">
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

        <!-- Хранилище не настроено -->
        <div v-if="!isConfigured && !isDemoMode" class="images-state images-state-error">
          <span class="state-icon">😕</span>
          <p class="state-title">Хранилище пока не подключено</p>
          <p class="state-hint">
            Сообщи учителю. А пока можно выбрать другой вариант хранения.
          </p>
          <button class="state-btn" @click="switchProvider">Выбрать другое хранилище</button>
        </div>

        <!-- Первая загрузка -->
        <div v-else-if="loading && !loaded" class="images-state">
          <span class="state-icon">⏳</span>
          <p>Загружаем твои картинки...</p>
        </div>

        <!-- Ошибка -->
        <div v-else-if="error" class="images-state images-state-error">
          <span class="state-icon">😕</span>
          <p>{{ error }}</p>
          <button class="state-btn" @click="refreshImages">Попробовать снова</button>
        </div>

        <!-- Пусто -->
        <div v-else-if="files.length === 0" class="images-state">
          <span class="state-icon">🖼️</span>
          <p class="state-title">Здесь пока пусто</p>
          <p class="state-hint">Твои картинки появятся тут. Добавь первую!</p>
          <button class="state-btn" @click="openUpload">➕ Добавить картинку</button>
        </div>

        <!-- Плитка -->
        <div v-else-if="viewMode === 'grid'" class="images-grid">
          <button
            v-for="file in files"
            :key="file.key"
            class="image-card"
            :title="formatDate(file.lastModified)"
            @click="openImage(file)"
          >
            <span class="image-card-thumb-wrap">
              <img :src="file.url" :alt="formatDate(file.lastModified)" class="image-thumb" loading="lazy" />
            </span>
            <span class="image-name">{{ formatDate(file.lastModified) }}</span>
            <span class="image-meta">{{ formatBytes(file.size) }}</span>
          </button>
        </div>

        <!-- Список -->
        <ul v-else class="images-list">
          <li v-for="file in files" :key="file.key">
            <button class="image-row" :title="formatDate(file.lastModified)" @click="openImage(file)">
              <img :src="file.url" :alt="formatDate(file.lastModified)" class="image-row-thumb" loading="lazy" />
              <span class="image-row-name">Картинка</span>
              <span class="image-row-size">{{ formatBytes(file.size) }}</span>
              <span class="image-row-date">{{ formatDate(file.lastModified) }}</span>
            </button>
          </li>
        </ul>

        <!-- Показать ещё -->
        <button
          v-if="nextToken"
          class="load-more-btn"
          :disabled="loadingMore"
          @click="loadFiles(false)"
        >
          {{ loadingMore ? '⏳ Загружаем...' : 'Показать ещё' }}
        </button>
      </div>
    </main>

    <!-- Модальное окно: просмотр картинки -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="selectedFile" :class="['modal-overlay', themeClass]" @click="closeImage">
          <div class="modal image-modal" role="dialog" aria-modal="true" @click.stop>
            <div class="modal-header">
              <h3 class="image-modal-title">{{ formatDate(selectedFile.lastModified) }}</h3>
              <button class="modal-close" aria-label="Закрыть" @click="closeImage">&times;</button>
            </div>
            <div class="image-modal-content">
              <img :src="selectedFile.url" :alt="formatDate(selectedFile.lastModified)" class="image-modal-preview" />
              <dl class="image-details">
                <div class="detail-row">
                  <dt>Размер</dt>
                  <dd>{{ formatBytes(selectedFile.size) }}</dd>
                </div>
                <div class="detail-row">
                  <dt>Добавлена</dt>
                  <dd>{{ formatDate(selectedFile.lastModified) }}</dd>
                </div>
              </dl>
              <label class="url-field">
                <span class="url-label">Ссылка на картинку</span>
                <span class="url-row">
                  <input
                    ref="urlInput"
                    class="url-input mono"
                    type="text"
                    readonly
                    :value="selectedFile.url"
                    @focus="($event.target as HTMLInputElement)?.select()"
                  />
                  <button class="url-copy-btn" @click="copyImageUrl">📋 Скопировать</button>
                </span>
              </label>
              <p class="modal-note">Удалить картинку пока нельзя — это ограничение Яндекс Облака.</p>
            </div>
            <div class="modal-actions">
              <a
                class="modal-btn modal-btn-link"
                :href="selectedFile.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                ↗ Открыть оригинал
              </a>
              <button class="modal-btn cancel-btn" @click="closeImage">Закрыть</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Модальное окно загрузки -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showUploadModal" :class="['modal-overlay', themeClass]" @click="closeUpload">
          <div class="modal upload-modal" role="dialog" aria-modal="true" @click.stop>
            <div class="modal-header">
              <h3>➕ Добавить картинку</h3>
              <button class="modal-close" aria-label="Закрыть" :disabled="uploadBusy" @click="closeUpload">
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

              <div v-else class="upload-preview">
                <img
                  v-if="uploadPreviewUrl"
                  :src="uploadPreviewUrl"
                  :alt="uploadFile.name"
                  class="upload-preview-img"
                />
                <p class="upload-file-name">{{ uploadFile.name }}</p>
                <p class="upload-file-size">{{ formatBytes(uploadFile.size) }}</p>

                <template v-if="uploadBusy">
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
              <button class="modal-btn cancel-btn" :disabled="uploadBusy" @click="closeUpload">
                Отмена
              </button>
              <button
                class="modal-btn upload-btn"
                :disabled="!uploadFile || uploadBusy"
                @click="handleUpload"
              >
                {{ uploadBusy ? `⏳ Загружаем... ${uploadProgress}%` : 'Загрузить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
/* Темы — как на странице Cloudinary */
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

.demo-banner {
  margin: 0;
  padding: 0.7rem 1rem;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: var(--text-secondary);
  font-size: 0.88rem;
}

/* Панель хранилища */
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
.account-bar-name { font-weight: 700; font-size: 1rem; }
.account-bar-email { color: var(--text-secondary); font-size: 0.82rem; }
.account-badge {
  flex: none;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.14);
  border: 1px solid rgba(99, 102, 241, 0.35);
  color: var(--text-secondary);
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
.add-image-btn:hover:not(:disabled) { filter: brightness(1.08); transform: translateY(-1px); }
.add-image-btn:disabled { opacity: 0.55; cursor: not-allowed; }

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
.modal-note {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-muted);
  line-height: 1.45;
}

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
