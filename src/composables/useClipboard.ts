import { ref } from 'vue'

export function useClipboard() {
  const copied = ref(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
      return true
    } catch (error) {
      console.error('Failed to copy:', error)
      copied.value = false
      return false
    }
  }

  return {
    copied,
    copyToClipboard
  }
}