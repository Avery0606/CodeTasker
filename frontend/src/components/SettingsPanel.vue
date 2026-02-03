<template>
  <div class="settings-panel">
    <el-form label-width="80px" size="small">
      <el-form-item label="并发数">
        <el-input-number v-model="concurrency" :min="1" :max="10" :disabled="isDisabled" @change="updateConcurrency" />
        <span class="setting-hint">同时执行的任务数量</span>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useTaskStore } from '../stores/taskStore'
import { useWorkspace } from '../composables/useWorkspace'

const { workspaceReady } = useWorkspace()
const taskStore = useTaskStore()
const { concurrency } = storeToRefs(taskStore)
const { setConcurrency } = taskStore

const isDisabled = computed(() => !workspaceReady.value)

async function updateConcurrency(val) {
  if (!workspaceReady.value) return
  await setConcurrency(val)
}
</script>

<style scoped>
.settings-panel {
  padding: 15px;
  background: white;
  border-radius: 8px;
  margin-bottom: 15px;
}

.setting-hint {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}
</style>
