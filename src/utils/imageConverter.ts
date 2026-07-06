/**
 * 图片格式转换工具函数
 */

interface ConversionOptions {
  format: 'png' | 'jpg' | 'webp' | 'gif'
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
    bmp: 'bmp'
  }
  return extensions[format.toLowerCase()] || 'png'
}

/**
 * 转换单个图片
 */
export async function convertImage(
  file: File,
  options: ConversionOptions
): Promise<ConvertedFile> {
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
 * 批量转换图片
 */
export async function convertImages(
  files: File[],
  options: ConversionOptions,
  onProgress?: (progress: number) => void
): Promise<ConvertedFile[]> {
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