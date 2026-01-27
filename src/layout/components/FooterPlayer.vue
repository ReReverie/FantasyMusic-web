<template>
  <div class="footer-player" v-if="playerStore.currentMusic">
    <div class="player-content">
      <!-- 歌曲信息 -->
      <div class="music-info">
        <div class="title">{{ playerStore.currentMusic.title || '未知标题' }}</div>
        <div class="artist">{{ playerStore.currentMusic.artist || '未知歌手' }}</div>
      </div>
      
      <!-- 控制器 -->
      <div class="controls">
        <audio 
          ref="audioRef"
          :src="playerStore.audioUrl" 
          controls 
          autoplay
          @play="onPlay"
          @pause="onPause"
          style="width: 100%; height: 40px;"
        ></audio>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { usePlayerStore } from '@/store/player'

const playerStore = usePlayerStore()
const audioRef = ref(null)

const onPlay = () => {
  playerStore.isPlaying = true
}

const onPause = () => {
  playerStore.isPlaying = false
}

// 监听播放状态变化，手动控制 audio 元素（如果需要更复杂的自定义控制栏，这里会很有用）
watch(() => playerStore.isPlaying, (newVal) => {
  if (audioRef.value) {
    if (newVal) {
      audioRef.value.play().catch(e => console.error("Play failed", e))
    } else {
      audioRef.value.pause()
    }
  }
})
</script>

<style scoped>
.footer-player {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: #ffffff;
  border-top: 1px solid #e0e0e0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
}

.player-content {
  width: 100%;
  max-width: 1200px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.music-info {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.music-info .title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-info .artist {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.controls {
  flex: 1;
}

/* 适配 Element Plus 暗色模式或自定义样式（可选） */
</style>
