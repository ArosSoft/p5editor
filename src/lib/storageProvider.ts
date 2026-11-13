import type { StorageProvider } from '../types/storage'

// Выбранное хранилище запоминаем в браузере отдельно для каждого пользователя.
// Так на школьном компьютере каждый входит под своим аккаунтом и видит свой выбор.

const PROVIDERS: StorageProvider[] = ['cloudinary', 'yandex']

function storageKey(userId: string | null | undefined): string {
  return userId ? `p5editor-storage-provider:${userId}` : 'p5editor-storage-provider'
}

export function readStorageProvider(userId: string | null | undefined): StorageProvider | null {
  try {
    const saved = localStorage.getItem(storageKey(userId))
    return saved && (PROVIDERS as string[]).includes(saved) ? (saved as StorageProvider) : null
  } catch {
    return null
  }
}

export function saveStorageProvider(
  userId: string | null | undefined,
  provider: StorageProvider
): void {
  try {
    localStorage.setItem(storageKey(userId), provider)
  } catch {
    // Приватный режим браузера — просто не запомним выбор
  }
}

export function clearStorageProvider(userId: string | null | undefined): void {
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    // ignore
  }
}

/** Куда вести после выбора хранилища. */
export function providerRoute(provider: StorageProvider): string {
  return provider === 'yandex' ? '/images/yandex' : '/images/cloudinary'
}
