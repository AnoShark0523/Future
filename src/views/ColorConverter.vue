<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import {
  hexToRgb,
  rgbToHsl,
  rgbToCmyk,
  formatRgb,
  formatHsl,
  formatCmyk,
  isValidHex,
  generateRandomColor,
  hslToRgb,
  cmykToRgb,
  rgbToHex
} from '@/utils/colorConverter'
import type { RGB, HSL, CMYK } from '@/utils/colorConverter'
import { Palette, Copy, CheckCircle, Shuffle } from 'lucide-vue-next'

const hexColor = ref<string>('#667EEA')
const colorPickerValue = ref<string>('#667EEA')

const { copied, copyToClipboard } = useClipboard()
const { notification, success } = useNotification()

// RGB, HSL, CMYK 值
const rgbValue = ref<RGB>({ r: 102, g: 126, b: 234 })
const hslValue = ref<HSL>({ h: 230, s: 77, l: 66 })
const cmykValue = ref<CMYK>({ c: 56, m: 46, y: 0, k: 8 })

// 输入模式的颜色值（用于手动编辑）
const rgbInput = ref({ r: 102, g: 126, b: 234 })
const hslInput = ref({ h: 230, s: 77, l: 66 })
const cmykInput = ref({ c: 56, m: 46, y: 0, k: 8 })

// 同步保护标志：防止 HEX→输入→HEX 循环更新导致输入被覆盖
let isSyncing = false

// 监听 HEX 输入变化
watch(hexColor, (newHex) => {
  if (!isValidHex(newHex)) return

  const rgb = hexToRgb(newHex)
  if (rgb) {
    isSyncing = true
    rgbValue.value = { ...rgb }
    rgbInput.value = { ...rgb }

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    hslValue.value = { ...hsl }
    hslInput.value = { ...hsl }

    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
    cmykValue.value = { ...cmyk }
    cmykInput.value = { ...cmyk }

    // 更新颜色选择器
    colorPickerValue.value = newHex.startsWith('#') ? newHex : '#' + newHex
    nextTick(() => { isSyncing = false })
  }
})

// 监听颜色选择器变化
watch(colorPickerValue, (newColor) => {
  hexColor.value = newColor
})

// 监听 RGB 输入变化
watch(rgbInput, (newRgb) => {
  if (isSyncing) return
  const r = Math.max(0, Math.min(255, newRgb.r))
  const g = Math.max(0, Math.min(255, newRgb.g))
  const b = Math.max(0, Math.min(255, newRgb.b))

  hexColor.value = rgbToHex(r, g, b)
}, { deep: true })

// 监听 HSL 输入变化
watch(hslInput, (newHsl) => {
  if (isSyncing) return
  const h = Math.max(0, Math.min(360, newHsl.h))
  const s = Math.max(0, Math.min(100, newHsl.s))
  const l = Math.max(0, Math.min(100, newHsl.l))

  const rgb = hslToRgb(h, s, l)
  hexColor.value = rgbToHex(rgb.r, rgb.g, rgb.b)
}, { deep: true })

// 监听 CMYK 输入变化
watch(cmykInput, (newCmyk) => {
  if (isSyncing) return
  const c = Math.max(0, Math.min(100, newCmyk.c))
  const m = Math.max(0, Math.min(100, newCmyk.m))
  const y = Math.max(0, Math.min(100, newCmyk.y))
  const k = Math.max(0, Math.min(100, newCmyk.k))

  const rgb = cmykToRgb(c, m, y, k)
  hexColor.value = rgbToHex(rgb.r, rgb.g, rgb.b)
}, { deep: true })

// 格式化的输出值
const formattedRgb = computed(() => formatRgb(rgbValue.value))
const formattedHsl = computed(() => formatHsl(hslValue.value))
const formattedCmyk = computed(() => formatCmyk(cmykValue.value))

// 生成随机颜色
const generateRandom = () => {
  hexColor.value = generateRandomColor()
  success('已生成随机颜色')
}

// 复制颜色值
const handleCopy = async (text: string) => {
  if (await copyToClipboard(text)) {
    success('已复制到剪贴板')
  }
}

// 初始化时触发一次转换
hexColor.value = '#667EEA'
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-5xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">颜色转换工具</h1>
      <p class="text-text-secondary">支持 HEX、RGB、HSL、CMYK 格式转换</p>
    </div>

    <!-- Main Content -->
    <div class="grid md:grid-cols-2 gap-6">
      <!-- Left: Color Picker & Preview -->
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
          <Palette class="w-5 h-5" />
          颜色选择
        </h2>

        <!-- Color Picker -->
        <div class="mb-6">
          <label class="text-sm text-text-secondary mb-2 block">颜色选择器</label>
          <input
            v-model="colorPickerValue"
            type="color"
            class="w-full h-32 rounded-lg cursor-pointer bg-transparent"
          />
        </div>

        <!-- HEX Input -->
        <div class="mb-6">
          <label class="text-sm text-text-secondary mb-2 block">HEX 颜色值</label>
          <input
            v-model="hexColor"
            type="text"
            placeholder="#000000"
            class="w-full p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-lg uppercase"
          />
        </div>

        <!-- Random Color Button -->
        <button
          @click="generateRandom"
          class="w-full gradient-btn flex items-center justify-center gap-2 mb-6"
        >
          <Shuffle class="w-5 h-5" />
          <span>随机颜色</span>
        </button>

        <!-- Color Preview -->
        <div>
          <label class="text-sm text-text-secondary mb-2 block">颜色预览</label>
          <div
            class="w-full h-24 rounded-lg shadow-lg"
            :style="{ backgroundColor: hexColor }"
          ></div>
        </div>
      </div>

      <!-- Right: Color Formats -->
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">颜色格式转换</h2>

        <div class="space-y-6">
          <!-- RGB Format -->
          <div class="p-4 rounded-lg bg-bg-secondary">
            <div class="flex items-center justify-between mb-3">
              <label class="font-semibold">RGB</label>
              <button
                @click="handleCopy(formattedRgb)"
                :class="`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  copied ? 'bg-success text-white' : 'bg-bg-tertiary hover:bg-success/80 text-white'
                }`"
              >
                <CheckCircle v-if="copied" class="w-4 h-4" />
                <Copy v-else class="w-4 h-4" />
                <span class="text-sm">{{ copied ? '已复制' : '复制' }}</span>
              </button>
            </div>
            <div class="grid grid-cols-3 gap-2 mb-2">
              <div>
                <label class="text-xs text-text-tertiary">R</label>
                <input
                  v-model.number="rgbInput.r"
                  type="number"
                  min="0"
                  max="255"
                  class="w-full px-2 py-1 rounded bg-bg-tertiary text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-text-tertiary">G</label>
                <input
                  v-model.number="rgbInput.g"
                  type="number"
                  min="0"
                  max="255"
                  class="w-full px-2 py-1 rounded bg-bg-tertiary text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-text-tertiary">B</label>
                <input
                  v-model.number="rgbInput.b"
                  type="number"
                  min="0"
                  max="255"
                  class="w-full px-2 py-1 rounded bg-bg-tertiary text-white text-sm focus:outline-none"
                />
              </div>
            </div>
            <p class="font-mono text-success text-sm">{{ formattedRgb }}</p>
          </div>

          <!-- HSL Format -->
          <div class="p-4 rounded-lg bg-bg-secondary">
            <div class="flex items-center justify-between mb-3">
              <label class="font-semibold">HSL</label>
              <button
                @click="handleCopy(formattedHsl)"
                :class="`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  copied ? 'bg-success text-white' : 'bg-bg-tertiary hover:bg-success/80 text-white'
                }`"
              >
                <CheckCircle v-if="copied" class="w-4 h-4" />
                <Copy v-else class="w-4 h-4" />
                <span class="text-sm">{{ copied ? '已复制' : '复制' }}</span>
              </button>
            </div>
            <div class="grid grid-cols-3 gap-2 mb-2">
              <div>
                <label class="text-xs text-text-tertiary">H (0-360)</label>
                <input
                  v-model.number="hslInput.h"
                  type="number"
                  min="0"
                  max="360"
                  class="w-full px-2 py-1 rounded bg-bg-tertiary text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-text-tertiary">S (%)</label>
                <input
                  v-model.number="hslInput.s"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-2 py-1 rounded bg-bg-tertiary text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-text-tertiary">L (%)</label>
                <input
                  v-model.number="hslInput.l"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-2 py-1 rounded bg-bg-tertiary text-white text-sm focus:outline-none"
                />
              </div>
            </div>
            <p class="font-mono text-success text-sm">{{ formattedHsl }}</p>
          </div>

          <!-- CMYK Format -->
          <div class="p-4 rounded-lg bg-bg-secondary">
            <div class="flex items-center justify-between mb-3">
              <label class="font-semibold">CMYK</label>
              <button
                @click="handleCopy(formattedCmyk)"
                :class="`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                  copied ? 'bg-success text-white' : 'bg-bg-tertiary hover:bg-success/80 text-white'
                }`"
              >
                <CheckCircle v-if="copied" class="w-4 h-4" />
                <Copy v-else class="w-4 h-4" />
                <span class="text-sm">{{ copied ? '已复制' : '复制' }}</span>
              </button>
            </div>
            <div class="grid grid-cols-4 gap-2 mb-2">
              <div>
                <label class="text-xs text-text-tertiary">C (%)</label>
                <input
                  v-model.number="cmykInput.c"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-2 py-1 rounded bg-bg-tertiary text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-text-tertiary">M (%)</label>
                <input
                  v-model.number="cmykInput.m"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-2 py-1 rounded bg-bg-tertiary text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-text-tertiary">Y (%)</label>
                <input
                  v-model.number="cmykInput.y"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-2 py-1 rounded bg-bg-tertiary text-white text-sm focus:outline-none"
                />
              </div>
              <div>
                <label class="text-xs text-text-tertiary">K (%)</label>
                <input
                  v-model.number="cmykInput.k"
                  type="number"
                  min="0"
                  max="100"
                  class="w-full px-2 py-1 rounded bg-bg-tertiary text-white text-sm focus:outline-none"
                />
              </div>
            </div>
            <p class="font-mono text-success text-sm">{{ formattedCmyk }}</p>
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