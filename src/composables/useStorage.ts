import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useStorage() {
  const uploading = ref(false)
  const error = ref<string | null>(null)
  const progress = ref(0)

  const BUCKET_NAME = 'user-content'

  // Загрузка файла
  async function uploadFile(
    file: File,
    folder: string,
    options?: {
      onProgress?: (progress: number) => void
    }
  ) {
    try {
      uploading.value = true
      error.value = null
      progress.value = 0

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const uploadPromise = supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      // Таймаут 30 секунд на загрузку
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Таймаут загрузки файла (30 секунд)')), 30000)
      })

      const { data, error: uploadError } = await Promise.race([uploadPromise, timeoutPromise])

      if (uploadError) throw uploadError

      // Получение публичной ссылки
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

      if (options?.onProgress) {
        options.onProgress(100)
      }
      progress.value = 100

      return { success: true, url: urlData.publicUrl, path: filePath }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки файла'
      console.error('Upload file error:', e)
      return { success: false, error: error.value }
    } finally {
      uploading.value = false
    }
  }

  // Загрузка аватара
  async function uploadAvatar(file: File, userId: string) {
    try {
      uploading.value = true
      error.value = null

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-avatar.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Удаляем старый аватар (если есть)
      const { data: existingFiles } = await supabase.storage
        .from(BUCKET_NAME)
        .list(`avatars`, {
          search: `${userId}-avatar`
        })

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from(BUCKET_NAME)
          .remove(existingFiles.map(f => `avatars/${f.name}`))
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

      return { success: true, url: urlData.publicUrl }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки аватара'
      console.error('Upload avatar error:', e)
      return { success: false, error: error.value }
    } finally {
      uploading.value = false
    }
  }

  // Загрузка thumbnail скетча
  async function uploadThumbnail(file: File, sketchId: string) {
    try {
      uploading.value = true
      error.value = null

      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = `${sketchId}-thumbnail.${fileExt}`
      const filePath = `thumbnails/${fileName}`

      // Удаляем старый thumbnail (если есть)
      const { data: existingFiles } = await supabase.storage
        .from(BUCKET_NAME)
        .list(`thumbnails`, {
          search: `${sketchId}-thumbnail`
        })

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from(BUCKET_NAME)
          .remove(existingFiles.map(f => `thumbnails/${f.name}`))
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath)

      return { success: true, url: urlData.publicUrl }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки thumbnail'
      console.error('Upload thumbnail error:', e)
      return { success: false, error: error.value }
    } finally {
      uploading.value = false
    }
  }

  // Удаление файла
  async function deleteFile(filePath: string) {
    try {
      uploading.value = true
      error.value = null

      const { error: deleteError } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath])

      if (deleteError) throw deleteError

      return { success: true }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка удаления файла'
      console.error('Delete file error:', e)
      return { success: false, error: error.value }
    } finally {
      uploading.value = false
    }
  }

  // Получение публичной ссылки
  function getPublicUrl(filePath: string) {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  // Загрузка нескольких файлов
  async function uploadMultipleFiles(
    files: File[],
    folder: string,
    options?: {
      onProgress?: (fileName: string, progress: number) => void
    }
  ) {
    try {
      uploading.value = true
      error.value = null

      const results = await Promise.all(
        files.map(async (file) => {
          const result = await uploadFile(file, folder, {
            onProgress: (p) => options?.onProgress?.(file.name, p)
          })
          return { fileName: file.name, ...result }
        })
      )

      const success = results.every(r => r.success)
      if (!success) {
        throw new Error('Некоторые файлы не загрузились')
      }

      return {
        success: true,
        urls: results.map(r => r.url as string)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Ошибка загрузки файлов'
      console.error('Upload multiple files error:', e)
      return { success: false, error: error.value }
    } finally {
      uploading.value = false
    }
  }

  return {
    uploading,
    error,
    progress,
    uploadFile,
    uploadAvatar,
    uploadThumbnail,
    deleteFile,
    getPublicUrl,
    uploadMultipleFiles
  }
}
