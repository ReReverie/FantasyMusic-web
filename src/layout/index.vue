<template>
  <div class="app-wrapper">
    <!-- Top Header -->
    <div class="top-header">
      <Header />
    </div>
    
    <!-- Main Body -->
    <div class="main-body">
      <div class="sidebar-container">
        <Sidebar />
      </div>
      <div class="main-container">
        <AppMain />
      </div>
    </div>
  </div>
</template>

<script setup>
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import AppMain from './components/AppMain.vue'
</script>

<style scoped>
.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.top-header {
  height: 50px;
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1002;
}

.main-body {
  display: flex;
  margin-top: 50px; /* Height of header */
  height: calc(100vh - 50px);
  width: 100%;
}

.sidebar-container {
  width: 210px;
  background-color: #304156;
  height: 100%;
  position: fixed;
  top: 50px; /* Below header */
  bottom: 0;
  left: 0;
  z-index: 1001;
  overflow: hidden;
}

.main-container {
  height: 100%;
  transition: margin-left .28s;
  margin-left: 210px;
  position: relative;
  width: calc(100% - 210px);
}
</style>
