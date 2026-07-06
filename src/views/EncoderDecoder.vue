<script setup lang="ts">
import { ref, watch } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import { encode, decode } from '@/utils/encoderDecoder'
import { Key, Copy, ArrowUpDown, CheckCircle } from 'lucide-vue-next'

const inputText = ref('')
const outputText = ref('')
const conversionType = ref<'base64' | 'url' | 'unicode' | 'html' | 'hex'>('base64')
const conversionDirection = ref<'encode' | 'decode'>('encode')

const { copied, copyToClipboard } = useClipboard()
const { notification, success } = useNotification()

const conversionTypes = [
  { id: 'base64', name: 'Base64', icon: '🔐' },
  { id: 'url', name: 'URL', icon: '🔗' },
  { id: 'unicode', name: 'Unicode', icon: '📝' },
  { id: 'html', name: 'HTML实体', icon: '📄' },
  { id: 'hex', name: '十六进制', icon: '🔢' }
]

// 实时转换
watch([inputText, conversionType, conversionDirection], () => {
  if (!inputText.value.trim()) {
    outputText.value = ''
    return
  }

  if (conversionDirection.value === 'encode') {
    outputText.value = encode(conversionType.value, inputText.value)
  } else {
    outputText.value = decode(conversionType.value, inputText.value)
  }
})

const toggleDirection = () => {
  conversionDirection.value = conversionDirection.value === 'encode' ? 'decode' : 'encode'
  // 同时交换输入输出
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
}

const handleCopy = async () => {
  if (!outputText.value.trim()) return

  if (await copyToClipboard(outputText.value)) {
    success('已复制到剪贴板')
  }
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-5xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">编码转换工具</h1>
      <p class="text-text-secondary">支持Base64、URL、Unicode、HTML实体等多种编码转换</p>
    </div>

    <!-- Conversion Type Tabs -->
    <div class="glass rounded-xl p-4 mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="type in conversionTypes"
          :key="type.id"
          @click="conversionType = type.id as any"
          :class="`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
            conversionType === type.id
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <span class="text-xl">{{ type.icon }}</span>
          <span class="font-semibold">{{ type.name }}</span>
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Input Section -->
      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">
            {{ conversionDirection === 'encode' ? '原始文本' : '编码文本' }}
          </h2>
          <span class="text-sm px-3 py-1 rounded-lg bg-primary/20 text-primary">
            {{ conversionDirection === 'encode' ? '编码' : '解码' }}
          </span>
        </div>

        <textarea
          v-model="inputText"
          placeholder="输入要转换的文本..."
          class="w-full h-48 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 font-mono"
        />

        <div class="flex gap-3">
          <button
            @click="toggleDirection"
            class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-white transition-colors flex items-center gap-2"
          >
            <ArrowUpDown class="w-5 h-5" />
            <span>切换方向</span>
          </button>
        </div>
      </div>

      <!-- Output Section -->
      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">
            {{ conversionDirection === 'encode' ? '编码结果' : '解码结果' }}
          </h2>
        </div>

        <div class="relative">
          <textarea
            v-model="outputText"
            readonly
            placeholder="转换结果..."
            class="w-full h-48 p-4 rounded-lg bg-bg-secondary text-success placeholder:text-text-tertiary resize-none focus:outline-none font-mono"
          />

          <!-- Copy Button -->
          <button
            v-if="outputText.trim()"
            @click="handleCopy"
            :class="`absolute top-2 right-2 px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              copied ? 'bg-success text-white' : 'bg-bg-tertiary hover:bg-success/80 text-white'
            }`"
          >
            <CheckCircle v-if="copied" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
            <span class="text-sm">{{ copied ? '已复制' : '复制' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div
      v-if="notification"
      :class="`fixed bottom-8 right-8 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all ${
        notification.type === 'success' ? 'bg-success' : 'bg-info'
      }`"
    >
      {{ notification.message }}
    </div>
  </div>
</template>