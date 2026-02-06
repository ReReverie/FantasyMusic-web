import { defineStore } from 'pinia'
import { uploadMusic } from '@/api/music'
import { ElMessage } from 'element-plus'
import SparkMD5 from 'spark-md5'

export const useUploadStore = defineStore('upload', {
  state: () => ({
    fileList: [],
    isUploading: false
  }),

  getters: {
    uploadingCount: (state) => {
      return state.fileList.filter(f => f.status === 'uploading' || f.status === 'calculating').length
    },
    hasPendingFiles: (state) => {
      return state.fileList.some(f => f.status === 'ready' || f.status === 'fail')
    }
  },

  actions: {
    addFile(uploadFile) {
      if (this.fileList.some(f => f.uid === uploadFile.uid)) return
      
      this.fileList.push({
        uid: uploadFile.uid,
        raw: uploadFile.raw,
        name: uploadFile.name,
        size: uploadFile.size,
        status: 'ready', // ready, calculating, uploading, success, fail
        errorMsg: ''
      })
    },

    removeFile(uid) {
      const index = this.fileList.findIndex(f => f.uid === uid)
      if (index !== -1) {
        this.fileList.splice(index, 1)
      }
    },

    clearFiles() {
      // 仅清除未在上传中的文件，或者如果不在上传状态则清空所有
      if (this.isUploading) {
         // 如果正在上传，只清除未开始的任务（可选策略，这里根据用户需求可能更倾向于不允许清空正在上传的，或者全部清空）
         // 简单起见，如果正在上传，禁止清空操作在 UI 层控制，这里直接清空
      }
      this.fileList = []
    },

    updateFileStatus(uid, status, errorMsg = '') {
      const file = this.fileList.find(f => f.uid === uid)
      if (file) {
        file.status = status
        file.errorMsg = errorMsg
      }
    },

    calculateHash(file) {
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
    },

    async processUpload(uid) {
      const fileItem = this.fileList.find(f => f.uid === uid)
      if (!fileItem || fileItem.status === 'success') return

      try {
        // 1. 计算哈希
        this.updateFileStatus(uid, 'calculating')
        const hash = await this.calculateHash(fileItem.raw)
        
        // 2. 上传
        this.updateFileStatus(uid, 'uploading')
        const formData = new FormData()
        formData.append('file', fileItem.raw)
        formData.append('hash', hash)

        // 设置 10 分钟超时
        await uploadMusic(formData, { skipErrorMessage: true, timeout: 600000 })
        this.updateFileStatus(uid, 'success')
      } catch (error) {
        this.updateFileStatus(uid, 'fail', error.message || '上传失败')
        console.error(`File ${fileItem.name} upload failed:`, error)
      }
    },

    async startUpload() {
      if (this.isUploading) return
      this.isUploading = true

      // 获取当前待上传列表（快照）
      const pendingFiles = this.fileList.filter(f => f.status === 'ready' || f.status === 'fail')
      
      // 串行处理
      for (const file of pendingFiles) {
        // 检查文件是否还在列表中（可能被用户移除）
        if (!this.fileList.find(f => f.uid === file.uid)) continue
        
        await this.processUpload(file.uid)
      }

      this.isUploading = false
      
      // 检查结果
      const failedCount = this.fileList.filter(f => f.status === 'fail').length
      if (failedCount === 0 && pendingFiles.length > 0) {
        ElMessage.success('所有文件上传完成')
      } else if (failedCount > 0) {
        ElMessage.warning(`上传完成，有 ${failedCount} 个文件失败`)
      }
    },

    async retryUpload(uid) {
      if (this.isUploading) return
      this.isUploading = true
      await this.processUpload(uid)
      this.isUploading = false
    }
  }
})
