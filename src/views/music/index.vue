<template>
  <div class="music-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>音乐库</span>
          <el-button type="primary" @click="handleUpload">上传音乐</el-button>
        </div>
      </template>
      
      <el-table :data="musicList" style="width: 100%" v-loading="loading">
        <el-table-column prop="title" label="歌曲标题" />
        <el-table-column prop="artist" label="歌手" />
        <el-table-column prop="album" label="专辑" />
        <el-table-column prop="durationMs" label="时长">
          <template #default="scope">
            {{ formatDuration(scope.row.durationMs) }}
          </template>
        </el-table-column>
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="handlePlay(scope.row)">播放</el-button>
            <el-button size="small" type="success" @click="handleDownload(scope.row)">下载</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="uploadVisible" title="上传音乐">
      <el-upload
        class="upload-demo"
        drag
        action="#" 
        :http-request="handleCustomUpload"
        multiple
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
      </el-upload>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { usePlayerStore } from '@/store/player'
import { uploadMusic, getMusicList } from '@/api/music'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const playerStore = usePlayerStore()
const loading = ref(false)
const musicList = ref([])
const uploadVisible = ref(false)

const handleCustomUpload = async (options) => {
  const { file, onSuccess, onError } = options
  const formData = new FormData()
  formData.append('file', file) // Matches @RequestParam("file")

  try {
    const res = await uploadMusic(formData)
    onSuccess(res)
    ElMessage.success('上传成功')
    uploadVisible.value = false
    fetchMusicList() // Refresh list after upload
  } catch (error) {
    onError(error)
    ElMessage.error('上传失败')
  }
}

const fetchMusicList = async () => {
  loading.value = true
  try {
    const res = await getMusicList()
    musicList.value = res
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMusicList()
})

const handleUpload = () => {
  uploadVisible.value = true
}

const handlePlay = (row) => {
  // 调用全局播放器播放音乐
  playerStore.playMusic(row)
}

const handleDownload = (row) => {
  // 假设后端下载接口为 /music/download/{id}
  const url = `/api/music/download/${row.id}`
  
  // 创建一个临时的 a 标签来触发下载，避免打开新窗口
  const link = document.createElement('a')
  link.href = url
  link.style.display = 'none'
  link.setAttribute('download', '') // 提示浏览器这是下载行为
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const formatDuration = (ms) => {
  if (!ms) return '00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
</script>

<style scoped>
/* 移除之前的底部 padding，因为现在由 layout 统一控制 */
</style>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
