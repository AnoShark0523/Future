<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useNotification } from '@/composables/useNotification'
import {
  generateCode,
  languages,
  difficulties,
  type PracticeLanguage,
  type Difficulty
} from '@/utils/codeGenerator'
import { diffCode, type DiffResult } from '@/utils/codeDiff'
import { calculateScore, formatTime, type ScoreResult, type Grade } from '@/utils/scoringSystem'
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/dracula.css'
// 语言模式
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/python/python'
import 'codemirror/mode/clike/clike'
import 'codemirror/mode/go/go'
import 'codemirror/mode/rust/rust'
// 编辑器功能
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/edit/closetag'
import 'codemirror/addon/comment/comment'
import 'codemirror/addon/selection/active-line'
import 'codemirror/addon/fold/foldcode'
import 'codemirror/addon/fold/foldgutter'
import 'codemirror/addon/fold/foldgutter.css'
import 'codemirror/addon/fold/brace-fold'
import 'codemirror/addon/fold/indent-fold'
import hljs from 'highlight.js'
import {
  Play,
  RefreshCw,
  CheckCircle,
  Timer,
  Target,
  Zap,
  Trophy,
  AlertTriangle,
  Code2,
  Keyboard,
  Eye,
  X,
  Award,
  History,
  ChevronRight
} from 'lucide-vue-next'

const { notification, success, error: showError } = useNotification()

// ==================== 状态管理 ====================
const selectedLanguage = ref<PracticeLanguage>('javascript')
const selectedDifficulty = ref<Difficulty>('iron')
const sampleCode = ref('')
const userCode = ref('')
const isPracticeActive = ref(false)
const isTestComplete = ref(false)
const timeUsed = ref(0)
const diffResult = ref<DiffResult | null>(null)
const scoreResult = ref<ScoreResult | null>(null)
const runOutput = ref<string>('')
const showRunOutput = ref(false)
const showHistory = ref(false)

// 历史最佳记录
interface BestRecord {
  grade: Grade
  totalScore: number
  accuracy: number
  timeUsed: number
  date: string
}
const bestRecords = ref<Record<string, BestRecord>>({})

// 计时器
let timerInterval: ReturnType<typeof setInterval> | null = null

// CodeMirror 实例
let codeMirrorInstance: CodeMirror.Editor | null = null
const editorContainer = ref<HTMLElement | null>(null)

// 样例显示用的高亮
const sampleHighlighted = ref('')
// 样例无 diff 时的高亮（语法高亮）
const sampleSyntaxHighlighted = ref('')

// 当前语言和难度信息
const currentLanguage = computed(() =>
  languages.find(l => l.id === selectedLanguage.value)!
)
const currentDifficulty = computed(() =>
  difficulties.find(d => d.id === selectedDifficulty.value)!
)

// 时间进度条
const timeProgress = computed(() => {
  if (!isPracticeActive.value && !isTestComplete.value) return 0
  return Math.min(100, (timeUsed.value / currentDifficulty.value.timeLimit) * 100)
})

const isOvertime = computed(() => timeUsed.value > currentDifficulty.value.timeLimit)

// 当前难度的最佳记录
const currentBestRecord = computed(() => {
  const key = `${selectedLanguage.value}_${selectedDifficulty.value}`
  return bestRecords.value[key] || null
})

// ==================== CodeMirror 初始化 ====================

const initCodeMirror = () => {
  if (!editorContainer.value) return

  // 清除旧实例
  if (codeMirrorInstance) {
    codeMirrorInstance.toTextArea()
    codeMirrorInstance = null
  }

  // 创建一个隐藏的 textarea
  const textarea = document.createElement('textarea')
  editorContainer.value.innerHTML = ''
  editorContainer.value.appendChild(textarea)

  codeMirrorInstance = CodeMirror.fromTextArea(textarea, {
    mode: currentLanguage.value.codemirrorMode,
    theme: 'dracula',
    lineNumbers: true,
    indentUnit: 2,
    tabSize: 2,
    indentWithTabs: false,
    autoCloseBrackets: true,
    matchBrackets: true,
    autoCloseTags: true,
    styleActiveLine: true,
    foldGutter: true,
    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
    lineWrapping: false,
    readOnly: !isPracticeActive.value,
    extraKeys: {
      'Ctrl-Enter': () => {
        if (isPracticeActive.value) {
          handleCompleteTest()
        }
      },
      'Cmd-Enter': () => {
        if (isPracticeActive.value) {
          handleCompleteTest()
        }
      },
      'Tab': (cm) => {
        if (cm.somethingSelected()) {
          cm.indentSelection('add')
        } else {
          cm.replaceSelection('  ', 'end')
        }
      }
    }
  })

  codeMirrorInstance.on('change', (instance) => {
    userCode.value = instance.getValue()
  })

  // 刷新编辑器，确保正确渲染
  setTimeout(() => {
    if (codeMirrorInstance) {
      codeMirrorInstance.refresh()
    }
  }, 100)
}

// 切换语言时更新模式
watch([selectedLanguage], () => {
  if (codeMirrorInstance) {
    codeMirrorInstance.setOption('mode', currentLanguage.value.codemirrorMode)
    codeMirrorInstance.refresh()
  }
  renderSampleSyntaxHighlight()
})

// 切换难度时重新生成样例
watch([selectedDifficulty], () => {
  // 不自动重新生成，但清空当前对比
  diffResult.value = null
  scoreResult.value = null
})

// ==================== 语法高亮 ====================

const hljsLanguageMap: Record<PracticeLanguage, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  go: 'go',
  rust: 'rust'
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// 仅为样例代码生成语法高亮（无 diff 时显示）
const renderSampleSyntaxHighlight = () => {
  if (!sampleCode.value) {
    sampleSyntaxHighlighted.value = ''
    return
  }

  try {
    const lang = hljsLanguageMap[selectedLanguage.value]
    const highlighted = hljs.highlight(sampleCode.value, { language: lang }).value
    // 添加行号
    const lines = highlighted.split('\n')
    sampleSyntaxHighlighted.value = lines.map((line, idx) => {
      return `<div class="sample-line sample-syntax"><span class="line-no">${idx + 1}</span><span class="line-content">${line || '&nbsp;'}</span></div>`
    }).join('')
  } catch (e) {
    // 失败则纯文本显示
    const lines = sampleCode.value.split('\n')
    sampleSyntaxHighlighted.value = lines.map((line, idx) => {
      return `<div class="sample-line sample-syntax"><span class="line-no">${idx + 1}</span><span class="line-content">${escapeHtml(line) || '&nbsp;'}</span></div>`
    }).join('')
  }
}

// 渲染带 diff 的样例高亮（语法高亮 + 错误行红色背景）
const renderSampleHighlight = () => {
  if (!sampleCode.value || !diffResult.value) {
    sampleHighlighted.value = ''
    return
  }

  const lines = sampleCode.value.split('\n')
  const wrongLineNumbers = new Set(
    diffResult.value.wrongLines
      .filter(l => !l.isExtra)
      .map(l => l.lineNumber)
  )

  // 为每行生成语法高亮，并标记错误行
  sampleHighlighted.value = lines.map((line, idx) => {
    const lineNum = idx + 1
    const isWrong = wrongLineNumbers.has(lineNum)
    const wrongClass = isWrong ? 'sample-wrong' : 'sample-correct'

    try {
      // 单行语法高亮
      const lang = hljsLanguageMap[selectedLanguage.value]
      const highlighted = hljs.highlight(line || ' ', { language: lang }).value
      return `<div class="sample-line ${wrongClass}"><span class="line-no">${lineNum}</span><span class="line-content">${highlighted || '&nbsp;'}</span></div>`
    } catch (e) {
      return `<div class="sample-line ${wrongClass}"><span class="line-no">${lineNum}</span><span class="line-content">${escapeHtml(line) || '&nbsp;'}</span></div>`
    }
  }).join('')
}

// 监听 diffResult 变化，重新渲染高亮
watch(diffResult, () => {
  renderSampleHighlight()
})

watch(sampleCode, () => {
  renderSampleSyntaxHighlight()
})

// ==================== 代码生成 ====================

const handleGenerateSample = () => {
  // 如果正在练习，先确认
  if (isPracticeActive.value) {
    if (!confirm('正在练习中，切换样例将重置当前进度，确定吗？')) {
      return
    }
    stopPractice()
  }

  sampleCode.value = generateCode(selectedLanguage.value, selectedDifficulty.value)
  userCode.value = ''
  isTestComplete.value = false
  diffResult.value = null
  scoreResult.value = null
  runOutput.value = ''
  showRunOutput.value = false

  if (codeMirrorInstance) {
    codeMirrorInstance.setValue('')
  }

  renderSampleSyntaxHighlight()
  success(`已生成 ${currentLanguage.value.name} - ${currentDifficulty.value.name} 难度代码`)
}

// ==================== 计时器 ====================

const startTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  timerInterval = setInterval(() => {
    timeUsed.value++
  }, 1000)
}

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
}

// ==================== 练习控制 ====================

const handleStartPractice = () => {
  if (!sampleCode.value) {
    showError('请先生成代码样例')
    return
  }

  isPracticeActive.value = true
  isTestComplete.value = false
  timeUsed.value = 0
  userCode.value = ''
  diffResult.value = null
  scoreResult.value = null
  runOutput.value = ''
  showRunOutput.value = false

  if (codeMirrorInstance) {
    codeMirrorInstance.setValue('')
    codeMirrorInstance.setOption('readOnly', false)
    codeMirrorInstance.refresh()
    codeMirrorInstance.focus()
  }

  startTimer()
  success('练习开始！计时已启动 (Ctrl+Enter 可快速完成)')
}

const handleCompleteTest = () => {
  if (!isPracticeActive.value) {
    showError('请先开始练习')
    return
  }

  // 直接从 CodeMirror 实例获取最新代码（防止 change 事件未触发）
  let codeToCompare = userCode.value
  if (codeMirrorInstance) {
    codeToCompare = codeMirrorInstance.getValue()
    userCode.value = codeToCompare
  }

  if (!codeToCompare.trim()) {
    showError('请输入代码')
    return
  }

  isPracticeActive.value = false
  isTestComplete.value = true
  stopTimer()

  // 计算差异
  diffResult.value = diffCode(sampleCode.value, codeToCompare)

  // 计算得分
  const codeLines = sampleCode.value.split('\n').length
  scoreResult.value = calculateScore({
    timeUsed: timeUsed.value,
    timeLimit: currentDifficulty.value.timeLimit,
    accuracy: diffResult.value.accuracy,
    codeLines,
    correctLines: diffResult.value.correctCount
  })

  // 更新最佳记录
  updateBestRecord()

  if (codeMirrorInstance) {
    codeMirrorInstance.setOption('readOnly', true)
  }

  success(`测试完成！评级：${scoreResult.value.grade}`)
}

const stopPractice = () => {
  isPracticeActive.value = false
  stopTimer()
  if (codeMirrorInstance) {
    codeMirrorInstance.setOption('readOnly', true)
  }
}

const handleReset = () => {
  isPracticeActive.value = false
  isTestComplete.value = false
  timeUsed.value = 0
  userCode.value = ''
  diffResult.value = null
  scoreResult.value = null
  runOutput.value = ''
  showRunOutput.value = false
  stopTimer()

  if (codeMirrorInstance) {
    codeMirrorInstance.setValue('')
    codeMirrorInstance.setOption('readOnly', true)
  }
}

// ==================== 运行代码（仅 JavaScript） ====================

const handleRunCode = () => {
  // 直接从 CodeMirror 获取代码
  let code = userCode.value.trim()
  if (codeMirrorInstance) {
    code = codeMirrorInstance.getValue().trim()
    userCode.value = code
  }

  if (!code) {
    showError('请先输入代码')
    return
  }

  if (selectedLanguage.value !== 'javascript') {
    showError(`${currentLanguage.value.name} 暂不支持在浏览器中运行，仅 JavaScript 可运行`)
    return
  }

  showRunOutput.value = true
  runOutput.value = '运行中...\n'

  try {
    // 捕获 console.log 输出
    const logs: string[] = []
    const originalLog = console.log
    const originalError = console.error
    const originalWarn = console.warn

    console.log = (...args) => {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
      originalLog(...args)
    }
    console.error = (...args) => {
      logs.push('[ERROR] ' + args.map(a => String(a)).join(' '))
      originalError(...args)
    }
    console.warn = (...args) => {
      logs.push('[WARN] ' + args.map(a => String(a)).join(' '))
      originalWarn(...args)
    }

    try {
      // 使用 Function 构造器执行代码
      const fn = new Function(code)
      const result = fn()
      if (result !== undefined) {
        logs.push('返回值: ' + String(result))
      }
    } finally {
      console.log = originalLog
      console.error = originalError
      console.warn = originalWarn
    }

    runOutput.value = logs.length > 0 ? logs.join('\n') : '(无输出)'
  } catch (e: any) {
    runOutput.value = `运行错误: ${e.message}\n${e.stack || ''}`
  }
}

// ==================== 历史记录 ====================

const loadBestRecords = () => {
  try {
    const saved = localStorage.getItem('code_practice_best_records')
    if (saved) {
      bestRecords.value = JSON.parse(saved)
    }
  } catch (e) {
    bestRecords.value = {}
  }
}

const updateBestRecord = () => {
  if (!scoreResult.value) return
  const key = `${selectedLanguage.value}_${selectedDifficulty.value}`
  const current = bestRecords.value[key]

  if (!current || scoreResult.value.totalScore > current.totalScore) {
    bestRecords.value[key] = {
      grade: scoreResult.value.grade,
      totalScore: scoreResult.value.totalScore,
      accuracy: scoreResult.value.accuracyScore,
      timeUsed: timeUsed.value,
      date: new Date().toLocaleString('zh-CN')
    }
    try {
      localStorage.setItem('code_practice_best_records', JSON.stringify(bestRecords.value))
    } catch (e) {
      // localStorage 写入失败，忽略
    }
  }
}

const historyList = computed(() => {
  return Object.entries(bestRecords.value).map(([key, rec]) => {
    const [lang, diff] = key.split('_')
    const langInfo = languages.find(l => l.id === lang as PracticeLanguage)
    const diffInfo = difficulties.find(d => d.id === diff as Difficulty)
    return {
      key,
      language: langInfo?.name || lang,
      languageIcon: langInfo?.icon || '',
      difficulty: diffInfo?.name || diff,
      difficultyIcon: diffInfo?.icon || '',
      ...rec
    }
  }).sort((a, b) => b.totalScore - a.totalScore)
})

const clearHistory = () => {
  if (confirm('确定要清空所有历史记录吗？')) {
    bestRecords.value = {}
    localStorage.removeItem('code_practice_best_records')
    success('历史记录已清空')
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  loadBestRecords()
  await nextTick()
  initCodeMirror()
  // 自动生成第一个样例
  handleGenerateSample()
})

onUnmounted(() => {
  stopTimer()
  if (codeMirrorInstance) {
    codeMirrorInstance.toTextArea()
    codeMirrorInstance = null
  }
})

// 错误行列表（用于底部显示）
const wrongLinesDisplay = computed(() => {
  if (!diffResult.value) return []
  return diffResult.value.wrongLines.map(line => ({
    expected: line.expected,
    actual: line.actual || '(缺失)',
    type: line.isMissing ? '缺失' : line.isExtra ? '多余' : '错误'
  }))
})

// 是否可以运行代码
const canRunCode = computed(() => selectedLanguage.value === 'javascript')
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-7xl">
    <!-- 标题 -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2 flex items-center justify-center gap-2">
        <Keyboard class="w-8 h-8" />
        代码速度练习
      </h1>
      <p class="text-text-secondary">挑战不同语言的代码速度与准确率，提升编码能力</p>
    </div>

    <!-- 语言选择 -->
    <div class="glass rounded-xl p-4 mb-6">
      <div class="flex items-center gap-2 mb-3">
        <Code2 class="w-5 h-5 text-primary" />
        <span class="font-semibold">选择语言</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="lang in languages"
          :key="lang.id"
          @click="selectedLanguage = lang.id"
          :class="`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            selectedLanguage === lang.id
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <span>{{ lang.icon }}</span>
          <span class="font-medium">{{ lang.name }}</span>
        </button>
      </div>
    </div>

    <!-- 难度选择 -->
    <div class="glass rounded-xl p-4 mb-6">
      <div class="flex items-center gap-2 mb-3">
        <Target class="w-5 h-5 text-primary" />
        <span class="font-semibold">选择难度</span>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          v-for="diff in difficulties"
          :key="diff.id"
          @click="selectedDifficulty = diff.id"
          :class="`px-4 py-3 rounded-lg transition-all text-left relative ${
            selectedDifficulty === diff.id
              ? 'bg-gradient-to-br from-primary/30 to-secondary/30 border-2'
              : 'bg-bg-secondary hover:bg-bg-tertiary border-2 border-transparent'
          }`"
          :style="selectedDifficulty === diff.id ? { borderColor: diff.color } : {}"
        >
          <div class="flex items-center gap-2 mb-1">
            <span class="text-2xl">{{ diff.icon }}</span>
            <span class="font-bold text-lg" :style="{ color: diff.color }">{{ diff.name }}</span>
          </div>
          <div class="text-xs text-text-tertiary">{{ diff.description }}</div>
          <div class="text-xs text-text-secondary mt-1">⏱ {{ diff.timeLimit }}s</div>
          <!-- 显示该难度最佳记录 -->
          <div v-if="bestRecords[`${selectedLanguage}_${diff.id}`]" class="mt-2 pt-2 border-t border-white/10">
            <div class="text-xs text-text-tertiary">最佳:</div>
            <div class="flex items-center gap-1 text-xs">
              <span class="font-bold" :style="{ color: bestRecords[`${selectedLanguage}_${diff.id}`].grade === 'SR' ? '#e74c3c' : '#f39c12' }">
                {{ bestRecords[`${selectedLanguage}_${diff.id}`].grade }}
              </span>
              <span class="text-text-secondary">{{ bestRecords[`${selectedLanguage}_${diff.id}`].totalScore }}分</span>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="flex flex-wrap gap-3 mb-3">
      <button
        @click="handleGenerateSample"
        class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-white transition-colors flex items-center gap-2"
      >
        <RefreshCw class="w-4 h-4" />
        切换样例
      </button>

      <button
        @click="handleStartPractice"
        :disabled="isPracticeActive || !sampleCode"
        class="gradient-btn disabled:opacity-50 flex items-center gap-2"
      >
        <Play class="w-4 h-4" />
        开始测试
      </button>

      <button
        @click="handleCompleteTest"
        :disabled="!isPracticeActive"
        class="px-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:from-green-500 hover:to-emerald-500 transition-all disabled:opacity-50 flex items-center gap-2"
      >
        <CheckCircle class="w-4 h-4" />
        测试完毕
      </button>

      <button
        @click="handleReset"
        class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-white transition-colors flex items-center gap-2"
      >
        <X class="w-4 h-4" />
        重置
      </button>

      <button
        v-if="canRunCode"
        @click="handleRunCode"
        :disabled="!userCode.trim()"
        class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 flex items-center gap-2"
      >
        <Zap class="w-4 h-4" />
        运行代码
      </button>

      <button
        @click="showHistory = !showHistory"
        class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-white transition-colors flex items-center gap-2"
      >
        <History class="w-4 h-4" />
        历史记录
      </button>

      <!-- 计时器 -->
      <div class="ml-auto flex items-center gap-3">
        <div
          :class="`px-4 py-2 rounded-lg flex items-center gap-2 font-mono ${
            isOvertime ? 'bg-red-600/30 text-red-400 animate-pulse' :
            isPracticeActive ? 'bg-red-600/20 text-red-400' :
            'bg-bg-secondary text-text-secondary'
          }`"
        >
          <Timer class="w-4 h-4" />
          {{ formatTime(timeUsed) }}
        </div>
        <div class="px-4 py-2 rounded-lg bg-bg-secondary text-text-secondary flex items-center gap-2">
          <Zap class="w-4 h-4" />
          限时 {{ currentDifficulty.timeLimit }}s
        </div>
      </div>
    </div>

    <!-- 时间进度条 -->
    <div v-if="isPracticeActive || isTestComplete" class="mb-6">
      <div class="h-2 rounded-full bg-bg-secondary overflow-hidden">
        <div
          class="h-full transition-all duration-1000"
          :class="isOvertime ? 'bg-red-500' : timeProgress > 80 ? 'bg-orange-500' : 'bg-gradient-to-r from-primary to-secondary'"
          :style="{ width: timeProgress + '%' }"
        ></div>
      </div>
      <div class="flex justify-between text-xs text-text-tertiary mt-1">
        <span>{{ formatTime(timeUsed) }}</span>
        <span>{{ formatTime(currentDifficulty.timeLimit) }}</span>
      </div>
    </div>

    <!-- 代码对比区域 -->
    <div class="grid md:grid-cols-2 gap-6 mb-6">
      <!-- 左侧：样例代码 -->
      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <Code2 class="w-5 h-5 text-primary" />
            样例代码
          </h2>
          <span class="text-xs px-2 py-1 rounded bg-bg-tertiary text-text-secondary">
            {{ currentLanguage.icon }} {{ currentLanguage.name }} · {{ currentDifficulty.icon }} {{ currentDifficulty.name }}
          </span>
        </div>

        <!-- 显示样例代码 -->
        <div class="relative">
          <!-- 无 diff 时显示语法高亮 -->
          <div
            v-if="!diffResult && sampleSyntaxHighlighted"
            class="w-full h-96 p-3 rounded-lg bg-bg-secondary overflow-auto font-mono text-sm leading-relaxed sample-display"
            v-html="sampleSyntaxHighlighted"
          ></div>

          <!-- 无代码提示 -->
          <pre
            v-else-if="!diffResult && !sampleSyntaxHighlighted"
            class="w-full h-96 p-4 rounded-lg bg-bg-secondary overflow-auto font-mono text-sm leading-relaxed text-text-tertiary"
          ><code>点击"切换样例"生成代码</code></pre>

          <!-- 对比结果高亮显示（语法高亮 + 错误行红色背景） -->
          <div
            v-else
            class="w-full h-96 p-3 rounded-lg bg-bg-secondary overflow-auto font-mono text-sm leading-relaxed sample-display"
            v-html="sampleHighlighted"
          ></div>
        </div>
      </div>

      <!-- 右侧：输入区 -->
      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <Keyboard class="w-5 h-5 text-secondary" />
            输入区
          </h2>
          <span
            v-if="isPracticeActive"
            class="text-xs px-2 py-1 rounded bg-green-600/20 text-green-400 flex items-center gap-1"
          >
            <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            录入中
          </span>
          <span v-else-if="isTestComplete" class="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400">
            已完成
          </span>
          <span v-else class="text-xs px-2 py-1 rounded bg-bg-tertiary text-text-secondary">
            待开始
          </span>
        </div>

        <!-- CodeMirror 编辑器 -->
        <div ref="editorContainer" class="code-editor-wrapper"></div>

        <!-- 运行结果 -->
        <div v-if="showRunOutput" class="mt-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs text-text-secondary flex items-center gap-1">
              <Eye class="w-3 h-3" />
              运行输出
            </span>
            <button
              @click="showRunOutput = false"
              class="text-xs text-text-tertiary hover:text-text-primary"
            >
              关闭
            </button>
          </div>
          <pre class="p-3 rounded-lg bg-black/50 text-green-400 font-mono text-xs max-h-40 overflow-auto whitespace-pre-wrap">{{ runOutput }}</pre>
        </div>
      </div>
    </div>

    <!-- 评分结果 -->
    <div v-if="scoreResult" class="glass rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold flex items-center gap-2 mb-4">
        <Trophy class="w-5 h-5 text-yellow-400" />
        测试结果
        <span v-if="currentBestRecord && scoreResult.totalScore >= currentBestRecord.totalScore" class="ml-2 text-xs px-2 py-1 rounded bg-yellow-600/20 text-yellow-400 flex items-center gap-1">
          <Award class="w-3 h-3" />
          新纪录！
        </span>
      </h2>

      <div class="grid md:grid-cols-3 gap-4 mb-4">
        <!-- 评级展示 -->
        <div class="text-center p-6 rounded-lg bg-bg-secondary">
          <div class="text-6xl mb-2">{{ scoreResult.gradeInfo.icon }}</div>
          <div
            class="text-4xl font-bold mb-2"
            :style="{ color: scoreResult.gradeInfo.color }"
          >
            {{ scoreResult.grade }}
          </div>
          <div class="text-sm text-text-secondary">{{ scoreResult.gradeInfo.description }}</div>
        </div>

        <!-- 总分 -->
        <div class="p-6 rounded-lg bg-bg-secondary flex flex-col justify-center">
          <div class="text-sm text-text-secondary mb-1">总分</div>
          <div class="text-5xl font-bold gradient-text mb-3">{{ scoreResult.totalScore }}</div>
          <div class="text-xs text-text-tertiary">/ 100</div>
        </div>

        <!-- 详细数据 -->
        <div class="p-6 rounded-lg bg-bg-secondary space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-sm text-text-secondary">准确率</span>
            <span class="font-bold" :class="scoreResult.accuracyScore >= 80 ? 'text-green-400' : 'text-yellow-400'">
              {{ scoreResult.accuracyScore }}%
            </span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-text-secondary">时间得分</span>
            <span class="font-bold text-blue-400">{{ scoreResult.timeScore }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-sm text-text-secondary">速度得分</span>
            <span class="font-bold text-purple-400">{{ scoreResult.speedScore }}</span>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-white/10">
            <span class="text-sm text-text-secondary">每分钟行数</span>
            <span class="font-bold text-orange-400">{{ scoreResult.wpm }} LPM</span>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="p-3 rounded-lg bg-bg-secondary text-center">
          <div class="text-xs text-text-tertiary mb-1">用时</div>
          <div class="text-lg font-bold text-blue-400">{{ formatTime(scoreResult.details.timeUsed) }}</div>
        </div>
        <div class="p-3 rounded-lg bg-bg-secondary text-center">
          <div class="text-xs text-text-tertiary mb-1">总行数</div>
          <div class="text-lg font-bold">{{ scoreResult.details.codeLines }}</div>
        </div>
        <div class="p-3 rounded-lg bg-bg-secondary text-center">
          <div class="text-xs text-text-tertiary mb-1">正确行数</div>
          <div class="text-lg font-bold text-green-400">{{ scoreResult.details.correctLines }}</div>
        </div>
        <div class="p-3 rounded-lg bg-bg-secondary text-center">
          <div class="text-xs text-text-tertiary mb-1">错误行数</div>
          <div class="text-lg font-bold text-red-400">{{ diffResult?.wrongCount }}</div>
        </div>
      </div>
    </div>

    <!-- 错误行列表 -->
    <div v-if="diffResult && wrongLinesDisplay.length > 0" class="glass rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold flex items-center gap-2 mb-4">
        <AlertTriangle class="w-5 h-5 text-yellow-400" />
        问题代码 ({{ wrongLinesDisplay.length }} 处)
      </h2>

      <div class="space-y-3 max-h-96 overflow-auto">
        <div
          v-for="(line, idx) in wrongLinesDisplay"
          :key="idx"
          class="p-3 rounded-lg bg-bg-secondary border-l-4"
          :class="{
            'border-red-500': line.type === '错误',
            'border-orange-500': line.type === '缺失',
            'border-yellow-500': line.type === '多余'
          }"
        >
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary">
              #{{ idx + 1 }}
            </span>
            <span
              class="text-xs px-2 py-0.5 rounded"
              :class="{
                'bg-red-600/20 text-red-400': line.type === '错误',
                'bg-orange-600/20 text-orange-400': line.type === '缺失',
                'bg-yellow-600/20 text-yellow-400': line.type === '多余'
              }"
            >
              {{ line.type }}
            </span>
          </div>
          <div class="grid md:grid-cols-2 gap-2 text-sm font-mono">
            <div>
              <div class="text-xs text-text-tertiary mb-1">期望:</div>
              <code class="text-green-400">{{ line.expected || '(空)' }}</code>
            </div>
            <div>
              <div class="text-xs text-text-tertiary mb-1">实际:</div>
              <code class="text-red-400">{{ line.actual }}</code>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 完美通过提示 -->
    <div
      v-if="diffResult && diffResult.wrongCount === 0"
      class="glass rounded-xl p-6 text-center mb-6"
    >
      <div class="text-6xl mb-3">🎉</div>
      <h2 class="text-2xl font-bold gradient-text mb-2">完美通过！</h2>
      <p class="text-text-secondary">所有代码都正确，太棒了！</p>
    </div>

    <!-- 历史记录抽屉 -->
    <div v-if="showHistory" class="glass rounded-xl p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-semibold flex items-center gap-2">
          <History class="w-5 h-5 text-primary" />
          最佳记录
        </h2>
        <div class="flex gap-2">
          <button
            v-if="historyList.length > 0"
            @click="clearHistory"
            class="text-xs px-3 py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
          >
            清空记录
          </button>
          <button
            @click="showHistory = false"
            class="text-text-tertiary hover:text-text-primary"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div v-if="historyList.length === 0" class="text-center py-8 text-text-tertiary">
        暂无历史记录，开始你的第一次练习吧！
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div
          v-for="rec in historyList"
          :key="rec.key"
          class="p-4 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors cursor-pointer"
          @click="selectedLanguage = rec.key.split('_')[0] as PracticeLanguage; selectedDifficulty = rec.key.split('_')[1] as Difficulty; showHistory = false"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xl">{{ rec.languageIcon }}</span>
              <span class="font-semibold">{{ rec.language }}</span>
              <ChevronRight class="w-3 h-3 text-text-tertiary" />
              <span class="text-sm">{{ rec.difficultyIcon }} {{ rec.difficulty }}</span>
            </div>
            <span
              class="text-2xl font-bold"
              :style="{ color: rec.grade === 'SR' ? '#e74c3c' : rec.grade === 'S' ? '#f39c12' : '#9b59b6' }"
            >
              {{ rec.grade }}
            </span>
          </div>
          <div class="flex items-center justify-between text-xs text-text-secondary">
            <span>总分: {{ rec.totalScore }}</span>
            <span>准确率: {{ rec.accuracy }}%</span>
            <span>用时: {{ formatTime(rec.timeUsed) }}</span>
          </div>
          <div class="text-xs text-text-tertiary mt-1">{{ rec.date }}</div>
        </div>
      </div>
    </div>

    <!-- 通知 -->
    <div
      v-if="notification"
      :class="`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg transition-all ${
        notification.type === 'success' ? 'bg-green-600 text-white' :
        notification.type === 'error' ? 'bg-red-600 text-white' :
        'bg-blue-600 text-white'
      }`"
    >
      {{ notification.message }}
    </div>
  </div>
</template>

<style scoped>
.code-editor-wrapper {
  height: 384px;
  overflow: hidden;
}

.code-editor-wrapper :deep(.CodeMirror) {
  height: 384px !important;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
}

.sample-display {
  white-space: pre;
  background: #282a36;
}

.sample-display :deep(.sample-line) {
  padding: 0 8px;
  min-height: 1.5em;
  display: flex;
  align-items: baseline;
}

.sample-display :deep(.sample-line .line-no) {
  display: inline-block;
  width: 32px;
  text-align: right;
  margin-right: 12px;
  color: #6272a4;
  user-select: none;
  flex-shrink: 0;
  font-size: 12px;
}

.sample-display :deep(.sample-line .line-content) {
  flex: 1;
  white-space: pre;
}

/* 语法高亮颜色（Dracula 主题风格，与 CodeMirror 一致） */
.sample-display :deep(.hljs-keyword),
.sample-display :deep(.hljs-built_in),
.sample-display :deep(.hljs-type) {
  color: #ff79c6;
}

.sample-display :deep(.hljs-string),
.sample-display :deep(.hljs-meta-string) {
  color: #f1fa8c;
}

.sample-display :deep(.hljs-comment),
.sample-display :deep(.hljs-quote) {
  color: #6272a4;
  font-style: italic;
}

.sample-display :deep(.hljs-number),
.sample-display :deep(.hljs-literal) {
  color: #bd93f9;
}

.sample-display :deep(.hljs-function),
.sample-display :deep(.hljs-title) {
  color: #50fa7b;
}

.sample-display :deep(.hljs-variable),
.sample-display :deep(.hljs-attr) {
  color: #8be9fd;
}

.sample-display :deep(.hljs-tag),
.sample-display :deep(.hljs-name) {
  color: #ff79c6;
}

.sample-display :deep(.hljs-attribute) {
  color: #50fa7b;
}

.sample-display :deep(.hljs-params) {
  color: #f8f8f2;
}

/* 正确行 - 透明背景 */
.sample-display :deep(.sample-correct) {
  background: transparent;
}

/* 错误行 - 红色背景，不覆盖语法高亮的文字颜色 */
.sample-display :deep(.sample-wrong) {
  background: rgba(231, 76, 60, 0.25);
  border-left: 3px solid #e74c3c;
  padding-left: 5px;
  margin-left: -3px;
}

/* 纯语法高亮（无 diff 时）的样式 */
.sample-display :deep(.sample-syntax) {
  background: transparent;
}
</style>
