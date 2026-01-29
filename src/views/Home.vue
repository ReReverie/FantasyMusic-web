<template>
  <div class="home-container">
    <!-- 轮播图区域 -->
    <div class="banner-section">
      <el-carousel :interval="4000" type="card" height="200px">
        <el-carousel-item v-for="item in banners" :key="item">
          <div class="banner-item" :style="{ backgroundImage: `url(${item.url})` }">
            <h3 class="banner-title">{{ item.title }}</h3>
          </div>
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 统计卡片区域 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card blue-gradient">
          <div class="stat-icon"><el-icon><Headset /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ musicCount }}</div>
            <div class="stat-label">歌曲总数</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card purple-gradient">
          <div class="stat-icon"><el-icon><Collection /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ playlistCount }}</div>
            <div class="stat-label">我的歌单</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card orange-gradient">
          <div class="stat-icon"><el-icon><Star /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">--</div>
            <div class="stat-label">收藏歌曲</div>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card green-gradient">
          <div class="stat-icon"><el-icon><User /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ userStore.userLevelValue || 0 }}</div>
            <div class="stat-label">用户等级</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 推荐内容区域 -->
    <div class="content-section">
      <el-row :gutter="20">
        <!-- 左侧：推荐歌单 -->
        <el-col :span="16">
          <el-card class="box-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span><el-icon><CollectionTag /></el-icon> 推荐歌单</span>
                <el-button link type="primary" @click="$router.push('/musiclist')">更多</el-button>
              </div>
            </template>
            <div class="playlist-grid" v-if="playlists.length > 0">
              <div class="playlist-item" v-for="list in playlists" :key="list.id" @click="$router.push(`/musiclist/${list.id}`)">
                <div class="playlist-cover">
                  <el-image :src="list.cover || 'https://picsum.photos/200/200?random=' + list.id" fit="cover">
                    <template #error>
                      <div class="image-slot">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </template>
                  </el-image>
                  <div class="play-overlay"><el-icon><VideoPlay /></el-icon></div>
                </div>
                <div class="playlist-name">{{ list.title }}</div>
              </div>
            </div>
            <el-empty v-else description="暂无歌单" />
          </el-card>
        </el-col>
        
        <!-- 右侧：最新音乐 -->
        <el-col :span="8">
          <el-card class="box-card" shadow="never">
            <template #header>
              <div class="card-header">
                <span><el-icon><Headset /></el-icon> 最新添加</span>
                <el-button link type="primary" @click="$router.push('/music')">去音乐库</el-button>
              </div>
            </template>
            <div class="song-list" v-if="latestMusic.length > 0">
              <div class="song-item" v-for="(song, index) in latestMusic" :key="song.id">
                <span class="song-index" :class="{ 'top-three': index < 3 }">{{ index + 1 }}</span>
                <div class="song-info">
                  <div class="song-title">{{ song.title }}</div>
                  <div class="song-artist">{{ song.artist }}</div>
                </div>
                <el-button circle size="small" type="primary" plain @click="playMusic(song)">
                  <el-icon><VideoPlay /></el-icon>
                </el-button>
              </div>
            </div>
            <el-empty v-else description="暂无音乐" />
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { getHomeData } from '@/api/home'
import { usePlayerStore } from '@/store/player'

const userStore = useUserStore()
const playerStore = usePlayerStore()

const musicCount = ref(0)
const playlistCount = ref(0)
const playlists = ref([])
const latestMusic = ref([])
const banners = ref([])

onMounted(async () => {
  await fetchData()
})

const fetchData = async () => {
  try {
    const data = await getHomeData()
    musicCount.value = data.musicCount
    playlistCount.value = data.playlistCount
    playlists.value = data.recommendPlaylists
    latestMusic.value = data.latestMusic
    banners.value = data.banners
  } catch (error) {
    console.error('Fetch home data failed', error)
  }
}

const playMusic = (song) => {
  playerStore.playMusic(song)
}
</script>

<style scoped>
.home-container {
  padding: 20px;
}

/* Banner */
.banner-section {
  margin-bottom: 30px;
}
.banner-item {
  height: 100%;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  padding: 20px;
  position: relative;
}
.banner-item::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  border-radius: 0 0 8px 8px;
}
.banner-title {
  color: #fff;
  z-index: 1;
  margin: 0;
  font-size: 24px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

/* Stats Cards */
.stats-row {
  margin-bottom: 30px;
}
.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}
.stat-card:hover {
  transform: translateY(-5px);
}
.blue-gradient { background: linear-gradient(135deg, #36d1dc, #5b86e5); }
.purple-gradient { background: linear-gradient(135deg, #bdc3c7, #2c3e50); /* Fallback */ background: linear-gradient(135deg, #667eea, #764ba2); }
.orange-gradient { background: linear-gradient(135deg, #f093fb, #f5576c); }
.green-gradient { background: linear-gradient(135deg, #84fab0, #8fd3f4); }

.stat-icon {
  font-size: 40px;
  margin-right: 15px;
  opacity: 0.8;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
}
.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

/* Content Section */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.box-card {
  height: 100%;
  border: none;
  background: #fff;
  border-radius: 8px;
}

/* Playlist Grid */
.playlist-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}
.playlist-item {
  cursor: pointer;
  transition: transform 0.2s;
}
.playlist-item:hover {
  transform: translateY(-3px);
}
.playlist-cover {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  margin-bottom: 8px;
}
.playlist-cover .el-image {
  width: 100%;
  height: 100%;
}
.play-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: #fff;
  font-size: 32px;
}
.playlist-item:hover .play-overlay {
  opacity: 1;
}
.playlist-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Song List */
.song-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.song-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: 4px;
  transition: background 0.2s;
}
.song-item:hover {
  background: #f5f7fa;
}
.song-index {
  width: 24px;
  text-align: center;
  color: #999;
  font-size: 14px;
  margin-right: 10px;
}
.song-index.top-three {
  color: #f56c6c;
  font-weight: bold;
}
.song-info {
  flex: 1;
  overflow: hidden;
}
.song-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.song-artist {
  font-size: 12px;
  color: #999;
}
</style>
