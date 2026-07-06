<script setup lang="ts">
import { ref } from 'vue'
import { useNotification } from '@/composables/useNotification'
import { useClipboard } from '@/composables/useClipboard'
import { diffText, countDiffLines, exportDiffReport } from '@/utils/textDiffer'
import { GitCompare, CheckCircle, Copy, Download, X } from 'lucide-vue-next'

const leftText = ref('')
const rightText = ref('')
const diffResult = ref<any>(null)
const isComparing = ref(false)
const ignoreWhitespace = ref(false)
const ignoreCase = ref(false)

const { notification, success, error } = useNotification()
const { copied, copyToClipboard } = useClipboard()

const handleCompare = () => {
  if (!leftText.value.trim() || !rightText.value.trim()) {
    error('请输入要对比的两个文本')
    return
  }

  isComparing.value = true

  try {
    // 处理忽略选项
    let processedLeft = leftText.value
    let processedRight = rightText.value

    if (ignoreWhitespace.value) {
      processedLeft = processedLeft.replace(/\s+/g, ' ')
      processedRight = processedRight.replace(/\s+/g, ' ')
    }

    if (ignoreCase.value) {
      processedLeft = processedLeft.toLowerCase()
      processedRight = processedRight.toLowerCase()
    }

    // 执行对比
    const result = diffText(processedLeft, processedRight)
    diffResult.value = result

    success('对比完成！')
  } catch (e: any) {
    error(e.message || '对比失败')
    console.error(e)
  } finally {
    isComparing.value = false
  }
}

const handleClear = () => {
  leftText.value = ''
  rightText.value = ''
  diffResult.value = null
}

const handleCopyReport = async () => {
  if (!diffResult.value) return

  const report = exportDiffReport(leftText.value, rightText.value, diffResult.value)
  if (await copyToClipboard(report)) {
    success('对比报告已复制')
  }
}

const handleDownloadReport = () => {
  if (!diffResult.value) return

  const report = exportDiffReport(leftText.value, rightText.value, diffResult.value)
  const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'text-diff-report.md'
  a.click()
  URL.revokeObjectURL(url)

  success('对比报告已下载')
}

const getLineColor = (line: any): string => {
  if (line.added) return 'bg-success/20 border-l-4 border-success'
  if (line.removed) return 'bg-error/20 border-l-4 border-error'
  return 'bg-bg-secondary'
}

const getTextColor = (line: any): string => {
  if (line.added) return 'text-success'
  if (line.removed) return 'text-error'
  return 'text-white'
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-6xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">文本对比工具</h1>
      <p class="text-text-secondary">并排显示差异，高亮对比结果，支持多种对比模式</p>
    </div>

    <!-- Options -->
    <div class="glass rounded-xl p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="ignoreWhitespace"
            type="checkbox"
            class="w-4 h-4 rounded"
          />
          <span class="text-sm text-text-secondary">忽略空格差异</span>
        </label>

        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="ignoreCase"
            type="checkbox"
            class="w-4 h-4 rounded"
          />
          <span class="text-sm text-text-secondary">忽略大小写</span>
        </label>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <!-- Left Text -->
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">文本A（原始）</h2>
        <textarea
          v-model="leftText"
          placeholder="输入原始文本..."
          class="w-full h-48 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none font-mono"
        />
      </div>

      <!-- Right Text -->
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">文本B（修改）</h2>
        <textarea
          v-model="rightText"
          placeholder="输入修改后的文本..."
          class="w-full h-48 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none font-mono"
        />
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3 mb-6">
      <button
        @click="handleCompare"
        :disabled="isComparing || !leftText.trim() || !rightText.trim()"
        class="gradient-btn flex-1 disabled:opacity-50"
      >
        <GitCompare v-if="!isComparing" class="w-5 h-5 inline mr-2" />
        <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
        <span>{{ isComparing ? '对比中...' : '开始对比' }}</span>
      </button>

      <button
        @click="handleClear"
        class="px-6 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-white transition-colors flex items-center gap-2"
      >
        <X class="w-5 h-5" />
        <span>清空</span>
      </button>
    </div>

    <!-- Result -->
    <div v-if="diffResult" class="space-y-6">
      <!-- Stats -->
      <div class="glass rounded-xl p-4">
        <div class="flex items-center gap-2 mb-3">
          <CheckCircle class="w-6 h-6 text-success" />
          <h2 class="text-xl font-semibold">对比结果</h2>
        </div>

        <div class="grid grid-cols-4 gap-3">
          <div class="p-3 rounded-lg bg-bg-secondary text-center">
            <p class="text-text-tertiary text-xs mb-1">总计</p>
            <p class="text-white font-bold">
              {{ diffResult.stats.added + diffResult.stats.removed + diffResult.stats.unchanged }}
            </p>
          </div>

          <div class="p-3 rounded-lg bg-success/20 text-center">
            <p class="text-success text-xs mb-1">新增</p>
            <p class="text-success font-bold">{{ diffResult.stats.added }}</p>
          </div>

          <div class="p-3 rounded-lg bg-error/20 text-center">
            <p class="text-error text-xs mb-1">删除</p>
            <p class="text-error font-bold">{{ diffResult.stats.removed }}</p>
          </div>

          <div class="p-3 rounded-lg bg-bg-secondary text-center">
            <p class="text-text-tertiary text-xs mb-1">未改</p>
            <p class="text-white font-bold">{{ diffResult.stats.unchanged }}</p>
          </div>
        </div>
      </div>

      <!-- Diff Display -->
      <div class="grid md:grid-cols-2 gap-6">
        <!-- Left Diff -->
        <div class="glass rounded-xl p-6">
          <h3 class="font-semibold mb-4">原始文本（含标记）</h3>
          <div class="space-y-1">
            <div
              v-for="(line, index) in diffResult.leftLines"
              :key="index"
              :class="['p-2 rounded font-mono', getLineColor(line)]"
            >
              <pre :class="getTextColor(line)">{{ line.value }}</pre>
            </div>
          </div>
        </div>

        <!-- Right Diff -->
        <div class="glass rounded-xl p-6">
          <h3 class="font-semibold mb-4">修改文本（含标记）</h3>
          <div class="space-y-1">
            <div
              v-for="(line, index) in diffResult.rightLines"
              :key="index"
              :class="['p-2 rounded font-mono', getLineColor(line)]"
            >
              <pre :class="getTextColor(line)">{{ line.value }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Actions -->
      <div class="glass rounded-xl p-4">
        <div class="flex gap-3">
          <button
            @click="handleCopyReport"
            class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-white transition-colors flex items-center gap-2"
          >
            <Copy class="w-5 h-5" />
            <span>{{ copied ? '已复制' : '复制报告' }}</span>
          </button>

          <button
            @click="handleDownloadReport"
            class="px-4 py-2 rounded-lg bg-info hover:bg-info/80 text-white transition-colors flex items-center gap-2"
          >
            <Download class="w-5 h-5" />
            <span>下载报告</span>
          </button>
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