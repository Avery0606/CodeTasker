<template>
  <div class="console-panel">
    <div class="console-header">
      <h3>实时终端</h3>
      <div class="header-controls">
        <el-select
          v-model="selectedTaskKey"
          placeholder="请选择任务"
          size="small"
          clearable
          style="width: 200px">
          <el-option
            v-for="task in taskOptions"
            :key="task.value"
            :label="task.label"
            :value="task.value" />
        </el-select>
        <el-button size="small" @click="handleClear" :disabled="!selectedTaskKey">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>
    </div>

    <div class="console-content" ref="consoleContainerRef">
      <div v-if="!selectedTaskKey" class="console-placeholder">
        <el-empty description="请选择任务" :image-size="60" />
      </div>
      <div v-else-if="displayLines.length === 0" class="console-placeholder">
        <el-empty description="暂无输出" :image-size="60" />
      </div>
      <template v-else>
        <div v-for="(line, index) in displayLines" :key="index" class="console-line">
          <span class="timestamp">{{ formatTimestamp(line.timestamp) }}</span>
          <span class="output-text">{{ line.content }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Delete } from '@element-plus/icons-vue'

const props = defineProps({
  taskOutputs: {
    type: Object,
    default: () => ({})
  },
  tasks: {
    type: Array,
    default: () => ([])
  },
  modelValue: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedTaskKey = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
const consoleContainerRef = ref(null)

const taskOptions = computed(() => {
  return props.tasks.map(task => ({
    label: task.name,
    value: task.uniqueKey
  }))
})

const currentTaskOutput = computed(() => {
  if (!selectedTaskKey.value) return null
  return props.taskOutputs[selectedTaskKey.value] || null
})

const displayLines = computed(() => {
  const output = currentTaskOutput.value
  if (!output?.output) return []
  return [{
    timestamp: output.lastUpdate,
    content: output.output
  }]
})

function formatTimestamp(time) {
  if (!time) return ''
  return new Date(time).toLocaleTimeString('zh-CN', { hour12: false })
}

function handleClear() {
  selectedTaskKey.value = null
}
</script>

<style scoped>
.console-panel {
  background: #1e1e1e;
  border-radius: 8px;
  height: calc(90vh - 40px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.console-header {
  background: #2d2d2d;
  padding: 10px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #3d3d3d;
}

.console-header h3 {
  margin: 0;
  font-size: 14px;
  color: #e0e0e0;
}

.header-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.console-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.console-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.console-line {
  margin-bottom: 4px;
  display: flex;
  gap: 10px;
}

.timestamp {
  color: #666;
  font-size: 11px;
  white-space: nowrap;
}

.output-text {
  color: #d4d4d4;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
