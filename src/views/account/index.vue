<template>
  <div class="account-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>账户信息</span>
        </div>
      </template>
      <el-form label-width="100px" :model="userInfo">
        <el-form-item label="头像">
          <div class="avatar-uploader">
             <el-avatar :size="100" :src="userInfo.avatarUrl" />
             <div style="margin-top: 10px; width: 100%;">
                <el-input v-model="userInfo.avatarUrl" placeholder="头像URL" />
             </div>
          </div>
        </el-form-item>
        <el-form-item label="用户名">
          <el-input v-model="userInfo.username" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="userInfo.nickname" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userInfo.email" />
        </el-form-item>
        <el-form-item label="用户等级">
           <el-tag type="success">{{ userInfo.userLevelValue || 0 }}</el-tag>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleUpdate" :loading="loading">保存更改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue'
import { useUserStore } from '@/store/user'
import { updateUser } from '@/api/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const loading = ref(false)

const userInfo = reactive({
  id: '',
  username: '',
  nickname: '',
  email: '',
  avatarUrl: '',
  userLevelValue: 0
})

const initData = () => {
  userInfo.id = userStore.id
  userInfo.username = userStore.username
  userInfo.nickname = userStore.nickname
  userInfo.email = userStore.email
  userInfo.avatarUrl = userStore.avatar
  userInfo.userLevelValue = userStore.userLevelValue
}

onMounted(async () => {
  // Try to get latest info from store or fetch
  if (!userStore.id) {
    try {
      await userStore.getUserInfo()
    } catch (e) {
      console.error(e)
    }
  }
  initData()
})

const handleUpdate = () => {
  loading.value = true
  // Construct the object to send
  const data = {
    id: userInfo.id,
    nickname: userInfo.nickname,
    email: userInfo.email,
    avatarUrl: userInfo.avatarUrl
  }
  
  updateUser(data).then(() => {
    ElMessage.success('更新成功')
    // Refresh store
    userStore.getUserInfo().then(() => {
      initData()
    })
  }).catch(err => {
    console.error(err)
  }).finally(() => {
    loading.value = false
  })
}
</script>

<style scoped>
.account-container {
  padding: 20px;
}
.avatar-uploader {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>
