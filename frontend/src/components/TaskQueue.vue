<template>
  <div class="task-queue">
    <div class="queue-header">
      <h3>任务队列</h3>
      <div class="queue-actions">
        <el-button type="primary" size="small" @click="createTask" :disabled="!workspaceReady">
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
        <el-button
          type="success"
          size="small"
          @click="startQueue"
          :loading="queueRunning"
          :disabled="!workspaceReady || tasks.length === 0"
        >
          <el-icon><VideoPlay /></el-icon>
          {{ queueRunning ? '执行中...' : '全部执行' }}
        </el-button>
        <el-button
          type="danger"
          size="small"
          @click="stopQueue"
          :disabled="!queueRunning"
        >
          <el-icon><VideoPause /></el-icon>
          停止
        </el-button>
      </div>
    </div>

    <div class="task-list" ref="listRef">
      <draggable
        v-model="localTasks"
        item-key="uniqueKey"
        handle=".task-item"
        ghost-class="ghost"
        @end="onDragEnd"
        :disabled="queueRunning"
      >
        <template #item="{ element, index }">
          <TaskItem
            :task="element"
            :index="index"
            @edit="editTask"
            @remove="removeTask"
          />
        </template>
      </draggable>

      <el-empty v-if="tasks.length === 0" description="暂无任务，请新建任务" />
    </div>

    <TaskEditor v-model="editorVisible" :task="editingTask" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import TaskItem from './TaskItem.vue'
import TaskEditor from './TaskEditor.vue'
import draggable from 'vuedraggable'
import { useWorkspace } from '../composables/useWorkspace'

const { workspaceReady } = useWorkspace()

const props = defineProps({
  queueRunning: Boolean,
  concurrency: Number
})

const emit = defineEmits(['queue-change'])

const tasks = ref([])
const localTasks = ref([])
const editorVisible = ref(false)
const editingTask = ref(null)
const listRef = ref(null)

async function loadTasks() {
  try {
    const res = await fetch('/api/tasks')
    const data = await res.json()
    tasks.value = data.tasks || []
    localTasks.value = [...tasks.value]
  } catch (e) {
    console.error('Load tasks failed:', e)
  }
}

watch(tasks, (newTasks) => {
  localTasks.value = [...newTasks]
}, { deep: true })

function createTask() {
  editingTask.value = null
  editorVisible.value = true
}

function editTask(task) {
  editingTask.value = task
  editorVisible.value = true
}

async function removeTask(task) {
  try {
    await ElMessageBox.confirm('确定要删除该任务吗？', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await fetch(`/api/tasks/${task.uniqueKey}`, { method: 'DELETE' })
    if (res.ok) {
      ElMessage.success('已删除')
      loadTasks()
    }
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

async function onDragEnd() {
  const orderedKeys = localTasks.value.map(t => t.uniqueKey)
  try {
    await fetch('/api/tasks/order', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedKeys })
    })
    tasks.value = [...localTasks.value]
  } catch (e) {
    ElMessage.error('排序保存失败')
    loadTasks()
  }
}

async function startQueue() {
  try {
    const res = await fetch('/api/queue/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concurrency: props.concurrency })
    })
    if (res.ok) {
      emit('queue-change', true)
      loadTasks()
    }
  } catch (e) {
    ElMessage.error('启动失败')
  }
}

async function stopQueue() {
  try {
    await fetch('/api/queue/stop', { method: 'POST' })
    emit('queue-change', false)
  } catch (e) {
    ElMessage.error('停止失败')
  }
}

onMounted(loadTasks)

defineExpose({ loadTasks })
</script>

<style scoped>
.task-queue {
  background: white;
  border-radius: 8px;
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.queue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
}

.queue-header h3 {
  margin: 0;
  font-size: 16px;
  color: #303133;
}

.queue-actions {
  display: flex;
  gap: 8px;
}

.task-list {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
}

.ghost {
  opacity: 0.5;
  background: #f5f7fa;
}
</style>
