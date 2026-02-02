<template>
  <div class="home-view">
    <el-row :gutter="20">
      <el-col :span="12">
        <SettingsPanel v-model="concurrency" />
        <TaskQueue
          ref="taskQueueRef"
          :queue-running="queueRunning"
          :concurrency="concurrency"
          @queue-change="onQueueChange"
        />
      </el-col>
      <el-col :span="12">
        <ConsolePanel :task-outputs="taskOutputs" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import SettingsPanel from '../components/SettingsPanel.vue'
import TaskQueue from '../components/TaskQueue.vue'
import ConsolePanel from '../components/ConsolePanel.vue'

const taskQueueRef = ref(null)
const queueRunning = ref(false)
const concurrency = ref(1)
const taskOutputs = reactive({})

let ws = null

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const host = window.location.hostname
  const port = '3000'

  ws = new WebSocket(`${protocol}//${host}:${port}`)

  ws.onopen = () => {
    console.log('WebSocket connected')
  }

  ws.onmessage = (event) => {
    const { event: eventName, data } = JSON.parse(event.data)
    handleWebSocketMessage(eventName, data)
  }

  ws.onclose = () => {
    console.log('WebSocket disconnected, reconnecting...')
    setTimeout(connectWebSocket, 3000)
  }

  ws.onerror = (err) => {
    console.error('WebSocket error:', err)
  }
}

function handleWebSocketMessage(eventName, data) {
  switch (eventName) {
    case 'task:created':
    case 'task:updated':
    case 'task:deleted':
    case 'task:status':
    case 'tasks:reordered':
      taskQueueRef.value?.loadTasks()
      break

    case 'task:output':
      if (!taskOutputs[data.key]) {
        taskOutputs[data.key] = { output: '' }
      }
      if (data.append) {
        taskOutputs[data.key].output += data.output
      } else {
        taskOutputs[data.key].output = data.output
      }
      taskOutputs[data.key].lastUpdate = new Date()
      break

    case 'task:started':
      if (taskQueueRef.value) {
        taskQueueRef.value.loadTasks()
      }
      break

    case 'task:completed':
    case 'task:failed':
      if (taskQueueRef.value) {
        taskQueueRef.value.loadTasks()
      }
      break

    case 'queue:status':
      queueRunning.value = data.running
      break
  }
}

function onQueueChange(running) {
  queueRunning.value = running
}

onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
})
</script>

<style scoped>
.home-view {
  height: 100%;
}
</style>
