<template>
  <div class="upload-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button link @click="$router.back()">
              <el-icon><ArrowLeft /></el-icon> 返回
            </el-button>
            <span class="title">上传音乐</span>
          </div>
        </div>
      </template>

      <div class="upload-area">
        <el-upload
          class="upload-drop-zone"
          drag
          action="#"
          multiple
          :auto-upload="false"
          :on-change="handleFileChange"
          :show-file-list="false"
          accept=".mp3,.flac,.wav,.ogg,.m4a"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将音乐文件拖到此处，或<em>点击选择</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持 MP3, FLAC, WAV, OGG, M4A 格式
            </div>
          </template>
        </el-upload>
      </div>

      <div class="action-bar" v-if="fileList.length > 0">
        <div class="batch-info">
          已选择 {{ fileList.length }} 个文件
          <span v-if="uploadingCount > 0">，正在上传 {{ uploadingCount }} 个...</span>
        </div>
        <div class="action-buttons">
          <el-button @click="clearFiles" :disabled="isUploading">清空列表</el-button>
          <el-button type="primary" @click="startUpload" :loading="isUploading" :disabled="isUploading || fileList.length === 0">
            {{ isUploading ? '上传中...' : '开始上传' }}
          </el-button>
        </div>
      </div>

      <div class="file-list" v-if="fileList.length > 0">
        <el-table :data="fileList" style="width: 100%">
          <el-table-column prop="name" label="文件名" min-width="200" show-overflow-tooltip />
          <el-table-column prop="size" label="大小" width="120">
            <template #default="{ row }">
              {{ formatSize(row.size) }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="150">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'ready'" type="info">待上传</el-tag>
              <el-tag v-else-if="row.status === 'uploading'" type="primary">
                上传中 <el-icon class="is-loading"><Loading /></el-icon>
              </el-tag>
              <el-tag v-else-if="row.status === 'success'" type="success">成功</el-tag>
              <el-tag v-else-if="row.status === 'fail'" type="danger">失败</el-tag>
              <el-tag v-else-if="row.status === 'calculating'" type="warning">
                计算Hash <el-icon class="is-loading"><Loading /></el-icon>
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作/结果" min-width="200">
            <template #default="{ row }">
              <span v-if="row.status === 'fail'" class="error-msg">{{ row.errorMsg }}</span>
              <el-button 
                v-if="row.status === 'fail'" 
                link 
                type="primary" 
                @click="retryUpload(row)"
                :disabled="isUploading"
              >
                重试
              </el-button>
              <el-button 
                v-if="row.status !== 'uploading' && row.status !== 'calculating'" 
                link 
                type="danger" 
                @click="removeFile(row)"
                :disabled="isUploading"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { UploadFilled, ArrowLeft, Loading } from '@element-plus/icons-vue'
import { uploadMusic } from '@/api/music'
import { ElMessage } from 'element-plus'
import SparkMD5 from 'spark-md5'

const router = useRouter()
const fileList = ref([])
const isUploading = ref(false)

const uploadingCount = computed(() => {
  return fileList.value.filter(f => f.status === 'uploading' || f.status === 'calculating').length
})

const handleFileChange = (uploadFile) => {
  // 检查是否已经存在
  if (fileList.value.some(f => f.uid === uploadFile.uid)) return
  
  fileList.value.push({
    uid: uploadFile.uid,
    raw: uploadFile.raw,
    name: uploadFile.name,
    size: uploadFile.size,
    status: 'ready', // ready, calculating, uploading, success, fail
    errorMsg: ''
  })
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const removeFile = (file) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index !== -1) {
    fileList.value.splice(index, 1)
  }
}

const clearFiles = () => {
  fileList.value = []
}

// 计算文件哈希
const calculateHash = (file) => {
  return new Promise((resolve, reject) => {
    const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice
    const chunkSize = 2097152 // 2MB
    const chunks = Math.ceil(file.size / chunkSize)
    let currentChunk = 0
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()

    fileReader.onload = function (e) {
      spark.append(e.target.result)
      currentChunk++

      if (currentChunk < chunks) {
        loadNext()
      } else {
        const hash = spark.end()
        resolve(hash)
      }
    }

    fileReader.onerror = function () {
      reject('Hash calculation failed')
    }

    function loadNext() {
      const start = currentChunk * chunkSize
      const end = ((start + chunkSize) >= file.size) ? file.size : start + chunkSize
      fileReader.readAsArrayBuffer(blobSlice.call(file, start, end))
    }

    loadNext()
  })
}

// 处理单个文件上传
const processUpload = async (fileItem) => {
  if (fileItem.status === 'success') return

  try {
    // 1. 计算哈希
    fileItem.status = 'calculating'
    const hash = await calculateHash(fileItem.raw)
    
    // 2. 上传
    fileItem.status = 'uploading'
    const formData = new FormData()
    formData.append('file', fileItem.raw)
    formData.append('hash', hash)

    await uploadMusic(formData, { skipErrorMessage: true })
    fileItem.status = 'success'
    fileItem.errorMsg = ''
  } catch (error) {
    fileItem.status = 'fail'
    fileItem.errorMsg = error.message || '上传失败'
    console.error(`File ${fileItem.name} upload failed:`, error)
  }
}

// 队列上传控制器
const startUpload = async () => {
  if (isUploading.value) return
  isUploading.value = true

  const pendingFiles = fileList.value.filter(f => f.status === 'ready' || f.status === 'fail')
  
  // 串行处理，每次上传一个
  for (const file of pendingFiles) {
    // 如果用户中途清空了列表，停止上传
    if (!fileList.value.find(f => f.uid === file.uid)) continue
    
    await processUpload(file)
  }

  isUploading.value = false
  
  // 检查是否全部成功
  const failedCount = fileList.value.filter(f => f.status === 'fail').length
  if (failedCount === 0) {
    ElMessage.success('所有文件上传完成')
  } else {
    ElMessage.warning(`上传完成，有 ${failedCount} 个文件失败`)
  }
}

const retryUpload = async (file) => {
  if (isUploading.value) return
  isUploading.value = true
  await processUpload(file)
  isUploading.value = false
}
</script>

<style scoped lang="scss">
.upload-container {
  padding: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .title {
        font-weight: bold;
        font-size: 16px;
      }
    }
  }

  .upload-area {
    margin-bottom: 20px;
    
    :deep(.el-upload) {
      width: 100%;
      .el-upload-dragger {
        width: 100%;
      }
    }
  }

  .action-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 4px;
    
    .batch-info {
      color: #606266;
      font-size: 14px;
    }
  }

  .error-msg {
    color: #f56c6c;
    font-size: 12px;
    margin-right: 10px;
  }
}
</style>