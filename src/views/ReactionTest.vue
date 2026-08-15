<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Zap, Play, Pause, RotateCcw, Volume2, VolumeX, TrendingUp, Award, Target, AlertTriangle, BarChart3 } from 'lucide-vue-next'

type TestState = 'idle' | 'waiting' | 'ready' | 'result' | 'tooEarly' | 'finished'

const testState = ref<TestState>('idle')
const currentRound = ref(0)
const totalRounds = ref(5)
const roundTimes = ref<number[]>([])
const currentReaction = ref<number | null>(null)
const lastReaction = ref<number | null>(null)
const bestRecord = ref<number>(0)
const tooEarlyCount = ref(0)
const soundEnabled = ref(true)

let startTime = 0
let timeoutId: ReturnType<typeof setTimeout> | null = null
let audioCtx: AudioContext | null = null

const roundOptions = [5, 10, 20]

const loadBestRecord = () => {
  const saved = localStorage.getItem('reaction-best-record')
  if (saved) bestRecord.value = parseInt(saved, 10) || 0
}

const saveBestRecord = (time: number) => {
  if (bestRecord.value === 0 || time < bestRecord.value) {
    bestRecord.value = time
    localStorage.setItem('reaction-best-record', String(time))
  }
}

onMounted(() => loadBestRecord())

onUnmounted(() => {
  if (timeoutId) clearTimeout(timeoutId)
  if (audioCtx) audioCtx.close()
})

const playSound = (type: 'ready' | 'click' | 'error') => {
  if (!soundEnabled.value) return
  try {
    if (!audioCtx) audioCtx = new AudioContext()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    if (type === 'ready') {
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
    } else if (type === 'click') {
      osc.frequency.value = 660
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime)
    } else {
      osc.frequency.value = 200
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
    }
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.2)
  } catch {
    // Audio not available
  }
}

const startTest = () => {
  roundTimes.value = []
  currentRound.value = 0
  tooEarlyCount.value = 0
  currentReaction.value = null
  lastReaction.value = null
  nextRound()
}

const nextRound = () => {
  if (currentRound.value >= totalRounds.value) {
    testState.value = 'finished'
    if (roundTimes.value.length > 0) {
      const avg = averageTime.value!
      saveBestRecord(Math.min(...roundTimes.value))
    }
    return
  }
  testState.value = 'waiting'
  const delay = 800 + Math.random() * 2000
  timeoutId = setTimeout(() => {
    testState.value = 'ready'
    startTime = performance.now()
    playSound('ready')
  }, delay)
}

const handleClick = () => {
  if (testState.value === 'idle' || testState.value === 'finished') {
    startTest()
    return
  }
  if (testState.value === 'waiting') {
    if (timeoutId) clearTimeout(timeoutId)
    testState.value = 'tooEarly'
    tooEarlyCount.value++
    playSound('error')
    return
  }
  if (testState.value === 'ready') {
    const reactionTime = Math.round(performance.now() - startTime)
    lastReaction.value = reactionTime
    currentReaction.value = reactionTime
    roundTimes.value.push(reactionTime)
    currentRound.value++
    playSound('click')
    testState.value = 'result'
    return
  }
  if (testState.value === 'tooEarly' || testState.value === 'result') {
    nextRound()
    return
  }
}

const resetTest = () => {
  if (timeoutId) clearTimeout(timeoutId)
  testState.value = 'idle'
  currentRound.value = 0
  roundTimes.value = []
  currentReaction.value = null
  lastReaction.value = null
  tooEarlyCount.value = 0
}

const averageTime = computed(() => {
  if (roundTimes.value.length === 0) return null
  return Math.round(roundTimes.value.reduce((a, b) => a + b, 0) / roundTimes.value.length)
})

const bestTime = computed(() => {
  if (roundTimes.value.length === 0) return null
  return Math.min(...roundTimes.value)
})

const worstTime = computed(() => {
  if (roundTimes.value.length === 0) return null
  return Math.max(...roundTimes.value)
})

const medianTime = computed(() => {
  if (roundTimes.value.length === 0) return null
  const sorted = [...roundTimes.value].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
})

const stdDev = computed(() => {
  if (roundTimes.value.length < 2) return null
  const avg = averageTime.value!
  const variance = roundTimes.value.reduce((sum, t) => sum + (t - avg) ** 2, 0) / roundTimes.value.length
  return Math.round(Math.sqrt(variance))
})

const ratingLevel = computed(() => {
  const time = averageTime.value
  if (time === null) return null
  if (time < 180) return { label: '精英级', color: 'text-purple-400', desc: '接近人类极限，职业电竞选手水平' }
  if (time < 220) return { label: '优秀级', color: 'text-blue-400', desc: '明显高于平均水平，反应敏捷' }
  if (time < 280) return { label: '平均级', color: 'text-green-400', desc: '普通成年人的平均反应时间' }
  return { label: '较慢级', color: 'text-orange-400', desc: '可能需要更多练习和休息' }
})

const testAreaText = computed(() => {
  switch (testState.value) {
    case 'idle': return '点击开始测试'
    case 'waiting': return '等待变绿...'
    case 'ready': return '立即点击！'
    case 'result': return `${lastReaction.value} ms — 点击继续`
    case 'tooEarly': return '过早点击！点击继续'
    case 'finished': return '测试完成！点击重新开始'
  }
})

const testAreaColor = computed(() => {
  switch (testState.value) {
    case 'idle': return 'from-slate-700 to-slate-800'
    case 'waiting': return 'from-red-600 to-red-700'
    case 'ready': return 'from-green-500 to-emerald-500'
    case 'result': return 'from-blue-600 to-indigo-600'
    case 'tooEarly': return 'from-orange-600 to-red-600'
    case 'finished': return 'from-purple-600 to-pink-600'
  }
})

const progressPercent = computed(() => {
  return Math.round((currentRound.value / totalRounds.value) * 100)
})

const formatTime = (ms: number | null) => {
  if (ms === null) return '--'
  return String(ms)
}

const barChartData = computed(() => {
  if (roundTimes.value.length === 0) return []
  const max = Math.max(...roundTimes.value, 400)
  return roundTimes.value.map((t, i) => ({
    round: i + 1,
    time: t,
    height: Math.max(4, (t / max) * 100),
    color: t < 180 ? 'bg-purple-400' : t < 220 ? 'bg-blue-400' : t < 280 ? 'bg-green-400' : 'bg-orange-400'
  }))
})
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-6xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <div class="inline-flex items-center gap-3 mb-2">
        <div class="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center">
          <Zap class="w-7 h-7 text-white" />
        </div>
        <h1 class="text-3xl font-bold gradient-text">快速反应力测试</h1>
      </div>
      <p class="text-text-secondary">测试你的视觉反应速度，屏幕变绿时尽快点击，测量毫秒级反应时间</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-6">
      <!-- Left: Stats Panel -->
      <div class="lg:col-span-1 space-y-4">
        <!-- Current Stats -->
        <div class="glass rounded-xl p-5">
          <h3 class="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2">
            <Target class="w-4 h-4" /> 实时数据
          </h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-text-secondary text-sm">当前反应</span>
              <span class="text-2xl font-bold" :class="lastReaction && lastReaction < 220 ? 'text-green-400' : lastReaction && lastReaction < 280 ? 'text-blue-400' : lastReaction ? 'text-orange-400' : 'text-text-secondary'">
                {{ formatTime(lastReaction) }}<span v-if="lastReaction" class="text-sm ml-1">ms</span>
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-text-secondary text-sm">平均反应</span>
              <span class="text-xl font-bold text-blue-400">{{ formatTime(averageTime) }}<span v-if="averageTime" class="text-sm ml-1">ms</span></span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-text-secondary text-sm">最佳记录</span>
              <span class="text-xl font-bold text-amber-400">{{ formatTime(bestTime || bestRecord) }}<span v-if="bestTime || bestRecord" class="text-sm ml-1">ms</span></span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-text-secondary text-sm">测试进度</span>
              <span class="text-xl font-bold text-purple-400">{{ currentRound }}/{{ totalRounds }}</span>
            </div>
            <!-- Progress Bar -->
            <div class="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-300 rounded-full" :style="{ width: `${progressPercent}%` }"></div>
            </div>
          </div>
        </div>

        <!-- Settings -->
        <div class="glass rounded-xl p-5">
          <h3 class="text-sm font-semibold text-text-secondary mb-4">测试设置</h3>
          <div class="space-y-4">
            <div>
              <label class="text-text-secondary text-sm mb-2 block">测试轮次</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="n in roundOptions"
                  :key="n"
                  @click="totalRounds = n; resetTest()"
                  :class="[
                    'py-2 rounded-lg text-sm font-medium transition-all',
                    totalRounds === n
                      ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white'
                      : 'bg-slate-700/50 text-text-secondary hover:bg-slate-600/50'
                  ]"
                >
                  {{ n }}次
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <label class="text-text-secondary text-sm">音效提示</label>
              <button
                @click="soundEnabled = !soundEnabled"
                class="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
              >
                <Volume2 v-if="soundEnabled" class="w-4 h-4 text-green-400" />
                <VolumeX v-else class="w-4 h-4 text-text-secondary" />
              </button>
            </div>
            <button
              v-if="testState !== 'idle'"
              @click="resetTest"
              class="w-full py-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-text-secondary text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw class="w-4 h-4" /> 重置测试
            </button>
          </div>
        </div>

        <!-- Rating -->
        <div v-if="ratingLevel" class="glass rounded-xl p-5">
          <h3 class="text-sm font-semibold text-text-secondary mb-3 flex items-center gap-2">
            <Award class="w-4 h-4" /> 速度评级
          </h3>
          <div class="text-center">
            <div class="text-3xl font-bold mb-1" :class="ratingLevel.color">{{ ratingLevel.label }}</div>
            <div class="text-text-secondary text-xs">{{ ratingLevel.desc }}</div>
            <div class="mt-3 text-2xl font-bold text-amber-400">{{ averageTime }}<span class="text-sm ml-1">ms</span></div>
          </div>
        </div>
      </div>

      <!-- Right: Test Area -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Test Area -->
        <div
          @click="handleClick"
          class="relative rounded-xl bg-gradient-to-br cursor-pointer transition-all duration-200 select-none overflow-hidden"
          :class="testAreaColor"
          style="min-height: 360px;"
        >
          <div class="absolute inset-0 flex flex-col items-center justify-center p-8">
            <div class="text-center">
              <p class="text-5xl font-bold text-white mb-3 drop-shadow-lg">{{ testAreaText }}</p>
              <div v-if="testState === 'waiting'" class="text-white/70 text-lg">
                <AlertTriangle class="w-6 h-6 inline mr-1" />
                请等待绿色出现，提前点击会失败
              </div>
              <div v-if="testState === 'ready'" class="text-white/80 text-lg animate-pulse">
                <Zap class="w-8 h-8 inline mr-1" /> 快点！
              </div>
              <div v-if="testState === 'idle'" class="text-white/60 text-base mt-2">
                <Play class="w-5 h-5 inline mr-1" /> 共 {{ totalRounds }} 轮测试
              </div>
              <div v-if="testState === 'finished' && averageTime" class="text-white/80 text-lg mt-2">
                平均 {{ averageTime }}ms · 最佳 {{ bestTime }}ms
              </div>
            </div>
          </div>
          <!-- Decorative pulse ring -->
          <div v-if="testState === 'ready'" class="absolute inset-0 rounded-xl ring-4 ring-white/30 animate-ping"></div>
        </div>

        <!-- Results Statistics -->
        <div v-if="roundTimes.length > 0" class="glass rounded-xl p-5">
          <h3 class="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2">
            <BarChart3 class="w-4 h-4" /> 详细统计
          </h3>
          <!-- Bar Chart -->
          <div class="flex items-end gap-1.5 h-32 mb-4">
            <div
              v-for="bar in barChartData"
              :key="bar.round"
              class="flex-1 flex flex-col items-center gap-1 group relative"
            >
              <div class="text-[10px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity">{{ bar.time }}ms</div>
              <div
                class="w-full rounded-t transition-all duration-300 hover:opacity-80"
                :class="bar.color"
                :style="{ height: `${bar.height}%` }"
              ></div>
              <div class="text-[10px] text-text-secondary">{{ bar.round }}</div>
            </div>
          </div>
          <!-- Stats Grid -->
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center bg-slate-700/30 rounded-lg p-3">
              <div class="text-text-secondary text-xs mb-1">平均</div>
              <div class="text-lg font-bold text-blue-400">{{ formatTime(averageTime) }}<span v-if="averageTime" class="text-xs">ms</span></div>
            </div>
            <div class="text-center bg-slate-700/30 rounded-lg p-3">
              <div class="text-text-secondary text-xs mb-1">最佳</div>
              <div class="text-lg font-bold text-green-400">{{ formatTime(bestTime) }}<span v-if="bestTime" class="text-xs">ms</span></div>
            </div>
            <div class="text-center bg-slate-700/30 rounded-lg p-3">
              <div class="text-text-secondary text-xs mb-1">最慢</div>
              <div class="text-lg font-bold text-orange-400">{{ formatTime(worstTime) }}<span v-if="worstTime" class="text-xs">ms</span></div>
            </div>
            <div class="text-center bg-slate-700/30 rounded-lg p-3">
              <div class="text-text-secondary text-xs mb-1">中位数</div>
              <div class="text-lg font-bold text-purple-400">{{ formatTime(medianTime) }}<span v-if="medianTime" class="text-xs">ms</span></div>
            </div>
            <div class="text-center bg-slate-700/30 rounded-lg p-3">
              <div class="text-text-secondary text-xs mb-1">标准差</div>
              <div class="text-lg font-bold text-cyan-400">{{ formatTime(stdDev) }}<span v-if="stdDev" class="text-xs">ms</span></div>
            </div>
            <div class="text-center bg-slate-700/30 rounded-lg p-3">
              <div class="text-text-secondary text-xs mb-1">过早点击</div>
              <div class="text-lg font-bold text-red-400">{{ tooEarlyCount }}</div>
            </div>
          </div>
        </div>

        <!-- Rating Guide -->
        <div class="glass rounded-xl p-5">
          <h3 class="text-sm font-semibold text-text-secondary mb-4 flex items-center gap-2">
            <TrendingUp class="w-4 h-4" /> 反应速度等级参考
          </h3>
          <div class="grid grid-cols-2 gap-3">
            <div class="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3">
              <div class="w-3 h-3 rounded-full bg-purple-400 flex-shrink-0"></div>
              <div>
                <div class="text-sm font-semibold text-purple-400">精英级</div>
                <div class="text-text-secondary text-xs">&lt; 180ms · 职业电竞水平</div>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3">
              <div class="w-3 h-3 rounded-full bg-blue-400 flex-shrink-0"></div>
              <div>
                <div class="text-sm font-semibold text-blue-400">优秀级</div>
                <div class="text-text-secondary text-xs">180-220ms · 反应敏捷</div>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3">
              <div class="w-3 h-3 rounded-full bg-green-400 flex-shrink-0"></div>
              <div>
                <div class="text-sm font-semibold text-green-400">平均级</div>
                <div class="text-text-secondary text-xs">220-280ms · 普通水平</div>
              </div>
            </div>
            <div class="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3">
              <div class="w-3 h-3 rounded-full bg-orange-400 flex-shrink-0"></div>
              <div>
                <div class="text-sm font-semibold text-orange-400">较慢级</div>
                <div class="text-text-secondary text-xs">&gt; 280ms · 需多练习</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-in {
  animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
