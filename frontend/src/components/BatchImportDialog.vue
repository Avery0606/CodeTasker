<template>
  <el-dialog v-model="visible" title="批量导入任务" width="400px" :close-on-click-modal="false">
    <el-upload
      ref="uploadRef"
      action="#"
      :auto-upload="false"
      accept=".json"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      :limit="1"
      drag
    >
      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
      <div class="el-upload__text">拖拽JSON文件到此处，或<em>点击上传</em></div>
      <template #tip>
        <div class="el-upload__tip">支持JSON文件，需包含tasks数组，每项必须有taskName和prompt</div>
      </template>
    </el-upload>

    <div v-if="taskCount > 0" class="import-summary">
      <el-alert
        :title="`共 ${taskCount} 个任务待导入${skipCount > 0 ? `（已跳过 ${skipCount} 项）` : ''}`"
        type="success"
        :closable="false"
        show-icon
      />
    </div>

    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="importTasks" :disabled="taskCount === 0" :loading="loading">
        确认导入
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'imported'])

const visible = ref(false)
const uploadRef = ref(null)
const fileRaw = ref(null)
const validTasks = ref([])
const skipCount = ref(0)
const loading = ref(false)

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val) {
    reset()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

const taskCount = computed(() => validTasks.value.length)

function reset() {
  fileRaw.value = null
  validTasks.value = []
  skipCount.value = 0
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

function close() {
  visible.value = false
}

function handleFileChange(file) {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = JSON.parse(e.target.result)
      if (!content.tasks || !Array.isArray(content.tasks)) {
        ElMessage.error('JSON必须包含 tasks 数组')
        handleFileRemove()
        return
      }

      const valid = []
      let skipped = 0
      for (const item of content.tasks) {
        if (item.taskName && item.prompt && typeof item.taskName === 'string' && typeof item.prompt === 'string') {
          valid.push(item)
        } else {
          skipped++
        }
      }

      if (valid.length === 0) {
        ElMessage.error('没有有效的任务（每项必须包含taskName和prompt）')
        handleFileRemove()
        return
      }

      fileRaw.value = file.raw
      validTasks.value = valid
      skipCount.value = skipped

      if (skipped > 0) {
        ElMessage.warning(`共${valid.length}个任务，${skipped}项因缺少字段已跳过`)
      } else {
        ElMessage.success(`共${valid.length}个任务待导入`)
      }
    } catch (e) {
      ElMessage.error('JSON解析失败，请检查文件格式')
      handleFileRemove()
    }
  }
  reader.readAsText(file.raw)
}

function handleFileRemove() {
  fileRaw.value = null
  validTasks.value = []
  skipCount.value = 0
}

async function importTasks() {
  if (validTasks.value.length === 0) return

  loading.value = true
  try {
    const res = await fetch('/api/tasks/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tasks: validTasks.value })
    })

    const data = await res.json()
    if (data.success) {
      const successCount = data.results.filter(r => r.success).length
      ElMessage.success(`成功导入 ${successCount} 个任务`)
      emit('imported')
      close()
    } else {
      ElMessage.error(data.error || '批量导入失败')
    }
  } catch (e) {
    ElMessage.error('批量导入失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.import-summary {
  margin-top: 16px;
}
</style>
