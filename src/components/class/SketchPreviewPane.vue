<script setup lang="ts">
import { computed } from 'vue'
import type { SketchWithProfile } from '../../types/supabase'

const props = defineProps<{ sketch: (SketchWithProfile & { profiles?: any }) | null }>()

const srcDoc = computed(() => {
  if (!props.sketch?.code) return ''
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>html,body{margin:0;padding:0;background:#11111b;overflow:hidden}canvas{display:block}</style>
<script src="https://cdn.jsdelivr.net/npm/p5@2.2.0/lib/p5.min.js"><\/script>
</head>
<body>
<script>
try {
  ${props.sketch.code}
} catch (e) {
  document.body.innerHTML = '<pre style="color:#f38ba8;padding:12px;font:13px monospace">Ошибка предпросмотра: ' + e.message + '</pre>';
}
<\/script>
</body>
</html>`
})
</script>

<template>
  <div class="preview-pane">
    <p v-if="!sketch" class="hint">Выберите скетч справа, чтобы посмотреть его.</p>
    <template v-else>
      <iframe v-if="srcDoc" :srcdoc="srcDoc" class="preview-frame" sandbox="allow-scripts" title="preview" />
      <p v-else class="hint">Нет кода для предпросмотра.</p>
      <a
        class="open-editor"
        :href="`#/sketch/${sketch.numeric_sketch_id ?? sketch.id}`"
        target="_blank"
        rel="noopener"
      >
        Открыть в редакторе
      </a>
    </template>
  </div>
</template>

<style scoped>
.preview-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}
.preview-frame {
  flex: 1;
  width: 100%;
  min-height: 360px;
  border: 1px solid #313244;
  border-radius: 8px;
  background: #11111b;
}
.open-editor {
  align-self: flex-start;
  background: #89b4fa;
  color: #11111b;
  text-decoration: none;
  border-radius: 6px;
  padding: 8px 14px;
  font-size: 14px;
}
.hint {
  color: #a6adc8;
  font-size: 14px;
}
</style>
