<script setup lang="ts">
import { computed, ref, type Ref } from 'vue'

const props = defineProps<{
  theme?: 'dark' | 'light'
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

type CssColor = { name: string; value: string }
type Hsl = { h: number; s: number; l: number }

// CSS named colors (исправлены все опечатки из исходного текста)
const CSS_NAMED_COLORS: CssColor[] = [
  { name: 'aliceblue', value: '#f0f8ff' },
  { name: 'antiquewhite', value: '#faebd7' },
  { name: 'aqua', value: '#00ffff' },
  { name: 'aquamarine', value: '#7fffd4' },
  { name: 'azure', value: '#f0ffff' },
  { name: 'beige', value: '#f5f5dc' },
  { name: 'bisque', value: '#ffe4c4' },
  { name: 'black', value: '#000000' },
  { name: 'blanchedalmond', value: '#ffebcd' },
  { name: 'blue', value: '#0000ff' },
  { name: 'blueviolet', value: '#8a2be2' },
  { name: 'brown', value: '#a52a2a' },
  { name: 'burlywood', value: '#deb887' },
  { name: 'cadetblue', value: '#5f9ea0' },
  { name: 'chartreuse', value: '#7fff00' },
  { name: 'chocolate', value: '#d2691e' },
  { name: 'coral', value: '#ff7f50' },
  { name: 'cornflowerblue', value: '#6495ed' },
  { name: 'cornsilk', value: '#fff8dc' },
  { name: 'crimson', value: '#dc143c' },
  { name: 'cyan', value: '#00ffff' },
  { name: 'darkblue', value: '#00008b' },
  { name: 'darkcyan', value: '#008b8b' },
  { name: 'darkgoldenrod', value: '#b8860b' },
  { name: 'darkgray', value: '#a9a9a9' },
  { name: 'darkgreen', value: '#006400' },
  { name: 'darkgrey', value: '#a9a9a9' },
  { name: 'darkkhaki', value: '#bdb76b' },
  { name: 'darkmagenta', value: '#8b008b' },
  { name: 'darkolivegreen', value: '#556b2f' },
  { name: 'darkorange', value: '#ff8c00' },
  { name: 'darkorchid', value: '#9932cc' },
  { name: 'darkred', value: '#8b0000' },
  { name: 'darksalmon', value: '#e9967a' },
  { name: 'darkseagreen', value: '#8fbc8f' },
  { name: 'darkslateblue', value: '#483d8b' },
  { name: 'darkslategray', value: '#2f4f4f' },
  { name: 'darkslategrey', value: '#2f4f4f' },
  { name: 'darkturquoise', value: '#00ced1' },
  { name: 'darkviolet', value: '#9400d3' },
  { name: 'deeppink', value: '#ff1493' },
  { name: 'deepskyblue', value: '#00bfff' },
  { name: 'dimgray', value: '#696969' },
  { name: 'dimgrey', value: '#696969' },
  { name: 'dodgerblue', value: '#1e90ff' },
  { name: 'firebrick', value: '#b22222' },
  { name: 'floralwhite', value: '#fffaf0' },
  { name: 'forestgreen', value: '#228b22' },
  { name: 'fuchsia', value: '#ff00ff' },
  { name: 'gainsboro', value: '#dcdcdc' },
  { name: 'ghostwhite', value: '#f8f8ff' },
  { name: 'gold', value: '#ffd700' },
  { name: 'goldenrod', value: '#daa520' },
  { name: 'gray', value: '#808080' },
  { name: 'green', value: '#008000' },
  { name: 'greenyellow', value: '#adff2f' },
  { name: 'grey', value: '#808080' },
  { name: 'honeydew', value: '#f0fff0' },
  { name: 'hotpink', value: '#ff69b4' },
  { name: 'indianred', value: '#cd5c5c' },
  { name: 'indigo', value: '#4b0082' },
  { name: 'ivory', value: '#fffff0' },
  { name: 'khaki', value: '#f0e68c' },
  { name: 'lavender', value: '#e6e6fa' },
  { name: 'lavenderblush', value: '#fff0f5' },
  { name: 'lawngreen', value: '#7cfc00' },
  { name: 'lemonchiffon', value: '#fffacd' },
  { name: 'lightblue', value: '#add8e6' },
  { name: 'lightcoral', value: '#f08080' },
  { name: 'lightcyan', value: '#e0ffff' },
  { name: 'lightgoldenrodyellow', value: '#fafad2' },
  { name: 'lightgray', value: '#d3d3d3' },
  { name: 'lightgreen', value: '#90ee90' },
  { name: 'lightgrey', value: '#d3d3d3' },
  { name: 'lightpink', value: '#ffb6c1' },
  { name: 'lightsalmon', value: '#ffa07a' },
  { name: 'lightseagreen', value: '#20b2aa' },
  { name: 'lightskyblue', value: '#87cefa' },
  { name: 'lightslategray', value: '#778899' },
  { name: 'lightslategrey', value: '#778899' },
  { name: 'lightsteelblue', value: '#b0c4de' },
  { name: 'lightyellow', value: '#ffffe0' },
  { name: 'lime', value: '#00ff00' },
  { name: 'limegreen', value: '#32cd32' },
  { name: 'linen', value: '#faf0e6' },
  { name: 'magenta', value: '#ff00ff' },
  { name: 'maroon', value: '#800000' },
  { name: 'mediumaquamarine', value: '#66cdaa' },
  { name: 'mediumblue', value: '#0000cd' },
  { name: 'mediumorchid', value: '#ba55d3' },
  { name: 'mediumpurple', value: '#9370db' },
  { name: 'mediumseagreen', value: '#3cb371' },
  { name: 'mediumslateblue', value: '#7b68ee' },
  { name: 'mediumspringgreen', value: '#00fa9a' },
  { name: 'mediumturquoise', value: '#48d1cc' },
  { name: 'mediumvioletred', value: '#c71585' },
  { name: 'midnightblue', value: '#191970' },
  { name: 'mintcream', value: '#f5fffa' },
  { name: 'mistyrose', value: '#ffe4e1' },
  { name: 'moccasin', value: '#ffe4b5' },
  { name: 'navajowhite', value: '#ffdead' },
  { name: 'navy', value: '#000080' },
  { name: 'oldlace', value: '#fdf5e6' },
  { name: 'olive', value: '#808000' },
  { name: 'olivedrab', value: '#6b8e23' },
  { name: 'orange', value: '#ffa500' },
  { name: 'orangered', value: '#ff4500' },
  { name: 'orchid', value: '#da70d6' },
  { name: 'palegoldenrod', value: '#eee8aa' },
  { name: 'palegreen', value: '#98fb98' },
  { name: 'paleturquoise', value: '#afeeee' },
  { name: 'palevioletred', value: '#db7093' },
  { name: 'papayawhip', value: '#ffefd5' },
  { name: 'peachpuff', value: '#ffdab9' },
  { name: 'peru', value: '#cd853f' },
  { name: 'pink', value: '#ffc0cb' },
  { name: 'plum', value: '#dda0dd' },
  { name: 'powderblue', value: '#b0e0e6' },
  { name: 'purple', value: '#800080' },
  { name: 'rebeccapurple', value: '#663399' },
  { name: 'red', value: '#ff0000' },
  { name: 'rosybrown', value: '#bc8f8f' },
  { name: 'royalblue', value: '#4169e1' },
  { name: 'saddlebrown', value: '#8b4513' },
  { name: 'salmon', value: '#fa8072' },
  { name: 'sandybrown', value: '#f4a460' },
  { name: 'seagreen', value: '#2e8b57' },
  { name: 'seashell', value: '#fff5ee' },
  { name: 'sienna', value: '#a0522d' },
  { name: 'silver', value: '#c0c0c0' },
  { name: 'skyblue', value: '#87ceeb' },
  { name: 'slateblue', value: '#6a5acd' },
  { name: 'slategray', value: '#708090' },
  { name: 'slategrey', value: '#708090' },
  { name: 'snow', value: '#fffafa' },
  { name: 'springgreen', value: '#00ff7f' },
  { name: 'steelblue', value: '#4682b4' },
  { name: 'tan', value: '#d2b48c' },
  { name: 'teal', value: '#008080' },
  { name: 'thistle', value: '#d8bfd8' },
  { name: 'tomato', value: '#ff6347' },
  { name: 'turquoise', value: '#40e0d0' },
  { name: 'violet', value: '#ee82ee' },
  { name: 'wheat', value: '#f5deb3' },
  { name: 'white', value: '#ffffff' },
  { name: 'whitesmoke', value: '#f5f5f5' },
  { name: 'yellow', value: '#ffff00' },
  { name: 'yellowgreen', value: '#9acd32' }
]

const pickerHex = ref('#646cff')
const search = ref('')
const notification = ref<string | null>(null)
let notificationTimer: ReturnType<typeof setTimeout> | null = null

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  // Безопасная проверка на наличие совпадения и первой группы
  if (!match?.[1]) return null
  
  const v = parseInt(match[1], 16)
  const r = (v >> 16) & 255
  const g = (v >> 8) & 255
  const b = v & 255
  return { r, g, b }
}

function rgbToHsl(r8: number, g8: number, b8: number): Hsl {
  const r = clamp01(r8 / 255)
  const g = clamp01(g8 / 255)
  const b = clamp01(b8 / 255)

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const l = (max + min) / 2

  let h = 0
  let s = 0

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1))
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }

  return { h, s, l }
}

function hueSortKey(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) return { h: 999, s: 0, l: 0 }
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

function showNotification(message: string) {
  if (notificationTimer) clearTimeout(notificationTimer)
  notification.value = message
  notificationTimer = setTimeout(() => (notification.value = null), 2000)
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    showNotification(`Скопировано: ${text}`)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    showNotification(`Скопировано: ${text}`)
  }
}

function onPickHex() {
  copyText(pickerHex.value)
}

const filteredNamed = computed(() => {
  const q = search.value.trim().toLowerCase()
  const base = !q
    ? CSS_NAMED_COLORS
    : CSS_NAMED_COLORS.filter(c => c.name.includes(q) || c.value.includes(q))

  return [...base].sort((a, b) => {
    const ah = hueSortKey(a.value)
    const bh = hueSortKey(b.value)

    if (ah.h !== bh.h) return ah.h - bh.h
    if (ah.s !== bh.s) return bh.s - ah.s
    if (ah.l !== bh.l) return ah.l - bh.l
    return a.name.localeCompare(b.name)
  })
})
</script>

<template>
  <div class="panel" :class="theme">
    <Transition name="fade">
      <div v-if="notification" class="notif">{{ notification }}</div>
    </Transition>

    <div class="header">
      <span class="title">Палитра</span>
      <button class="btn-icon" @click="emit('close')">×</button>
    </div>

    <div class="scroll">
      <div class="section">
        <div class="section-title">Выбрать цвет</div>
        <div class="picker-row">
          <input v-model="pickerHex" class="picker" type="color" @input="onPickHex" />
          <button class="btn" @click="copyText(pickerHex)">📋 {{ pickerHex }}</button>
        </div>
      </div>

      <div class="section">
        <div class="section-title">CSS-цвета</div>
        <input v-model="search" class="search" placeholder="Поиск (name или #hex)..." />
        <div class="colors">
          <button
            v-for="c in filteredNamed"
            :key="c.name"
            class="color-row"
            :title="`Скопировать: ${c.name}`"
            @click="copyText(c.name)"
          >
            <span class="swatch" :style="{ background: c.name }" />
            <span class="name">{{ c.name }}</span>
            <span class="value">{{ c.value }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
  position: relative;
  z-index: 100;
}
.panel.light { background: #f5f5f7; color: #1a1a2e; }

.header {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #2a2a4a;
  gap: 12px;
  flex-shrink: 0;
}
.panel.light .header { border-color: #e0e0e0; }

.title { flex: 1; font-weight: 600; }

.btn-icon {
  background: none;
  border: none;
  color: inherit;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.btn-icon:hover { background: rgba(255,255,255,0.1); }
.panel.light .btn-icon:hover { background: rgba(0,0,0,0.06); }

.scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section {
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  border-radius: 10px;
  padding: 12px;
}
.panel.light .section {
  border-color: rgba(0,0,0,0.08);
  background: rgba(0,0,0,0.02);
}

.section-title {
  font-weight: 600;
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.picker-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.picker {
  width: 44px;
  height: 44px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.btn {
  flex: 1;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: rgba(91, 91, 214, 0.22);
  color: inherit;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
}
.btn:hover { background: rgba(91, 91, 214, 0.35); }

.search {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #3a3a5a;
  border-radius: 8px;
  background: #12122a;
  color: inherit;
  font-size: 14px;
  margin-bottom: 10px;
}
.panel.light .search { background: #fff; border-color: #d0d0d0; }

.colors {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: rgba(255,255,255,0.04);
  color: inherit;
  cursor: pointer;
  text-align: left;
}
.panel.light .color-row { background: rgba(0,0,0,0.03); }
.color-row:hover {
  border-color: rgba(91, 91, 214, 0.8);
  background: rgba(91, 91, 214, 0.18);
}

.swatch {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 1px solid rgba(255,255,255,0.18);
  flex-shrink: 0;
}
.panel.light .swatch { border-color: rgba(0,0,0,0.18); }

.name {
  font-weight: 600;
  font-size: 13px;
}

.value {
  margin-left: auto; 
  font-family: 'JetBrains Mono', 'Cascadia Code', monospace;
  font-size: 12px;
  opacity: 0.9;
}

.notif {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 18px;
  background: #333;
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}

.fade-enter-active, .fade-leave-active { transition: all 0.22s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateX(-50%) translateY(-8px); }
</style>