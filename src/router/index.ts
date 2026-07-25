import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/Home.vue')
    },
    {
      path: '/document-extractor',
      name: 'document-extractor',
      component: () => import('@/views/DocumentExtractor.vue')
    },
    {
      path: '/image-converter',
      name: 'image-converter',
      component: () => import('@/views/ImageConverter.vue')
    },
    {
      path: '/json-tools',
      name: 'json-tools',
      component: () => import('@/views/JsonTools.vue')
    },
    {
      path: '/code-formatter',
      name: 'code-formatter',
      component: () => import('@/views/CodeFormatter.vue')
    },
    {
      path: '/encoder-decoder',
      name: 'encoder-decoder',
      component: () => import('@/views/EncoderDecoder.vue')
    },
    {
      path: '/text-diff',
      name: 'text-diff',
      component: () => import('@/views/TextDiff.vue')
    },
    {
      path: '/timestamp-converter',
      name: 'timestamp-converter',
      component: () => import('@/views/TimestampConverter.vue')
    },
    {
      path: '/qrcode-tools',
      name: 'qrcode-tools',
      component: () => import('@/views/QRCodeTools.vue')
    },
    {
      path: '/http-status-code',
      name: 'http-status-code',
      component: () => import('@/views/HttpStatusCode.vue')
    },
    {
      path: '/password-generator',
      name: 'password-generator',
      component: () => import('@/views/PasswordGenerator.vue')
    },
    {
      path: '/color-converter',
      name: 'color-converter',
      component: () => import('@/views/ColorConverter.vue')
    },
    {
      path: '/code-practice',
      name: 'code-practice',
      component: () => import('@/views/CodePractice.vue')
    },
    {
      path: '/resume-generator',
      name: 'resume-generator',
      component: () => import('@/views/ResumeGenerator.vue')
    }
  ]
})

export default router