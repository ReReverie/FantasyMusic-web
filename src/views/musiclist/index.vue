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
            <el-popconfirm title="确定要删除这个歌单吗？" @confirm="handleDelete(scope.row)">
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
import { getMusicListPage, createMusicList, deleteMusicList } from '@/api/musiclist'
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

const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchMusicLists()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchMusicLists()
}

const fetchMusicLists = async () => {
  loading.value = true
  try {
    const res = await getMusicListPage({
      pageNum: currentPage.value,
      pageSize: pageSize.value
    })
    if (res.records) {
      musicLists.value = res.records
      total.value = parseInt(res.total)
    } else if (res.list) {
      musicLists.value = res.list
      total.value = parseInt(res.total)
    } else if (Array.isArray(res)) {
      musicLists.value = res
      total.value = res.length
    } else {
      musicLists.value = []
      total.value = 0
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
