/**
 * 图片格式转换工具函数
 */
import { jsPDF } from 'jspdf'

interface ConversionOptions {
  format: 'png' | 'jpg' | 'webp' | 'gif' | 'pdf'
  quality?: number // 0-100
  width?: number
  height?: number
}

interface ConvertedFile {
  name: string
  originalFormat: string
  newFormat: string
  originalSize: number
  newSize: number
  url: string
  blob: Blob
}

/**
 * 获取图片的MIME类型
 */
export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp'
  }
  return mimeTypes[format.toLowerCase()] || 'image/png'
}

/**
 * 获取图片的文件扩展名
 */
export function getFileExtension(format: string): string {
  const extensions: Record<string, string> = {
    png: 'png',
    jpg: 'jpg',
    jpeg: 'jpg',
    webp: 'webp',
    gif: 'gif',
    bmp: 'bmp',
    pdf: 'pdf'
  }
  return extensions[format.toLowerCase()] || 'png'
}

/**
 * 读取文件为 DataURL
 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/**
 * 加载图片
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = src
  })
}

/**
 * 将图片转换为PDF（支持多张图片合并到一个PDF）
 * 顺序处理以保证页面顺序，并对透明图片填充白色背景
 */
export async function convertImagesToPDF(
  files: File[],
  onProgress?: (progress: number) => void
): Promise<ConvertedFile> {
  if (files.length === 0) {
    throw new Error('没有需要转换的图片文件')
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: 'a4'
  })

  const totalPages = files.length

  for (let index = 0; index < totalPages; index++) {
    const file = files[index]
    const imgData = await readFileAsDataURL(file)
    const img = await loadImage(imgData)

    // 如果不是第一页，添加新页
    if (index > 0) {
      pdf.addPage()
    }

    // 计算图片在PDF中的尺寸（保持比例）
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgRatio = img.width / img.height
    const pageRatio = pageWidth / pageHeight

    let finalWidth: number, finalHeight: number
    if (imgRatio > pageRatio) {
      // 图片更宽，以宽度为准
      finalWidth = pageWidth
      finalHeight = pageWidth / imgRatio
    } else {
      // 图片更高，以高度为准
      finalHeight = pageHeight
      finalWidth = pageHeight * imgRatio
    }

    // 居中放置
    const x = (pageWidth - finalWidth) / 2
    const y = (pageHeight - finalHeight) / 2

    // 将图片绘制到Canvas并填充白色背景（处理PNG透明通道，避免黑底）
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法创建Canvas上下文')
    }
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    // 转为JPEG格式（透明通道已通过白底处理）
    const flattenedData = canvas.toDataURL('image/jpeg', 0.92)
    pdf.addImage(flattenedData, 'JPEG', x, y, finalWidth, finalHeight)

    // 更新进度
    if (onProgress) {
      onProgress(((index + 1) / totalPages) * 100)
    }
  }

  const pdfBlob = pdf.output('blob')
  const url = URL.createObjectURL(pdfBlob)

  return {
    name: 'converted-images.pdf',
    originalFormat: 'multiple',
    newFormat: 'pdf',
    originalSize: files.reduce((sum, f) => sum + f.size, 0),
    newSize: pdfBlob.size,
    url,
    blob: pdfBlob
  }
}

/**
 * 转换单个图片（非PDF格式）
 */
export async function convertImage(
  file: File,
  options: ConversionOptions
): Promise<ConvertedFile> {
  // 如果是PDF，使用PDF转换函数
  if (options.format === 'pdf') {
    return convertImagesToPDF([file])
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        // 创建Canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'))
          return
        }

        // 设置Canvas尺寸
        const width = options.width || img.width
        const height = options.height || img.height
        canvas.width = width
        canvas.height = height

        // 如果是JPG，需要填充白色背景（因为JPG不支持透明）
        if (options.format === 'jpg' || options.format === 'jpeg') {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, width, height)
        }

        // 绘制图片
        ctx.drawImage(img, 0, 0, width, height)

        // 转换为指定格式
        const mimeType = getMimeType(options.format)
        const quality = options.quality ? options.quality / 100 : 0.92

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('转换失败'))
              return
            }

            // 创建新的文件名
            const originalName = file.name
            const extension = getFileExtension(options.format)
            const newName = originalName.replace(/\.[^/.]+$/, '') + '.' + extension

            // 创建下载URL
            const url = URL.createObjectURL(blob)

            resolve({
              name: newName,
              originalFormat: file.type.split('/')[1] || 'unknown',
              newFormat: options.format,
              originalSize: file.size,
              newSize: blob.size,
              url,
              blob
            })
          },
          mimeType,
          quality
        )
      }

      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * 批量转换图片（支持PDF合并）
 */
export async function convertImages(
  files: File[],
  options: ConversionOptions,
  onProgress?: (progress: number) => void
): Promise<ConvertedFile[]> {
  // 如果是PDF格式，将所有图片合并到一个PDF
  if (options.format === 'pdf') {
    const pdfResult = await convertImagesToPDF(files, onProgress)
    return [pdfResult]
  }

  // 其他格式，逐个转换
  const results: ConvertedFile[] = []

  for (let i = 0; i < files.length; i++) {
    const result = await convertImage(files[i], options)
    results.push(result)

    // 更新进度
    if (onProgress) {
      onProgress(((i + 1) / files.length) * 100)
    }
  }

  return results
}

/**
 * 下载转换后的图片
 */
export function downloadImage(convertedFile: ConvertedFile): void {
  const link = document.createElement('a')
  link.href = convertedFile.url
  link.download = convertedFile.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 清理转换后的图片URL
 */
export function cleanupImageUrls(convertedFiles: ConvertedFile[]): void {
  convertedFiles.forEach(file => {
    URL.revokeObjectURL(file.url)
  })
}