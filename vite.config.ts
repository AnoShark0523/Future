import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  // GitHub Pages 部署需要的基础路径，./ 表示相对路径，兼容任何子目录
  base: './',
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
      'prettier-plugin-sql',
      'prettier-plugin-java',
      'mammoth',
      'pdfjs-dist/build/pdf.mjs',
      'pdfjs-dist/build/pdf.worker.mjs'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router'],
          'tools': ['marked', 'qrcode', 'highlight.js', 'date-fns'],
          'prettier': [
            'prettier/standalone',
            'prettier/plugins/babel',
            'prettier/plugins/estree',
            'prettier/plugins/typescript',
            'prettier/plugins/html',
            'prettier/plugins/postcss',
            'prettier/plugins/markdown',
            'prettier/plugins/yaml',
            'prettier/plugins/graphql',
            'prettier-plugin-sql',
            'prettier-plugin-java'
          ]
        }
      }
    }
  }
})