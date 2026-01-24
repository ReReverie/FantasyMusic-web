<template>
  <el-scrollbar wrap-class="scrollbar-wrapper">
    <el-menu
      :default-active="activeMenu"
      :collapse="isCollapse"
      :background-color="variables.menuBg"
      :text-color="variables.menuText"
      :active-text-color="variables.menuActiveText"
      :unique-opened="false"
      :collapse-transition="false"
      mode="vertical"
      router
    >
      <el-menu-item index="/home">
        <el-icon><House /></el-icon>
        <template #title>首页</template>
      </el-menu-item>
      
      <el-menu-item index="/music">
        <el-icon><Headset /></el-icon>
        <template #title>音乐库</template>
      </el-menu-item>

      <el-menu-item index="/playlist">
        <el-icon><Collection /></el-icon>
        <template #title>我的歌单</template>
      </el-menu-item>

      <el-menu-item index="/account">
        <el-icon><User /></el-icon>
        <template #title>个人中心</template>
      </el-menu-item>
    </el-menu>
  </el-scrollbar>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Logo from './Logo.vue'

const route = useRoute()

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

const isCollapse = false
const variables = {
  menuBg: '#304156',
  menuText: '#bfcbd9',
  menuActiveText: '#409EFF'
}
</script>

<style scoped>
.scrollbar-wrapper {
  height: 100%;
}
</style>
