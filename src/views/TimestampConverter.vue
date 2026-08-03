<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import {
  timestampToDate,
  dateToTimestamp,
  getRelativeTime,
  detectTimestampType,
  getCurrentTimestamp,
  getTimeInTimezones,
  getCountdown,
  calculateTimeDifference,
  addTime,
  batchConvertTimestamps,
  getDetailedRelativeTime,
  COMMON_TIMEZONES,
  TIME_FORMAT_TEMPLATES,
  type Countdown,
  type TimeDifference
} from '@/utils/timestampConverter'
import { Clock, Copy, CheckCircle, RefreshCw, Globe, Timer, Calculator, FileText, Layers } from 'lucide-vue-next'

// 基础转换状态
const inputTimestamp = ref<string>('')
const inputDate = ref<string>('')
const conversionMode = ref<'timestamp-to-date' | 'date-to-timestamp'>('timestamp-to-date')
const timestampUnit = ref<'s' | 'ms'>('s')
const dateFormat = ref<string>('default')
const customFormat = ref('yyyy-MM-dd HH:mm:ss')

// 功能标签页
const activeTab = ref<'converter' | 'timezone' | 'countdown' | 'calculator' | 'batch'>('converter')

// 多时区显示
const timezoneResults = ref<Array<{ name: string; timezone: string; offset: string; time: string }>>([])

// 倒计时功能
const countdownTarget = ref<string>('')
const countdownResult = ref<Countdown>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0, isExpired: false })
let countdownTimer: number | null = null

// 时间计算器
const calculatorMode = ref<'difference' | 'add'>('difference')
const calcTimestamp1 = ref<string>('')
const calcTimestamp2 = ref<string>('')
const calcAmount = ref<number>(0)
const calcUnit = ref<'days' | 'hours' | 'minutes' | 'seconds'>('days')
const calcResult = ref<TimeDifference | null>(null)
const calcAddResult = ref<number>(0)

// 批量转换
const batchInput = ref<string>('')
const batchResults = ref<Array<{ input: number; output: string; relative: string }>>([])

const { copied, copyToClipboard } = useClipboard()
const { notification, success } = useNotification()

const outputResult = ref<string>('')
const relativeTimeResult = ref<string>('')
const timestampType = ref<string>('')

// 实时转换 - 时间戳转日期
watch([inputTimestamp, timestampUnit, dateFormat, customFormat], () => {
  if (conversionMode.value === 'timestamp-to-date' && inputTimestamp.value.trim()) {
    const timestamp = parseInt(inputTimestamp.value)
    if (!isNaN(timestamp)) {
      timestampType.value = detectTimestampType(timestamp)
      const formatStr = dateFormat.value === 'custom' ? customFormat.value : (TIME_FORMAT_TEMPLATES as any)[dateFormat.value] || TIME_FORMAT_TEMPLATES.default
      outputResult.value = timestampToDate(timestamp, formatStr)
      relativeTimeResult.value = getDetailedRelativeTime(timestamp)
      // 更新时区显示
      timezoneResults.value = getTimeInTimezones(timestamp)
    } else {
      outputResult.value = '无效时间戳'
      relativeTimeResult.value = ''
      timezoneResults.value = []
    }
  } else if (conversionMode.value === 'timestamp-to-date') {
    // 输入为空时清空结果
    outputResult.value = ''
    relativeTimeResult.value = ''
    timestampType.value = ''
    timezoneResults.value = []
  }
})

// 实时转换 - 日期转时间戳
watch([inputDate, timestampUnit], () => {
  if (conversionMode.value === 'date-to-timestamp' && inputDate.value.trim()) {
    const timestamp = dateToTimestamp(inputDate.value, timestampUnit.value)
    if (timestamp > 0) {
      outputResult.value = timestamp.toString()
      relativeTimeResult.value = getDetailedRelativeTime(timestamp)
      // 更新时区显示
      timezoneResults.value = getTimeInTimezones(timestamp)
    } else {
      outputResult.value = '无效日期'
      relativeTimeResult.value = ''
      timezoneResults.value = []
    }
  } else if (conversionMode.value === 'date-to-timestamp') {
    // 输入为空时清空结果
    outputResult.value = ''
    relativeTimeResult.value = ''
    timezoneResults.value = []
  }
})

// 倒计时更新定时器
const updateCountdown = () => {
  if (countdownTarget.value) {
    const targetDate = new Date(countdownTarget.value)
    if (!isNaN(targetDate.getTime())) {
      const targetTimestamp = targetDate.getTime()
      countdownResult.value = getCountdown(targetTimestamp)
    }
  }
}

watch(countdownTarget, () => {
  updateCountdown()
  // 清除旧定时器
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
  // 启动新定时器
  if (countdownTarget.value) {
    countdownTimer = window.setInterval(updateCountdown, 1000)
  }
})

// 时间计算器
watch([calcTimestamp1, calcTimestamp2, calculatorMode, calcAmount, calcUnit], () => {
  const ts1 = parseInt(calcTimestamp1.value)
  const ts2 = parseInt(calcTimestamp2.value)

  if (calculatorMode.value === 'difference' && !isNaN(ts1) && !isNaN(ts2)) {
    calcResult.value = calculateTimeDifference(ts1, ts2)
  } else if (calculatorMode.value === 'add' && !isNaN(ts1) && calcAmount.value !== 0) {
    calcAddResult.value = addTime(ts1, calcAmount.value, calcUnit.value)
  }
})

// 批量转换
const handleBatchConvert = () => {
  const timestamps = batchInput.value
    .split(/[\n,]+/)
    .map(s => parseInt(s.trim()))
    .filter(n => !isNaN(n) && n > 0)

  if (timestamps.length > 0) {
    batchResults.value = batchConvertTimestamps(timestamps)
    success(`成功转换 ${timestamps.length} 个时间戳`)
  }
}

const getCurrentTime = () => {
  const current = getCurrentTimestamp(timestampUnit.value)
  inputTimestamp.value = current.toString()
  success('已获取当前时间戳')
}

const handleCopy = async (text?: string) => {
  const textToCopy = text || outputResult.value
  if (!textToCopy.trim()) return

  if (await copyToClipboard(textToCopy)) {
    success('已复制到剪贴板')
  }
}

// 清理定时器
onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-6xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">时间戳转换</h1>
      <p class="text-text-secondary">强大的时间戳转换工具，支持多时区、倒计时、时间计算等功能</p>
    </div>

    <!-- 功能标签页 -->
    <div class="glass rounded-xl p-2 mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          @click="activeTab = 'converter'"
          :class="`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'converter'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <Clock class="w-4 h-4" />
          <span>转换器</span>
        </button>
        <button
          @click="activeTab = 'timezone'"
          :class="`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'timezone'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <Globe class="w-4 h-4" />
          <span>多时区</span>
        </button>
        <button
          @click="activeTab = 'countdown'"
          :class="`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'countdown'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <Timer class="w-4 h-4" />
          <span>倒计时</span>
        </button>
        <button
          @click="activeTab = 'calculator'"
          :class="`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'calculator'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <Calculator class="w-4 h-4" />
          <span>计算器</span>
        </button>
        <button
          @click="activeTab = 'batch'"
          :class="`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'batch'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <Layers class="w-4 h-4" />
          <span>批量转换</span>
        </button>
      </div>
    </div>

    <!-- 基础转换器 -->
    <div v-if="activeTab === 'converter'">
      <!-- Conversion Mode Toggle -->
      <div class="glass rounded-xl p-4 mb-6">
        <div class="flex gap-2">
          <button
            @click="conversionMode = 'timestamp-to-date'"
            :class="`px-6 py-3 rounded-lg transition-all ${
              conversionMode === 'timestamp-to-date'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
            }`"
          >
            时间戳 → 日期
          </button>
          <button
            @click="conversionMode = 'date-to-timestamp'"
            :class="`px-6 py-3 rounded-lg transition-all ${
              conversionMode === 'date-to-timestamp'
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
            }`"
          >
            日期 → 时间戳
          </button>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <!-- Input Section -->
        <div class="glass rounded-xl p-6">
          <!-- Timestamp to Date -->
          <div v-if="conversionMode === 'timestamp-to-date'">
            <h2 class="text-xl font-semibold mb-4">时间戳输入</h2>

            <input
              v-model="inputTimestamp"
              type="text"
              placeholder="输入时间戳..."
              class="w-full p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4 font-mono text-lg"
            />

            <div v-if="timestampType" class="mb-4 text-sm text-text-secondary">
              检测到: {{ timestampType === 'ms' ? '毫秒级时间戳' : '秒级时间戳' }}
            </div>

            <div class="space-y-3 mb-4">
              <div>
                <label class="text-sm font-semibold mb-2 block">时间戳单位:</label>
                <select
                  v-model="timestampUnit"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none"
                >
                  <option value="s">秒</option>
                  <option value="ms">毫秒</option>
                </select>
              </div>

              <div>
                <label class="text-sm font-semibold mb-2 block">日期格式:</label>
                <select
                  v-model="dateFormat"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none"
                >
                  <option value="default">默认 (yyyy-MM-dd HH:mm:ss)</option>
                  <option value="iso">ISO 8601</option>
                  <option value="rfc2822">RFC 2822</option>
                  <option value="shortDate">短日期 (yyyy-MM-dd)</option>
                  <option value="shortTime">短时间 (HH:mm:ss)</option>
                  <option value="fullDateTime">中文格式</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              <div v-if="dateFormat === 'custom'">
                <input
                  v-model="customFormat"
                  type="text"
                  placeholder="格式字符串..."
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
                />
              </div>
            </div>

            <button
              @click="getCurrentTime"
              class="w-full gradient-btn flex items-center justify-center gap-2"
            >
              <RefreshCw class="w-5 h-5" />
              <span>获取当前时间戳</span>
            </button>
          </div>

          <!-- Date to Timestamp -->
          <div v-else>
            <h2 class="text-xl font-semibold mb-4">日期输入</h2>

            <input
              v-model="inputDate"
              type="datetime-local"
              class="w-full p-4 rounded-lg bg-bg-secondary text-white focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
            />

            <div>
              <label class="text-sm font-semibold mb-2 block">输出单位:</label>
              <select
                v-model="timestampUnit"
                class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none"
              >
                <option value="s">秒</option>
                <option value="ms">毫秒</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Output Section -->
        <div class="glass rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold">转换结果</h2>
            <button
              v-if="outputResult && !outputResult.includes('无效')"
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

          <div v-if="outputResult" class="space-y-4">
            <div class="p-4 rounded-lg bg-bg-secondary border-2 border-primary/30">
              <p class="font-mono text-lg text-success">{{ outputResult }}</p>
            </div>

            <div v-if="relativeTimeResult && !relativeTimeResult.includes('无效')">
              <label class="text-sm text-text-tertiary mb-2 block">相对时间:</label>
              <p class="text-text-secondary text-lg font-semibold">{{ relativeTimeResult }}</p>
            </div>
          </div>

          <div v-else class="flex items-center justify-center h-64 text-text-tertiary">
            <p>等待输入...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 多时区显示 -->
    <div v-if="activeTab === 'timezone'" class="glass rounded-xl p-6">
      <h2 class="text-xl font-semibold mb-4">全球时区时间</h2>

      <div class="mb-6">
        <input
          v-model="inputTimestamp"
          type="text"
          placeholder="输入时间戳查看各时区时间..."
          class="w-full p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-lg"
        />
      </div>

      <div v-if="timezoneResults.length > 0" class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="tz in timezoneResults"
          :key="tz.timezone"
          class="p-4 rounded-lg bg-bg-secondary border border-primary/20 hover:border-primary/50 transition-all"
        >
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-white">{{ tz.name }}</h3>
            <span class="text-xs text-text-tertiary">{{ tz.offset }}</span>
          </div>
          <p class="font-mono text-success text-lg">{{ tz.time }}</p>
        </div>
      </div>

      <div v-else class="flex items-center justify-center h-64 text-text-tertiary">
        <p>请输入时间戳以查看各时区时间</p>
      </div>
    </div>

    <!-- 倒计时功能 -->
    <div v-if="activeTab === 'countdown'" class="glass rounded-xl p-6">
      <h2 class="text-xl font-semibold mb-4">倒计时</h2>

      <div class="mb-6">
        <label class="text-sm font-semibold mb-2 block">目标时间:</label>
        <input
          v-model="countdownTarget"
          type="datetime-local"
          class="w-full p-4 rounded-lg bg-bg-secondary text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div v-if="countdownTarget && countdownResult" class="grid grid-cols-4 gap-4">
        <div class="text-center p-6 rounded-lg bg-bg-secondary border-2 border-primary/30">
          <div class="text-4xl font-bold gradient-text mb-2">{{ countdownResult.days }}</div>
          <div class="text-text-secondary">天</div>
        </div>
        <div class="text-center p-6 rounded-lg bg-bg-secondary border-2 border-secondary/30">
          <div class="text-4xl font-bold gradient-text mb-2">{{ countdownResult.hours }}</div>
          <div class="text-text-secondary">时</div>
        </div>
        <div class="text-center p-6 rounded-lg bg-bg-secondary border-2 border-accent/30">
          <div class="text-4xl font-bold gradient-text mb-2">{{ countdownResult.minutes }}</div>
          <div class="text-text-secondary">分</div>
        </div>
        <div class="text-center p-6 rounded-lg bg-bg-secondary border-2 border-info/30">
          <div class="text-4xl font-bold gradient-text mb-2">{{ countdownResult.seconds }}</div>
          <div class="text-text-secondary">秒</div>
        </div>
      </div>

      <div v-if="countdownResult?.isExpired" class="text-center p-8 rounded-lg bg-bg-secondary mt-4">
        <p class="text-xl text-success font-semibold">倒计时已结束！</p>
      </div>
    </div>

    <!-- 时间计算器 -->
    <div v-if="activeTab === 'calculator'" class="glass rounded-xl p-6">
      <h2 class="text-xl font-semibold mb-4">时间计算器</h2>

      <div class="flex gap-2 mb-6">
        <button
          @click="calculatorMode = 'difference'"
          :class="`px-6 py-3 rounded-lg transition-all ${
            calculatorMode === 'difference'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          时间差计算
        </button>
        <button
          @click="calculatorMode = 'add'"
          :class="`px-6 py-3 rounded-lg transition-all ${
            calculatorMode === 'add'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          时间加减
        </button>
      </div>

      <!-- 时间差计算 -->
      <div v-if="calculatorMode === 'difference'" class="space-y-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-semibold mb-2 block">时间戳 1:</label>
            <input
              v-model="calcTimestamp1"
              type="text"
              placeholder="第一个时间戳..."
              class="w-full p-3 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none font-mono"
            />
          </div>
          <div>
            <label class="text-sm font-semibold mb-2 block">时间戳 2:</label>
            <input
              v-model="calcTimestamp2"
              type="text"
              placeholder="第二个时间戳..."
              class="w-full p-3 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none font-mono"
            />
          </div>
        </div>

        <div v-if="calcResult" class="p-6 rounded-lg bg-bg-secondary border-2 border-primary/30">
          <p class="text-lg font-semibold text-success">{{ calcResult.formatted }}</p>
          <div class="mt-2 text-sm text-text-tertiary">
            总计: {{ calcResult.totalMs }} 毫秒
          </div>
        </div>
      </div>

      <!-- 时间加减 -->
      <div v-else class="space-y-4">
        <div>
          <label class="text-sm font-semibold mb-2 block">基础时间戳:</label>
          <input
            v-model="calcTimestamp1"
            type="text"
            placeholder="输入时间戳..."
            class="w-full p-3 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none font-mono"
          />
        </div>

        <div class="grid md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-semibold mb-2 block">数值:</label>
            <input
              v-model="calcAmount"
              type="number"
              placeholder="数值（可为负数）..."
              class="w-full p-3 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
            />
          </div>
          <div>
            <label class="text-sm font-semibold mb-2 block">单位:</label>
            <select
              v-model="calcUnit"
              class="w-full px-3 py-3 rounded-lg bg-bg-secondary text-white focus:outline-none"
            >
              <option value="days">天</option>
              <option value="hours">小时</option>
              <option value="minutes">分钟</option>
              <option value="seconds">秒</option>
            </select>
          </div>
        </div>

        <div v-if="calcAddResult" class="p-6 rounded-lg bg-bg-secondary border-2 border-primary/30">
          <label class="text-sm text-text-tertiary mb-2 block">结果时间戳:</label>
          <p class="font-mono text-lg text-success">{{ calcAddResult }}</p>
        </div>
      </div>
    </div>

    <!-- 批量转换 -->
    <div v-if="activeTab === 'batch'" class="glass rounded-xl p-6">
      <h2 class="text-xl font-semibold mb-4">批量转换</h2>

      <div class="mb-4">
        <label class="text-sm font-semibold mb-2 block">输入多个时间戳（每行一个或逗号分隔）:</label>
        <textarea
          v-model="batchInput"
          placeholder="1720982400&#10;1720982500&#10;1720982600"
          rows="6"
          class="w-full p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
        ></textarea>
      </div>

      <button
        @click="handleBatchConvert"
        class="w-full gradient-btn flex items-center justify-center gap-2 mb-6"
      >
        <FileText class="w-5 h-5" />
        <span>批量转换</span>
      </button>

      <div v-if="batchResults.length > 0" class="space-y-3">
        <div class="grid grid-cols-3 gap-4 text-sm font-semibold text-text-secondary mb-2 px-4">
          <div>时间戳</div>
          <div>转换结果</div>
          <div>相对时间</div>
        </div>
        <div
          v-for="(result, index) in batchResults"
          :key="index"
          class="grid grid-cols-3 gap-4 p-4 rounded-lg bg-bg-secondary border border-primary/20 hover:border-primary/50 transition-all"
        >
          <div class="font-mono text-text-tertiary">{{ result.input }}</div>
          <div class="font-mono text-success">{{ result.output }}</div>
          <div class="text-text-secondary">{{ result.relative }}</div>
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