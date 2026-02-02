import { ref, readonly } from 'vue'

const workspacePath = ref('')
const workspaceReady = ref(false)

function setWorkspace(path) {
  workspacePath.value = path
  workspaceReady.value = !!path
}

function clearWorkspace() {
  workspacePath.value = ''
  workspaceReady.value = false
}

export function useWorkspace() {
  return {
    workspacePath: readonly(workspacePath),
    workspaceReady: readonly(workspaceReady),
    setWorkspace,
    clearWorkspace
  }
}
