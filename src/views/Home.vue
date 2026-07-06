<script setup lang="ts">
import { ref } from 'vue'
import ToolCard from '@/components/ToolCard.vue'

const tools = ref([
  {
    id: 'document-extractor',
    name: '文档提取器',
    description: '智能提取文档关键信息，自动识别标题、段落、关键词',
    icon: 'FileText',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'image-converter',
    name: '图片格式转换器',
    description: '支持PNG/JPG/WEBP等格式互转，批量处理和质量压缩',
    icon: 'Image',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'json-tools',
    name: 'JSON工具箱',
    description: 'JSON格式化、压缩、校验、转换，实时语法高亮',
    icon: 'Braces',
    color: 'from-green-500 to-teal-500'
  },
  {
    id: 'code-formatter',
    name: '代码格式化器',
    description: '支持10+编程语言格式化，自定义配置选项',
    icon: 'Code',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'encoder-decoder',
    name: '编码转换工具',
    description: 'Base64、URL、Unicode、HTML实体等编码转换',
    icon: 'Key',
    color: 'from-red-500 to-rose-500'
  },
  {
    id: 'text-diff',
    name: '文本对比工具',
    description: '文本差异对比，并排显示，高亮差异部分',
    icon: 'GitCompare',
    color: 'from-indigo-500 to-blue-500'
  },
  {
    id: 'timestamp-converter',
    name: '时间戳转换',
    description: '时间戳转日期、日期转时间戳，多时区支持',
    icon: 'Clock',
    color: 'from-teal-500 to-green-500'
  },
  {
    id: 'qrcode-tools',
    name: '二维码工具',
    description: '二维码生成和解析，自定义样式和Logo嵌入',
    icon: 'QrCode',
    color: 'from-pink-500 to-purple-500'
  }
])
</script>

<template>
  <div class="min-h-screen px-6 py-12">
    <!-- Hero Section -->
    <div class="text-center mb-16 fade-in">
      <h2 class="text-4xl md:text-6xl font-bold gradient-text mb-4">
        Future Helios
      </h2>
      <p class="text-xl text-text-secondary max-w-2xl mx-auto">
        8个核心工具，提升开发效率。所有数据本地处理，安全可靠。
      </p>
    </div>

    <!-- Tools Grid -->
    <div class="container mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ToolCard
          v-for="tool in tools"
          :key="tool.id"
          :id="tool.id"
          :name="tool.name"
          :description="tool.description"
          :icon="tool.icon"
          :color="tool.color"
        />
      </div>
    </div>
  </div>
</template>