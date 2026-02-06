<template>
  <div class="password-container">
    <el-card class="password-card">
      <template #header>
        <div class="card-header">
          <span>修改密码</span>
        </div>
      </template>
      <el-form :model="passwordForm" :rules="rules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="旧密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" show-password placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请确认新密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">确认修改</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { updatePassword } from '@/api/user'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { encrypt } from '@/utils/jsencrypt'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const passwordFormRef = ref(null)

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入新密码'))
  } else {
    if (passwordForm.confirmPassword !== '') {
      if (passwordFormRef.value) {
        passwordFormRef.value.validateField('confirmPassword')
      }
    }
    callback()
  }
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致!'))
  } else {
    callback()
  }
}

const rules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, validator: validatePass, trigger: 'blur' },
    { min: 8, max: 24, message: '密码长度在8到24位之间', trigger: 'blur' },
    { pattern: /(?=.*[a-z])(?=.*[A-Z])/, message: '密码必须包含大小写字母', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ]
}

const handleSubmit = () => {
  passwordFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true
      
      const encryptedOldPassword = encrypt(passwordForm.oldPassword)
      const encryptedNewPassword = encrypt(passwordForm.newPassword)
      
      if (!encryptedOldPassword || !encryptedNewPassword) {
        ElMessage.error('Password encryption failed')
        loading.value = false
        return
      }
      
      updatePassword({
        oldPassword: encryptedOldPassword,
        newPassword: encryptedNewPassword
      }).then(() => {
        ElMessage.success('密码修改成功，请重新登录')
        userStore.logout().then(() => {
          router.push('/login')
        })
      }).catch((error) => {
        console.error(error)
        // Only show error if it hasn't been handled by the request interceptor
        if (error.message && !error.isHandled) {
             ElMessage.error(error.message)
        }
      }).finally(() => {
        loading.value = false
      })
    } else {
      return false
    }
  })
}

const resetForm = () => {
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
}
</script>

<style scoped>
.password-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.password-card {
  width: 500px;
}
</style>
