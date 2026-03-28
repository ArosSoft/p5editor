<!-- components/AIChat.vue -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps<{
  theme?: 'dark' | 'light'
  isVisible: boolean
  code?: string
}>()

const emit = defineEmits<{
  (e: 'update:isVisible', value: boolean): void
  (e: 'sendMessage', message: string): void
  (e: 'suggestCode', code: string): void
}>()

const messages = ref<Array<{ role: 'user' | 'assistant', content: string }>>([])
const inputMessage = ref('')
const isTyping = ref(false)
const chatContainer = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const startY = ref(0)
const startHeight = ref(400)
const chatHeight = ref(400)
const isMinimized = ref(false)

const DEEPSEEK_API_KEY = 'sk-de29f369b0f44d0081ec017c27daae20'
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

onMounted(() => {
  if (messages.value.length === 0) {
    messages.value.push({
      role: 'assistant',
      content: '👋 Привет! Я Deepseek AI. Я помогу тебе с p5.js скетчами. Задавай вопросы по коду, графике, анимации или интерактивности!'
    })
  }
})

watch(messages, () => {
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  })
}, { deep: true })

function closeChat() {
  emit('update:isVisible', false)
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value
}

async function callDeepseekAPI(userMessage: string) {
  try {
    const systemPrompt = `Ты - эксперт по p5.js и креативному программированию. 
    Помогай пользователю с кодом, объясняй концепции, предлагай улучшения.
    Отвечай кратко, но информативно. Если нужно, показывай примеры кода.
    
    ${props.code ? `Текущий код пользователя:\n${props.code}` : ''}
    
    Отвечай на русском языке.`

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.value.map(m => ({ 
            role: m.role === 'user' ? 'user' : 'assistant', 
            content: m.content 
          })),
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`API ошибка: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Deepseek API error:', error)
    return '😕 Извини, произошла ошибка при обращении к API. Попробуй еще раз или проверь подключение к интернету.'
  }
}

async function sendMessage() {
  if (!inputMessage.value.trim()) return
  
  const userMessage = inputMessage.value
  
  messages.value.push({
    role: 'user',
    content: userMessage
  })
  
  inputMessage.value = ''
  isTyping.value = true
  
  try {
    const response = await callDeepseekAPI(userMessage)
    
    messages.value.push({
      role: 'assistant',
      content: response
    })
    
    const codeMatch = response.match(/```(?:javascript|js)?\n([\s\S]*?)```/)
    if (codeMatch && codeMatch[1]) {
      const suggestedCode = codeMatch[1].trim()
      if (confirm('В ответе есть код. Хотите применить его в редакторе?')) {
        emit('suggestCode', suggestedCode)
      }
    }
    
    emit('sendMessage', userMessage)
  } catch (error) {
    console.error('Error sending message:', error)
    messages.value.push({
      role: 'assistant',
      content: '😵 Произошла ошибка. Пожалуйста, попробуй еще раз.'
    })
  } finally {
    isTyping.value = false
  }
}

function startResize(e: MouseEvent) {
  isDragging.value = true
  startY.value = e.clientY
  startHeight.value = chatHeight.value
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
}

function onResize(e: MouseEvent) {
  if (!isDragging.value) return
  
  const deltaY = startY.value - e.clientY
  const newHeight = Math.min(
    Math.max(300, startHeight.value + deltaY),
    window.innerHeight * 0.8
  )
  chatHeight.value = newHeight
}

function stopResize() {
  isDragging.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

onMounted(() => {
  window.addEventListener('mousemove', onResize)
  window.addEventListener('mouseup', stopResize)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onResize)
  window.removeEventListener('mouseup', stopResize)
})

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  const text = event.dataTransfer?.getData('text/plain')
  if (text) inputMessage.value = text
}

</script>

<template>
  <Teleport to="body">
    <!-- Плавающая кнопка ИИ -->
    <button 
      class="ai-float-button" 
      :class="[`theme-${props.theme}`, { 'hidden': isVisible }]"
      @click="emit('update:isVisible', true)"
      :title="isVisible ? '' : 'Открыть Deepseek AI'"
    >
      <span class="ai-icon">🤖</span>
      <span class="ai-pulse"></span>
    </button>

    <!-- Окно чата (БЕЗ РАЗМЫТИЯ ФОНА) -->
    <div 
      v-if="isVisible"
      class="ai-chat-overlay"
      :class="`theme-${props.theme}`"
      @click.self="closeChat"
    >
      <div 
        class="ai-chat-window"
        :class="{ 'minimized': isMinimized }"
        :style="{ height: isMinimized ? '60px' : chatHeight + 'px' }"
      >
        <!-- Заголовок -->
        <div class="chat-header">
          <div class="header-left">
            <span class="header-icon">🤖</span>
            <span class="header-title">Deepseek AI</span>
            <span class="header-badge">p5.js эксперт</span>
          </div>
          <div class="header-controls">
            <button class="control-btn" @click="toggleMinimize" :title="isMinimized ? 'Развернуть' : 'Свернуть'">
              {{ isMinimized ? '□' : '−' }}
            </button>
            <button class="control-btn close" @click="closeChat" title="Закрыть">✕</button>
          </div>
        </div>

        <!-- Тело чата -->
        <template v-if="!isMinimized">
          <!-- Ручка изменения размера -->
          <div 
            class="chat-resize-handle"
            @mousedown="startResize"
            :class="{ 'dragging': isDragging }"
          >
            <div class="handle-dots">⋯</div>
          </div>

          <!-- Сообщения -->
          <div class="chat-messages" ref="chatContainer">
            <div 
              v-for="(msg, index) in messages" 
              :key="index"
              class="message"
              :class="msg.role"
            >
              <div class="message-avatar">
                {{ msg.role === 'user' ? '👤' : '🤖' }}
              </div>
              <div class="message-content">
                <div class="message-text" v-html="msg.content.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')"></div>
                <div class="message-time">{{ new Date().toLocaleTimeString() }}</div>
              </div>
            </div>
            
            <!-- Индикатор печатания -->
            <div v-if="isTyping" class="message assistant typing">
              <div class="message-avatar">🤖</div>
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Поле ввода (без кнопок под ним) -->
          <div class="chat-input-area" @dragover.prevent @drop="onDrop">
            <textarea
              v-model="inputMessage"
              @keydown="handleKeyDown"
              placeholder="Спроси Deepseek о p5.js..."
              rows="1"
            ></textarea>
            <button 
              class="send-btn" 
              @click="sendMessage"
              :disabled="!inputMessage.trim() || isTyping"
            >
              📤
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Плавающая кнопка */
.ai-float-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background: linear-gradient(135deg, #646cff, #9089fc);
  border: none;
  cursor: pointer;
  display: none; /* Скрыто, но не удалено */
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(100, 108, 255, 0.4);
  transition: all 0.3s ease;
  z-index: 9998;
}

.ai-float-button.hidden {
  transform: scale(0);
  opacity: 0;
  pointer-events: none;
}

.ai-float-button:hover {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 6px 25px rgba(100, 108, 255, 0.6);
}

.ai-icon {
  font-size: 28px;
  animation: pulse 2s infinite;
}

.ai-pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 30px;
  background: rgba(100, 108, 255, 0.4);
  animation: pulse-ring 2s infinite;
}

/* Оверлей чата - БЕЗ РАЗМЫТИЯ */
.ai-chat-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 20px;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

/* Окно чата */
.ai-chat-window {
  width: 400px;
  background: v-bind('props.theme === "dark" ? "#1e1e1e" : "#ffffff"');
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"');
  transition: height 0.3s ease;
  position: relative;
}

/* Заголовок */
.chat-header {
  padding: 15px 20px;
  background: v-bind('props.theme === "dark" ? "rgba(100, 108, 255, 0.1)" : "rgba(100, 108, 255, 0.05)"');
  border-bottom: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"');
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  font-size: 20px;
}

.header-title {
  font-weight: 600;
  font-size: 14px;
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
}

.header-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(100, 108, 255, 0.3);
  border-radius: 12px;
  color: #646cff;
}

.header-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  background: transparent;
  border: none;
  color: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.6)"');
  font-size: 18px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.control-btn:hover {
  background: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"');
  color: v-bind('props.theme === "dark" ? "white" : "black"');
}

.control-btn.close:hover {
  background: #ff5f56;
  color: white;
}

/* Ручка изменения размера */
.chat-resize-handle {
  height: 8px;
  cursor: row-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: background-color 0.2s;
}

.chat-resize-handle:hover,
.chat-resize-handle.dragging {
  background: rgba(100, 108, 255, 0.2);
}

.handle-dots {
  color: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)"');
  font-size: 16px;
  line-height: 1;
}

/* Сообщения */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  background: v-bind('props.theme === "dark" ? "#1e1e1e" : "#ffffff"');
  max-height: calc(100% - 120px); /* Учитываем высоту input */
}

.message {
  display: flex;
  gap: 10px;
  animation: slideIn 0.3s ease;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  background: rgba(100, 108, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
}

.message.user .message-content {
  text-align: right;
}

.message-text {
  padding: 10px 15px;
  background: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"');
  border-radius: 18px;
  font-size: 13px;
  line-height: 1.5;
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
}

.message.user .message-text {
  background: rgba(100, 108, 255, 0.3);
}

.message-time {
  font-size: 10px;
  opacity: 0.5;
  margin-top: 4px;
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
}

.message-text pre {
  background: v-bind('props.theme === "dark" ? "#2d2d2d" : "#f5f5f5"');
  padding: 10px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 10px 0;
  font-family: 'Consolas', monospace;
  font-size: 12px;
}

.message-text code {
  font-family: 'Consolas', monospace;
  background: v-bind('props.theme === "dark" ? "#2d2d2d" : "#f5f5f5"');
  padding: 2px 4px;
  border-radius: 4px;
}

/* Индикатор печатания */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 15px;
  background: v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"');
  border-radius: 18px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #646cff;
  border-radius: 4px;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

/* Поле ввода */
.chat-input-area {
  padding: 15px;
  display: flex;
  gap: 10px;
  border-top: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"');
  background: v-bind('props.theme === "dark" ? "#1e1e1e" : "#ffffff"');
}

.chat-input-area textarea {
  flex: 1;
  padding: 10px;
  border-radius: 20px;
  border: 1px solid v-bind('props.theme === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)"');
  background: v-bind('props.theme === "dark" ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.05)"');
  color: v-bind('props.theme === "dark" ? "white" : "#333"');
  resize: none;
  font-family: inherit;
  font-size: 13px;
  max-height: 100px;
}

.chat-input-area textarea:focus {
  outline: none;
  border-color: #646cff;
}

.send-btn {
  width: 40px;
  height: 40px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(135deg, #646cff, #9089fc);
  color: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 18px;
}

.send-btn:hover:not(:disabled) {
  transform: scale(1.1);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Минимизированное состояние */
.ai-chat-window.minimized {
  height: 60px !important;
  overflow: hidden;
}

/* Анимации */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes typing {
  0%, 100% { opacity: 0.4; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-5px); }
}

/* Скроллбар */
.chat-messages::-webkit-scrollbar {
  width: 5px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(100, 108, 255, 0.3);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 108, 255, 0.5);
}

/* Мобильная адаптация */
@media (max-width: 768px) {
  .ai-chat-window {
    width: 100%;
    height: 80vh !important;
  }
  
  .ai-chat-overlay {
    padding: 10px;
  }
}
</style>