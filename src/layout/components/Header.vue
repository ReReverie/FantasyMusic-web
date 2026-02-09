<template>
  <div class="navbar">
    <div class="left-menu">
      <div class="mobile-toggle" @click="$emit('toggle-sidebar')">
        <el-icon :size="20"><Expand /></el-icon>
      </div>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">
          <div class="brand-breadcrumb">
            <img :src="logo" class="brand-logo" />
            <span class="brand-text">Fantasy Music</span>
          </div>
        </el-breadcrumb-item>
        <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="right-menu">
      <div class="theme-switch" @click="toggleDark">
        <transition name="icon-fade" mode="out-in">
          <el-icon v-if="isDark" class="theme-icon"><Moon /></el-icon>
          <el-icon v-else class="theme-icon"><Sunny /></el-icon>
        </transition>
      </div>
      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <span class="user-name">{{ userStore.nickname || userStore.username || '用户' }}</span>
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown">
            <router-link to="/password">
              <el-dropdown-item>修改密码</el-dropdown-item>
            </router-link>
            <el-dropdown-item divided @click="logout">
              <span style="display:block;">退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { ArrowDown, Expand, Moon, Sunny } from '@element-plus/icons-vue'
import { ref, onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
import logoImg from '@/assets/logo.svg'
const logo = logoImg

const isDark = ref(false)

const toggleDark = () => {
  isDark.value = !isDark.value
  updateTheme()
}

const updateTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
  } else {
    isDark.value = false
  }
  updateTheme()
})

const logout = async () => {
  await userStore.logout()
  sessionStorage.setItem('redirect_path', route.fullPath)
  router.push(`/login`)
  ElMessage.success('退出登录成功')
}

defineEmits(['toggle-sidebar'])
</script>

<style scoped>
.navbar {
  height: 100%;
  overflow: hidden;
  position: relative;
  background: var(--navbar-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: var(--text-main);
  transition: background-color 0.3s ease, color 0.3s ease;
}

.left-menu {
  flex: 1;
  display: flex;
  align-items: center;
}

.mobile-toggle {
  display: none;
  margin-right: 15px;
  cursor: pointer;
  color: #606266;
  align-items: center;
}

@media screen and (max-width: 768px) {
  .mobile-toggle {
    display: flex;
  }
  
  /* Hide breadcrumb on very small screens if needed, or adjust */
  :deep(.el-breadcrumb) {
    display: none; /* Simplify header on mobile */
  }
}

/* Brand Breadcrumb Styles */
.brand-breadcrumb {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.brand-logo {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  vertical-align: middle;
}

.brand-text {
  font-weight: bold;
  font-size: 18px;
  vertical-align: middle;
  line-height: 1;
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Breadcrumb styles for dark background */
:deep(.el-breadcrumb) {
  display: flex;
  align-items: center;
  line-height: 1;
}
:deep(.el-breadcrumb__inner) {
  color: var(--text-secondary) !important;
  display: flex !important; /* Ensure flex layout for inner content */
  align-items: center !important;
}
:deep(.el-breadcrumb__inner.is-link) {
  color: var(--text-main) !important;
}

/* Ensure separator is vertically centered if needed */
:deep(.el-breadcrumb__separator) {
  color: var(--text-secondary);
  margin: 0 9px;
  font-weight: bold;
}

.right-menu {
  display: flex;
  align-items: center;
}

.theme-switch {
  margin-right: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.theme-switch:hover {
  background-color: var(--menu-hover-bg);
}

.theme-icon {
  font-size: 20px;
  color: var(--text-main);
}

.icon-fade-enter-active,
.icon-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.icon-fade-enter-from,
.icon-fade-leave-to {
  opacity: 0;
  transform: rotate(30deg) scale(0.5);
}

.icon-fade-enter-to,
.icon-fade-leave-from {
  opacity: 1;
  transform: rotate(0) scale(1);
}

.avatar-wrapper {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: var(--text-main);
  transition: color 0.3s;
}

.avatar-wrapper:hover {
  color: var(--primary-color);
}

.user-name {
  margin-right: 5px;
}
</style>
