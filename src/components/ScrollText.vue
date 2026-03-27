<template>
  <div 
    class="scroll-text-container" 
    :class="{ 'is-overflowing': isOverflowing }"
    ref="containerRef"
  >
    <div 
      class="scroll-text-content" 
      ref="contentRef"
      :style="contentStyle"
      @transitionend="onTransitionEnd"
    >
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'

const props = defineProps({
  text: {
    type: [String, Number],
    default: ''
  }
})

const containerRef = ref(null)
const contentRef = ref(null)

const isOverflowing = ref(false)
const distance = ref(0)
const duration = ref(0)

const offset = ref(0)
const isTransitioning = ref(false)
const transitionDuration = ref(0)

let state = 0; // 0: start paused, 1: scrolling left, 2: end paused, 3: resetting
let timer = null

const calculate = () => {
  clearTimeout(timer)
  offset.value = 0
  isTransitioning.value = false
  state = 0
  
  if (!containerRef.value || !contentRef.value) return
  
  const cWidth = containerRef.value.offsetWidth
  const tWidth = contentRef.value.scrollWidth
  
  if (tWidth > cWidth && cWidth > 0) {
    isOverflowing.value = true
    distance.value = tWidth - cWidth + 10 // 多滚动10px留点白
    duration.value = distance.value / 30 // 假设滚动速度：每秒30px
    startAnimation()
  } else {
    isOverflowing.value = false
  }
}

const startAnimation = () => {
  state = 0
  timer = setTimeout(() => {
    state = 1
    isTransitioning.value = true
    transitionDuration.value = duration.value
    offset.value = -distance.value
  }, 2000) // 初始停顿2秒
}

const onTransitionEnd = () => {
  if (state === 1) {
    state = 2
    timer = setTimeout(() => {
      state = 3
      isTransitioning.value = false // 无过渡跳回起点
      offset.value = 0
      
      // 稍微延时后重新开始
      timer = setTimeout(() => {
        startAnimation()
      }, 50)
    }, 2000) // 结束停顿2秒
  }
}

watch(() => props.text, () => {
  nextTick(calculate)
})

onMounted(() => {
  // 需要等待字体等渲染完成
  setTimeout(() => {
    calculate()
  }, 100)
  window.addEventListener('resize', calculate)
})

onUnmounted(() => {
  clearTimeout(timer)
  window.removeEventListener('resize', calculate)
})

const contentStyle = computed(() => {
  return {
    transform: `translateX(${offset.value}px)`,
    transition: isTransitioning.value ? `transform ${transitionDuration.value}s linear` : 'none',
    display: 'inline-block',
    whiteSpace: 'nowrap'
  }
})
</script>

<style scoped>
.scroll-text-container {
  width: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
}

.scroll-text-container.is-overflowing {
  -webkit-mask-image: linear-gradient(to right, black 90%, transparent 100%);
  mask-image: linear-gradient(to right, black 90%, transparent 100%);
}

.scroll-text-content {
  will-change: transform;
}
</style>
