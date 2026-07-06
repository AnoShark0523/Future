<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import { extractDocument, exportToMarkdown, exportToJSON } from '@/utils/documentParser'
import { FileText, Copy, Download, Trash2, CheckCircle } from 'lucide-vue-next'

const inputText = ref('')
const result = ref<any>(null)
const isProcessing = ref(false)
const exportFormat = ref<'markdown' | 'json' | 'txt'>('markdown')

const { copied, copyToClipboard } = useClipboard()
const { notification, success, error } = useNotification()

const charCount = computed(() => inputText.value.length)

const handleExtract = () => {
  if (!inputText.value.trim()) {
    error('请输入文档内容')
    return
  }

  isProcessing.value = true

  try {
    result.value = extractDocument(inputText.value)
    success('提取完成！')
  } catch (e) {
    error('提取失败，请检查输入')
    console.error(e)
  } finally {
    isProcessing.value = false
  }
}

const handleCopy = async () => {
  if (!result.value) return

  const text = exportFormat.value === 'json'
    ? exportToJSON(result.value)
    : exportToMarkdown(result.value)

  if (await copyToClipboard(text)) {
    success('已复制到剪贴板')
  }
}

const handleExport = () => {
  if (!result.value) return

  const content = exportFormat.value === 'json'
    ? exportToJSON(result.value)
    : exportToMarkdown(result.value)

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `extract-result.${exportFormat.value}`
  a.click()
  URL.revokeObjectURL(url)

  success('文件已下载')
}

const handleClear = () => {
  inputText.value = ''
  result.value = null
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-6xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">文档提取器</h1>
      <p class="text-text-secondary">智能提取文档关键信息，自动识别关键词和重要句子</p>
    </div>

    <!-- Main Content -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Input Section -->
      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">输入文档</h2>
          <span class="text-sm text-text-tertiary">字数: {{ charCount }}</span>
        </div>

        <textarea
          v-model="inputText"
          placeholder="粘贴或输入文档内容..."
          class="w-full h-64 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
        />

        <div class="flex gap-3">
          <button
            @click="handleExtract"
            :disabled="isProcessing || !inputText.trim()"
            class="gradient-btn flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText v-if="!isProcessing" class="w-5 h-5" />
            <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{{ isProcessing ? '处理中...' : '一键提取' }}</span>
          </button>

          <button
            @click="handleClear"
            class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-white transition-colors flex items-center gap-2"
          >
            <Trash2 class="w-5 h-5" />
            <span>清空</span>
          </button>
        </div>
      </div>

      <!-- Result Section -->
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">提取结果</h2>

        <div v-if="result" class="space-y-6">
          <!-- Summary -->
          <div>
            <h3 class="font-semibold text-primary mb-2">摘要</h3>
            <p class="text-text-secondary bg-bg-secondary rounded-lg p-3">{{ result.summary }}</p>
          </div>

          <!-- Keywords -->
          <div>
            <h3 class="font-semibold text-primary mb-2">关键词</h3>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="keyword in result.keywords"
                :key="keyword"
                class="px-3 py-1 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 text-white border border-primary/30"
              >
                {{ keyword }}
              </span>
            </div>
          </div>

          <!-- Key Sentences -->
          <div>
            <h3 class="font-semibold text-primary mb-2">关键句子</h3>
            <ul class="space-y-2">
              <li
                v-for="(sentence, index) in result.keySentences"
                :key="index"
                class="text-text-secondary bg-bg-secondary rounded-lg p-3 border-l-4 border-primary"
              >
                {{ sentence }}
              </li>
            </ul>
          </div>

          <!-- Export Options -->
          <div class="border-t border-white/10 pt-4">
            <div class="flex items-center gap-4 mb-3">
              <label class="text-sm font-semibold">导出格式:</label>
              <select
                v-model="exportFormat"
                class="px-3 py-1 rounded-lg bg-bg-secondary text-white focus:outline-none"
              >
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
                <option value="txt">TXT</option>
              </select>
            </div>

            <div class="flex gap-3">
              <button
                @click="handleCopy"
                class="px-4 py-2 rounded-lg bg-success hover:bg-success/80 text-white transition-colors flex items-center gap-2"
              >
                <CheckCircle v-if="copied" class="w-5 h-5" />
                <Copy v-else class="w-5 h-5" />
                <span>{{ copied ? '已复制' : '复制' }}</span>
              </button>

              <button
                @click="handleExport"
                class="px-4 py-2 rounded-lg bg-info hover:bg-info/80 text-white transition-colors flex items-center gap-2"
              >
                <Download class="w-5 h-5" />
                <span>下载</span>
              </button>
            </div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-64 text-text-tertiary">
          <p>等待提取...</p>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div
      v-if="notification"
      :class="`fixed bottom-8 right-8 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all ${
        notification.type === 'success' ? 'bg-success' :
        notification.type === 'error' ? 'bg-error' :
        notification.type === 'warning' ? 'bg-warning' :
        'bg-info'
      }`"
    >
      {{ notification.message }}
    </div>
  </div>
</template>