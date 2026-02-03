<template>
  <el-dialog v-model="visible" :title="isEdit ? '编辑任务' : '新建任务'" width="500px">
    <el-form :model="form" label-width="80px">
      <el-form-item label="任务名" required>
        <el-input v-model="form.name" placeholder="输入任务名称" maxlength="100" show-word-limit />
      </el-form-item>
      <el-form-item label="AI提示词" required>
        <el-input
          v-model="form.prompt"
          type="textarea"
          :rows="6"
          placeholder="描述要让AI完成的任务"
          maxlength="2000"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="save" :loading="saving">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  modelValue: Boolean,
  task: Object
})

const emit = defineEmits(['update:modelValue', 'saved'])

const visible = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const form = ref({
  name: '',
  prompt: ''
})

watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.task) {
    isEdit.value = true
    form.value = { name: props.task.name, prompt: props.task.prompt }
  } else {
    isEdit.value = false
    form.value = { name: '', prompt: '' }
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

async function save() {
  if (!form.value.name.trim() || !form.value.prompt.trim()) {
    ElMessage.warning('请填写完整信息')
    return
  }

  saving.value = true
  try {
    const url = isEdit.value
      ? `/api/tasks/${props.task.uniqueKey}`
      : '/api/tasks/create'
    const method = isEdit.value ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })

    if (!res.ok) throw new Error('保存失败')

    ElMessage.success(isEdit.value ? '任务已更新' : '任务已创建')
    emit('saved')
    visible.value = false
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}
</script>
