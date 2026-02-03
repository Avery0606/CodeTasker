<template>
  <div class="home-view">
    <el-row :gutter="20">
      <el-col :span="12">
        <SettingsPanel />
        <TaskQueue ref="taskQueueRef" />
      </el-col>
      <el-col :span="12">
        <ConsolePanel :task-outputs="taskOutputsMap" :tasks="tasksFromStore" />
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import SettingsPanel from '../components/SettingsPanel.vue'
import TaskQueue from '../components/TaskQueue.vue'
import ConsolePanel from '../components/ConsolePanel.vue'
import { useTaskStore } from '../stores/taskStore'

const taskQueueRef = ref(null)
const taskStore = useTaskStore()
const { tasks: tasksFromStore, queueRunning } = storeToRefs(taskStore)
const taskOutputsMap = reactive({})

let ws = null

function connectWebSocket() {
  ws = new WebSocket('ws://localhost:3000')

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
    case 'task:started':
    case 'task:completed':
    case 'task:failed':
      taskStore.loadTasks()
      break

    case 'task:output':
      if (!taskOutputsMap[data.key]) {
        taskOutputsMap[data.key] = { output: '' }
      }
      if (data.append) {
        taskOutputsMap[data.key].output += data.output
      } else {
        taskOutputsMap[data.key].output = data.output
      }
      taskOutputsMap[data.key].lastUpdate = new Date()
      break

    case 'queue:status':
      queueRunning.value = data.running
      break
  }
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
