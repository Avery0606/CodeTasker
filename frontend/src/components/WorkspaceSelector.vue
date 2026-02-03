<template>
  <div class="workspace-selector">
    <el-input
      v-if="!workspacePath"
      v-model="pathInput"
      placeholder="输入目录路径，如 D:\project"
      style="width: 280px"
      @keyup.enter="confirmWorkspace"
    />
    <el-button type="primary" @click="confirmWorkspace" :loading="loading">
      <el-icon><FolderOpened /></el-icon>
      {{ workspacePath ? '更换工作区' : '确定' }}
    </el-button>
    <span v-if="workspacePath" class="workspace-path">{{ workspacePath }}</span>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useWorkspace } from '../composables/useWorkspace'
import { useTaskStore } from '../stores/taskStore'

const { workspacePath, setWorkspace } = useWorkspace()
const taskStore = useTaskStore()
const pathInput = ref('')
const loading = ref(false)

async function confirmWorkspace() {
  const path = pathInput.value.trim()
  if (!path) {
    ElMessage.warning('请输入目录路径')
    return
  }

  loading.value = true

  try {
    const res = await fetch('/api/workspace/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`HTTP ${res.status}: ${errorText}`)
    }

    const data = await res.json()

    if (data.success) {
      setWorkspace(data.path)
      await taskStore.loadTasks()
      pathInput.value = ''
      ElMessage.success('工作区已打开')
    } else {
      ElMessage.error(data.error || '打开工作区失败')
    }
  } catch (e) {
    ElMessage.error(`选择目录失败: ${e.message}`)
    console.error('Workspace selection error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await fetch('/api/workspace')
    const data = await res.json()
    if (data.path) {
      setWorkspace(data.path)
      await taskStore.loadTasks()
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
