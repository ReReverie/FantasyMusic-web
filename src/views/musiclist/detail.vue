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
          <el-image :src="getPlaylistCover(detail)" fit="cover" class="cover-img">
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
            <span>创建时间：{{ formatDate(detail.createTime) }}</span>
            <span class="track-count">歌曲数：{{ detail.musics ? detail.musics.length : 0 }}</span>
          </div>
          <p class="description">{{ detail.description || '暂无简介' }}</p>
          <div class="actions">
            <el-button type="primary" @click="handlePlayAll">
              <el-icon><VideoPlay /></el-icon> 播放全部
            </el-button>
            <el-button @click="handleEdit">
              <el-icon><Edit /></el-icon> 编辑信息
            </el-button>
          </div>
        </div>
      </div>

      <div class="table-toolbar" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <div class="toolbar-actions">
          <template v-if="!isBatchMode">
            <el-button @click="toggleBatchMode(true)">批量操作</el-button>
          </template>
          <template v-else>
            <el-button @click="toggleBatchMode(false)" style="margin-right: 12px;">取消</el-button>
            <el-button 
              type="danger" 
              :disabled="!multipleSelection.length" 
              @click="handleBatchRemove"
            >
              <el-icon><Delete /></el-icon> 批量移除
            </el-button>
          </template>
        </div>
        <el-input
          v-model="searchQuery"
          placeholder="搜索标题/专辑/歌手"
          style="width: 250px;"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>

      <!-- 歌曲列表 -->
      <el-table 
        :key="isBatchMode"
        :data="Array.isArray(detail.musics) ? detail.musics : []" 
        style="width: 100%;" 
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblClick"
        @row-contextmenu="handleContextMenu"
      >
        <el-table-column v-if="isBatchMode" type="selection" width="55" />
        <el-table-column type="index" label="#" width="50" />
        <el-table-column label="标题" min-width="300">
          <template #default="scope">
             <div style="display: flex; align-items: center;">
               <el-image 
                 style="width: 40px; height: 40px; border-radius: 4px; flex-shrink: 0; margin-right: 12px;" 
                 :src="getCoverUrl(scope.row)" 
                 fit="cover"
                 preview-teleported
                 :preview-src-list="[getCoverUrl(scope.row)]"
               >
                 <template #error>
                   <div class="image-slot" style="background: #f5f7fa; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #909399;">
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
        <el-table-column prop="album" label="专辑" show-overflow-tooltip />
        <el-table-column prop="durationMs" label="时长" width="100">
          <template #default="scope">
            {{ formatDuration(scope.row.durationMs) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <div style="display: flex; gap: 8px;">
              <el-tooltip content="播放" placement="top" :show-after="500">
                <el-button size="small" type="primary" plain circle :icon="VideoPlay" @click="handlePlay(scope.row)" />
              </el-tooltip>
              <el-tooltip content="下载" placement="top" :show-after="500">
                <el-button size="small" type="success" plain circle :icon="Download" @click="handleDownload(scope.row)" />
              </el-tooltip>
              <el-popconfirm title="确定要从歌单移除这首歌吗？" @confirm="handleRemove(scope.row)" width="200">
                <template #reference>
                  <el-button size="small" type="danger" circle :icon="Delete" title="移除" />
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑歌单弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑歌单信息" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="歌单名称">
          <el-input v-model="editForm.title" placeholder="请输入歌单名称" />
        </el-form-item>
        <el-form-item label="封面链接">
           <el-input v-model="editForm.cover" placeholder="请输入封面图片链接" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmEdit" :loading="editLoading">保存</el-button>
        </span>
      </template>
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
      <div class="menu-item delete" @click="handleContextMenuRemove">
        <el-icon style="margin-right: 5px"><Delete /></el-icon> 移除
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMusicListDetail, removeMusicFromMusicList, batchRemoveMusicFromMusicList, searchMusicInList, updateMusicList } from '@/api/musiclist'
import { downloadMusic } from '@/api/music'
import { usePlayerStore } from '@/store/player'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Picture, VideoPlay, Search, Download, Delete, Edit } from '@element-plus/icons-vue'
import { getCoverUrl, getPlaylistCover, formatDate } from '@/utils/music-utils'

const route = useRoute()
const router = useRouter()
const playerStore = usePlayerStore()

const searchQuery = ref('')
const loading = ref(false)
const detail = ref({})

const editDialogVisible = ref(false)
const editLoading = ref(false)
const editForm = ref({
  id: '',
  title: '',
  description: '',
  cover: ''
})

const multipleSelection = ref([])
const isBatchMode = ref(false)

const toggleBatchMode = (val) => {
  isBatchMode.value = val
  if (!val) {
    multipleSelection.value = []
    // Clear selection in table if needed, though reactive binding should handle it
  }
}

const handleSelectionChange = (val) => {
  multipleSelection.value = val
}

const handleBatchRemove = () => {
  if (multipleSelection.value.length === 0) return
  
  ElMessageBox.confirm(
    `确定要从歌单移除这 ${multipleSelection.value.length} 首歌曲吗？`,
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      const musicIds = multipleSelection.value.map(item => item.id)
      await batchRemoveMusicFromMusicList({
        musicListId: detail.value.id,
        musicIds
      })
      ElMessage.success('批量移除成功')
      fetchDetail()
      toggleBatchMode(false)
    } catch (error) {
      console.error(error)
      ElMessage.error('批量移除失败')
    }
  }).catch(() => {
    // cancelled
  })
}

const handleEdit = () => {
  if (!detail.value) return
  editForm.value = {
    id: detail.value.id,
    title: detail.value.title,
    description: detail.value.description,
    cover: detail.value.cover
  }
  editDialogVisible.value = true
}

const confirmEdit = async () => {
  if (!editForm.value.title) {
    ElMessage.warning('请输入歌单名称')
    return
  }

  // 封面 URL 验证
  if (editForm.value.cover && !/^https?:\/\/.+/.test(editForm.value.cover)) {
    ElMessage.error('封面链接必须以 http:// 或 https:// 开头')
    return
  }
  
  editLoading.value = true
  try {
    await updateMusicList(editForm.value)
    ElMessage.success('更新成功')
    editDialogVisible.value = false
    fetchDetail()
  } catch (error) {
    console.error(error)
    ElMessage.error('更新失败')
  } finally {
    editLoading.value = false
  }
}

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

const handleRowDblClick = (row) => {
  if (isBatchMode.value) return
  handlePlay(row)
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

const handleContextMenuRemove = () => {
  if (!contextMenuRow.value) return
  
  ElMessageBox.confirm(
    '确定要从歌单移除这首歌吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    handleRemove(contextMenuRow.value)
    closeContextMenu()
  }).catch(() => {
    closeContextMenu()
  })
}

const handlePlayAll = () => {
  if (detail.value.musics && detail.value.musics.length > 0) {
    // 播放全部：设置整个列表为播放列表，并从第一首开始播放
    playerStore.setPlaylist(detail.value.musics)
  } else {
    ElMessage.warning('歌单为空')
  }
}

const handleSearch = async () => {
  if (!searchQuery.value) {
    fetchDetail()
    return
  }

  const id = route.params.id
  if (!id) return

  loading.value = true
  console.log('Starting search with keyword:', searchQuery.value)
  try {
    const res = await searchMusicInList(id, {
      keyword: searchQuery.value
    })
    console.log('Search response:', res)
    // 搜索接口只返回歌曲列表，我们需要更新 detail 中的 musics
    if (detail.value) {
      // 确保 res 是数组，如果是对象则尝试取其 list 属性或 records 属性，否则设为空数组
      let musicList = []
      if (Array.isArray(res)) {
        musicList = res
      } else if (res && Array.isArray(res.musics)) {
        musicList = res.musics
      } else if (res && Array.isArray(res.list)) {
        musicList = res.list
      } else if (res && Array.isArray(res.records)) {
        musicList = res.records
      } else if (res && Array.isArray(res.data)) {
         musicList = res.data
      }
      
      detail.value.musics = musicList
    }
  } catch (error) {
    console.error('Search error:', error)
    ElMessage.error('搜索失败')
  } finally {
    console.log('Search finished, resetting loading')
    loading.value = false
  }
}

const handleDownload = async (row) => {
  try {
    const response = await downloadMusic(row.id)
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
  window.addEventListener('click', closeContextMenu)
})

onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu)
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
</style>