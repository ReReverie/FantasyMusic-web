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
        <div class="search-inputs">
          <el-input
            v-model="searchQuery.title"
            placeholder="搜索歌曲标题"
            class="search-input"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
          <el-input
            v-model="searchQuery.artist"
            placeholder="搜索歌手"
            class="search-input"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="search-actions">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>

      <!-- Mobile Card List View -->
      <div class="mobile-music-list" v-if="musicList.length > 0">
        <div 
          class="music-card" 
          v-for="item in musicList" 
          :key="item.id" 
          :class="{ 'is-selected': isBatchMode && multipleSelection.some(i => i.id === item.id) }"
          @click="isBatchMode ? toggleSelection(item) : handlePlay(item)"
        >
          <div class="card-left">
            <el-image 
              class="card-cover"
              :src="getCoverUrl(item)" 
              fit="cover"
              lazy
            >
              <template #error>
                <div class="card-cover-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <!-- Selection Checkbox Overlay -->
            <div class="selection-overlay" v-if="isBatchMode">
              <div class="checkbox-circle">
                <el-icon v-if="multipleSelection.some(i => i.id === item.id)"><Check /></el-icon>
              </div>
            </div>
          </div>
          <div class="card-center">
            <div class="card-title">{{ item.title }}</div>
            <div class="card-artist">
              <el-tag v-if="item.quality" size="small" type="warning" effect="dark" class="quality-tag">{{ item.quality || 'HQ' }}</el-tag>
              {{ item.artist }}
            </div>
          </div>
          <div class="card-right" v-if="!isBatchMode">
            <el-button size="small" type="primary" plain circle :icon="VideoPlay" @click.stop="handlePlay(item)" />
            <el-dropdown trigger="click" @click.stop>
              <el-button size="small" plain circle :icon="Plus" style="margin-left: 8px" @click.stop />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="Download" @click="handleDownload(item)">下载</el-dropdown-item>
                  <el-dropdown-item :icon="Star" @click="handleOpenCollect(item)">收藏</el-dropdown-item>
                  <el-dropdown-item v-if="isAdmin" :icon="Delete" @click="handleMobileDelete(item)" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <el-table 
        class="desktop-table"
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
                  <div class="image-slot" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; background: var(--table-hover-bg); color: var(--text-placeholder);">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <div style="display: flex; flex-direction: column; justify-content: center; overflow: hidden;">
                <span style="font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ scope.row.title }}</span>
                <span style="font-size: 12px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                   <el-tag v-if="scope.row.quality" size="small" type="warning" effect="dark" style="transform: scale(0.8); transform-origin: left center; margin-right: 4px;">{{ scope.row.quality || 'HQ' }}</el-tag>
                   {{ scope.row.artist }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="album" label="专辑" min-width="150" show-overflow-tooltip class-name="hidden-mobile" />
        <el-table-column prop="durationMs" label="时长" width="80" class-name="hidden-mobile">
          <template #default="scope">
            {{ formatDuration(scope.row.durationMs) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" class-name="actions-column">
          <template #default="scope">
            <div class="actions-wrapper">
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
          background
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
          :total="total"
          :small="isMobile"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 收藏到歌单弹窗 -->
    <el-dialog v-model="collectDialogVisible" title="添加到歌单" :width="isMobile ? '90%' : '30%'">
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
import { Plus, Picture, VideoPlay, Download, Star, Delete, Check } from '@element-plus/icons-vue'
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

const toggleSelection = (row) => {
  const index = multipleSelection.value.findIndex(item => item.id === row.id)
  if (index > -1) {
    // Deselect
    const newSelection = [...multipleSelection.value]
    newSelection.splice(index, 1)
    multipleSelection.value = newSelection
    // Sync with table if possible (optional, mainly for visual consistency if table was visible)
    if (tableRef.value) {
      tableRef.value.toggleRowSelection(row, false)
    }
  } else {
    // Select
    multipleSelection.value = [...multipleSelection.value, row]
    if (tableRef.value) {
      tableRef.value.toggleRowSelection(row, true)
    }
  }
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
        // 同步更新播放器状态，批量移除已删除的音乐
        playerStore.batchRemoveMusic(ids)
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
  scrollToTop()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchMusicList()
  scrollToTop()
}

const scrollToTop = () => {
  nextTick(() => {
    // 尝试多种选择器以适应不同的 Element Plus 版本和布局
    const scrollContainer = document.querySelector('.main-container .el-scrollbar__wrap') || 
                            document.querySelector('.el-scrollbar__wrap')
    
    if (scrollContainer) {
      scrollContainer.scroll({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })
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
      }, { skipErrorMessage: true })
      ElMessage.success('批量收藏成功')
      // 清空选择并退出批量模式
      multipleSelection.value = []
      toggleBatchMode(false)
    } else {
      await addMusicToMusicList({
        musicListId,
        musicId: currentMusicId.value
      }, { skipErrorMessage: true })
      ElMessage.success('收藏成功')
    }
    collectDialogVisible.value = false
  } catch (error) {
    console.error(error)
    const msg = error.message || '收藏失败'
    // 检查是否为重复添加错误 (Duplicate entry 或 backend 自定义提示)
    if (msg.includes('Duplicate') || msg.includes('duplicate') || msg.includes('exist') || msg.includes('已存在')) {
      if (isBatchCollectAction.value) {
         ElMessage.warning('部分或全部歌曲已在歌单中，收藏失败')
      } else {
         const music = musicList.value.find(m => m.id === currentMusicId.value)
         const title = music ? music.title : '歌曲'
         ElMessage.warning(`${title} 已在歌单中，收藏失败!`)
      }
    } else {
      ElMessage.error(msg)
    }
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

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

onMounted(() => {
  fetchMusicList()
  window.addEventListener('click', closeContextMenu)
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu)
  window.removeEventListener('resize', checkMobile)
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
    
    // 1. 如果后端返回的是 URL 字符串 (OSS 签名链接)
    if (typeof response === 'string' && (response.startsWith('http') || response.startsWith('/'))) {
        let downloadUrl = response
        // 强制升级 HTTP 为 HTTPS
        if (downloadUrl.startsWith('http://')) {
            downloadUrl = downloadUrl.replace('http://', 'https://')
        }
        
        const link = document.createElement('a')
        link.href = downloadUrl
        // 对于 OSS 签名链接，通常 Content-Disposition 已包含在签名或元数据中
        // download 属性在跨域时可能无效，但如果 headers 正确，浏览器会下载
        link.setAttribute('download', '') 
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        ElMessage.success('开始下载')
        return
    }

    // 2. 兼容旧的 Blob 逻辑 (如果后端仍返回流)
    // 注意：需要在 api/music.js 中配合 responseType: 'blob'，但现在已移除。
    // 如果必须同时支持，可能需要根据 content-type 判断。
    // 假设此处主要处理 URL。以下代码作为 fallback，可能需要调整 api 才能生效。
    if (response && response.data) {
        // ... (原有的 Blob 处理逻辑，略微保留以防万一，但主要依赖 URL)
         // 尝试从 header 中获取文件名
        let fileName = `${row.title}.mp3`
        const contentDisposition = response.headers['content-disposition']
        if (contentDisposition) {
          let match = contentDisposition.match(/filename\*=UTF-8''(.+)/i)
          if (match && match[1]) {
            fileName = decodeURIComponent(match[1])
          } else {
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
    }
  } catch (error) {
    console.error(error)
    ElMessage.error('下载失败')
  }
}

const handleMobileDelete = (row) => {
  ElMessageBox.confirm(
    '确定要删除这首歌曲吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    handleDelete(row)
  }).catch(() => {})
}

const handleDelete = async (row) => {
  try {
    await deleteMusic(row.id)
    // 同步更新播放器状态，移除已删除的音乐
    playerStore.removeMusic(row.id)
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
  background-color: var(--card-bg);
  backdrop-filter: blur(10px);
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  padding: 5px 0;
  min-width: 120px;
  border: 1px solid var(--glass-border);
}

.menu-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-main);
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
}

.menu-item:hover {
  background-color: var(--menu-hover-bg);
  color: var(--primary-color);
}

.menu-item.delete:hover {
  background-color: #fef0f0;
  color: #f56c6c;
}

/* Search Bar Styles */
.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.search-inputs {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.search-input {
  width: 200px;
}

.search-actions {
  display: flex;
  gap: 10px;
}

@media screen and (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-inputs {
    flex-direction: column;
    width: 100%;
  }

  .search-input {
    width: 100% !important;
    margin-right: 0 !important;
  }

  .search-actions {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }
  
  .search-actions .el-button {
    flex: 1;
  }
}

/* Mobile Card List Styles */
.mobile-music-list {
  display: none;
}

.desktop-table {
  display: block;
}

@media screen and (max-width: 768px) {
  .desktop-table {
    display: none !important;
  }
  
  .mobile-music-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .music-card {
    display: flex;
    align-items: center;
    padding: 12px;
    background: var(--card-bg);
    border-radius: 12px;
    border: 1px solid var(--glass-border);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    color: var(--text-main);
  }
  
  .card-left {
    flex-shrink: 0;
    margin-right: 12px;
    position: relative;
  }
  
  .card-cover {
    width: 50px;
    height: 50px;
    border-radius: 8px;
    display: block;
  }

  /* Selection Styles */
  .music-card.is-selected {
    background: rgba(139, 92, 246, 0.15);
    border-color: var(--primary-color);
  }

  .selection-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .checkbox-circle {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--primary-color);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  
  .card-cover-placeholder {
    width: 100%;
    height: 100%;
    background: var(--table-hover-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-placeholder);
  }
  
  .card-center {
    flex: 1;
    overflow: hidden;
    margin-right: 12px;
  }
  
  .card-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--text-main);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .card-artist {
    font-size: 12px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
  }
  
  .quality-tag {
    transform: scale(0.8);
    transform-origin: left center;
    margin-right: 4px;
  }
  
  .card-right {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }
}
</style>

<style>
/* Custom Pagination Styles - Non-scoped to override Element Plus */
.music-container .pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  padding: 16px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
}

.music-container .el-pagination {
  --el-pagination-bg-color: transparent;
  --el-pagination-button-bg-color: transparent;
  --el-pagination-hover-color: var(--primary-color);
  font-weight: 500;
}

/* 收藏弹窗列表样式 (Global) */
.music-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--glass-border);
  transition: background-color 0.2s;
  color: var(--text-main) !important;
}

.music-list-item:hover {
  background-color: var(--menu-hover-bg);
}

.list-info {
  display: flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}

.list-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-main) !important;
}

.list-count {
  font-size: 12px;
  color: var(--text-secondary) !important;
}

.music-container .el-pagination.is-background .el-pager li:not(.is-disabled).is-active {
  background-color: var(--primary-color) !important;
  color: white !important;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  font-weight: 700;
  border: none;
}

.music-container .el-pagination.is-background .el-pager li {
  background-color: transparent !important;
  border: 1px solid transparent;
  border-radius: 8px;
  margin: 0 4px;
  transition: all 0.3s;
}

.music-container .el-pagination.is-background .btn-prev,
.music-container .el-pagination.is-background .btn-next {
  background-color: transparent !important;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all 0.3s;
}

.music-container .el-pagination.is-background .el-pager li:not(.is-disabled):hover {
  color: var(--primary-color);
  background-color: var(--menu-hover-bg) !important;
}

.music-container .el-pagination.is-background .btn-prev:hover,
.music-container .el-pagination.is-background .btn-next:hover {
  color: var(--primary-color);
  background-color: var(--menu-hover-bg) !important;
}

.music-container .el-pagination.is-background .btn-prev:disabled,
.music-container .el-pagination.is-background .btn-next:disabled {
  background-color: transparent !important;
  opacity: 0.5;
}
</style>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media screen and (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .header-actions {
    display: flex;
    gap: 10px;
  }

  .header-actions .el-button {
    flex: 1;
    margin-right: 0 !important;
  }
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
