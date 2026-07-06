import { ref } from 'vue'

interface Notification {
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

export function useNotification() {
  const notification = ref<Notification | null>(null)

  const showNotification = (type: Notification['type'], message: string, duration = 3000) => {
    notification.value = { type, message, duration }
    setTimeout(() => {
      notification.value = null
    }, duration)
  }

  const success = (message: string) => showNotification('success', message)
  const error = (message: string) => showNotification('error', message)
  const info = (message: string) => showNotification('info', message)
  const warning = (message: string) => showNotification('warning', message)

  return {
    notification,
    showNotification,
    success,
    error,
    info,
    warning
  }
}