<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import { encode, decode, calculateHash, batchConvert, batchRadixConvert, convertRadix } from '@/utils/encoderDecoder'
import { Key, Copy, ArrowUpDown, CheckCircle, Hash, Layers } from 'lucide-vue-next'

const inputText = ref('')
const outputText = ref('')
const conversionType = ref<'base64' | 'url' | 'unicode' | 'html' | 'hex' | 'morse' | 'rot13' | 'binary' | 'hash' | 'batch' | 'radix'>('base64')
const conversionDirection = ref<'encode' | 'decode'>('encode')

// Hash相关状态
const hashAlgorithm = ref<'MD5' | 'SHA-1' | 'SHA-256'>('SHA-256')
const hashResults = ref<Record<string, string>>({})

// 批量转换结果
const batchResults = ref<Record<string, string>>({})

// 进制转换状态
const radixInput = ref('')
const fromRadix = ref(10)
const toRadix = ref(2)
const radixResults = ref<Record<string, string>>({})

const { copied, copyToClipboard } = useClipboard()
const { notification, success } = useNotification()

const conversionTypes = [
  { id: 'base64', name: 'Base64', icon: '🔐' },
  { id: 'url', name: 'URL', icon: '🔗' },
  { id: 'unicode', name: 'Unicode', icon: '📝' },
  { id: 'html', name: 'HTML实体', icon: '📄' },
  { id: 'hex', name: '十六进制(字符)', icon: '🔢' },
  { id: 'morse', name: '摩尔斯电码', icon: '📡' },
  { id: 'rot13', name: 'ROT13', icon: '🔄' },
  { id: 'binary', name: '二进制(字符)', icon: '💾' },
  { id: 'radix', name: '进制转换', icon: '🔄' },
  { id: 'hash', name: 'Hash计算', icon: '🔒' },
  { id: 'batch', name: '批量转换', icon: '📦' }
]

// 判断是否为单向转换（Hash、批量转换、进制转换）
const isOneWay = computed(() => {
  return conversionType.value === 'hash' || conversionType.value === 'batch' || conversionType.value === 'radix'
})

// 实时转换
watch([inputText, conversionType, conversionDirection, hashAlgorithm], async () => {
  if (!inputText.value.trim()) {
    outputText.value = ''
    hashResults.value = {}
    batchResults.value = {}
    return
  }

  // Hash计算
  if (conversionType.value === 'hash') {
    try {
      const result = await calculateHash(inputText.value, hashAlgorithm.value)
      hashResults.value = {
        [hashAlgorithm.value]: result
      }
      outputText.value = result
    } catch (e) {
      outputText.value = '计算失败'
    }
    return
  }

  // 批量转换
  if (conversionType.value === 'batch') {
    batchResults.value = batchConvert(inputText.value)
    return
  }

  // 普通编码/解码
  if (conversionDirection.value === 'encode') {
    outputText.value = encode(conversionType.value, inputText.value)
  } else {
    outputText.value = decode(conversionType.value, inputText.value)
  }
})

// 进制转换实时处理
watch([radixInput, fromRadix, toRadix], () => {
  if (!radixInput.value.trim()) {
    radixResults.value = {}
    return
  }

  // 单向转换
  outputText.value = convertRadix(radixInput.value, fromRadix.value, toRadix.value)

  // 如果是十进制，批量转换所有进制
  if (fromRadix.value === 10) {
    radixResults.value = batchRadixConvert(radixInput.value)
  } else {
    radixResults.value = {}
  }
})

const toggleDirection = () => {
  if (isOneWay.value) return

  conversionDirection.value = conversionDirection.value === 'encode' ? 'decode' : 'encode'
  // 同时交换输入输出
  const temp = inputText.value
  inputText.value = outputText.value
  outputText.value = temp
}

const handleCopy = async (text?: string) => {
  const textToCopy = text || outputText.value
  if (!textToCopy.trim()) return

  if (await copyToClipboard(textToCopy)) {
    success('已复制到剪贴板')
  }
}

// 批量复制所有结果
const handleBatchCopy = async () => {
  const allResults = Object.entries(batchResults.value)
    .map(([key, value]) => `${key}:\n${value}`)
    .join('\n\n')

  if (await copyToClipboard(allResults)) {
    success('已复制所有结果')
  }
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-5xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">编码转换工具</h1>
      <p class="text-text-secondary">支持Base64、URL、Unicode、摩尔斯电码、ROT13、二进制、Hash等多种编码转换</p>
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

      <!-- 功能说明 -->
      <div class="mt-4 p-3 rounded-lg bg-bg-secondary/50 text-sm text-text-secondary">
        <template v-if="conversionType === 'base64'">
          <strong class="text-primary">Base64：</strong>将二进制数据转换为可打印ASCII字符。常用于邮件传输、图片转文本、简单加密等。
        </template>
        <template v-else-if="conversionType === 'url'">
          <strong class="text-primary">URL编码：</strong>将URL中的特殊字符转换为%XX格式。常用于网址参数传递、解决中文乱码。
        </template>
        <template v-else-if="conversionType === 'unicode'">
          <strong class="text-primary">Unicode：</strong>将字符转换为\uXXXX格式。常用于编程中表示特殊字符、解决编码问题。
        </template>
        <template v-else-if="conversionType === 'html'">
          <strong class="text-primary">HTML实体：</strong>将HTML特殊字符转换为&amp;xxx;格式。常用于网页显示代码、防止XSS攻击。
        </template>
        <template v-else-if="conversionType === 'hex'">
          <strong class="text-primary">十六进制(字符)：</strong>将每个字符转换为对应的ASCII码(十六进制)。如 'A' → '41'，'1' → '31'。适用于字符编码分析。
        </template>
        <template v-else-if="conversionType === 'morse'">
          <strong class="text-primary">摩尔斯电码：</strong>将字母数字转换为点和划的组合。常用于无线电通信、加密解密游戏。
        </template>
        <template v-else-if="conversionType === 'rot13'">
          <strong class="text-primary">ROT13：</strong>凯撒密码的一种，将字母向后移13位。加密和解密使用同一操作，常用于隐藏 spoilers。
        </template>
        <template v-else-if="conversionType === 'binary'">
          <strong class="text-primary">二进制(字符)：</strong>将每个字符转换为对应的ASCII码(二进制)。如 'A' → '01000001'，'1' → '00110001'。适用于理解计算机底层编码。
        </template>
        <template v-else-if="conversionType === 'radix'">
          <strong class="text-primary">进制转换：</strong>数值在不同进制间转换（二/八/十/十六进制）。如十进制255 → 十六进制FF → 二进制11111111。输入十进制可同时显示所有进制。
        </template>
        <template v-else-if="conversionType === 'hash'">
          <strong class="text-primary">Hash计算：</strong>生成文本的哈希指纹（MD5/SHA-1/SHA-256）。单向不可逆，常用于校验文件完整性、密码存储。
        </template>
        <template v-else-if="conversionType === 'batch'">
          <strong class="text-primary">批量转换：</strong>一键生成所有编码格式的转换结果，方便对比和选择。
        </template>
      </div>
    </div>

    <!-- Hash算法选择 -->
    <div v-if="conversionType === 'hash'" class="glass rounded-xl p-4 mb-6">
      <div class="flex items-center gap-4">
        <Hash class="w-5 h-5 text-primary" />
        <span class="text-white font-semibold">选择Hash算法：</span>
        <div class="flex gap-2">
          <button
            @click="hashAlgorithm = 'MD5'"
            :class="`px-4 py-2 rounded-lg transition-all ${
              hashAlgorithm === 'MD5'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
            }`"
          >
            MD5
          </button>
          <button
            @click="hashAlgorithm = 'SHA-1'"
            :class="`px-4 py-2 rounded-lg transition-all ${
              hashAlgorithm === 'SHA-1'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
            }`"
          >
            SHA-1
          </button>
          <button
            @click="hashAlgorithm = 'SHA-256'"
            :class="`px-4 py-2 rounded-lg transition-all ${
              hashAlgorithm === 'SHA-256'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
            }`"
          >
            SHA-256
          </button>
        </div>
      </div>
    </div>

    <!-- 进制转换界面 -->
    <div v-if="conversionType === 'radix'" class="glass rounded-xl p-6 mb-6">
      <div class="grid md:grid-cols-2 gap-6">
        <!-- 输入区 -->
        <div>
          <div class="flex items-center gap-4 mb-4">
            <label class="text-white font-semibold">输入数值：</label>
            <select v-model="fromRadix" class="px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none">
              <option :value="2">二进制</option>
              <option :value="8">八进制</option>
              <option :value="10">十进制</option>
              <option :value="16">十六进制</option>
            </select>
          </div>
          <input
            v-model="radixInput"
            type="text"
            placeholder="输入数值..."
            class="w-full p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-lg"
          />
          <p class="text-xs text-text-tertiary mt-2">提示：输入十进制数可同时显示所有进制结果</p>
        </div>

        <!-- 输出区 -->
        <div>
          <div class="flex items-center gap-4 mb-4">
            <label class="text-white font-semibold">转换结果：</label>
            <select v-model="toRadix" class="px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none">
              <option :value="2">二进制</option>
              <option :value="8">八进制</option>
              <option :value="10">十进制</option>
              <option :value="16">十六进制</option>
            </select>
          </div>
          <div class="relative">
            <input
              v-model="outputText"
              readonly
              type="text"
              placeholder="转换结果..."
              class="w-full p-4 rounded-lg bg-bg-secondary text-success placeholder:text-text-tertiary focus:outline-none font-mono text-lg"
            />
            <button
              v-if="outputText.trim()"
              @click="handleCopy()"
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

      <!-- 批量转换结果（仅十进制输入时显示） -->
      <div v-if="Object.keys(radixResults).length > 0" class="mt-6">
        <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
          <Layers class="w-5 h-5" />
          所有进制结果
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div v-for="(value, key) in radixResults" :key="key" class="glass rounded-lg p-4 relative group">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-primary">{{ key }}</h4>
              <button
                @click="handleCopy(value)"
                :class="`px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                  copied ? 'bg-success text-white' : 'bg-bg-tertiary hover:bg-success/80 text-white'
                }`"
              >
                <CheckCircle v-if="copied" class="w-3 h-3" />
                <Copy v-else class="w-3 h-3" />
              </button>
            </div>
            <div class="text-sm text-text-secondary font-mono bg-bg-secondary p-2 rounded break-all">
              {{ value }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主界面 - 普通转换（排除进制转换） -->
    <div v-if="conversionType !== 'batch' && conversionType !== 'radix'" class="grid md:grid-cols-2 gap-6">
      <!-- Input Section -->
      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">
            {{ conversionType === 'hash' ? '输入文本' : (conversionDirection === 'encode' ? '原始文本' : '编码文本') }}
          </h2>
          <span v-if="!isOneWay" class="text-sm px-3 py-1 rounded-lg bg-primary/20 text-primary">
            {{ conversionDirection === 'encode' ? '编码' : '解码' }}
          </span>
          <span v-else class="text-sm px-3 py-1 rounded-lg bg-info/20 text-info">
            单向转换
          </span>
        </div>

        <textarea
          v-model="inputText"
          placeholder="输入要转换的文本..."
          class="w-full h-48 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 font-mono"
        />

        <div class="flex gap-3">
          <button
            v-if="!isOneWay"
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
            {{ conversionType === 'hash' ? 'Hash值' : (conversionDirection === 'encode' ? '编码结果' : '解码结果') }}
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
            @click="handleCopy()"
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

    <!-- 批量转换界面 -->
    <div v-if="conversionType === 'batch'" class="glass rounded-xl p-6">
      <div class="mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">输入文本</h2>
          <span class="text-sm px-3 py-1 rounded-lg bg-info/20 text-info">
            批量转换
          </span>
        </div>

        <textarea
          v-model="inputText"
          placeholder="输入要转换的文本..."
          class="w-full h-32 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
        />
      </div>

      <!-- 批量结果 -->
      <div v-if="Object.keys(batchResults).length > 0" class="space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <Layers class="w-5 h-5" />
            转换结果
          </h2>
          <button
            @click="handleBatchCopy"
            class="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Copy class="w-4 h-4" />
            复制全部
          </button>
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div
            v-for="(value, key) in batchResults"
            :key="key"
            class="glass rounded-lg p-4 relative group"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold text-primary">{{ key }}</h3>
              <button
                @click="handleCopy(value)"
                :class="`px-2 py-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                  copied ? 'bg-success text-white' : 'bg-bg-tertiary hover:bg-success/80 text-white'
                }`"
              >
                <CheckCircle v-if="copied" class="w-3 h-3" />
                <Copy v-else class="w-3 h-3" />
              </button>
            </div>
            <div class="text-sm text-text-secondary font-mono bg-bg-secondary p-2 rounded max-h-24 overflow-y-auto">
              {{ value }}
            </div>
          </div>
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