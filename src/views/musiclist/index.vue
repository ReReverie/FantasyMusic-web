<template>
  <div class="musiclist-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的歌单</span>
          <el-button type="primary" @click="handleCreate">创建歌单</el-button>
        </div>
      </template>
      
      <el-table 
        :data="musicLists" 
        style="width: 100%" 
        v-loading="loading"
        @row-click="handleRowClick"
        class="clickable-rows"
      >
        <el-table-column label="歌单名称" min-width="200">
          <template #default="scope">
            <div style="display: flex; align-items: center; gap: 12px;">
              <el-image 
                style="width: 50px; height: 50px; border-radius: 4px; flex-shrink: 0;"
                :src="getPlaylistCover(scope.row)" 
                fit="cover"
              >
                <template #error>
                  <div class="image-slot" style="background: #f5f7fa; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #909399;">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
              <span>{{ scope.row.title }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="简介" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleDetail(scope.row)">查看</el-button>
            <el-popconfirm title="确定要删除这个歌单吗？" @confirm="handleDelete(scope.row)">
              <template #reference>
                <el-button size="small" type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建歌单弹窗 -->
    <el-dialog v-model="dialogVisible" title="创建歌单" width="30%">
      <el-form :model="form" label-width="80px">
        <el-form-item label="歌单名称">
          <el-input v-model="form.title" placeholder="请输入歌单名称" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.description" type="textarea" placeholder="请输入简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmCreate">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { getMusicLists, createMusicList, deleteMusicList, getMusicListDetail } from '@/api/musiclist'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { getPlaylistCover } from '@/utils/music-utils'

import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const musicLists = ref([])
const dialogVisible = ref(false)
const form = reactive({
  title: '',
  description: ''
})

const fetchMusicLists = async () => {
  loading.value = true
  try {
    const res = await getMusicLists()
    if (Array.isArray(res)) {
      // 并发获取每个歌单的详情，以补充 musics 信息，用于封面展示
      const detailedLists = await Promise.all(res.map(async (list) => {
        try {
          const detail = await getMusicListDetail(list.id)
          return {
            ...list,
            musics: detail.musics || [],
            cover: detail.cover || list.cover // 优先使用详情中的 cover
          }
        } catch (err) {
          console.warn(`Failed to fetch detail for list ${list.id}`, err)
          return list
        }
      }))
      musicLists.value = detailedLists
    } else {
      musicLists.value = []
    }
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  form.title = ''
  form.description = ''
  dialogVisible.value = true
}

const confirmCreate = async () => {
  if (!form.title) {
    ElMessage.warning('请输入歌单名称')
    return
  }
  try {
    await createMusicList({
      title: form.title,
      description: form.description || null
    })
    ElMessage.success('创建成功')
    dialogVisible.value = false
    fetchMusicLists()
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

const handleDetail = (row) => {
  router.push(`/musiclist/${row.id}`)
}

const handleRowClick = (row) => {
  handleDetail(row)
}

const handleDelete = async (row) => {
  try {
    await deleteMusicList(row.id)
    ElMessage.success('删除成功')
    fetchMusicLists()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  fetchMusicLists()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

:deep(.clickable-rows .el-table__row) {
  cursor: pointer;
}
</style>
