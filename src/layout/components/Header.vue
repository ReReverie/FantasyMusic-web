<template>
  <div class="navbar">
    <div class="left-menu">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">
          <div class="brand-breadcrumb">
            <img :src="logo" class="brand-logo" />
            <span class="brand-text">梦幻音乐平台</span>
          </div>
        </el-breadcrumb-item>
        <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="right-menu">
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
import { ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const logo = 'https://wpimg.wallstcn.com/69a1c46c-eb1c-4b46-8bd4-e9e686ef5251.png'

const logout = async () => {
  await userStore.logout()
  sessionStorage.setItem('redirect_path', route.fullPath)
  router.push(`/login`)
  ElMessage.success('退出登录成功')
}
</script>

<style scoped>
.navbar {
  height: 100%;
  overflow: hidden;
  position: relative;
  background: #2b2f3a; /* Dark background */
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: #fff;
}

.left-menu {
  flex: 1;
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
  font-size: 14px;
  vertical-align: middle;
  line-height: 1;
}

/* Breadcrumb styles for dark background */
:deep(.el-breadcrumb) {
  display: flex;
  align-items: center;
  line-height: 1;
}
:deep(.el-breadcrumb__inner) {
  color: #bfcbd9 !important;
  display: flex !important; /* Ensure flex layout for inner content */
  align-items: center !important;
}
:deep(.el-breadcrumb__inner.is-link) {
  color: #fff !important;
}

/* Ensure separator is vertically centered if needed */
:deep(.el-breadcrumb__separator) {
  color: #bfcbd9;
  margin: 0 9px;
  font-weight: bold;
}

.right-menu {
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #fff;
}

.user-name {
  margin-right: 5px;
}
</style>
