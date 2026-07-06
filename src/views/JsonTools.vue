<script setup lang="ts">
import { ref } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import { Braces, Copy, CheckCircle, Minimize2, Maximize2, Check } from 'lucide-vue-next'

const inputText = ref('')
const outputText = ref('')
const error = ref<string | null>(null)

const { copied, copyToClipboard } = useClipboard()
const { notification, success, showError } = useNotification()

const handleFormat = () => {
  error.value = null
  if (!inputText.value.trim()) {
    showError('请输入JSON内容')
    return
  }

  try {
    const parsed = JSON.parse(inputText.value)
    outputText.value = JSON.stringify(parsed, null, 2)
    success('格式化成功！')
  } catch (e: any) {
    error.value = `JSON格式错误: ${e.message}`
    showError(error.value)
  }
}

const handleMinify = () => {
  error.value = null
  if (!inputText.value.trim()) {
    showError('请输入JSON内容')
    return
  }

  try {
    const parsed = JSON.parse(inputText.value)
    outputText.value = JSON.stringify(parsed)
    success('压缩成功！')
  } catch (e: any) {
    error.value = `JSON格式错误: ${e.message}`
    showError(error.value)
  }
}

const handleValidate = () => {
  error.value = null
  if (!inputText.value.trim()) {
    showError('请输入JSON内容')
    return
  }

  try {
    JSON.parse(inputText.value)
    success('JSON格式正确！')
    outputText.value = '✓ JSON格式验证通过'
  } catch (e: any) {
    error.value = `JSON格式错误: ${e.message}`
    showError(error.value)
    outputText.value = `✗ ${error.value}`
  }
}

const handleCopy = async () => {
  if (!outputText.value.trim() || outputText.value.startsWith('✓') || outputText.value.startsWith('✗')) return

  if (await copyToClipboard(outputText.value)) {
    success('已复制到剪贴板')
  }
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-6xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">JSON工具箱</h1>
      <p class="text-text-secondary">JSON格式化、压缩、校验，实时语法高亮</p>
    </div>

    <!-- Main Content -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Input Section -->
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">输入JSON</h2>

        <textarea
          v-model="inputText"
          placeholder="粘贴JSON内容..."
          class="w-full h-64 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 font-mono"
        />

        <!-- Action Buttons -->
        <div class="flex flex-wrap gap-3">
          <button
            @click="handleFormat"
            class="gradient-btn flex items-center gap-2"
          >
            <Maximize2 class="w-5 h-5" />
            <span>格式化</span>
          </button>

          <button
            @click="handleMinify"
            class="px-4 py-2 rounded-lg bg-warning hover:bg-warning/80 text-white transition-colors flex items-center gap-2"
          >
            <Minimize2 class="w-5 h-5" />
            <span>压缩</span>
          </button>

          <button
            @click="handleValidate"
            class="px-4 py-2 rounded-lg bg-success hover:bg-success/80 text-white transition-colors flex items-center gap-2"
          >
            <Check class="w-5 h-5" />
            <span>校验</span>
          </button>
        </div>
      </div>

      <!-- Output Section -->
      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">结果</h2>
          <button
            v-if="outputText && !outputText.startsWith('✓') && !outputText.startsWith('✗')"
            @click="handleCopy"
            :class="`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              copied ? 'bg-success text-white' : 'bg-bg-tertiary hover:bg-success/80 text-white'
            }`"
          >
            <CheckCircle v-if="copied" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
            <span class="text-sm">{{ copied ? '已复制' : '复制' }}</span>
          </button>
        </div>

        <textarea
          v-model="outputText"
          readonly
          placeholder="处理结果..."
          :class="`w-full h-64 p-4 rounded-lg bg-bg-secondary resize-none focus:outline-none font-mono ${
            outputText.startsWith('✓') ? 'text-success' :
            outputText.startsWith('✗') ? 'text-error' :
            'text-white placeholder:text-text-tertiary'
          }`"
        />

        <!-- Error Display -->
        <div v-if="error" class="mt-4 p-3 rounded-lg bg-error/20 border border-error/30 text-error">
          {{ error }}
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div
      v-if="notification"
      :class="`fixed bottom-8 right-8 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all ${
        notification.type === 'success' ? 'bg-success' :
        notification.type === 'error' ? 'bg-error' :
        'bg-info'
      }`"
    >
      {{ notification.message }}
    </div>
  </div>
</template>