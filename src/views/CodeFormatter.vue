<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import {
  formatCode,
  getParser,
  minifyCode,
  analyzeCode,
  checkSyntax,
  codeTemplates,
  type CodeStats,
  type SyntaxError
} from '@/utils/codeFormatter'
import hljs from 'highlight.js'
import {
  Code,
  Copy,
  CheckCircle,
  Settings,
  Play,
  Minimize2,
  BarChart3,
  AlertCircle,
  FileCode,
  Zap
} from 'lucide-vue-next'

// ==================== 语言独立状态管理 ====================

// 每个语言的独立状态
interface LanguageState {
  inputCode: string
  outputCode: string
  indentSize: number
  configOptions: {
    semi: boolean
    singleQuote: boolean
    trailingComma: 'none' | 'es5' | 'all'
    bracketSpacing: boolean
    arrowParens: 'avoid' | 'always'
    printWidth: number
  }
}

// 初始化单个语言状态的默认值
const createDefaultLanguageState = (): LanguageState => ({
  inputCode: '',
  outputCode: '',
  indentSize: 2,
  configOptions: {
    semi: true,
    singleQuote: false,
    trailingComma: 'es5',
    bracketSpacing: true,
    arrowParens: 'always',
    printWidth: 80
  }
})

// 所有语言的状态存储
const languageStates = reactive<Record<string, LanguageState>>({})

// 当前选中的语言
const language = ref('javascript')

// 获取当前语言的状态（自动创建如果不存在）
const currentLanguageState = computed(() => {
  if (!languageStates[language.value]) {
    languageStates[language.value] = createDefaultLanguageState()
  }
  return languageStates[language.value]
})

// 便捷访问当前状态的属性
const inputCode = computed({
  get: () => currentLanguageState.value.inputCode,
  set: (val) => { currentLanguageState.value.inputCode = val }
})

const outputCode = computed({
  get: () => currentLanguageState.value.outputCode,
  set: (val) => { currentLanguageState.value.outputCode = val }
})

const indentSize = computed({
  get: () => currentLanguageState.value.indentSize,
  set: (val) => { currentLanguageState.value.indentSize = val }
})

const configOptions = computed({
  get: () => currentLanguageState.value.configOptions,
  set: (val) => { currentLanguageState.value.configOptions = val }
})

// ==================== 通用状态 ====================

const isProcessing = ref(false)
const showConfig = ref(false)
const showTemplates = ref(false)
const activeTab = ref('format') // format, minify
const codeStats = ref<CodeStats | null>(null)
const syntaxErrors = ref<SyntaxError[]>([])
const showStats = ref(true)
const showErrors = ref(true)

const { copied, copyToClipboard } = useClipboard()
const { notification, success, error } = useNotification()

// ==================== 语言列表 ====================

const languages = [
  { id: 'javascript', name: 'JavaScript', icon: '📜' },
  { id: 'typescript', name: 'TypeScript', icon: '📘' },
  { id: 'json', name: 'JSON', icon: '📋' },
  { id: 'html', name: 'HTML', icon: '🌐' },
  { id: 'css', name: 'CSS', icon: '🎨' },
  { id: 'scss', name: 'SCSS', icon: '💅' },
  { id: 'markdown', name: 'Markdown', icon: '📝' },
  { id: 'yaml', name: 'YAML', icon: '📄' },
  { id: 'vue', name: 'Vue', icon: '💚' },
  { id: 'graphql', name: 'GraphQL', icon: '📊' },
  { id: 'sql', name: 'SQL', icon: '🗃️' },
  { id: 'shell', name: 'Shell', icon: '🖥️' },
  { id: 'dockerfile', name: 'Dockerfile', icon: '🐳' },
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'go', name: 'Go', icon: '🐹' },
  { id: 'rust', name: 'Rust', icon: '⚙️' },
  { id: 'c', name: 'C', icon: '🔵' },
  { id: 'cpp', name: 'C++', icon: '🟣' }
]

const currentLanguageInfo = computed(() => {
  return languages.find(lang => lang.id === language.value)
})

// ==================== 语法高亮 ====================

const getHljsLanguage = (lang: string): string => {
  const langMap: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    markdown: 'markdown',
    yaml: 'yaml',
    vue: 'vue',
    graphql: 'graphql',
    sql: 'sql',
    shell: 'bash',
    dockerfile: 'dockerfile',
    python: 'python',
    java: 'java',
    go: 'go',
    rust: 'rust',
    c: 'c',
    cpp: 'cpp'
  }
  return langMap[lang] || 'plaintext'
}

const highlightedCode = computed(() => {
  if (!outputCode.value) return ''

  try {
    const lang = getHljsLanguage(language.value)
    const highlighted = hljs.highlight(outputCode.value, { language: lang }).value
    return highlighted
  } catch (e) {
    try {
      const highlighted = hljs.highlightAuto(outputCode.value).value
      return highlighted
    } catch (e2) {
      return outputCode.value
    }
  }
})

// ==================== 实时统计 ====================

watch(inputCode, (newCode) => {
  if (newCode.trim()) {
    codeStats.value = analyzeCode(newCode, language.value)
    syntaxErrors.value = checkSyntax(newCode, language.value)
  } else {
    codeStats.value = null
    syntaxErrors.value = []
  }
})

// ==================== 操作函数 ====================

// 格式化代码
const handleFormat = async () => {
  if (!inputCode.value.trim()) {
    error('请输入代码内容')
    return
  }

  isProcessing.value = true

  try {
    const parser = getParser(language.value)

    const formatted = await formatCode(inputCode.value, {
      parser,
      tabWidth: indentSize.value,
      useTabs: false,
      ...configOptions.value
    })

    outputCode.value = formatted
    activeTab.value = 'format'
    success('格式化完成！')
  } catch (e: any) {
    error(e.message || '格式化失败')
    console.error(e)
    outputCode.value = inputCode.value
  } finally {
    isProcessing.value = false
  }
}

// 压缩代码
const handleMinify = async () => {
  if (!inputCode.value.trim()) {
    error('请输入代码内容')
    return
  }

  isProcessing.value = true

  try {
    const minified = minifyCode(inputCode.value, language.value)
    outputCode.value = minified
    activeTab.value = 'minify'
    success('代码压缩完成！')
  } catch (e: any) {
    error(e.message || '压缩失败')
    console.error(e)
  } finally {
    isProcessing.value = false
  }
}

// 复制代码
const handleCopy = async () => {
  if (!outputCode.value.trim()) return

  if (await copyToClipboard(outputCode.value)) {
    success('已复制到剪贴板')
  }
}

// 粘贴代码
const handlePaste = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputCode.value = text
    success('已粘贴内容')
  } catch (e) {
    error('粘贴失败')
  }
}

// 加载模板
const loadTemplate = (templateKey: string) => {
  const template = codeTemplates[templateKey]
  if (template) {
    inputCode.value = template.code
    showTemplates.value = false
    success(`已加载模板: ${template.name}`)
  }
}

// 获取模板列表
const templateList = Object.entries(codeTemplates).map(([key, value]) => ({
  key,
  ...value
}))
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-6xl">
    <!-- 标题 -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">代码格式化器</h1>
      <p class="text-text-secondary">支持15+编程语言，集成Prettier引擎，自定义格式化规则，语法高亮预览</p>
    </div>

    <!-- 语言选择 -->
    <div class="glass rounded-xl p-4 mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="lang in languages"
          :key="lang.id"
          @click="language = lang.id"
          :class="`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            language === lang.id
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <span>{{ lang.icon }}</span>
          <span class="font-medium">{{ lang.name }}</span>
        </button>
      </div>
    </div>

    <!-- 快速模板 -->
    <div class="glass rounded-xl p-4 mb-6">
      <button
        @click="showTemplates = !showTemplates"
        class="w-full px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-white transition-colors flex items-center justify-between"
      >
        <span class="flex items-center gap-2">
          <FileCode class="w-4 h-4" />
          <span>快速示例模板</span>
        </span>
        <span>{{ showTemplates ? '▼' : '▶' }}</span>
      </button>

      <div v-if="showTemplates" class="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          v-for="template in templateList"
          :key="template.key"
          @click="loadTemplate(template.key)"
          class="px-4 py-3 rounded-lg bg-bg-secondary hover:bg-gradient-to-r hover:from-primary/20 hover:to-secondary/20 text-white transition-all text-left"
        >
          <div class="font-semibold">{{ template.name }}</div>
          <div class="text-xs text-text-tertiary mt-1">{{ template.description }}</div>
        </button>
      </div>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- 输入区域 -->
      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">
            {{ currentLanguageInfo?.name }} 代码
          </h2>
          <button
            @click="handlePaste"
            class="px-3 py-1 rounded-lg bg-bg-tertiary hover:bg-primary/20 text-white transition-colors text-sm"
          >
            粘贴
          </button>
        </div>

        <!-- 缩进大小 -->
        <div class="mb-4">
          <label class="font-semibold mb-2 block text-sm">缩进大小:</label>
          <select
            v-model="indentSize"
            class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none"
          >
            <option :value="2">2空格</option>
            <option :value="4">4空格</option>
          </select>
        </div>

        <!-- 高级配置 -->
        <div class="mb-4">
          <button
            @click="showConfig = !showConfig"
            class="w-full px-3 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-white transition-colors flex items-center justify-between"
          >
            <span class="flex items-center gap-2">
              <Settings class="w-4 h-4" />
              <span>高级配置</span>
            </span>
            <span>{{ showConfig ? '▼' : '▶' }}</span>
          </button>

          <div v-if="showConfig" class="mt-2 space-y-3 p-3 rounded-lg bg-bg-secondary">
            <div class="flex items-center justify-between">
              <label class="text-sm">添加分号:</label>
              <input
                v-model="configOptions.semi"
                type="checkbox"
                class="w-4 h-4 rounded"
              />
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm">使用单引号:</label>
              <input
                v-model="configOptions.singleQuote"
                type="checkbox"
                class="w-4 h-4 rounded"
              />
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm">尾逗号:</label>
              <select
                v-model="configOptions.trailingComma"
                class="px-2 py-1 rounded bg-bg-tertiary text-white focus:outline-none text-sm"
              >
                <option value="none">无</option>
                <option value="es5">ES5</option>
                <option value="all">全部</option>
              </select>
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm">对象括号空格:</label>
              <input
                v-model="configOptions.bracketSpacing"
                type="checkbox"
                class="w-4 h-4 rounded"
              />
            </div>

            <div class="flex items-center justify-between">
              <label class="text-sm">箭头函数括号:</label>
              <select
                v-model="configOptions.arrowParens"
                class="px-2 py-1 rounded bg-bg-tertiary text-white focus:outline-none text-sm"
              >
                <option value="avoid">避免</option>
                <option value="always">总是</option>
              </select>
            </div>

            <div>
              <label class="text-sm mb-1 block">每行最大字符数:</label>
              <input
                v-model="configOptions.printWidth"
                type="number"
                min="50"
                max="200"
                class="w-full px-2 py-1 rounded bg-bg-tertiary text-white focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <textarea
          v-model="inputCode"
          :placeholder="`粘贴${currentLanguageInfo?.name}代码...`"
          class="w-full h-48 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 font-mono"
        />

        <!-- 操作按钮 -->
        <div class="flex gap-3">
          <button
            @click="handleFormat"
            :disabled="isProcessing || !inputCode.trim()"
            class="flex-1 gradient-btn disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Play v-if="!isProcessing" class="w-5 h-5" />
            <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{{ isProcessing ? '处理中...' : '格式化' }}</span>
          </button>

          <button
            @click="handleMinify"
            :disabled="isProcessing || !inputCode.trim()"
            class="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Minimize2 class="w-5 h-5" />
            <span>压缩</span>
          </button>
        </div>
      </div>

      <!-- 输出区域 -->
      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">
            格式化结果
            <span v-if="activeTab === 'minify'" class="text-sm text-purple-400 ml-2">(已压缩)</span>
          </h2>
          <button
            v-if="outputCode"
            @click="handleCopy"
            :class="`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              copied ? 'bg-success text-white' : 'bg-bg-tertiary text-white'
            }`"
          >
            <CheckCircle v-if="copied" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
            <span class="text-sm">{{ copied ? '已复制' : '复制' }}</span>
          </button>
        </div>

        <!-- 语法高亮预览 -->
        <div class="relative">
          <pre
            v-if="outputCode"
            class="w-full h-64 p-4 rounded-lg bg-bg-secondary overflow-auto font-mono text-sm leading-relaxed"
          ><code
              v-html="highlightedCode"
              class="hljs"
            ></code></pre>
          <div
            v-else
            class="w-full h-64 p-4 rounded-lg bg-bg-secondary text-text-tertiary flex items-center justify-center"
          >
            结果预览区域...
          </div>
        </div>

        <!-- 统计信息 -->
        <div v-if="codeStats && showStats" class="mt-4 glass rounded-lg p-4">
          <div class="flex items-center gap-2 mb-3">
            <BarChart3 class="w-4 h-4 text-primary" />
            <span class="font-semibold text-sm">代码统计</span>
          </div>
          <div class="grid grid-cols-3 gap-3 text-sm">
            <div class="text-center p-2 rounded bg-bg-secondary">
              <div class="text-xl font-bold text-primary">{{ codeStats.lines }}</div>
              <div class="text-text-tertiary">总行数</div>
            </div>
            <div class="text-center p-2 rounded bg-bg-secondary">
              <div class="text-xl font-bold text-secondary">{{ codeStats.characters }}</div>
              <div class="text-text-tertiary">字符数</div>
            </div>
            <div class="text-center p-2 rounded bg-bg-secondary">
              <div class="text-xl font-bold text-purple-400">{{ codeStats.codeLines }}</div>
              <div class="text-text-tertiary">代码行</div>
            </div>
            <div class="text-center p-2 rounded bg-bg-secondary">
              <div class="text-xl font-bold text-blue-400">{{ codeStats.functions }}</div>
              <div class="text-text-tertiary">函数数</div>
            </div>
            <div class="text-center p-2 rounded bg-bg-secondary">
              <div class="text-xl font-bold text-green-400">{{ codeStats.comments }}</div>
              <div class="text-text-tertiary">注释行</div>
            </div>
            <div class="text-center p-2 rounded bg-bg-secondary">
              <div class="text-xl font-bold text-gray-400">{{ codeStats.blankLines }}</div>
              <div class="text-text-tertiary">空白行</div>
            </div>
          </div>
        </div>

        <!-- 语法错误提示 -->
        <div v-if="syntaxErrors.length > 0 && showErrors" class="mt-4 glass rounded-lg p-4 border border-error/30">
          <div class="flex items-center gap-2 mb-3">
            <AlertCircle class="w-4 h-4 text-error" />
            <span class="font-semibold text-sm text-error">语法问题 ({{ syntaxErrors.length }})</span>
          </div>
          <div class="space-y-2 max-h-32 overflow-y-auto">
            <div
              v-for="(err, index) in syntaxErrors"
              :key="index"
              class="flex items-start gap-2 text-sm p-2 rounded bg-error/10"
            >
              <AlertCircle class="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
              <div>
                <span class="text-error font-medium">行 {{ err.line }}, 列 {{ err.column }}:</span>
                <span class="ml-2 text-text-secondary">{{ err.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 成功提示 -->
        <div v-if="outputCode && outputCode !== inputCode" class="mt-2 text-xs text-success">
          ✓ 代码已{{ activeTab === 'minify' ? '压缩' : '格式化' }}
        </div>
        <div v-else-if="outputCode && outputCode === inputCode" class="mt-2 text-xs text-text-tertiary">
          代码格式已符合要求
        </div>
      </div>
    </div>

    <!-- 功能特性说明 -->
    <div class="mt-8 glass rounded-xl p-6">
      <h3 class="text-xl font-semibold mb-4 gradient-text">功能特性</h3>
      <div class="grid md:grid-cols-3 gap-4">
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg bg-primary/20">
            <Zap class="w-5 h-5 text-primary" />
          </div>
          <div>
            <div class="font-semibold">语法高亮</div>
            <div class="text-sm text-text-tertiary">使用highlight.js提供精确的语法高亮显示</div>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg bg-secondary/20">
            <BarChart3 class="w-5 h-5 text-secondary" />
          </div>
          <div>
            <div class="font-semibold">代码统计</div>
            <div class="text-sm text-text-tertiary">实时统计行数、字符数、函数数、注释数</div>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg bg-purple-500/20">
            <Minimize2 class="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div class="font-semibold">代码压缩</div>
            <div class="text-sm text-text-tertiary">移除注释和多余空白，最小化代码体积</div>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg bg-green-500/20">
            <FileCode class="w-5 h-5 text-green-400" />
          </div>
          <div>
            <div class="font-semibold">快速模板</div>
            <div class="text-sm text-text-tertiary">提供常用代码片段模板，快速开始编码</div>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg bg-red-500/20">
            <AlertCircle class="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div class="font-semibold">错误检测</div>
            <div class="text-sm text-text-tertiary">实时检测括号匹配等语法问题</div>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-lg bg-blue-500/20">
            <Code class="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div class="font-semibold">多语言支持</div>
            <div class="text-sm text-text-tertiary">支持JavaScript、Python、Go等15+语言</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 通知 -->
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

<style>
/* Highlight.js 主题适配 */
.hljs {
  background: transparent !important;
  color: #e5e7eb;
}

.hljs-keyword,
.hljs-selector-tag,
.hljs-addition {
  color: #60a5fa;
}

.hljs-number,
.hljs-string,
.hljs-meta .hljs-meta-string,
.hljs-literal,
.hljs-doctag,
.hljs-regexp {
  color: #34d399;
}

.hljs-title,
.hljs-section,
.hljs-name,
.hljs-selector-id,
.hljs-selector-class {
  color: #f472b6;
}

.hljs-attribute,
.hljs-attr,
.hljs-variable,
.hljs-template-variable,
.hljs-class .hljs-title,
.hljs-type {
  color: #fbbf24;
}

.hljs-symbol,
.hljs-bullet,
.hljs-subst,
.hljs-meta,
.hljs-meta .hljs-keyword,
.hljs-selector-attr,
.hljs-selector-pseudo,
.hljs-link {
  color: #a78bfa;
}

.hljs-built_in,
.hljs-deletion {
  color: #f87171;
}

.hljs-comment {
  color: #6b7280;
  font-style: italic;
}

.hljs-emphasis {
  font-style: italic;
}

.hljs-strong {
  font-weight: bold;
}
</style>