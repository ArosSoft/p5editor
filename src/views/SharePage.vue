<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSketches } from '../composables/useSketches'
import { useStorage } from '../composables/useStorage'
import { supabase } from '../lib/supabase'

const router = useRouter()
const { user, profile, isAuthenticated, isReady, readyPromise } = useAuth()
const { createSketch } = useSketches()
const { uploadFile, uploading } = useStorage()

// Вспомогательная функция для сообщений
function addMessage(msg: string) {
  console.log('[SharePage] ' + msg)
}

// Синхронное преобразование dataURL → File (избегает race condition при SPA-переходе)
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(',')
  const mimeMatch = arr[0]?.match(/:(.*?);/)
  if (!mimeMatch) throw new Error('Неверный формат dataURL')
  const mime = mimeMatch[1]
  const bstr = atob(arr[1] ?? '')
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) u8arr[n] = bstr.charCodeAt(n)
  return new File([u8arr], filename, { type: mime })
}

// Состояние формы
const title = ref('')
const description = ref('')
const tags = ref('')
const category = ref('Анимация')
const difficulty = ref<'Лёгкая' | 'Средняя' | 'Тяжёлая'>('Средняя')
const thumbnail = ref<string | null>(null)
const thumbnailFile = ref<File | null>(null)
const isThumbnailReady = ref(false)
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const formErrors = ref<Record<string, string>>({})

// Статус публикации (для отображения на странице)
const publishStatus = ref<{
  step: string
  message: string
  status: 'idle' | 'loading' | 'success' | 'error'
  timestamp: string
}[]>([])

// Функция для добавления шага в статус публикации
function addPublishStep(step: string, message: string, status: 'idle' | 'loading' | 'success' | 'error') {
  const timestamp = new Date().toLocaleTimeString('ru-RU')
  publishStatus.value.push({ step, message, status, timestamp })
  console.log(`[SharePage][${status.toUpperCase()}] ${step}: ${message}`)
}

// Очистка статуса публикации
function clearPublishStatus() {
  publishStatus.value = []
}

// Состояние проверки подключения к Supabase
const supabaseStatus = ref<'checking' | 'connected' | 'error'>('checking')
const supabaseResponseTime = ref<number | null>(null)
const isCheckingConnection = ref(false)
const isComponentMounted = ref(true)

// Вычисляемые свойства для отображения статуса
const supabaseStatusClass = computed(() => ({
  'status-checking': supabaseStatus.value === 'checking',
  'status-connected': supabaseStatus.value === 'connected',
  'status-error': supabaseStatus.value === 'error'
}))

const supabaseStatusText = computed(() => {
  if (supabaseStatus.value === 'checking') {
    return 'Проверка Supabase...'
  } else if (supabaseStatus.value === 'connected') {
    return supabaseResponseTime.value
      ? `Supabase: подключено (${Math.round(supabaseResponseTime.value)}мс)`
      : 'Supabase: подключено'
  } else {
    return 'Supabase: ошибка соединения'
  }
})

// Функция проверки доступности Supabase
const checkSupabaseConnection = async () => {
  // Если уже идёт проверка, не запускаем новую
  if (isCheckingConnection.value) {
    addMessage('⏳ Проверка уже выполняется...')
    return
  }

  isCheckingConnection.value = true
  supabaseStatus.value = 'checking'
  
  const startTime = Date.now()
  
  try {
    // Используем нативный fetch с таймаутом для проверки подключения
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    // Простой запрос к Supabase REST API
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL || 'https://gfupycrmnegbcafuoxdx.supabase.co'}/rest/v1/sketches?select=id&limit=1`,
      {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Yrru1vT4XDUZPY3_sm1XQ_j0YIdHLy',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9Yrru1vT4XDUZPY3_sm1XQ_j0YIdHLy'}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      }
    )
    
    clearTimeout(timeoutId)
    
    // Проверяем, что компонент всё ещё примонтирован перед обновлением UI
    if (!isComponentMounted.value) return

    const responseTime = Date.now() - startTime

    // Если ответ 200 или 401/403 - соединение есть
    if (response.ok || response.status === 401 || response.status === 403) {
      supabaseStatus.value = 'connected'
      supabaseResponseTime.value = responseTime
      addMessage(`✅ Supabase подключён (${responseTime}мс)`)
    } else {
      supabaseStatus.value = 'error'
      addMessage(`❌ Ошибка Supabase: ${response.status} ${response.statusText}`)
    }
  } catch (e: any) {
    // Проверяем, что компонент всё ещё примонтирован перед обновлением UI
    if (!isComponentMounted.value) return
    
    // Ошибка сети или таймаут
    supabaseStatus.value = 'error'
    const errorMsg = e.name === 'AbortError' ? 'Таймаут соединения (5с)' : e.message
    addMessage(`❌ Ошибка соединения с Supabase: ${errorMsg}`)
  } finally {
    if (isComponentMounted.value) {
      isCheckingConnection.value = false
    }
  }
}

// Категории
const categories = [
  'Анимация',
  'Генеративное',
  'Аудио',
  'Симуляция',
  'Интерактив',
  'Визуализация',
  'Игра',
  'Другое'
]

// Проверка авторизации и инициализация данных при загрузке
onMounted(async () => {
  // Ждём готовности авторизации
  if (!isReady.value && readyPromise.value) {
    await readyPromise.value
  }

  // Проверяем авторизацию через user.value (надёжнее, чем localStorage)
  if (!user.value) {
    alert('Для публикации скетча необходимо войти в систему')
    router.push('/')
    return
  }

  // Инициализируем название скетча из localStorage
  const savedName = localStorage.getItem('p5editor_current_name')
  if (savedName) {
    title.value = savedName
    addMessage(`📝 Название загружено: "${savedName}"`)
  } else {
    addMessage('⚠️ Название скетча не найдено в localStorage')
  }

  // Автоматически загружаем сохранённое изображение холста (если есть)
  const savedSnapshot = localStorage.getItem('p5editor_canvas_snapshot')
  if (savedSnapshot) {
    thumbnail.value = savedSnapshot
    // Синхронное создание File из dataURL (избегаем race condition с fetch)
    try {
      thumbnailFile.value = dataURLtoFile(savedSnapshot, 'thumbnail.png')
      isThumbnailReady.value = true
      addMessage('📷 Миниатюра готова (синхронно)')
    } catch (e) {
      console.error('[SharePage] Не удалось создать File из dataURL', e)
      addMessage('⚠️ Не удалось создать файл миниатюры')
    }
  }

  // Проверяем подключение к Supabase
  await checkSupabaseConnection()
})

// Очистка при уничтожении компонента
onUnmounted(() => {
  isComponentMounted.value = false
})

// Получение кода и названия из localStorage (для предпросмотра)
const sharedCode = computed(() => {
  return localStorage.getItem('p5editor_current_code') || ''
})

const sharedName = computed(() => {
  return localStorage.getItem('p5editor_current_name') || ''
})

// Загрузка thumbnail из файла
function handleThumbnailUpload(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    
    // Проверка размера файла (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      formErrors.value.thumbnail = 'Размер файла не должен превышать 5MB'
      return
    }
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      formErrors.value.thumbnail = 'Пожалуйста, выберите изображение'
      return
    }
    
    delete formErrors.value.thumbnail
    thumbnailFile.value = file
    isThumbnailReady.value = true

    const reader = new FileReader()
    reader.onload = (e) => {
      thumbnail.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// Создание thumbnail из canvas
function captureFromCanvas() {
  // Сначала пробуем получить изображение из localStorage (если было сохранено в редакторе)
  const savedSnapshot = localStorage.getItem('p5editor_canvas_snapshot')
  if (savedSnapshot) {
    thumbnail.value = savedSnapshot
    delete formErrors.value.thumbnail

    // Синхронное создание File из dataURL (избегаем race condition с fetch)
    try {
      thumbnailFile.value = dataURLtoFile(savedSnapshot, 'thumbnail.png')
      isThumbnailReady.value = true
      addMessage('📷 Изображение загружено из памяти')
    } catch (e) {
      console.error('[SharePage] Не удалось создать File из dataURL', e)
      addMessage('⚠️ Не удалось создать файл из памяти')
    }
    return
  }
  
  // Если нет сохранённого изображения, пробуем сделать скриншот из canvas
  const canvas = document.querySelector('canvas')
  if (canvas) {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'thumbnail.png', { type: 'image/png' })
        thumbnailFile.value = file
        thumbnail.value = canvas.toDataURL('image/png')
        delete formErrors.value.thumbnail
        addMessage('📷 Скриншот сделан из canvas')
      }
    }, 'image/png')
  } else {
    alert('Сначала запустите скетч в редакторе и нажмите "Сохранить холст"!')
  }
}

// Валидация формы
function validateForm(): boolean {
  formErrors.value = {}
  
  if (!title.value.trim()) {
    formErrors.value.title = 'Введите название скетча'
  } else if (title.value.length < 3) {
    formErrors.value.title = 'Название должно содержать минимум 3 символа'
  }
  
  if (!description.value.trim()) {
    formErrors.value.description = 'Введите описание скетча'
  } else if (description.value.length < 10) {
    formErrors.value.description = 'Описание должно содержать минимум 10 символов'
  }
  
  if (!sharedCode.value.trim()) {
    formErrors.value.code = 'Код скетча не найден. Создайте скетч в редакторе.'
  }
  
  return Object.keys(formErrors.value).length === 0
}

// Отправка формы
async function submitSketch() {
  console.log('[SharePage] === submitSketch вызвана ===')
  console.log('[SharePage] isSubmitting:', isSubmitting.value)
  console.log('[SharePage] uploading:', uploading.value)
  console.log('[SharePage] isCheckingConnection:', isCheckingConnection.value)
  console.log('[SharePage] supabaseStatus:', supabaseStatus.value)
  console.log('[SharePage] title:', title.value)
  console.log('[SharePage] description:', description.value)
  
  if (!validateForm()) {
    addMessage('❌ Ошибка валидации формы')
    return
  }
  if (!user.value || !profile.value) {
    alert('Ошибка авторизации. Пожалуйста, войдите в систему.')
    addMessage('❌ Ошибка авторизации: user или profile не найден')
    return
  }

  // Очищаем предыдущий статус публикации
  clearPublishStatus()
  addPublishStep('Инициализация', 'Начало процесса публикации скетча', 'loading')

  // Проверяем подключение к Supabase перед отправкой
  if (supabaseStatus.value !== 'connected') {
    addMessage('🔄 Выполняется проверка подключения к Supabase...')
    addPublishStep('Проверка подключения', 'Подключение к Supabase не установлено, проверяем...', 'loading')
    await checkSupabaseConnection()
  }

  if (supabaseStatus.value !== 'connected') {
    alert('Не удалось подключиться к Supabase. Проверьте соединение и попробуйте снова.')
    addPublishStep('Ошибка подключения', 'Не удалось подключиться к Supabase', 'error')
    return
  }

  addPublishStep('Проверка подключения', 'Supabase подключён успешно', 'success')

  isSubmitting.value = true
  formErrors.value = {}

  let thumbnailUrl: string | null = null

  // === 1. Загрузка thumbnail ===
  if (thumbnailFile.value) {
    addPublishStep('Загрузка миниатюры', `Начало загрузки файла: ${thumbnailFile.value.name}, размер: ${(thumbnailFile.value.size / 1024).toFixed(2)} KB`, 'loading')
    try {
      console.log('[SharePage] Начинаем загрузку thumbnail...')

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Таймаут загрузки миниатюры')), 60000) // 60 секунд
      })

      const uploadPromise = uploadFile(thumbnailFile.value, 'thumbnails')

      const uploadResult = await Promise.race([uploadPromise, timeoutPromise])

      if (uploadResult.success && uploadResult.url) {
        thumbnailUrl = uploadResult.url
        console.log('[SharePage] Thumbnail успешно загружен:', thumbnailUrl)
        addPublishStep('Загрузка миниатюры', `Миниатюра успешно загружена. URL: ${thumbnailUrl}`, 'success')
      } else {
        console.warn('[SharePage] Не удалось загрузить thumbnail:', uploadResult.error)
        addPublishStep('Загрузка миниатюры', `Ошибка загрузки: ${uploadResult.error}. Продолжаем без миниатюры.`, 'error')
      }
    } catch (err: any) {
      console.warn('[SharePage] Ошибка/таймаут при загрузке thumbnail:', err.message)
      addPublishStep('Загрузка миниатюры', `Ошибка/таймаут: ${err.message}. Продолжаем без миниатюры.`, 'error')
      // Продолжаем без миниатюры — это не критично
    }
  } else {
    addPublishStep('Загрузка миниатюры', 'Файл миниатюры не выбран. Продолжаем без миниатюры.', 'idle')
  }

  // === 2. Создание скетча ===
  addPublishStep('Создание скетча', 'Подготовка данных для создания скетча...', 'loading')
  
  const sketchData = {
    user_id: user.value.id,
    title: title.value.trim(),
    description: description.value.trim(),
    code: sharedCode.value,
    thumbnail_url: thumbnailUrl,
    tags: tags.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
      .slice(0, 10),
    category: category.value,
    difficulty: difficulty.value,
    status: 'pending' as const
  }

  addPublishStep('Создание скетча', `Отправка данных на сервер: название="${sketchData.title}", категория="${sketchData.category}", тегов=${sketchData.tags.length}`, 'loading')

  console.log('[SharePage] Данные для createSketch:', JSON.stringify(sketchData, null, 2))
  console.log('[SharePage] Вызов createSketch...')

  try {
    const result = await createSketch(sketchData)

    console.log('[SharePage] Результат createSketch:', result)

    if (result.success) {
      addPublishStep('Создание скетча', `Скетч успешно создан с ID: ${result.data?.id}. Отправлен на модерацию!`, 'success')
      submitSuccess.value = true
      // Очищаем временные данные
      localStorage.removeItem('p5editor_canvas_snapshot')

      addMessage('✅ Скетч успешно отправлен на модерацию!')

      // Принудительно ждём 3 секунды перед редиректом, чтобы Supabase точно закоммитил данные
      addPublishStep('Завершение', 'Перенаправление в галерею через 3 секунды...', 'success')
      setTimeout(() => {
        router.push('/explore')
      }, 3000)
    } else {
      throw new Error(result.error || 'Неизвестная ошибка сервера')
    }
  } catch (err: any) {
    console.error('[SharePage] Ошибка создания скетча:', err)
    addPublishStep('Ошибка создания скетча', `Произошла ошибка: ${err.message}`, 'error')
    alert(`Не удалось опубликовать скетч:\n${err.message}`)
  } finally {
    isSubmitting.value = false
  }
}

// Назад к редактору
function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="share-page">
    <!-- Уведомление об ошибке -->
    <div v-if="!isAuthenticated" class="auth-required">
      <span class="auth-icon">🔐</span>
      <h2>Требуется авторизация</h2>
      <p>Для публикации скетча необходимо войти в систему</p>
      <button @click="router.push('/')" class="login-btn">
        Войти в систему
      </button>
    </div>

    <template v-else>
      <!-- Успешная отправка -->
      <div v-if="submitSuccess" class="success-message">
        <span class="success-icon">✅</span>
        <h2>Скетч отправлен на модерацию!</h2>
        <p>После проверки он появится в галерее сообщества</p>
        <p class="redirect-text">Перенаправление в галерею...</p>
      </div>

      <!-- Форма -->
      <div v-else class="share-content">
        <!-- Заголовок -->
        <header class="share-header">
          <button @click="goBack" class="back-btn">
            ← Назад к редактору
          </button>
          <h1 class="page-title">
            <span class="title-icon">📤</span>
            Поделиться скетчем
          </h1>
        </header>

        <div class="form-container">
          <!-- Статус подключения к Supabase -->
          <div class="form-section">
            <h2 class="section-title">🔌 Подключение к серверу</h2>
            <div class="supabase-status" :class="supabaseStatusClass">
              <span class="status-indicator"></span>
              <span class="status-text">{{ supabaseStatusText }}</span>
              <button 
                v-if="supabaseStatus !== 'checking'" 
                @click="checkSupabaseConnection" 
                class="refresh-status-btn"
                :disabled="isCheckingConnection"
              >
                🔄 Обновить
              </button>
            </div>
          </div>

          <!-- Основная информация -->
          <div class="form-section">
            <h2 class="section-title">📝 Основная информация</h2>

            <div class="form-group">
              <label class="form-label">
                Название скетча <span class="required">*</span>
              </label>
              <input
                v-model="title"
                type="text"
                class="form-input"
                :class="{ 'input-error': formErrors.title }"
                placeholder="Придумайте название"
                maxlength="100"
              />
              <span v-if="formErrors.title" class="error-message">{{ formErrors.title }}</span>
              <span class="char-count">{{ title.length }}/100</span>
            </div>

            <div class="form-group">
              <label class="form-label">
                Описание <span class="required">*</span>
              </label>
              <textarea
                v-model="description"
                class="form-textarea"
                :class="{ 'input-error': formErrors.description }"
                placeholder="Опишите ваш скетч: что он делает, какие техники использует..."
                rows="4"
                maxlength="500"
              />
              <span v-if="formErrors.description" class="error-message">{{ formErrors.description }}</span>
              <span class="char-count">{{ description.length }}/500</span>
            </div>
          </div>

          <!-- Категория и сложность -->
          <div class="form-section">
            <h2 class="section-title">📊 Категоризация</h2>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Категория</label>
                <select v-model="category" class="form-select">
                  <option v-for="cat in categories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Сложность</label>
                <select v-model="difficulty" class="form-select">
                  <option value="Лёгкая">🟢 Лёгкая</option>
                  <option value="Средняя">🟡 Средняя</option>
                  <option value="Тяжёлая">🔴 Тяжёлая</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Теги</label>
              <input
                v-model="tags"
                type="text"
                class="form-input"
                placeholder="анимация, частицы, эффекты (через запятую)"
              />
              <span class="form-hint">Перечислите теги через запятую (максимум 10)</span>
            </div>
          </div>

          <!-- Thumbnail -->
          <div class="form-section">
            <h2 class="section-title">🖼️ Миниатюра</h2>

            <div class="thumbnail-section">
              <div class="thumbnail-preview" :style="{
                background: thumbnail ? `url(${thumbnail}) center/cover` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }">
                <span v-if="!thumbnail" class="thumbnail-placeholder-icon">🎨</span>
              </div>

              <div class="thumbnail-actions">
                <label class="thumbnail-btn">
                  <input
                    type="file"
                    @change="handleThumbnailUpload"
                    accept="image/*"
                    hidden
                  />
                  📁 Загрузить изображение
                </label>
                <button @click="captureFromCanvas" class="thumbnail-btn capture-btn">
                  📷 Сделать скриншот из canvas
                </button>
                <span v-if="formErrors.thumbnail" class="error-message">{{ formErrors.thumbnail }}</span>
              </div>
            </div>
          </div>

          <!-- Предпросмотр кода -->
          <div class="form-section">
            <h2 class="section-title">💻 Код скетча</h2>

            <div v-if="sharedCode" class="code-preview">
              <div class="code-preview-header">
                <span class="code-info">Код будет сохранён из редактора</span>
                <span class="code-length">{{ sharedCode.length }} символов</span>
              </div>
              <pre class="code-block"><code>{{ sharedCode.substring(0, 500) }}{{ sharedCode.length > 500 ? '...' : '' }}</code></pre>
            </div>
            <div v-else class="no-code">
              <span class="no-code-icon">⚠️</span>
              <p>Код скетча не найден</p>
              <p class="hint">Сначала создайте скетч в редакторе</p>
            </div>
            <span v-if="formErrors.code" class="error-message block-error">{{ formErrors.code }}</span>
          </div>

          <!-- Кнопки -->
          <div class="form-actions">
            <button @click="goBack" class="cancel-btn">
              Отмена
            </button>
            <button
              @click="submitSketch"
              class="submit-btn"
              :disabled="isSubmitting || uploading || isCheckingConnection || supabaseStatus !== 'connected' || !title || !description || !isThumbnailReady"
            >
              {{ isSubmitting ? '⏳ Отправка...' : uploading ? '⏳ Загрузка...' : isCheckingConnection ? '🔌 Проверка...' : supabaseStatus !== 'connected' ? '🔌 Нет подключения' : !isThumbnailReady ? '📷 Нет миниатюры' : '🚀 Опубликовать' }}
            </button>
          </div>

          <!-- Статус публикации -->
          <div v-if="publishStatus.length > 0" class="publish-status">
            <h3 class="status-title">📋 Статус публикации</h3>
            <div class="status-steps">
              <div
                v-for="(step, index) in publishStatus"
                :key="index"
                class="status-step"
                :class="`status-${step.status}`"
              >
                <span class="status-icon">
                  <template v-if="step.status === 'loading'">⏳</template>
                  <template v-else-if="step.status === 'success'">✅</template>
                  <template v-else-if="step.status === 'error'">❌</template>
                  <template v-else>⚪</template>
                </span>
                <div class="status-content">
                  <div class="status-step-title">{{ step.step }}</div>
                  <div class="status-step-message">{{ step.message }}</div>
                </div>
                <span class="status-timestamp">{{ step.timestamp }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Информация о модерации -->
        <div class="moderation-info">
          <h3>ℹ️ Как работает модерация</h3>
          <ul>
            <li>Ваш скетч будет проверен модераторами в течение 24 часов</li>
            <li>Запрещён вредоносный код и плагиат</li>
            <li>После одобрения скетч появится в галерее</li>
            <li>Вы получите уведомление о результате проверки</li>
          </ul>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.share-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #ffffff;
  padding-bottom: 3rem;
}

/* Уведомление об авторизации */
.auth-required {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
}

.auth-icon {
  font-size: 5rem;
}

.auth-required h2 {
  font-size: 1.75rem;
  margin: 0;
  color: #fff;
}

.auth-required p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 1.1rem;
}

.login-btn {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

/* Успешная отправка */
.success-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  gap: 1rem;
}

.success-icon {
  font-size: 5rem;
  animation: bounce 0.5s ease-out;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.success-message h2 {
  font-size: 2rem;
  margin: 0;
  color: #64c864;
}

.success-message p {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 1.1rem;
}

.redirect-text {
  margin-top: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

/* Заголовок */
.share-header {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1.5rem 3rem;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 2rem;
}

.back-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateX(-2px);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-icon {
  font-size: 2rem;
  -webkit-text-fill-color: initial;
}

/* Контент */
.share-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.95rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

.required {
  color: #ff6464;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.15);
}

.form-input.input-error,
.form-textarea.input-error {
  border-color: #ff6464;
  background: rgba(255, 100, 100, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.form-select option {
  background: #1a1a2e;
  color: #fff;
}

.form-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.char-count {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  text-align: right;
}

/* Ошибки валидации */
.error-message {
  font-size: 0.85rem;
  color: #ff6464;
  margin-top: 0.25rem;
}

.block-error {
  display: block;
  margin-top: 0.5rem;
}

/* Thumbnail */
.thumbnail-section {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.thumbnail-preview {
  width: 200px;
  height: 200px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.thumbnail-placeholder-icon {
  font-size: 4rem;
  opacity: 0.5;
}

.thumbnail-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.thumbnail-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-block;
}

.thumbnail-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.capture-btn {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.3);
}

.capture-btn:hover {
  background: rgba(102, 126, 234, 0.3);
}

/* Код */
.code-preview {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
}

.code-preview-header {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  font-size: 0.85rem;
}

.code-info {
  color: rgba(255, 255, 255, 0.7);
}

.code-length {
  color: rgba(255, 255, 255, 0.5);
}

.code-block {
  background: rgba(0, 0, 0, 0.5);
  padding: 1rem;
  margin: 0;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #e0e0e0;
  white-space: pre;
}

.no-code {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.6);
}

.no-code-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.no-code .hint {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.4);
}

/* Статус подключения */
.supabase-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  flex-wrap: wrap;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.status-text {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  flex: 1;
}

.status-checking {
  background: rgba(255, 152, 0, 0.1);
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.status-checking .status-indicator {
  background: #ff9800;
  animation: pulse 1.5s ease-in-out infinite;
}

.status-checking .status-text {
  color: #ff9800;
}

.status-connected {
  background: rgba(66, 184, 131, 0.1);
  border: 1px solid rgba(66, 184, 131, 0.3);
}

.status-connected .status-indicator {
  background: #42b883;
  box-shadow: 0 0 8px rgba(66, 184, 131, 0.5);
}

.status-connected .status-text {
  color: #42b883;
}

.status-error {
  background: rgba(244, 67, 54, 0.1);
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.status-error .status-indicator {
  background: #f44336;
  box-shadow: 0 0 8px rgba(244, 67, 54, 0.5);
}

.status-error .status-text {
  color: #f44336;
}

.refresh-status-btn {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;
}

.refresh-status-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
}

.refresh-status-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

/* Кнопки действий */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
}

.cancel-btn {
  padding: 0.75rem 2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.submit-btn {
  padding: 0.75rem 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Информация о модерации */
.moderation-info {
  margin-top: 2rem;
  padding: 1.5rem;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
}

.moderation-info h3 {
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
  color: #667eea;
}

.moderation-info ul {
  margin: 0;
  padding-left: 1.5rem;
  color: rgba(255, 255, 255, 0.7);
}

.moderation-info li {
  margin-bottom: 0.5rem;
}

/* Статус публикации */
.publish-status {
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.status-title {
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.9);
}

.status-steps {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.status-step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  transition: all 0.3s ease;
}

.status-step.status-loading {
  background: rgba(255, 152, 0, 0.1);
  border-left: 3px solid #ff9800;
}

.status-step.status-success {
  background: rgba(66, 184, 131, 0.1);
  border-left: 3px solid #42b883;
}

.status-step.status-error {
  background: rgba(244, 67, 54, 0.1);
  border-left: 3px solid #f44336;
}

.status-step.status-idle {
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid rgba(255, 255, 255, 0.3);
}

.status-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.status-content {
  flex: 1;
  min-width: 0;
}

.status-step-title {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.25rem;
}

.status-step-message {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.status-timestamp {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
  margin-top: 0.2rem;
}

/* Адаптивность */
@media (max-width: 768px) {
  .share-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem 1.5rem;
  }

  .share-content {
    padding: 0 1rem 2rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .thumbnail-section {
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column;
  }

  .submit-btn,
  .cancel-btn {
    width: 100%;
  }

  .status-step {
    flex-wrap: wrap;
  }

  .status-timestamp {
    width: 100%;
    text-align: right;
    margin-top: 0.5rem;
  }
}
</style>
