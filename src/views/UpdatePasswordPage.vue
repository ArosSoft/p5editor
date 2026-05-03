<template>
  <div class="update-password-page">
    <div class="password-container">
      <h2>Обновление пароля</h2>

      <div v-if="urlError" class="error-message">
        {{ urlError }}
        <router-link to="/">На главную</router-link>
      </div>

      <div v-else-if="success" class="success-message">
        Пароль успешно обновлен! Теперь вы можете войти с новым паролем.
        <router-link to="/">На главную</router-link>
      </div>

      <div v-else-if="!passwordRecoveryMode" class="error-message">
        Ссылка для сброса пароля недействительна или устарела. Пожалуйста, запросите сброс пароля снова.
        <router-link to="/">На главную</router-link>
      </div>

      <form v-else @submit.prevent="handleUpdatePassword" class="password-form">
        <div class="form-group">
          <label for="new-password">Новый пароль</label>
          <input
            id="new-password"
            v-model="newPassword"
            type="password"
            placeholder="Введите новый пароль"
            required
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="confirm-password">Подтвердите пароль</label>
          <input
            id="confirm-password"
            v-model="confirmPassword"
            type="password"
            placeholder="Подтвердите новый пароль"
            required
            minlength="6"
          />
        </div>

        <div v-if="formError" class="error-message">
          {{ formError }}
        </div>

        <button type="submit" :disabled="loading || !isFormValid" class="submit-btn">
          {{ loading ? 'Обновление...' : 'Обновить пароль' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const route = useRoute()
const { passwordRecoveryMode, updatePassword, loading, error } = useAuth()

const newPassword = ref('')
const confirmPassword = ref('')
const success = ref(false)
const formError = ref('')
const urlError = ref('')

const isFormValid = computed(() => {
  return newPassword.value.length >= 6 &&
         confirmPassword.value.length >= 6 &&
         newPassword.value === confirmPassword.value
})

// Проверяем URL на наличие ошибок от Supabase
onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '')
  
  const errorCode = urlParams.get('error_code') || hashParams.get('error_code')
  const errorDesc = urlParams.get('error_description') || hashParams.get('error_description')
  
  if (errorCode === 'otp_expired') {
    urlError.value = 'Ссылка для сброса пароля истекла. Пожалуйста, запросите сброс пароля снова.'
    setTimeout(() => {
      router.push('/')
    }, 5000)
  } else if (errorDesc) {
    urlError.value = decodeURIComponent(errorDesc)
    setTimeout(() => {
      router.push('/')
    }, 5000)
  }
})

async function handleUpdatePassword() {
  formError.value = ''

  if (newPassword.value !== confirmPassword.value) {
    formError.value = 'Пароли не совпадают'
    return
  }

  if (newPassword.value.length < 6) {
    formError.value = 'Пароль должен быть не менее 6 символов'
    return
  }

  const result = await updatePassword(newPassword.value)

  if (result.success) {
    success.value = true
    // Через 3 секунды перенаправляем на главную
    setTimeout(() => {
      router.push('/')
    }, 3000)
  } else {
    formError.value = result.error || 'Ошибка обновления пароля'
  }
}
</script>

<style scoped>
.update-password-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', monospace;
}

.password-container {
  background-color: #252526;
  border: 1px solid #3e3e42;
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

h2 {
  color: #d4d4d4;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 1.5rem;
}

.password-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: #858585;
  font-size: 0.9rem;
}

input {
  background-color: #1e1e1e;
  border: 1px solid #3e3e42;
  border-radius: 4px;
  padding: 0.75rem;
  color: #d4d4d4;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: #61afef;
}

input::placeholder {
  color: #858585;
}

.submit-btn {
  background-color: #61afef;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
  margin-top: 0.5rem;
}

.submit-btn:hover:not(:disabled) {
  background-color: #4d9de0;
}

.submit-btn:disabled {
  background-color: #3e3e42;
  cursor: not-allowed;
}

.error-message {
  background-color: #5a1d1d;
  color: #f48771;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
}

.success-message {
  background-color: #1d5a2d;
  color: #98c379;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
  text-align: center;
}

a {
  color: #61afef;
  text-decoration: none;
  display: block;
  margin-top: 0.5rem;
}

a:hover {
  text-decoration: underline;
}
</style>
