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
        <el-table-column prop="duration" label="时长" />
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
        action="/api/music/upload"
        :headers="headers"
        :on-success="handleUploadSuccess"
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

const userStore = useUserStore()
const loading = ref(false)
const musicList = ref([])
const uploadVisible = ref(false)

const headers = {
  Authorization: userStore.token
}

onMounted(() => {
  // fetchMusicList()
  musicList.value = [
    { title: 'Song 1', artist: 'Artist 1', album: 'Album 1', duration: '3:30' },
    { title: 'Song 2', artist: 'Artist 2', album: 'Album 2', duration: '4:15' }
  ]
})

const handleUpload = () => {
  uploadVisible.value = true
}

const handlePlay = (row) => {
  console.log('Play', row)
}

const handleDownload = (row) => {
  console.log('Download', row)
}

const handleUploadSuccess = (response) => {
  if (response.code === 1) {
    // refresh list
  }
}
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
