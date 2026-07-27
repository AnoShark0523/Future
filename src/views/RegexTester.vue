<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import { 
  Search, 
  Copy, 
  CheckCircle, 
  Code, 
  BookOpen, 
  AlertCircle,
  Layers,
  FileCode,
  Sparkles
} from 'lucide-vue-next'

const regexPattern = ref('')
const regexFlags = ref({
  g: true,
  i: false,
  m: false,
  s: false,
  u: false
})
const testText = ref('')
const selectedTemplate = ref('')
const selectedCodeLanguage = ref<'javascript' | 'python' | 'java'>('javascript')

const { copied, copyToClipboard } = useClipboard()
const { notification, success, error } = useNotification()

// 常用正则表达式模板
const regexTemplates = [
  { 
    name: '邮箱', 
    pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
    description: '匹配标准邮箱地址格式',
    example: 'example@domain.com'
  },
  { 
    name: '手机号(中国)', 
    pattern: '1[3-9]\\d{9}',
    description: '匹配中国大陆手机号码',
    example: '13812345678'
  },
  { 
    name: 'URL', 
    pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)',
    description: '匹配HTTP/HTTPS URL',
    example: 'https://www.example.com/path'
  },
  { 
    name: 'IP地址(IPv4)', 
    pattern: '((25[0-5]|2[0-4]\\d|[01]?\\d?\\d)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d?\\d)',
    description: '匹配IPv4地址',
    example: '192.168.1.1'
  },
  { 
    name: '身份证号(中国)', 
    pattern: '[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[0-9Xx]',
    description: '匹配18位中国身份证号码',
    example: '110101199001011234'
  },
  { 
    name: '日期(YYYY-MM-DD)', 
    pattern: '\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])',
    description: '匹配标准日期格式',
    example: '2024-01-15'
  },
  { 
    name: '时间(HH:MM:SS)', 
    pattern: '([01]?\\d|2[0-3]):[0-5]\\d:[0-5]\\d',
    description: '匹配24小时制时间格式',
    example: '14:30:25'
  },
  { 
    name: 'HTML标签', 
    pattern: '<([a-z]+)([^<]+)*(?:>(.*)<\/\\1>|\\s+\\/>)',
    description: '匹配HTML标签',
    example: '<div class="test">content</div>'
  },
  { 
    name: '中文字符', 
    pattern: '[\\u4e00-\\u9fa5]+',
    description: '匹配中文字符',
    example: '测试中文'
  },
  { 
    name: '数字(整数)', 
    pattern: '-?\\d+',
    description: '匹配整数（包括负数）',
    example: '123 或 -456'
  },
  { 
    name: '浮点数', 
    pattern: '-?\\d+\\.\\d+',
    description: '匹配浮点数（包括负数）',
    example: '3.14 或 -2.5'
  },
  { 
    name: '用户名(字母开头)', 
    pattern: '[a-zA-Z][a-zA-Z0-9_]{3,15}',
    description: '匹配4-16位用户名，字母开头，可包含字母、数字、下划线',
    example: 'user123'
  }
]

// 构建正则表达式标志字符串
const flagsString = computed(() => {
  const flags: string[] = []
  if (regexFlags.value.g) flags.push('g')
  if (regexFlags.value.i) flags.push('i')
  if (regexFlags.value.m) flags.push('m')
  if (regexFlags.value.s) flags.push('s')
  if (regexFlags.value.u) flags.push('u')
  return flags.join('')
})

// 匹配结果
interface MatchResult {
  match: string
  index: number
  groups: Record<string, string> | null
  groupsArray: string[]
}

const matchResults = ref<MatchResult[]>([])
const matchError = ref('')
const highlightedText = ref('')

// 执行正则匹配
const executeMatch = () => {
  matchError.value = ''
  matchResults.value = []
  highlightedText.value = testText.value

  if (!regexPattern.value.trim() || !testText.value.trim()) {
    return
  }

  try {
    const regex = new RegExp(regexPattern.value, flagsString.value)
    const matches: MatchResult[] = []
    let match

    if (regexFlags.value.g) {
      // 全局匹配
      while ((match = regex.exec(testText.value)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.groups || null,
          groupsArray: match.slice(1)
        })
        // 防止零宽断言导致的无限循环
        if (match[0].length === 0) {
          regex.lastIndex++
        }
      }
    } else {
      // 单次匹配
      match = regex.exec(testText.value)
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.groups || null,
          groupsArray: match.slice(1)
        })
      }
    }

    matchResults.value = matches

    // 生成高亮文本
    if (matches.length > 0) {
      let result = ''
      let lastIndex = 0
      
      matches.forEach((m, idx) => {
        result += escapeHtml(testText.value.slice(lastIndex, m.index))
        result += `<mark class="bg-primary/30 text-primary px-0.5 rounded">${escapeHtml(m.match)}</mark>`
        lastIndex = m.index + m.match.length
      })
      result += escapeHtml(testText.value.slice(lastIndex))
      highlightedText.value = result
    }
  } catch (e: any) {
    matchError.value = e.message
  }
}

// HTML转义
const escapeHtml = (text: string): string => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 监听变化实时匹配
watch([regexPattern, testText, regexFlags], executeMatch, { deep: true })

// 应用模板
const applyTemplate = (template: typeof regexTemplates[0]) => {
  regexPattern.value = template.pattern
  selectedTemplate.value = template.name
  regexFlags.value = { g: true, i: false, m: false, s: false, u: false }
  success(`已应用"${template.name}"模板`)
}

// 切换标志
const toggleFlag = (flag: 'g' | 'i' | 'm' | 's' | 'u') => {
  regexFlags.value[flag] = !regexFlags.value[flag]
}

// 生成代码
const generatedCode = computed(() => {
  if (!regexPattern.value.trim()) return ''

  const pattern = regexPattern.value
  const flags = flagsString.value

  switch (selectedCodeLanguage.value) {
    case 'javascript':
      return `// JavaScript 正则表达式
const regex = /${pattern}/${flags};
const text = '${testText.value.replace(/'/g, "\\'")}';
const matches = text.match(regex);

if (matches) {
  console.log('匹配结果:', matches);
  matches.forEach((match, index) => {
    console.log(\`匹配 \${index + 1}: \${match}\`);
  });
}`

    case 'python':
      return `# Python 正则表达式
import re

pattern = r'${pattern}'
flags = ${flags.includes('i') ? 're.IGNORECASE' : '0'}${flags.includes('m') ? ' | re.MULTILINE' : ''}${flags.includes('s') ? ' | re.DOTALL' : ''}
text = '''${testText.value.replace(/'/g, "\\'")}'''

${flags.includes('g') ? `matches = re.findall(pattern, text${flags.includes('i') || flags.includes('m') || flags.includes('s') ? ', flags' : ''})
for i, match in enumerate(matches, 1):
    print(f'匹配 {i}: {match}')` : `match = re.search(pattern, text${flags.includes('i') || flags.includes('m') || flags.includes('s') ? ', flags' : ''})
if match:
    print(f'匹配: {match.group()}')`}`

    case 'java':
      return `// Java 正则表达式
import java.util.regex.*;

String pattern = "${pattern.replace(/\\/g, '\\\\')}";
String text = "${testText.value.replace(/"/g, '\\"').replace(/\\/g, '\\\\')}";
${flags.includes('i') ? 'Pattern patternObj = Pattern.compile(pattern, Pattern.CASE_INSENSITIVE);' : 'Pattern patternObj = Pattern.compile(pattern);'}
Matcher matcher = patternObj.matcher(text);

${flags.includes('g') ? `int count = 0;
while (matcher.find()) {
    count++;
    System.out.println("匹配 " + count + ": " + matcher.group());
}` : `if (matcher.find()) {
    System.out.println("匹配: " + matcher.group());
}`}`

    default:
      return ''
  }
})

// 正则表达式解释
const regexExplanation = computed(() => {
  if (!regexPattern.value.trim()) return ''

  const explanations: string[] = []
  const pattern = regexPattern.value

  // 常见正则表达式元字符解释
  const metaChars: Record<string, string> = {
    '.': '匹配除换行符外的任意字符',
    '^': '匹配字符串开头',
    '$': '匹配字符串结尾',
    '*': '匹配前面的子表达式零次或多次',
    '+': '匹配前面的子表达式一次或多次',
    '?': '匹配前面的子表达式零次或一次',
    '\\': '转义字符，用于匹配特殊字符',
    '|': '或运算符，匹配左边或右边的表达式',
    '()': '分组，捕获匹配的内容',
    '[]': '字符集合，匹配方括号内的任意字符',
    '{}': '量词，指定匹配次数',
    '\\d': '匹配数字 [0-9]',
    '\\D': '匹配非数字 [^0-9]',
    '\\w': '匹配单词字符 [a-zA-Z0-9_]',
    '\\W': '匹配非单词字符',
    '\\s': '匹配空白字符',
    '\\S': '匹配非空白字符',
    '\\b': '匹配单词边界',
    '\\B': '匹配非单词边界'
  }

  // 检查是否包含常见元字符
  Object.entries(metaChars).forEach(([char, desc]) => {
    if (pattern.includes(char)) {
      explanations.push(`• ${char}: ${desc}`)
    }
  })

  // 检查量词
  if (/\{\d+\}/.test(pattern)) {
    explanations.push('• {n}: 精确匹配n次')
  }
  if (/\{\d+,\}/.test(pattern)) {
    explanations.push('• {n,}: 至少匹配n次')
  }
  if (/\{\d+,\d+\}/.test(pattern)) {
    explanations.push('• {n,m}: 匹配n到m次')
  }

  // 检查标志
  const flagExplanations: string[] = []
  if (regexFlags.value.g) flagExplanations.push('g: 全局匹配（查找所有匹配）')
  if (regexFlags.value.i) flagExplanations.push('i: 忽略大小写')
  if (regexFlags.value.m) flagExplanations.push('m: 多行匹配')
  if (regexFlags.value.s) flagExplanations.push('s: 让.匹配包括换行符')
  if (regexFlags.value.u) flagExplanations.push('u: Unicode模式')

  if (flagExplanations.length > 0) {
    explanations.push('\n标志说明:')
    flagExplanations.forEach(f => explanations.push(`• ${f}`))
  }

  return explanations.length > 0 ? explanations.join('\n') : '暂无特殊元字符'
})

// 复制代码
const handleCopyCode = async () => {
  if (!generatedCode.value) return
  
  if (await copyToClipboard(generatedCode.value)) {
    success('代码已复制到剪贴板')
  }
}

// 复制正则表达式
const handleCopyRegex = async () => {
  if (!regexPattern.value) return
  
  const fullRegex = `/${regexPattern.value}/${flagsString.value}`
  if (await copyToClipboard(fullRegex)) {
    success('正则表达式已复制到剪贴板')
  }
}

// 复制单个匹配结果
const handleCopyMatch = async (match: string) => {
  if (await copyToClipboard(match)) {
    success('已复制匹配结果')
  }
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-7xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">正则表达式测试器</h1>
      <p class="text-text-secondary">实时测试正则表达式匹配、生成代码、提供详细解释</p>
    </div>

    <!-- 正则表达式模板 -->
    <div class="glass rounded-xl p-4 mb-6">
      <div class="flex items-center gap-2 mb-3">
        <Sparkles class="w-5 h-5 text-primary" />
        <h3 class="text-white font-semibold">常用模板</h3>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="template in regexTemplates"
          :key="template.name"
          @click="applyTemplate(template)"
          :class="`px-4 py-2 rounded-lg transition-all text-sm ${
            selectedTemplate === template.name
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary hover:text-white'
          }`"
        >
          {{ template.name }}
        </button>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- 左侧：输入区 -->
      <div class="space-y-6">
        <!-- 正则表达式输入 -->
        <div class="glass rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold flex items-center gap-2">
              <Search class="w-5 h-5" />
              正则表达式
            </h2>
            <button
              v-if="regexPattern"
              @click="handleCopyRegex"
              :class="`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 text-sm ${
                copied ? 'bg-success text-white' : 'bg-bg-tertiary hover:bg-success/80 text-white'
              }`"
            >
              <CheckCircle v-if="copied" class="w-4 h-4" />
              <Copy v-else class="w-4 h-4" />
              {{ copied ? '已复制' : '复制' }}
            </button>
          </div>

          <!-- 正则表达式输入框 -->
          <div class="relative mb-4">
            <input
              v-model="regexPattern"
              type="text"
              placeholder="输入正则表达式..."
              class="w-full p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-lg pr-12"
            />
            <div class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary font-mono">
              /{{ flagsString }}
            </div>
          </div>

          <!-- 标志选择 -->
          <div class="flex flex-wrap gap-2">
            <button
              v-for="(value, flag) in regexFlags"
              :key="flag"
              @click="toggleFlag(flag as 'g' | 'i' | 'm' | 's' | 'u')"
              :class="`px-3 py-1.5 rounded-lg transition-all text-sm font-semibold ${
                value
                  ? 'bg-primary text-white shadow-md'
                  : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
              }`"
            >
              {{ flag }}
            </button>
            <div class="flex items-center gap-2 ml-2 text-sm text-text-secondary">
              <span class="text-primary">g</span>全局
              <span class="text-primary">i</span>忽略大小写
              <span class="text-primary">m</span>多行
              <span class="text-primary">s</span>点号换行
              <span class="text-primary">u</span>Unicode
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="matchError" class="mt-4 p-3 rounded-lg bg-error/10 border border-error/20">
            <div class="flex items-center gap-2 text-error">
              <AlertCircle class="w-4 h-4" />
              <span class="text-sm font-medium">{{ matchError }}</span>
            </div>
          </div>
        </div>

        <!-- 测试文本输入 -->
        <div class="glass rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4">测试文本</h2>
          <textarea
            v-model="testText"
            placeholder="输入测试文本..."
            class="w-full h-48 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
          />
        </div>

        <!-- 正则表达式解释 -->
        <div v-if="regexExplanation" class="glass rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <BookOpen class="w-5 h-5" />
            正则表达式解释
          </h2>
          <pre class="text-sm text-text-secondary whitespace-pre-wrap bg-bg-secondary p-4 rounded-lg font-mono">{{ regexExplanation }}</pre>
        </div>
      </div>

      <!-- 右侧：结果区 -->
      <div class="space-y-6">
        <!-- 高亮匹配结果 -->
        <div class="glass rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">匹配结果</h2>
            <span v-if="matchResults.length > 0" class="px-3 py-1 rounded-lg bg-success/20 text-success text-sm font-semibold">
              {{ matchResults.length }} 个匹配
            </span>
          </div>

          <div class="relative">
            <div
              v-if="testText"
              class="w-full min-h-48 p-4 rounded-lg bg-bg-secondary text-white font-mono text-sm whitespace-pre-wrap break-words"
              v-html="highlightedText"
            />
            <div
              v-else
              class="w-full h-48 p-4 rounded-lg bg-bg-secondary text-text-tertiary font-mono text-sm flex items-center justify-center"
            >
              等待输入测试文本...
            </div>
          </div>
        </div>

        <!-- 匹配详情列表 -->
        <div v-if="matchResults.length > 0" class="glass rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Layers class="w-5 h-5" />
            匹配详情
          </h2>
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div
              v-for="(result, index) in matchResults"
              :key="index"
              class="bg-bg-secondary rounded-lg p-4 relative group"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-mono">#{{ index + 1 }}</span>
                  <span class="text-text-tertiary text-xs">位置: {{ result.index }}</span>
                </div>
                <button
                  @click="handleCopyMatch(result.match)"
                  :class="`px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                    copied ? 'bg-success text-white' : 'bg-bg-tertiary hover:bg-success/80 text-white'
                  }`"
                >
                  <CheckCircle v-if="copied" class="w-3 h-3" />
                  <Copy v-else class="w-3 h-3" />
                </button>
              </div>
              <div class="text-white font-mono bg-bg-tertiary p-2 rounded text-sm">
                {{ result.match }}
              </div>
              
              <!-- 捕获组 -->
              <div v-if="result.groupsArray.length > 0 || result.groups" class="mt-2">
                <div class="text-xs text-text-secondary mb-1">捕获组:</div>
                <div class="space-y-1">
                  <div
                    v-for="(group, gIndex) in result.groupsArray"
                    :key="gIndex"
                    class="text-xs font-mono bg-bg-tertiary p-1.5 rounded"
                  >
                    <span class="text-text-tertiary">${{ gIndex + 1 }}:</span>
                    <span class="text-success ml-1">{{ group || '空' }}</span>
                  </div>
                  <div
                    v-if="result.groups"
                    v-for="(value, key) in result.groups"
                    :key="key"
                    class="text-xs font-mono bg-bg-tertiary p-1.5 rounded"
                  >
                    <span class="text-text-tertiary">{{ key }}:</span>
                    <span class="text-info ml-1">{{ value || '空' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 代码生成 -->
        <div v-if="regexPattern && !matchError" class="glass rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold flex items-center gap-2">
              <FileCode class="w-5 h-5" />
              生成代码
            </h2>
            <div class="flex gap-2">
              <button
                v-for="lang in ['javascript', 'python', 'java']"
                :key="lang"
                @click="selectedCodeLanguage = lang as any"
                :class="`px-3 py-1 rounded-lg transition-all text-sm font-medium ${
                  selectedCodeLanguage === lang
                    ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md'
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
                }`"
              >
                {{ lang.charAt(0).toUpperCase() + lang.slice(1) }}
              </button>
            </div>
          </div>

          <div class="relative">
            <pre class="text-sm text-text-secondary bg-bg-secondary p-4 rounded-lg font-mono overflow-x-auto max-h-48 overflow-y-auto">{{ generatedCode }}</pre>
            <button
              v-if="generatedCode"
              @click="handleCopyCode"
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
    </div>

    <!-- 模板说明卡片 -->
    <div v-if="selectedTemplate" class="glass rounded-xl p-6 mt-6">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
          <Code class="w-6 h-6 text-white" />
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-semibold mb-2">{{ selectedTemplate }}</h3>
          <p class="text-text-secondary text-sm">
            {{ regexTemplates.find(t => t.name === selectedTemplate)?.description }}
          </p>
          <p class="text-text-tertiary text-xs mt-2">
            示例: <code class="bg-bg-secondary px-2 py-1 rounded font-mono">{{ regexTemplates.find(t => t.name === selectedTemplate)?.example }}</code>
          </p>
        </div>
      </div>
    </div>

    <!-- Notification -->
    <div
      v-if="notification"
      :class="`fixed bottom-8 right-8 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-all ${
        notification.type === 'success' ? 'bg-success' : notification.type === 'error' ? 'bg-error' : 'bg-info'
      }`"
    >
      {{ notification.message }}
    </div>
  </div>
</template>