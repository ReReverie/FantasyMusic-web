<template>
  <div class="footer-player-wrapper">
    <!-- 移动端呼出按钮 (Moved outside the hidden player container) -->
    <div 
      class="mobile-toggle-btn glass-effect" 
      v-if="isMobile && mobileHidden && hasMusic"
      @click.stop="showMobilePlayer"
    >
      <div class="cd-wrapper" :class="{ 'is-spinning': playerStore.isPlaying }">
        <el-image 
          class="cd-cover"
          :src="getCoverUrl(playerStore.currentMusic)" 
          fit="cover"
        >
          <template #error>
             <div class="cd-placeholder">
               <el-icon><Headset /></el-icon>
             </div>
          </template>
        </el-image>
      </div>
    </div>

    <div 
      class="footer-player glass-effect" 
      ref="footerPlayerRef"
      :class="{ 
        'is-hidden': !isMobile && !isLocked && pcAutoHidden,
        'mobile-hidden': isMobile && mobileHidden
      }"
      v-if="hasMusic"
      @mouseenter="handlePCMouseEnter"
      @mouseleave="handlePCMouseLeave"
      @touchstart="handleMobileInteraction"
      @click="handleMobileInteraction"
    >
      <!-- 锁定按钮 -->
      <div class="lock-toggle" @click="isLocked = !isLocked" :title="isLocked ? '点击解锁自动隐藏' : '点击锁定播放器'">
      <el-icon v-if="isLocked"><Lock /></el-icon>
      <el-icon v-else><Unlock /></el-icon>
    </div>

    <div class="player-content">
      <!-- 1. 封面 & 信息 -->
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
          <div class="title" :title="playerStore.currentMusic?.title">{{ playerStore.currentMusic?.title || '未播放' }}</div>
          <div class="artist" :title="playerStore.currentMusic?.artist">{{ playerStore.currentMusic?.artist || '---' }}</div>
        </div>
      </div>
      
      <!-- 2. 播放控制器 (居中) -->
      <div class="player-controls-container">
        <div class="controls-buttons">
          <el-tooltip content="上一首" placement="top" :show-after="500" :disabled="isMobile">
            <el-button link class="control-btn" @click="playerStore.playPrev">
              <el-icon :size="22"><ArrowLeft /></el-icon>
            </el-button>
          </el-tooltip>

          <el-tooltip :content="playerStore.isPlaying ? '暂停' : '播放'" placement="top" :show-after="500" :disabled="isMobile">
            <el-button link class="control-btn play-btn" @click="playerStore.togglePlay">
              <el-icon :size="34">
                <VideoPause v-if="playerStore.isPlaying" />
                <VideoPlay v-else />
              </el-icon>
            </el-button>
          </el-tooltip>

          <el-tooltip content="下一首" placement="top" :show-after="500" :disabled="isMobile">
            <el-button link class="control-btn" @click="playerStore.playNext()">
              <el-icon :size="22"><ArrowRight /></el-icon>
            </el-button>
          </el-tooltip>
        </div>

        <!-- 进度条 -->
        <div class="progress-bar">
          <span class="time-text">{{ formatTime(currentTime) }}</span>
          <el-slider 
            v-model="currentTime" 
            :max="duration" 
            :show-tooltip="false"
            @change="onSliderChange"
            @input="isDragging = true"
            class="custom-slider"
          />
          <span class="time-text">{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- 3. 右侧控制 (音量, 模式, 列表) -->
      <div class="right-controls">
        <!-- 播放模式 -->
        <el-tooltip :content="modeText" placement="top" :show-after="500" :disabled="isMobile">
            <el-button link class="control-btn" @click="playerStore.togglePlayMode">
                <el-icon :size="20">
                    <Sort v-if="playerStore.playMode === 'sequence'" /> <!-- 顺序 -->
                    <Refresh v-else-if="playerStore.playMode === 'loop'" /> <!-- 列表循环 -->
                    <RefreshRight v-else-if="playerStore.playMode === 'single'" /> <!-- 单曲循环 -->
                    <Operation v-else-if="playerStore.playMode === 'random'" /> <!-- 随机 -->
                </el-icon>
            </el-button>
        </el-tooltip>

        <!-- 音量 -->
        <div class="volume-control" v-if="!isMobile">
            <el-icon :size="20">
                <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="200" height="200"><path fill="currentColor" d="M495.2 163.6c-9.6-9-24.8-8.4-33.8 1.2L271 368H136c-17.7 0-32 14.3-32 32v224c0 17.7 14.3 32 32 32h135l190.4 203.2c9 9.6 24.2 10.2 33.8 1.2 5.2-4.8 8-11.4 8-18.2V182c0-6.8-2.8-13.4-8-18.4zM808 512c0-68.2-34.8-129-88-164.6-11.4-7.6-26.6-4.6-34.2 6.8-7.6 11.4-4.6 26.6 6.8 34.2 38.6 25.8 63.4 69.8 63.4 123.6s-24.8 97.8-63.4 123.6c-11.4 7.6-14.4 22.8-6.8 34.2 5 7.6 13.4 11.4 21.8 11.4 5.2 0 10.4-1.6 14.8-4.6 53.2-35.6 88-96.4 88-164.6z"></path><path fill="currentColor" d="M856 254.8c-11.4-7.6-26.8-4.4-34.4 7-7.6 11.4-4.4 26.8 7 34.4C887 335.2 928 419.4 928 512s-41 176.8-99.4 215.8c-11.4 7.6-14.6 23-7 34.4 5.2 7.8 13.6 11.8 22.2 11.8 5 0 10-1.4 14.6-4.4C932.2 717 984 619.4 984 512s-51.8-205-128-257.2z"></path></svg>
            </el-icon>
            <el-slider v-model="playerStore.volume" class="volume-slider" :show-tooltip="false" />
        </div>

        <!-- 播放列表按钮 -->
        <el-tooltip content="播放列表" placement="top" :show-after="500" :disabled="isMobile">
            <el-button ref="playlistBtnRef" link class="control-btn" @click="togglePlaylist">
                <el-icon :size="20"><List /></el-icon>
            </el-button>
        </el-tooltip>
      </div>
      
      <!-- 隐藏的 Audio 元素 -->
      <audio 
          ref="audioRef"
          :src="playerStore.audioUrl" 
          preload="auto"
          autoplay
          @play="onPlay"
          @pause="onPause"
          @ended="onEnded"
          @timeupdate="onTimeUpdate"
          @loadedmetadata="onLoadedMetadata"
          @canplay="onCanPlay"
          @error="onError"
        ></audio>
      </div>

      <!-- 播放列表弹窗 (简单实现) -->
      <transition name="el-zoom-in-bottom">
        <div class="playlist-drawer glass-effect" v-show="playerStore.showPlaylist" ref="playlistDrawerRef">
            <div class="playlist-header">
                <span>播放列表 ({{ playerStore.playlist.length }})</span>
                <el-button link @click="playerStore.playlist = []" size="small">清空</el-button>
            </div>
            <el-scrollbar max-height="300px">
                <ul class="playlist-ul">
                    <li 
                        v-for="item in playerStore.playlist"
                        :key="item.id"
                        class="playlist-item"
                        :class="{ 'active': playerStore.currentMusic?.id === item.id }"
                        @click="playItem(item)"
                    >
                        <div class="song-info">
                            <span class="song-title">{{ item.title }}</span>
                            <span class="song-artist">- {{ item.artist }}</span>
                        </div>
                        <el-icon v-if="playerStore.currentMusic?.id === item.id" class="playing-icon"><VideoPlay /></el-icon>
                    </li>
                </ul>
                <div v-if="playerStore.playlist.length === 0" class="empty-tip">
                    暂无歌曲
                </div>
            </el-scrollbar>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { usePlayerStore } from '@/store/player'
import { 
    Headset, VideoPlay, VideoPause, ArrowLeft, ArrowRight, 
    Refresh, RefreshRight, Sort, Operation, List, Lock, Unlock
} from '@element-plus/icons-vue'
import { getCoverUrl } from '@/utils/music-utils'
import { ElMessage } from 'element-plus'

const playerStore = usePlayerStore()
const audioRef = ref(null)
const playlistDrawerRef = ref(null)
const playlistBtnRef = ref(null)
const footerPlayerRef = ref(null)

const hasMusic = computed(() => playerStore.currentMusic || playerStore.playlist.length > 0)

const isLocked = ref(true)
const isHover = ref(false)

// PC Auto-hide Logic
const pcAutoHidden = ref(false)
let pcHideTimer = null

const startPCHideTimer = () => {
  if (pcHideTimer) clearTimeout(pcHideTimer)
  pcHideTimer = setTimeout(() => {
    pcAutoHidden.value = true
  }, 3000)
}

const cancelPCHideTimer = () => {
  if (pcHideTimer) clearTimeout(pcHideTimer)
}

const handlePCMouseEnter = () => {
  isHover.value = true
  pcAutoHidden.value = false
  cancelPCHideTimer()
}

const handlePCMouseLeave = () => {
  isHover.value = false
  startPCHideTimer()
}

// Mobile Auto-hide Logic
const isMobile = ref(false)
const mobileHidden = ref(false)
let mobileHideTimer = null

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (!isMobile.value) {
    mobileHidden.value = false // Reset if switched to desktop
  } else {
    // If switching to mobile, hide by default immediately
    mobileHidden.value = true
  }
}

const resetMobileHideTimer = () => {
  if (!isMobile.value) return
  
  if (mobileHideTimer) clearTimeout(mobileHideTimer)
  mobileHideTimer = setTimeout(() => {
    mobileHidden.value = true
  }, 3000)
}

const handleMobileInteraction = () => {
  if (!isMobile.value) return
  // mobileHidden.value = false // Already shown if we are interacting with it
  resetMobileHideTimer()
}

const showMobilePlayer = () => {
  mobileHidden.value = false
  resetMobileHideTimer()
}



onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('click', handleClickOutside)

  // Initialize timer on mount if mobile
  if (isMobile.value) {
    resetMobileHideTimer()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('click', handleClickOutside)
  if (mobileHideTimer) clearTimeout(mobileHideTimer)
})

const currentTime = ref(0)
const duration = ref(0)
const isDragging = ref(false)

const handleClickOutside = (event) => {
    // Playlist logic
    if (playerStore.showPlaylist) {
        // Check if click is inside the drawer
        const isInsideDrawer = playlistDrawerRef.value && playlistDrawerRef.value.contains(event.target)
        
        // Check if click is on the toggle button (or its children)
        let isButton = false
        if (playlistBtnRef.value) {
            const btnEl = playlistBtnRef.value.$el || playlistBtnRef.value
            isButton = btnEl.contains(event.target)
        }

        if (!isInsideDrawer && !isButton) {
            playerStore.showPlaylist = false
        }
    }

    // Mobile player logic: Hide if clicking outside the player while it's shown
    if (isMobile.value && !mobileHidden.value) {
        // Check if click is inside footer player
        // Use composedPath to handle detached elements (e.g. v-if toggled icons)
        const path = event.composedPath ? event.composedPath() : []
        const isInsidePlayer = path.includes(footerPlayerRef.value) || (footerPlayerRef.value && footerPlayerRef.value.contains(event.target))
        
        if (!isInsidePlayer) {
            mobileHidden.value = true
        }
    }

    // PC player logic: Hide if clicking outside the player while it's shown (and not locked)
    if (!isMobile.value && !isLocked.value && !pcAutoHidden.value) {
        // Use composedPath to handle detached elements (e.g. v-if toggled icons)
        const path = event.composedPath ? event.composedPath() : []
        const isInsidePlayer = path.includes(footerPlayerRef.value) || (footerPlayerRef.value && footerPlayerRef.value.contains(event.target))
        
        if (!isInsidePlayer) {
            pcAutoHidden.value = true
        }
    }
}

const modeText = computed(() => {
    const map = {
        'sequence': '顺序播放',
        'loop': '列表循环',
        'single': '单曲循环',
        'random': '随机播放'
    }
    return map[playerStore.playMode] || '顺序播放'
})

const formatTime = (seconds) => {
    if (!seconds) return '00:00'
    const min = Math.floor(seconds / 60)
    const sec = Math.floor(seconds % 60)
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

const onCanPlay = () => {
    // 确保在音频就绪时，如果状态是播放中，则尝试播放
    // 这有助于处理 autoplay 属性可能未触发或被浏览器策略阻止的情况
    if (playerStore.isPlaying) {
        attemptPlay()
    }
}

const attemptPlay = () => {
    if (audioRef.value) {
        const playPromise = audioRef.value.play()
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Playback prevented:", error)
                // 如果是用户交互不允许，则更新状态为暂停
                if (error.name === 'NotAllowedError') {
                     playerStore.isPlaying = false
                }
            })
        }
    }
}

const onPlay = () => {
  if (!playerStore.isPlaying) {
      playerStore.isPlaying = true
  }
}

const onPause = () => {
  if (playerStore.isPlaying) {
      playerStore.isPlaying = false
  }
}

const onEnded = () => {
    if (playerStore.playMode === 'single') {
        if (audioRef.value) {
            audioRef.value.currentTime = 0
            attemptPlay()
        }
    } else {
        playerStore.playNext(true)
    }
}

const onTimeUpdate = (e) => {
    if (!isDragging.value) {
        currentTime.value = e.target.currentTime
        saveProgress(e.target.currentTime)
    }
}

let lastSaveTime = 0
const saveProgress = (time) => {
    const now = Date.now()
    if (now - lastSaveTime < 1000) return // Limit to once per second
    lastSaveTime = now

    if (!playerStore.currentMusic) return
    const data = {
        id: playerStore.currentMusic.id,
        time: time
    }
    localStorage.setItem('player-progress', JSON.stringify(data))
}

const onLoadedMetadata = (e) => {
    duration.value = e.target.duration
    // 应用音量
    e.target.volume = playerStore.volume / 100
    
    // 恢复播放进度 (仅在初始化或非切歌时？)
    // 注意：如果是切歌，currentTime 应该为 0。
    // 我们怎么区分是"恢复页面"还是"切歌"？
    // 切歌时，audioUrl 变了，watch audioUrl 重置了 currentTime = 0
    // 但是 onLoadedMetadata 会在加载后触发。
    // 如果 currentTime 已经被 watch 重置为 0，这里恢复进度可能会覆盖它？
    // 不，watch audioUrl 是立即执行的。onLoadedMetadata 是异步的。
    // 所以切歌时：watch -> currentTime=0. loadedmetadata -> restore -> currentTime=saved.
    // 这就是问题！切歌不应该恢复上一首的进度（或者当前这首之前的进度）。
    // 但是 saveProgress 保存的是 currentMusic.id 的进度。
    // 如果切歌，currentMusic.id 变了。localStorage 里的 id 还是旧的？
    // 不，playerStore.currentMusic 已经更新了。
    // 如果 localStorage 里存的是旧歌进度，ID 不匹配，不会恢复。
    // 如果 localStorage 里存的是新歌进度（之前听过），恢复是合理的。
    // 但是通常用户点击切歌，期望从头播放。
    // 只有"刷新页面"期望恢复进度。
    
    // 改进：只在组件挂载后的第一次加载恢复进度？或者判断是否是自动播放？
    // 简单判断：如果 playerStore.isPlaying 为 true (正在播放/切歌)，通常不恢复进度（除非是暂停后恢复）。
    // 但 initFromStorage 不会自动播放。
    // 所以：如果 isPlaying 为 false，且匹配 ID，则恢复。
    // 如果 isPlaying 为 true，说明是用户切歌或自动切歌，应该从头听（除非之前暂停了？）。
    // 实际上，如果用户点击一首听了一半的歌，通常也期望从头听，或者继续？
    // 大多数播放器：点击列表 -> 从头。刷新 -> 恢复。
    
    // 我们的逻辑：
    const saved = localStorage.getItem('player-progress')
    if (saved && !playerStore.isPlaying) { // 只有在暂停状态（如刚加载页面）才恢复进度
        try {
            const { id, time } = JSON.parse(saved)
            if (playerStore.currentMusic?.id === id && time > 0 && time < e.target.duration) {
                e.target.currentTime = time
                currentTime.value = time // Update UI
            }
        } catch (err) {
            console.error('Failed to restore progress', err)
        }
    }
}

const onError = (e) => {
    console.error('Audio playback error', e)
    playerStore.isPlaying = false
}

const onSliderChange = (val) => {
    if (audioRef.value) {
        audioRef.value.currentTime = val
    }
    isDragging.value = false
}

const togglePlaylist = () => {
    playerStore.showPlaylist = !playerStore.showPlaylist
}

// 监听歌曲变化，自动弹出
watch(() => playerStore.currentMusic, (newVal) => {
    if (newVal) {
        if (!isLocked.value) {
            pcAutoHidden.value = false
            startPCHideTimer()
        }
    }
})

const playItem = (item) => {
    playerStore.playMusic(item)
}

// 监听播放状态
watch(() => playerStore.isPlaying, (newVal) => {
  if (newVal) {
    if (isMobile.value) {
      mobileHidden.value = false
      resetMobileHideTimer()
    } else if (!isLocked.value) {
        pcAutoHidden.value = false
        if (!isHover.value) {
            startPCHideTimer()
        }
    }
  }

  if (audioRef.value) {
    if (newVal) {
      attemptPlay()
    } else {
      audioRef.value.pause()
    }
  }
})

// 监听音量
watch(() => playerStore.volume, (newVal) => {
    if (audioRef.value) {
        audioRef.value.volume = newVal / 100
    }
})

// 监听 URL 变化 (切歌)
watch(() => playerStore.audioUrl, () => {
    currentTime.value = 0
    // 如果 audioUrl 变化，且 isPlaying 为 true (由 store 控制)，
    // autoplay 属性会尝试播放。
    // 如果 autoplay 没触发 (e.g. 浏览器限制)，onCanPlay 会补救 (attemptPlay)。
    // 这里不需要额外调用 play()，避免冲突。
    if (audioRef.value) {
        audioRef.value.load() // 确保重新加载
    }
})

onMounted(() => {
    playerStore.initFromStorage()
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.footer-player {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: auto;
  min-width: 800px;
  max-width: 90vw;
  height: 80px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 32px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.footer-player.is-hidden {
  transform: translate(-50%, 120%);
  opacity: 0.8;
}

/* 留一个小把手或顶部区域供鼠标悬停唤出 */
.footer-player.is-hidden::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 0;
  width: 100%;
  height: 20px;
  background: transparent;
}

.lock-toggle {
  position: absolute;
  top: 8px;
  right: 8px;
  cursor: pointer;
  color: #606266;
  opacity: 0.6;
  transition: all 0.3s;
  z-index: 10;
  padding: 4px;
}

.lock-toggle:hover {
  opacity: 1;
  color: var(--primary-color);
}

.player-content {
  width: 100%;
  max-width: 1200px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.music-meta {
  display: flex;
  align-items: center;
  width: 250px;
  gap: 12px;
}

.music-cover {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #eee;
  flex-shrink: 0;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(128, 128, 128, 0.1);
  color: #909399;
}

.music-info {
  flex: 1;
  overflow: hidden;
}

.music-info .title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.music-info .artist {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 中间控制器 */
.player-controls-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 600px;
}

.controls-buttons {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 2px;
    margin-top: 6px;
}

.control-btn {
    font-size: 0; /* fix icon alignment */
    color: var(--text-main);
    padding: 0;
}
.control-btn:hover {
    color: var(--primary-color);
}

.play-btn {
    color: var(--primary-color);
    transform: scale(1);
    transition: transform 0.2s;
}
.play-btn:active {
    transform: scale(0.9);
}

.progress-bar {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
}

.time-text {
    font-size: 12px;
    color: #909399;
    width: 40px;
    text-align: center;
}

.custom-slider {
    flex: 1;
}

/* 右侧控制 */
.right-controls {
    width: 250px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 16px;
}

.volume-control {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100px;
}

.volume-slider {
    flex: 1;
}

/* 播放列表弹窗 */
.playlist-drawer {
    position: absolute;
    bottom: 92px;
    right: 0;
    width: 320px;
    background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--glass-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.playlist-header {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    background: rgba(245, 247, 250, 0.5);
}

.playlist-ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

.playlist-item {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: background 0.2s;
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.playlist-item:hover {
    background: rgba(0, 0, 0, 0.03);
}

.playlist-item.active {
    color: #409EFF;
    background: rgba(64, 158, 255, 0.1);
}

.song-info {
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 4px;
}

.song-title {
    font-size: 14px;
}

.song-artist {
    font-size: 12px;
    color: #909399;
}
.playlist-item.active .song-artist {
    color: #a0cfff;
}

.empty-tip {
    padding: 20px;
    text-align: center;
    color: #909399;
    font-size: 13px;
}

/* 适配暗黑模式 */
@media (prefers-color-scheme: dark) {
  .footer-player, .playlist-drawer {
    background: rgba(30, 30, 30, 0.75);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .music-info .title, .control-btn, .time-text {
    color: #E5EAF3;
  }
  
  .music-info .artist, .playlist-header, .playlist-item {
    color: #A3A6AD;
  }
  
  .playlist-header {
      background: rgba(255, 255, 255, 0.05);
      border-bottom-color: rgba(255, 255, 255, 0.05);
  }
  
  .playlist-item:hover {
      background: rgba(255, 255, 255, 0.05);
  }
  
  .playlist-item.active {
      background: rgba(64, 158, 255, 0.2);
      color: #409EFF;
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .footer-player {
    position: fixed;
    bottom: 0 !important;
    left: 0 !important;
    transform: none !important;
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    height: auto !important;
    min-height: 80px; /* Reduced from flexible height to ensure compactness */
    border-radius: 20px 20px 0 0 !important; /* Rounded top corners only */
    border-bottom: none !important;
    border-left: none !important;
    border-right: none !important;
    border-top: 2px solid var(--primary-color) !important; /* Add distinct top border */
    padding: 12px 16px !important;
    flex-wrap: wrap;
    background: #2D2D2D !important; /* Dark grey background */
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3) !important; /* Darker shadow */
    color: #ffffff; /* Default text color for mobile */
  }

  /* Adjust text colors for mobile dark mode */
  .music-info .title {
    color: #ffffff !important;
  }
  
  .music-info .artist {
    color: #bbbbbb !important;
  }
  
  .control-btn {
    color: #ffffff !important;
  }
  
  .control-btn:hover {
    color: var(--primary-color) !important;
  }
  
  .time-text {
    color: #dddddd !important;
  }

  /* Force visible on mobile */
  /* Replaced by .mobile-hidden logic below */
  /* .footer-player.is-hidden { ... } */

  .footer-player.mobile-hidden {
    transform: translateY(110%) !important;
    opacity: 0;
    pointer-events: none; /* Prevent clicks when hidden */
  }

  .mobile-toggle-btn {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px; /* Slightly larger for CD effect */
    height: 60px;
    border-radius: 50%;
    /* background: var(--primary-color); Remove solid background */
    background: transparent; 
    /* color: white; */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2001;
    /* box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); Remove default shadow */
    cursor: pointer;
    animation: bounce-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    pointer-events: auto;
  }

  /* CD Wrapper Style */
  .cd-wrapper {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    padding: 3px; /* Border width */
    background: linear-gradient(45deg, #8b5cf6, #ec4899); /* Gradient border */
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Inner CD Cover */
  .cd-cover {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #1a1a1a; /* Dark border between gradient and image */
    background: #000;
  }
  
  .cd-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #333;
    color: #fff;
    font-size: 24px;
  }

  /* Spinning Animation */
  .cd-wrapper.is-spinning {
    animation: spin 10s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes bounce-in {
    0% { transform: scale(0); opacity: 0; }
    60% { transform: scale(1.1); }
    100% { transform: scale(1); opacity: 1; }
  }

  .pulse-icon {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }

  .lock-toggle {
    display: none; /* Hide lock button on mobile */
  }

  .player-content {
    flex-direction: column;
    padding: 0;
    gap: 8px;
  }

  /* 1. Meta info at top */
  .music-meta {
    width: 100% !important;
    justify-content: flex-start;
  }

  /* 2. Controls in middle */
  .player-controls-container {
    width: 100% !important;
    order: 2;
    margin-bottom: 0;
  }
  
  .controls-buttons {
    margin-bottom: 4px; /* Tighten up */
  }

  /* 3. Right controls (playlist/volume) at bottom/right or integrated */
  .right-controls {
    width: 100% !important;
    order: 3;
    justify-content: flex-end !important;
    gap: 20px;
    margin-top: 4px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 8px;
  }
  
  .volume-control {
    width: 40% !important;
  }
  
  /* Adjust progress bar for mobile */
  .progress-bar {
    width: 100%;
    padding: 0 4px;
  }

  .playlist-drawer {
      bottom: 100%;
      right: 0;
      width: 100%;
      max-height: 50vh;
  }
}
</style>
