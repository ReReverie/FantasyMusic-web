<template>
  <div class="music-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>音乐库</span>
          <div class="header-actions">
            <template v-if="!isBatchMode">
              <el-button @click="toggleBatchMode(true)" style="margin-right: 12px;">批量操作</el-button>
              <el-button v-if="isAdmin" type="primary" @click="handleUpload">上传音乐</el-button>
            </template>
            <template v-else>
              <el-button @click="toggleBatchMode(false)" style="margin-right: 12px;">取消</el-button>
              <el-button 
                type="warning" 
                :disabled="multipleSelection.length === 0" 
                @click="handleBatchCollect"
                style="margin-right: 12px;"
              >
                批量收藏
              </el-button>
              <el-button 
                v-if="isAdmin"
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
      
      <div class="search-bar" style="margin-bottom: 20px;">
        <el-input
          v-model="searchQuery.title"
          placeholder="搜索歌曲标题"
          style="width: 200px; margin-right: 10px;"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-input
          v-model="searchQuery.artist"
          placeholder="搜索歌手"
          style="width: 200px; margin-right: 10px;"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table 
        :key="isBatchMode"
        ref="tableRef" 
        :data="musicList" 
        style="width: 100%" 
        v-loading="loading" 
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblClick"
        @row-contextmenu="handleContextMenu"
      >
        <el-table-column v-if="isBatchMode" type="selection" width="55" />
        <el-table-column label="标题" min-width="200">
          <template #default="scope">
            <div style="display: flex; align-items: center;">
              <el-image 
                style="width: 50px; height: 50px; border-radius: 4px; flex-shrink: 0; margin-right: 12px;"
                :src="getCoverUrl(scope.row)" 
                :preview-src-list="[getCoverUrl(scope.row)]"
                preview-teleported
                fit="cover"
              >
                <template #error>
                  <div class="image-slot" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: #f5f7fa; color: #909399;">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div style="display: flex; flex-direction: column; justify-content: center; overflow: hidden;">
                <span style="font-size: 14px; font-weight: 500; color: #303133; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ scope.row.title }}</span>
                <span style="font-size: 12px; color: #909399; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                   <el-tag v-if="scope.row.quality" size="small" type="warning" effect="dark" style="transform: scale(0.8); transform-origin: left center; margin-right: 4px;">{{ scope.row.quality || 'HQ' }}</el-tag>
                   {{ scope.row.artist }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="album" label="专辑" min-width="150" show-overflow-tooltip />
        <el-table-column prop="durationMs" label="时长" width="80">
          <template #default="scope">
            {{ formatDuration(scope.row.durationMs) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220">
          <template #default="scope">
            <div style="display: flex; gap: 8px;">
              <el-tooltip content="播放" placement="top" :show-after="500">
                <el-button size="small" type="primary" plain circle :icon="VideoPlay" @click="handlePlay(scope.row)" />
              </el-tooltip>
              <el-tooltip content="下载" placement="top" :show-after="500">
                <el-button size="small" type="success" plain circle :icon="Download" @click="handleDownload(scope.row)" />
              </el-tooltip>
              <el-tooltip content="收藏" placement="top" :show-after="500">
                <el-button size="small" type="warning" plain circle :icon="Star" @click="handleOpenCollect(scope.row)" />
              </el-tooltip>
              <template v-if="isAdmin">
                <el-popconfirm title="确定要删除这首歌曲吗？" @confirm="handleDelete(scope.row)" width="200">
                  <template #reference>
                    <el-button size="small" type="danger" circle :icon="Delete" />
                  </template>
                </el-popconfirm>
              </template>
            </div>
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
            <span class="list-count">{{ (list.musicCount !== undefined ? list.musicCount : (list.musics ? list.musics.length : 0)) }}首</span>
          </div>
        </div>
      </el-scrollbar>
    </el-dialog>

    <!-- Context Menu -->
    <div 
      v-show="contextMenuVisible" 
      class="context-menu" 
      :style="{ top: contextMenuPosition.top + 'px', left: contextMenuPosition.left + 'px' }"
    >
      <div class="menu-item" @click="handleContextMenuPlay">
        <el-icon style="margin-right: 5px"><VideoPlay /></el-icon> 播放
      </div>
      <div class="menu-item" @click="handleContextMenuDownload">
        <el-icon style="margin-right: 5px"><Download /></el-icon> 下载
      </div>
      <div class="menu-item" @click="handleContextMenuCollect">
        <el-icon style="margin-right: 5px"><Star /></el-icon> 收藏
      </div>
      <div v-if="isAdmin" class="menu-item delete" @click="handleContextMenuDelete">
        <el-icon style="margin-right: 5px"><Delete /></el-icon> 删除
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { usePlayerStore } from '@/store/player'
import { getMusicPage, deleteMusic, batchDeleteMusic, downloadMusic, searchMusic } from '@/api/music'
import { getMusicLists, addMusicToMusicList, batchAddMusicToMusicList } from '@/api/musiclist'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Picture, VideoPlay, Download, Star, Delete } from '@element-plus/icons-vue'
import { getCoverUrl } from '@/utils/music-utils'

const router = useRouter()
const userStore = useUserStore()
const playerStore = usePlayerStore()
const loading = ref(false)
const musicList = ref([])
const multipleSelection = ref([])
const isBatchMode = ref(false)
const currentPage = ref(1)
const tableRef = ref(null)

const isAdmin = computed(() => {
  return userStore.userLevelValue === '管理员用户'
})

const toggleBatchMode = (val) => {
  isBatchMode.value = val
  nextTick(() => {
    if (tableRef.value) {
      tableRef.value.doLayout()
    }
  })
}

const pageSize = ref(20)
const total = ref(0)

const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

const handleRowDblClick = (row) => {
  if (isBatchMode.value) return
  playerStore.playMusic(row)
}

// Context Menu Logic
const contextMenuVisible = ref(false)
const contextMenuPosition = reactive({ top: 0, left: 0 })
const contextMenuRow = ref(null)

const handleContextMenu = (row, column, event) => {
  event.preventDefault()
  contextMenuRow.value = row
  contextMenuVisible.value = true
  contextMenuPosition.top = event.clientY
  contextMenuPosition.left = event.clientX
}

const closeContextMenu = () => {
  contextMenuVisible.value = false
}

const handleContextMenuPlay = () => {
  if (contextMenuRow.value) {
    handlePlay(contextMenuRow.value)
    closeContextMenu()
  }
}

const handleContextMenuDownload = () => {
  if (contextMenuRow.value) {
    handleDownload(contextMenuRow.value)
    closeContextMenu()
  }
}

const handleContextMenuCollect = () => {
  if (contextMenuRow.value) {
    handleOpenCollect(contextMenuRow.value)
    closeContextMenu()
  }
}

const handleContextMenuDelete = () => {
  if (!contextMenuRow.value) return
  
  ElMessageBox.confirm(
    '确定要删除这首歌曲吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    handleDelete(contextMenuRow.value)
    closeContextMenu()
  }).catch(() => {
    closeContextMenu()
  })
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
        toggleBatchMode(false)
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

const searchQuery = ref({
  title: '',
  artist: ''
})

const handleSearch = () => {
  currentPage.value = 1
  fetchMusicList()
}

const handleReset = () => {
  searchQuery.value = {
    title: '',
    artist: ''
  }
  handleSearch()
}

// 收藏相关
const collectDialogVisible = ref(false)
const myMusicLists = ref([])
const currentMusicId = ref(null)
const isBatchCollectAction = ref(false)

const handleOpenCollect = async (row) => {
  currentMusicId.value = row.id
  isBatchCollectAction.value = false
  try {
    const res = await getMusicLists()
    console.log('User music lists:', res)
    myMusicLists.value = res || []
    collectDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取歌单列表失败')
  }
}

const handleBatchCollect = async () => {
  isBatchCollectAction.value = true
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
    if (isBatchCollectAction.value) {
      const musicIds = multipleSelection.value.map(item => item.id)
      await batchAddMusicToMusicList({
        musicListId,
        musicIds
      })
      ElMessage.success('批量收藏成功')
      // 清空选择并退出批量模式
      multipleSelection.value = []
      toggleBatchMode(false)
    } else {
      await addMusicToMusicList({
        musicListId,
        musicId: currentMusicId.value
      })
      ElMessage.success('收藏成功')
    }
    collectDialogVisible.value = false
  } catch (error) {
    console.error(error)
    ElMessage.error('收藏失败')
  } finally {
    isBatchCollectAction.value = false
  }
}

const fetchMusicList = async () => {
  loading.value = true
  try {
    let res
    // 如果有搜索条件，使用 searchMusic 接口
    if (searchQuery.value.title || searchQuery.value.artist) {
      res = await searchMusic({
        pageNum: currentPage.value,
        pageSize: pageSize.value,
        title: searchQuery.value.title,
        artist: searchQuery.value.artist
      })
    } else {
      // 否则使用 getMusicPage 接口
      res = await getMusicPage({
        pageNum: currentPage.value,
        pageSize: pageSize.value
      })
    }

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
    } else if (res.data && Array.isArray(res.data)) { // 增强对后端返回结构的处理
       musicList.value = res.data
       total.value = res.total ? parseInt(res.total) : res.data.length
    } else {
      musicList.value = []
      total.value = 0
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('获取音乐列表失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMusicList()
  window.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu)
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
.context-menu {
  position: fixed;
  z-index: 9999;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  padding: 5px 0;
  min-width: 120px;
  border: 1px solid #e4e7ed;
}

.menu-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
}

.menu-item:hover {
  background-color: #f5f7fa;
  color: #409EFF;
}

.menu-item.delete:hover {
  background-color: #fef0f0;
  color: #f56c6c;
}

.music-container {
  max-width: 100%;
  overflow-x: hidden;
}

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
