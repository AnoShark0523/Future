<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import {
  extractWithKeywords,
  extractAutomatically,
  highlightText,
  getStatistics
} from '@/utils/documentParser'
import { extractTextFromPDF } from '@/utils/pdfImport'
import { FileText, Copy, Download, Trash2, CheckCircle, Search, Sparkles } from 'lucide-vue-next'

const inputText = ref('')
const customKeywords = ref('')
const result = ref<any>(null)
const isProcessing = ref(false)
const exportFormat = ref<'markdown' | 'json' | 'txt'>('markdown')
const extractMode = ref<'keyword' | 'auto'>('keyword')
const similarityLevel = ref<'strict' | 'medium' | 'loose'>('medium')

const { copied, copyToClipboard } = useClipboard()
const { notification, success, error } = useNotification()

const charCount = computed(() => inputText.value.length)

const handleExtract = () => {
  if (!inputText.value.trim()) {
    error('请输入文档内容')
    return
  }

  if (extractMode.value === 'keyword' && !customKeywords.value.trim()) {
    error('请输入要提取的关键字')
    return
  }

  isProcessing.value = true

  try {
    let extracted: any
    
    if (extractMode.value === 'keyword') {
      // 关键字提取模式
      const keywords = customKeywords.value
        .split(/[,，\s\n]+/)
        .map(k => k.trim())
        .filter(k => k.length > 0)

      if (keywords.length === 0) {
        error('请输入有效的关键字')
        isProcessing.value = false
        return
      }

      extracted = extractWithKeywords(inputText.value, keywords, similarityLevel.value)
    } else {
      // 智能提取模式
      extracted = extractAutomatically(inputText.value)
    }

    // 生成高亮文本
    const highlightedText = highlightText(inputText.value, extracted.sentences)

    // 获取统计信息
    const statistics = getStatistics(inputText.value)

    result.value = {
      mode: extractMode.value,
      keywords: extractMode.value === 'keyword' ? customKeywords.value.split(/[,，\s\n]+/).filter(k => k.trim()) : [],
      extractedSentences: extracted.sentences,
      originalText: inputText.value,
      highlightedText: highlightedText,
      paragraphGroups: extracted.paragraphGroups,
      statistics,
      matchScore: extracted.matchScore || 0
    }

    success(`提取完成！找到 ${extracted.sentences.length} 个相关句子`)
  } catch (e) {
    error('提取失败，请检查输入')
    console.error(e)
  } finally {
    isProcessing.value = false
  }
}

const handleCopy = async () => {
  if (!result.value) return

  let text = '文档提取结果\n\n'
  text += `提取模式：${result.value.mode === 'keyword' ? '关键字提取' : '智能提取'}\n`
  if (result.value.keywords.length > 0) {
    text += `关键字：${result.value.keywords.join(', ')}\n`
  }
  text += `\n提取的句子（共${result.value.extractedSentences.length}句）：\n\n`
  
  result.value.extractedSentences.forEach((sentence: string, index: number) => {
    text += `${index + 1}. ${sentence}\n`
  })

  if (await copyToClipboard(text)) {
    success('已复制到剪贴板')
  }
}

const handleExport = () => {
  if (!result.value) return

  let content = ''
  const timestamp = new Date().toLocaleString('zh-CN')

  switch (exportFormat.value) {
    case 'json':
      content = JSON.stringify({
        mode: result.value.mode,
        keywords: result.value.keywords,
        extractedSentences: result.value.extractedSentences,
        statistics: result.value.statistics,
        exportedAt: timestamp
      }, null, 2)
      break
    case 'txt':
      content = `文档提取结果 - ${timestamp}\n\n`
      content += `提取模式：${result.value.mode === 'keyword' ? '关键字提取' : '智能提取'}\n`
      if (result.value.keywords.length > 0) {
        content += `关键字：${result.value.keywords.join(', ')}\n`
      }
      content += `\n提取的句子（共${result.value.extractedSentences.length}句）：\n\n`
      result.value.extractedSentences.forEach((sentence: string, index: number) => {
        content += `${index + 1}. ${sentence}\n`
      })
      break
    default:
      content = `# 文档提取结果\n\n`
      content += `**提取时间：** ${timestamp}\n\n`
      content += `## 提取模式\n\n`
      content += `${result.value.mode === 'keyword' ? '关键字提取' : '智能提取'}\n\n`
      if (result.value.keywords.length > 0) {
        content += `## 关键字\n\n`
        result.value.keywords.forEach((keyword: string) => {
          content += `- ${keyword}\n`
        })
        content += `\n`
      }
      content += `## 提取的句子\n\n`
      result.value.extractedSentences.forEach((sentence: string, index: number) => {
        content += `${index + 1}. ${sentence}\n\n`
      })
  }

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
  customKeywords.value = ''
  result.value = null
}

// 处理文件上传
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  // 检查文件类型（支持txt、md、pdf、docx）
  const fileExtension = file.name.split('.').pop()?.toLowerCase()

  if (!['txt', 'md', 'pdf', 'docx'].includes(fileExtension || '')) {
    error('仅支持 .txt, .md, .pdf, .docx 格式的文件')
    return
  }

  isProcessing.value = true

  try {
    let text = ''

    if (fileExtension === 'txt' || fileExtension === 'md') {
      // 读取文本文件
      text = await readFileAsText(file)
    } else if (fileExtension === 'pdf') {
      // 读取PDF文档
      try {
        text = await extractTextFromPDF(file)
      } catch (err: any) {
        console.error('PDF文档处理失败:', err)
        error(err.message || 'PDF文档解析失败')
        isProcessing.value = false
        target.value = ''
        return
      }
    } else if (fileExtension === 'docx') {
      // 读取Word文档
      try {
        text = await readWordFile(file)
      } catch (err: any) {
        console.error('Word文档处理失败:', err)
        error(err.message || 'Word文档解析失败')
        isProcessing.value = false
        target.value = ''
        return
      }
    }
    
    if (!text.trim()) {
      error('文档内容为空')
      isProcessing.value = false
      target.value = ''
      return
    }
    
    inputText.value = text
    success(`已导入文件：${file.name}（${text.length}字符）`)
  } catch (e: any) {
    error(e.message || '文件读取失败，请重试')
    console.error(e)
  } finally {
    isProcessing.value = false
    // 清空文件输入
    target.value = ''
  }
}

// 读取文件为文本
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      resolve(text)
    }
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    reader.readAsText(file)
  })
}

// 读取Word文档
const readWordFile = async (file: File): Promise<string> => {
  try {
    // 动态导入mammoth库
    const mammoth = await import('mammoth')
    
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer as Buffer })
    
    if (!result.value.trim()) {
      throw new Error('Word文档内容为空')
    }
    
    return result.value
  } catch (error: any) {
    console.error('Word文档解析错误:', error)
    throw new Error('Word文档解析失败: ' + (error.message || '未知错误'))
  }
}

// 处理粘贴事件
const handlePaste = async (e: ClipboardEvent) => {
  // 如果粘贴目标是一个可编辑元素（输入框、文本域等），不拦截，让默认行为生效
  const target = e.target as HTMLElement
  if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
    return
  }
  const text = e.clipboardData?.getData('text')
  if (text) {
    inputText.value = text
    success('已粘贴文本内容')
  }
}

// 添加粘贴事件监听
onMounted(() => {
  document.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste)
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-7xl">
    <!-- 标题 -->
    <div class="text-center mb-6 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">文档提取器</h1>
      <p class="text-text-secondary text-sm">智能提取文档中的关键信息</p>
    </div>

    <!-- 提取模式选择 -->
    <div class="glass rounded-xl p-4 mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <span class="text-sm font-semibold">提取模式：</span>
        <button
          @click="extractMode = 'keyword'; result = null"
          :class="[
            'px-4 py-2 rounded-lg transition-all flex items-center gap-2',
            extractMode === 'keyword' 
              ? 'bg-gradient-to-r from-primary to-secondary text-white' 
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          ]"
        >
          <Search class="w-4 h-4" />
          <span class="text-sm">关键字提取</span>
        </button>
        <button
          @click="extractMode = 'auto'; result = null"
          :class="[
            'px-4 py-2 rounded-lg transition-all flex items-center gap-2',
            extractMode === 'auto' 
              ? 'bg-gradient-to-r from-primary to-secondary text-white' 
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          ]"
        >
          <Sparkles class="w-4 h-4" />
          <span class="text-sm">智能提取</span>
        </button>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="glass rounded-xl p-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-lg font-semibold">文档内容</h2>
        <span class="text-xs text-text-tertiary">{{ charCount }} 字</span>
      </div>
      <textarea
        v-model="inputText"
        placeholder="粘贴或输入文档内容..."
        class="w-full h-40 md:h-56 p-3 rounded-lg bg-bg-secondary text-white text-sm placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
      />
      
      <!-- 文件上传 -->
      <div class="flex items-center gap-3">
        <label class="flex-1">
          <input
            type="file"
            accept=".txt,.md,.pdf,.docx"
            @change="handleFileUpload"
            class="hidden"
          />
          <div class="px-4 py-2 rounded-lg bg-bg-tertiary hover:bg-primary/20 border border-white/10 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span class="text-sm">导入文档</span>
          </div>
        </label>
        <div class="text-xs text-text-tertiary">
          支持 .txt, .md, .pdf, .docx 格式
        </div>
      </div>
    </div>

    <!-- 关键字输入（仅在关键字模式下显示） -->
    <div v-if="extractMode === 'keyword'" class="glass rounded-xl p-4 mb-4">
      <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
        <Search class="w-5 h-5 text-primary" />
        提取关键字
      </h2>
      <textarea
        v-model="customKeywords"
        placeholder="输入要提取的关键字，用逗号、空格或换行分隔&#10;&#10;例如：&#10;技术, 应用, 发展&#10;或&#10;人工智能&#10;机器学习"
        class="w-full h-20 p-3 rounded-lg bg-bg-secondary text-white text-sm placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-3"
      />
      
      <!-- 相似度阈值设置 -->
      <div class="bg-bg-secondary rounded-lg p-3 mb-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-text-primary">联想程度</span>
          <span class="text-xs text-primary font-semibold">
            {{ similarityLevel === 'strict' ? '严格' : similarityLevel === 'medium' ? '适中' : '宽松' }}
          </span>
        </div>
        
        <div class="flex gap-2">
          <button
            @click="similarityLevel = 'strict'"
            :class="[
              'flex-1 px-3 py-2 rounded-lg text-xs transition-all',
              similarityLevel === 'strict'
                ? 'bg-primary text-white'
                : 'bg-bg-tertiary text-text-tertiary hover:bg-bg-tertiary/80'
            ]"
          >
            严格
          </button>
          <button
            @click="similarityLevel = 'medium'"
            :class="[
              'flex-1 px-3 py-2 rounded-lg text-xs transition-all',
              similarityLevel === 'medium'
                ? 'bg-primary text-white'
                : 'bg-bg-tertiary text-text-tertiary hover:bg-bg-tertiary/80'
            ]"
          >
            适中
          </button>
          <button
            @click="similarityLevel = 'loose'"
            :class="[
              'flex-1 px-3 py-2 rounded-lg text-xs transition-all',
              similarityLevel === 'loose'
                ? 'bg-primary text-white'
                : 'bg-bg-tertiary text-text-tertiary hover:bg-bg-tertiary/80'
            ]"
          >
            宽松
          </button>
        </div>
        
        <p class="text-xs text-text-tertiary mt-2">
          {{ similarityLevel === 'strict' ? '🎯 仅精确匹配关键字，最精准' : 
             similarityLevel === 'medium' ? '⚖️ 包含相似词汇，平衡精度和范围' : 
             '🔍 扩大联想范围，提取更多相关内容' }}
        </p>
      </div>
      
      <div class="bg-bg-secondary rounded-lg p-3">
        <p class="text-xs text-text-tertiary">
          💡 系统会提取包含关键字及其相似意思的句子，并在原文中高亮显示
        </p>
      </div>
    </div>

    <!-- 智能提取说明（仅在智能模式下显示） -->
    <div v-else class="glass rounded-xl p-4 mb-4">
      <div class="flex items-start gap-3">
        <Sparkles class="w-5 h-5 text-primary mt-1" />
        <div>
          <h3 class="font-semibold mb-2">智能提取模式</h3>
          <p class="text-sm text-text-secondary">
            系统会自动分析文档，提取有意义的句子，过滤无意义的内容，保持语义连贯性
          </p>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex gap-3 mb-6">
      <button
        @click="handleExtract"
        :disabled="isProcessing || !inputText.trim() || (extractMode === 'keyword' && !customKeywords.trim())"
        class="gradient-btn flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FileText v-if="!isProcessing" class="w-5 h-5" />
        <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>{{ isProcessing ? '提取中...' : '开始提取' }}</span>
      </button>

      <button
        @click="handleClear"
        class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-white transition-colors flex items-center gap-2"
      >
        <Trash2 class="w-5 h-5" />
        <span class="hidden md:inline">清空</span>
      </button>
    </div>

    <!-- 结果区域 -->
    <div v-if="result" class="space-y-4">
      <!-- 统计信息 -->
      <div class="glass rounded-xl p-4">
        <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
          <CheckCircle class="w-5 h-5 text-success" />
          提取结果
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-bg-secondary rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-primary mb-1">{{ result.extractedSentences.length }}</div>
            <div class="text-xs text-text-tertiary">提取句子数</div>
          </div>
          <div class="bg-bg-secondary rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-secondary mb-1">{{ result.statistics.totalSentences }}</div>
            <div class="text-xs text-text-tertiary">总句子数</div>
          </div>
          <div class="bg-bg-secondary rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-info mb-1">{{ result.statistics.paragraphs }}</div>
            <div class="text-xs text-text-tertiary">段落数</div>
          </div>
          <div class="bg-bg-secondary rounded-lg p-3 text-center">
            <div class="text-2xl font-bold text-warning mb-1">{{ result.statistics.totalSentences > 0 ? Math.round((result.extractedSentences.length / result.statistics.totalSentences) * 100) : 0 }}%</div>
            <div class="text-xs text-text-tertiary">提取比例</div>
          </div>
        </div>
      </div>

      <!-- 高亮原文 -->
      <div class="glass rounded-xl p-4">
        <h2 class="text-lg font-semibold mb-3">原文高亮显示</h2>
        <div class="bg-bg-secondary rounded-lg p-4 max-h-64 overflow-y-auto">
          <div v-html="result.highlightedText" class="text-sm leading-relaxed text-text-primary whitespace-pre-wrap"></div>
        </div>
      </div>

      <!-- 按段落分组的提取结果 -->
      <div class="glass rounded-xl p-4">
        <h2 class="text-lg font-semibold mb-3">分段提取结果</h2>
        <div class="space-y-4">
          <div
            v-for="(group, index) in result.paragraphGroups"
            :key="index"
            class="border-l-4 border-primary pl-4"
          >
            <div class="text-xs text-text-tertiary mb-2">段落 {{ index + 1 }}</div>
            <ul class="space-y-2">
              <li
                v-for="(sentence, sIndex) in group.sentences"
                :key="sIndex"
                class="text-sm text-text-primary bg-success/10 rounded px-3 py-2"
              >
                {{ sentence }}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 所有提取的句子列表 -->
      <div class="glass rounded-xl p-4">
        <h2 class="text-lg font-semibold mb-3">所有提取的句子</h2>
        <div class="space-y-2 max-h-96 overflow-y-auto pr-2">
          <div
            v-for="(sentence, index) in result.extractedSentences"
            :key="index"
            class="bg-bg-secondary rounded-lg p-3 border-l-4 border-success"
          >
            <div class="text-xs text-text-tertiary mb-1">句子 {{ index + 1 }}</div>
            <p class="text-text-primary text-sm leading-relaxed">{{ sentence }}</p>
          </div>
        </div>
      </div>

      <!-- 导出选项 -->
      <div class="glass rounded-xl p-4">
        <div class="flex flex-wrap items-center gap-3">
          <label class="text-sm font-semibold">导出格式：</label>
          <select
            v-model="exportFormat"
            class="px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none"
          >
            <option value="markdown">Markdown</option>
            <option value="json">JSON</option>
            <option value="txt">TXT</option>
          </select>

          <button
            @click="handleCopy"
            class="px-4 py-2 rounded-lg bg-success hover:bg-success/80 text-white transition-colors flex items-center gap-2"
          >
            <CheckCircle v-if="copied" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
            <span class="text-sm">{{ copied ? '已复制' : '复制结果' }}</span>
          </button>

          <button
            @click="handleExport"
            class="px-4 py-2 rounded-lg bg-info hover:bg-info/80 text-white transition-colors flex items-center gap-2"
          >
            <Download class="w-4 h-4" />
            <span class="text-sm">下载文件</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="glass rounded-xl p-6 md:p-8 text-center">
      <FileText class="w-16 h-16 text-text-tertiary mx-auto mb-4" />
      <p class="text-text-tertiary">选择提取模式后点击"开始提取"</p>
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