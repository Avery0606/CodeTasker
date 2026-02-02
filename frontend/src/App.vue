<template>
  <el-container class="app-container">
    <el-header class="app-header">
      <div class="header-left">
        <el-icon :size="24" color="#409EFF"><Monitor /></el-icon>
        <span class="app-title">CodeTasker</span>
      </div>
      <WorkspaceSelector />
    </el-header>
    <el-main class="app-main">
      <HomeView />
    </el-main>
  </el-container>
</template>

<script setup>
import WorkspaceSelector from './components/WorkspaceSelector.vue'
import HomeView from './views/HomeView.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
}

.app-container {
  height: 100vh;
  background: #f5f7fa;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-title {
  color: white;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
}

.app-main {
  padding: 20px;
  overflow: auto;
}
</style>
