<template>
  <section class="app-main">
    <router-view v-slot="{ Component, route }">
      <transition name="fade-transform" mode="out-in">
        <keep-alive :include="cachedViews">
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </transition>
    </router-view>
  </section>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const cachedViews = ref([])

watch(
  () => route.path,
  () => {
    if (route.meta.keepAlive && route.name) {
      if (!cachedViews.value.includes(route.name)) {
        cachedViews.value.push(route.name)
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.app-main {
  /* 60 = navbar */
  min-height: calc(100vh - 60px);
  width: 100%;
  position: relative;
  overflow: hidden;
  padding: 20px;
  padding-bottom: 100px; /* 防止底部播放器遮挡内容 */
  background-color: transparent;
}

.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
  will-change: transform, opacity;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translate3d(-20px, 0, 0);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translate3d(20px, 0, 0);
}

@media screen and (max-width: 768px) {
  .app-main {
    padding: 12px;
    padding-bottom: 140px; /* Ensure enough space for taller mobile footer */
  }
}
</style>
