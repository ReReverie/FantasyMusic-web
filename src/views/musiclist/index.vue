<template>
  <div class="musiclist-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的歌单</span>
          <el-button type="primary" @click="handleCreate">创建歌单</el-button>
        </div>
      </template>
      
      <el-table :data="musicLists" style="width: 100%" v-loading="loading">
        <el-table-column prop="title" label="歌单名称" />
        <el-table-column prop="description" label="简介" show-overflow-tooltip />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleDetail(scope.row)">查看</el-button>
            <el-button size="small" type="danger">删除</el-button>
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
import { getMusicLists, createMusicList } from '@/api/musiclist'
import { ElMessage } from 'element-plus'

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
    musicLists.value = res || []
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
    await createMusicList(form)
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
</style>
