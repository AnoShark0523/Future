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
  // 新增样式选项
  style?: 'square' | 'rounded' | 'dots'
  gradient?: {
    type: 'linear' | 'radial'
    startColor: string
    endColor: string
  }
}

// vCard名片接口
export interface VCardData {
  name: string
  phone?: string
  email?: string
  organization?: string
  title?: string
  address?: string
  website?: string
  note?: string
}

// 历史记录接口
export interface QRHistoryItem {
  id: string
  content: string
  type: string
  imageData: string
  createdAt: number
  options?: QRCodeOptions
}

// 历史记录管理
const HISTORY_KEY = 'qrcode_history'
const MAX_HISTORY = 20

// 获取历史记录
export function getQRHistory(): QRHistoryItem[] {
  try {
    const history = localStorage.getItem(HISTORY_KEY)
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

// 保存历史记录
export function saveQRHistory(item: QRHistoryItem): void {
  const history = getQRHistory()
  history.unshift(item)
  // 限制历史记录数量
  if (history.length > MAX_HISTORY) {
    history.pop()
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

// 删除历史记录
export function deleteQRHistory(id: string): void {
  const history = getQRHistory().filter(item => item.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

// 清空历史记录
export function clearQRHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
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
    
    // 如果有样式定制，应用样式
    if (options.style && options.style !== 'square') {
      return applyQRStyle(qrCodeDataURL, options)
    }
    
    return qrCodeDataURL
  } catch (error: any) {
    throw new Error(`二维码生成失败: ${error.message}`)
  }
}

// 应用样式定制（圆角、点状）
async function applyQRStyle(dataURL: string, options: QRCodeOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'))
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      
      // 先绘制原图
      ctx.drawImage(img, 0, 0)
      
      // 获取图像数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 填充背景色
      ctx.fillStyle = options.color?.light || '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 根据样式绘制
      if (options.style === 'rounded') {
        // 圆角样式
        drawRoundedQR(ctx, data, canvas.width, canvas.height, options)
      } else if (options.style === 'dots') {
        // 点状样式
        drawDotsQR(ctx, data, canvas.width, canvas.height, options)
      } else {
        // 默认方形
        ctx.putImageData(imageData, 0, 0)
      }
      
      resolve(canvas.toDataURL())
    }
    img.onerror = () => reject(new Error('样式应用失败'))
    img.src = dataURL
  })
}

// 圆角样式绘制
function drawRoundedQR(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: QRCodeOptions
) {
  const moduleSize = 8 // 模块大小
  const radius = moduleSize / 2 * 0.8 // 圆角半径
  
  ctx.fillStyle = options.color?.dark || '#667eea'
  
  for (let y = 0; y < height; y += moduleSize) {
    for (let x = 0; x < width; x += moduleSize) {
      const i = (y * width + x) * 4
      // 如果是黑色模块
      if (data[i] < 128) {
        // 绘制圆角矩形
        ctx.beginPath()
        ctx.roundRect(x, y, moduleSize, moduleSize, radius)
        ctx.fill()
      }
    }
  }
}

// 点状样式绘制
function drawDotsQR(
  ctx: CanvasRenderingContext2D,
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: QRCodeOptions
) {
  const moduleSize = 8
  const radius = moduleSize / 2 * 0.7
  
  ctx.fillStyle = options.color?.dark || '#667eea'
  
  for (let y = 0; y < height; y += moduleSize) {
    for (let x = 0; x < width; x += moduleSize) {
      const i = (y * width + x) * 4
      // 如果是黑色模块
      if (data[i] < 128) {
        // 绘制圆形
        ctx.beginPath()
        ctx.arc(x + moduleSize/2, y + moduleSize/2, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
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
 * 在二维码中心嵌入Logo
 */
export async function embedLogoToQRCode(
  qrCodeDataURL: string,
  logoFile: File,
  logoSize: number = 60
): Promise<string> {
  return new Promise((resolve, reject) => {
    const qrImg = new Image()
    const logoImg = new Image()
    
    qrImg.onload = () => {
      const reader = new FileReader()
      reader.onload = (e) => {
        logoImg.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Logo加载失败'))
      reader.readAsDataURL(logoFile)
    }
    
    qrImg.onerror = () => reject(new Error('二维码加载失败'))
    qrImg.src = qrCodeDataURL
    
    logoImg.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'))
        return
      }
      
      canvas.width = qrImg.width
      canvas.height = qrImg.height
      
      // 绘制二维码
      ctx.drawImage(qrImg, 0, 0)
      
      // 计算Logo位置（居中）
      const x = (canvas.width - logoSize) / 2
      const y = (canvas.height - logoSize) / 2
      
      // 绘制白色背景圆角矩形
      const padding = 4
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.roundRect(
        x - padding,
        y - padding,
        logoSize + padding * 2,
        logoSize + padding * 2,
        8
      )
      ctx.fill()
      
      // 绘制Logo
      ctx.drawImage(logoImg, x, y, logoSize, logoSize)
      
      resolve(canvas.toDataURL())
    }
    
    logoImg.onerror = () => reject(new Error('Logo加载失败'))
  })
}

/**
 * 生成vCard名片格式
 */
export function generateVCard(data: VCardData): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${data.name}`,
    data.phone ? `TEL:${data.phone}` : '',
    data.email ? `EMAIL:${data.email}` : '',
    data.organization ? `ORG:${data.organization}` : '',
    data.title ? `TITLE:${data.title}` : '',
    data.address ? `ADR:;;${data.address};;;;` : '',
    data.website ? `URL:${data.website}` : '',
    data.note ? `NOTE:${data.note}` : '',
    'END:VCARD'
  ]
  
  return lines.filter(line => line).join('\n')
}

/**
 * 生成电话格式二维码内容
 */
export function generatePhoneContent(phone: string): string {
  return `tel:${phone}`
}

/**
 * 生成短信格式二维码内容
 */
export function generateSMSContent(phone: string, message: string = ''): string {
  return message ? `sms:${phone}?body=${encodeURIComponent(message)}` : `sms:${phone}`
}

/**
 * 生成邮件格式二维码内容
 */
export function generateEmailContent(email: string, subject: string = '', body: string = ''): string {
  const params = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  
  const queryString = params.length > 0 ? `?${params.join('&')}` : ''
  return `mailto:${email}${queryString}`
}

/**
 * 批量生成二维码
 */
export async function generateBatchQRCodes(
  items: Array<{ content: string; filename: string }>,
  options: QRCodeOptions = {}
): Promise<Array<{ filename: string; dataURL: string }>> {
  const results = []
  
  for (const item of items) {
    try {
      const dataURL = await generateQRCode(item.content, options)
      results.push({
        filename: item.filename,
        dataURL
      })
    } catch (error) {
      console.error(`生成 ${item.filename} 失败:`, error)
    }
  }
  
  return results
}

/**
 * 批量下载二维码（打包为zip）
 */
export async function downloadBatchQRCodes(
  items: Array<{ content: string; filename: string }>,
  options: QRCodeOptions = {}
): Promise<void> {
  // 动态导入JSZip（如果项目中有）
  try {
    const JSZip = await import('jszip').then(m => m.default)
    const zip = new JSZip()
    
    const results = await generateBatchQRCodes(items, options)
    
    results.forEach(item => {
      // 去掉data:image/png;base64,前缀
      const base64 = item.dataURL.split(',')[1]
      zip.file(`${item.filename}.png`, base64, { base64: true })
    })
    
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `qrcodes-${Date.now()}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch {
    // 如果JSZip不可用，逐个下载
    const results = await generateBatchQRCodes(items, options)
    results.forEach((item, index) => {
      setTimeout(() => {
        downloadQRCode(item.dataURL, `${item.filename}.png`)
      }, index * 200) // 避免浏览器阻止多次下载
    })
  }
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