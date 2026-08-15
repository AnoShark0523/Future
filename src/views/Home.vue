<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, SearchX } from 'lucide-vue-next'

import ToolCard from '@/components/ToolCard.vue'

const route = useRoute()
const router = useRouter()

const tools = ref([
  {
    id: 'resume-generator',
    name: '简历生成器',
    description: '50套精选模板，实时预览，PDF/Markdown/JSON多格式导出',
    icon: 'Briefcase',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'code-practice',
    name: '代码速度练习',
    description: '程序员打字训练，多语言随机代码生成，D~SR六级评分系统',
    icon: 'Keyboard',
    color: 'from-amber-500 to-red-500'
  },
  {
    id: 'image-converter',
    name: '图片格式转换器',
    description: '支持PNG/JPG/WEBP等格式互转，批量处理和质量压缩',
    icon: 'Image',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'regex-tester',
    name: '正则表达式测试器',
    description: '实时测试正则表达式，匹配高亮，生成多语言代码',
    icon: 'Regex',
    color: 'from-orange-500 to-red-500'
  },
  {
    id: 'uuid-generator',
    name: 'UUID/GUID生成器',
    description: '批量生成UUID，支持v1/v4版本，多种格式选项',
    icon: 'Fingerprint',
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'encoder-decoder',
    name: '编码转换工具',
    description: 'Base64、URL、Unicode、HTML实体、进制转换等编码转换',
    icon: 'Key',
    color: 'from-red-500 to-rose-500'
  },
  {
    id: 'cron-generator',
    name: 'Cron表达式生成器',
    description: '可视化配置定时任务，解析Cron含义，显示执行时间',
    icon: 'Timer',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'document-extractor',
    name: '文档提取器',
    description: '智能提取文档关键信息，自动识别标题、段落、关键词',
    icon: 'FileText',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'code-formatter',
    name: '代码格式化器',
    description: '支持10+编程语言格式化，自定义配置选项',
    icon: 'Code',
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'json-tools',
    name: 'JSON工具箱',
    description: 'JSON格式化、压缩、校验、转换，实时语法高亮',
    icon: 'Braces',
    color: 'from-green-500 to-teal-500'
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
  },
  {
    id: 'http-status-code',
    name: 'HTTP状态码查询',
    description: '快速查询HTTP状态码，包含详细说明和使用场景',
    icon: 'Globe',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'password-generator',
    name: '密码生成器',
    description: '生成高强度随机密码，支持自定义规则和批量生成',
    icon: 'Shield',
    color: 'from-violet-500 to-purple-500'
  },
  {
    id: 'color-converter',
    name: '颜色转换工具',
    description: 'HEX/RGB/HSL/CMYK格式互转，实时预览和颜色选择器',
    icon: 'Palette',
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'reaction-test',
    name: '快速反应力测试',
    description: '视觉反应速度测试，毫秒级精度，多轮统计与等级评定',
    icon: 'Zap',
    color: 'from-amber-500 to-red-500'
  }
])

const searchQuery = computed(() => {
  const q = route.query.search
  return typeof q === 'string' ? q.trim() : ''
})

const filteredTools = computed(() => {
  const q = searchQuery.value
  if (!q) return tools.value

  const lower = q.toLowerCase()
  return tools.value.filter((tool) => {
    return (
      tool.name.toLowerCase().includes(lower) ||
      tool.description.toLowerCase().includes(lower) ||
      tool.id.toLowerCase().includes(lower)
    )
  })
})

const hasSearch = computed(() => !!searchQuery.value)

const clearSearch = () => {
  // 用 router.back() 而不是 push，保持返回链正确
  router.back()
}
</script>

<template>
  <div class="min-h-screen px-6 py-12">
    <!-- Hero Section -->
    <div class="text-center mb-16 fade-in">
      <h2 class="text-4xl md:text-6xl font-bold gradient-text mb-4">
        Future Helios
      </h2>
      <p class="text-xl text-text-secondary max-w-2xl mx-auto">
        16个核心工具，提升开发效率。所有数据本地处理，安全可靠。
      </p>
    </div>

    <!-- Search Result Header -->
    <div v-if="hasSearch" class="container mx-auto mb-8 fade-in">
      <div class="glass rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button
            @click="clearSearch"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors text-primary font-semibold"
          >
            <ArrowLeft class="w-4 h-4" />
            返回
          </button>
          <div>
            <p class="text-white font-semibold">
              "{{ searchQuery }}" 的搜索结果
            </p>
            <p class="text-text-secondary text-sm">
              找到 {{ filteredTools.length }} 个相关工具
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tools Grid -->
    <div class="container mx-auto">
      <div v-if="filteredTools.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ToolCard
          v-for="tool in filteredTools"
          :key="tool.id"
          :id="tool.id"
          :name="tool.name"
          :description="tool.description"
          :icon="tool.icon"
          :color="tool.color"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20 fade-in">
        <SearchX class="w-16 h-16 mx-auto text-text-tertiary mb-4" />
        <h3 class="text-2xl font-bold text-white mb-2">未找到相关工具</h3>
        <p class="text-text-secondary mb-6">换个关键词试试，或返回查看全部工具</p>
        <button
          @click="clearSearch"
          class="px-6 py-3 rounded-lg bg-primary hover:bg-primary-light transition-colors text-white font-semibold"
        >
          返回全部工具
        </button>
      </div>
    </div>
  </div>
</template>