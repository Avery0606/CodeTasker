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
import { ref, computed } from 'vue'
import { useWorkspace } from '../composables/useWorkspace'

const { workspaceReady } = useWorkspace()

const props = defineProps({
  modelValue: Number,
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const concurrency = ref(props.modelValue || 1)
const isDisabled = computed(() => props.disabled || !workspaceReady.value)

async function updateConcurrency(val) {
  if (!workspaceReady.value) return
  try {
    await fetch('/api/queue/concurrency', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concurrency: val })
    })
    emit('update:modelValue', val)
  } catch (e) {
    console.error('Update concurrency failed:', e)
  }
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
