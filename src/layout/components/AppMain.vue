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
  background-color: #f0f2f5;
}

.fade-transform-leave-active,
.fade-transform-enter-active {
  transition: all .5s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
