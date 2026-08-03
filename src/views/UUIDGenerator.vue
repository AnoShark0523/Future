<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import { Fingerprint, Copy, CheckCircle, RefreshCw, History, Layers } from 'lucide-vue-next'

// UUID 配置
const uuidVersion = ref<'v1' | 'v4'>('v4')
const batchCount = ref(10)
const uppercase = ref(false)
const withHyphens = ref(true)
const withBraces = ref(false)

// 生成的 UUID 列表
const generatedUUIDs = ref<string[]>([])

// 历史记录（最近10条）
const historyRecords = ref<Array<{ uuid: string; version: string; timestamp: Date }>>([])

const { copied, copyToClipboard } = useClipboard()
const { notification, success, error } = useNotification()

// 生成 UUID v4（基于随机数）
const generateUUIDv4 = (): string => {
  // 使用 crypto.randomUUID() 如果可用
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // 否则使用 crypto.getRandomValues 手动实现
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  // 设置版本号 (v4) 和变体位
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return (
    toHex(bytes[0]) + toHex(bytes[1]) + toHex(bytes[2]) + toHex(bytes[3]) + '-' +
    toHex(bytes[4]) + toHex(bytes[5]) + '-' +
    toHex(bytes[6]) + toHex(bytes[7]) + '-' +
    toHex(bytes[8]) + toHex(bytes[9]) + '-' +
    toHex(bytes[10]) + toHex(bytes[11]) + toHex(bytes[12]) + toHex(bytes[13]) + toHex(bytes[14]) + toHex(bytes[15])
  )
}

// 生成 UUID v1（基于时间戳）
const generateUUIDv1 = (): string => {
  // 使用 BigInt 避免超过 Number.MAX_SAFE_INTEGER 导致精度丢失
  const now = BigInt(Date.now())
  const time = now * 10000n + 122192928000000000n // 转换为100纳秒间隔，从1582年10月15日开始

  const timeLow = Number(time & 0xFFFFFFFFn)
  const timeMid = Number((time >> 32n) & 0xFFFFn)
  const timeHi = Number((time >> 48n) & 0x0FFFn)

  // 使用 crypto.getRandomValues 生成 clock_seq 和 node
  const randomBytes = new Uint8Array(8)
  crypto.getRandomValues(randomBytes)

  const clockSeq = (((randomBytes[0] << 8) | randomBytes[1]) & 0x3FFF) | 0x8000
  const node = Array.from(randomBytes.slice(2))

  const hex = (n: number, length: number) => n.toString(16).padStart(length, '0')

  return `${hex(timeLow, 8)}-${hex(timeMid, 4)}-${hex(timeHi | 0x1000, 4)}-${hex(clockSeq, 4)}-${node.map(n => hex(n, 2)).join('')}`
}

// 格式化 UUID
const formatUUID = (uuid: string): string => {
  let formatted = uuid
  
  // 移除横线
  if (!withHyphens.value) {
    formatted = formatted.replace(/-/g, '')
  }
  
  // 添加花括号
  if (withBraces.value) {
    formatted = `{${formatted}}`
  }
  
  // 大小写转换
  if (uppercase.value) {
    formatted = formatted.toUpperCase()
  }
  
  return formatted
}

// 生成单个 UUID
const generateSingleUUID = (): string => {
  const uuid = uuidVersion.value === 'v4' ? generateUUIDv4() : generateUUIDv1()
  return formatUUID(uuid)
}

// 批量生成 UUID
const generateUUIDs = () => {
  if (batchCount.value < 1 || batchCount.value > 100) {
    error('批量生成数量必须在 1-100 之间')
    return
  }
  
  const uuids: string[] = []
  for (let i = 0; i < batchCount.value; i++) {
    uuids.push(generateSingleUUID())
  }
  
  generatedUUIDs.value = uuids
  
  // 添加到历史记录
  const timestamp = new Date()
  uuids.forEach(uuid => {
    historyRecords.value.unshift({
      uuid,
      version: uuidVersion.value,
      timestamp
    })
  })
  
  // 只保留最近10条
  if (historyRecords.value.length > 10) {
    historyRecords.value = historyRecords.value.slice(0, 10)
  }
  
  success(`成功生成 ${batchCount.value} 个 UUID`)
}

// 复制单个 UUID
const handleCopy = async (uuid: string) => {
  if (await copyToClipboard(uuid)) {
    success('已复制到剪贴板')
  }
}

// 复制全部 UUID
const handleCopyAll = async () => {
  if (generatedUUIDs.value.length === 0) {
    error('没有可复制的 UUID')
    return
  }
  
  const text = generatedUUIDs.value.join('\n')
  if (await copyToClipboard(text)) {
    success('已复制全部 UUID 到剪贴板')
  }
}

// 复制历史记录中的 UUID
const handleCopyHistory = async (uuid: string) => {
  if (await copyToClipboard(uuid)) {
    success('已复制到剪贴板')
  }
}

// 格式化时间
const formatTime = (date: Date): string => {
  return date.toLocaleString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-6xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">UUID/GUID 生成器</h1>
      <p class="text-text-secondary">快速生成唯一标识符，支持多种格式和批量生成</p>
    </div>

    <!-- Config Section -->
    <div class="glass rounded-xl p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
        <Layers class="w-5 h-5 text-primary" />
        配置选项
      </h2>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- UUID 版本选择 -->
        <div>
          <label class="font-semibold mb-2 block text-text-secondary">UUID 版本</label>
          <div class="flex gap-2">
            <button
              @click="uuidVersion = 'v1'"
              :class="`flex-1 px-4 py-2 rounded-lg transition-all ${
                uuidVersion === 'v1'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
              }`"
            >
              V1 时间戳
            </button>
            <button
              @click="uuidVersion = 'v4'"
              :class="`flex-1 px-4 py-2 rounded-lg transition-all ${
                uuidVersion === 'v4'
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
              }`"
            >
              V4 随机
            </button>
          </div>
        </div>

        <!-- 批量生成数量 -->
        <div>
          <label class="font-semibold mb-2 block text-text-secondary">生成数量 (1-100)</label>
          <input
            v-model.number="batchCount"
            type="number"
            min="1"
            max="100"
            class="w-full px-4 py-2 rounded-lg bg-bg-secondary border-2 border-primary/30 text-white focus:border-primary outline-none transition-colors"
          />
        </div>

        <!-- 格式选项 - 大小写 -->
        <div>
          <label class="font-semibold mb-2 block text-text-secondary">字母格式</label>
          <div class="flex gap-2">
            <button
              @click="uppercase = false"
              :class="`flex-1 px-4 py-2 rounded-lg transition-all ${
                !uppercase
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
              }`"
            >
              小写
            </button>
            <button
              @click="uppercase = true"
              :class="`flex-1 px-4 py-2 rounded-lg transition-all ${
                uppercase
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
              }`"
            >
              大写
            </button>
          </div>
        </div>

        <!-- 生成按钮 -->
        <div class="flex items-end">
          <button
            @click="generateUUIDs"
            class="w-full gradient-btn flex items-center justify-center gap-2"
          >
            <RefreshCw class="w-5 h-5" />
            <span>生成 UUID</span>
          </button>
        </div>
      </div>

      <!-- 格式选项 -->
      <div class="grid md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-primary/20">
        <!-- 带横线 -->
        <label class="flex items-center gap-3 cursor-pointer group">
          <input
            v-model="withHyphens"
            type="checkbox"
            class="w-5 h-5 rounded bg-bg-secondary border-2 border-primary/30 checked:bg-primary cursor-pointer"
          />
          <span class="text-text-secondary group-hover:text-white transition-colors">
            包含横线分隔符 (例如: 550e8400-e29b-41d4-a716-446655440000)
          </span>
        </label>

        <!-- 带花括号 -->
        <label class="flex items-center gap-3 cursor-pointer group">
          <input
            v-model="withBraces"
            type="checkbox"
            class="w-5 h-5 rounded bg-bg-secondary border-2 border-primary/30 checked:bg-primary cursor-pointer"
          />
          <span class="text-text-secondary group-hover:text-white transition-colors">
            包含花括号 (例如: {550e8400-e29b-41d4-a716-446655440000})
          </span>
        </label>
      </div>
    </div>

    <!-- Results Section -->
    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Generated UUIDs -->
      <div class="lg:col-span-2 glass rounded-xl p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold flex items-center gap-2">
            <Fingerprint class="w-5 h-5 text-primary" />
            生成的 UUID
          </h2>
          <button
            v-if="generatedUUIDs.length > 0"
            @click="handleCopyAll"
            :class="`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              copied ? 'bg-success text-white' : 'bg-bg-tertiary hover:bg-success/80 text-white'
            }`"
          >
            <CheckCircle v-if="copied" class="w-4 h-4" />
            <Copy v-else class="w-4 h-4" />
            <span class="text-sm">{{ copied ? '已复制' : '复制全部' }}</span>
          </button>
        </div>

        <!-- UUID List -->
        <div v-if="generatedUUIDs.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="(uuid, index) in generatedUUIDs"
            :key="index"
            class="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary group hover:bg-bg-tertiary transition-colors"
          >
            <span class="text-text-tertiary text-sm w-8">{{ index + 1 }}.</span>
            <p class="font-mono text-success flex-1 select-all break-all">{{ uuid }}</p>
            <button
              @click="handleCopy(uuid)"
              class="px-3 py-1 rounded-lg bg-bg-tertiary hover:bg-primary/80 text-white text-sm transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
            >
              <Copy class="w-3 h-3" />
              复制
            </button>
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-64 text-text-tertiary">
          <p>点击"生成 UUID"按钮开始</p>
        </div>
      </div>

      <!-- History Section -->
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <History class="w-5 h-5 text-primary" />
          历史记录
        </h2>

        <div v-if="historyRecords.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
          <div
            v-for="(record, index) in historyRecords"
            :key="index"
            class="p-3 rounded-lg bg-bg-secondary group hover:bg-bg-tertiary transition-colors"
          >
            <div class="flex items-start gap-2">
              <div class="flex-1">
                <p class="font-mono text-success text-sm select-all break-all">{{ record.uuid }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-primary font-semibold">{{ record.version.toUpperCase() }}</span>
                  <span class="text-xs text-text-tertiary">{{ formatTime(record.timestamp) }}</span>
                </div>
              </div>
              <button
                @click="handleCopyHistory(record.uuid)"
                class="px-2 py-1 rounded bg-bg-tertiary hover:bg-primary/80 text-white text-xs transition-colors opacity-0 group-hover:opacity-100 flex items-center gap-1"
              >
                <Copy class="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-64 text-text-tertiary">
          <p>暂无历史记录</p>
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

/* 滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}
</style>