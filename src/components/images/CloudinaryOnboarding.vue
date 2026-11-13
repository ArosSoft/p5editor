<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useCloudinary } from '../../composables/useCloudinary'
import type { CloudinaryLinkForm } from '../../composables/useCloudinary'

const emit = defineEmits<{ (e: 'linked'): void }>()

const props = withDefaults(
  defineProps<{
    userEmail?: string | null
  }>(),
  { userEmail: null }
)

const { linkAccount, linking } = useCloudinary()

const form = reactive<CloudinaryLinkForm>({
  cloud_name: '',
  api_key: '',
  api_secret: ''
})

const showSecret = ref(false)
const formError = ref<string | null>(null)

const REGISTER_URL = 'https://console.cloudinary.com/users/register_free'
const CONSOLE_URL = 'https://console.cloudinary.com/'

async function handleLink() {
  formError.value = null

  if (!form.cloud_name.trim() || !form.api_key.trim() || !form.api_secret.trim()) {
    formError.value = 'Заполни все три поля — без них не получится подключиться.'
    return
  }

  const result = await linkAccount({
    cloud_name: form.cloud_name.trim(),
    api_key: form.api_key.trim(),
    api_secret: form.api_secret.trim()
  })

  if (result.success) {
    emit('linked')
  } else {
    formError.value = result.error || 'Не получилось подключиться. Попробуй ещё раз.'
  }
}
</script>

<template>
  <section class="onboarding" aria-label="Подключение аккаунта Cloudinary">
    <div class="ob-card">
      <div class="ob-header">
        <span class="ob-icon" aria-hidden="true">☁️</span>
        <h2 class="ob-title">Подключи свой Cloudinary</h2>
        <p class="ob-subtitle">
          Cloudinary — это бесплатное хранилище картинок в интернете. Заведи себе
          аккаунт, и все картинки для скетчей будут храниться там.
        </p>
      </div>

      <!-- Предупреждение: сервис может быть недоступен из некоторых стран -->
      <div class="ob-notice" role="note">
        <span class="ob-notice-icon" aria-hidden="true">🌍</span>
        <div class="ob-notice-body">
          <p class="ob-notice-title">Cloudinary может не открыться</p>
          <p class="ob-notice-text">
            Из некоторых стран сайт Cloudinary сейчас недоступен. Если он не загружается
            или кнопка ниже не работает — это ограничение самого Cloudinary, а не ошибка
            p5editor. Включи <strong>VPN</strong> и попробуй снова. Ограничение временное —
            если VPN нет, просто вернись позже.
          </p>
        </div>
      </div>

      <ol class="ob-steps">
        <!-- Шаг 1: регистрация -->
        <li class="ob-step">
          <div class="ob-step-head">
            <span class="ob-step-num">1</span>
            <h3 class="ob-step-title">Зарегистрируйся</h3>
          </div>
          <p class="ob-step-text">
            Нажми на кнопку и заполни короткую форму. Лучше использовать ту же почту, что и в
            p5editor<span v-if="userEmail"> (<strong>{{ userEmail }}</strong>)</span> — так проще
            ничего не перепутать.
          </p>
          <a
            class="ob-btn ob-btn-primary"
            :href="REGISTER_URL"
            target="_blank"
            rel="noopener noreferrer"
          >
            Зарегистрироваться в Cloudinary
            <span class="ob-external" aria-hidden="true">↗</span>
          </a>
          <p class="ob-step-hint">
            Это бесплатно. Банковская карта не нужна. Если сайт не открывается — включи VPN.
          </p>
        </li>

        <!-- Шаг 2: ключи -->
        <li class="ob-step">
          <div class="ob-step-head">
            <span class="ob-step-num">2</span>
            <h3 class="ob-step-title">Скопируй три значения</h3>
          </div>
          <p class="ob-step-text">
            После входа в Cloudinary открой раздел
            <a :href="CONSOLE_URL" target="_blank" rel="noopener noreferrer"
              >Настройки → API Keys <span aria-hidden="true">↗</span></a
            >
            и скопируй:
          </p>
          <ul class="ob-keys">
            <li class="ob-key">
              <span class="ob-key-name">Cloud name</span>
              <span class="ob-key-desc">название твоего аккаунта, оно видно и в правом верхнем углу консоли</span>
            </li>
            <li class="ob-key">
              <span class="ob-key-name">API Key</span>
              <span class="ob-key-desc">как имя пользователя, только из цифр</span>
            </li>
            <li class="ob-key">
              <span class="ob-key-name">API Secret</span>
              <span class="ob-key-desc">как пароль. Никому его не показывай!</span>
            </li>
          </ul>
        </li>

        <!-- Шаг 3: форма -->
        <li class="ob-step">
          <div class="ob-step-head">
            <span class="ob-step-num">3</span>
            <h3 class="ob-step-title">Вставь их сюда</h3>
          </div>
          <form class="ob-form" @submit.prevent="handleLink">
            <label class="ob-field">
              <span class="ob-label">Cloud name</span>
              <input
                v-model.trim="form.cloud_name"
                class="ob-input"
                type="text"
                placeholder="например: my-school-project"
                autocomplete="off"
                spellcheck="false"
                :disabled="linking"
              />
            </label>
            <label class="ob-field">
              <span class="ob-label">API Key</span>
              <input
                v-model.trim="form.api_key"
                class="ob-input"
                type="text"
                inputmode="numeric"
                placeholder="например: 123456789012345"
                autocomplete="off"
                spellcheck="false"
                :disabled="linking"
              />
            </label>
            <label class="ob-field">
              <span class="ob-label">API Secret</span>
              <span class="ob-secret-row">
                <input
                  v-model.trim="form.api_secret"
                  class="ob-input"
                  :type="showSecret ? 'text' : 'password'"
                  placeholder="секретный код"
                  autocomplete="off"
                  spellcheck="false"
                  :disabled="linking"
                />
                <button
                  type="button"
                  class="ob-eye"
                  :title="showSecret ? 'Скрыть' : 'Показать'"
                  :aria-label="showSecret ? 'Скрыть секрет' : 'Показать секрет'"
                  @click="showSecret = !showSecret"
                >
                  {{ showSecret ? '🙈' : '👁️' }}
                </button>
              </span>
            </label>

            <p v-if="formError" class="ob-error" role="alert">
              <span aria-hidden="true">😕</span> {{ formError }}
            </p>

            <button class="ob-btn ob-btn-primary ob-btn-lg" type="submit" :disabled="linking">
              {{ linking ? '⏳ Проверяем...' : 'Проверить и подключить' }}
            </button>
            <p class="ob-step-hint">
              Мы проверим ключи и подключим аккаунт. Секрет останется только на сервере — браузер его
              не сохраняет.
            </p>
          </form>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.onboarding {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}

.ob-card {
  width: 100%;
  max-width: 640px;
  background: var(--bg-card, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.ob-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.ob-icon {
  font-size: 3rem;
  line-height: 1;
}
.ob-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary, #fff);
}
.ob-subtitle {
  margin: 0;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Предупреждение о доступности сервиса */
.ob-notice {
  display: flex;
  gap: 0.85rem;
  padding: 1rem 1.1rem;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.4);
}
.ob-notice-icon {
  flex: none;
  font-size: 1.5rem;
  line-height: 1.2;
}
.ob-notice-body {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.ob-notice-title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--text-primary, #fff);
}
.ob-notice-text {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--text-secondary, rgba(255, 255, 255, 0.75));
}
.ob-notice-text strong {
  color: var(--text-primary, #fff);
}

.ob-steps {
  list-style: none;
  margin: 0;
  padding: 0;
  counter-reset: ob-step;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.ob-step {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.ob-step-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.ob-step-num {
  flex: none;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  color: #fff;
  background: var(--accent-color, #42b883);
}
.ob-step-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary, #fff);
}

.ob-step-text {
  margin: 0;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  font-size: 0.95rem;
  line-height: 1.55;
}
.ob-step-text a {
  color: var(--accent-color, #42b883);
}

.ob-step-hint {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--text-muted, rgba(255, 255, 255, 0.45));
}

/* Кнопки */
.ob-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  border: 1px solid transparent;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  min-height: 48px;
}
.ob-btn-primary {
  background: var(--accent-color, #42b883);
  color: #fff;
}
.ob-btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}
.ob-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.ob-btn-lg {
  width: 100%;
  font-size: 1.05rem;
  min-height: 52px;
}
.ob-external {
  font-size: 0.85em;
}

/* Список ключей */
.ob-keys {
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.ob-key {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem 1rem;
  background: var(--icon-btn-bg, rgba(255, 255, 255, 0.06));
  border: 1px solid var(--icon-btn-border, rgba(255, 255, 255, 0.15));
  border-radius: 10px;
}
.ob-key-name {
  font-weight: 700;
  color: var(--text-primary, #fff);
  font-size: 0.95rem;
}
.ob-key-desc {
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  font-size: 0.85rem;
  line-height: 1.45;
}

/* Форма */
.ob-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 0.25rem;
}
.ob-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.ob-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary, #fff);
}
.ob-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--icon-btn-border, rgba(255, 255, 255, 0.15));
  background: var(--icon-btn-bg, rgba(255, 255, 255, 0.06));
  color: var(--text-primary, #fff);
  font-size: 1rem;
  font-family: inherit;
  min-height: 48px;
  transition: border-color 0.2s;
}
.ob-input::placeholder {
  color: var(--text-muted, rgba(255, 255, 255, 0.4));
}
.ob-input:focus {
  outline: none;
  border-color: var(--accent-color, #42b883);
}
.ob-input:disabled {
  opacity: 0.6;
}
.ob-secret-row {
  position: relative;
  display: block;
}
.ob-secret-row .ob-input {
  padding-right: 3rem;
}
.ob-eye {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.25rem;
}

.ob-error {
  margin: 0;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #f87171;
  font-size: 0.9rem;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .ob-card {
    padding: 1.25rem;
  }
  .ob-icon {
    font-size: 2.5rem;
  }
}
</style>
