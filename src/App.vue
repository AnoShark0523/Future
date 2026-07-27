<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import Header from '@/components/layout/Header.vue'

// 只在首次打开网站时清空 localStorage（刷新页面保留数据）
const SESSION_KEY = 'future_helios_session_started'
if (!sessionStorage.getItem(SESSION_KEY)) {
  // 首次打开，清空所有 localStorage
  localStorage.clear()
  // 设置会话标记，刷新页面不会再次清空
  sessionStorage.setItem(SESSION_KEY, 'true')
}

// 移除预加载动画
onMounted(() => {
  const loadingEl = document.getElementById('app-loading')
  if (loadingEl) {
    // 添加淡出类
    loadingEl.classList.add('fade-out')
    // 等待动画完成后移除元素
    setTimeout(() => {
      loadingEl.remove()
    }, 400)
  }

  // 首页加载完成后，后台预加载其他工具（延迟执行，不阻塞交互）
  setTimeout(() => {
    // 预加载异步工具模块
    import('@/views/CodeFormatter.vue')
    import('@/views/JsonTools.vue')
    import('@/views/TextDiff.vue')
    import('@/views/TimestampConverter.vue')
    import('@/views/QRCodeTools.vue')
    import('@/views/HttpStatusCode.vue')
    import('@/views/PasswordGenerator.vue')
    import('@/views/ColorConverter.vue')
    import('@/views/EncoderDecoder.vue')
    import('@/views/RegexTester.vue')
    import('@/views/UUIDGenerator.vue')
    import('@/views/CronGenerator.vue')
  }, 1000)
})
</script>

<template>
  <div class="min-h-screen bg-bg-primary">
    <!-- Background Gradient Effects -->
    <div class="fixed inset-0 z-0">
      <div class="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div class="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>

    <!-- Header -->
    <Header />

    <!-- Main Content -->
    <main class="relative z-10 pt-16">
      <RouterView />
    </main>
  </div>
</template>

<style>
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>