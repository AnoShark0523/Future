<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useNotification } from '@/composables/useNotification'
import { convertImages, downloadImage, cleanupImageUrls } from '@/utils/imageConverter'
import { Image, Upload, Download, Trash2, X } from 'lucide-vue-next'

interface ConvertedFile {
  name: string
  originalFormat: string
  newFormat: string
  originalSize: number
  newSize: number
  url: string
  blob: Blob
}

const files = ref<File[]>([])
const convertedFiles = ref<ConvertedFile[]>([])
const targetFormat = ref<'png' | 'jpg' | 'webp' | 'gif' | 'pdf'>('png')
const quality = ref(85)
const isProcessing = ref(false)
const conversionProgress = ref(0)
const showPreview = ref(false)

const { notification, success, error } = useNotification()

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    const newFiles = Array.from(target.files)
    // 限制最多10个文件
    if (files.value.length + newFiles.length > 10) {
      error('最多上传10个文件')
      return
    }
    files.value.push(...newFiles)
    success(`已添加 ${newFiles.length} 个文件`)
  }
}

const handleDropUpload = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer?.files) {
    const newFiles = Array.from(event.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    )
    if (files.value.length + newFiles.length > 10) {
      error('最多上传10个文件')
      return
    }
    files.value.push(...newFiles)
    success(`已添加 ${newFiles.length} 个文件`)
  }
}

// 处理粘贴事件（支持粘贴图片）
const handlePaste = (e: ClipboardEvent) => {
  const items = e.clipboardData?.items
  if (!items) return
  
  const pastedFiles: File[] = []
  
  // 遍历剪贴板内容
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    
    // 检查是否是图片
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile()
      if (file) {
        pastedFiles.push(file)
      }
    }
  }
  
  if (pastedFiles.length > 0) {
    if (files.value.length + pastedFiles.length > 10) {
      error('最多上传10个文件')
      return
    }
    files.value.push(...pastedFiles)
    success(`已粘贴 ${pastedFiles.length} 张图片`)
  }
}

// 添加粘贴事件监听
onMounted(() => {
  document.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste)
  cleanupImageUrls(convertedFiles.value)
})

const removeFile = (index: number) => {
  files.value.splice(index, 1)
}

const clearFiles = () => {
  files.value = []
  cleanupImageUrls(convertedFiles.value)
  convertedFiles.value = []
  showPreview.value = false
}

const handleConvert = async () => {
  if (files.value.length === 0) {
    error('请先选择图片文件')
    return
  }

  isProcessing.value = true
  conversionProgress.value = 0

  // 清理之前的转换结果
  if (convertedFiles.value.length > 0) {
    cleanupImageUrls(convertedFiles.value)
    convertedFiles.value = []
  }

  try {
    const results = await convertImages(
      files.value,
      {
        format: targetFormat.value,
        quality: quality.value
      },
      (progress) => {
        conversionProgress.value = progress
      }
    )

    convertedFiles.value = results
    showPreview.value = true
    success('转换完成！')
  } catch (e: any) {
    error(e.message || '转换失败')
    console.error(e)
  } finally {
    isProcessing.value = false
  }
}

const downloadSingle = (file: ConvertedFile) => {
  downloadImage(file)
  success(`已下载 ${file.name}`)
}

const downloadAll = () => {
  convertedFiles.value.forEach(file => downloadImage(file))
  success('已下载所有文件')
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-5xl">
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">图片格式转换器</h1>
      <p class="text-text-secondary">支持PNG/JPG/WEBP/GIF/PDF格式转换，批量处理和质量压缩</p>
    </div>

    <div class="grid md:grid-cols-2 gap-6">
      <!-- Upload Section -->
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">上传图片</h2>

        <!-- Upload Area -->
        <div
          @drop="handleDropUpload"
          @dragover.prevent
          class="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center mb-6 hover:border-primary transition-colors cursor-pointer"
        >
          <Upload class="w-12 h-12 mx-auto mb-4 text-primary" />
          <p class="text-text-secondary mb-2">拖拽图片到这里或点击上传</p>
          <p class="text-xs text-text-tertiary mb-4">💡 支持 Ctrl+V 直接粘贴图片</p>
          <input
            type="file"
            accept="image/*"
            multiple
            @change="handleFileUpload"
            class="hidden"
            id="file-upload"
          />
          <label
            for="file-upload"
            class="cursor-pointer gradient-btn inline-block"
          >
            选择图片
          </label>
        </div>

        <!-- Files List -->
        <div v-if="files.length" class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold">已选择文件 ({{ files.length }}):</h3>
            <button
              @click="clearFiles"
              class="text-sm px-3 py-1 rounded-lg bg-error/20 text-error hover:bg-error/30 transition-colors"
            >
              清空全部
            </button>
          </div>
          <ul class="space-y-2">
            <li
              v-for="(file, index) in files"
              :key="index"
              class="flex items-center justify-between p-2 rounded-lg bg-bg-secondary"
            >
              <div class="flex-1">
                <p class="text-white text-sm font-medium">{{ file.name }}</p>
                <p class="text-text-tertiary text-xs">{{ formatSize(file.size) }}</p>
              </div>
              <button
                @click="removeFile(index)"
                class="p-1 rounded hover:bg-error/20 transition-colors"
              >
                <X class="w-4 h-4 text-error" />
              </button>
            </li>
          </ul>
        </div>

        <!-- Format Selection -->
        <div class="mb-6">
          <label class="font-semibold mb-2 block">目标格式:</label>
          <select
            v-model="targetFormat"
            class="w-full px-4 py-2 rounded-lg bg-bg-secondary text-white focus:outline-none"
          >
            <option value="png">PNG - 无损压缩，支持透明</option>
            <option value="jpg">JPG - 有损压缩，适合照片</option>
            <option value="webp">WEBP - 新格式，体积小</option>
            <option value="gif">GIF - 支持动画</option>
            <option value="pdf">PDF - 多图片合并（推荐批量转换）</option>
          </select>
          <p v-if="targetFormat === 'pdf'" class="text-xs text-primary mt-2">
            ✓ PDF格式会将所有图片合并到一个PDF文件中，每张图片占一页
          </p>
        </div>

        <!-- Quality Slider -->
        <div v-if="(targetFormat === 'jpg' || targetFormat === 'webp') && targetFormat !== 'pdf'" class="mb-6">
          <label class="font-semibold mb-2 block">压缩质量: {{ quality }}%</label>
          <input
            v-model="quality"
            type="range"
            min="1"
            max="100"
            class="w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer"
          />
          <p class="text-xs text-text-tertiary mt-1">
            建议值：JPG 85%，WEBP 80%
          </p>
        </div>

        <!-- Convert Button -->
        <button
          @click="handleConvert"
          :disabled="isProcessing || !files.length"
          class="w-full gradient-btn disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Image v-if="!isProcessing" class="w-5 h-5 inline mr-2" />
          <div v-else class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
          <span>{{ isProcessing ? `处理中 ${conversionProgress}%` : '开始转换' }}</span>
        </button>
      </div>

      <!-- Preview Section -->
      <div class="glass rounded-xl p-6">
        <h2 class="text-xl font-semibold mb-4">转换结果</h2>

        <div v-if="showPreview && convertedFiles.length" class="space-y-4">
          <!-- Conversion Summary -->
          <div class="p-3 rounded-lg bg-success/20 border border-success/30">
            <p class="text-success font-semibold">
              ✓ 成功转换 {{ convertedFiles.length }} 个文件
            </p>
          </div>

          <!-- File List -->
          <div class="space-y-3">
            <div
              v-for="file in convertedFiles"
              :key="file.name"
              class="p-3 rounded-lg bg-bg-secondary border border-white/10"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <p class="text-white font-medium">{{ file.name }}</p>
                  <p class="text-xs text-text-tertiary mt-1">
                    {{ file.originalFormat }} → {{ file.newFormat }}
                  </p>
                  <p class="text-xs mt-1">
                    <span class="text-text-secondary">{{ formatSize(file.originalSize) }}</span>
                    <span class="mx-2">→</span>
                    <span :class="file.newSize < file.originalSize ? 'text-success' : 'text-warning'">
                      {{ formatSize(file.newSize) }}
                    </span>
                    <span v-if="file.newSize < file.originalSize" class="text-success ml-1">
                      (减小 {{ ((1 - file.newSize / file.originalSize) * 100).toFixed(1) }}%)
                    </span>
                    <span v-else class="text-warning ml-1">
                      (增加 {{ ((file.newSize / file.originalSize - 1) * 100).toFixed(1) }}%)
                    </span>
                  </p>
                </div>

                <button
                  @click="downloadSingle(file)"
                  class="p-2 rounded-lg bg-info hover:bg-info/80 text-white transition-colors"
                  title="下载此文件"
                >
                  <Download class="w-4 h-4" />
                </button>
              </div>

              <!-- Preview Image -->
              <div v-if="file.newFormat !== 'pdf'" class="mt-2">
                <img
                  :src="file.url"
                  :alt="file.name"
                  class="w-full max-w-xs rounded-lg bg-white/5"
                />
              </div>
              <div v-else class="mt-2 p-3 rounded-lg bg-primary/20 border border-primary/30">
                <p class="text-primary text-sm">📄 PDF文件已生成，点击下载按钮查看</p>
              </div>
            </div>
          </div>

          <!-- Download All Button -->
          <button
            @click="downloadAll"
            class="w-full px-4 py-2 rounded-lg bg-success hover:bg-success/80 text-white transition-colors flex items-center justify-center gap-2"
          >
            <Download class="w-5 h-5" />
            <span>{{ convertedFiles[0]?.newFormat === 'pdf' ? '下载PDF文件' : '下载全部' }}</span>
          </button>
        </div>

        <div v-else class="flex items-center justify-center h-64 text-text-tertiary">
          <p>{{ isProcessing ? '正在处理...' : '等待转换...' }}</p>
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
</style>