<template>
  <div class="sidebar-wrapper">
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
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

        <el-menu-item index="/musiclist">
          <el-icon><Collection /></el-icon>
          <template #title>我的歌单</template>
        </el-menu-item>

        <el-menu-item index="/account">
          <el-icon><User /></el-icon>
          <template #title>个人中心</template>
        </el-menu-item>
      </el-menu>
    </el-scrollbar>

    <!-- 锁定/解锁按钮 -->
    <div class="lock-toggle" @click="$emit('toggle-lock')">
      <el-icon v-if="isLocked"><Lock /></el-icon>
      <el-icon v-else><Unlock /></el-icon>
      <span v-if="!isCollapse" class="lock-text">{{ isLocked ? '固定侧边栏' : '自动隐藏' }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Lock, Unlock, House, Headset, Collection, User } from '@element-plus/icons-vue'

const props = defineProps({
  isCollapse: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: true
  }
})

defineEmits(['toggle-lock'])

const route = useRoute()

const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})
</script>

<style scoped>
.sidebar-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.scrollbar-wrapper {
  height: 100%;
  flex: 1;
}

/* 隐藏横向滚动条 */
:deep(.el-scrollbar__wrap) {
  overflow-x: hidden !important;
}

.el-menu {
  border: none;
  height: 100%;
  width: 100% !important;
}

.lock-toggle {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s;
  flex-shrink: 0;
}

.lock-toggle:hover {
  background-color: rgba(255, 255, 255, 0.5);
  color: var(--primary-color);
}

.lock-text {
  margin-left: 8px;
  font-size: 12px;
  white-space: nowrap;
}

@media screen and (max-width: 768px) {
  .lock-toggle {
    display: none;
  }
}
</style>
