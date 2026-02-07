<template>
  <div class="error-page">
    <div class="background-animate">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>

    <div class="error-container glass-panel">
      <div class="error-content">
        <h1 class="error-code">404</h1>
        <h2 class="error-title">Page Not Found</h2>
        <p class="error-desc">哎呀，您访问的页面好像迷路了...</p>
        
        <div class="error-actions">
          <el-button type="primary" size="large" round @click="goHome">
            返回首页
          </el-button>
          <el-button size="large" round @click="goBack">
            返回上一页
          </el-button>
        </div>
      </div>
    </div>
    
    <div class="footer-copyright">
      © 2026 ReverieSE
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
.error-page {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: var(--bg-gradient);
}

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
    background: #8b5cf6;
    animation-duration: 12s;
    animation-delay: -2s;
  }
  
  .circle-2 {
    bottom: 20%;
    right: 10%;
    width: 600px;
    height: 600px;
    background: #ec4899;
    animation-duration: 15s;
    animation-delay: -1s;
  }
}

@keyframes move {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(50px, 50px) scale(1.05); }
}

.error-container {
  position: relative;
  z-index: 10;
  padding: 60px 80px;
  border-radius: 24px;
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.error-code {
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
  margin: 0;
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.8;
}

.error-title {
  font-size: 32px;
  color: var(--text-main);
  margin: 10px 0 20px;
}

.error-desc {
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 40px;
}

.error-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.footer-copyright {
  position: absolute;
  bottom: 20px;
  width: 100%;
  text-align: center;
  color: var(--text-secondary);
  font-size: 12px;
  opacity: 0.6;
  z-index: 10;
}

@media screen and (max-width: 768px) {
  .error-container {
    padding: 40px 24px;
    width: 90%;
  }
  
  .error-code {
    font-size: 80px;
  }
  
  .error-title {
    font-size: 24px;
  }
}
</style>