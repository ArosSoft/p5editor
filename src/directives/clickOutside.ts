import type { Directive, DirectiveBinding } from 'vue'

interface ClickOutsideElement extends HTMLElement {
  _clickOutside?: (event: PointerEvent) => void
  _windowBlur?: () => void
}

export const clickOutside: Directive<ClickOutsideElement, () => void> = {
  mounted(el: ClickOutsideElement, binding: DirectiveBinding<() => void>) {
    // Слушаем pointerdown в фазе захвата, чтобы срабатывать даже если
    // внутренние компоненты останавливают всплытие события click.
    el._clickOutside = (event: PointerEvent) => {
      if (!(el === event.target || el.contains(event.target as Node))) {
        binding.value()
      }
    }
    // Клик внутри iframe (например, холст p5) не доходит до документа,
    // поэтому дополнительно закрываем при потере фокуса окном.
    el._windowBlur = () => binding.value()
    document.addEventListener('pointerdown', el._clickOutside, true)
    window.addEventListener('blur', el._windowBlur)
  },
  unmounted(el: ClickOutsideElement) {
    if (el._clickOutside) {
      document.removeEventListener('pointerdown', el._clickOutside, true)
    }
    if (el._windowBlur) {
      window.removeEventListener('blur', el._windowBlur)
    }
    delete el._clickOutside
    delete el._windowBlur
  }
}