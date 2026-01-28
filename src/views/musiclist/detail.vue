<template>
  <div class="musiclist-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button link @click="$router.back()">
              <el-icon><ArrowLeft /></el-icon> 返回
            </el-button>
            <span class="title">歌单详情</span>
          </div>
        </div>
      </template>
      
      <!-- 歌单信息 -->
      <div class="info-section" v-if="detail">
        <div class="cover">
          <el-image :src="detail.cover || 'https://placeholder.com/150'" fit="cover" class="cover-img">
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
        </div>
        <div class="info-content">
          <h2>{{ detail.title }}</h2>
          <div class="meta">
            <span>创建时间：{{ detail.createTime }}</span>
            <span class="track-count">歌曲数：{{ detail.musics ? detail.musics.length : 0 }}</span>
          </div>
          <p class="description">{{ detail.description || '暂无简介' }}</p>
          <div class="actions">
            <el-button type="primary" @click="handlePlayAll">
              <el-icon><VideoPlay /></el-icon> 播放全部
            </el-button>
          </div>
        </div>
      </div>

      <!-- 歌曲列表 -->
      <el-table :data="detail.musics || []" style="width: 100%; margin-top: 20px;" v-loading="loading">
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="title" label="歌曲标题" />
        <el-table-column prop="artist" label="歌手" />
        <el-table-column prop="album" label="专辑" />
        <el-table-column prop="durationMs" label="时长" width="100">
          <template #default="scope">
            {{ formatDuration(scope.row.durationMs) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handlePlay(scope.row)">播放</el-button>
            <el-button size="small" type="success" @click="handleDownload(scope.row)">下载</el-button>
            <el-popconfirm title="确定要从歌单移除这首歌吗？" @confirm="handleRemove(scope.row)">
              <template #reference>
                <el-button size="small" type="danger">移除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMusicListDetail, removeMusicFromMusicList } from '@/api/musiclist'
import { usePlayerStore } from '@/store/player'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Picture, VideoPlay } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const loading = ref(false)
const detail = ref({})

const fetchDetail = async () => {
  const id = route.params.id
  if (!id) return
  
  loading.value = true
  try {
    const res = await getMusicListDetail(id)
    detail.value = res
  } catch (error) {
    console.error(error)
    ElMessage.error('获取歌单详情失败')
  } finally {
    loading.value = false
  }
}

const handlePlay = (row) => {
  playerStore.playMusic(row)
}

const handlePlayAll = () => {
  if (detail.value.musics && detail.value.musics.length > 0) {
    // 播放第一首，并把整个列表加入播放队列（需要 playerStore 支持，目前先播放第一首）
    // TODO: 完善 playerStore 支持 setPlaylist
    playerStore.playMusic(detail.value.musics[0])
    // 假设 playerStore 有 setPlaylist 方法，或者我们简单遍历添加
    // playerStore.setPlaylist(detail.value.musics)
  } else {
    ElMessage.warning('歌单为空')
  }
}

const handleDownload = (row) => {
  const url = `/api/music/download/${row.id}`
  const link = document.createElement('a')
  link.href = url
  link.style.display = 'none'
  link.setAttribute('download', '')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const handleRemove = async (row) => {
  try {
    await removeMusicFromMusicList({
      musicListId: detail.value.id,
      musicId: row.id
    })
    ElMessage.success('移除成功')
    fetchDetail() // 刷新列表
  } catch (error) {
    ElMessage.error('移除失败')
  }
}

const formatDuration = (ms) => {
  if (!ms) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.title {
  font-weight: bold;
}

.info-section {
  display: flex;
  gap: 20px;
  padding: 20px 0;
}

.cover {
  width: 150px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eee;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
  font-size: 30px;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-content h2 {
  margin: 0 0 10px 0;
  font-size: 24px;
}

.meta {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.track-count {
  margin-left: 20px;
}

.description {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.actions {
  margin-top: auto;
}
</style>