// Типы для хранилища изображений в Yandex Object Storage
// (ответы Yandex Cloud Function через API Gateway)

export type StorageProvider = 'cloudinary' | 'yandex'

// Файл в бакете
export interface YandexFile {
  key: string
  size: number
  lastModified: string | null
  url: string
}

// Ответ GET /files
export interface YandexFilesPage {
  files: YandexFile[]
  nextToken: string | null
  truncated: boolean
}

// Ответ POST /upload-url (presigned POST)
export interface YandexUploadTicket {
  url: string
  fields: Record<string, string>
  key: string
  publicUrl: string
  contentType: string
  maxBytes: number
  expiresIn: number
  expiresAt: string
}
