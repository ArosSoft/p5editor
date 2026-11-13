<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import {
  readStorageProvider,
  saveStorageProvider,
  providerRoute
} from '../lib/storageProvider'
import type { StorageProvider } from '../types/storage'

const route = useRoute()
const router = useRouter()
const { user, isReady, readyPromise } = useAuth()

// Тема (как на остальных страницах)
type Theme = 'dark' | 'light'
const currentTheme = ref<Theme>('dark')
const savedTheme = localStorage.getItem('p5editor-theme')
if (savedTheme === 'dark' || savedTheme === 'light') currentTheme.value = savedTheme
const themeClass = computed(() =>
  currentTheme.value === 'dark' ? 'theme-dark' : 'theme-light'
)

const isDemo = computed(() => import.meta.env.DEV && route.query.demo === '1')
const savedProvider = ref<StorageProvider | null>(null)
const redirecting = ref(false)

function querySuffix(): string {
  return isDemo.value ? '?demo=1' : ''
}

function choose(provider: StorageProvider) {
  saveStorageProvider(user.value?.id, provider)
  savedProvider.value = provider
  router.push(providerRoute(provider) + querySuffix())
}

function openSaved() {
  if (savedProvider.value) {
    router.push(providerRoute(savedProvider.value) + querySuffix())
  }
}

onMounted(async () => {
  if (!isDemo.value) {
    if (!isReady.value && readyPromise.value) {
      await readyPromise.value
    }
    if (!user.value) {
      router.replace('/')
      return
    }
  }

  savedProvider.value = readStorageProvider(user.value?.id)

  // Если хранилище уже выбрано — сразу открываем его (кроме случая «сменить»).
  const choosing = route.query.choose === '1'
  if (savedProvider.value && !choosing) {
    redirecting.value = true
    router.replace(providerRoute(savedProvider.value) + querySuffix())
  }
})
</script>

<template>
  <div :class="['choice-page', themeClass]">
    <header class="cp-header">
      <button class="back-btn" @click="router.push('/')">← Назад к редактору</button>
      <div class="header-content">
        <h1 class="page-title">
          <span class="title-icon">🖼️</span>
          Мои изображения
        </h1>
        <p class="page-subtitle">{{ user?.email }}</p>
      </div>
    </header>

    <div v-if="redirecting" class="cp-loading">
      <span class="loading-spinner">⏳</span>
      <p>Открываем хранилище...</p>
    </div>

    <main v-else class="cp-content">
      <div class="cp-intro">
        <h2 class="cp-question">Где будем хранить картинки?</h2>
        <p class="cp-hint">
          Оба варианта бесплатные. Выбрать можно любое — потом поменяешь в любой момент.
        </p>
        <p v-if="isDemo" class="cp-demo">Демо-режим: картинки ненастоящие, можно всё нажимать.</p>
      </div>

      <div class="provider-grid">
        <button class="provider-card" @click="choose('cloudinary')">
          <span class="provider-icon" aria-hidden="true">☁️</span>
          <span class="provider-name">Cloudinary</span>
          <span class="provider-tag">Свой аккаунт</span>
          <span class="provider-desc">
            Личное бесплатное хранилище. Можно удалять картинки и видеть,
            сколько места осталось.
          </span>
          <span class="provider-foot">
            Нужна регистрация · из некоторых стран только через VPN
          </span>
        </button>

        <button class="provider-card provider-card-yandex" @click="choose('yandex')">
          <span class="provider-icon" aria-hidden="true">📦</span>
          <span class="provider-name">Яндекс Облако</span>
          <span class="provider-tag provider-tag-easy">Без регистрации</span>
          <span class="provider-desc">
            Картинки хранятся на сервере p5editor. Просто добавь картинку —
            и всё готово.
          </span>
          <span class="provider-foot">Удалять картинки пока нельзя</span>
        </button>
      </div>

      <button v-if="savedProvider" class="saved-link" @click="openSaved">
        ← Вернуться в {{ savedProvider === 'yandex' ? 'Яндекс Облако' : 'Cloudinary' }}
      </button>

      <p class="cp-note">Выбор запомнится на этом компьютере.</p>
    </main>
  </div>
</template>

<style scoped>
.choice-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  padding-bottom: 3rem;
  transition: background 0.3s ease, color 0.3s ease;
}

/* Заголовок — как на странице изображений */
.cp-header {
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
.back-btn:hover {
  background: var(--icon-btn-hover-bg);
  transform: translateX(-2px);
}
.header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
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
.title-icon {
  font-size: 1.4rem;
  -webkit-text-fill-color: initial;
}
.page-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
}

.cp-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 5rem 1rem;
  color: var(--text-secondary);
}
.loading-spinner {
  font-size: 2rem;
}

/* Контент */
.cp-content {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 2.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}
.cp-intro {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.cp-question {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
}
.cp-hint {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
}
.cp-demo {
  margin: 0.25rem auto 0;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: var(--text-secondary);
  font-size: 0.82rem;
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.25rem;
}

/* Большие кнопки-карточки: удобно нажимать мышкой и пальцем */
.provider-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
  padding: 1.75rem 1.5rem;
  text-align: left;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 18px;
  color: var(--text-primary);
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  font: inherit;
}
.provider-card:hover,
.provider-card:focus-visible {
  transform: translateY(-3px);
  border-color: var(--accent-color);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
  outline: none;
}
.provider-icon {
  font-size: 2.6rem;
  line-height: 1;
}
.provider-name {
  font-size: 1.35rem;
  font-weight: 700;
}
.provider-tag {
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.14);
  border: 1px solid rgba(99, 102, 241, 0.35);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
}
.provider-tag-easy {
  background: rgba(16, 185, 129, 0.14);
  border-color: rgba(16, 185, 129, 0.4);
}
.provider-desc {
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-secondary);
}
.provider-foot {
  margin-top: 0.35rem;
  font-size: 0.8rem;
  color: var(--text-muted, var(--text-secondary));
}

.saved-link {
  align-self: center;
  background: none;
  border: none;
  color: var(--accent-color);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 8px;
}
.saved-link:hover {
  text-decoration: underline;
}

.cp-note {
  margin: 0;
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .cp-content { padding: 1.75rem 0.9rem; }
  .cp-question { font-size: 1.3rem; }
  .provider-card { padding: 1.4rem 1.15rem; }
}
</style>
