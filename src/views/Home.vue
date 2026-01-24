<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>歌曲总数</span>
            </div>
          </template>
          <div class="card-content">
            1,234
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>我的歌单</span>
            </div>
          </template>
          <div class="card-content">
            5
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>收藏歌曲</span>
            </div>
          </template>
          <div class="card-content">
            128
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>用户等级</span>
            </div>
          </template>
          <div class="card-content">
            VIP
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <div class="welcome-section">
      <h2>欢迎回来，用户！</h2>
      <p>享受您的音乐之旅。</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.card-header {
  font-weight: bold;
}

.card-content {
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  color: #409EFF;
}

.welcome-section {
  margin-top: 40px;
  text-align: center;
}
</style>
