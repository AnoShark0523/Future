<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import { formatCode, getParser } from '@/utils/codeFormatter'
import { Code, Copy, CheckCircle, Settings } from 'lucide-vue-next'

const inputCode = ref('')
const outputCode = ref('')
const language = ref('javascript')
const indentSize = ref(2)
const isProcessing = ref(false)
const showConfig = ref(false)

// Prettier配置选项
const configOptions = ref({
  semi: true,
  singleQuote: false,
  trailingComma: 'es5' as 'none' | 'es5' | 'all',
  bracketSpacing: true,
  arrowParens: 'always' as 'avoid' | 'always',
  printWidth: 80
})

const { copied, copyToClipboard } = useClipboard()
const { notification, success, error } = useNotification()

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
  { id: 'graphql', name: 'GraphQL', icon: '📊' }
]

const currentLanguageInfo = computed(() => {
  return languages.find(lang => lang.id === language.value)
})

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
    success('格式化完成！')
  } catch (e: any) {
    error(e.message || '格式化失败')
    console.error(e)
    outputCode.value = inputCode.value
  } finally {
    isProcessing.value = false
  }
}

const handleCopy = async () => {
  if (!outputCode.value.trim()) return

  if (await copyToClipboard(outputCode.value)) {
    success('已复制到剪贴板')
  }
}

const handlePaste = async () => {
  try {
    const text = await navigator.clipboard.readText()
    inputCode.value = text
    success('已粘贴内容')
  } catch (e) {
    error('粘贴失败')
  }
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-6xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">代码格式化器</h1>
      <p class="text-text-secondary">支持10+编程语言，集成Prettier引擎，自定义格式化规则</p>
    </div>

    <!-- Language Selection -->
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

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Input Section -->
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

        <!-- Indent Size -->
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

        <!-- Config Toggle -->
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

          <!-- Advanced Config -->
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
                v-model="configOptions.bBracketSpacing"
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
          placeholder="粘贴{{ currentLanguageInfo?.name }}代码..."
          class="w-full h-48 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 font-mono"
        />

        <button
          @click="handleFormat"
          :disabled="isProcessing || !inputCode.trim()"
          class="w-full gradient-btn disabled:opacity-50"
        >
          <Code v-if="!isProcessing" class="w-5 h-5 inline mr-2" />
          <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
          <span>{{ isProcessing ? '格式化中...' : '格式化代码' }}</span>
        </button>
      </div>

      <!-- Output Section -->
      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">格式化结果</h2>
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

        <textarea
          v-model="outputCode"
          readonly
          placeholder="结果..."
          :class="`w-full h-64 p-4 rounded-lg bg-bg-secondary resize-none focus:outline-none font-mono ${
            outputCode && outputCode !== inputCode ? 'text-success' : 'text-white'
          } placeholder:text-text-tertiary`"
        />

        <!-- Info -->
        <div v-if="outputCode && outputCode !== inputCode" class="mt-2 text-xs text-success">
          ✓ 代码已格式化
        </div>
        <div v-else-if="outputCode && outputCode === inputCode" class="mt-2 text-xs text-text-tertiary">
          代码格式已符合要求
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