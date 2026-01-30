<template>
  <div class="music-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>音乐库</span>
          <div class="header-actions">
            <template v-if="!isBatchMode">
              <el-button @click="isBatchMode = true" style="margin-right: 12px;">批量删除</el-button>
              <el-button type="primary" @click="handleUpload">上传音乐</el-button>
            </template>
            <template v-else>
              <el-button @click="isBatchMode = false" style="margin-right: 12px;">取消</el-button>
              <el-button 
                type="danger" 
                :disabled="multipleSelection.length === 0" 
                @click="handleBatchDelete"
              >
                确认删除
              </el-button>
            </template>
          </div>
        </div>
      </template>
      
      <el-table :data="musicList" style="width: 100%" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column v-if="isBatchMode" type="selection" width="55" />
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
            <el-button size="small" type="warning" @click="handleOpenCollect(scope.row)">收藏</el-button>
            <el-popconfirm title="确定要删除这首歌曲吗？" @confirm="handleDelete(scope.row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 收藏到歌单弹窗 -->
    <el-dialog v-model="collectDialogVisible" title="添加到歌单" width="30%">
      <div v-if="myMusicLists.length === 0">暂无歌单，请先去创建歌单</div>
      <el-scrollbar max-height="300px" v-else>
        <div 
          v-for="list in myMusicLists" 
          :key="list.id" 
          class="music-list-item"
          @click="handleAddToMusicList(list.id)"
        >
          <div class="list-info">
            <span class="list-title">{{ list.title }}</span>
            <span class="list-count">{{ list.musics ? list.musics.length : 0 }}首</span>
          </div>
        </div>
      </el-scrollbar>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { usePlayerStore } from '@/store/player'
import { getMusicPage, deleteMusic, batchDeleteMusic, downloadMusic } from '@/api/music'
import { getMusicLists, addMusicToMusicList } from '@/api/musiclist'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const playerStore = usePlayerStore()
const loading = ref(false)
const musicList = ref([])
const multipleSelection = ref([])
const isBatchMode = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

const handleBatchDelete = () => {
  if (multipleSelection.value.length === 0) return
  
  ElMessageBox.confirm(
    `确定要删除选中的 ${multipleSelection.value.length} 首歌曲吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const ids = multipleSelection.value.map(item => item.id)
        await batchDeleteMusic(ids)
        ElMessage.success('批量删除成功')
        fetchMusicList()
        // 清空选择并退出批量模式
        multipleSelection.value = []
        isBatchMode.value = false
      } catch (error) {
        console.error(error)
      }
    })
    .catch(() => {})
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchMusicList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchMusicList()
}

// 收藏相关
const collectDialogVisible = ref(false)
const myMusicLists = ref([])
const currentMusicId = ref(null)

const handleOpenCollect = async (row) => {
  currentMusicId.value = row.id
  try {
    const res = await getMusicLists()
    myMusicLists.value = res || []
    collectDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取歌单列表失败')
  }
}

const handleAddToMusicList = async (musicListId) => {
  try {
    await addMusicToMusicList({
      musicListId,
      musicId: currentMusicId.value
    })
    ElMessage.success('收藏成功')
    collectDialogVisible.value = false
  } catch (error) {
    console.error(error)
  }
}

const fetchMusicList = async () => {
  loading.value = true
  try {
    const res = await getMusicPage({
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })
    // 兼容处理：
    // 1. MyBatis-Plus Page对象: { records: [], total: 0 }
    // 2. 自定义 PageDTO: { list: [], total: 0 }
    // 3. 纯数组: []
    if (res.records) {
      musicList.value = res.records
      total.value = parseInt(res.total)
    } else if (res.list) {
      musicList.value = res.list
      total.value = parseInt(res.total)
    } else if (Array.isArray(res)) {
      musicList.value = res
      total.value = res.length
    } else {
      musicList.value = []
      total.value = 0
    }
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
  router.push('/music/upload')
}

const handlePlay = (row) => {
  // 调用全局播放器播放音乐
  playerStore.playMusic(row)
}

const handleDownload = async (row) => {
  try {
    const response = await downloadMusic(row.id)
    // res is a response object because we changed request.js
    if (!response || !response.data) return
    
    // 尝试从 header 中获取文件名
    let fileName = `${row.title}.mp3`
    const contentDisposition = response.headers['content-disposition']
    if (contentDisposition) {
      // 优先匹配 filename*=UTF-8''
      let match = contentDisposition.match(/filename\*=UTF-8''(.+)/i)
      if (match && match[1]) {
        fileName = decodeURIComponent(match[1])
      } else {
        // 其次匹配 filename=
        match = contentDisposition.match(/filename="?([^";]+)"?/i)
        if (match && match[1]) {
          fileName = decodeURIComponent(match[1])
        }
      }
    }

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    ElMessage.success('开始下载')
  } catch (error) {
    console.error(error)
    ElMessage.error('下载失败')
  }
}

const handleDelete = async (row) => {
  try {
    await deleteMusic(row.id)
    ElMessage.success('删除成功')
    fetchMusicList()
  } catch (error) {
    ElMessage.error('删除失败')
  }
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
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.music-list-item {
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.3s;
}

.music-list-item:hover {
  background-color: #f5f7fa;
}

.list-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-title {
  font-size: 14px;
  color: #333;
}

.list-count {
  font-size: 12px;
  color: #999;
}
</style>
