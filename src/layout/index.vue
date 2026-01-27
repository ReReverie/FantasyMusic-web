<template>
  <div class="app-wrapper">
    <div class="top-header">
      <Header />
    </div>
    <div class="main-body">
      <div class="sidebar-container">
        <Sidebar />
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
import Header from './components/Header.vue'
import Sidebar from './components/Sidebar.vue'
import AppMain from './components/AppMain.vue'
import FooterPlayer from './components/FooterPlayer.vue'
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
}

.main-container {
  flex: 1;
  background-color: #f0f2f5;
  height: 100%;
  /* 为底部播放器留出空间，防止内容被遮挡 */
  padding-bottom: 80px; 
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
