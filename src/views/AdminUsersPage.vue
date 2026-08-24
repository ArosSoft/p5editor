<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { isReady, readyPromise, isAdmin, user, loadProfile } = useAuth()

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

interface UserRow {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  role: string
  created_at: string
}

const users = ref<UserRow[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const roleFilter = ref<'all' | 'user' | 'moderator' | 'admin'>('all')
const page = ref(1)
const pageSize = 7
const total = ref(0)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const roleLabels: Record<string, string> = {
  user: 'Пользователь',
  moderator: 'Модератор',
  admin: 'Администратор'
}

const roleOptions = ['user', 'moderator', 'admin'] as const

const notification = ref<{ message: string; type: 'success' | 'error' } | null>(null)
const updatingId = ref<string | null>(null)

function showNotification(message: string, type: 'success' | 'error') {
  notification.value = { message, type }
  setTimeout(() => {
    notification.value = null
  }, 4000)
}

// Смена роли пользователя (админ-RBS разрешает UPDATE любого профиля)
async function updateRole(target: UserRow, newRole: (typeof roleOptions)[number]) {
  if (target.role === newRole) return

  // Защита: админ не может изменить свою собственную роль (риск самоблокировки)
  if (user.value && target.id === user.value.id) {
    showNotification('Нельзя изменить роль самому себе', 'error')
    return
  }

  updatingId.value = target.id
  const prevRole = target.role
  try {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', target.id)

    if (updateError) throw updateError

    target.role = newRole
    await logAction(`role_change:${newRole}`, target)
    showNotification(`Роль «${target.display_name || target.email}» → ${roleLabels[newRole]}`, 'success')
  } catch (e) {
    target.role = prevRole
    showNotification(e instanceof Error ? e.message : 'Ошибка смены роли', 'error')
  } finally {
    updatingId.value = null
  }
}

// Запись действия в аудит-лог (admin_audit_logs)
async function logAction(action: string, target: UserRow) {
  if (!user.value) return
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_id: user.value.id,
      action,
      target_user_id: target.id,
      target_email: target.email
    })
  } catch (e) {
    console.warn('[AdminUsers] Не удалось записать аудит:', e)
  }
}

// Сброс пароля: для локальных аккаунтов — модалка (без письма),
// для остальных — отправка письма со ссылкой.
async function resetPassword(target: UserRow) {
  if (isLocalAccount(target.email)) {
    openSetPassword(target)
    return
  }
  try {
    let basePath = '/'
    const pathname = window.location.pathname
    if (pathname === '/p5editor' || pathname.startsWith('/p5editor/')) {
      basePath = '/p5editor/'
    }
    const redirectTo = `${window.location.origin}${basePath}`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(target.email, {
      redirectTo
    })
    if (resetError) throw resetError

    await logAction('password_reset', target)

    // Отправка письма НЕ должна влиять на сессию админа.
    // Перепроверяем, что текущий администратор всё ещё на месте (перезагружаем профиль),
    // чтобы панель не «исчезла» из-за случайно подвисшего состояния.
    if (user.value) {
      await loadProfile(user.value.id)
    }

    showNotification(
      `Письмо для сброса пароля отправлено на ${target.email}. ` +
        `ВНИМАНИЕ: не открывайте ссылку из письма в этой же сессии/браузере — вы переключитесь на аккаунт пользователя и потеряете доступ к панели.`,
      'success'
    )
  } catch (e) {
    showNotification(e instanceof Error ? e.message : 'Ошибка сброса пароля', 'error')
  }
}

// Для локальных аккаунтов (@user.local) сброс пароля — напрямую через модалку,
// без отправки письма (используется Edge Function admin-set-password).
const showPasswordModal = ref(false)
const passwordTarget = ref<UserRow | null>(null)
const newPassword = ref('')
const confirmPassword = ref('')
const settingPassword = ref(false)

function isLocalAccount(email: string): boolean {
  return email.toLowerCase().endsWith('@user.local')
}

function openSetPassword(target: UserRow) {
  passwordTarget.value = target
  newPassword.value = ''
  confirmPassword.value = ''
  showPasswordModal.value = true
}

function closePasswordModal() {
  showPasswordModal.value = false
  passwordTarget.value = null
}

async function submitSetPassword() {
  if (!passwordTarget.value) return

  if (newPassword.value.length < 6) {
    showNotification('Пароль слишком короткий (минимум 6 символов)', 'error')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    showNotification('Пароли не совпадают', 'error')
    return
  }

  settingPassword.value = true
  try {
    const { error: fnError } = await supabase.functions.invoke('admin-set-password', {
      body: { userId: passwordTarget.value.id, newPassword: newPassword.value }
    })
    if (fnError) throw fnError

    await logAction('set_password', passwordTarget.value)
    showNotification(`Пароль для ${passwordTarget.value.email} успешно изменён`, 'success')
    closePasswordModal()
  } catch (e) {
    showNotification(e instanceof Error ? e.message : 'Ошибка смены пароля', 'error')
  } finally {
    settingPassword.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null

async function loadUsers() {
  loading.value = true
  error.value = null
  try {
    const from = (page.value - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('profiles')
      .select('id, email, display_name, avatar_url, role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    const q = search.value.trim()
    if (q) {
      query = query.or(`email.ilike.%${q}%,display_name.ilike.%${q}%`)
    }
    if (roleFilter.value !== 'all') {
      query = query.eq('role', roleFilter.value)
    }

    const { data, error: fetchError, count } = await query

    if (fetchError) throw fetchError

    users.value = (data ?? []) as UserRow[]
    total.value = count ?? users.value.length
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки пользователей'
    users.value = []
  } finally {
    loading.value = false
  }
}

function retryLoad() {
  loadUsers()
}

// Фильтрация запускается только после прекращения ввода (debounce)
function scheduleSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    loadUsers()
  }, 400)
}

function onRoleChange() {
  page.value = 1
  loadUsers()
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    loadUsers()
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
    loadUsers()
  }
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString('ru-RU')
  } catch {
    return value
  }
}

function userInitial(user: UserRow): string {
  const name = (user.display_name || user.email || '?').trim()
  return name ? name.charAt(0).toUpperCase() : '?'
}

onMounted(async () => {
  syncThemeFromStorage()
  if (!isReady.value && readyPromise.value) {
    await readyPromise.value
  }
  if (!isAdmin.value) {
    router.push('/')
    return
  }
  await loadUsers()
})

// Поиск: перезапуск фильтрации после паузы ввода (400 мс)
watch(search, () => {
  scheduleSearch()
})
</script>

<template>
  <div :class="['admin-users-page', themeClass]">
    <header class="page-header">
      <button class="btn btn-ghost" @click="router.push('/')">← Назад</button>
      <div class="header-content">
        <h1>Управление пользователями</h1>
        <p class="subtitle">Список, поиск и фильтрация пользователей сайта</p>
      </div>
    </header>

    <div class="toolbar">
      <div class="search-box">
        <input
          v-model="search"
          type="text"
          placeholder="Поиск по email или имени…"
          aria-label="Поиск пользователей"
        />
      </div>

      <div class="role-filter">
        <label for="role-filter">Роль:</label>
        <select id="role-filter" v-model="roleFilter" @change="onRoleChange">
          <option value="all">Все</option>
          <option value="user">Пользователь</option>
          <option value="moderator">Модератор</option>
          <option value="admin">Администратор</option>
        </select>
      </div>

      <div class="counter">
        Всего: <strong>{{ total }}</strong>
      </div>
    </div>

    <div class="content">
      <!-- Загрузка -->
      <div v-if="loading" class="state">
        <div class="spinner"></div>
        <p>Загрузка пользователей…</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="state state-error">
        <p>{{ error }}</p>
        <button class="btn btn-secondary" @click="retryLoad">🔄 Попробовать снова</button>
      </div>

      <!-- Пусто -->
      <div v-else-if="users.length === 0" class="state">
        <p>Пользователи не найдены.</p>
      </div>

      <!-- Таблица -->
      <div v-else class="table-wrap">
        <div class="table-row table-head">
          <span>Пользователь</span>
          <span>Email</span>
          <span>Роль</span>
          <span>Регистрация</span>
          <span>Действия</span>
        </div>
        <div v-for="u in users" :key="u.id" class="table-row">
          <span class="cell-user">
            <img v-if="u.avatar_url" :src="u.avatar_url" class="avatar" alt="avatar" />
            <span v-else class="avatar avatar-placeholder">{{ userInitial(u) }}</span>
            <span class="user-label">{{ u.display_name || '—' }}</span>
          </span>
          <span class="cell-email">{{ u.email }}</span>
          <span>
            <select
              class="role-select"
              :class="['role-' + u.role]"
              :value="u.role"
              :disabled="updatingId === u.id"
              @change="updateRole(u, ($event.target as HTMLSelectElement).value as any)"
            >
              <option v-for="r in roleOptions" :key="r" :value="r">
                {{ roleLabels[r] }}
              </option>
            </select>
          </span>
          <span class="cell-date">{{ formatDate(u.created_at) }}</span>
          <span class="cell-actions">
            <button
              class="btn-action"
              :disabled="updatingId === u.id"
              :title="isLocalAccount(u.email) ? 'Установить пароль напрямую (без письма)' : 'Отправить письмо для сброса пароля'"
              @click="resetPassword(u)"
            >
              {{ isLocalAccount(u.email) ? 'Сменить пароль' : 'Сброс пароля' }}
            </button>
          </span>
        </div>
      </div>

      <!-- Пагинация -->
      <div v-if="!loading && !error && users.length > 0" class="pagination">
        <button class="btn btn-secondary" :disabled="page <= 1" @click="prevPage">← Назад</button>
        <span class="page-indicator">Страница {{ page }} из {{ totalPages }}</span>
        <button class="btn btn-secondary" :disabled="page >= totalPages" @click="nextPage">Вперёд →</button>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="notification" :class="['toast', notification.type]">
        {{ notification.message }}
      </div>
    </Transition>

    <!-- Модалка смены пароля для локальных аккаунтов (@user.local) -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showPasswordModal && passwordTarget" class="pm-overlay" @click.self="closePasswordModal">
          <div class="pm-modal">
            <h2>Смена пароля</h2>
            <p class="pm-sub">
              Локальный аккаунт <strong>{{ passwordTarget.email }}</strong> — пароль будет
              установлен напрямую, письмо не отправляется.
            </p>

            <div class="pm-field">
              <label for="pm-new">Новый пароль</label>
              <input
                id="pm-new"
                v-model="newPassword"
                type="password"
                placeholder="Минимум 6 символов"
                :disabled="settingPassword"
                @keyup.enter="submitSetPassword"
              />
            </div>

            <div class="pm-field">
              <label for="pm-confirm">Подтвердите пароль</label>
              <input
                id="pm-confirm"
                v-model="confirmPassword"
                type="password"
                placeholder="Повторите пароль"
                :disabled="settingPassword"
                @keyup.enter="submitSetPassword"
              />
            </div>

            <div class="pm-actions">
              <button class="pm-cancel" :disabled="settingPassword" @click="closePasswordModal">
                Отмена
              </button>
              <button class="pm-save" :disabled="settingPassword" @click="submitSetPassword">
                {{ settingPassword ? 'Сохранение…' : 'Сохранить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.theme-dark {
  --bg-primary: #1a1a1a;
  --bg-card: rgba(255, 255, 255, 0.04);
  --bg-input: rgba(255, 255, 255, 0.08);
  --border: rgba(255, 255, 255, 0.1);
  --text: #ffffff;
  --text-secondary: #aaaaaa;
  --text-muted: #666666;
  --accent: #646cff;
  --success: #10b981;
  --error: #ef4444;
  --hover: rgba(255, 255, 255, 0.06);
}

.theme-light {
  --bg-primary: #f8f9fa;
  --bg-card: #ffffff;
  --bg-input: #f9fafb;
  --border: #e5e7eb;
  --text: #1f2937;
  --text-secondary: #6b7280;
  --text-muted: #9ca3af;
  --accent: #646cff;
  --success: #059669;
  --error: #dc2626;
  --hover: rgba(0, 0, 0, 0.04);
}

.admin-users-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
  background-color: var(--bg-primary);
  color: var(--text);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.page-header {
  background: var(--bg-card);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-content h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.125rem 0;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 220px;
}

.search-box input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  background: var(--bg-input);
  color: var(--text);
  transition: border-color 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: var(--accent);
}

.role-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.role-filter select {
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.875rem;
  font-family: inherit;
  background: var(--bg-input);
  color: var(--text);
}

.counter {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.state {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.state-error {
  color: var(--error);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.table-wrap {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.table-row {
  display: grid;
  grid-template-columns: 1.6fr 1.8fr 1fr 1fr 0.9fr;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
  align-items: center;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--border);
}

.table-row:last-child {
  border-bottom: none;
}

.table-head {
  background: var(--bg-input);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.cell-user {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}

.user-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
}

.cell-email {
  font-family: 'Fira Code', 'Consolas', monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-date {
  color: var(--text-secondary);
}

.cell-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-action {
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-input);
  color: var(--text);
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-action:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.role-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.role-user {
  background: rgba(100, 116, 139, 0.15);
  color: #94a3b8;
}

.role-moderator {
  background: rgba(100, 108, 255, 0.15);
  color: var(--accent);
}

.role-admin {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding-top: 0.5rem;
}

.page-indicator {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.btn-ghost {
  background: var(--hover);
  color: var(--text);
}

.theme-light .btn-ghost {
  background: rgba(0, 0, 0, 0.04);
}

.btn-ghost:hover {
  background: var(--border);
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--hover);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .admin-users-page {
    padding: 1rem;
  }

  .table-row {
    grid-template-columns: 1fr 1fr;
  }

  .table-head {
    display: none;
  }

  .cell-email,
  .cell-date {
    font-size: 0.8rem;
  }
}

.role-select {
  appearance: none;
  border: 1px solid var(--border);
  border-radius: 9999px;
  padding: 0.25rem 1.6rem 0.25rem 0.7rem;
  font-size: 0.75rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  background-repeat: no-repeat;
  background-position: right 0.55rem center;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  transition: border-color 0.15s ease, opacity 0.15s ease;
}

.role-select:focus {
  outline: none;
  border-color: var(--accent);
}

.role-select:disabled {
  opacity: 0.6;
  cursor: progress;
}

.role-user {
  background-color: rgba(100, 116, 139, 0.18);
  color: #94a3b8;
}

.role-moderator {
  background-color: rgba(100, 108, 255, 0.18);
  color: var(--accent);
}

.role-admin {
  background-color: rgba(16, 185, 129, 0.18);
  color: var(--success);
}

.toast {
  position: fixed;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  max-width: 90vw;
}

.toast.success {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.toast.error {
  background: rgba(239, 68, 68, 0.15);
  color: var(--error);
  border: 1px solid rgba(239, 68, 68, 0.4);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 10px);
}

/* Модалка смены пароля */
.pm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(4px);
}

.pm-modal {
  background: var(--bg-primary, #1e1e1e);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.75rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  color: var(--text, #fff);
}

.pm-modal h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
}

.pm-sub {
  margin: 0 0 1.25rem;
  font-size: 0.85rem;
  color: var(--text-secondary, #aaa);
  line-height: 1.4;
}

.pm-field {
  margin-bottom: 1rem;
}

.pm-field label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-secondary, #aaa);
}

.pm-field input {
  width: 100%;
  padding: 0.6rem 0.75rem;
  background: var(--bg-input, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text, #fff);
  font-size: 0.875rem;
  font-family: inherit;
  box-sizing: border-box;
}

.pm-field input:focus {
  outline: none;
  border-color: var(--accent, #646cff);
  box-shadow: 0 0 0 3px rgba(100, 108, 255, 0.2);
}

.pm-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.pm-cancel,
.pm-save {
  flex: 1;
  padding: 0.65rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.pm-cancel {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text, #fff);
}

.pm-cancel:hover:not(:disabled) {
  background: var(--bg-input, rgba(255, 255, 255, 0.08));
}

.pm-save {
  background: var(--accent, #646cff);
  color: #fff;
}

.pm-save:hover:not(:disabled) {
  filter: brightness(1.08);
}

.pm-cancel:disabled,
.pm-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .pm-modal,
.modal-leave-active .pm-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .pm-modal,
.modal-leave-to .pm-modal {
  transform: scale(0.95) translateY(-10px);
}
</style>
