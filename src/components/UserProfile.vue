<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '../composables/useAuth'
import { useStorage } from '../composables/useStorage'

const { user, profile, updateProfile, uploadAvatar, logout, loading } = useAuth()
const { uploadAvatar: uploadAvatarStorage, uploading } = useStorage()

const isEditing = ref(false)
const showDropdown = ref(false)

const editForm = ref({
  display_name: '',
  bio: ''
})

const avatarInput = ref<HTMLInputElement | null>(null)

const displayName = computed(() => {
  return profile.value?.display_name || user.value?.email || 'Аноним'
})

const avatarUrl = computed(() => {
  return profile.value?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.value)}&background=42b883&color=fff&size=128`
})

function openDropdown() {
  showDropdown.value = true
}

function closeDropdown() {
  showDropdown.value = false
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

async function handleLogout() {
  await logout()
  closeDropdown()
}

function startEditing() {
  editForm.value = {
    display_name: profile.value?.display_name || '',
    bio: profile.value?.bio || ''
  }
  isEditing.value = true
  closeDropdown()
}

function cancelEditing() {
  isEditing.value = false
}

async function saveProfile() {
  const result = await updateProfile({
    display_name: editForm.value.display_name || null,
    bio: editForm.value.bio || null
  })

  if (result.success) {
    isEditing.value = false
  }
}

async function handleAvatarClick() {
  avatarInput.value?.click()
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !user.value) return

  // Загрузка аватара через useAuth (который использует useStorage)
  const result = await uploadAvatar(file)

  if (result.success) {
    // Профиль уже обновлён в useAuth
  }

  // Сброс input
  target.value = ''
}

// Закрытие dropdown при клике вне
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.user-profile-container')) {
    closeDropdown()
  }
}
</script>

<template>
  <div class="user-profile-container" v-click-outside="handleClickOutside">
    <input
      ref="avatarInput"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileChange"
    />

    <div class="user-button" @click="toggleDropdown" :class="{ open: showDropdown }">
      <img :src="avatarUrl" :alt="displayName" class="user-avatar" />
      <span class="user-name">{{ displayName }}</span>
      <svg class="dropdown-icon" :class="{ rotated: showDropdown }" viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor" d="M7 10l5 5 5-5z"/>
      </svg>
    </div>

    <Transition name="dropdown">
      <div v-if="showDropdown" class="user-dropdown">
        <div class="dropdown-header">
          <img :src="avatarUrl" :alt="displayName" class="dropdown-avatar" />
          <div class="dropdown-info">
            <div class="dropdown-name">{{ displayName }}</div>
            <div class="dropdown-email">{{ user?.email }}</div>
          </div>
        </div>

        <div class="dropdown-divider"></div>

        <button class="dropdown-item" @click="startEditing">
          <svg class="dropdown-icon-svg" viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
          </svg>
          Редактировать профиль
        </button>

        <div class="dropdown-divider"></div>

        <button class="dropdown-item logout" @click="handleLogout">
          <svg class="dropdown-icon-svg" viewBox="0 0 24 24" width="18" height="18">
            <path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          Выйти
        </button>
      </div>
    </Transition>

    <!-- Модальное окно редактирования профиля -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="isEditing" class="edit-modal-overlay" @click="cancelEditing">
          <div class="edit-modal" @click.stop>
            <h2>Редактирование профиля</h2>

            <div class="edit-avatar-section">
              <img :src="avatarUrl" :alt="displayName" class="edit-avatar" />
              <button class="change-avatar-btn" @click="handleAvatarClick" :disabled="uploading">
                {{ uploading ? 'Загрузка...' : 'Изменить аватар' }}
              </button>
            </div>

            <div class="form-group">
              <label for="edit-display-name">Имя</label>
              <input
                id="edit-display-name"
                v-model="editForm.display_name"
                type="text"
                placeholder="Ваше имя"
                :disabled="loading"
              />
            </div>

            <div class="form-group">
              <label for="edit-bio">О себе</label>
              <textarea
                id="edit-bio"
                v-model="editForm.bio"
                placeholder="Расскажите о себе"
                rows="4"
                :disabled="loading"
              ></textarea>
            </div>

            <div class="form-actions">
              <button class="cancel-btn" @click="cancelEditing">Отмена</button>
              <button class="save-btn" @click="saveProfile" :disabled="loading || uploading">
                {{ loading || uploading ? 'Сохранение...' : 'Сохранить' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.user-profile-container {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 6px;
  background: var(--bg-secondary, #2a2a2a);
  border: 1px solid var(--border-color, #333);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.user-button:hover {
  background: var(--bg-tertiary, #333);
  border-color: var(--accent-color, #42b883);
}

.user-button.open {
  border-color: var(--accent-color, #42b883);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #fff);
}

.dropdown-icon {
  color: var(--text-secondary, #888);
  transition: transform 0.2s;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 280px;
  background: var(--bg-primary, #1e1e1e);
  border: 1px solid var(--border-color, #333);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  z-index: 100;
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--bg-secondary, #2a2a2a);
}

.dropdown-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.dropdown-info {
  flex: 1;
  min-width: 0;
}

.dropdown-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #fff);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-email {
  font-size: 13px;
  color: var(--text-secondary, #888);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-divider {
  height: 1px;
  background: var(--border-color, #333);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--text-primary, #fff);
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--bg-secondary, #2a2a2a);
}

.dropdown-item.logout {
  color: #ef4444;
}

.dropdown-item.logout:hover {
  background: rgba(239, 68, 68, 0.1);
}

.dropdown-icon-svg {
  color: var(--text-secondary, #888);
  flex-shrink: 0;
}

/* Edit Modal */
.edit-modal-overlay {
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

.edit-modal {
  background: var(--bg-primary, #1e1e1e);
  border-radius: 12px;
  padding: 32px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  color: var(--text-primary, #ffffff);
}

.edit-modal h2 {
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
}

.edit-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.edit-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
}

.change-avatar-btn {
  padding: 8px 16px;
  background: var(--bg-secondary, #2a2a2a);
  border: 1px solid var(--border-color, #333);
  border-radius: 6px;
  color: var(--text-primary, #fff);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.change-avatar-btn:hover:not(:disabled) {
  background: var(--bg-tertiary, #333);
}

.change-avatar-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px 14px;
  background: var(--bg-secondary, #2a2a2a);
  border: 1px solid var(--border-color, #333);
  border-radius: 8px;
  color: var(--text-primary, #fff);
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  font-family: inherit;
  resize: vertical;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--accent-color, #42b883);
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.2);
}

.form-group input:disabled,
.form-group textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.cancel-btn,
.save-btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: transparent;
  border: 1px solid var(--border-color, #333);
  color: var(--text-primary, #fff);
}

.cancel-btn:hover {
  background: var(--bg-secondary, #2a2a2a);
}

.save-btn {
  background: var(--accent-color, #42b883);
  border: none;
  color: #fff;
}

.save-btn:hover:not(:disabled) {
  background: #36a76f;
  transform: translateY(-1px);
}

.save-btn:active:not(:disabled) {
  transform: translateY(0);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .edit-modal,
.modal-leave-active .edit-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .edit-modal,
.modal-leave-to .edit-modal {
  transform: scale(0.95) translateY(-10px);
}

/* Click outside directive */
</style>
