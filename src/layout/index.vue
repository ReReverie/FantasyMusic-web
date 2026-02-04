<template>
  <div class="app-wrapper">
    <div class="top-header">
      <Header />
    </div>
    <div class="main-body">
      <div 
        class="sidebar-container" 
        :class="{ 'is-collapsed': isCollapse }"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <Sidebar 
          :is-collapse="isCollapse" 
          :is-locked="isLocked"
          @toggle-lock="toggleLock"
        />
      </div>
      <div class="main-container">
        <el-scrollbar>
          <AppMain />
        </el-scrollbar>
      </div>
    </div>
    <!-- 全局播放器 -->
    <FooterPlayer />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Header from './components/Header.vue'
import Sidebar from './components/Sidebar.vue'
import AppMain from './components/AppMain.vue'
import FooterPlayer from './components/FooterPlayer.vue'

// 侧边栏状态管理
const isLocked = ref(true) // 默认锁定（展开）
const isHover = ref(false)

// 计算是否折叠：如果没有锁定且鼠标不在上面，则折叠
const isCollapse = computed(() => !isLocked.value && !isHover.value)

const handleMouseEnter = () => {
  isHover.value = true
}

const handleMouseLeave = () => {
  isHover.value = false
}

const toggleLock = () => {
  isLocked.value = !isLocked.value
  // 如果解锁，鼠标当前肯定在上面，所以 isHover 应该是 true，不会立即折叠
}
</script>

<style scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}

.top-header {
  height: 60px;
  flex-shrink: 0;
  z-index: 1001;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
}

.main-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar-container {
  width: 200px;
  background-color: #304156;
  flex-shrink: 0;
  height: 100%;
  transition: width 0.3s ease-in-out;
  overflow: hidden;
  position: relative;
}

.sidebar-container.is-collapsed {
  width: 64px;
}

.main-container {
  flex: 1;
  background-color: #f0f2f5;
  height: 100%;
  box-sizing: border-box;
}

/* 确保 el-scrollbar 占满高度 */
.main-container :deep(.el-scrollbar) {
  height: 100%;
}
.main-container :deep(.el-scrollbar__view) {
  min-height: 100%;
}
</style>
