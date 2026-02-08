<template>
  <div class="login-page">
    <div class="background-animate">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
    
    <div class="login-container glass-panel">
      <div class="login-header">
        <div class="logo-area">
          <img :src="logoImg" alt="Logo" class="logo-img" />
          <h1 class="app-title">Fantasy Music</h1>
        </div>
      </div>

      <!-- 登录表单 -->
      <transition name="fade-slide" mode="out-in">
        <div v-if="viewMode === 'login'" key="login" class="form-wrapper">
          <el-form :model="loginForm" :rules="rules" ref="loginFormRef" size="large" @submit.prevent>
            <el-form-item prop="account">
              <el-input 
                v-model="loginForm.account" 
                placeholder="用户名 / 邮箱" 
                :prefix-icon="User"
                class="fantasy-input"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input 
                v-model="loginForm.password" 
                type="password" 
                placeholder="密码" 
                :prefix-icon="Lock" 
                show-password 
                @keyup.enter="handleLogin"
                class="fantasy-input"
              />
            </el-form-item>
            
            <el-form-item v-if="showCaptcha" prop="captchaCode">
              <div class="captcha-row">
                <el-input 
                  v-model="loginForm.captchaCode" 
                  placeholder="验证码" 
                  class="fantasy-input"
                  @keyup.enter="handleLogin"
                />
                <img :src="captchaImage" class="captcha-img" @click="refreshCaptcha" alt="点击刷新" />
              </div>
            </el-form-item>

            <div class="form-footer">
              <el-checkbox v-model="rememberMe" class="fantasy-checkbox">记住我</el-checkbox>
              <el-link type="primary" :underline="false" @click="switchMode('reset')">忘记密码?</el-link>
            </div>

            <el-button type="primary" class="submit-btn" @click="handleLogin" :loading="loading" round>
              登 录
            </el-button>
          </el-form>
          
          <div class="switch-mode">
            还没有账号? <span class="action-link" @click="switchMode('register')">立即注册</span>
          </div>
        </div>

        <!-- 注册表单 -->
        <div v-else-if="viewMode === 'register'" key="register" class="form-wrapper">
          <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" size="large" @submit.prevent>
            <el-form-item prop="username">
              <el-input v-model="registerForm.username" placeholder="设置用户名" :prefix-icon="User" class="fantasy-input" />
            </el-form-item>
            <el-form-item prop="email">
              <el-input v-model="registerForm.email" placeholder="电子邮箱" :prefix-icon="Message" class="fantasy-input" />
            </el-form-item>
            <el-form-item prop="code">
              <div class="code-row">
                <el-input v-model="registerForm.code" placeholder="验证码" class="fantasy-input" />
                <el-button :disabled="countdown > 0" @click="handleSendCode" :loading="codeLoading" type="primary" plain class="code-btn" round>
                  {{ countdown > 0 ? `${countdown}s` : '获取邮箱验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="registerForm.password" type="password" placeholder="设置密码 (8-24位, 含大小写)" :prefix-icon="Lock" show-password class="fantasy-input" />
            </el-form-item>
            <el-form-item prop="confirmPassword">
              <el-input v-model="registerForm.confirmPassword" type="password" placeholder="确认密码" :prefix-icon="Lock" show-password class="fantasy-input" />
            </el-form-item>

            <el-button type="success" class="submit-btn" @click="handleRegister" :loading="loading" round>
              注 册
            </el-button>
          </el-form>

          <div class="switch-mode">
            已有账号? <span class="action-link" @click="switchMode('login')">立即登录</span>
          </div>
        </div>

        <!-- 重置密码表单 -->
        <div v-else-if="viewMode === 'reset'" key="reset" class="form-wrapper">
          <el-form :model="resetForm" :rules="resetRules" ref="resetFormRef" size="large" @submit.prevent>
            <el-form-item prop="account">
              <el-input v-model="resetForm.account" placeholder="用户名或邮箱" :prefix-icon="User" class="fantasy-input" />
            </el-form-item>
            <el-form-item prop="code">
              <div class="code-row">
                <el-input v-model="resetForm.code" placeholder="验证码" class="fantasy-input" />
                <el-button :disabled="resetCountdown > 0" @click="handleSendResetCode" :loading="resetCodeLoading" type="primary" plain class="code-btn" round>
                  {{ resetCountdown > 0 ? `${resetCountdown}s` : '获取邮箱验证码' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item prop="newPassword">
              <el-input v-model="resetForm.newPassword" type="password" placeholder="新密码" :prefix-icon="Lock" show-password class="fantasy-input" />
            </el-form-item>
            <el-form-item prop="confirmNewPassword">
              <el-input v-model="resetForm.confirmNewPassword" type="password" placeholder="确认新密码" :prefix-icon="Lock" show-password class="fantasy-input" />
            </el-form-item>

            <el-button type="warning" class="submit-btn" @click="handleResetPassword" :loading="loading" round>
              重置密码
            </el-button>
          </el-form>

          <div class="switch-mode">
            想起密码了? <span class="action-link" @click="switchMode('login')">返回登录</span>
          </div>
        </div>
      </transition>
    </div>

    <div class="login-footer">
      © 2026 ReverieSE
    </div>
  </div>
</template>

<script setup>
import logoImg from '@/assets/logo.svg'
import { ref, reactive, onUnmounted, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { register, getCaptcha, sendEmailCode, sendPasswordResetCode, resetPassword } from '@/api/user'
import { encrypt } from '@/utils/jsencrypt'

const router = useRouter()
const userStore = useUserStore()

const viewMode = ref('login')
const codeLoading = ref(false)
const resetCodeLoading = ref(false)
const loading = ref(false)
const rememberMe = ref(false)

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
  account: '',
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
  account: [{ required: true, message: '请输入用户名或邮箱', trigger: 'blur' }],
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
      codeLoading.value = true
      sendEmailCode(registerForm.email).then(() => {
        ElMessage.success('验证码已发送，请检查邮箱')
        codeLoading.value = false
        
        const expireTime = Date.now() + 60 * 1000
        localStorage.setItem('register_code_expire_time', expireTime)
        
        countdown.value = 60
        timer = setInterval(() => {
          countdown.value--
          if (countdown.value <= 0) {
            clearInterval(timer)
            localStorage.removeItem('register_code_expire_time')
          }
        }, 1000)
      }).catch(err => {
        codeLoading.value = false
      })
    }
  })
}

const handleSendResetCode = () => {
  resetFormRef.value.validateField('account', (valid) => {
    if (valid) {
      resetCodeLoading.value = true
      sendPasswordResetCode(resetForm.account).then(() => {
        ElMessage.success('验证码已发送，请检查邮箱')
        resetCodeLoading.value = false
        
        const expireTime = Date.now() + 60 * 1000
        localStorage.setItem('reset_code_expire_time', expireTime)
        
        resetCountdown.value = 60
        resetTimer = setInterval(() => {
          resetCountdown.value--
          if (resetCountdown.value <= 0) {
            clearInterval(resetTimer)
            localStorage.removeItem('reset_code_expire_time')
          }
        }, 1000)
      }).catch(err => {
        resetCodeLoading.value = false
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
        saveRememberMe() // Save credentials if rememberMe is checked
        const redirectPath = sessionStorage.getItem('redirect_path')
        if (redirectPath && redirectPath.startsWith('/') && !redirectPath.startsWith('//') && !redirectPath.includes('http') && !redirectPath.includes('hybridaction')) {
          router.replace(redirectPath)
          sessionStorage.removeItem('redirect_path')
        } else {
          router.replace('/')
        }
        loading.value = false
      }).catch((error) => {
        console.error('Login failed:', error)
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

const saveRememberMe = () => {
  if (rememberMe.value) {
    localStorage.setItem('login_username', loginForm.username)
    // 简单保存密码（Base64编码），仅供演示
    // 注意：实际生产环境不建议保存明文密码，或者应该使用更安全的存储方式
    localStorage.setItem('login_password', btoa(loginForm.password))
    localStorage.setItem('login_remember', 'true')
  } else {
    localStorage.removeItem('login_username')
    localStorage.removeItem('login_password')
    localStorage.removeItem('login_remember')
  }
}

const switchMode = (mode) => {
  viewMode.value = mode
  // 清空表单
  if (loginFormRef.value) loginFormRef.value.resetFields()
  if (registerFormRef.value) registerFormRef.value.resetFields()
  if (resetFormRef.value) resetFormRef.value.resetFields()
}

const checkRememberMe = () => {
  const remember = localStorage.getItem('login_remember')
  if (remember === 'true') {
    rememberMe.value = true
    const username = localStorage.getItem('login_username')
    const password = localStorage.getItem('login_password')
    if (username) loginForm.username = username
    if (password) {
      try {
        loginForm.password = atob(password)
      } catch (e) {
        console.error('Failed to decode password')
      }
    }
  }
}

const checkCountdown = () => {
  const registerExpire = localStorage.getItem('register_code_expire_time')
  if (registerExpire) {
    const remaining = Math.ceil((parseInt(registerExpire) - Date.now()) / 1000)
    if (remaining > 0) {
      countdown.value = remaining
      timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
          localStorage.removeItem('register_code_expire_time')
        }
      }, 1000)
    } else {
      localStorage.removeItem('register_code_expire_time')
    }
  }

  const resetExpire = localStorage.getItem('reset_code_expire_time')
  if (resetExpire) {
    const remaining = Math.ceil((parseInt(resetExpire) - Date.now()) / 1000)
    if (remaining > 0) {
      resetCountdown.value = remaining
      resetTimer = setInterval(() => {
        resetCountdown.value--
        if (resetCountdown.value <= 0) {
          clearInterval(resetTimer)
          localStorage.removeItem('reset_code_expire_time')
        }
      }, 1000)
    } else {
      localStorage.removeItem('reset_code_expire_time')
    }
  }
}

onMounted(() => {
  checkCountdown()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (resetTimer) clearInterval(resetTimer)
})
</script>

<style scoped lang="scss">
.login-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-gradient);
  position: relative;
  overflow: hidden;
}

/* 动态背景动画 */
.background-animate {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.6;
    animation: move 10s infinite alternate;
  }
  
  .circle-1 {
    top: 10%;
    left: 10%;
    width: 500px;
    height: 500px;
    background: #8b5cf6; /* Violet */
    animation-duration: 12s;
    animation-delay: -2s;
  }
  
  .circle-2 {
    bottom: 20%;
    right: 10%;
    width: 600px;
    height: 600px;
    background: #ec4899; /* Pink */
    animation-duration: 15s;
    animation-delay: -1s;
  }
  
  .circle-3 {
    top: 40%;
    left: 40%;
    width: 400px;
    height: 400px;
    background: #a78bfa; /* Light Violet */
    opacity: 0.5;
    animation-duration: 10s;
    animation-delay: -4s;
  }
}

@keyframes move {
  0% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(100px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-50px, 100px) scale(0.9);
  }
  100% {
    transform: translate(50px, 50px) scale(1.05);
  }
}

.login-container {
  width: 440px;
  max-width: 90%;
  padding: 40px;
  border-radius: 24px;
  z-index: 10;
  /* Glassmorphism inherits from global .glass-panel, but we add more specificity here */
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
  
  .logo-area {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 8px;
    
    .logo-img {
      width: 40px;
      height: 40px;
    }
    
    .app-title {
      font-size: 28px;
      font-weight: 800;
      margin: 0;
      background: var(--brand-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }
  }
  
  .app-subtitle {
    margin: 0;
    color: var(--text-secondary);
    font-size: 14px;
  }
}

@media screen and (max-width: 768px) {
  .login-container {
    width: 90%;
    padding: 24px;
  }
  
  .background-animate .circle {
    opacity: 0.4; /* Reduce distraction on small screens */
  }
}
:deep(.fantasy-input) {
  .el-input__wrapper {
    background-color: var(--input-bg);
    border: 1px solid var(--input-border);
    box-shadow: none !important;
    padding: 12px 16px;
    height: 48px;
    transition: all 0.3s;
    
    &:hover, &.is-focus {
      background-color: var(--input-bg);
      border-color: #8b5cf6;
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1) !important;
    }
  }
  
  .el-input__inner {
    height: 100%;
    color: var(--text-main);
    font-size: 16px;
  }
  
  .el-input__prefix-inner {
    font-size: 18px;
    color: #9ca3af;
  }
}

.captcha-row, .code-row {
  display: flex;
  gap: 12px;
  
  .captcha-img {
    height: 48px;
    border-radius: 12px;
    cursor: pointer;
    border: 1px solid rgba(0, 0, 0, 0.05);
    opacity: 0.9;
    transition: opacity 0.3s;
    
    &:hover {
      opacity: 1;
    }
  }
  
  .code-btn {
    height: 48px;
    padding: 0 24px;
    font-weight: 600;
  }
}

.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.submit-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 2px;
  margin-top: 8px;
  background: linear-gradient(to right, #8b5cf6, #ec4899);
  border: none;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(139, 92, 246, 0.25);
    background: linear-gradient(to right, #7c3aed, #db2777);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.switch-mode {
  text-align: center;
  margin-top: 24px;
  color: #6b7280;
  font-size: 14px;
  
  .action-link {
    color: #8b5cf6;
    font-weight: 600;
    cursor: pointer;
    margin-left: 4px;
    transition: color 0.3s;
    
    &:hover {
      color: #ec4899;
      text-decoration: underline;
    }
  }
}

/* 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.login-footer {
  position: absolute;
  bottom: 20px;
  width: 100%;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  z-index: 10;
}
</style>
