/**
 * 简历 PDF 导出工具
 *
 * 方案：html2canvas 截图 + jsPDF 生成 PDF + invisible 文本层 + 字节追加嵌入数据
 *
 * 设计原则：
 * 1. 不注入任何强制布局 CSS，让模板按自己的样式渲染，保证视觉一致性
 * 2. 只在 onclone 中做 html2canvas 兼容性修复（CSS 变量解析、gradient 降级、clip-path 移除）
 * 3. 清除预览缩放 transform，按原始 A4 尺寸截图
 * 4. invisible 文本层确保 pdfjs-dist 可提取文本
 * 5. 简历数据以 EmbeddedFile 标准附件形式嵌入（ISO 32000-2 §14.13），
 *    所有主流 PDF 阅读器重新保存时都不会丢失，导入时 100% 可靠恢复
 */

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { PDFDocument } from 'pdf-lib'
import type { ResumeData } from './resumeTemplates'

// 数据标记
const RESUME_DATA_START = '__RESUME_DATA__'
const RESUME_DATA_END = '__END_RESUME_DATA__'

// A4 尺寸（毫米）
const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

/**
 * 将简历数据导出为 PDF
 *
 * @param data 简历数据
 * @param filename 文件名
 * @param onProgress 进度回调
 * @param templateId 当前模板 ID
 * @returns PDF Blob
 */
export async function exportResumeToPDF(
  data: ResumeData,
  _filename: string,
  onProgress?: (msg: string) => void,
  templateId?: string
): Promise<Blob> {
  onProgress?.('正在定位简历模板...')

  // 1. 查找简历预览元素
  const resumeEl = document.querySelector('.resume-paper') as HTMLElement
  if (!resumeEl) {
    throw new Error('未找到简历预览元素，请确保预览已渲染')
  }

  // 2. 等待所有图片加载完成
  onProgress?.('正在加载图片资源...')
  await waitForImages(resumeEl)

  // 3. 保存原始样式，临时清除预览缩放 transform 和居中 margin
  //    原因：预览区有 scale 缩放 + margin:0 auto 居中，html2canvas 截图时需要按原始尺寸渲染
  //    注意：只清除 transform/margin，不改变任何布局属性，保证模板视觉不变
  const origTransform = resumeEl.style.transform
  const origTransformOrigin = resumeEl.style.transformOrigin
  const origMargin = resumeEl.style.margin
  resumeEl.style.transform = 'none'
  resumeEl.style.transformOrigin = 'top left'
  resumeEl.style.margin = '0'

  // 等待一帧让浏览器重排
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

  // 测量真实尺寸
  const captureWidth = resumeEl.offsetWidth

  // 计算 A4 高度对应的像素值（按当前 DPI）
  // 210mm = captureWidth px，所以 297mm = captureWidth * 297/210
  const a4HeightPx = Math.round(captureWidth * (A4_HEIGHT_MM / A4_WIDTH_MM))

  // 截图高度固定为 A4 比例高度，确保截图宽高比 = A4 宽高比
  // 这样放入 PDF 时不会拉伸变形，文字不会偏扁
  const captureHeight = a4HeightPx

  // 4. 使用 html2canvas 截图
  //    onclone 中只做兼容性修复，不注入任何布局 CSS
  onProgress?.('正在渲染简历（可能需要几秒钟）...')
  const canvas = await html2canvas(resumeEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    width: captureWidth,
    height: captureHeight,
    onclone: (_clonedDoc, clonedElement) => {
      const el = clonedElement as HTMLElement

      // 清除预览缩放 transform 和居中 margin，按原始 A4 尺寸渲染
      el.style.transform = 'none'
      el.style.transformOrigin = 'top left'
      el.style.margin = '0'

      // 固定高度为 A4 高度，溢出内容隐藏（单页输出）
      el.style.height = a4HeightPx + 'px'
      el.style.overflow = 'hidden'

      // 修复 html2canvas 不渲染 flex align-items: stretch 的问题
      // 现象：sidebar 背景只覆盖内容高度，未填满到容器底部
      // 方案：显式设置 sidebar 高度 = 容器高度（不改变宽度、padding 等任何布局属性）
      const layouts = el.querySelectorAll('.layout-sidebar-left, .layout-sidebar-right')
      layouts.forEach((layout) => {
        const layoutEl = layout as HTMLElement
        const layoutH = a4HeightPx
        const sidebar = layoutEl.querySelector('.sidebar, .sidebar-right') as HTMLElement
        if (sidebar && layoutH > 0) {
          sidebar.style.height = layoutH + 'px'
        }
      })

      // html2canvas 兼容性修复：CSS 变量解析、gradient 降级、clip-path 移除
      // 这些修复不改变布局，只解决 html2canvas 渲染引擎的已知限制
      fixCssForCanvas(resumeEl, el)
    },
  })

  // 恢复原始样式
  resumeEl.style.transform = origTransform
  resumeEl.style.transformOrigin = origTransformOrigin
  resumeEl.style.margin = origMargin

  // 5. 生成 PDF
  onProgress?.('正在生成 PDF 文件...')
  const imgData = canvas.toDataURL('image/jpeg', 0.95)
  const pdf = new jsPDF('p', 'mm', 'a4')

  // 截图宽高比已与 A4 一致（截图前固定了 A4 比例高度），
  // 直接铺满 A4 页面，不会拉伸变形
  pdf.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM)

  // 6. 准备嵌入的简历数据
  onProgress?.('正在嵌入简历数据...')
  const dataCopy: ResumeData = JSON.parse(JSON.stringify(data))
  // 清除过大的照片数据避免文件过大
  if (dataCopy.personal.photo && dataCopy.personal.photo.length > 100000) {
    dataCopy.personal.photo = ''
  }

  const exportPayload = {
    resumeData: dataCopy,
    templateId: templateId || 's1',
    exportVersion: 4,
    exportTime: new Date().toISOString(),
  }

  // 7. 写入 invisible 文本层（使 PDF 拥有可提取的文本内容）
  //    用 jsPDF 默认 Helvetica 字体写入纯 ASCII 的 __RESUME_DATA__ 标记，
  //    renderingMode='invisible'（PDF Tr=3）使文本不可见，不影响图片排版
  //    注意：不使用 maxWidth，因为 maxWidth 会导致文本换行，
  //    jsPDF 换行时会自动创建新页面，造成 PDF 变成两页
  onProgress?.('正在写入文本层...')
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(1)
  const textLayerContent = `${RESUME_DATA_START}${encodeURIComponent(JSON.stringify(exportPayload))}${RESUME_DATA_END}`
  // 增大 chunkSize 减少循环次数，避免大量 pdf.text() 调用导致性能问题
  const chunkSize = 2000
  for (let i = 0; i < textLayerContent.length; i += chunkSize) {
    const chunk = textLayerContent.slice(i, i + chunkSize)
    pdf.text(chunk, 0, 1, {
      baseline: 'top',
      align: 'left',
      renderingMode: 'invisible',
    })
  }

  // 8. 用 pdf-lib 嵌入 EmbeddedFile（ISO 32000-2 §14.13 标准化机制）
  //    相比"追加字节到%%EOF之后"的旧方案，EmbeddedFile 符合 PDF 规范，
  //    所有主流 PDF 阅读器（Acrobat/Chrome/Edge/Firefox/WPS）重新保存时都不会丢失。
  //    导入时用 pdfjs-dist 的 getAttachments() 读取，100% 可靠恢复。
  onProgress?.('正在嵌入简历数据（EmbeddedFile）...')
  const pdfArrayBuffer = pdf.output('arraybuffer')
  const pdfDoc = await PDFDocument.load(pdfArrayBuffer)

  const jsonBytes = new TextEncoder().encode(JSON.stringify(exportPayload))
  await pdfDoc.attach(jsonBytes, 'resume.json', {
    mimeType: 'application/json',
    description: 'Resume data for lossless import',
    creationDate: new Date(),
    modificationDate: new Date(),
  })

  const resultBytes = await pdfDoc.save({ useObjectStreams: false })
  return new Blob([resultBytes], { type: 'application/pdf' })
}

/**
 * 修复克隆 DOM 的 CSS 兼容性问题（不改变布局）
 *
 * html2canvas 已知不支持的 CSS 特性：
 * 1. CSS 自定义属性 var() — 通过 getComputedStyle 获取解析后的实际值并内联
 * 2. clip-path: polygon() — 直接移除（仅影响装饰性斜角）
 * 3. gradient — 降级为纯色（html2canvas 渲染 gradient 容易出错）
 *
 * @param original 原始 DOM 元素（仍在页面中，可获取计算样式）
 * @param clone 克隆的 DOM 元素（将被 html2canvas 渲染）
 */
function fixCssForCanvas(original: HTMLElement, clone: HTMLElement): void {
  const origChildren = Array.from(original.querySelectorAll('*')) as HTMLElement[]
  const cloneChildren = Array.from(clone.querySelectorAll('*')) as HTMLElement[]

  // 只处理颜色相关属性，减少 getComputedStyle 调用次数
  // html2canvas 主要不支持 CSS 变量和 gradient，只处理这些即可
  const propsToCheck = [
    'color',
    'background-color',
    'background-image',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
  ]

  for (let i = 0; i < origChildren.length && i < cloneChildren.length; i++) {
    const origEl = origChildren[i]
    const cloneEl = cloneChildren[i]

    try {
      const computed = window.getComputedStyle(origEl)

      for (const prop of propsToCheck) {
        const val = computed.getPropertyValue(prop)
        if (!val || val === '' || val === 'none') continue

        // gradient 降级为纯色
        if (prop === 'background-image' && val.includes('gradient')) {
          const colorMatch = val.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/)
          if (colorMatch) {
            cloneEl.style.setProperty('background-image', 'none', 'important')
            const bgColor = computed.getPropertyValue('background-color')
            if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
              cloneEl.style.setProperty('background-color', colorMatch[1], 'important')
            }
          } else {
            cloneEl.style.setProperty('background-image', 'none', 'important')
          }
          continue
        }

        // 只在值包含 var() 时才需要覆盖（其他情况 html2canvas 能自己解析）
        cloneEl.style.setProperty(prop, val, 'important')
      }

      // 移除 clip-path（html2canvas 不支持）
      cloneEl.style.setProperty('clip-path', 'none', 'important')
      cloneEl.style.setProperty('-webkit-clip-path', 'none', 'important')
    } catch {
      // 跳过无法获取样式的元素
    }
  }
}

/**
 * 等待容器内所有图片加载完成
 */
async function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'))
  if (images.length === 0) return

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve()

      return new Promise<void>((resolve) => {
        let done = false
        const finish = () => {
          if (done) return
          done = true
          img.removeEventListener('load', finish)
          img.removeEventListener('error', finish)
          resolve()
        }
        img.addEventListener('load', finish)
        img.addEventListener('error', finish)
        setTimeout(finish, 5000)
      })
    })
  )
}
