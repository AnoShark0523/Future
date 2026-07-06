<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Search, Menu } from 'lucide-vue-next'

const searchQuery = ref('')
const isMenuOpen = ref(false)

const handleSearch = () => {
  // 搜索逻辑待实现
  console.log('Search:', searchQuery.value)
}
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 glass">
    <div class="container mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center transform group-hover:scale-110 transition-transform">
            <span class="text-white font-bold text-lg">FH</span>
          </div>
          <h1 class="text-xl font-bold gradient-text">Future Helios</h1>
        </RouterLink>

        <!-- Search Bar -->
        <div class="flex items-center gap-4">
          <div class="relative hidden md:block">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索工具..."
              class="w-64 px-4 py-2 pl-10 rounded-lg glass text-white placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/50"
              @keyup.enter="handleSearch"
            />
            <Search class="absolute left-3 top-2.5 w-5 h-5 text-text-tertiary" />
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