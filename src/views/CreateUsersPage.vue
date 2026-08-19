<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../composables/useAuth'

// Домен для email новых пользователей (при необходимости измените)
const EMAIL_DOMAIN = 'user.local'
const DEFAULT_PASSWORD = 'ghbdtn'
const DEFAULT_ROWS = 5

const router = useRouter()
const { isReady, readyPromise, isModerator } = useAuth()

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

interface UserField {
  surname: string
  name: string
}

interface GenerateResult {
  username: string
  email: string
  display_name: string
  password: string
  success: boolean
  error?: string
}

const ERROR_CODE_MESSAGES: Record<string, string> = {
  user_already_exists: 'Пользователь с таким email уже зарегистрирован',
  weak_password: 'Слабый пароль — ужесточите требования к паролю в настройках проекта',
  email_provider_disabled: 'Регистрация через email отключена в настройках проекта',
  signup_disabled: 'Регистрация отключена в настройках проекта',
  validation_failed: 'Ошибка валидации данных',
  bad_json: 'Некорректный JSON запроса',
  over_email_send_rate_limit:
    'Превышен лимит отправки писем подтверждения. Отключите «Confirm email» в настройках проекта или повторите позже'
}

function formatError(error: { message?: string; code?: string }): string {
  const code = error.code
  if (code && ERROR_CODE_MESSAGES[code]) {
    return ERROR_CODE_MESSAGES[code]
  }
  return error.message ?? 'Неизвестная ошибка'
}

const fields = ref<UserField[]>(
  Array.from({ length: DEFAULT_ROWS }, () => ({ surname: '', name: '' }))
)
const generating = ref(false)
const results = ref<GenerateResult[]>([])
const notification = ref<{ message: string; type: 'success' | 'error' } | null>(null)

interface ExistingUser {
  email: string
  display_name: string | null
  role: string
  created_at: string
}

const showUsers = ref(false)
const existingUsers = ref<ExistingUser[]>([])
const usersLoading = ref(false)
const usersError = ref<string | null>(null)

async function loadExistingUsers() {
  usersLoading.value = true
  usersError.value = null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email, display_name, role, created_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    existingUsers.value = (data ?? []) as ExistingUser[]
  } catch (e) {
    usersError.value = e instanceof Error ? e.message : 'Ошибка загрузки пользователей'
  } finally {
    usersLoading.value = false
  }
}

function toggleUsers() {
  showUsers.value = !showUsers.value
  if (showUsers.value && existingUsers.value.length === 0) {
    loadExistingUsers()
  }
}

onMounted(async () => {
  syncThemeFromStorage()
  if (!isReady.value && readyPromise.value) {
    await readyPromise.value
  }
  if (!isModerator.value) {
    router.push('/')
  }
})

function addField() {
  fields.value.push({ surname: '', name: '' })
}

function removeField(index: number) {
  if (fields.value.length > 1) {
    fields.value.splice(index, 1)
  }
}

function showNotification(message: string, type: 'success' | 'error') {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 4000)
}

// Транслитерация русских букв в латиницу
const TRANSLIT_MAP: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya'
}

// Буквы → латиница (первые 3-4 буквы слова)
function transliterateFirstLetters(word: string, max = 4): string {
  const cleaned = word.toLowerCase().replace(/[ё]/g, 'е')
  let result = ''
  for (const char of cleaned) {
    if (result.length >= max) break
    const latin = TRANSLIT_MAP[char]
    if (latin) {
      result += latin
    }
  }
  return result
}

function generateUsername(surname: string, name: string): string {
  return transliterateFirstLetters(surname) + transliterateFirstLetters(name)
}

function normalizeName(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^[а-яёА-ЯЁ]/, (ch) => ch.toUpperCase())
}

async function generateUsers() {
  const valid = fields.value.filter((f) => f.surname.trim() && f.name.trim())

  if (valid.length === 0) {
    showNotification('Заполните фамилии и имена хотя бы одного пользователя', 'error')
    return
  }

  generating.value = true
  results.value = []

  // Сохраняем сессию администратора: при autoconfirm signUp
  // возвращает сессию нового пользователя и перезаписывает текущую
  const { data: adminSession } = await supabase.auth.getSession()
  const adminSessionData = adminSession.session
    ? { access_token: adminSession.session.access_token, refresh_token: adminSession.session.refresh_token }
    : null

  const usedLogins = new Set<string>()

  for (const field of valid) {
    const surname = normalizeName(field.surname)
    const name = normalizeName(field.name)

    let username = generateUsername(surname, name)
    let suffix = 1
    while (usedLogins.has(username)) {
      username = `${generateUsername(surname, name)}${suffix}`
      suffix++
    }
    usedLogins.add(username)

    const email = `${username}@${EMAIL_DOMAIN}`
    const display_name = `${surname} ${name}`

    const { error } = await supabase.auth.signUp({
      email,
      password: DEFAULT_PASSWORD,
      options: {
        data: { display_name }
      }
    })

    if (error) {
      console.error('[CreateUsers] Ошибка signUp для', email, error)
      results.value.push({
        username,
        email,
        display_name,
        password: DEFAULT_PASSWORD,
        success: false,
        error: formatError(error)
      })
    } else {
      results.value.push({
        username,
        email,
        display_name,
        password: DEFAULT_PASSWORD,
        success: true
      })
    }
  }

  // Восстанавливаем сессию администратора, если signUp её перезаписал
  if (adminSessionData) {
    try {
      await supabase.auth.setSession(adminSessionData)
    } catch (e) {
      console.warn('[CreateUsers] Не удалось восстановить сессию администратора', e)
    }
  }

  generating.value = false

  const created = results.value.filter((r) => r.success).length
  if (created > 0) {
    showNotification(
      `Создано пользователей: ${created} из ${results.value.length}`,
      'success'
    )
  } else {
    const firstError = results.value.find((r) => r.error)?.error
    showNotification(
      firstError ? `Не удалось создать пользователей: ${firstError}` : 'Не удалось создать пользователей',
      'error'
    )
  }
}

const createdCount = computed(() => results.value.filter((r) => r.success).length)
</script>

<template>
  <div :class="['create-users-page', themeClass]">
    <Transition name="fade">
      <div v-if="notification" :class="['notification', notification.type]">
        {{ notification.message }}
      </div>
    </Transition>

    <header class="page-header">
      <button class="btn btn-ghost" @click="router.push('/')">← Назад</button>
      <div class="header-content">
        <h1>Создание пользователей</h1>
        <p class="subtitle">Массовое создание учетных записей</p>
      </div>
    </header>

    <div class="content">
      <div class="card">
        <div class="card-header">
          <h2>Пользователи</h2>
          <button class="btn btn-secondary" @click="addField">+ Добавить поле</button>
        </div>

        <div class="fields-list">
          <div v-for="(field, index) in fields" :key="index" class="field-row">
            <span class="row-number">{{ index + 1 }}</span>
            <div class="field-group">
              <input
                :id="`surname-${index}`"
                v-model="field.surname"
                type="text"
                placeholder="Фамилия"
                aria-label="Фамилия"
              />
            </div>
            <div class="field-group">
              <input
                :id="`name-${index}`"
                v-model="field.name"
                type="text"
                placeholder="Имя"
                aria-label="Имя"
              />
            </div>
            <button
              v-if="fields.length > 1"
              class="btn-remove"
              title="Удалить поле"
              @click="removeField(index)"
            >
              ×
            </button>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-primary" :disabled="generating" @click="generateUsers">
            {{ generating ? 'Создание...' : 'Сгенерировать пользователей' }}
          </button>
        </div>
      </div>

      <div v-if="results.length" class="card">
        <div class="card-header">
          <h2>Результат</h2>
          <span class="status-badge">{{ createdCount }} / {{ results.length }}</span>
        </div>

        <div class="results-table">
          <div class="table-row table-head">
            <span>Логин</span>
            <span>Пароль</span>
            <span>ФИО</span>
            <span>Статус</span>
          </div>
          <div v-for="(result, index) in results" :key="index" class="table-row">
            <span class="login">{{ result.email }}</span>
            <span class="password">{{ result.password }}</span>
            <span>{{ result.display_name }}</span>
            <span :class="['status', result.success ? 'ok' : 'fail']">
              {{ result.success ? 'Создан' : 'Ошибка' }}
              <span v-if="!result.success && result.error" class="status-error" :title="result.error">
                {{ result.error }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div class="card users-card">
        <div class="card-header">
          <h2>Созданные пользователи</h2>
          <button class="btn btn-secondary" @click="toggleUsers">
            {{ showUsers ? 'Скрыть' : 'Показать' }}
          </button>
        </div>

        <div v-if="showUsers" class="users-list">
          <div v-if="usersLoading" class="users-hint">Загрузка...</div>
          <div v-else-if="usersError" class="users-hint users-error">{{ usersError }}</div>
          <div v-else-if="existingUsers.length === 0" class="users-hint">
            Пользователи ещё не созданы
          </div>
          <template v-else>
            <div class="table-row table-head">
              <span>Email</span>
              <span>ФИО</span>
              <span>Роль</span>
              <span>Создан</span>
            </div>
            <div v-for="(user, index) in existingUsers" :key="user.email + index" class="table-row">
              <span class="login">{{ user.email }}</span>
              <span>{{ user.display_name || '—' }}</span>
              <span>{{ user.role }}</span>
              <span>{{ new Date(user.created_at).toLocaleDateString('ru-RU') }}</span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-dark {
  --bg-primary: #1a1a1a;
  --bg-secondary: rgba(30, 30, 30, 0.8);
  --bg-card: rgba(255, 255, 255, 0.05);
  --bg-input: rgba(255, 255, 255, 0.08);
  --border-color: rgba(255, 255, 255, 0.1);
  --text-primary: #ffffff;
  --text-secondary: #aaaaaa;
  --text-muted: #666666;
  --accent-color: #646cff;
  --success-color: #10b981;
  --error-color: #ef4444;
}

.theme-light {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --bg-input: #f9fafb;
  --border-color: #e5e7eb;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --accent-color: #646cff;
  --success-color: #059669;
  --error-color: #dc2626;
}

.create-users-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.notification.success {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success-color);
}

.notification.error {
  background: rgba(239, 68, 68, 0.1);
  color: var(--error-color);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.page-header {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-content h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.125rem 0;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
}

.theme-light .btn-ghost {
  background: rgba(0, 0, 0, 0.04);
  color: #374151;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.14);
}

.theme-light .btn-ghost:hover {
  background: rgba(0, 0, 0, 0.08);
}

.btn-secondary {
  background: var(--border-color);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--bg-input);
}

.btn-primary {
  background: var(--accent-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.card-header h2 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.row-number {
  width: 2rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.875rem;
  flex-shrink: 0;
}

.field-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.field-group label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.field-group input {
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  transition: border-color 0.2s;
  background: var(--bg-input);
  color: var(--text-primary);
}

.field-group input:focus {
  outline: none;
  border-color: var(--accent-color);
}

.btn-remove {
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-muted);
  width: 2rem;
  height: 2rem;
  font-size: 1.25rem;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.btn-remove:hover {
  border-color: var(--error-color);
  color: var(--error-color);
}

.actions {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-color);
}

.actions .btn {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.9375rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  background: rgba(100, 108, 255, 0.1);
  color: var(--accent-color);
}

.results-table {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr 0.7fr;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  font-size: 0.8125rem;
  border-bottom: 1px solid var(--border-color);
  align-items: center;
}

.users-list .table-row {
  grid-template-columns: 1.6fr 1fr 0.4fr 0.7fr;
}

.table-row:last-child {
  border-bottom: none;
}

.table-head {
  background: var(--bg-input);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.75rem;
}

.login,
.password {
  font-family: 'Fira Code', 'Consolas', monospace;
}

.status.ok {
  color: var(--success-color);
}

.status.fail {
  color: var(--error-color);
}

.status-error {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.6875rem;
  line-height: 1.3;
  color: var(--text-muted);
  white-space: normal;
  word-break: break-word;
}

.users-card {
  margin-top: 0;
}

.users-list {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.users-hint {
  padding: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.users-error {
  color: var(--error-color);
}

@media (max-width: 640px) {
  .create-users-page {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .table-row {
    grid-template-columns: 1fr 1fr;
  }

  .table-head {
    display: none;
  }

  .field-row {
    flex-wrap: wrap;
  }

  .row-number {
    display: none;
  }
}
</style>
