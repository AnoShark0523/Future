/**
 * 二维码处理工具函数
 */
import QRCode from 'qrcode'
import jsQR from 'jsqr'

interface QRCodeOptions {
  size?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

/**
 * 生成二维码
 */
export async function generateQRCode(
  text: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const qrOptions = {
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
      margin: options.margin || 2,
      width: options.size || 256,
      color: {
        dark: options.color?.dark || '#667eea',
        light: options.color?.light || '#ffffff'
      }
    }

    const qrCodeDataURL = await QRCode.toDataURL(text, qrOptions)
    return qrCodeDataURL
  } catch (error: any) {
    throw new Error(`二维码生成失败: ${error.message}`)
  }
}

/**
 * 解析二维码图片
 */
export async function parseQRCode(imageFile: File): Promise<string> {
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

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

        // 解析二维码
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code) {
          resolve(code.data)
        } else {
          reject(new Error('无法识别二维码'))
        }
      }

      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }

    reader.readAsDataURL(imageFile)
  })
}

/**
 * 生成WiFi配置二维码
 */
export function generateWiFiConfig(ssid: string, password: string, security: 'WEP' | 'WPA' | 'nopass' = 'WPA'): string {
  const securityType = security === 'nopass' ? '' : security
  const hidden = false

  return `WIFI:T:${securityType};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`
}

/**
 * 下载二维码
 */
export function downloadQRCode(dataURL: string, filename: string = 'qrcode.png'): void {
  const link = document.createElement('a')
  link.href = dataURL
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 二维码容错级别说明
 */
export const errorCorrectionLevelDescriptions: Record<string, string> = {
  L: '低 (7%)',
  M: '中 (15%) - 推荐',
  Q: '高 (25%)',
  H: '最高 (30%)'
}