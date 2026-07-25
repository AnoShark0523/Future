<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Search, Menu, ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const searchQuery = ref('')
const isMenuOpen = ref(false)

// 同步 URL query 到输入框
watch(
  () => route.query.search as string | undefined,
  (val) => {
    searchQuery.value = val || ''
  },
  { immediate: true }
)

const handleSearch = () => {
  const q = searchQuery.value.trim()
  if (q) {
    // 保留历史记录，让返回链正确：工具A -> 搜索首页 -> 工具B -> 返回搜索首页 -> 返回工具A
    router.push({ path: '/', query: { search: q } })
  } else {
    router.push({ path: '/', query: {} })
  }
}

const clearSearch = () => {
  searchQuery.value = ''
  // 用 back() 保持返回链正确，而不是新增首页记录
  router.back()
}

const canGoBack = computed(() => route.path !== '/')
const goBack = () => {
  router.back()
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 glass">
    <div class="container mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- Back Button + Logo -->
        <div class="flex items-center gap-3">
          <button
            v-if="canGoBack"
            @click="goBack"
            class="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg glass hover:bg-white/20 transition-colors text-primary font-semibold"
            title="返回上一级"
          >
            <ArrowLeft class="w-4 h-4" />
            返回
          </button>
          <RouterLink to="/" class="flex items-center gap-3 group">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center transform group-hover:scale-110 transition-transform">
              <span class="text-white font-bold text-lg">FH</span>
            </div>
            <h1 class="text-xl font-bold gradient-text hidden sm:block">Future Helios</h1>
          </RouterLink>
        </div>

        <!-- Search Bar -->
        <div class="flex items-center gap-4">
          <div class="relative hidden md:flex items-center gap-2">
            <button
              v-if="route.query.search"
              @click="clearSearch"
              class="p-2 rounded-lg glass hover:bg-white/20 transition-colors"
              title="返回全部工具"
            >
              <ArrowLeft class="w-5 h-5 text-text-secondary" />
            </button>
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="搜索工具..."
                class="w-64 px-4 py-2 pl-10 rounded-lg glass text-white placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
                @keyup.enter="handleSearch"
              />
              <Search class="absolute left-3 top-2.5 w-5 h-5 text-text-tertiary" />
            </div>
          </div>

          <!-- Mobile Menu Button -->
          <button
            class="md:hidden p-2 rounded-lg glass hover:bg-white/20 transition-colors"
            @click="isMenuOpen = !isMenuOpen"
          >
            <Menu class="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>