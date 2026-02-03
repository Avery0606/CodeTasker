<template>
  <el-card class="task-item" :class="task.status">
    <div class="task-header">
      <el-tag :type="statusType" size="small" effect="dark">{{ statusText }}</el-tag>
      <div class="task-actions">
        <el-button size="small" circle @click="edit" :disabled="task.status === 'running'">
          <el-icon><Edit /></el-icon>
        </el-button>
        <el-button size="small" circle type="danger" @click="remove" :disabled="task.status === 'running'">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
    </div>
    <div class="task-name">{{ task.name }}</div>
    <div class="task-prompt">{{ task.prompt }}</div>
    <div class="task-time" v-if="task.startedAt || task.completedAt">
      {{ formatTime(task.startedAt || task.createdAt) }}
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  task: Object,
  index: Number
})

const emit = defineEmits(['edit', 'remove'])

const statusType = computed(() => {
  switch (props.task.status) {
    case 'pending': return 'info'
    case 'running': return 'warning'
    case 'completed': return 'success'
    case 'failed': return 'danger'
    default: return 'info'
  }
})

const statusText = computed(() => {
  switch (props.task.status) {
    case 'pending': return '等待中'
    case 'running': return '执行中'
    case 'completed': return '已完成'
    case 'failed': return '失败'
    default: return '未知'
  }
})

function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

function edit() {
  emit('edit', props.task)
}

function remove() {
  emit('remove', props.task)
}
</script>

<style scoped>
.task-item {
  margin-bottom: 10px;
  cursor: grab;
}

.task-item.running {
  border-left: 3px solid #e6a23c;
}

.task-item.completed {
  border-left: 3px solid #67c23a;
}

.task-item.failed {
  border-left: 3px solid #f56c6c;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-name {
  font-weight: 600;
  margin-bottom: 5px;
  color: #303133;
}

.task-prompt {
  font-size: 12px;
  color: #909399;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.task-time {
  font-size: 11px;
  color: #c0c4cc;
  margin-top: 8px;
}
</style>
