<template>
  <div class="navbar">
    <div class="left-menu">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="right-menu">
      <el-dropdown class="avatar-container" trigger="click">
        <div class="avatar-wrapper">
          <span class="user-name">{{ userStore.name || '用户' }}</span>
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu class="user-dropdown">
            <router-link to="/">
              <el-dropdown-item>首页</el-dropdown-item>
            </router-link>
            <router-link to="/account">
              <el-dropdown-item>个人中心</el-dropdown-item>
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

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const logout = async () => {
  await userStore.logout()
  router.push(`/login?redirect=${route.fullPath}`)
  ElMessage.success('退出登录成功')
}
</script>

<style scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #2b2f3a; /* Dark background */
  box-shadow: 0 1px 4px rgba(0,21,41,.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  color: #fff;
}

.header-logo {
  display: flex;
  align-items: center;
  margin-right: 40px;
}

.logo-img {
  width: 30px;
  height: 30px;
  margin-right: 10px;
}

.app-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  white-space: nowrap;
}

.left-menu {
  flex: 1;
}

/* Breadcrumb styles for dark background */
:deep(.el-breadcrumb__inner) {
  color: #bfcbd9 !important;
}
:deep(.el-breadcrumb__inner.is-link) {
  color: #fff !important;
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
