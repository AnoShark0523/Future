<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import { Key, Copy, CheckCircle, RefreshCw, Shield, AlertTriangle } from 'lucide-vue-next'

// 密码配置
const passwordLength = ref(16)
const includeUppercase = ref(true)
const includeLowercase = ref(true)
const includeNumbers = ref(true)
const includeSymbols = ref(true)
const generatedPassword = ref('')
const batchPasswords = ref<string[]>([])
const isBatchMode = ref(false)

const { copied, copyToClipboard } = useClipboard()
const { notification, success, error } = useNotification()

// 字符集定义
const charSets = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
}

// 计算可用字符集
const availableChars = computed(() => {
  let chars = ''
  if (includeUppercase.value) chars += charSets.uppercase
  if (includeLowercase.value) chars += charSets.lowercase
  if (includeNumbers.value) chars += charSets.numbers
  if (includeSymbols.value) chars += charSets.symbols
  return chars
})

// 计算密码强度
const passwordStrength = computed(() => {
  if (!generatedPassword.value) return { level: '', score: 0, color: '', width: '0%' }
  
  let score = 0
  const pwd = generatedPassword.value
  
  // 长度分数
  if (pwd.length >= 8) score += 1
  if (pwd.length >= 12) score += 1
  if (pwd.length >= 16) score += 1
  if (pwd.length >= 20) score += 1
  
  // 字符类型分数
  if (/[A-Z]/.test(pwd)) score += 1
  if (/[a-z]/.test(pwd)) score += 1
  if (/[0-9]/.test(pwd)) score += 1
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1
  
  // 计算强度等级
  if (score <= 3) {
    return { level: '弱', score, color: 'bg-error', width: '25%' }
  } else if (score <= 5) {
    return { level: '中', score, color: 'bg-warning', width: '50%' }
  } else if (score <= 6) {
    return { level: '强', score, color: 'bg-success', width: '75%' }
  } else {
    return { level: '非常强', score, color: 'bg-gradient-to-r from-success to-info', width: '100%' }
  }
})

// 生成密码
const generatePassword = () => {
  if (!availableChars.value) {
    error('请至少选择一种字符类型')
    return
  }
  
  let password = ''
  const chars = availableChars.value
  const array = new Uint32Array(passwordLength.value)
  crypto.getRandomValues(array)
  
  for (let i = 0; i < passwordLength.value; i++) {
    password += chars[array[i] % chars.length]
  }
  
  generatedPassword.value = password
  success('密码生成成功')
}

// 批量生成密码
const generateBatchPasswords = () => {
  if (!availableChars.value) {
    error('请至少选择一种字符类型')
    return
  }
  
  const passwords: string[] = []
  const chars = availableChars.value
  
  for (let j = 0; j < 10; j++) {
    let password = ''
    const array = new Uint32Array(passwordLength.value)
    crypto.getRandomValues(array)
    
    for (let i = 0; i < passwordLength.value; i++) {
      password += chars[array[i] % chars.length]
    }
    passwords.push(password)
  }
  
  batchPasswords.value = passwords
  success('批量生成成功')
}

// 复制密码
const handleCopy = async (password?: string) => {
  const textToCopy = password || generatedPassword.value
  if (!textToCopy) return
  
  if (await copyToClipboard(textToCopy)) {
    success('已复制到剪贴板')
  }
}

// 初始化生成一个密码
generatePassword()
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-5xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">密码生成器</h1>
      <p class="text-text-secondary">生成强密码，保护您的账户安全</p>
    </div>

    <!-- Mode Toggle -->
    <div class="glass rounded-xl p-4 mb-6">
      <div class="flex gap-2">
        <button
          @click="isBatchMode = false"
          :class="`px-6 py-3 rounded-lg transition-all ${
            !isBatchMode
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <Key class="w-5 h-5 inline mr-2" />
          单个生成
        </button>
        <button
          @click="isBatchMode = true"
          :class="`px-6 py-3 rounded-lg transition-all ${
            isBatchMode
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <RefreshCw class="w-5 h-5 inline mr-2" />
          批量生成
        </button>
      </div>
    </div>

    <!-- Single Password Mode -->
    <div v-if="!isBatchMode" class="grid md:grid-cols-2 gap-6">
      <!-- Config Section -->
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">密码配置</h2>

        <!-- Length Slider -->
        <div class="mb-6">
          <div class="flex justify-between mb-2">
            <label class="font-semibold">密码长度:</label>
            <span class="text-primary font-bold">{{ passwordLength }} 位</span>
          </div>
          <input
            v-model="passwordLength"
            type="range"
            min="6"
            max="64"
            step="1"
            class="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer"
          />
          <div class="flex justify-between text-xs text-text-tertiary mt-1">
            <span>6</span>
            <span>64</span>
          </div>
        </div>

        <!-- Character Options -->
        <div class="mb-6">
          <label class="font-semibold mb-3 block">包含字符:</label>
          <div class="space-y-3">
            <label class="flex items-center gap-3 cursor-pointer group">
              <input
                v-model="includeUppercase"
                type="checkbox"
                class="w-5 h-5 rounded bg-bg-secondary border-2 border-primary/30 checked:bg-primary cursor-pointer"
              />
              <span class="text-text-secondary group-hover:text-white transition-colors">大写字母 (A-Z)</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer group">
              <input
                v-model="includeLowercase"
                type="checkbox"
                class="w-5 h-5 rounded bg-bg-secondary border-2 border-primary/30 checked:bg-primary cursor-pointer"
              />
              <span class="text-text-secondary group-hover:text-white transition-colors">小写字母 (a-z)</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer group">
              <input
                v-model="includeNumbers"
                type="checkbox"
                class="w-5 h-5 rounded bg-bg-secondary border-2 border-primary/30 checked:bg-primary cursor-pointer"
              />
              <span class="text-text-secondary group-hover:text-white transition-colors">数字 (0-9)</span>
            </label>
            <label class="flex items-center gap-3 cursor-pointer group">
              <input
                v-model="includeSymbols"
                type="checkbox"
                class="w-5 h-5 rounded bg-bg-secondary border-2 border-primary/30 checked:bg-primary cursor-pointer"
              />
              <span class="text-text-secondary group-hover:text-white transition-colors">特殊符号 (!@#$%...)</span>
            </label>
          </div>
        </div>

        <!-- Generate Button -->
        <button
          @click="generatePassword"
          class="w-full gradient-btn flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-5 h-5" />
          <span>生成密码</span>
        </button>
      </div>

      <!-- Result Section -->
      <div class="glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">生成的密码</h2>
          <button
            v-if="generatedPassword"
            @click="handleCopy()"
            :class="`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              copied ? 'bg-success text-white' : 'bg-bg-tertiary hover:bg-success/80 text-white'
            }`"
          >
            <CheckCircle v-if="copied" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
            <span class="text-sm">{{ copied ? '已复制' : '复制' }}</span>
          </button>
        </div>

        <!-- Password Display -->
        <div v-if="generatedPassword" class="space-y-4">
          <div class="p-4 rounded-lg bg-bg-secondary border-2 border-primary/30">
            <p class="font-mono text-lg text-success break-all select-all">{{ generatedPassword }}</p>
          </div>

          <!-- Password Strength -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-sm text-text-tertiary flex items-center gap-1">
                <Shield class="w-4 h-4" />
                密码强度:
              </span>
              <span
                :class="`text-sm font-semibold ${
                  passwordStrength.level === '弱' ? 'text-error' :
                  passwordStrength.level === '中' ? 'text-warning' :
                  'text-success'
                }`"
              >
                {{ passwordStrength.level }}
              </span>
            </div>
            <div class="h-2 bg-bg-secondary rounded-full overflow-hidden">
              <div
                :class="`h-full ${passwordStrength.color} transition-all duration-500`"
                :style="{ width: passwordStrength.width }"
              ></div>
            </div>
          </div>

          <!-- Tips -->
          <div v-if="passwordStrength.level === '弱'" class="p-3 rounded-lg bg-error/20 border border-error/30">
            <p class="text-error text-sm flex items-center gap-2">
              <AlertTriangle class="w-4 h-4" />
              建议增加密码长度或包含更多字符类型
            </p>
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-64 text-text-tertiary">
          <p>点击"生成密码"按钮开始</p>
        </div>
      </div>
    </div>

    <!-- Batch Password Mode -->
    <div v-else class="space-y-6">
      <!-- Config Section -->
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">批量配置</h2>

        <div class="grid md:grid-cols-2 gap-6">
          <!-- Length Slider -->
          <div>
            <div class="flex justify-between mb-2">
              <label class="font-semibold">密码长度:</label>
              <span class="text-primary font-bold">{{ passwordLength }} 位</span>
            </div>
            <input
              v-model="passwordLength"
              type="range"
              min="6"
              max="64"
              step="1"
              class="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer"
            />
            <div class="flex justify-between text-xs text-text-tertiary mt-1">
              <span>6</span>
              <span>64</span>
            </div>
          </div>

          <!-- Character Options -->
          <div>
            <label class="font-semibold mb-3 block">包含字符:</label>
            <div class="grid grid-cols-2 gap-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="includeUppercase"
                  type="checkbox"
                  class="w-4 h-4 rounded bg-bg-secondary border-2 border-primary/30 checked:bg-primary cursor-pointer"
                />
                <span class="text-sm text-text-secondary">大写字母</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="includeLowercase"
                  type="checkbox"
                  class="w-4 h-4 rounded bg-bg-secondary border-2 border-primary/30 checked:bg-primary cursor-pointer"
                />
                <span class="text-sm text-text-secondary">小写字母</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="includeNumbers"
                  type="checkbox"
                  class="w-4 h-4 rounded bg-bg-secondary border-2 border-primary/30 checked:bg-primary cursor-pointer"
                />
                <span class="text-sm text-text-secondary">数字</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="includeSymbols"
                  type="checkbox"
                  class="w-4 h-4 rounded bg-bg-secondary border-2 border-primary/30 checked:bg-primary cursor-pointer"
                />
                <span class="text-sm text-text-secondary">特殊符号</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Generate Button -->
        <button
          @click="generateBatchPasswords"
          class="w-full gradient-btn mt-6 flex items-center justify-center gap-2"
        >
          <RefreshCw class="w-5 h-5" />
          <span>批量生成10个密码</span>
        </button>
      </div>

      <!-- Batch Results -->
      <div v-if="batchPasswords.length > 0" class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">生成的密码列表</h2>
        
        <div class="space-y-3">
          <div
            v-for="(pwd, index) in batchPasswords"
            :key="index"
            class="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary group hover:bg-bg-tertiary transition-colors"
          >
            <span class="text-text-tertiary text-sm w-6">{{ index + 1 }}.</span>
            <p class="font-mono text-success flex-1 select-all">{{ pwd }}</p>
            <button
              @click="handleCopy(pwd)"
              class="px-3 py-1 rounded-lg bg-bg-tertiary hover:bg-primary/80 text-white text-sm transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
            >
              <Copy class="w-3 h-3" />
              复制
            </button>
          </div>
        </div>

        <!-- Copy All Button -->
        <button
          @click="handleCopy(batchPasswords.join('\n'))"
          class="w-full mt-4 px-4 py-2 rounded-lg bg-success hover:bg-success/80 text-white transition-colors flex items-center justify-center gap-2"
        >
          <Copy class="w-5 h-5" />
          <span>复制全部</span>
        </button>
      </div>

      <div v-else class="glass rounded-xl p-6">
        <div class="flex items-center justify-center h-64 text-text-tertiary">
          <p>点击"批量生成10个密码"按钮开始</p>
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
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  border: 2px solid white;
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  border: 2px solid white;
}

input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
}

input[type="checkbox"]:checked {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  color: white;
  font-size: 12px;
  font-weight: bold;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>