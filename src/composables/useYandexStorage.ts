import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { YandexFile, YandexFilesPage, YandexUploadTicket } from '../types/storage'

// Ограничения синхронизированы с функцией (yandex/functions/storage/index.py)
export const YANDEX_MAX_UPLOAD_BYTES = 10 * 1024 * 1024
export const YANDEX_ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

// База API Gateway. Значение по умолчанию — для сборки на GitHub Pages,
// где .env не коммитится (как с Supabase в src/lib/supabase.ts).
const DEFAULT_YANDEX_API_URL = 'https://d5dd4biat7fh9g2mc5lp.nm0huug4.apigw.yandexcloud.net'
const API_BASE = (import.meta.env.VITE_YANDEX_API_URL || DEFAULT_YANDEX_API_URL).trim().replace(/\/+$/, '')

function fallbackMessage(status: number): string {
  if (status === 401) return 'Нужно войти в аккаунт p5editor.'
  if (status === 403) return 'Нет доступа к хранилищу.'
  if (status === 404) return 'Хранилище не найдено. Сообщи учителю.'
  if (status === 413) return 'Файл слишком большой. Выбери картинку поменьше.'
  if (status >= 500) return 'Хранилище сейчас недоступно. Попробуй позже.'
  return 'Не получилось выполнить запрос. Попробуй ещё раз.'
}

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Нужно войти в аккаунт p5editor.')
  return token
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: `Bearer ${token}`
      }
    })
  } catch {
    throw new Error('Не получилось связаться с хранилищем. Проверь интернет и попробуй ещё раз.')
  }

  const text = await response.text()
  let payload: unknown = null
  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && typeof (payload as { message?: unknown }).message === 'string'
        ? (payload as { message: string }).message
        : fallbackMessage(response.status)
    throw new Error(message)
  }

  return payload as T
}

export function useYandexStorage() {
  const files = ref<YandexFile[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)
  const nextToken = ref<string | null>(null)
  const uploading = ref(false)

  const isConfigured = API_BASE.length > 0

  /** Загрузить список файлов (reset = true — с начала, false — следующая страница). */
  async function loadFiles(reset = true) {
    if (!isConfigured) {
      error.value = 'Хранилище пока не подключено. Сообщи учителю.'
      loaded.value = true
      return { success: false }
    }

    if (reset) {
      loading.value = true
      error.value = null
    } else {
      if (!nextToken.value) return { success: true }
      loadingMore.value = true
    }

    try {
      const params = new URLSearchParams({ limit: '100' })
      if (!reset && nextToken.value) params.set('token', nextToken.value)

      const page = await request<YandexFilesPage>(`/files?${params.toString()}`, { method: 'GET' })

      files.value = reset ? page.files : [...files.value, ...page.files]
      nextToken.value = page.nextToken
      loaded.value = true
      return { success: true }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Не получилось получить список картинок.'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  /**
   * Загрузить картинку: получаем подписанный POST у функции и отправляем файл
   * напрямую в Object Storage (с прогрессом через XHR).
   */
  async function uploadImage(
    file: File,
    onProgress: (percent: number) => void
  ): Promise<YandexFile> {
    uploading.value = true
    try {
      const ticket = await request<YandexUploadTicket>('/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size
        })
      })

      // Порядок полей важен: Content-Type и служебные поля — до файла.
      const form = new FormData()
      for (const [name, value] of Object.entries(ticket.fields)) {
        form.append(name, value)
      }
      form.append('file', file, file.name)

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', ticket.url)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100))
          }
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            onProgress(100)
            resolve()
          } else {
            reject(new Error('Хранилище не приняло файл. Попробуй ещё раз.'))
          }
        }
        xhr.onerror = () => {
          reject(new Error('Не получилось отправить файл. Проверь интернет и попробуй ещё раз.'))
        }
        xhr.ontimeout = () => {
          reject(new Error('Загрузка заняла слишком много времени. Попробуй ещё раз.'))
        }

        xhr.send(form)
      })

      return {
        key: ticket.key,
        size: file.size,
        lastModified: new Date().toISOString(),
        url: ticket.publicUrl
      }
    } finally {
      uploading.value = false
    }
  }

  return {
    // состояние
    files,
    loading,
    loadingMore,
    loaded,
    error,
    nextToken,
    uploading,
    isConfigured,
    // действия
    loadFiles,
    uploadImage
  }
}
