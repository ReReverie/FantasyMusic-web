<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>梦幻音乐平台</h2>
        </div>
      </template>
      
      <el-tabs v-model="activeTab" class="demo-tabs">
        <el-tab-pane label="登录" name="login">
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

            <el-form-item>
              <el-button type="primary" class="w-100" @click="handleLogin" :loading="loading">登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="注册" name="register">
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
            <el-form-item>
              <el-button type="success" class="w-100" @click="handleRegister" :loading="loading">注册</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { register, getCaptcha, sendEmailCode } from '@/api/user'
import { encrypt } from '@/utils/jsencrypt'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('login')
const loading = ref(false)

const loginFormRef = ref(null)
const registerFormRef = ref(null)

const showCaptcha = ref(false)
const captchaImage = ref('')
const countdown = ref(0)
let timer = null

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

const refreshCaptcha = () => {
  getCaptcha().then(res => {
    // Assuming backend returns { uuid: '...', img: 'base64...' }
    // Or if it returns just image, we might rely on cookies.
    // Let's assume JSON with uuid and img for stateless JWT
    if (res && res.img) {
      captchaImage.value = res.img
      loginForm.captchaUuid = res.uuid
    }
  }).catch(err => {
    console.error('Failed to load captcha', err)
  })
}

const handleSendCode = () => {
  // Validate email first
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
        // Error handled by interceptor usually, but safe to log
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
        // Check for redirect path in session storage
        const redirectPath = sessionStorage.getItem('redirect_path')
        // Validate redirectPath: must start with '/' and not contain http/https (to prevent open redirect vulnerabilities or weird browser plugin injections)
        if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//') && !redirectPath.includes('http') && !redirectPath.includes('hybridaction')) {
          router.push(redirectPath)
          sessionStorage.removeItem('redirect_path')
        } else {
          router.push('/')
        }
        loading.value = false
      }).catch((error) => {
        console.error('Login failed:', error)
        
        // Check for Captcha Required error (e.g., code 423 or specific message)
        if (error.code === 423 || error.message.includes('验证码')) {
           showCaptcha.value = true
           refreshCaptcha()
           // If we just showed captcha, clear the password? Maybe not.
           loginForm.captchaCode = ''
           ElMessage.warning('请输入验证码')
        } else if (error.message && !error.isHandled) {
             // Handle client-side errors (like encryption failure)
             ElMessage.error(error.message)
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
        activeTab.value = 'login'
        loading.value = false
      }).catch((error) => {
        // Only show error if it hasn't been handled by the request interceptor
        if (error.message && !error.isHandled) {
             ElMessage.error(error.message)
        }
        loading.value = false
      })
    }
  })
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
  background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  border-radius: 8px;
}

.card-header {
  text-align: center;
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
</style>
