<template>
  <div class="console-panel">
    <div class="console-header">
      <h3>实时终端</h3>
      <el-button size="small" @click="clearConsole" :disabled="outputs.length === 0">
        <el-icon><Delete /></el-icon>
        清空
      </el-button>
    </div>

    <div class="console-content" ref="consoleRef">
      <div v-if="outputs.length === 0" class="console-empty">
        <el-empty description="暂无输出" :image-size="60" />
      </div>
      <div v-for="(item, index) in outputs" :key="index" class="console-line">
        <span class="timestamp">{{ formatTime(item.time) }}</span>
        <span class="output-text">{{ item.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  taskOutputs: Object
})

const outputs = ref([])
const consoleRef = ref(null)

function formatTime(time) {
  if (!time) return ''
  return new Date(time).toLocaleTimeString('zh-CN', { hour12: false })
}

function clearConsole() {
  outputs.value = []
}

watch(() => props.taskOutputs, (newOutputs) => {
  outputs.value = []
  Object.entries(newOutputs).forEach(([key, data]) => {
    if (data?.output) {
      outputs.value.push({
        time: data.lastUpdate || new Date(),
        text: `[Task ${key.slice(0, 8)}] ${data.output}`
      })
    }
  })
  nextTick(() => {
    if (consoleRef.value) {
      consoleRef.value.scrollTop = consoleRef.value.scrollHeight
    }
  })
}, { deep: true })
</script>

<style scoped>
.console-panel {
  background: #1e1e1e;
  border-radius: 8px;
  height: 100%;
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

.console-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.console-empty {
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
