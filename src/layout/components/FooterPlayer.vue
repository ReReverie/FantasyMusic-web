<template>
  <div class="footer-player glass-effect" v-if="playerStore.currentMusic">
    <div class="player-content">
      <!-- 封面 & 信息 -->
      <div class="music-meta">
        <el-image 
          class="music-cover"
          :class="{ 'playing': playerStore.isPlaying }"
          :src="getCoverUrl(playerStore.currentMusic)" 
          fit="cover"
        >
          <template #error>
            <div class="cover-placeholder">
              <el-icon><Headset /></el-icon>
            </div>
          </template>
        </el-image>
        <div class="music-info">
          <div class="title" :title="playerStore.currentMusic.title">{{ playerStore.currentMusic.title || '未知标题' }}</div>
          <div class="artist" :title="playerStore.currentMusic.artist">{{ playerStore.currentMusic.artist || '未知歌手' }}</div>
        </div>
      </div>
      
      <!-- 控制器 -->
      <div class="controls">
        <audio 
            ref="audioRef"
            :src="playerStore.audioUrl" 
            controls 
            autoplay
            controlsList="nodownload"
            @play="onPlay"
            @pause="onPause"
            @loadedmetadata="onLoadedMetadata"
            class="custom-audio"
          ></audio>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { usePlayerStore } from '@/store/player'
import { Headset } from '@element-plus/icons-vue'
import { getCoverUrl } from '@/utils/music-utils'

const playerStore = usePlayerStore()
const audioRef = ref(null)

// 设置默认音量为 50%
const onLoadedMetadata = (e) => {
  // 仅在首次加载时设置，避免切歌时重置用户调节的音量（如果 audio 元素复用）
  // 但由于组件可能被销毁重建，或者 audio 标签内部机制，这里简单处理：
  // 如果是组件首次挂载，audioRef.value.volume 默认为 1。
  // 我们可以在 onMounted 中设置，但 onLoadedMetadata 更保险能获取到元素属性
  if (e.target.volume === 1) { // 只有当音量是默认最大值时才调整，避免覆盖用户设置
    e.target.volume = 0.5
  }
}

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
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  min-width: 600px;
  max-width: 90vw;
  height: 80px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 40px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  transition: all 0.3s ease;
}

.player-content {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 24px;
}

.music-meta {
  display: flex;
  align-items: center;
  width: 260px;
  gap: 16px;
  flex-shrink: 0;
}

.music-cover {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  flex-shrink: 0;
  border: 2px solid #fff;
  background: #fff;
  animation: rotate 20s linear infinite;
  animation-play-state: paused;
}

.music-cover.playing {
  animation-play-state: running;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 20px;
}

.music-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  gap: 2px;
}

.music-info .title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.music-info .artist {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.controls {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  min-width: 300px;
}

.custom-audio {
  width: 100%;
  height: 36px;
  outline: none;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.05));
  border-radius: 18px;
}

/* 适配暗黑模式 */
@media (prefers-color-scheme: dark) {
  .footer-player {
    background: rgba(30, 30, 30, 0.85);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }
  
  .music-cover {
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .music-info .title {
    color: #E5EAF3;
  }
  
  .music-info .artist {
    color: #A3A6AD;
  }
  
  .custom-audio {
    filter: invert(0.9) hue-rotate(180deg);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .footer-player {
    min-width: auto;
    width: 90vw;
    padding: 0 16px;
    bottom: 16px;
  }
  
  .music-meta {
    width: auto;
    flex: 1;
    min-width: 0;
  }
  
  .controls {
    display: none; /* 移动端暂时隐藏或简化控制器 */
  }
}
</style>
