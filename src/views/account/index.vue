<template>
  <div class="account-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>账户信息</span>
        </div>
      </template>
      <el-form label-width="100px">
        <el-form-item label="用户名">
          <el-input v-model="userInfo.username" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="userInfo.nickname" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userInfo.email" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary">保存更改</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const userInfo = reactive({
  username: 'user123',
  nickname: '音乐爱好者',
  email: 'user@example.com'
})
</script>
