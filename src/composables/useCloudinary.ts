import { ref } from 'vue'
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase'
import type {
  CloudinaryAccountSafe,
  CloudinaryImage,
  CloudinaryImagesPage,
  CloudinaryUsage
} from '../types/supabase'

/**
 * Хранилище изображений Cloudinary: привязка личного аккаунта пользователя
 * и его картинки. Все операции с Cloudinary идут через Edge Function
 * cloudinary-proxy (секрет никогда не попадает в браузер).
 */

export interface CloudinaryLinkForm {
  cloud_name: string
  api_key: string
  api_secret: string
}

/** Допустимые типы файлов и максимальный размер (как в Edge Function). */
export const ALLOWED_UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

interface ProxyErrorBody {
  success: false
  error?: { code?: string; message?: string }
}

/** Вызов Edge Function с разбором ошибок в понятные школьнику сообщения. */
async function invokeProxy<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke('cloudinary-proxy', {
    body: { action, ...payload }
  })

  if (error) {
    // Функция вернула не-2xx: достаём её JSON с понятным сообщением
    const ctx = (error as { context?: unknown }).context
    if (ctx && typeof ctx === 'object' && 'json' in (ctx as object)) {
      try {
        const body = (await (ctx as Response).json()) as ProxyErrorBody
        if (body?.error?.message) throw new Error(body.error.message)
      } catch (e) {
        if (e instanceof Error && e.message && !(e instanceof SyntaxError)) throw e
      }
    }
    const msg = error.message || ''
    if (msg.includes('fetch') || msg.includes('Network')) {
      throw new Error('Нет связи с сервером. Проверь интернет и попробуй ещё раз.')
    }
    throw new Error('Сервер ответил ошибкой. Попробуй ещё раз.')
  }

  const body = data as { success?: boolean; data?: T } | ProxyErrorBody
  if (!body || body.success === false) {
    const message =
      body && 'error' in body && body.error?.message
        ? body.error.message
        : 'Что-то пошло не так. Попробуй ещё раз.'
    throw new Error(message)
  }
  return (body as { data: T }).data
}

export function useCloudinary() {
  // Привязка аккаунта (безопасный view без секрета)
  const account = ref<CloudinaryAccountSafe | null>(null)
  const accountLoading = ref(false)
  const accountError = ref<string | null>(null)

  // Список картинок
  const images = ref<CloudinaryImage[]>([])
  const imagesLoading = ref(false)
  const imagesError = ref<string | null>(null)
  const imagesLoaded = ref(false)
  const totalCount = ref<number | null>(null)
  const nextCursor = ref<string | null>(null)

  // Использование аккаунта (план и кредиты) — необязательная информация
  const usage = ref<CloudinaryUsage | null>(null)
  const usageLoading = ref(false)

  // Действия
  const linking = ref(false)
  const unlinking = ref(false)
  const deletingId = ref<string | null>(null)

  // ---------- Привязка аккаунта ----------

  /** Загрузить текущую привязку через безопасный view (своя строка, без секрета). */
  async function loadAccount() {
    accountLoading.value = true
    accountError.value = null
    try {
      const { data, error } = await supabase
        .from('cloudinary_accounts_safe')
        .select('*')
        .maybeSingle()
      if (error) throw error
      account.value = (data as CloudinaryAccountSafe | null) ?? null
      return { success: true }
    } catch (e) {
      accountError.value = e instanceof Error ? e.message : 'Не удалось загрузить данные аккаунта'
      account.value = null
      return { success: false, error: accountError.value }
    } finally {
      accountLoading.value = false
    }
  }

  /** Проверить ключи Cloudinary без сохранения. */
  async function verifyKeys(form: CloudinaryLinkForm) {
    await invokeProxy('verify', { ...form })
    return { success: true }
  }

  /**
   * Привязать аккаунт: ключи проверяются в Edge Function через Cloudinary
   * /usage, затем api_secret сохраняется зашифрованным.
   */
  async function linkAccount(form: CloudinaryLinkForm) {
    linking.value = true
    try {
      await invokeProxy('link', { ...form })
      await loadAccount()
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Не удалось подключить аккаунт' }
    } finally {
      linking.value = false
    }
  }

  /** Отвязать аккаунт Cloudinary (шифрованный секрет удаляется из БД). */
  async function unlinkAccount() {
    unlinking.value = true
    try {
      await invokeProxy('unlink')
      account.value = null
      images.value = []
      imagesLoaded.value = false
      totalCount.value = null
      nextCursor.value = null
      usage.value = null
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Не удалось отвязать аккаунт' }
    } finally {
      unlinking.value = false
    }
  }

  // ---------- Список картинок ----------

  /** Загрузить картинки пользователя (страницами по 30). */
  async function loadImages(reset = true) {
    if (!account.value) {
      images.value = []
      imagesLoaded.value = false
      return { success: true }
    }
    if (imagesLoading.value) return { success: true }

    imagesLoading.value = true
    if (reset) imagesError.value = null
    try {
      const cursor = reset ? null : nextCursor.value
      const page = await invokeProxy<CloudinaryImagesPage>('list', {
        next_cursor: cursor ?? undefined
      })
      images.value = reset ? page.images : [...images.value, ...page.images]
      totalCount.value = page.total_count
      nextCursor.value = page.next_cursor
      imagesLoaded.value = true
      return { success: true }
    } catch (e) {
      imagesError.value = e instanceof Error ? e.message : 'Не удалось загрузить картинки'
      return { success: false, error: imagesError.value }
    } finally {
      imagesLoading.value = false
    }
  }

  /** Загрузить следующую страницу картинок. */
  async function loadMoreImages() {
    if (!nextCursor.value) return { success: true }
    return loadImages(false)
  }

  /**
   * Узнать использование аккаунта (план и кредиты) через Cloudinary /usage.
   * Информация необязательная: при ошибке просто скрываем блок.
   */
  async function loadUsage() {
    if (!account.value) {
      usage.value = null
      return { success: true }
    }
    usageLoading.value = true
    try {
      usage.value = await invokeProxy<CloudinaryUsage>('usage')
      return { success: true }
    } catch (e) {
      usage.value = null
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Не удалось узнать использование аккаунта'
      }
    } finally {
      usageLoading.value = false
    }
  }

  /** Удалить картинку (пользовательскую, из его же аккаунта Cloudinary). */
  async function deleteImage(publicId: string) {
    deletingId.value = publicId
    try {
      await invokeProxy('delete', { public_id: publicId })
      images.value = images.value.filter(img => img.public_id !== publicId)
      if (totalCount.value !== null) totalCount.value = Math.max(0, totalCount.value - 1)
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Не удалось удалить картинку' }
    } finally {
      deletingId.value = null
    }
  }

  // ---------- Загрузка картинок ----------

  /**
   * Загрузить картинку в аккаунт пользователя через Edge Function.
   * Использует XMLHttpRequest (а не supabase.functions.invoke), чтобы
   * показывать реальный прогресс загрузки файла.
   */
  async function uploadImage(
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; error?: string; image?: CloudinaryImage }> {
    // Проверки до отправки — понятные сообщения без ожидания сервера
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      return { success: false, error: 'Это не картинка. Подходят PNG, JPG, GIF и WebP.' }
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return { success: false, error: 'Файл больше 10 МБ. Выбери картинку поменьше.' }
    }

    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      return { success: false, error: 'Нужно войти в аккаунт p5editor' }
    }

    const form = new FormData()
    form.append('action', 'upload')
    form.append('file', file, file.name)

    return new Promise(resolve => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${supabaseUrl}/functions/v1/cloudinary-proxy`)
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
      xhr.setRequestHeader('apikey', supabaseAnonKey)
      xhr.timeout = 180000

      xhr.upload.onprogress = event => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      }

      xhr.onload = () => {
        let body: { success?: boolean; data?: { image?: CloudinaryImage }; error?: { message?: string } } | null = null
        try {
          body = JSON.parse(xhr.responseText)
        } catch {
          body = null
        }

        if (xhr.status >= 200 && xhr.status < 300 && body?.success) {
          onProgress?.(100)
          resolve({ success: true, image: body.data?.image })
          return
        }
        resolve({
          success: false,
          error: body?.error?.message || 'Не удалось загрузить картинку. Попробуй ещё раз.'
        })
      }

      xhr.onerror = () =>
        resolve({ success: false, error: 'Нет связи с сервером. Проверь интернет и попробуй ещё раз.' })
      xhr.ontimeout = () =>
        resolve({ success: false, error: 'Сервер долго не отвечает. Попробуй ещё раз.' })

      xhr.send(form)
    })
  }

  return {
    // состояние
    account,
    accountLoading,
    accountError,
    images,
    imagesLoading,
    imagesError,
    imagesLoaded,
    totalCount,
    nextCursor,
    usage,
    usageLoading,
    // действия
    linking,
    unlinking,
    deletingId,
    loadAccount,
    verifyKeys,
    linkAccount,
    unlinkAccount,
    loadImages,
    loadMoreImages,
    loadUsage,
    deleteImage,
    uploadImage
  }
}
