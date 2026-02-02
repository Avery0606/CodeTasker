<template>
  <div class="workspace-selector">
    <el-button type="primary" @click="selectWorkspace" :loading="loading">
      <el-icon><FolderOpened /></el-icon>
      {{ workspacePath ? '更换工作区' : '选择工作区' }}
    </el-button>
    <span v-if="workspacePath" class="workspace-path">{{ workspacePath }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const workspacePath = ref('')
const loading = ref(false)

async function selectWorkspace() {
  try {
    const result = await window.electronAPI?.selectDirectory?.()
    if (result?.canceled) return

    const path = result.filePaths[0]
    if (!path) return

    loading.value = true
    const res = await fetch('/api/workspace/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    })
    const data = await res.json()

    if (data.success) {
      workspacePath.value = data.path
      ElMessage.success('工作区已打开')
    } else {
      ElMessage.error(data.error || '打开工作区失败')
    }
  } catch (e) {
    ElMessage.error('选择目录失败，请确保已启动后端服务')
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await fetch('/api/workspace')
    const data = await res.json()
    if (data.path) {
      workspacePath.value = data.path
    }
  } catch (e) {
    console.log('No workspace selected')
  }
})
</script>

<style scoped>
.workspace-selector {
  display: flex;
  align-items: center;
  gap: 15px;
}

.workspace-path {
  color: white;
  font-size: 14px;
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
