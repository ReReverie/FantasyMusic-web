<template>
  <div class="playlist-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的歌单</span>
          <el-button type="primary">创建歌单</el-button>
        </div>
      </template>
      <div v-if="playlists.length === 0">暂无歌单。</div>
      <div v-else>
        <!-- Playlist items -->
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const playlists = ref([])
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
