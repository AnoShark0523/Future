<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { FileText, Image, Braces, Code, Key, GitCompare, Clock, QrCode, Globe, Shield, Palette, Keyboard, Briefcase, Regex, Fingerprint, Timer } from 'lucide-vue-next'

interface Props {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

const props = defineProps<Props>()

const iconComponents = {
  FileText,
  Image,
  Braces,
  Code,
  Key,
  GitCompare,
  Clock,
  QrCode,
  Globe,
  Shield,
  Palette,
  Keyboard,
  Briefcase,
  Regex,
  Fingerprint,
  Timer
}

const getIconComponent = () => {
  return iconComponents[props.icon as keyof typeof iconComponents]
}
</script>

<template>
  <RouterLink
    :to="`/${id}`"
    class="group relative glass rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer block"
  >
    <!-- Icon -->
    <div
      :class="`w-16 h-16 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform`"
    >
      <component :is="getIconComponent()" class="w-8 h-8 text-white" />
    </div>

    <!-- Content -->
    <h3 class="text-xl font-bold mb-2 group-hover:gradient-text transition-colors">
      {{ name }}
    </h3>
    <p class="text-text-secondary text-sm leading-relaxed mb-4">
      {{ description }}
    </p>

    <!-- Button -->
    <div class="flex items-center gap-2 text-primary group-hover:text-primary-light transition-colors">
      <span class="font-semibold">开始使用</span>
      <div class="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center transform group-hover:translate-x-1 transition-transform">
        <span class="text-white text-xs">→</span>
      </div>
    </div>

    <!-- Glow Effect -->
    <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
      <div :class="`absolute inset-0 rounded-xl bg-gradient-to-br ${color} opacity-10`"></div>
    </div>
  </RouterLink>
</template>