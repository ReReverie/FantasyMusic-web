<template>
  <div class="home-container">
    <!-- 背景装饰 -->
    <div class="background-blobs">
      <div class="blob blob-1"></div>
      <div class="blob blob-2"></div>
      <div class="blob blob-3"></div>
    </div>

    <!-- 欢迎标语 -->
    <div class="welcome-header">
      <h1 class="gradient-text">探索你的音乐宇宙</h1>
      <p class="subtitle">沉浸在无尽的旋律中</p>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-grid">
      <div class="stat-card glass-panel from-blue">
        <div class="stat-icon-wrapper">
          <el-icon><Headset /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ musicCount }}</div>
          <div class="stat-label">歌曲总数</div>
        </div>
      </div>
      <div class="stat-card glass-panel from-purple">
        <div class="stat-icon-wrapper">
          <el-icon><Collection /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ playlistCount }}</div>
          <div class="stat-label">我的歌单</div>
        </div>
      </div>
      <div class="stat-card glass-panel from-pink">
        <div class="stat-icon-wrapper">
          <el-icon><Star /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ collectedMusicCount }}</div>
          <div class="stat-label">收藏歌曲</div>
        </div>
      </div>
      <div class="stat-card glass-panel from-green">
        <div class="stat-icon-wrapper">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ userStore.userLevelValue || '普通用户' }}</div>
          <div class="stat-label">用户等级</div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content-grid">
      <!-- 左侧：我的歌单 -->
      <section class="section-block glass-panel">
        <div class="section-header">
          <div class="header-left">
            <el-icon class="header-icon"><Collection /></el-icon>
            <h2>我的歌单</h2>
          </div>
          <button class="text-btn" @click="$router.push('/musiclist')">更多 <el-icon><ArrowRight /></el-icon></button>
        </div>

        <div class="playlist-grid" v-if="playlists.length > 0">
          <div class="playlist-card" v-for="list in playlists" :key="list.id" @click="$router.push(`/musiclist/${list.id}`)">
            <div class="playlist-cover">
              <el-image :src="getPlaylistCover(list)" fit="cover" lazy>
                <template #error>
                  <div class="image-slot">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div class="play-overlay">
                <el-icon><VideoPlay /></el-icon>
              </div>
            </div>
            <div class="playlist-info">
              <div class="playlist-title">{{ list.title }}</div>
              <div class="playlist-meta">{{ list.musics ? list.musics.length : (list.trackCount || 0) }} 首歌曲</div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无歌单" :image-size="100" />
      </section>
      
      <!-- 右侧：最新音乐 -->
      <section class="section-block glass-panel">
        <div class="section-header">
          <div class="header-left">
            <el-icon class="header-icon"><Headset /></el-icon>
            <h2>最新上架</h2>
          </div>
          <button class="text-btn" @click="$router.push('/music')">音乐库 <el-icon><ArrowRight /></el-icon></button>
        </div>

        <div class="song-list-container" v-if="latestMusic.length > 0">
          <div class="song-row" v-for="(song, index) in latestMusic" :key="song.id" @click="playMusic(song)">
            <div class="song-left">
              <span class="rank-num" :class="{ 'top-3': index < 3 }">{{ String(index + 1).padStart(2, '0') }}</span>
              <div class="song-cover-mini">
                 <el-image 
                   v-if="song.coverUrl || song.id"
                   :src="getCoverUrl(song)" 
                   style="width: 100%; height: 100%; border-radius: 4px;" 
                   fit="cover"
                 >
                   <template #error>
                     <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f7fa; color: #909399;">
                       <el-icon><Headset /></el-icon>
                     </div>
                   </template>
                 </el-image>
                 <el-icon v-else><Headset /></el-icon>
              </div>
              <div class="song-details">
                <div class="song-name">{{ song.title }}</div>
                <div class="song-author">{{ song.artist }}</div>
              </div>
            </div>
            <div class="song-right">
              <button class="play-btn-mini">
                <el-icon><CaretRight /></el-icon>
              </button>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无新歌" :image-size="80" />
      </section>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<script setup>
import { ref, onMounted, onActivated } from 'vue'
import { useUserStore } from '@/store/user'
import { getHomeData } from '@/api/home'
import { usePlayerStore } from '@/store/player'
import { getCoverUrl, getPlaylistCover } from '@/utils/music-utils'

const userStore = useUserStore()
const playerStore = usePlayerStore()

const musicCount = ref(0)
const playlistCount = ref(0)
const collectedMusicCount = ref(0)
const playlists = ref([])
const latestMusic = ref([])

onMounted(async () => {
  await fetchData()
})

onActivated(async () => {
  await fetchData()
})

const fetchData = async () => {
  try {
    const data = await getHomeData()
    musicCount.value = data.musicCount
    playlistCount.value = data.playlistCount
    collectedMusicCount.value = data.collectedMusicCount
    playlists.value = data.recommendPlaylists
    latestMusic.value = data.latestMusic
  } catch (error) {
    console.error('Fetch home data failed', error)
  }
}

const playMusic = (song) => {
  playerStore.playMusic(song)
}
</script>

<style scoped lang="scss">
/* 变量定义 */
$glass-bg: rgba(255, 255, 255, 0.7);
$glass-border: rgba(255, 255, 255, 0.5);
$shadow-soft: 0 8px 32px 0 rgba(31, 38, 135, 0.1);
$primary-color: #667eea;

.home-container {
  padding: 24px 40px;
  min-height: 100%;
  position: relative;
  overflow: hidden;
  font-family: 'PingFang SC', 'Helvetica Neue', Helvetica, 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
  border-radius: 16px;
  background-color: transparent;
  /* box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); Removed to be cleaner */
}

@media screen and (max-width: 768px) {
  .home-container {
    padding: 16px; /* Reduce padding on mobile to prevent clipping */
    overflow: visible; /* Allow content to flow */
  }
}

/* 动态背景球 */
.background-blobs {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  
  .blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.6;
    animation: float 10s infinite ease-in-out;
  }
  
  .blob-1 {
    top: -10%;
    left: -10%;
    width: 500px;
    height: 500px;
    background: #a1c4fd;
    animation-delay: 0s;
  }
  
  .blob-2 {
    bottom: -10%;
    right: -5%;
    width: 400px;
    height: 400px;
    background: #fbc2eb;
    animation-delay: -2s;
  }
  
  .blob-3 {
    top: 40%;
    left: 40%;
    width: 300px;
    height: 300px;
    background: #8fd3f4;
    opacity: 0.4;
    animation-delay: -5s;
  }
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(30px, 50px); }
}

/* 欢迎头 */
.welcome-header {
  position: relative;
  z-index: 1;
  margin-bottom: 30px;
  text-align: left;
  
  .gradient-text {
    font-size: 32px;
    font-weight: 800;
    margin: 0;
    background: var(--text-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
  }
  
  .subtitle {
    margin: 8px 0 0;
    color: var(--text-secondary);
    font-size: 16px;
    opacity: 0.8;
  }
}

/* 玻璃拟态面板通用 */
.glass-panel {
  /* Inherits from global .glass-panel */
  border-radius: 20px; /* Local override */
}

/* 统计卡片网格 */
.stats-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 40px;
  
  .stat-card {
    padding: 24px;
    display: flex;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: default;
    overflow: hidden;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 4px; height: 100%;
      background: currentColor;
      opacity: 0.5;
    }
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 30px rgba(0,0,0,0.1);
    }
    
    &.from-blue { color: #4facfe; }
    &.from-purple { color: #a18cd1; }
    &.from-pink { color: #ff9a9e; }
    &.from-green { color: #43e97b; }
    
    .stat-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: var(--table-header-bg);
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 28px;
      margin-right: 16px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    
    .stat-info {
      .stat-value {
        font-size: 28px;
        font-weight: 800;
        line-height: 1.2;
        color: var(--text-main);
      }
      .stat-label {
        font-size: 13px;
        color: var(--text-secondary);
        margin-top: 4px;
      }
    }
  }
}

/* 主内容网格 */
.main-content-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 2fr 1fr; /* 左2右1 */
  gap: 24px;
  align-items: start;
}

.section-block {
  padding: 24px;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .header-icon {
        font-size: 24px;
        color: $primary-color;
      }
      
      h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: var(--text-main);
      }
    }
    
    .text-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
      transition: color 0.2s;
      
      &:hover {
        color: $primary-color;
      }
    }
  }
}

/* 推荐歌单网格 */
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  
  .playlist-card {
    cursor: pointer;
    group: hover;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    .playlist-cover {
      position: relative;
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 1;
      box-shadow: 0 8px 16px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
      
      .el-image {
        width: 100%;
        height: 100%;
        transition: transform 0.5s ease;
      }
      
      .image-slot {
        width: 100%;
        height: 100%;
        background: var(--table-header-bg);
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--text-placeholder);
        font-size: 32px;
      }
      
      .play-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s;
        
        .el-icon {
          font-size: 48px;
          color: #fff;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
          transform: scale(0.8);
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
      }
    }
    
    &:hover {
      transform: translateY(-8px);

      .playlist-cover {
        box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        
        .el-image {
          transform: scale(1.1);
        }
        
        .play-overlay {
          opacity: 1;
          .el-icon { transform: scale(1); }
        }
      }
      
      .playlist-title { color: var(--primary-color); }
    }
    
    .playlist-info {
      margin-top: 12px;
      
      .playlist-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-main);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: color 0.2s;
      }
      
      .playlist-meta {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
  }
}

/* 最新音乐列表 */
.song-list-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  .song-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-radius: 12px;
    background: var(--card-bg);
    transition: all 0.2s;
    cursor: pointer;
    
    &:hover {
      background: var(--table-hover-bg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      
      .song-left .song-cover-mini {
         background: $primary-color;
         color: #fff;
      }
      
      .play-btn-mini {
        opacity: 1;
        transform: scale(1);
      }
    }
    
    .song-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      overflow: hidden;
      
      .rank-num {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-placeholder);
        width: 24px;
        
        &.top-3 { color: #ff9a9e; }
      }
      
      .song-cover-mini {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: var(--table-header-bg);
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--text-placeholder);
        transition: all 0.2s;
      }
      
      .song-details {
        flex: 1;
        overflow: hidden;
        
        .song-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .song-author {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
    }
    
    .song-right {
      .play-btn-mini {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: none;
        background: $primary-color;
        color: #fff;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
    }
  }
}
</style>
