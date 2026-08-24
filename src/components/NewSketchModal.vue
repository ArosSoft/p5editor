<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  theme?: 'dark' | 'light';
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', payload: { code: string; name: string; label: string }): void;
}>();

type TemplateKey = 'clean' | 'tutorial' | '3d';

interface TemplateDef {
  key: TemplateKey;
  label: string;
  description: string;
  code: string;
}

const templates: TemplateDef[] = [
  {
    key: 'clean',
    label: 'Чистый',
    description: 'Пустой холст без лишнего кода',
    code: `function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  // напиши свой код ниже

}`,
  },
  {
    key: 'tutorial',
    label: 'Учебный',
    description: 'Стартовый шаблон с подсказками',
    code: `function setup() {
  // установка размеров холста
  createCanvas(800, 600);
  // настройка модели цвета
  colorMode(HSB, 256, 100, 100);
}

function draw() {
  // background(220);
  ellipse(mouseX, mouseY, 50, 50);
  // смена цвета при нажатии
  if (mouseIsPressed)
    fill(frameCount % 256, 100, 100);
  // напиши свой код ниже

}`,
  },
  {
    key: '3d',
    label: '3D',
    description: 'Объёмная сцена в пространстве WEBGL',
    code: `function setup() {
  // создаём 3D-холст
  createCanvas(600, 600, WEBGL);
}

function draw() {
  background(30);
  // вращаем сцену
  rotateY(frameCount * 0.01);
  rotateX(frameCount * 0.013);
  // объёмный цвет
  normalMaterial();
  // фигура
  box(200);
}`,
  },
];

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const selected = ref<TemplateKey>('tutorial');
const sketchName = ref('');

// При каждом открытии окна очищаем поле названия
watch(isVisible, (open) => {
  if (open) {
    selected.value = 'tutorial';
    sketchName.value = '';
  }
});

function selectTemplate(key: TemplateKey) {
  selected.value = key;
}

function closeModal() {
  isVisible.value = false;
}

function confirmSelection() {
  const def = templates.find((t) => t.key === selected.value);
  if (!def) return;
  emit('confirm', {
    code: def.code,
    name: sketchName.value.trim() || 'Мой первый скетч',
    label: def.label,
  });
  closeModal();
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isVisible" class="newsketch-overlay" @click.self="closeModal">
        <div class="newsketch-modal" :class="`theme-${theme}`">
          <button class="close-btn" @click="closeModal" title="Закрыть">&times;</button>

          <h2 class="modal-title">Новый скетч</h2>
          <p class="modal-subtitle">Выберите шаблон для старта</p>

          <div class="cards">
            <button
              v-for="t in templates"
              :key="t.key"
              class="card"
              :class="{ selected: selected === t.key }"
              @click="selectTemplate(t.key)"
            >
              <div class="card-image">
                <!-- Чистый -->
                <svg v-if="t.key === 'clean'" viewBox="0 0 120 90" class="card-svg">
                  <rect x="6" y="6" width="108" height="78" rx="8" fill="#f4f4f8" />
                  <circle cx="60" cy="45" r="6" fill="#42b883" />
                  <path d="M20 70 L100 70" stroke="#d0d0d8" stroke-width="2" />
                </svg>

                <!-- Учебный -->
                <svg v-else-if="t.key === 'tutorial'" viewBox="0 0 120 90" class="card-svg">
                  <rect x="6" y="6" width="108" height="78" rx="8" fill="#1e2330" />
                  <text x="18" y="30" fill="#c678dd" font-family="monospace" font-size="12">&lt;/&gt;</text>
                  <rect x="18" y="40" width="60" height="5" rx="2.5" fill="#61afef" />
                  <rect x="18" y="52" width="80" height="5" rx="2.5" fill="#98c379" />
                  <rect x="18" y="64" width="40" height="5" rx="2.5" fill="#e5c07b" />
                </svg>

                <!-- 3D -->
                <svg v-else viewBox="0 0 120 90" class="card-svg">
                  <rect x="6" y="6" width="108" height="78" rx="8" fill="#0e1320" />
                  <g stroke="#42b883" stroke-width="2" fill="none">
                    <polygon points="60,18 90,33 60,48 30,33" fill="rgba(66,184,131,0.15)" />
                    <polygon points="30,33 60,48 60,72 30,57" fill="rgba(66,184,131,0.10)" />
                    <polygon points="90,33 60,48 60,72 90,57" fill="rgba(66,184,131,0.20)" />
                  </g>
                </svg>
              </div>
              <div class="card-caption">{{ t.label }}</div>
              <div class="card-description">{{ t.description }}</div>
            </button>
          </div>

          <div class="footer">
            <input
              type="text"
              class="name-input"
              placeholder="Напиши имя программы"
              v-model="sketchName"
            />
            <button
              class="start-btn"
              :disabled="!sketchName.trim()"
              @click="confirmSelection"
            >
              Начнем кодить
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.newsketch-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  backdrop-filter: blur(4px);
}

.newsketch-modal {
  background: #1e1e1e;
  border-radius: 14px;
  padding: 28px 28px 24px;
  width: 100%;
  max-width: 640px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  color: #ffffff;
}

.newsketch-modal.theme-light {
  background: #ffffff;
  color: #1e1e1e;
}

.close-btn {
  position: absolute;
  top: 14px;
  right: 16px;
  background: none;
  border: none;
  font-size: 28px;
  color: #888;
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
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.newsketch-modal.theme-light .close-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #1e1e1e;
}

.modal-title {
  margin: 0 0 4px;
  font-size: 22px;
  font-weight: 600;
  text-align: center;
}

.modal-subtitle {
  margin: 0 0 20px;
  font-size: 14px;
  color: #aaa;
  text-align: center;
}

.newsketch-modal.theme-light .modal-subtitle {
  color: #666;
}

.cards {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.card {
  flex: 1;
  background: #262626;
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 14px 12px 16px;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.2s, transform 0.15s, background 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.newsketch-modal.theme-light .card {
  background: #f4f4f8;
}

.card:hover {
  transform: translateY(-3px);
  background: #2e2e2e;
}

.newsketch-modal.theme-light .card:hover {
  background: #ececf2;
}

.card.selected {
  border-color: #42b883;
  background: #20302a;
}

.newsketch-modal.theme-light .card.selected {
  background: #e7f6ef;
}

.card-image {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

.card-svg {
  width: 100%;
  height: auto;
  display: block;
}

.card-caption {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.card-description {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.newsketch-modal.theme-light .card-description {
  color: #666;
}

.footer {
  margin-top: 22px;
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.name-input {
  flex: 1;
  padding: 12px 14px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.newsketch-modal.theme-light .name-input {
  background: #fff;
  border-color: #d0d0d8;
  color: #1e1e1e;
}

.name-input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.2);
}

.start-btn {
  padding: 12px 22px;
  background: #42b883;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, transform 0.1s;
}

.start-btn:hover {
  background: #36a76f;
  transform: translateY(-1px);
}

.start-btn:active {
  transform: translateY(0);
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .newsketch-modal,
.modal-leave-active .newsketch-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .newsketch-modal,
.modal-leave-to .newsketch-modal {
  transform: scale(0.95) translateY(-10px);
}
</style>
