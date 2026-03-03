<script setup lang="ts">
defineProps<{ 
  messages: string[],
  theme?: 'dark' | 'light'
}>()

// Функция для определения типа сообщения
function getMessageClass(msg: string): string {
  if (msg.includes('❌') || msg.includes('Ошибка')) return 'error';
  if (msg.includes('⚠️') || msg.includes('Предупреждение')) return 'warning';
  if (msg.includes('✅') || msg.includes('Успех')) return 'success';
  return '';
}
</script>

<template>
  <div class="console" :class="`theme-${theme}`">
    <div class="console-header">
      <span class="console-title">
        <span class="console-icon">📟</span>
        Консоль вывода
      </span>
      <span class="console-stats">
        {{ messages.length }} {{ messages.length === 1 ? 'сообщение' : 
           messages.length >= 2 && messages.length <= 4 ? 'сообщения' : 'сообщений' }}
      </span>
    </div>
    <div class="console-content">
      <div v-if="messages.length === 0" class="console-empty">
        <span class="empty-icon">📭</span>
        <span class="empty-text">Консоль пуста. Запусти скетч для вывода сообщений...</span>
      </div>
      <div v-for="(msg, index) in messages" :key="index" 
           class="console-line" 
           :class="getMessageClass(msg)">
        <span class="console-prompt">›</span>
        <span class="console-message">{{ msg }}</span>
        <span class="console-time">{{ new Date().toLocaleTimeString() }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.console {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Consolas', 'Monaco', monospace;
  transition: background-color 0.3s, color 0.3s;
}

/* Тёмная тема для консоли */
.console.theme-dark {
  background: #1e1e1e;
  color: #d4d4d4;
}

/* Светлая тема для консоли */
.console.theme-light {
  background: #ffffff;
  color: #333333;
}

.console-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 12px;
}

.console.theme-light .console-header {
  background: rgba(0, 0, 0, 0.05);
  border-bottom-color: rgba(0, 0, 0, 0.1);
}

.console-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.console-icon {
  font-size: 14px;
}

.console-stats {
  opacity: 0.7;
  font-size: 11px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.console.theme-light .console-stats {
  background: rgba(0, 0, 0, 0.1);
}

.console-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.console-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  opacity: 0.5;
  gap: 10px;
}

.empty-icon {
  font-size: 32px;
}

.empty-text {
  font-size: 12px;
  text-align: center;
}

.console-line {
  margin-bottom: 6px;
  word-break: break-word;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  line-height: 1.4;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.console-line:hover {
  background: rgba(255, 255, 255, 0.05);
}

.console.theme-light .console-line:hover {
  background: rgba(0, 0, 0, 0.05);
}

.console-prompt {
  color: #4caf50;
  font-weight: bold;
  opacity: 0.7;
  font-size: 14px;
}

.console.theme-light .console-prompt {
  color: #2e7d32;
}

.console-message {
  flex: 1;
}

.console-time {
  font-size: 10px;
  opacity: 0.5;
  white-space: nowrap;
  padding-left: 10px;
}

/* Стили для разных типов сообщений */
.console-line.error .console-prompt {
  color: #ff6b6b;
}

.console-line.error {
  background: rgba(255, 107, 107, 0.1);
  border-left: 3px solid #ff6b6b;
}

.console-line.warning .console-prompt {
  color: #ffd93d;
}

.console-line.warning {
  background: rgba(255, 217, 61, 0.1);
  border-left: 3px solid #ffd93d;
}

.console-line.success .console-prompt {
  color: #6bff6b;
}

.console-line.success {
  background: rgba(107, 255, 107, 0.1);
  border-left: 3px solid #6bff6b;
}

/* Анимация для новых сообщений */
.console-line {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Скроллбар для консоли */
.console-content::-webkit-scrollbar {
  width: 8px;
}

.console-content::-webkit-scrollbar-track {
  background: transparent;
}

.console-content::-webkit-scrollbar-thumb {
  background: rgba(100, 108, 255, 0.3);
  border-radius: 4px;
}

.console-content::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 108, 255, 0.5);
}
</style>