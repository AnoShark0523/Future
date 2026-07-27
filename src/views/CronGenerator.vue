<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import { Clock, Copy, CheckCircle, Play, Code, Calendar, Settings, Sparkles } from 'lucide-vue-next'
import { addSeconds, format } from 'date-fns'

const { copied, copyToClipboard } = useClipboard()
const { notification, success } = useNotification()

// Cron 表达式各个字段
const cronFields = ref({
  second: '0',
  minute: '*',
  hour: '*',
  day: '*',
  month: '*',
  weekday: '*'
})

// 当前选中的配置类型
const activeFieldType = ref<'second' | 'minute' | 'hour' | 'day' | 'month' | 'weekday'>('minute')

// 配置模式
const configMode = ref<'every' | 'specific' | 'range' | 'step'>('every')

// 特定值配置
const specificValues = ref<number[]>([])
const rangeStart = ref<number>(0)
const rangeEnd = ref<number>(59)
const stepValue = ref<number>(1)

// Cron 表达式字符串
const cronExpression = computed(() => {
  return `${cronFields.value.second} ${cronFields.value.minute} ${cronFields.value.hour} ${cronFields.value.day} ${cronFields.value.month} ${cronFields.value.weekday}`
})

// 预设模板
const presetTemplates = [
  { name: '每分钟', expression: '0 * * * * *', description: '每分钟的第0秒执行' },
  { name: '每小时', expression: '0 0 * * * *', description: '每小时的第0分0秒执行' },
  { name: '每天', expression: '0 0 0 * * *', description: '每天0点0分0秒执行' },
  { name: '每周', expression: '0 0 0 * * 0', description: '每周日0点0分0秒执行' },
  { name: '每月', expression: '0 0 0 1 * *', description: '每月1号0点0分0秒执行' },
  { name: '工作日早9晚6', expression: '0 0 9-18 * * 1-5', description: '周一至周五每天9点到18点每小时执行' },
  { name: '每小时整点', expression: '0 0 * * * *', description: '每小时的0分0秒执行' },
  { name: '每隔5分钟', expression: '0 */5 * * * *', description: '每隔5分钟执行一次' }
]

// 字段范围定义
const fieldRanges = {
  second: { min: 0, max: 59, label: '秒' },
  minute: { min: 0, max: 59, label: '分' },
  hour: { min: 0, max: 23, label: '时' },
  day: { min: 1, max: 31, label: '日' },
  month: { min: 1, max: 12, label: '月' },
  weekday: { min: 0, max: 6, label: '周' }
}

const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const monthNames = ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']

// 解析 Cron 表达式
const parseCronExpression = (expression: string): string => {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 6) return '无效的 Cron 表达式'

  const [second, minute, hour, day, month, weekday] = parts

  const descriptions: string[] = []

  // 解析秒
  descriptions.push(parseField(second, '秒', 0, 59, false))

  // 解析分
  descriptions.push(parseField(minute, '分', 0, 59))

  // 解析时
  descriptions.push(parseField(hour, '时', 0, 23))

  // 解析日
  descriptions.push(parseField(day, '日', 1, 31))

  // 解析月
  descriptions.push(parseField(month, '月', 1, 12))

  // 解析周
  const weekdayDesc = parseField(weekday, '周', 0, 6, false, true)
  descriptions.push(weekdayDesc)

  return descriptions.join(' ')
}

const parseField = (field: string, label: string, min: number, max: number, isDefault = true, isWeekday = false): string => {
  if (field === '*') {
    return isDefault ? `每${label}` : `每${label}`
  }

  if (field.includes('/')) {
    const [base, step] = field.split('/')
    if (base === '*') {
      return `每隔${step}${label}执行`
    } else {
      return `从${base}${label}开始，每隔${step}${label}执行`
    }
  }

  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number)
    if (isWeekday) {
      return `${weekdayNames[start]}到${weekdayNames[end]}`
    }
    return `${start}${label}到${end}${label}`
  }

  if (field.includes(',')) {
    const values = field.split(',').map(Number)
    if (isWeekday) {
      return values.map(v => weekdayNames[v]).join('、')
    }
    return values.map(v => `第${v}${label}`).join('、')
  }

  const value = parseInt(field)
  if (!isNaN(value)) {
    if (isWeekday) {
      return weekdayNames[value]
    }
    return `第${value}${label}`
  }

  return field
}

// 计算接下来5次执行时间（智能算法）
const nextExecutionTimes = computed(() => {
  try {
    const times: Date[] = []
    const parts = cronExpression.value.trim().split(/\s+/)
    if (parts.length !== 6) return []

    const [second, minute, hour, day, month, weekday] = parts

    // 从下一秒开始搜索
    let current = new Date()
    current.setSeconds(current.getSeconds() + 1, 0)

    // 最大搜索次数（防止死循环）
    let searchCount = 0
    const maxSearches = 10000

    while (times.length < 5 && searchCount < maxSearches) {
      searchCount++

      // 检查月份
      if (!matchesField(current.getMonth() + 1, month, 1, 12)) {
        // 跳到下个月1号
        current.setMonth(current.getMonth() + 1, 1)
        current.setHours(0, 0, 0, 0)
        continue
      }

      // 检查日期
      if (!matchesField(current.getDate(), day, 1, 31)) {
        // 跳到下一天
        current.setDate(current.getDate() + 1)
        current.setHours(0, 0, 0, 0)
        continue
      }

      // 检查星期
      if (!matchesField(current.getDay(), weekday, 0, 6)) {
        // 跳到下一天
        current.setDate(current.getDate() + 1)
        current.setHours(0, 0, 0, 0)
        continue
      }

      // 检查小时
      if (!matchesField(current.getHours(), hour, 0, 23)) {
        // 跳到下一小时
        current.setHours(current.getHours() + 1, 0, 0, 0)
        continue
      }

      // 检查分钟
      if (!matchesField(current.getMinutes(), minute, 0, 59)) {
        // 跳到下一分钟
        current.setMinutes(current.getMinutes() + 1, 0, 0)
        continue
      }

      // 检查秒
      if (!matchesField(current.getSeconds(), second, 0, 59)) {
        // 跳到下一秒
        current.setSeconds(current.getSeconds() + 1, 0)
        continue
      }

      // 所有字段都匹配
      times.push(new Date(current))
      
      // 跳到下一秒继续搜索
      current.setSeconds(current.getSeconds() + 1)
    }

    return times
  } catch (error) {
    return []
  }
})

// 检查时间是否匹配 Cron 表达式
const matchesCron = (date: Date, expression: string): boolean => {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 6) return false

  const [second, minute, hour, day, month, weekday] = parts

  return (
    matchesField(date.getSeconds(), second, 0, 59) &&
    matchesField(date.getMinutes(), minute, 0, 59) &&
    matchesField(date.getHours(), hour, 0, 23) &&
    matchesField(date.getDate(), day, 1, 31) &&
    matchesField(date.getMonth() + 1, month, 1, 12) &&
    matchesField(date.getDay(), weekday, 0, 6)
  )
}

const matchesField = (value: number, field: string, min: number, max: number): boolean => {
  if (field === '*') return true

  if (field.includes('/')) {
    const [base, step] = field.split('/')
    const baseValue = base === '*' ? min : parseInt(base)
    return (value - baseValue) % parseInt(step) === 0
  }

  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number)
    return value >= start && value <= end
  }

  if (field.includes(',')) {
    const values = field.split(',').map(Number)
    return values.includes(value)
  }

  return parseInt(field) === value
}

// 生成代码示例
const codeExamples = computed(() => ({
  javascript: `// JavaScript - node-cron
const cron = require('node-cron');

cron.schedule('${cronExpression.value}', () => {
  console.log('任务执行');
});`,
  python: `# Python - APScheduler
from apscheduler.schedulers.blocking import BlockingScheduler

scheduler = BlockingScheduler()

@scheduler.scheduled_job('cron', second='${cronFields.value.second}',
                        minute='${cronFields.value.minute}',
                        hour='${cronFields.value.hour}',
                        day='${cronFields.value.day}',
                        month='${cronFields.value.month}',
                        day_of_week='${cronFields.value.weekday}')
def job():
    print('任务执行')

scheduler.start()`,
  java: `// Java - Quartz Scheduler
import org.quartz.*;
import org.quartz.impl.StdSchedulerFactory;

public class CronJob {
    public static void main(String[] args) throws Exception {
        Scheduler scheduler = StdSchedulerFactory.getDefaultScheduler();

        JobDetail job = JobBuilder.newJob(MyJob.class)
            .withIdentity("job1", "group1")
            .build();

        CronTrigger trigger = TriggerBuilder.newTrigger()
            .withIdentity("trigger1", "group1")
            .withSchedule(CronScheduleBuilder.cronSchedule("${cronFields.value.second} ${cronFields.value.minute} ${cronFields.value.hour} ${cronFields.value.day} ${cronFields.value.month} ? ${cronFields.value.weekday}"))
            .build();

        scheduler.start();
        scheduler.scheduleJob(job, trigger);
    }
}`
}))

// 配置字段
const configureField = () => {
  const field = activeFieldType.value
  const range = fieldRanges[field]

  let expression = ''

  switch (configMode.value) {
    case 'every':
      expression = '*'
      break
    case 'specific':
      if (specificValues.value.length > 0) {
        expression = specificValues.value.join(',')
      } else {
        expression = '*'
      }
      break
    case 'range':
      if (rangeStart.value <= rangeEnd.value) {
        expression = `${rangeStart.value}-${rangeEnd.value}`
      } else {
        expression = '*'
      }
      break
    case 'step':
      if (stepValue.value > 0) {
        expression = `*/${stepValue.value}`
      } else {
        expression = '*'
      }
      break
  }

  cronFields.value[field] = expression
  resetConfig()
}

const resetConfig = () => {
  specificValues.value = []
  rangeStart.value = fieldRanges[activeFieldType.value].min
  rangeEnd.value = fieldRanges[activeFieldType.value].max
  stepValue.value = 1
}

// 应用预设模板
const applyPreset = (template: typeof presetTemplates[0]) => {
  const parts = template.expression.split(' ')
  cronFields.value = {
    second: parts[0],
    minute: parts[1],
    hour: parts[2],
    day: parts[3],
    month: parts[4],
    weekday: parts[5]
  }
  success(`已应用"${template.name}"模板`)
}

// 复制功能
const handleCopy = async (text: string) => {
  if (await copyToClipboard(text)) {
    success('已复制到剪贴板')
  }
}

// 切换字段类型时重置配置
watch(activeFieldType, () => {
  resetConfig()
  configMode.value = 'every'
})
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-7xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">Cron 表达式生成器</h1>
      <p class="text-text-secondary">可视化配置定时任务，支持多种预设模板和代码生成</p>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Left: Configuration Section -->
      <div class="space-y-6">
        <!-- Preset Templates -->
        <div class="glass rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles class="w-5 h-5 text-primary" />
            预设模板
          </h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="template in presetTemplates"
              :key="template.name"
              @click="applyPreset(template)"
              class="px-4 py-3 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-left transition-all border border-primary/20 hover:border-primary/50"
            >
              <div class="font-semibold text-white">{{ template.name }}</div>
              <div class="text-xs text-text-tertiary mt-1">{{ template.description }}</div>
            </button>
          </div>
        </div>

        <!-- Field Selection -->
        <div class="glass rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings class="w-5 h-5 text-primary" />
            字段配置
          </h2>

          <!-- Field Tabs -->
          <div class="flex flex-wrap gap-2 mb-6">
            <button
              v-for="(range, field) in fieldRanges"
              :key="field"
              @click="activeFieldType = field as any"
              :class="`px-4 py-2 rounded-lg transition-all ${
                activeFieldType === field
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
              }`"
            >
              {{ range.label }}
            </button>
          </div>

          <!-- Current Value Display -->
          <div class="mb-4 p-3 rounded-lg bg-bg-secondary border border-primary/30">
            <div class="text-sm text-text-tertiary mb-1">当前值:</div>
            <div class="font-mono text-lg text-success">{{ cronFields[activeFieldType] }}</div>
          </div>

          <!-- Configuration Mode -->
          <div class="space-y-4">
            <div class="flex flex-wrap gap-2">
              <button
                @click="configMode = 'every'"
                :class="`px-4 py-2 rounded-lg transition-all ${
                  configMode === 'every'
                    ? 'bg-primary text-white'
                    : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
                }`"
              >
                每{{ fieldRanges[activeFieldType].label }}
              </button>
              <button
                @click="configMode = 'specific'"
                :class="`px-4 py-2 rounded-lg transition-all ${
                  configMode === 'specific'
                    ? 'bg-primary text-white'
                    : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
                }`"
              >
                特定值
              </button>
              <button
                @click="configMode = 'range'"
                :class="`px-4 py-2 rounded-lg transition-all ${
                  configMode === 'range'
                    ? 'bg-primary text-white'
                    : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
                }`"
              >
                范围
              </button>
              <button
                @click="configMode = 'step'"
                :class="`px-4 py-2 rounded-lg transition-all ${
                  configMode === 'step'
                    ? 'bg-primary text-white'
                    : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
                }`"
              >
                步长
              </button>
            </div>

            <!-- Configuration Inputs -->
            <div v-if="configMode === 'specific'" class="space-y-3">
              <label class="text-sm font-semibold block">选择特定值:</label>
              <div class="grid grid-cols-7 gap-2 max-h-40 overflow-y-auto">
                <button
                  v-for="i in Array.from({ length: fieldRanges[activeFieldType].max - fieldRanges[activeFieldType].min + 1 }, (_, idx) => fieldRanges[activeFieldType].min + idx)"
                  :key="i"
                  @click="specificValues.includes(i) ? specificValues = specificValues.filter(v => v !== i) : specificValues.push(i)"
                  :class="`px-2 py-1 rounded text-sm transition-all ${
                    specificValues.includes(i)
                      ? 'bg-primary text-white'
                      : 'bg-bg-tertiary hover:bg-bg-secondary text-text-secondary'
                  }`"
                >
                  {{ i }}
                </button>
              </div>
            </div>

            <div v-if="configMode === 'range'" class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold block mb-2">起始值:</label>
                <input
                  v-model.number="rangeStart"
                  type="number"
                  :min="fieldRanges[activeFieldType].min"
                  :max="fieldRanges[activeFieldType].max"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label class="text-sm font-semibold block mb-2">结束值:</label>
                <input
                  v-model.number="rangeEnd"
                  type="number"
                  :min="fieldRanges[activeFieldType].min"
                  :max="fieldRanges[activeFieldType].max"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div v-if="configMode === 'step'">
              <label class="text-sm font-semibold block mb-2">每隔多少{{ fieldRanges[activeFieldType].label }}:</label>
              <input
                v-model.number="stepValue"
                type="number"
                min="1"
                :max="fieldRanges[activeFieldType].max"
                class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <button
              @click="configureField"
              class="w-full gradient-btn flex items-center justify-center gap-2"
            >
              <Play class="w-5 h-5" />
              应用配置
            </button>
          </div>
        </div>
      </div>

      <!-- Right: Preview Section -->
      <div class="space-y-6">
        <!-- Cron Expression -->
        <div class="glass rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-semibold flex items-center gap-2">
              <Clock class="w-5 h-5 text-primary" />
              Cron 表达式
            </h2>
            <button
              @click="handleCopy(cronExpression)"
              :class="`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                copied ? 'bg-success text-white' : 'bg-bg-tertiary hover:bg-success/80 text-white'
              }`"
            >
              <CheckCircle v-if="copied" class="w-4 h-4" />
              <Copy v-else class="w-4 h-4" />
              <span class="text-sm">{{ copied ? '已复制' : '复制' }}</span>
            </button>
          </div>

          <div class="p-4 rounded-lg bg-bg-secondary border-2 border-primary/30 mb-4">
            <p class="font-mono text-lg text-success text-center">{{ cronExpression }}</p>
          </div>

          <!-- Field Labels -->
          <div class="grid grid-cols-6 gap-2 text-center text-xs text-text-tertiary mb-4">
            <div>秒</div>
            <div>分</div>
            <div>时</div>
            <div>日</div>
            <div>月</div>
            <div>周</div>
          </div>

          <div class="grid grid-cols-6 gap-2 text-center font-mono text-sm">
            <div class="p-2 rounded bg-bg-tertiary">{{ cronFields.second }}</div>
            <div class="p-2 rounded bg-bg-tertiary">{{ cronFields.minute }}</div>
            <div class="p-2 rounded bg-bg-tertiary">{{ cronFields.hour }}</div>
            <div class="p-2 rounded bg-bg-tertiary">{{ cronFields.day }}</div>
            <div class="p-2 rounded bg-bg-tertiary">{{ cronFields.month }}</div>
            <div class="p-2 rounded bg-bg-tertiary">{{ cronFields.weekday }}</div>
          </div>
        </div>

        <!-- Expression Description -->
        <div class="glass rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Calendar class="w-5 h-5 text-primary" />
            表达式含义
          </h2>
          <div class="p-4 rounded-lg bg-bg-secondary border border-primary/20">
            <p class="text-text-secondary">{{ parseCronExpression(cronExpression) }}</p>
          </div>
        </div>

        <!-- Next Execution Times -->
        <div class="glass rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Play class="w-5 h-5 text-primary" />
            接下来5次执行时间
          </h2>
          <div v-if="nextExecutionTimes.length > 0" class="space-y-2">
            <div
              v-for="(time, index) in nextExecutionTimes"
              :key="index"
              class="p-3 rounded-lg bg-bg-secondary border border-primary/20 hover:border-primary/50 transition-all"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-text-tertiary">第 {{ index + 1 }} 次</span>
                <span class="font-mono text-success">{{ format(time, 'yyyy-MM-dd HH:mm:ss') }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-8 text-text-tertiary">
            <p>无法计算执行时间，请检查表达式是否正确</p>
          </div>
        </div>

        <!-- Code Examples -->
        <div class="glass rounded-xl p-6">
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <Code class="w-5 h-5 text-primary" />
            代码示例
          </h2>

          <!-- Language Tabs -->
          <div class="flex gap-2 mb-4">
            <button
              @class="`px-4 py-2 rounded-lg bg-primary text-white`"
            >
              JavaScript
            </button>
            <button
              @class="`px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-text-secondary`"
            >
              Python
            </button>
            <button
              @class="`px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-text-secondary`"
            >
              Java
            </button>
          </div>

          <!-- JavaScript Code -->
          <div class="relative">
            <button
              @click="handleCopy(codeExamples.javascript)"
              class="absolute top-2 right-2 px-2 py-1 rounded bg-bg-tertiary hover:bg-primary text-white text-xs transition-colors flex items-center gap-1"
            >
              <Copy class="w-3 h-3" />
              复制
            </button>
            <pre class="p-4 rounded-lg bg-bg-secondary text-sm font-mono text-text-secondary overflow-x-auto"><code>{{ codeExamples.javascript }}</code></pre>
          </div>
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
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* Custom scrollbar for specific values */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: var(--bg-tertiary);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: var(--primary-color);
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: var(--primary-light);
}
</style>