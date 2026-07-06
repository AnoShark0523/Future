<script setup lang="ts">
import { ref } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import { generateQRCode, parseQRCode, downloadQRCode, generateWiFiConfig } from '@/utils/qrcodeHandler'
import { QrCode, Upload, Download, Copy, Wifi } from 'lucide-vue-next'

const mode = ref<'generate' | 'parse'>('generate')
const inputText = ref('')
const qrSize = ref(256)
const qrColor = ref('#667eea')
const qrBgColor = ref('#ffffff')
const errorCorrectionLevel = ref<'L' | 'M' | 'Q' | 'H'>('M')
const isProcessing = ref(false)
const qrCodeImage = ref<string | null>(null)
const parsedContent = ref<string | null>(null)
const contentType = ref<'text' | 'wifi'>('text')

// WiFi配置
const wifiConfig = ref({
  ssid: '',
  password: '',
  security: 'WPA' as 'WEP' | 'WPA' | 'nopass'
})

const { copied, copyToClipboard } = useClipboard()
const { notification, success, error } = useNotification()

const handleGenerate = async () => {
  const content = contentType.value === 'wifi'
    ? generateWiFiConfig(wifiConfig.value.ssid, wifiConfig.value.password, wifiConfig.value.security)
    : inputText.value

  if (!content.trim()) {
    error('请输入内容')
    return
  }

  isProcessing.value = true

  try {
    const qrImage = await generateQRCode(content, {
      size: qrSize.value,
      color: {
        dark: qrColor.value,
        light: qrBgColor.value
      },
      errorCorrectionLevel: errorCorrectionLevel.value
    })

    qrCodeImage.value = qrImage
    success('二维码生成成功！')
  } catch (e: any) {
    error(e.message || '生成失败')
    console.error(e)
  } finally {
    isProcessing.value = false
  }
}

const handleDownload = () => {
  if (!qrCodeImage.value) return

  downloadQRCode(qrCodeImage.value, `qrcode-${Date.now()}.png`)
  success('二维码已下载')
}

const handleCopyContent = async () => {
  const content = contentType.value === 'wifi'
    ? generateWiFiConfig(wifiConfig.value.ssid, wifiConfig.value.password, wifiConfig.value.security)
    : inputText.value

  if (!content.trim()) return

  if (await copyToClipboard(content)) {
    success('内容已复制')
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || !target.files[0]) return

  isProcessing.value = true

  try {
    const content = await parseQRCode(target.files[0])
    parsedContent.value = content
    success('二维码解析成功')
  } catch (e: any) {
    error(e.message || '解析失败')
    console.error(e)
    parsedContent.value = null
  } finally {
    isProcessing.value = false
  }
}

const handleCopyParsedContent = async () => {
  if (!parsedContent.value) return

  if (await copyToClipboard(parsedContent.value)) {
    success('解析内容已复制')
  }
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-5xl">
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">二维码工具</h1>
      <p class="text-text-secondary">生成和解析二维码，支持WiFi配置、自定义样式</p>
    </div>

    <!-- Mode Toggle -->
    <div class="glass rounded-xl p-4 mb-6">
      <div class="flex gap-2">
        <button
          @click="mode = 'generate'"
          :class="`px-6 py-3 rounded-lg transition-all ${
            mode === 'generate'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <QrCode class="w-5 h-5 inline mr-2" />
          生成二维码
        </button>
        <button
          @click="mode = 'parse'"
          :class="`px-6 py-3 rounded-lg transition-all ${
            mode === 'parse'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          解析二维码
        </button>
      </div>
    </div>

    <!-- Generate Mode -->
    <div v-if="mode === 'generate'" class="glass rounded-xl p-6">
      <!-- Content Type -->
      <div class="mb-6">
        <label class="font-semibold mb-2 block">内容类型:</label>
        <select
          v-model="contentType"
          class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none"
        >
          <option value="text">普通文本/链接</option>
          <option value="wifi">WiFi配置</option>
        </select>
      </div>

      <!-- Text Input -->
      <div v-if="contentType === 'text'" class="mb-6">
        <label class="font-semibold mb-2 block">输入内容:</label>
        <textarea
          v-model="inputText"
          placeholder="输入文本、链接或其他内容..."
          class="w-full h-32 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none"
        />
      </div>

      <!-- WiFi Config -->
      <div v-if="contentType === 'wifi'" class="mb-6 space-y-3">
        <div>
          <label class="font-semibold mb-2 block">WiFi名称 (SSID):</label>
          <input
            v-model="wifiConfig.ssid"
            type="text"
            placeholder="输入WiFi名称..."
            class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        <div>
          <label class="font-semibold mb-2 block">密码:</label>
          <input
            v-model="wifiConfig.password"
            type="text"
            placeholder="输入WiFi密码..."
            class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        <div>
          <label class="font-semibold mb-2 block">加密类型:</label>
          <select
            v-model="wifiConfig.security"
            class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none"
          >
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">无密码</option>
          </select>
        </div>

        <div class="p-3 rounded-lg bg-info/20 border border-info/30">
          <Wifi class="w-5 h-5 inline text-info mr-2" />
          <span class="text-info text-sm">扫描二维码可直接连接WiFi</span>
        </div>
      </div>

      <!-- QR Code Options -->
      <div class="grid md:grid-cols-2 gap-4 mb-6">
        <div>
          <label class="font-semibold mb-2 block">大小: {{ qrSize }}px</label>
          <input
            v-model="qrSize"
            type="range"
            min="128"
            max="512"
            step="32"
            class="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <label class="font-semibold mb-2 block">容错级别:</label>
          <select
            v-model="errorCorrectionLevel"
            class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none"
          >
            <option value="L">低 (7%)</option>
            <option value="M">中 (15%) - 推荐</option>
            <option value="Q">高 (25%)</option>
            <option value="H">最高 (30%)</option>
          </select>
        </div>

        <div>
          <label class="font-semibold mb-2 block">前景色:</label>
          <input
            v-model="qrColor"
            type="color"
            class="w-full h-10 rounded-lg bg-bg-secondary cursor-pointer"
          />
        </div>

        <div>
          <label class="font-semibold mb-2 block">背景色:</label>
          <input
            v-model="qrBgColor"
            type="color"
            class="w-full h-10 rounded-lg bg-bg-secondary cursor-pointer"
          />
        </div>
      </div>

      <!-- Generate Button -->
      <button
        @click="handleGenerate"
        :disabled="isProcessing"
        class="w-full gradient-btn mb-6 disabled:opacity-50"
      >
        <QrCode v-if="!isProcessing" class="w-5 h-5 inline mr-2" />
        <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
        <span>{{ isProcessing ? '生成中...' : '生成二维码' }}</span>
      </button>

      <!-- Result Preview -->
      <div v-if="qrCodeImage" class="text-center">
        <div class="inline-block p-8 rounded-lg bg-white mb-4">
          <img
            :src="qrCodeImage"
            alt="QR Code"
            class="rounded-lg"
          />
        </div>

        <div class="flex gap-3 justify-center">
          <button
            @click="handleDownload"
            class="px-6 py-2 rounded-lg bg-info hover:bg-info/80 text-white transition-colors flex items-center gap-2"
          >
            <Download class="w-5 h-5" />
            <span>下载</span>
          </button>

          <button
            @click="handleCopyContent"
            :class="`px-6 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              copied ? 'bg-success text-white' : 'bg-success hover:bg-success/80 text-white'
            }`"
          >
            <Copy class="w-5 h-5" />
            <span>{{ copied ? '已复制' : '复制内容' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Parse Mode -->
    <div v-else class="glass rounded-xl p-6">
      <div
        class="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary transition-colors"
      >
        <Upload class="w-12 h-12 mx-auto mb-4 text-primary" />
        <p class="text-text-secondary mb-4">拖拽二维码图片或点击上传</p>
        <input
          type="file"
          accept="image/*"
          @change="handleFileUpload"
          class="hidden"
          id="qr-upload"
        />
        <label
          for="qr-upload"
          class="cursor-pointer gradient-btn inline-block"
        >
          上传二维码
        </label>
      </div>

      <!-- Parsed Content -->
      <div v-if="parsedContent" class="mt-6">
        <div class="p-4 rounded-lg bg-success/20 border border-success/30 mb-4">
          <p class="text-success font-semibold mb-2">解析成功！</p>
        </div>

        <div class="p-4 rounded-lg bg-bg-secondary">
          <p class="text-text-tertiary text-sm mb-2">二维码内容:</p>
          <p class="text-white font-mono break-all">{{ parsedContent }}</p>
        </div>

        <div class="mt-4">
          <button
            @click="handleCopyParsedContent"
            class="w-full px-4 py-2 rounded-lg bg-success hover:bg-success/80 text-white transition-colors flex items-center justify-center gap-2"
          >
            <Copy class="w-5 h-5" />
            <span>复制内容</span>
          </button>
        </div>
      </div>

      <div v-else-if="isProcessing" class="mt-6 text-center text-text-tertiary">
        <p>正在解析...</p>
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
</style>