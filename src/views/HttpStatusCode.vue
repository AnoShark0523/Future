<script setup lang="ts">
import { ref, computed } from 'vue'
import { useClipboard } from '@/composables/useClipboard'
import { useNotification } from '@/composables/useNotification'
import { Search, Copy, CheckCircle, X, Globe, Server, AlertCircle, Check, ArrowRightLeft } from 'lucide-vue-next'

// HTTP状态码数据
const httpStatusCodes = [
  // 1xx - 信息响应
  { code: 100, category: '1xx', name: 'Continue', description: '继续。客户端应继续其请求', detail: '服务器已收到请求的初始部分，客户端应继续发送剩余部分。通常用于大文件上传时分块传输。' },
  { code: 101, category: '1xx', name: 'Switching Protocols', description: '切换协议。服务器根据客户端的请求切换协议', detail: '服务器已理解客户端请求，并通过Upgrade消息头通知客户端切换到不同的协议。常用于WebSocket连接升级。' },
  { code: 102, category: '1xx', name: 'Processing', description: '处理中。服务器已收到并正在处理请求', detail: '服务器已收到并正在处理请求，但无响应可用。这是一个WebDAV扩展状态码。' },
  { code: 103, category: '1xx', name: 'Early Hints', description: '早期提示。用于预加载资源', detail: '用于在服务器响应之前向客户端发送一些响应头，允许客户端预加载资源。' },

  // 2xx - 成功
  { code: 200, category: '2xx', name: 'OK', description: '请求成功。请求已成功，服务器返回请求的数据', detail: '标准的成功响应。请求的网页已找到，并可以返回给客户端。这是最常见的HTTP状态码。' },
  { code: 201, category: '2xx', name: 'Created', description: '已创建。成功请求并创建了新的资源', detail: '请求成功并且服务器创建了新的资源。通常用于POST请求，返回新资源的URI。' },
  { code: 202, category: '2xx', name: 'Accepted', description: '已接受。已接受请求，但尚未处理', detail: '请求已接受处理，但处理尚未完成。请求可能最终不会被执行，因为处理过程中可能发生错误。' },
  { code: 203, category: '2xx', name: 'Non-Authoritative Information', description: '非授权信息。请求成功，但返回的信息来自第三方', detail: '服务器已成功处理请求，但返回的信息来自第三方或经过转换，而非原始服务器的响应。' },
  { code: 204, category: '2xx', name: 'No Content', description: '无内容。服务器成功处理，但未返回内容', detail: '服务器成功处理请求，但不需要返回任何实体内容。通常用于DELETE请求成功后的响应。' },
  { code: 205, category: '2xx', name: 'Reset Content', description: '重置内容。服务器成功处理，要求客户端重置表单', detail: '服务器成功处理请求，要求客户端重置文档视图。常用于表单提交后清空表单。' },
  { code: 206, category: '2xx', name: 'Partial Content', description: '部分内容。服务器成功处理了部分GET请求', detail: '服务器成功处理了部分GET请求。用于大文件分块下载，配合Range请求头使用。' },
  { code: 207, category: '2xx', name: 'Multi-Status', description: '多状态。多个响应状态', detail: 'WebDAV扩展状态码。响应体包含多个独立请求的响应状态。' },
  { code: 208, category: '2xx', name: 'Already Reported', description: '已报告。资源已存在于之前的响应中', detail: 'WebDAV扩展状态码。DAV绑定成员已在之前的多状态响应中枚举。' },
  { code: 226, category: '2xx', name: 'IM Used', description: '已使用。服务器已执行实例操作', detail: '服务器已完成对资源的GET请求，响应是当前实例对实例操作的结果。' },

  // 3xx - 重定向
  { code: 300, category: '3xx', name: 'Multiple Choices', description: '多种选择。请求的资源有多个可选响应', detail: '请求的资源有多个可供选择的响应，每个都有特定的URI。用户或浏览器可以选择其中一个。' },
  { code: 301, category: '3xx', name: 'Moved Permanently', description: '永久移动。请求的资源已被永久移动到新URI', detail: '请求的资源已被永久移动到新位置。客户端应自动重定向到新URI，搜索引擎应更新链接。' },
  { code: 302, category: '3xx', name: 'Found', description: '临时移动。资源现在临时从不同URI响应', detail: '请求的资源现在临时从不同的URI响应。客户端应继续使用原有URI进行后续请求。' },
  { code: 303, category: '3xx', name: 'See Other', description: '查看其他。应使用GET方法查看另一个URI', detail: '服务器已发送响应，客户端应使用GET方法在另一个URI上查看响应。主要用于POST请求后重定向。' },
  { code: 304, category: '3xx', name: 'Not Modified', description: '未修改。资源未修改，可使用缓存版本', detail: '客户端已执行条件GET请求，访问许可被允许，但文档内容未被修改。用于缓存优化。' },
  { code: 305, category: '3xx', name: 'Use Proxy', description: '使用代理。必须通过代理访问资源', detail: '请求的资源必须通过代理访问。响应中包含代理的URI。此状态码已被废弃。' },
  { code: 307, category: '3xx', name: 'Temporary Redirect', description: '临时重定向。临时从另一个URI响应', detail: '请求的资源临时从另一个URI响应，请求方法不能改变。与302类似，但确保请求方法不变。' },
  { code: 308, category: '3xx', name: 'Permanent Redirect', description: '永久重定向。资源已永久移动到新URI', detail: '请求的资源已永久移动到另一个URI，请求方法不能改变。与301类似，但确保请求方法不变。' },

  // 4xx - 客户端错误
  { code: 400, category: '4xx', name: 'Bad Request', description: '错误请求。服务器无法理解请求的格式', detail: '服务器无法理解请求的语法。客户端不应在未经修改的情况下重复发送相同请求。' },
  { code: 401, category: '4xx', name: 'Unauthorized', description: '未授权。请求需要身份验证', detail: '请求需要用户身份验证。响应必须包含一个适用于被请求资源的WWW-Authenticate头。' },
  { code: 402, category: '4xx', name: 'Payment Required', description: '需要付款。预留状态码', detail: '预留状态码，供将来使用。原意为需要付费后才能访问资源，但在实际中很少使用。' },
  { code: 403, category: '4xx', name: 'Forbidden', description: '禁止访问。服务器拒绝请求', detail: '服务器理解请求，但拒绝执行。与401不同，身份验证不会改变结果。' },
  { code: 404, category: '4xx', name: 'Not Found', description: '未找到。服务器找不到请求的资源', detail: '请求的资源不存在。这是最常见的客户端错误状态码。可能是因为URL错误或资源已被删除。' },
  { code: 405, category: '4xx', name: 'Method Not Allowed', description: '方法禁用。请求方法不被允许', detail: '请求方法不被服务器支持。响应必须包含一个Allow头，列出允许的方法。' },
  { code: 406, category: '4xx', name: 'Not Acceptable', description: '不接受。请求的资源无法响应', detail: '服务器无法根据客户端请求的Accept头返回相应的内容类型。' },
  { code: 407, category: '4xx', name: 'Proxy Authentication Required', description: '需要代理身份验证', detail: '客户端必须先使用代理进行身份验证。响应必须包含Proxy-Authenticate头。' },
  { code: 408, category: '4xx', name: 'Request Timeout', description: '请求超时。服务器等待请求超时', detail: '服务器等待客户端发送请求超时。客户端可以重新发送相同请求。' },
  { code: 409, category: '4xx', name: 'Conflict', description: '冲突。请求与服务器当前状态冲突', detail: '请求与服务器当前状态冲突。常用于PUT请求时资源版本冲突。' },
  { code: 410, category: '4xx', name: 'Gone', description: '已删除。请求的资源已永久删除', detail: '请求的资源已永久删除，不会再有。与404不同，这是明确的删除声明，搜索引擎应删除链接。' },
  { code: 411, category: '4xx', name: 'Length Required', description: '需要内容长度', detail: '服务器拒绝接受没有Content-Length头的请求。服务器要求客户端在请求中指定内容长度。' },
  { code: 412, category: '4xx', name: 'Precondition Failed', description: '预处理失败。请求条件不满足', detail: '服务器未能满足请求者在请求中设置的某些前提条件。常用于条件请求。' },
  { code: 413, category: '4xx', name: 'Payload Too Large', description: '请求实体过大。请求实体太大', detail: '请求实体太大，服务器拒绝处理。服务器可能关闭连接以防止客户端继续发送。' },
  { code: 414, category: '4xx', name: 'URI Too Long', description: 'URI过长。请求的URI太长', detail: '请求的URI太长，服务器拒绝处理。常因GET请求参数过多或数据编码错误导致。' },
  { code: 415, category: '4xx', name: 'Unsupported Media Type', description: '不支持的媒体类型', detail: '请求的媒体类型不被服务器支持。服务器拒绝服务，因为请求实体的格式不受支持。' },
  { code: 416, category: '4xx', name: 'Range Not Satisfiable', description: '范围不满足', detail: '客户端请求的文件范围无法满足。可能是文件已被修改或范围无效。' },
  { code: 417, category: '4xx', name: 'Expectation Failed', description: '期望失败', detail: '服务器无法满足请求头Expect中指定的期望值。' },
  { code: 418, category: '4xx', name: 'I\'m a teapot', description: '我是一个茶壶。愚人节玩笑状态码', detail: '这是一个愚人节笑话状态码，超文本咖啡壶控制协议的一部分。实际中用于拒绝请求。' },
  { code: 421, category: '4xx', name: 'Misdirected Request', description: '错误的请求方向', detail: '请求被定向到无法产生响应的服务器。常用于HTTPS连接时SNI不匹配。' },
  { code: 422, category: '4xx', name: 'Unprocessable Entity', description: '无法处理的实体', detail: 'WebDAV扩展状态码。请求格式正确，但因语义错误无法处理。' },
  { code: 423, category: '4xx', name: 'Locked', description: '锁定', detail: 'WebDAV扩展状态码。请求的资源被锁定。' },
  { code: 424, category: '4xx', name: 'Failed Dependency', description: '依赖失败', detail: 'WebDAV扩展状态码。由于之前的请求失败，导致当前请求失败。' },
  { code: 425, category: '4xx', name: 'Too Early', description: '太早', detail: '服务器不愿意冒险处理可能被重放的请求。' },
  { code: 426, category: '4xx', name: 'Upgrade Required', description: '需要升级', detail: '客户端应切换到不同的协议，如TLS/1.0。' },
  { code: 428, category: '4xx', name: 'Precondition Required', description: '需要前提条件', detail: '服务器要求请求必须是条件的。用于防止"丢失更新"问题。' },
  { code: 429, category: '4xx', name: 'Too Many Requests', description: '请求过多', detail: '客户端发送的请求太多，已被限流。响应应包含Retry-After头。' },
  { code: 431, category: '4xx', name: 'Request Header Fields Too Large', description: '请求头字段太大', detail: '请求头字段太大，服务器拒绝处理。' },
  { code: 451, category: '4xx', name: 'Unavailable For Legal Reasons', description: '因法律原因不可用', detail: '因法律原因，服务器拒绝提供资源。可能是因为审查或版权问题。' },

  // 5xx - 服务器错误
  { code: 500, category: '5xx', name: 'Internal Server Error', description: '服务器内部错误。服务器遇到意外情况', detail: '服务器遇到意外情况，无法完成请求。这是最常见的服务器错误状态码。' },
  { code: 501, category: '5xx', name: 'Not Implemented', description: '未实现。服务器不支持请求的方法', detail: '服务器不支持请求的方法。例如，服务器不支持PUT方法。' },
  { code: 502, category: '5xx', name: 'Bad Gateway', description: '错误网关。服务器作为网关或代理时出错', detail: '服务器作为网关或代理，从上游服务器收到无效响应。常出现在反向代理配置错误时。' },
  { code: 503, category: '5xx', name: 'Service Unavailable', description: '服务不可用。服务器暂时无法处理请求', detail: '服务器暂时过载或正在维护，无法处理请求。通常是临时状态。响应应包含Retry-After头。' },
  { code: 504, category: '5xx', name: 'Gateway Timeout', description: '网关超时。服务器作为网关或代理时超时', detail: '服务器作为网关或代理，未能及时从上游服务器获取响应。' },
  { code: 505, category: '5xx', name: 'HTTP Version Not Supported', description: 'HTTP版本不支持', detail: '服务器不支持请求中使用的HTTP协议版本。' },
  { code: 506, category: '5xx', name: 'Variant Also Negotiates', description: '变体也协商', detail: '服务器内部配置错误，内容协商变体被配置为进行内容协商。' },
  { code: 507, category: '5xx', name: 'Insufficient Storage', description: '存储空间不足', detail: 'WebDAV扩展状态码。服务器无法存储完成请求所需的资源。' },
  { code: 508, category: '5xx', name: 'Loop Detected', description: '检测到循环', detail: 'WebDAV扩展状态码。服务器在处理请求时检测到无限循环。' },
  { code: 510, category: '5xx', name: 'Not Extended', description: '未扩展', detail: '服务器需要进一步扩展请求才能完成请求。' },
  { code: 511, category: '5xx', name: 'Network Authentication Required', description: '需要网络认证', detail: '客户端需要进行网络认证才能访问。常用于需要登录的WiFi网络。' }
]

// 分类定义
const categories = [
  { id: 'all', name: '全部', icon: Globe, color: 'from-primary to-secondary' },
  { id: '1xx', name: '信息响应', icon: Server, color: 'from-blue-400 to-blue-600' },
  { id: '2xx', name: '成功', icon: Check, color: 'from-success to-emerald-600' },
  { id: '3xx', name: '重定向', icon: ArrowRightLeft, color: 'from-yellow-400 to-orange-500' },
  { id: '4xx', name: '客户端错误', icon: AlertCircle, color: 'from-orange-400 to-red-500' },
  { id: '5xx', name: '服务器错误', icon: Server, color: 'from-red-400 to-red-600' }
]

const selectedCategory = ref('all')
const searchQuery = ref('')
const selectedCode = ref<typeof httpStatusCodes[0] | null>(null)

const { copied, copyToClipboard } = useClipboard()
const { notification, success } = useNotification()

// 过滤状态码
const filteredCodes = computed(() => {
  let codes = httpStatusCodes

  // 分类过滤
  if (selectedCategory.value !== 'all') {
    codes = codes.filter(code => code.category === selectedCategory.value)
  }

  // 搜索过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    codes = codes.filter(code =>
      code.code.toString().includes(query) ||
      code.name.toLowerCase().includes(query) ||
      code.description.toLowerCase().includes(query)
    )
  }

  return codes
})

// 获取状态码颜色类
const getCodeColorClass = (category: string) => {
  const colorMap: Record<string, string> = {
    '1xx': 'border-blue-500/50 bg-blue-500/10 text-blue-400',
    '2xx': 'border-success/50 bg-success/10 text-success',
    '3xx': 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400',
    '4xx': 'border-orange-500/50 bg-orange-500/10 text-orange-400',
    '5xx': 'border-red-500/50 bg-red-500/10 text-red-400'
  }
  return colorMap[category] || 'border-primary/50 bg-primary/10 text-primary'
}

// 获取分类标签颜色
const getCategoryBadgeColor = (category: string) => {
  const colorMap: Record<string, string> = {
    '1xx': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    '2xx': 'bg-success/20 text-success border-success/30',
    '3xx': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    '4xx': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    '5xx': 'bg-red-500/20 text-red-400 border-red-500/30'
  }
  return colorMap[category] || 'bg-primary/20 text-primary border-primary/30'
}

// 显示详情
const showDetail = (code: typeof httpStatusCodes[0]) => {
  selectedCode.value = code
}

// 关闭详情
const closeDetail = () => {
  selectedCode.value = null
}

// 复制状态码
const handleCopy = async (code: number) => {
  if (await copyToClipboard(code.toString())) {
    success(`已复制状态码 ${code}`)
  }
}

// 复制完整信息
const handleCopyFull = async () => {
  if (!selectedCode.value) return
  const text = `${selectedCode.value.code} ${selectedCode.value.name}\n${selectedCode.value.description}\n\n${selectedCode.value.detail}`
  if (await copyToClipboard(text)) {
    success('已复制完整信息')
  }
}
</script>

<template>
  <div class="container mx-auto px-6 py-8 max-w-6xl">
    <!-- Title -->
    <div class="text-center mb-8 fade-in">
      <h1 class="text-3xl font-bold gradient-text mb-2">HTTP状态码查询</h1>
      <p class="text-text-secondary">快速查询和理解HTTP状态码，包含详细说明和使用场景</p>
    </div>

    <!-- Search & Filter Section -->
    <div class="glass rounded-xl p-6 mb-6">
      <!-- Search Input -->
      <div class="relative mb-4">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索状态码、名称或描述..."
          class="w-full pl-12 pr-4 py-3 rounded-lg bg-bg-secondary text-white placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <!-- Category Tabs -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectedCategory = cat.id"
          :class="`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
            selectedCategory === cat.id
              ? `bg-gradient-to-r ${cat.color} text-white shadow-lg`
              : 'bg-bg-secondary hover:bg-bg-tertiary text-text-secondary'
          }`"
        >
          <component :is="cat.icon" class="w-4 h-4" />
          <span class="font-medium text-sm">{{ cat.name }}</span>
        </button>
      </div>
    </div>

    <!-- Results Count -->
    <div class="mb-4 text-text-secondary text-sm">
      找到 <span class="text-primary font-semibold">{{ filteredCodes.length }}</span> 个状态码
    </div>

    <!-- Status Codes Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-6">
      <div
        v-for="code in filteredCodes"
        :key="code.code"
        @click="showDetail(code)"
        :class="`glass rounded-lg p-4 cursor-pointer transition-all hover:scale-105 hover:-translate-y-1 group border-2 ${getCodeColorClass(code.category)}`"
      >
        <div class="text-2xl font-bold mb-1">{{ code.code }}</div>
        <div class="text-xs text-text-secondary truncate">{{ code.name }}</div>
        <button
          @click.stop="handleCopy(code.code)"
          :class="`absolute top-2 right-2 p-1.5 rounded transition-all ${
            copied
              ? 'bg-success text-white'
              : 'bg-bg-secondary/80 text-text-secondary opacity-0 group-hover:opacity-100'
          }`"
        >
          <CheckCircle v-if="copied" class="w-4 h-4" />
          <Copy v-else class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- No Results -->
    <div
      v-if="filteredCodes.length === 0"
      class="text-center py-12 text-text-tertiary"
    >
      <Search class="w-12 h-12 mx-auto mb-4 opacity-30" />
      <p>未找到匹配的状态码</p>
    </div>

    <!-- Detail Modal -->
    <div
      v-if="selectedCode"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      @click="closeDetail"
    >
      <div
        class="glass rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-start justify-between mb-4">
          <div>
            <div :class="`text-5xl font-bold mb-2 ${getCodeColorClass(selectedCode.category).split(' ').slice(2).join(' ')}`">
              {{ selectedCode.code }}
            </div>
            <h3 class="text-xl font-semibold">{{ selectedCode.name }}</h3>
          </div>
          <button
            @click="closeDetail"
            class="p-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-text-secondary transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Category Badge -->
        <div class="mb-4">
          <span :class="`px-3 py-1 rounded-full text-sm border ${getCategoryBadgeColor(selectedCode.category)}`">
            {{ categories.find(c => c.id === selectedCode.category)?.name || selectedCode.category }}
          </span>
        </div>

        <!-- Description -->
        <div class="mb-4">
          <h4 class="text-sm text-text-tertiary mb-2">简述</h4>
          <p class="text-white">{{ selectedCode.description }}</p>
        </div>

        <!-- Detail -->
        <div class="mb-6">
          <h4 class="text-sm text-text-tertiary mb-2">详细说明</h4>
          <p class="text-text-secondary text-sm leading-relaxed">{{ selectedCode.detail }}</p>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            @click="handleCopy(selectedCode.code)"
            :class="`flex-1 px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
              copied
                ? 'bg-success text-white'
                : 'bg-bg-secondary hover:bg-bg-tertiary text-white'
            }`"
          >
            <CheckCircle v-if="copied" class="w-5 h-5" />
            <Copy v-else class="w-5 h-5" />
            <span>{{ copied ? '已复制' : '复制状态码' }}</span>
          </button>
          <button
            @click="handleCopyFull"
            class="flex-1 gradient-btn flex items-center justify-center gap-2"
          >
            <Copy class="w-5 h-5" />
            <span>复制完整信息</span>
          </button>
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