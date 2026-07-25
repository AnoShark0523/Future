<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import {
  generateQRCode,
  parseQRCode,
  downloadQRCode,
  generateWiFiConfig,
  generateVCard,
  generatePhoneContent,
  generateSMSContent,
  generateEmailContent,
  embedLogoToQRCode,
  getQRHistory,
  saveQRHistory,
  deleteQRHistory,
  clearQRHistory,
  downloadBatchQRCodes,
  type VCardData,
  type QRHistoryItem
} from '@/utils/qrcodeHandler'
import {
  QrCode,
  Upload,
  Download,
  Copy,
  Wifi,
  Phone,
  Mail,
  MessageSquare,
  User,
  History,
  Layers,
  Camera
} from 'lucide-vue-next'

// 模式：生成、解析、批量、历史
const mode = ref<'generate' | 'parse' | 'batch' | 'history'>('generate')
const contentType = ref<'text' | 'wifi' | 'vcard' | 'phone' | 'sms' | 'email'>('text')

// 基础设置
const inputText = ref('')
const qrSize = ref(256)
const qrColor = ref('#667eea')
const qrBgColor = ref('#ffffff')
const errorCorrectionLevel = ref<'L' | 'M' | 'Q' | 'H'>('M')
const qrStyle = ref<'square' | 'rounded' | 'dots'>('square')

// 处理状态
const isProcessing = ref(false)
const qrCodeImage = ref<string | null>(null)
const parsedContent = ref<string | null>(null)

// WiFi配置
const wifiConfig = ref({
  ssid: '',
  password: '',
  security: 'WPA' as 'WEP' | 'WPA' | 'nopass'
})

// vCard名片配置
const vcardConfig = ref<VCardData>({
  name: '',
  phone: '',
  email: '',
  organization: '',
  title: '',
  address: '',
  website: '',
  note: ''
})

// 电话配置
const phoneConfig = ref({
  phone: ''
})

// 短信配置
const smsConfig = ref({
  phone: '',
  message: ''
})

// 邮件配置
const emailConfig = ref({
  email: '',
  subject: '',
  body: ''
})

// Logo嵌入
const logoFile = ref<File | null>(null)
const logoSize = ref(60)
const showLogoOption = ref(false)

// 批量生成
const batchItems = ref<Array<{ content: string; filename: string }>>([])

// 历史记录
const historyList = ref<QRHistoryItem[]>([])

const { copied, copyToClipboard } = useClipboard()
const { notification, success, error, info } = useNotification()

// 加载历史记录
onMounted(() => {
  historyList.value = getQRHistory()
})

// 根据内容类型生成二维码内容
const generateContent = () => {
  switch (contentType.value) {
    case 'wifi':
      return generateWiFiConfig(wifiConfig.value.ssid, wifiConfig.value.password, wifiConfig.value.security)
    case 'vcard':
      return generateVCard(vcardConfig.value)
    case 'phone':
      return generatePhoneContent(phoneConfig.value.phone)
    case 'sms':
      return generateSMSContent(smsConfig.value.phone, smsConfig.value.message)
    case 'email':
      return generateEmailContent(emailConfig.value.email, emailConfig.value.subject, emailConfig.value.body)
    default:
      return inputText.value
  }
}

// 验证内容
const validateContent = () => {
  const content = generateContent()
  if (!content.trim()) {
    error('请输入内容')
    return false
  }
  
  // 特殊验证
  if (contentType.value === 'wifi' && !wifiConfig.value.ssid) {
    error('请输入WiFi名称')
    return false
  }
  
  if (contentType.value === 'vcard' && !vcardConfig.value.name) {
    error('请输入姓名')
    return false
  }
  
  if (contentType.value === 'phone' && !phoneConfig.value.phone) {
    error('请输入电话号码')
    return false
  }
  
  if (contentType.value === 'sms' && !smsConfig.value.phone) {
    error('请输入电话号码')
    return false
  }
  
  if (contentType.value === 'email' && !emailConfig.value.email) {
    error('请输入邮箱地址')
    return false
  }
  
  return true
}

// 生成二维码
const handleGenerate = async () => {
  if (!validateContent()) return

  isProcessing.value = true

  try {
    const content = generateContent()
    let qrImage = await generateQRCode(content, {
      size: qrSize.value,
      color: {
        dark: qrColor.value,
        light: qrBgColor.value
      },
      errorCorrectionLevel: errorCorrectionLevel.value,
      style: qrStyle.value
    })

    // 如果有Logo，嵌入Logo
    if (showLogoOption.value && logoFile.value) {
      qrImage = await embedLogoToQRCode(qrImage, logoFile.value, logoSize.value)
    }

    qrCodeImage.value = qrImage

    // 保存到历史记录
    const historyItem: QRHistoryItem = {
      id: Date.now().toString(),
      content,
      type: contentType.value,
      imageData: qrImage,
      createdAt: Date.now()
    }
    saveQRHistory(historyItem)
    historyList.value = getQRHistory()

    success('二维码生成成功！')
  } catch (e: any) {
    error(e.message || '生成失败')
    console.error(e)
  } finally {
    isProcessing.value = false
  }
}

// 下载二维码
const handleDownload = () => {
  if (!qrCodeImage.value) return

  downloadQRCode(qrCodeImage.value, `qrcode-${contentType.value}-${Date.now()}.png`)
  success('二维码已下载')
}

// 复制内容
const handleCopyContent = async () => {
  const content = generateContent()
  if (!content.trim()) return

  if (await copyToClipboard(content)) {
    success('内容已复制')
  }
}

// Logo文件上传
const handleLogoUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || !target.files[0]) return

  logoFile.value = target.files[0]
  success('Logo已上传')
}

// 解析二维码
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

// 复制解析内容
const handleCopyParsedContent = async () => {
  if (!parsedContent.value) return

  if (await copyToClipboard(parsedContent.value)) {
    success('解析内容已复制')
  }
}

// 批量生成 - 添加项目
const addBatchItem = () => {
  batchItems.value.push({
    content: '',
    filename: `qrcode-${batchItems.value.length + 1}`
  })
}

// 批量生成 - 删除项目
const removeBatchItem = (index: number) => {
  batchItems.value.splice(index, 1)
}

// 批量生成 - 下载
const handleBatchDownload = async () => {
  if (batchItems.value.length === 0) {
    error('请添加至少一个二维码')
    return
  }

  const validItems = batchItems.value.filter(item => item.content.trim())
  if (validItems.length === 0) {
    error('请输入二维码内容')
    return
  }

  isProcessing.value = true

  try {
    await downloadBatchQRCodes(validItems, {
      size: qrSize.value,
      color: {
        dark: qrColor.value,
        light: qrBgColor.value
      },
      errorCorrectionLevel: errorCorrectionLevel.value,
      style: qrStyle.value
    })

    success('批量下载完成')
  } catch (e: any) {
    error(e.message || '批量下载失败')
    console.error(e)
  } finally {
    isProcessing.value = false
  }
}

// 删除历史记录
const handleDeleteHistory = (id: string) => {
  deleteQRHistory(id)
  historyList.value = getQRHistory()
  success('已删除')
}

// 清空历史记录
const handleClearHistory = () => {
  clearQRHistory()
  historyList.value = []
  success('历史记录已清空')
}

// 从历史记录重新生成
const handleRegenerateFromHistory = (item: QRHistoryItem) => {
  qrCodeImage.value = item.imageData
  mode.value = 'generate'
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-5xl">
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">二维码工具</h1>
      <p class="text-text-secondary">生成和解析二维码，支持WiFi、vCard名片、批量生成等多种功能</p>
    </div>

    <!-- Mode Toggle -->
    <div class="glass rounded-xl p-4 mb-6">
      <div class="flex gap-2 flex-wrap">
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
          <Camera class="w-5 h-5 inline mr-2" />
          解析二维码
        </button>
        <button
          @click="mode = 'batch'"
          :class="`px-6 py-3 rounded-lg transition-all ${
            mode === 'batch'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <Layers class="w-5 h-5 inline mr-2" />
          批量生成
        </button>
        <button
          @click="mode = 'history'"
          :class="`px-6 py-3 rounded-lg transition-all ${
            mode === 'history'
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <History class="w-5 h-5 inline mr-2" />
          历史记录
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
          <option value="vcard">vCard名片</option>
          <option value="phone">电话</option>
          <option value="sms">短信</option>
          <option value="email">邮件</option>
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

      <!-- vCard Config -->
      <div v-if="contentType === 'vcard'" class="mb-6 space-y-3">
        <div>
          <label class="font-semibold mb-2 block">姓名 *:</label>
          <input
            v-model="vcardConfig.name"
            type="text"
            placeholder="姓名"
            class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="font-semibold mb-2 block">电话:</label>
            <input
              v-model="vcardConfig.phone"
              type="text"
              placeholder="电话号码"
              class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
            />
          </div>

          <div>
            <label class="font-semibold mb-2 block">邮箱:</label>
            <input
              v-model="vcardConfig.email"
              type="email"
              placeholder="邮箱地址"
              class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
            />
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-3">
          <div>
            <label class="font-semibold mb-2 block">公司:</label>
            <input
              v-model="vcardConfig.organization"
              type="text"
              placeholder="公司名称"
              class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
            />
          </div>

          <div>
            <label class="font-semibold mb-2 block">职位:</label>
            <input
              v-model="vcardConfig.title"
              type="text"
              placeholder="职位"
              class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label class="font-semibold mb-2 block">地址:</label>
          <input
            v-model="vcardConfig.address"
            type="text"
            placeholder="地址"
            class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        <div>
          <label class="font-semibold mb-2 block">网站:</label>
          <input
            v-model="vcardConfig.website"
            type="url"
            placeholder="网站地址"
            class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        <div>
          <label class="font-semibold mb-2 block">备注:</label>
          <textarea
            v-model="vcardConfig.note"
            placeholder="备注信息"
            class="w-full h-20 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none"
          />
        </div>

        <div class="p-3 rounded-lg bg-info/20 border border-info/30">
          <User class="w-5 h-5 inline text-info mr-2" />
          <span class="text-info text-sm">扫描二维码可快速添加联系人</span>
        </div>
      </div>

      <!-- Phone Config -->
      <div v-if="contentType === 'phone'" class="mb-6">
        <label class="font-semibold mb-2 block">电话号码:</label>
        <input
          v-model="phoneConfig.phone"
          type="tel"
          placeholder="例如: 13800138000"
          class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
        />
        <div class="mt-3 p-3 rounded-lg bg-info/20 border border-info/30">
          <Phone class="w-5 h-5 inline text-info mr-2" />
          <span class="text-info text-sm">扫描二维码可直接拨打电话</span>
        </div>
      </div>

      <!-- SMS Config -->
      <div v-if="contentType === 'sms'" class="mb-6 space-y-3">
        <div>
          <label class="font-semibold mb-2 block">电话号码:</label>
          <input
            v-model="smsConfig.phone"
            type="tel"
            placeholder="例如: 13800138000"
            class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        <div>
          <label class="font-semibold mb-2 block">短信内容:</label>
          <textarea
            v-model="smsConfig.message"
            placeholder="输入短信内容（可选）"
            class="w-full h-20 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none"
          />
        </div>

        <div class="p-3 rounded-lg bg-info/20 border border-info/30">
          <MessageSquare class="w-5 h-5 inline text-info mr-2" />
          <span class="text-info text-sm">扫描二维码可直接发送短信</span>
        </div>
      </div>

      <!-- Email Config -->
      <div v-if="contentType === 'email'" class="mb-6 space-y-3">
        <div>
          <label class="font-semibold mb-2 block">邮箱地址:</label>
          <input
            v-model="emailConfig.email"
            type="email"
            placeholder="example@email.com"
            class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        <div>
          <label class="font-semibold mb-2 block">主题:</label>
          <input
            v-model="emailConfig.subject"
            type="text"
            placeholder="邮件主题（可选）"
            class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
          />
        </div>

        <div>
          <label class="font-semibold mb-2 block">正文:</label>
          <textarea
            v-model="emailConfig.body"
            placeholder="邮件内容（可选）"
            class="w-full h-20 p-4 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary resize-none focus:outline-none"
          />
        </div>

        <div class="p-3 rounded-lg bg-info/20 border border-info/30">
          <Mail class="w-5 h-5 inline text-info mr-2" />
          <span class="text-info text-sm">扫描二维码可直接发送邮件</span>
        </div>
      </div>

      <!-- QR Code Options -->
      <div class="mb-6">
        <h3 class="font-semibold mb-3 text-lg">样式设置</h3>
        <div class="grid md:grid-cols-3 gap-4">
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
            <label class="font-semibold mb-2 block">样式:</label>
            <select
              v-model="qrStyle"
              class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none"
            >
              <option value="square">方形</option>
              <option value="rounded">圆角</option>
              <option value="dots">点状</option>
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
      </div>

      <!-- Logo嵌入选项 -->
      <div class="mb-6">
        <div class="flex items-center gap-3 mb-3">
          <input
            v-model="showLogoOption"
            type="checkbox"
            id="logo-option"
            class="w-5 h-5 rounded"
          />
          <label for="logo-option" class="font-semibold">嵌入Logo</label>
        </div>

        <div v-if="showLogoOption" class="space-y-3">
          <div>
            <label class="font-semibold mb-2 block">上传Logo:</label>
            <input
              type="file"
              accept="image/*"
              @change="handleLogoUpload"
              class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none"
            />
          </div>

          <div>
            <label class="font-semibold mb-2 block">Logo大小: {{ logoSize }}px</label>
            <input
              v-model="logoSize"
              type="range"
              min="30"
              max="100"
              step="5"
              class="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div class="p-3 rounded-lg bg-warning/20 border border-warning/30">
            <span class="text-warning text-sm">注意：嵌入Logo会降低二维码的可读性，建议使用高容错级别</span>
          </div>
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
    <div v-else-if="mode === 'parse'" class="glass rounded-xl p-6">
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

    <!-- Batch Mode -->
    <div v-else-if="mode === 'batch'" class="glass rounded-xl p-6">
      <div class="mb-6">
        <h3 class="font-semibold mb-3">批量生成设置</h3>
        <p class="text-text-tertiary text-sm mb-4">添加多个二维码内容，一次性批量生成并下载</p>

        <!-- Batch Items -->
        <div class="space-y-3 mb-4">
          <div v-for="(item, index) in batchItems" :key="index" class="flex gap-3 items-start">
            <div class="flex-1">
              <input
                v-model="item.content"
                type="text"
                placeholder="二维码内容"
                class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
              />
            </div>
            <div class="w-40">
              <input
                v-model="item.filename"
                type="text"
                placeholder="文件名"
                class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none"
              />
            </div>
            <button
              @click="removeBatchItem(index)"
              class="px-4 py-2 rounded-lg bg-error hover:bg-error/80 text-white transition-colors"
            >
              删除
            </button>
          </div>
        </div>

        <button
          @click="addBatchItem"
          class="w-full px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-white transition-colors"
        >
          + 添加项目
        </button>
      </div>

      <!-- Batch Options -->
      <div class="grid md:grid-cols-3 gap-4 mb-6">
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

      <button
        @click="handleBatchDownload"
        :disabled="isProcessing"
        class="w-full gradient-btn disabled:opacity-50"
      >
        <Download v-if="!isProcessing" class="w-5 h-5 inline mr-2" />
        <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
        <span>{{ isProcessing ? '生成中...' : '批量生成并下载' }}</span>
      </button>
    </div>

    <!-- History Mode -->
    <div v-else-if="mode === 'history'" class="glass rounded-xl p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="font-semibold">历史记录</h3>
        <button
          v-if="historyList.length > 0"
          @click="handleClearHistory"
          class="px-4 py-2 rounded-lg bg-error hover:bg-error/80 text-white transition-colors text-sm"
        >
          清空历史
        </button>
      </div>

      <div v-if="historyList.length === 0" class="text-center py-12">
        <History class="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
        <p class="text-text-tertiary">暂无历史记录</p>
      </div>

      <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="item in historyList"
          :key="item.id"
          class="bg-bg-secondary rounded-lg p-4"
        >
          <div class="flex justify-center mb-3">
            <img
              :src="item.imageData"
              alt="QR Code"
              class="w-32 h-32 rounded-lg"
            />
          </div>

          <div class="mb-2">
            <span class="text-xs text-text-tertiary">{{ formatTime(item.createdAt) }}</span>
          </div>

          <div class="mb-3">
            <p class="text-sm text-white truncate">{{ item.content }}</p>
          </div>

          <div class="flex gap-2">
            <button
              @click="handleRegenerateFromHistory(item)"
              class="flex-1 px-3 py-1 rounded bg-primary hover:bg-primary/80 text-white text-sm transition-colors"
            >
              使用
            </button>
            <button
              @click="handleDeleteHistory(item.id)"
              class="flex-1 px-3 py-1 rounded bg-error hover:bg-error/80 text-white text-sm transition-colors"
            >
              删除
            </button>
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

/* Custom checkbox */
input[type="checkbox"] {
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #667eea;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  position: relative;
}

input[type="checkbox"]:checked {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
}
</style>