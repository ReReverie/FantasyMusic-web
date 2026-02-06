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
                <div class="status-content">
                  <span>上传中</span>
                  <el-icon class="is-loading"><Loading /></el-icon>
                </div>
              </el-tag>
              <el-tag v-else-if="row.status === 'success'" type="success">成功</el-tag>
              <el-tag v-else-if="row.status === 'fail'" type="danger">失败</el-tag>
              <el-tag v-else-if="row.status === 'calculating'" type="warning">
                <div class="status-content">
                  <span>计算Hash</span>
                  <el-icon class="is-loading"><Loading /></el-icon>
                </div>
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作/结果" min-width="200">
            <template #default="{ row }">
              <el-tooltip 
                v-if="row.status === 'fail'" 
                :content="row.errorMsg" 
                placement="top"
              >
                <span class="error-msg">{{ row.errorMsg }}</span>
              </el-tooltip>
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { UploadFilled, ArrowLeft, Loading } from '@element-plus/icons-vue'
import { useUploadStore } from '@/store/upload'
import { storeToRefs } from 'pinia'

const router = useRouter()
const uploadStore = useUploadStore()
const { fileList, isUploading, uploadingCount } = storeToRefs(uploadStore)

const handleFileChange = (uploadFile) => {
  uploadStore.addFile(uploadFile)
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const removeFile = (file) => {
  uploadStore.removeFile(file.uid)
}

const clearFiles = () => {
  uploadStore.clearFiles()
}

const startUpload = () => {
  uploadStore.startUpload()
}

const retryUpload = (file) => {
  uploadStore.retryUpload(file.uid)
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
    display: inline-block;
    max-width: 150px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
  }

  .status-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
</style>