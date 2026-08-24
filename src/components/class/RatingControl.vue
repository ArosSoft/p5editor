<script setup lang="ts">
const props = defineProps<{ rating: number }>()
const emit = defineEmits<{ (e: 'rate', delta: number): void }>()

function inc() {
  if (props.rating < 4) emit('rate', 1)
}
function dec() {
  if (props.rating > 0) emit('rate', -1)
}
</script>

<template>
  <div class="rating">
    <button class="star-btn" :disabled="rating === 0" @click="dec" aria-label="Уменьшить">−</button>
    <span class="stars">
      <span v-for="n in 4" :key="n" :class="{ filled: n <= rating }">★</span>
    </span>
    <button class="star-btn" :disabled="rating === 4" @click="inc" aria-label="Увеличить">+</button>
  </div>
</template>

<style scoped>
.rating {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.stars {
  letter-spacing: 2px;
  color: #45475a;
}
.stars .filled {
  color: #f9e2af;
}
.star-btn {
  background: #313244;
  color: #e0e0e0;
  border: none;
  border-radius: 6px;
  width: 26px;
  height: 26px;
  cursor: pointer;
  font-size: 16px;
}
.star-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
