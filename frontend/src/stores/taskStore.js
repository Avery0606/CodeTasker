import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTaskStore = defineStore('tasks', () => {
  const tasks = ref([])
  const workspacePath = ref('')
  const queueRunning = ref(false)
  const concurrency = ref(1)

  const localTasks = computed(() => [...tasks.value])

  async function loadTasks() {
    try {
      const res = await fetch('/api/tasks')
      const data = await res.json()
      tasks.value = data.tasks || []
    } catch (e) {
      console.error('Load tasks failed:', e)
    }
  }

  async function openWorkspace(path) {
    try {
      const res = await fetch('/api/workspace/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      })
      const data = await res.json()
      if (data.success) {
        workspacePath.value = data.path
        tasks.value = data.tasks || []
        return true
      }
      return false
    } catch (e) {
      console.error('Open workspace failed:', e)
      return false
    }
  }

  async function addTask(name, prompt) {
    try {
      const res = await fetch('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, prompt })
      })
      const task = await res.json()
      tasks.value.push(task)
      return task
    } catch (e) {
      console.error('Add task failed:', e)
      return null
    }
  }

  async function updateTask(key, updates) {
    try {
      const res = await fetch(`/api/tasks/${key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const task = await res.json()
      const index = tasks.value.findIndex(t => t.uniqueKey === key)
      if (index !== -1) {
        tasks.value[index] = task
      }
      return task
    } catch (e) {
      console.error('Update task failed:', e)
      return null
    }
  }

  async function deleteTask(key) {
    try {
      await fetch(`/api/tasks/${key}`, { method: 'DELETE' })
      tasks.value = tasks.value.filter(t => t.uniqueKey !== key)
      return true
    } catch (e) {
      console.error('Delete task failed:', e)
      return false
    }
  }

  async function reorderTasks(orderedKeys) {
    try {
      await fetch('/api/tasks/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedKeys })
      })
      tasks.value.sort((a, b) => {
        return a.order - b.order
      })
      return true
    } catch (e) {
      console.error('Reorder tasks failed:', e)
      return false
    }
  }

  function updateLocalTasks(newTasks) {
    tasks.value = [...newTasks]
  }

  async function startQueue() {
    try {
      await fetch('/api/queue/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurrency: concurrency.value })
      })
      queueRunning.value = true
      return true
    } catch (e) {
      console.error('Start queue failed:', e)
      return false
    }
  }

  async function stopQueue() {
    try {
      await fetch('/api/queue/stop', { method: 'POST' })
      queueRunning.value = false
      return true
    } catch (e) {
      console.error('Stop queue failed:', e)
      return false
    }
  }

  async function setConcurrency(val) {
    concurrency.value = val
    try {
      await fetch('/api/queue/concurrency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurrency: val })
      })
      return true
    } catch (e) {
      console.error('Set concurrency failed:', e)
      return false
    }
  }

  return {
    tasks,
    workspacePath,
    queueRunning,
    concurrency,
    localTasks,
    loadTasks,
    openWorkspace,
    addTask,
    updateTask,
    deleteTask,
    reorderTasks,
    updateLocalTasks,
    startQueue,
    stopQueue,
    setConcurrency
  }
})
