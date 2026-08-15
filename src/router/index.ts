import { createRouter, createWebHistory } from 'vue-router'

// ============ 首页必须同步加载 ============
import Home from '@/views/Home.vue'

// ============ 4个核心工具：同步加载（首页快速进入） ============
import ResumeGenerator from '@/views/ResumeGenerator.vue'
import CodePractice from '@/views/CodePractice.vue'
import DocumentExtractor from '@/views/DocumentExtractor.vue'
import ImageConverter from '@/views/ImageConverter.vue'

// ============ 其他工具：异步加载（首页后自动prefetch） ============
const CodeFormatter = () => import('@/views/CodeFormatter.vue')
const JsonTools = () => import('@/views/JsonTools.vue')
const TextDiff = () => import('@/views/TextDiff.vue')
const TimestampConverter = () => import('@/views/TimestampConverter.vue')
const QRCodeTools = () => import('@/views/QRCodeTools.vue')
const HttpStatusCode = () => import('@/views/HttpStatusCode.vue')
const PasswordGenerator = () => import('@/views/PasswordGenerator.vue')
const ColorConverter = () => import('@/views/ColorConverter.vue')
const EncoderDecoder = () => import('@/views/EncoderDecoder.vue')
const RegexTester = () => import('@/views/RegexTester.vue')
const UUIDGenerator = () => import('@/views/UUIDGenerator.vue')
const CronGenerator = () => import('@/views/CronGenerator.vue')
const ReactionTest = () => import('@/views/ReactionTest.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home
    },
    // ===== 前 8 个：同步加载 =====
    {
      path: '/resume-generator',
      name: 'resume-generator',
      component: ResumeGenerator
    },
    {
      path: '/code-practice',
      name: 'code-practice',
      component: CodePractice
    },
    {
      path: '/image-converter',
      name: 'image-converter',
      component: ImageConverter
    },
    {
      path: '/regex-tester',
      name: 'regex-tester',
      component: RegexTester
    },
    {
      path: '/uuid-generator',
      name: 'uuid-generator',
      component: UUIDGenerator
    },
    {
      path: '/encoder-decoder',
      name: 'encoder-decoder',
      component: EncoderDecoder
    },
    {
      path: '/cron-generator',
      name: 'cron-generator',
      component: CronGenerator
    },
    {
      path: '/document-extractor',
      name: 'document-extractor',
      component: DocumentExtractor
    },
    // ===== 后 8 个：异步加载 + 自动 prefetch =====
    {
      path: '/code-formatter',
      name: 'code-formatter',
      component: CodeFormatter
    },
    {
      path: '/json-tools',
      name: 'json-tools',
      component: JsonTools
    },
    {
      path: '/text-diff',
      name: 'text-diff',
      component: TextDiff
    },
    {
      path: '/timestamp-converter',
      name: 'timestamp-converter',
      component: TimestampConverter
    },
    {
      path: '/qrcode-tools',
      name: 'qrcode-tools',
      component: QRCodeTools
    },
    {
      path: '/http-status-code',
      name: 'http-status-code',
      component: HttpStatusCode
    },
    {
      path: '/password-generator',
      name: 'password-generator',
      component: PasswordGenerator
    },
    {
      path: '/color-converter',
      name: 'color-converter',
      component: ColorConverter
    },
    {
      path: '/reaction-test',
      name: 'reaction-test',
      component: ReactionTest
    }
  ]
})

export default router