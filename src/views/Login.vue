<template>
  <div class="login-container" :style="{ backgroundImage: `url(${currentBg})` }">
    <!-- 背景遮罩，用于提升文字可读性 -->
    <div class="bg-overlay"></div>
    
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>梦幻音乐平台</h2>
        </div>
      </template>
      
      <!-- 登录表单 -->
      <div v-if="viewMode === 'login'">
        <el-form :model="loginForm" :rules="rules" ref="loginFormRef" label-position="top">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="loginForm.username" prefix-icon="User" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="loginForm.password" prefix-icon="Lock" type="password" placeholder="请输入密码" show-password @keyup.enter="handleLogin" />
          </el-form-item>
          
          <el-form-item v-if="showCaptcha" label="验证码" prop="captchaCode">
            <div class="captcha-container">
              <el-input v-model="loginForm.captchaCode" placeholder="请输入验证码" class="captcha-input" @keyup.enter="handleLogin" />
              <img :src="captchaImage" class="captcha-img" @click="refreshCaptcha" alt="点击刷新验证码" title="点击刷新验证码" />
            </div>
          </el-form-item>

          <div class="login-links">
            <el-link type="primary" :underline="false" @click="switchMode('reset')">忘记密码?</el-link>
            <el-link type="primary" :underline="false" @click="switchMode('register')">没有账户?</el-link>
          </div>

          <el-form-item>
            <el-button type="primary" class="w-100" @click="handleLogin" :loading="loading">登录</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <!-- 注册表单 -->
      <div v-else-if="viewMode === 'register'">
        <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-position="top">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="registerForm.username" prefix-icon="User" placeholder="设置用户名" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="registerForm.email" prefix-icon="Message" placeholder="请输入邮箱" />
          </el-form-item>
          <el-form-item label="验证码" prop="code">
            <div class="code-container">
              <el-input v-model="registerForm.code" placeholder="请输入验证码" class="code-input" />
              <el-button :disabled="countdown > 0" @click="handleSendCode" type="primary" plain class="code-btn">
                {{ countdown > 0 ? `${countdown}s后重新获取` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="registerForm.password" prefix-icon="Lock" type="password" placeholder="设置密码" show-password />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="registerForm.confirmPassword" prefix-icon="Lock" type="password" placeholder="确认密码" show-password />
          </el-form-item>
          
          <div class="login-links" style="justify-content: flex-end; margin-bottom: 18px;">
            <el-link type="primary" :underline="false" @click="switchMode('login')">已有账户?</el-link>
          </div>

          <el-form-item>
            <el-button type="success" class="w-100" @click="handleRegister" :loading="loading">注册</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 重置密码表单 -->
      <div v-else-if="viewMode === 'reset'">
        <el-form :model="resetForm" :rules="resetRules" ref="resetFormRef" label-position="top">
          <el-form-item label="账号" prop="account">
            <el-input v-model="resetForm.account" prefix-icon="User" placeholder="请输入用户名或邮箱" />
          </el-form-item>
          <el-form-item label="验证码" prop="code">
            <div class="code-container">
              <el-input v-model="resetForm.code" placeholder="请输入验证码" class="code-input" />
              <el-button :disabled="resetCountdown > 0" @click="handleSendResetCode" type="primary" plain class="code-btn">
                {{ resetCountdown > 0 ? `${resetCountdown}s后重新获取` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="resetForm.newPassword" prefix-icon="Lock" type="password" placeholder="设置新密码" show-password />
          </el-form-item>
          <el-form-item label="确认新密码" prop="confirmNewPassword">
            <el-input v-model="resetForm.confirmNewPassword" prefix-icon="Lock" type="password" placeholder="确认新密码" show-password />
          </el-form-item>
          
          <div class="login-links" style="justify-content: flex-end; margin-bottom: 18px;">
            <el-link type="primary" :underline="false" @click="switchMode('login')">返回登录</el-link>
          </div>

          <el-form-item>
            <el-button type="warning" class="w-100" @click="handleResetPassword" :loading="loading">重置密码</el-button>
          </el-form-item>
        </el-form>
      </div>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { register, getCaptcha, sendEmailCode, sendPasswordResetCode, resetPassword } from '@/api/user'
import { encrypt } from '@/utils/jsencrypt'
import { getBackgroundImage, preloadImage, backgroundConfig } from '@/api/background'

const router = useRouter()
const userStore = useUserStore()

// 视图模式: 'login', 'register', 'reset'
const viewMode = ref('login')
const loading = ref(false)
const bgLoading = ref(false)
const currentBg = ref('')

const loginFormRef = ref(null)
const registerFormRef = ref(null)
const resetFormRef = ref(null)

const showCaptcha = ref(false)
const captchaImage = ref('')
const countdown = ref(0)
const resetCountdown = ref(0)
let timer = null
let resetTimer = null

const loginForm = reactive({
  username: '',
  password: '',
  captchaCode: '',
  captchaUuid: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  code: ''
})

const resetForm = reactive({
  account: '',
  code: '',
  newPassword: '',
  confirmNewPassword: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  captchaCode: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

const validatePass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error("两次输入密码不一致!"))
  } else {
    callback()
  }
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名不少于3个字符', trigger: 'blur' },
    { pattern: /^(?!\d+$).+$/, message: '用户名不能是纯数字', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 24, message: '密码长度在8到24位之间', trigger: 'blur' },
    { pattern: /(?=.*[a-z])(?=.*[A-Z])/, message: '密码必须包含大小写字母', trigger: 'blur' }
  ],
  confirmPassword: [{ validator: validatePass2, trigger: 'blur' }]
}

const validateResetPass2 = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== resetForm.newPassword) {
    callback(new Error("两次输入密码不一致!"))
  } else {
    callback()
  }
}

const resetRules = {
  account: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, max: 24, message: '密码长度在8到24位之间', trigger: 'blur' },
    { pattern: /(?=.*[a-z])(?=.*[A-Z])/, message: '密码必须包含大小写字母', trigger: 'blur' }
  ],
  confirmNewPassword: [{ validator: validateResetPass2, trigger: 'blur' }]
}

const refreshCaptcha = () => {
  getCaptcha().then(res => {
    if (res && res.img) {
      captchaImage.value = res.img
      loginForm.captchaUuid = res.uuid
    }
  }).catch(err => {
    console.error('Failed to load captcha', err)
  })
}

const handleSendCode = () => {
  registerFormRef.value.validateField('email', (valid) => {
    if (valid) {
      loading.value = true
      sendEmailCode(registerForm.email).then(() => {
        ElMessage.success('验证码已发送')
        loading.value = false
        countdown.value = 60
        timer = setInterval(() => {
          countdown.value--
          if (countdown.value <= 0) {
            clearInterval(timer)
          }
        }, 1000)
      }).catch(err => {
        loading.value = false
      })
    }
  })
}

const handleSendResetCode = () => {
  resetFormRef.value.validateField('account', (valid) => {
    if (valid) {
      loading.value = true
      sendPasswordResetCode(resetForm.account).then(() => {
        ElMessage.success('验证码已发送，请检查邮箱')
        loading.value = false
        resetCountdown.value = 60
        resetTimer = setInterval(() => {
          resetCountdown.value--
          if (resetCountdown.value <= 0) {
            clearInterval(resetTimer)
          }
        }, 1000)
      }).catch(err => {
        loading.value = false
      })
    }
  })
}

const handleLogin = () => {
  loginFormRef.value.validate(valid => {
    if (valid) {
      loading.value = true
      userStore.login(loginForm).then(() => {
        ElMessage.success('登录成功')
        const redirectPath = sessionStorage.getItem('redirect_path')
        if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//') && !redirectPath.includes('http') && !redirectPath.includes('hybridaction')) {
          router.push(redirectPath)
          sessionStorage.removeItem('redirect_path')
        } else {
          router.push('/')
        }
        loading.value = false
      }).catch((error) => {
        console.error('Login failed:', error)
        
        // Check for Captcha Required error (code 423)
        // 支持两种模式：
        // 1. 业务状态码 423 (error.code === 423)
        // 2. HTTP 状态码 423 (error.response.status === 423)
        const isCaptchaRequired = error.code === 423 || (error.response && error.response.status === 423)
        
        if (isCaptchaRequired) {
           showCaptcha.value = true
           refreshCaptcha()
           loginForm.captchaCode = ''
           if (!showCaptcha.value) {
               ElMessage.warning(error.message || '请输入验证码')
           }
        } else {
             if (showCaptcha.value) {
               refreshCaptcha()
               loginForm.captchaCode = ''
             }
             if (error.message && !error.isHandled) {
                ElMessage.error(error.message)
             }
        }
        loading.value = false
      })
    }
  })
}

const handleRegister = () => {
  registerFormRef.value.validate(valid => {
    if (valid) {
      loading.value = true
      const encryptedPassword = encrypt(registerForm.password)
      if (!encryptedPassword) {
        ElMessage.error('Password encryption failed')
        loading.value = false
        return
      }
      register({ 
        username: registerForm.username, 
        password: encryptedPassword,
        email: registerForm.email,
        emailCode: registerForm.code
      }).then(() => {
        ElMessage.success('注册成功，请登录')
        viewMode.value = 'login'
        loading.value = false
      }).catch((error) => {
        if (error.message && !error.isHandled) {
             ElMessage.error(error.message)
        }
        loading.value = false
      })
    }
  })
}

const handleResetPassword = () => {
  resetFormRef.value.validate(valid => {
    if (valid) {
      loading.value = true
      const encryptedPassword = encrypt(resetForm.newPassword)
       if (!encryptedPassword) {
        ElMessage.error('Password encryption failed')
        loading.value = false
        return
      }
      resetPassword({
        account: resetForm.account,
        code: resetForm.code,
        newPassword: encryptedPassword
      }).then(() => {
        ElMessage.success('密码重置成功，请登录')
        viewMode.value = 'login'
        loading.value = false
      }).catch((error) => {
         if (error.message && !error.isHandled) {
             ElMessage.error(error.message)
        }
        loading.value = false
      })
    }
  })
}

const switchMode = (mode) => {
  viewMode.value = mode
}

const changeBackground = async () => {
  try {
    bgLoading.value = true
    const url = await getBackgroundImage()
    await preloadImage(url)
    currentBg.value = url
  } catch (error) {
    console.error('Failed to load background:', error)
    ElMessage.warning('背景加载失败，使用默认背景')
  } finally {
    bgLoading.value = false
  }
}

onMounted(() => {
  changeBackground()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (resetTimer) clearInterval(resetTimer)
})
</script>

<style scoped>
/* 引入现代风格字体 (Noto Sans SC) */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap');

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: background-image 1s ease-in-out;
  position: relative;
}

.bg-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2); /* 轻微暗色遮罩 */
  backdrop-filter: blur(2px); /* 轻微背景模糊 */
  z-index: 0;
}

.login-card {
  width: 400px;
  border-radius: 12px;
  z-index: 1;
  background-color: rgba(255, 255, 255, 0.75) !important; /* 半透明背景 */
  backdrop-filter: blur(10px) saturate(180%); /* 毛玻璃效果 */
  -webkit-backdrop-filter: blur(10px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}

.card-header {
  text-align: center;
}
.card-header h2 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 4px;
  background: linear-gradient(120deg, #a18cd1 0%, #fbc2eb 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  /* 添加 drop-shadow 增强立体感，因为文字透明无法用 text-shadow */
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  /* 稍微增加一点内边距防止文字被裁剪 */
  padding: 5px 0;
  /* 字体设置由下方专门规则覆盖 */
}

.w-100 {
  width: 100%;
}

.captcha-container {
  display: flex;
  gap: 10px;
}
.captcha-input {
  flex: 1;
}
.captcha-img {
  width: 100px;
  height: 32px;
  cursor: pointer;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.code-container {
  display: flex;
  gap: 10px;
}
.code-input {
  flex: 1;
}
.code-btn {
  width: 120px;
}

.login-links {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
  font-size: 14px;
}

/* 全局字体与交互设置 */
:deep(.el-card__body), :deep(.el-form-item__label), :deep(.el-input__inner), :deep(.el-button) {
  font-family: 'Noto Sans SC', 'PingFang SC', 'Heiti SC', 'Microsoft YaHei UI', 'Microsoft YaHei', sans-serif !important;
}

.login-container * {
  user-select: none; /* 禁止复制 */
}

/* 标题样式增强 */
.card-header h2 {
  font-family: 'Noto Sans SC', sans-serif !important;
  font-weight: 900; /* 使用极粗字重增加现代感 */
  letter-spacing: 2px; /* 稍微收紧字间距，更显紧凑现代 */
  transition: all 0.3s ease;
}

/* 鼠标悬停发光动画 - 针对标题 */
.card-header h2:hover {
  filter: drop-shadow(0 0 12px rgba(161, 140, 209, 0.9)); /* 增强发光范围 */
  transform: scale(1.02);
}

/* 鼠标悬停发光动画 - 针对链接和Label等文本 */
.login-links .el-link, :deep(.el-form-item__label) {
  transition: all 0.3s ease;
}

.login-links .el-link:hover, :deep(.el-form-item__label):hover {
  text-shadow: 0 0 8px rgba(161, 140, 209, 0.5); /* 柔和的辉光 */
  color: #a18cd1; /* 悬停时轻微变色 */
}
</style>