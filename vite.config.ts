import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  // GitHub Pages 部署需要的基础路径，/Future/ 是仓库名
  base: '/Future/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  server: {
    port: 3001,
    host: true,
    open: false
  },
  optimizeDeps: {
    // 预构建 Prettier 及其插件，避免浏览器中 "Couldn't resolve parser" 错误
    include: [
      'prettier/standalone',
      'prettier/plugins/babel',
      'prettier/plugins/estree',
      'prettier/plugins/typescript',
      'prettier/plugins/html',
      'prettier/plugins/postcss',
      'prettier/plugins/markdown',
      'prettier/plugins/yaml',
      'prettier/plugins/graphql',
      'mammoth',
      'pdfjs-dist/build/pdf.mjs',
      'pdfjs-dist/build/pdf.worker.mjs'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // 使用函数形式实现更精细的代码分割
        manualChunks: (id) => {
          // 排除非node_modules
          if (!id.includes('node_modules')) {
            return undefined
          }
          // prettier系列单独分块（约5MB）
          if (id.includes('prettier') || id.includes('prettier-plugin')) {
            return 'prettier'
          }
          // pdf相关库单独分块
          if (id.includes('pdfjs-dist') || id.includes('pdf.worker')) {
            return 'pdf'
          }
          // 代码高亮和Markdown
          if (id.includes('highlight.js') || id.includes('marked')) {
            return 'highlight'
          }
          // 二维码
          if (id.includes('qrcode')) {
            return 'utils'
          }
          // 日期处理
          if (id.includes('date-fns')) {
            return 'utils'
          }
          // 大型文档处理库
          if (id.includes('mammoth') || id.includes('docx')) {
            return 'document'
          }
          // 核心框架单独分块（只有vue和vue-router）
          if (id.includes('vue/') || id.includes('vue-router')) {
            return 'vendor'
          }
          // 其他第三方库不单独分块，让Rollup自动处理
          return undefined
        }
      }
    }
  }
})