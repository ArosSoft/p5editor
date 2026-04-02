<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useSketches } from '../composables/useSketches'
import { useStorage } from '../composables/useStorage'

const router = useRouter()
const { user, profile, isAuthenticated, isReady, readyPromise } = useAuth()
const { createSketch } = useSketches()
const { uploadFile, uploading } = useStorage()

// Вспомогательная функция для сообщений
function addMessage(msg: string) {
  console.log('[SharePage] ' + msg)
}

// Состояние формы
const title = ref('')
const description = ref('')
const tags = ref('')
const category = ref('Анимация')
const difficulty = ref<'Лёгкая' | 'Средняя' | 'Тяжёлая'>('Средняя')
const thumbnail = ref<string | null>(null)
const thumbnailFile = ref<File | null>(null)
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const formErrors = ref<Record<string, string>>({})

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
    // Создаём File из base64 для загрузки
    fetch(savedSnapshot)
      .then(res => res.blob())
      .then(blob => {
        thumbnailFile.value = new File([blob], 'thumbnail.png', { type: 'image/png' })
      })
      .catch(() => {})
  }
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
    
    // Создаём File из base64 для загрузки
    fetch(savedSnapshot)
      .then(res => res.blob())
      .then(blob => {
        thumbnailFile.value = new File([blob], 'thumbnail.png', { type: 'image/png' })
        addMessage('📷 Изображение загружено из памяти')
      })
      .catch(() => {
        addMessage('⚠️ Не удалось создать файл из памяти')
      })
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
  if (!validateForm()) return
  if (!user.value || !profile.value) {
    alert('Ошибка авторизации. Пожалуйста, войдите в систему.')
    return
  }

  isSubmitting.value = true
  formErrors.value = {}

  let thumbnailUrl: string | null = null

  // === 1. Пытаемся загрузить thumbnail с коротким таймаутом ===
  if (thumbnailFile.value) {
    try {
      console.log('[SharePage] Начинаем загрузку thumbnail...')

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Таймаут загрузки миниатюры')), 18000) // 18 секунд
      })

      const uploadPromise = uploadFile(thumbnailFile.value, 'thumbnails')

      const uploadResult = await Promise.race([uploadPromise, timeoutPromise])

      if (uploadResult.success && uploadResult.url) {
        thumbnailUrl = uploadResult.url
        console.log('[SharePage] Thumbnail успешно загружен:', thumbnailUrl)
      } else {
        console.warn('[SharePage] Не удалось загрузить thumbnail:', uploadResult.error)
      }
    } catch (err: any) {
      console.warn('[SharePage] Ошибка/таймаут при загрузке thumbnail:', err.message)
      // Продолжаем без миниатюры — это не критично
    }
  }

  // === 2. Создаём скетч (даже если thumbnail не загрузился) ===
  try {
    const result = await createSketch({
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
      status: 'pending'
    })

    if (result.success) {
      submitSuccess.value = true
      // Очищаем временные данные
      localStorage.removeItem('p5editor_canvas_snapshot')

      addMessage('✅ Скетч успешно отправлен на модерацию!')
      
      setTimeout(() => {
        router.push('/explore')
      }, 2000)
    } else {
      throw new Error(result.error || 'Неизвестная ошибка сервера')
    }
  } catch (err: any) {
    console.error('[SharePage] Ошибка создания скетча:', err)
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
              :disabled="isSubmitting || uploading || !title || !description"
            >
              {{ isSubmitting ? '⏳ Отправка...' : uploading ? '⏳ Загрузка...' : '🚀 Опубликовать' }}
            </button>
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
}
</style>
