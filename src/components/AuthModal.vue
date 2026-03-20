<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '../composables/useAuth'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { login, register, resetPassword, loading, error } = useAuth()

const activeTab = ref<'login' | 'register' | 'reset'>('login')

// Формы
const loginForm = ref({
  email: '',
  password: ''
})

const registerForm = ref({
  email: '',
  password: '',
  confirmPassword: '',
  displayName: ''
})

const resetForm = ref({
  email: ''
})

// Сообщения
const successMessage = ref('')
const formError = ref('')

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function closeModal() {
  isVisible.value = false
  resetForms()
}

function resetForms() {
  activeTab.value = 'login'
  loginForm.value = { email: '', password: '' }
  registerForm.value = { email: '', password: '', confirmPassword: '', displayName: '' }
  resetForm.value = { email: '' }
  successMessage.value = ''
  formError.value = ''
}

async function handleLogin() {
  formError.value = ''
  successMessage.value = ''

  if (!loginForm.value.email || !loginForm.value.password) {
    formError.value = 'Заполните все поля'
    return
  }

  const result = await login(loginForm.value.email, loginForm.value.password)

  if (result.success) {
    closeModal()
  } else {
    formError.value = result.error || 'Ошибка входа'
  }
}

async function handleRegister() {
  formError.value = ''
  successMessage.value = ''

  if (!registerForm.value.email || !registerForm.value.password) {
    formError.value = 'Заполните обязательные поля'
    return
  }

  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    formError.value = 'Пароли не совпадают'
    return
  }

  if (registerForm.value.password.length < 6) {
    formError.value = 'Пароль должен быть не менее 6 символов'
    return
  }

  const result = await register(
    registerForm.value.email,
    registerForm.value.password,
    registerForm.value.displayName || undefined
  )

  if (result.success) {
    successMessage.value = 'Регистрация успешна! Проверьте почту для подтверждения.'
    setTimeout(() => {
      closeModal()
    }, 2000)
  } else {
    formError.value = result.error || 'Ошибка регистрации'
  }
}

async function handleReset() {
  formError.value = ''
  successMessage.value = ''

  if (!resetForm.value.email) {
    formError.value = 'Введите email'
    return
  }

  const result = await resetPassword(resetForm.value.email)

  if (result.success) {
    successMessage.value = 'Инструкция по сбросу пароля отправлена на почту'
  } else {
    formError.value = result.error || 'Ошибка сброса пароля'
  }
}

// Закрытие по ESC
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeModal()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isVisible" class="auth-modal-overlay" @click="closeModal" @keydown.esc="handleKeydown" tabindex="-1">
        <div class="auth-modal" @click.stop>
          <button class="close-btn" @click="closeModal">&times;</button>

          <div class="auth-tabs">
            <button
              :class="['tab-btn', { active: activeTab === 'login' }]"
              @click="activeTab = 'login'"
            >
              Вход
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'register' }]"
              @click="activeTab = 'register'"
            >
              Регистрация
            </button>
          </div>

          <!-- Вкладка входа -->
          <div v-if="activeTab === 'login'" class="auth-form">
            <h2>Вход</h2>

            <div class="form-group">
              <label for="login-email">Email</label>
              <input
                id="login-email"
                v-model="loginForm.email"
                type="email"
                placeholder="your@email.com"
                :disabled="loading"
              />
            </div>

            <div class="form-group">
              <label for="login-password">Пароль</label>
              <input
                id="login-password"
                v-model="loginForm.password"
                type="password"
                placeholder="••••••••"
                :disabled="loading"
              />
            </div>

            <button class="submit-btn" :disabled="loading" @click="handleLogin">
              {{ loading ? 'Вход...' : 'Войти' }}
            </button>

            <button class="link-btn" @click="activeTab = 'reset'">
              Забыли пароль?
            </button>
          </div>

          <!-- Вкладка регистрации -->
          <div v-if="activeTab === 'register'" class="auth-form">
            <h2>Регистрация</h2>

            <div class="form-group">
              <label for="register-email">Email *</label>
              <input
                id="register-email"
                v-model="registerForm.email"
                type="email"
                placeholder="your@email.com"
                :disabled="loading"
                required
              />
            </div>

            <div class="form-group">
              <label for="register-display-name">Имя (необязательно)</label>
              <input
                id="register-display-name"
                v-model="registerForm.displayName"
                type="text"
                placeholder="Как к вам обращаться"
                :disabled="loading"
              />
            </div>

            <div class="form-group">
              <label for="register-password">Пароль *</label>
              <input
                id="register-password"
                v-model="registerForm.password"
                type="password"
                placeholder="••••••••"
                :disabled="loading"
                required
              />
            </div>

            <div class="form-group">
              <label for="register-confirm">Подтверждение пароля *</label>
              <input
                id="register-confirm"
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="••••••••"
                :disabled="loading"
                required
              />
            </div>

            <button class="submit-btn" :disabled="loading" @click="handleRegister">
              {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
            </button>
          </div>

          <!-- Вкладка сброса пароля -->
          <div v-if="activeTab === 'reset'" class="auth-form">
            <h2>Сброс пароля</h2>
            <p class="form-hint">
              Введите ваш email, и мы отправим инструкцию по сбросу пароля.
            </p>

            <div class="form-group">
              <label for="reset-email">Email</label>
              <input
                id="reset-email"
                v-model="resetForm.email"
                type="email"
                placeholder="your@email.com"
                :disabled="loading"
              />
            </div>

            <button class="submit-btn" :disabled="loading" @click="handleReset">
              {{ loading ? 'Отправка...' : 'Отправить' }}
            </button>

            <button class="link-btn" @click="activeTab = 'login'">
              Вернуться ко входу
            </button>
          </div>

          <!-- Сообщения об ошибках/успехе -->
          <div v-if="formError || error" class="error-message">
            {{ formError || error }}
          </div>

          <div v-if="successMessage" class="success-message">
            {{ successMessage }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.auth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.auth-modal {
  background: var(--bg-primary, #1e1e1e);
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 420px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  color: var(--text-primary, #ffffff);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 28px;
  color: var(--text-secondary, #888);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s, color 0.2s;
}

.close-btn:hover {
  background: var(--bg-secondary, #2a2a2a);
  color: var(--text-primary, #fff);
}

.auth-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border-color, #333);
  padding-bottom: 16px;
}

.tab-btn {
  flex: 1;
  padding: 10px 16px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #888);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: var(--bg-secondary, #2a2a2a);
  color: var(--text-primary, #fff);
}

.tab-btn.active {
  background: var(--accent-color, #42b883);
  color: #fff;
}

.auth-form h2 {
  margin: 0 0 20px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary, #aaa);
}

.form-group input {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-secondary, #2a2a2a);
  border: 1px solid var(--border-color, #333);
  border-radius: 8px;
  color: var(--text-primary, #fff);
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent-color, #42b883);
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.2);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-hint {
  font-size: 13px;
  color: var(--text-secondary, #888);
  margin-bottom: 16px;
  line-height: 1.5;
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: var(--accent-color, #42b883);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  background: #36a76f;
  transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.link-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #888);
  font-size: 14px;
  cursor: pointer;
  margin-top: 8px;
  transition: color 0.2s;
}

.link-btn:hover {
  color: var(--accent-color, #42b883);
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  text-align: center;
}

.success-message {
  margin-top: 16px;
  padding: 12px;
  background: rgba(66, 184, 131, 0.1);
  border: 1px solid rgba(66, 184, 131, 0.3);
  border-radius: 8px;
  color: #42b883;
  font-size: 14px;
  text-align: center;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .auth-modal,
.modal-leave-active .auth-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .auth-modal,
.modal-leave-to .auth-modal {
  transform: scale(0.95) translateY(-10px);
}
</style>
