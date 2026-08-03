<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import {
  jsonToCSV,
  downloadCSV,
  jsonToXML,
  validateJSONSchema,
  jsonPathQuery,
  diffJSON,
  formatDiffHTML
} from '@/utils/jsonTools'
import {
  Copy,
  CheckCircle,
  Minimize2,
  Maximize2,
  Check,
  FileSpreadsheet,
  Code,
  ShieldCheck,
  Search,
  GitCompare,
  Download
} from 'lucide-vue-next'

// 当前选中的功能标签
const activeTab = ref<string>('format')

// 功能标签列表
const tabs = [
  { id: 'format', label: '格式化', icon: Maximize2 },
  { id: 'csv', label: '转CSV', icon: FileSpreadsheet },
  { id: 'xml', label: '转XML', icon: Code },
  { id: 'schema', label: 'Schema验证', icon: ShieldCheck },
  { id: 'path', label: 'Path查询', icon: Search },
  { id: 'diff', label: '差异对比', icon: GitCompare }
]

// 通用输入输出
const inputText = ref('')
const outputText = ref('')
const error = ref<string | null>(null)

// Schema验证相关
const schemaText = ref('')

// JSON Path查询相关
const pathQuery = ref('')

// 差异对比相关
const diffLeft = ref('')
const diffRight = ref('')

const { copied, copyToClipboard } = useClipboard()
const { notification, success, showError } = useNotification()

// =============== 格式化/压缩/校验 ===============

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

// =============== JSON转CSV ===============

const handleToCSV = () => {
  error.value = null
  if (!inputText.value.trim()) {
    showError('请输入JSON数组')
    return
  }

  try {
    const parsed = JSON.parse(inputText.value)
    const csv = jsonToCSV(parsed)
    outputText.value = csv
    success('转换成功！')
  } catch (e: any) {
    error.value = `转换失败: ${e.message}`
    showError(error.value)
  }
}

const handleDownloadCSV = () => {
  if (!outputText.value.trim()) {
    showError('请先转换JSON')
    return
  }
  downloadCSV(outputText.value, 'data.csv')
  success('CSV文件已下载')
}

// =============== JSON转XML ===============

const handleToXML = () => {
  error.value = null
  if (!inputText.value.trim()) {
    showError('请输入JSON内容')
    return
  }

  try {
    const parsed = JSON.parse(inputText.value)
    const xml = jsonToXML(parsed)
    outputText.value = xml
    success('转换成功！')
  } catch (e: any) {
    error.value = `转换失败: ${e.message}`
    showError(error.value)
  }
}

// =============== JSON Schema验证 ===============

const handleSchemaValidate = () => {
  error.value = null
  if (!inputText.value.trim()) {
    showError('请输入JSON内容')
    return
  }
  if (!schemaText.value.trim()) {
    showError('请输入Schema')
    return
  }

  try {
    const json = JSON.parse(inputText.value)
    const schema = JSON.parse(schemaText.value)
    const errors = validateJSONSchema(json, schema)

    if (errors.length === 0) {
      outputText.value = '✓ JSON符合Schema规范'
      success('验证通过！')
    } else {
      const errorMsg = errors.map(e => `${e.path}: ${e.message}`).join('\n')
      outputText.value = `✗ 发现 ${errors.length} 个错误:\n\n${errorMsg}`
      showError(`发现 ${errors.length} 个验证错误`)
    }
  } catch (e: any) {
    error.value = `验证失败: ${e.message}`
    showError(error.value)
  }
}

// =============== JSON Path查询 ===============

const handlePathQuery = async () => {
  error.value = null
  if (!inputText.value.trim()) {
    showError('请输入JSON内容')
    return
  }
  if (!pathQuery.value.trim()) {
    showError('请输入查询路径')
    return
  }

  try {
    const json = JSON.parse(inputText.value)
    const results = await jsonPathQuery(json, pathQuery.value)

    if (results.length === 0) {
      outputText.value = '未找到匹配结果'
    } else {
      // 格式化输出为数组形式
      outputText.value = JSON.stringify(results, null, 2)
      success(`找到 ${results.length} 个结果`)
    }
  } catch (e: any) {
    error.value = `查询失败: ${e.message}`
    showError(error.value)
  }
}

// =============== JSON差异对比 ===============

const handleDiff = () => {
  error.value = null
  if (!diffLeft.value.trim() || !diffRight.value.trim()) {
    showError('请输入两个JSON进行对比')
    return
  }

  try {
    const left = JSON.parse(diffLeft.value)
    const right = JSON.parse(diffRight.value)
    const diffs = diffJSON(left, right)
    outputText.value = formatDiffHTML(diffs)
    success('对比完成！')
  } catch (e: any) {
    error.value = `对比失败: ${e.message}`
    showError(error.value)
  }
}

// =============== 差异对比 ===============
const handleCopy = async () => {
  if (!outputText.value.trim() || outputText.value.startsWith('✓') || outputText.value.startsWith('✗')) return

  if (await copyToClipboard(outputText.value)) {
    success('已复制到剪贴板')
  }
}

// 是否显示复制按钮
const showCopyButton = computed(() => {
  return outputText.value &&
         !outputText.value.startsWith('✓') &&
         !outputText.value.startsWith('✗') &&
         !outputText.value.startsWith('<div')
})

// 是否显示下载按钮（CSV）
const showDownloadButton = computed(() => {
  return activeTab.value === 'csv' && outputText.value.trim()
})
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-6xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">JSON工具箱</h1>
      <p class="text-text-secondary">强大的JSON处理工具集</p>
    </div>

    <!-- 功能标签页 -->
    <div class="flex flex-wrap gap-2 mb-6 justify-center">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id; outputText = ''; error = null"
        :class="`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
          activeTab === tab.id
            ? 'gradient-btn'
            : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
        }`"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- 格式化/压缩/校验 -->
    <div v-if="activeTab === 'format'" class="grid md:grid-cols-2 gap-6">
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">输入JSON</h2>

        <textarea
          v-model="inputText"
          placeholder="粘贴JSON内容..."
          class="w-full h-64 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 font-mono"
        />

        <div class="flex flex-wrap gap-3">
          <button @click="handleFormat" class="gradient-btn flex items-center gap-2">
            <Maximize2 class="w-5 h-5" />
            <span>格式化</span>
          </button>

          <button @click="handleMinify" class="px-4 py-2 rounded-lg bg-warning hover:bg-warning/80 text-white transition-colors flex items-center gap-2">
            <Minimize2 class="w-5 h-5" />
            <span>压缩</span>
          </button>

          <button @click="handleValidate" class="px-4 py-2 rounded-lg bg-success hover:bg-success/80 text-white transition-colors flex items-center gap-2">
            <Check class="w-5 h-5" />
            <span>校验</span>
          </button>
        </div>
      </div>

      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">结果</h2>
          <button
            v-if="showCopyButton"
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

        <div v-if="error" class="mt-4 p-3 rounded-lg bg-error/20 border border-error/30 text-error">
          {{ error }}
        </div>
      </div>
    </div>

    <!-- JSON转CSV -->
    <div v-if="activeTab === 'csv'" class="grid md:grid-cols-2 gap-6">
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">输入JSON数组</h2>
        <textarea
          v-model="inputText"
          placeholder='[{"name": "张三", "age": 25}, {"name": "李四", "age": 30}]'
          class="w-full h-64 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 font-mono"
        />
        <div class="flex flex-wrap gap-3">
          <button @click="handleToCSV" class="gradient-btn flex items-center gap-2">
            <FileSpreadsheet class="w-5 h-5" />
            <span>转换为CSV</span>
          </button>
          <button
            v-if="showDownloadButton"
            @click="handleDownloadCSV"
            class="px-4 py-2 rounded-lg bg-success hover:bg-success/80 text-white transition-colors flex items-center gap-2"
          >
            <Download class="w-5 h-5" />
            <span>下载CSV</span>
          </button>
        </div>
      </div>

      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">CSV结果</h2>
          <button
            v-if="showCopyButton"
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
          placeholder="CSV结果..."
          class="w-full h-64 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none font-mono"
        />
        <div v-if="error" class="mt-4 p-3 rounded-lg bg-error/20 border border-error/30 text-error">
          {{ error }}
        </div>
      </div>
    </div>

    <!-- JSON转XML -->
    <div v-if="activeTab === 'xml'" class="grid md:grid-cols-2 gap-6">
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">输入JSON</h2>
        <textarea
          v-model="inputText"
          placeholder='{"name": "张三", "age": 25}'
          class="w-full h-64 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 font-mono"
        />
        <button @click="handleToXML" class="gradient-btn flex items-center gap-2">
          <Code class="w-5 h-5" />
          <span>转换为XML</span>
        </button>
      </div>

      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">XML结果</h2>
          <button
            v-if="showCopyButton"
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
          placeholder="XML结果..."
          class="w-full h-64 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none font-mono"
        />
        <div v-if="error" class="mt-4 p-3 rounded-lg bg-error/20 border border-error/30 text-error">
          {{ error }}
        </div>
      </div>
    </div>

    <!-- JSON Schema验证 -->
    <div v-if="activeTab === 'schema'" class="grid md:grid-cols-2 gap-6">
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">输入JSON</h2>
        <textarea
          v-model="inputText"
          placeholder='{"name": "张三", "age": 25}'
          class="w-full h-48 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 font-mono"
        />

        <h3 class="text-lg font-semibold mb-2">输入Schema</h3>
        <textarea
          v-model="schemaText"
          placeholder='{"type": "object", "required": ["name", "age"]}'
          class="w-full h-48 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 font-mono"
        />

        <button @click="handleSchemaValidate" class="gradient-btn flex items-center gap-2">
          <ShieldCheck class="w-5 h-5" />
          <span>验证</span>
        </button>
      </div>

      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">验证结果</h2>
        </div>
        <textarea
          v-model="outputText"
          readonly
          placeholder="验证结果..."
          :class="`w-full h-[420px] p-4 rounded-lg bg-bg-secondary resize-none focus:outline-none font-mono ${
            outputText.startsWith('✓') ? 'text-success' :
            outputText.startsWith('✗') ? 'text-error' :
            'text-white placeholder:text-text-tertiary'
          }`"
        />
        <div v-if="error" class="mt-4 p-3 rounded-lg bg-error/20 border border-error/30 text-error">
          {{ error }}
        </div>
      </div>
    </div>

    <!-- JSON Path查询 -->
    <div v-if="activeTab === 'path'" class="grid md:grid-cols-2 gap-6">
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">输入JSON</h2>
        <textarea
          v-model="inputText"
          placeholder='{"users": [{"name": "张三", "age": 25}, {"name": "李四", "age": 30}]}'
          class="w-full h-48 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 font-mono"
        />

        <div class="mb-4">
          <label class="block text-sm font-medium mb-2">查询路径（JSONPath语法）</label>
          <input
            v-model="pathQuery"
            type="text"
            placeholder="例如: $.users[*].name"
            class="w-full p-3 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
          />
          <p class="text-xs text-text-tertiary mt-2">
            支持: $（根）、.（子节点）、[*]（数组通配符）、[n]（索引）
          </p>
        </div>

        <button @click="handlePathQuery" class="gradient-btn flex items-center gap-2">
          <Search class="w-5 h-5" />
          <span>查询</span>
        </button>
      </div>

      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">查询结果</h2>
          <button
            v-if="showCopyButton"
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
          placeholder="查询结果..."
          class="w-full h-[350px] p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none font-mono"
        />
        <div v-if="error" class="mt-4 p-3 rounded-lg bg-error/20 border border-error/30 text-error">
          {{ error }}
        </div>
      </div>
    </div>

    <!-- JSON差异对比 -->
    <div v-if="activeTab === 'diff'">
      <div class="grid md:grid-cols-2 gap-6 mb-6">
        <div class="glass rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4">左侧JSON（原始）</h2>
          <textarea
            v-model="diffLeft"
            placeholder='{"name": "张三", "age": 25}'
            class="w-full h-64 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
          />
        </div>

        <div class="glass rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4">右侧JSON（修改）</h2>
          <textarea
            v-model="diffRight"
            placeholder='{"name": "张三", "age": 30, "city": "北京"}'
            class="w-full h-64 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
          />
        </div>
      </div>

      <div class="text-center mb-6">
        <button @click="handleDiff" class="gradient-btn flex items-center gap-2 mx-auto">
          <GitCompare class="w-5 h-5" />
          <span>对比差异</span>
        </button>
      </div>

      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">差异结果</h2>
        <div
          v-html="outputText || '等待对比...'"
          :class="`w-full min-h-[200px] p-4 rounded-lg bg-bg-secondary font-mono ${
            outputText.startsWith('<div') ? 'text-white' : 'text-text-tertiary'
          }`"
        />
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

<style scoped>
/* 差异对比高亮样式 */
.diff-added {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 2px 4px;
  border-radius: 2px;
  margin: 2px 0;
}

.diff-removed {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  padding: 2px 4px;
  border-radius: 2px;
  margin: 2px 0;
}

.diff-modified {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 4px;
  border-radius: 2px;
  margin: 2px 0;
}
</style>