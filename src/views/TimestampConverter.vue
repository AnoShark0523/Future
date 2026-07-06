<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import {
  timestampToDate,
  dateToTimestamp,
  getRelativeTime,
  detectTimestampType,
  getCurrentTimestamp
} from '@/utils/timestampConverter'
import { Clock, Copy, CheckCircle, RefreshCw } from 'lucide-vue-next'

const inputTimestamp = ref<string>('')
const inputDate = ref<string>('')
const conversionMode = ref<'timestamp-to-date' | 'date-to-timestamp'>('timestamp-to-date')
const timestampUnit = ref<'s' | 'ms'>('s')
const dateFormat = ref<'default' | 'iso' | 'custom'>('default')
const customFormat = ref('yyyy-MM-dd HH:mm:ss')

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
      const formatStr = dateFormat.value === 'custom' ? customFormat.value : 'yyyy-MM-dd HH:mm:ss'
      outputResult.value = timestampToDate(timestamp, formatStr)
      relativeTimeResult.value = getRelativeTime(timestamp)
    } else {
      outputResult.value = '无效时间戳'
      relativeTimeResult.value = ''
    }
  }
})

// 实时转换 - 日期转时间戳
watch([inputDate, timestampUnit], () => {
  if (conversionMode.value === 'date-to-timestamp' && inputDate.value.trim()) {
    const timestamp = dateToTimestamp(inputDate.value, timestampUnit.value)
    if (timestamp > 0) {
      outputResult.value = timestamp.toString()
      relativeTimeResult.value = getRelativeTime(timestamp)
    } else {
      outputResult.value = '无效日期'
      relativeTimeResult.value = ''
    }
  }
})

const getCurrentTime = () => {
  const current = getCurrentTimestamp(timestampUnit.value)
  inputTimestamp.value = current.toString()
  success('已获取当前时间戳')
}

const handleCopy = async () => {
  if (!outputResult.value.trim()) return

  if (await copyToClipboard(outputResult.value)) {
    success('已复制到剪贴板')
  }
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-5xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">时间戳转换</h1>
      <p class="text-text-secondary">时间戳转日期、日期转时间戳，支持多种格式和时区</p>
    </div>

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

    <!-- Main Content -->
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

          <!-- Timestamp Type Indicator -->
          <div v-if="timestampType" class="mb-4 text-sm text-text-secondary">
            检测到: {{ timestampType === 'ms' ? '毫秒级时间戳' : '秒级时间戳' }}
          </div>

          <!-- Options -->
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
                <option value="default">yyyy-MM-dd HH:mm:ss</option>
                <option value="iso">ISO 8601</option>
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

          <!-- Current Timestamp Button -->
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

          <!-- Options -->
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

        <div v-if="outputResult" class="space-y-4">
          <!-- Main Result -->
          <div class="p-4 rounded-lg bg-bg-secondary border-2 border-primary/30">
            <p class="font-mono text-lg text-success">{{ outputResult }}</p>
          </div>

          <!-- Relative Time -->
          <div v-if="relativeTimeResult && !relativeTimeResult.includes('无效')">
            <label class="text-sm text-text-tertiary mb-2 block">相对时间:</label>
            <p class="text-text-secondary">{{ relativeTimeResult }}</p>
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-64 text-text-tertiary">
          <p>等待输入...</p>
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