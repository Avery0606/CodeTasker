import { ref, onUnmounted } from 'vue'

export function useWebSocket(url) {
  const ws = ref(null)
  const connected = ref(false)
  const messages = ref([])

  function connect() {
    ws.value = new WebSocket(url)

    ws.value.onopen = () => {
      connected.value = true
      console.log('WebSocket connected')
    }

    ws.value.onclose = () => {
      connected.value = false
      console.log('WebSocket disconnected')
    }

    ws.value.onerror = (err) => {
      console.error('WebSocket error:', err)
    }

    ws.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        messages.value.push(data)
      } catch (e) {
        console.error('Parse message failed:', e)
      }
    }
  }

  function send(event, data) {
    if (ws.value && ws.value.readyState === 1) {
      ws.value.send(JSON.stringify({ event, data }))
    }
  }

  function disconnect() {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  onUnmounted(disconnect)

  return {
    ws,
    connected,
    messages,
    connect,
    send,
    disconnect
  }
}
