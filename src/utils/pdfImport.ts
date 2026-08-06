/**
 * PDF 导入解析工具
 * 使用 pdfjs-dist 提取 PDF 文本内容，并智能匹配到简历数据结构
 * 如果无法提取文本（扫描件/图片PDF），自动使用 Tesseract.js OCR 识别
 */

import type { ResumeData, EducationItem, ExperienceItem, ProjectItem, SkillCategory, CertItem, LanguageItem } from './resumeTemplates'
import { genId } from './resumeTemplates'

/**
 * 动态导入 pdfjs-dist
 */
async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist/build/pdf.mjs')

  try {
    const workerModule = await import('pdfjs-dist/build/pdf.worker.mjs')
    pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default
  } catch {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`
  }

  return pdfjs
}

/**
 * 图像预处理：灰度化 + 对比度增强 + 二值化（Otsu 自动阈值）
 * 显著提升 OCR 识别准确率，减少乱码
 */
function preprocessImage(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext('2d')!
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // Step 1: 灰度化
  const grayValues: number[] = []
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    grayValues.push(gray)
  }

  // Step 2: 对比度增强（factor 1.5，让文字边缘更清晰）
  const contrastFactor = 1.5
  for (let i = 0; i < grayValues.length; i++) {
    grayValues[i] = Math.max(0, Math.min(255, (grayValues[i] - 128) * contrastFactor + 128))
  }

  // Step 3: Otsu 自动阈值二值化
  const threshold = otsuThreshold(grayValues)
  for (let i = 0; i < grayValues.length; i++) {
    const val = grayValues[i] > threshold ? 255 : 0
    const idx = i * 4
    data[idx] = val
    data[idx + 1] = val
    data[idx + 2] = val
    // alpha 不变
  }

  context.putImageData(imageData, 0, 0)
}

/**
 * Otsu 大津法自动计算二值化阈值
 */
function otsuThreshold(grayValues: number[]): number {
  const histogram = new Array(256).fill(0)
  for (const v of grayValues) histogram[v]++

  const total = grayValues.length
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * histogram[i]

  let sumB = 0
  let wB = 0
  let maxVariance = 0
  let threshold = 128

  for (let t = 0; t < 256; t++) {
    wB += histogram[t]
    if (wB === 0) continue
    const wF = total - wB
    if (wF === 0) break

    sumB += t * histogram[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const variance = wB * wF * (mB - mF) * (mB - mF)

    if (variance > maxVariance) {
      maxVariance = variance
      threshold = t
    }
  }

  return threshold
}

/**
 * 清理 OCR 识别结果文本，去除常见乱码和噪声
 */
function cleanOcrText(text: string): string {
  return text
    // 统一换行
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 压缩连续空格（保留换行）
    .replace(/[ \t\u3000]+/g, ' ')
    // 去除行首行尾空格
    .split('\n')
    .map(l => l.trim())
    .join('\n')
    // 压缩连续空行（最多保留一个空行）
    .replace(/\n{3,}/g, '\n\n')
    // 去除常见的 OCR 乱码行（单字符行或全是符号的行）
    .split('\n')
    .filter(l => {
      const trimmed = l.trim()
      if (trimmed.length === 0) return true // 保留空行用于分段
      if (trimmed.length === 1 && /[^\u4e00-\u9fa5a-zA-Z0-9]/.test(trimmed)) return false
      // 去除全是特殊符号的行（允许少量标点）
      const symbolRatio = (trimmed.match(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g) || []).length / trimmed.length
      if (symbolRatio > 0.6 && trimmed.length > 2) return false
      return true
    })
    .join('\n')
    .trim()
}

/**
 * 使用 Tesseract.js 进行 OCR 识别（仅手动触发时使用，不自动调用）
 * 包含图像预处理（灰度化+对比度增强+二值化）以提升中文识别准确率
 * 注意：OCR 需要下载语言包（数十MB）并逐页识别，耗时可能数分钟
 */
export async function ocrFromPDF(arrayBuffer: ArrayBuffer, onProgress?: (msg: string) => void): Promise<string> {
  const Tesseract = await import('tesseract.js')
  const pdfjs = await loadPdfjs()

  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    cMapUrl: '/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/standard_fonts/',
    disableAutoFetch: true,
    disableStream: true
  })

  const pdfDoc = await loadingTask.promise
  const allText: string[] = []

  onProgress?.('正在加载 OCR 引擎和中英文语言包...')
  const worker = await Tesseract.createWorker(['chi_sim', 'eng'], 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress?.(`OCR 识别中: ${Math.round(m.progress * 100)}%`)
      } else if (m.status === 'loading language traineddata') {
        onProgress?.('正在加载语言模型（约20MB，请耐心等待）...')
      } else if (m.status === 'initializing api') {
        onProgress?.('正在初始化 OCR 引擎...')
      }
    },
    errorHandler: err => {
      console.error('OCR Worker错误:', err)
    }
  })

  // 设置 OCR 参数以提升中文识别准确率
  await worker.setParameters({
    // PSM 6: 假设为统一文本块，适合简历类文档
    tessedit_pageseg_mode: '6',
    // 保留单词间空格
    preserve_interword_spaces: '1',
    // 设置 DPI 提示
    user_defined_dpi: '300',
  })

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    onProgress?.(`正在渲染第 ${pageNum}/${pdfDoc.numPages} 页（高清模式）...`)
    const page = await pdfDoc.getPage(pageNum)

    // 使用更高的渲染比例（3x）以获得更清晰的文字
    const scale = 3
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = viewport.width
    canvas.height = viewport.height

    // 先填充白色背景，避免透明背景导致 OCR 混乱
    context.fillStyle = 'white'
    context.fillRect(0, 0, canvas.width, canvas.height)

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    // 图像预处理：灰度化 + 对比度增强 + 二值化
    onProgress?.(`正在预处理第 ${pageNum}/${pdfDoc.numPages} 页图像...`)
    preprocessImage(canvas)

    // 转为 Blob 供 Tesseract 处理（比 dataURL 更高效）
    const imageBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(blob => resolve(blob!), 'image/png')
    })

    onProgress?.(`正在识别第 ${pageNum}/${pdfDoc.numPages} 页...`)
    const result = await worker.recognize(imageBlob)

    if (result.data.text && result.data.text.trim()) {
      const cleaned = cleanOcrText(result.data.text)
      if (cleaned.length > 5) {
        allText.push(cleaned)
      }
    }
  }

  await worker.terminate()
  return allText.join('\n\n')
}

/**
 * 带超时的 Promise 包装
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label}超时（${ms / 1000}秒）`)), ms)
    )
  ])
}

/**
 * 从 PDF 文件提取全部文本
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjs = await loadPdfjs()

  const arrayBuffer = await file.arrayBuffer()
  let pdfDoc
  try {
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
      disableAutoFetch: true,
      disableStream: true
    })
    pdfDoc = await withTimeout(loadingTask.promise, 15000, 'PDF 加载')
  } catch (err) {
    throw new Error(`PDF 解析失败: ${err instanceof Error ? err.message : String(err)}`)
  }
  const allText: string[] = []

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum)
    const textContent = await page.getTextContent()

    // 按行组织文本
    const lines: Map<number, { text: string; x: number }> = new Map()

    textContent.items.forEach((item: any) => {
      if (item.str && item.str.trim()) {
        const y = Math.round(item.transform[5])
        const x = item.transform[4]

        if (lines.has(y)) {
          const existing = lines.get(y)!
          if (x < existing.x) {
            lines.set(y, { text: item.str + ' ' + existing.text, x })
          } else {
            existing.text += ' ' + item.str
          }
        } else {
          lines.set(y, { text: item.str, x })
        }
      }
    })

    const sortedLines = Array.from(lines.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([, val]) => val.text.trim())
      .filter(Boolean)

    allText.push(sortedLines.join('\n'))
  }

  return allText.join('\n')
}

// ==================== 辅助函数 ====================

/**
 * 将文本按常见键值对模式拆分（专门处理 PDF 表格文本串行问题）
 * 例如："毕业院校：哈尔滨理工大学 电话：17656363927" 拆分为
 * { '毕业院校': '哈尔滨理工大学', '电话': '17656363927' }
 */
function parseKeyValuePairs(text: string): Map<string, string> {
  const result = new Map<string, string>()
  
  // 预定义所有可能的关键字段
  const allFields = [
    '姓名', '性 别', '性别', '出 生 年 月', '出生年月', '出生日期', '生日', '出 生',
    '毕 业 院 校', '毕业院校', '学校', '院校',
    '专 业', '专业',
    '学 历', '学历', '学位',
    '毕 业 时 间', '毕业时间', '毕业年月', '毕业日期',
    '电 话', '电话', '手 机', '手机', '联系电话', '联系方式',
    '邮 箱', '邮箱', '电子邮箱',
    '民 族', '民族',
    '政 治 面 貌', '政治面貌',
    '英 语 水 平', '英语水平', '外语水平',
    '现 居', '现居', '现居地', '居住地', '地址', '所在地',
    'GitHub', '个人主页', '网站', '主页', 'LinkedIn'
  ]
  
  // 把 "关 键 词" 合并成 "关键词" 再处理
  let normalizedText = text.replace(/[ \t\u3000]{2,}/g, ' ')
  
  // 清理每个字之间的空格 "姓 名" → "姓名"
  allFields.forEach(field => {
    const spacedField = field.split('').join('[ \\t\\u3000]*')
    const re = new RegExp(spacedField, 'g')
    normalizedText = normalizedText.replace(re, field.replace(/[ \t\u3000]/g, ''))
  })
  
  // 按 "关键词：" 或 "关键词:" 切分
  // 找到每个已知字段的位置
  const positions: Array<{ key: string; start: number; end: number }> = []
  
  for (const field of allFields) {
    const cleanField = field.replace(/[ \t\u3000]/g, '')
    const re = new RegExp(`(^|\\s)${escapeRegExp(cleanField)}(\\s*[:：]|\\s)`, 'g')
    let match
    while ((match = re.exec(normalizedText)) !== null) {
      positions.push({
        key: cleanField,
        start: match.index + match[1].length,
        end: match.index + match[0].length
      })
    }
  }
  
  // 按位置排序
  positions.sort((a, b) => a.start - b.start)
  
  // 去重：同一关键词多次出现取第一次
  const seenKeys = new Set<string>()
  const uniquePositions = positions.filter(p => {
    if (seenKeys.has(p.key)) return false
    seenKeys.add(p.key)
    return true
  })
  
  // 提取每个字段的值（从当前字段结束到下一个字段开始）
  for (let i = 0; i < uniquePositions.length; i++) {
    const current = uniquePositions[i]
    const next = uniquePositions[i + 1]
    const valueStart = current.end
    const valueEnd = next ? next.start : normalizedText.length
    let value = normalizedText.substring(valueStart, valueEnd).trim()
    // 去掉开头的冒号
    value = value.replace(/^[:：]+/, '').trim()
    if (value) {
      result.set(current.key, value)
    }
  }
  
  return result
}

/**
 * 通用键值对提取
 * 支持 "关键词：值"、"关键词: 值"、"关键词 值"、"关键词　值"（全角空格）
 * 也支持 "关 键 词：值" 这种每个字之间有空格的格式
 */
function findValue(text: string, keywords: string[]): string | null {
  for (const kw of keywords) {
    // 关键词后跟冒号（中文或英文）然后是值
    const colonRe = new RegExp(`${escapeRegExp(kw)}\\s*[:：]\\s*([^\\n\\r|,，；;]+)`, 'i')
    const m1 = text.match(colonRe)
    if (m1 && m1[1].trim()) return m1[1].trim()

    // 关键词后跟空格或全角空格然后是值（值不能是另一个关键词）
    const spaceRe = new RegExp(`${escapeRegExp(kw)}[ \\u3000]+([^\\n\\r|,，；;]{2,50})`, 'i')
    const m2 = text.match(spaceRe)
    if (m2 && m2[1].trim()) {
      // 确保值不是另一个关键词
      if (!isAnotherKeyword(m2[1].trim())) return m2[1].trim()
    }
    
    // 处理每个字之间有空格的格式，如 "姓  名：张文阳"
    const spacedKw = kw.split('').join('\\s*')
    const spacedRe = new RegExp(`${spacedKw}\\s*[:：]\\s*([^\\n\\r|,，；;]+)`, 'i')
    const m3 = text.match(spacedRe)
    if (m3 && m3[1].trim()) return m3[1].trim()
  }
  return null
}

function isAnotherKeyword(s: string): boolean {
  const keywords = ['姓名', '性别', '出生', '电话', '手机', '邮箱', '地址', '民族', '政治', '英语', '求职', '意向', '教育', '工作', '项目', '技能', '证书', '语言', '自我', '个人', '主页', '网站']
  return keywords.some(k => s.startsWith(k))
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 从文本中提取指定章节内容
 */
function extractSection(text: string, keywords: string[]): string | null {
  const allSections: Array<{ names: string[] }> = [
    { names: ['个人简介', '自我简介', '个人介绍', '简介', 'Profile', 'Summary', 'About'] },
    { names: ['自我评价', '自我评估', '个人评价', 'Self Evaluation', 'Self-Assessment'] },
    { names: ['教育背景', '教育经历', '学历', 'Education'] },
    { names: ['工作经历', '工作经验', '实习经历', '职业经历', 'Work Experience', 'Experience', 'Employment'] },
    { names: ['项目经验', '项目经历', 'Projects', 'Project Experience'] },
    { names: ['专业技能', '技能特长', '技能', 'Skills', 'Technical Skills', '核心技能'] },
    { names: ['获奖证书', '证书荣誉', '证书', '荣誉', '奖项', 'Certificates', 'Awards', 'Honors'] },
    { names: ['语言能力', '语言', 'Languages', 'Language Skills'] }
  ]

  // 找到当前章节的起始位置
  let startPos = -1
  let matchedKw = ''
  for (const kw of keywords) {
    // 匹配：关键词后跟换行（可能有冒号）
    const regex1 = new RegExp(`(?:^|\\n)\\s*${escapeRegExp(kw)}\\s*[:：]?\\s*\\n`, 'i')
    const m1 = text.match(regex1)
    if (m1 && m1.index !== undefined) {
      startPos = m1.index + m1[0].length
      matchedKw = kw
      break
    }
    // 匹配：关键词后跟冒号（同行）
    const regex2 = new RegExp(`${escapeRegExp(kw)}\\s*[:：]\\s*`, 'i')
    const m2 = text.match(regex2)
    if (m2 && m2.index !== undefined) {
      startPos = m2.index + m2[0].length
      matchedKw = kw
      break
    }
    // 匹配：关键词单独一行
    const regex3 = new RegExp(`(?:^|\\n)\\s*${escapeRegExp(kw)}\\s*(?:\\n|$)`, 'i')
    const m3 = text.match(regex3)
    if (m3 && m3.index !== undefined) {
      startPos = m3.index + m3[0].length
      matchedKw = kw
      break
    }
  }

  if (startPos === -1) return null

  // 找到下一个章节的起始位置
  let endPos = text.length
  for (const section of allSections) {
    // 跳过当前章节
    if (section.names.some(n => matchedKw.includes(n) || n.includes(matchedKw))) continue

    for (const name of section.names) {
      const regex = new RegExp(`(?:^|\\n)\\s*${escapeRegExp(name)}\\s*[:：]?\\s*(?:\\n|$)`, 'i')
      const match = text.substring(startPos).match(regex)
      if (match && match.index !== undefined) {
        const absPos = startPos + match.index
        if (absPos < endPos) endPos = absPos
      }
      // 也检查行内冒号形式
      const regex2 = new RegExp(`(?:^|\\n)[^\\n]*${escapeRegExp(name)}\\s*[:：]`, 'i')
      const match2 = text.substring(startPos).match(regex2)
      if (match2 && match2.index !== undefined) {
        const absPos = startPos + match2.index
        if (absPos < endPos) endPos = absPos
      }
    }
  }

  return text.substring(startPos, endPos).trim()
}

/**
 * 将日期字符串标准化为 YYYY-MM 格式
 * 支持：2005年07月、2005-07、2005.07、2005 年 07 月、2005 / 07 等
 */
function normalizeDate(s: string): string {
  let d = s.trim()
  // 先把所有非数字字符统一成连字符
  d = d.replace(/[\s年/]/g, '-').replace(/[月日]/g, '').replace(/\./g, '-')
  // 清理连续连字符和首尾连字符
  d = d.replace(/-+/g, '-').replace(/^-|-$/g, '')
  // 处理 "1994-05" 或 "1994-5"
  const m = d.match(/(\d{4})-(\d{1,2})/)
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}`
  }
  // 只有年份
  const y = d.match(/(\d{4})/)
  if (y) return y[1]
  return d
}

/**
 * 智能解析 PDF 文本内容到简历数据结构
 */
export function parseResumeFromText(text: string): ResumeData {
  // 清理文本：统一换行、压缩空格
  let cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  // 压缩连续空格但保留换行
  cleanText = cleanText.replace(/[ \t\u3000]+/g, ' ')
  // 去除多余空行（连续2个以上换行变2个）
  cleanText = cleanText.replace(/\n{3,}/g, '\n\n')

  const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean)

  const data: ResumeData = {
    personal: {
      name: '', title: '', gender: '', birthDate: '', photo: '',
      politicalStatus: '', ethnicity: '', phone: '', email: '',
      location: '', website: '', github: '', linkedin: '',
      englishLevel: '', summary: ''
    },
    selfEvaluation: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    languages: []
  }

  // ============ 预解析基本信息区域（处理 PDF 表格文本串行问题） ============
  const basicInfoSection = extractSection(cleanText, ['基本信息', '基本资料', '个人信息', 'Basic Information', 'Personal Information'])
  const basicPairs = basicInfoSection ? parseKeyValuePairs(basicInfoSection) : new Map<string, string>()

  // ============ 提取姓名 ============
  // 先尝试从基本信息区域精确提取（处理表格串行问题）
  let nameVal = basicPairs.get('姓名')
  
  // 姓名关键词列表（支持多种格式）
  const nameKeywords = ['姓名', '姓  名', '姓 名', '名 字', '名字', 'Name', 'Full Name', '姓名：', '姓　名']
  if (!nameVal) nameVal = findValue(cleanText, nameKeywords)
  
  if (nameVal) {
    // 清理可能的多余信息
    data.personal.name = nameVal.split(/\s+/)[0].replace(/[（(].*$/, '')
  } else {
    // 没有明确标记，尝试多种方式识别
    
    // 方式1：取前几行中最像姓名的
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i]
      
      // 跳过纯数字、符号、过长行
      if (/^[\d\s\W|\/]+$/.test(line)) continue
      if (line.length > 20) continue
      if (/[:：]/.test(line)) continue
      
      // 跳过包含明显简历关键词的行
      if (/简历|RESUME|CV|Curriculum|个人|联系方式|教育|工作|项目|技能|自我|评价|简介|性别|出生|电话|手机|邮箱/i.test(line)) continue
      
      // 纯中文姓名 2-5 字
      if (/^[\u4e00-\u9fa5]{2,5}$/.test(line)) {
        data.personal.name = line
        break
      }
      
      // 中文姓名+空格+其他
      if (/^[\u4e00-\u9fa5]{2,5}\s/.test(line)) {
        data.personal.name = line.split(/\s+/)[0]
        break
      }
      
      // 英文名 (如 "John Smith")
      if (/^[A-Z][a-z]+\s[A-Z][a-z]+$/.test(line)) {
        data.personal.name = line
        break
      }
      
      // 中文姓名后跟英文（如 "张三 San Zhang"）
      if (/^[\u4e00-\u9fa5]{2,4}\s+[A-Za-z]/.test(line)) {
        data.personal.name = line.split(/\s+/)[0]
        break
      }
    }
    
    // 方式2：如果没有找到，尝试在整个文本中搜索常见姓名格式
    if (!data.personal.name) {
      // 匹配 "姓 名：张三" 这种中间有空格的格式
      const spacedNameMatch = cleanText.match(/姓\s*名\s*[:：]?\s*([\u4e00-\u9fa5]{2,5})/)
      if (spacedNameMatch) {
        data.personal.name = spacedNameMatch[1]
      }
    }
    
    // 方式3：尝试匹配 "XXX 简历" 格式
    if (!data.personal.name) {
      const resumeNameMatch = cleanText.match(/^([\u4e00-\u9fa5]{2,5})\s*(?:的?\s*简历|个人简历)/m)
      if (resumeNameMatch) {
        data.personal.name = resumeNameMatch[1]
      }
    }
  }

  // ============ 提取职位/求职意向 ============
  const titleVal = findValue(cleanText, ['求职意向', '目标职位', '应聘职位', '职位', '头衔', '岗位', 'Position', 'Title', 'Objective', 'Career Objective'])
  if (titleVal) {
    data.personal.title = titleVal
  } else {
    // 如果姓名行后面紧跟一个短文本，可能是职位
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === data.personal.name && i + 1 < lines.length) {
        const next = lines[i + 1]
        if (next.length < 25 && !/[\d]/.test(next) && !/:：/.test(next) &&
            !/^(教育|工作|项目|技能|证书|语言|自我)/.test(next)) {
          data.personal.title = next
        }
        break
      }
    }
  }

  // ============ 提取手机号 ============
  // 先用基本信息区域精确提取
  let phoneVal = basicPairs.get('手机') || basicPairs.get('电话') || basicPairs.get('联系方式') || basicPairs.get('联系电话')
  if (!phoneVal) phoneVal = findValue(cleanText, ['手机', '电话', '联系方式', '联系电话', 'Phone', 'Tel', 'Mobile', 'Cell'])
  if (phoneVal) {
    data.personal.phone = phoneVal.replace(/[^\d\-\+]/g, '')
  } else {
    // 直接在全文搜索手机号
    const phoneMatch = cleanText.match(/1[3-9]\d{1}[\s\-]?\d{4}[\s\-]?\d{4}/)
    if (phoneMatch) data.personal.phone = phoneMatch[0]
  }

  // ============ 提取邮箱 ============
  let emailVal = basicPairs.get('邮箱') || basicPairs.get('电子邮箱')
  if (!emailVal) emailVal = findValue(cleanText, ['邮箱', '电子邮箱', 'E-mail', 'Email', 'E-mail地址'])
  if (emailVal) {
    data.personal.email = emailVal.replace(/\s/g, '')
  } else {
    const emailMatch = cleanText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
    if (emailMatch) data.personal.email = emailMatch[0]
  }

  // ============ 提取性别 ============
  let genderVal = basicPairs.get('性别')
  if (!genderVal) genderVal = findValue(cleanText, ['性别', 'Gender'])
  if (genderVal) {
    const m = genderVal.match(/男|女/)
    if (m) data.personal.gender = m[0]
  }

  // ============ 提取出生年月 ============
  let birthVal = basicPairs.get('出生年月') || basicPairs.get('出生日期') || basicPairs.get('生日') || basicPairs.get('出生')
  const birthKeywords = ['出生年月', '出生日期', '生日', '出生', 'Birth', 'Birthday', 'Date of Birth', '出生年', '出生时间']
  if (!birthVal) birthVal = findValue(cleanText, birthKeywords)
  if (birthVal) {
    data.personal.birthDate = normalizeDate(birthVal)
  } else {
    // 尝试匹配 "1994年5月" 或 "1994-05" 格式
    // 优先匹配带"出生"关键词的行
    const birthLineMatch = cleanText.match(/出生[^0-9]*(\d{4})[\-/年](\d{1,2})[\-/月]?/)
    if (birthLineMatch) {
      data.personal.birthDate = normalizeDate(birthLineMatch[1] + '-' + birthLineMatch[2])
    } else {
      // 尝试匹配年龄推算（如"24岁"）
      const ageMatch = cleanText.match(/(\d{1,2})\s*岁/)
      if (ageMatch) {
        const age = parseInt(ageMatch[1])
        const birthYear = new Date().getFullYear() - age
        data.personal.birthDate = `${birthYear}-01`
      }
    }
  }

  // ============ 提取政治面貌 ============
  const politicalVal = findValue(cleanText, ['政治面貌', 'Political Status'])
  if (politicalVal) {
    const m = politicalVal.match(/中共党员|共青团员|群众|民主党派|无党派人士?|预备党员/)
    if (m) data.personal.politicalStatus = m[0]
  }

  // ============ 提取民族 ============
  const ethnicityVal = findValue(cleanText, ['民族', 'Ethnicity'])
  if (ethnicityVal) {
    data.personal.ethnicity = ethnicityVal.split(/\s+/)[0].replace(/[，,。].*$/, '')
  }

  // ============ 提取现居地 ============
  const locationVal = findValue(cleanText, ['现居', '居住地', '现居地', '地址', '所在地', '所在城市', 'Location', 'Address'])
  if (locationVal) {
    data.personal.location = locationVal
  }

  // ============ 提取英语水平 ============
  let englishVal = basicPairs.get('英语水平') || basicPairs.get('英语') || basicPairs.get('外语水平') || basicPairs.get('外语')
  if (!englishVal) englishVal = findValue(cleanText, ['英语水平', '英语', '外语水平', '外语', 'English', 'English Level'])
  if (englishVal) {
    data.personal.englishLevel = englishVal
  } else {
    // 直接搜索 CET、TEM 等
    const cetMatch = cleanText.match(/(CET[-\s]?\d|TEM[-\s]?\d|雅思|IELTS|TOEFL|托福|GRE|BEC\s?\w+)/i)
    if (cetMatch) data.personal.englishLevel = cetMatch[1]
  }

  // ============ 提取网站/GitHub/LinkedIn ============
  const websiteVal = findValue(cleanText, ['个人主页', '网站', 'Website', 'Site', '主页'])
  if (websiteVal) {
    const urlMatch = websiteVal.match(/https?:\/\/[^\s]+/)
    if (urlMatch) data.personal.website = urlMatch[0]
    else if (/^[\w.-]+\.\w+/.test(websiteVal)) data.personal.website = 'https://' + websiteVal
  } else {
    // 直接搜索URL
    const urlMatch = cleanText.match(/https?:\/\/(?!github|linkedin)[^\s|]+/i)
    if (urlMatch) data.personal.website = urlMatch[0]
  }

  const githubVal = findValue(cleanText, ['GitHub', 'Github', 'github'])
  if (githubVal) {
    data.personal.github = githubVal
  } else {
    const ghMatch = cleanText.match(/https?:\/\/github\.com\/[^\s|]+/i)
    if (ghMatch) data.personal.github = ghMatch[0]
  }

  const linkedinVal = findValue(cleanText, ['LinkedIn', 'Linkedin', 'linkedin'])
  if (linkedinVal) {
    data.personal.linkedin = linkedinVal
  } else {
    const liMatch = cleanText.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s|]+/i)
    if (liMatch) data.personal.linkedin = liMatch[0]
  }

  // ============ 提取个人简介 ============
  const summarySection = extractSection(cleanText, ['个人简介', '自我简介', '个人介绍', 'Profile', 'Summary', 'About'])
  if (summarySection) {
    data.personal.summary = summarySection.slice(0, 500).trim()
  }

  // ============ 提取自我评价 ============
  const evalSection = extractSection(cleanText, ['自我评价', '自我评估', '个人评价', 'Self Evaluation', 'Self-Assessment', 'Self Summary'])
  if (evalSection) {
    data.selfEvaluation = evalSection.trim()
  }

  // ============ 从基本信息中提取教育相关字段（支持无教育背景章节的情况） ============
  let eduFromBasic: EducationItem | null = null
  if (basicPairs.size > 0) {
    const schoolVal = basicPairs.get('毕业院校') || basicPairs.get('学校') || basicPairs.get('院校')
    const majorVal = basicPairs.get('专业')
    const degreeVal = basicPairs.get('学历') || basicPairs.get('学位')
    const gradDateVal = basicPairs.get('毕业时间') || basicPairs.get('毕业年月') || basicPairs.get('毕业日期')

    if (schoolVal || majorVal || degreeVal || gradDateVal) {
      eduFromBasic = {
        id: genId(),
        school: schoolVal || '',
        major: majorVal || '',
        degree: degreeVal || '',
        startDate: '',
        endDate: gradDateVal ? normalizeDate(gradDateVal) : '',
        description: ''
      }
    }
  }

  // ============ 提取教育背景 ============
  const eduSection = extractSection(cleanText, ['教育背景', '教育经历', '学历', 'Education', 'Educational Background', '教育'])
  if (eduSection) {
    const eduLines = eduSection.split('\n').filter(l => l.trim())
    let currentEdu: EducationItem | null = null

    for (const line of eduLines) {
      // 匹配日期范围（支持更多格式）
      const dateRange = line.match(/(\d{4})[\./\-年](\d{1,2})[\./\-月]?\s*(?:[-–—至到~—，])\s*(\d{4})[\./\-年](\d{1,2})[\./\-月]?|至今|现在|present|Present/i)
      const dateRangeSimple = line.match(/(\d{4})\s*(?:[-–—至到~—])\s*(\d{4})/)

      if (dateRange) {
        if (currentEdu) data.education.push(currentEdu)
        currentEdu = {
          id: genId(), school: '', major: '', degree: '',
          startDate: normalizeDate(dateRange[1] + '-' + dateRange[2]),
          endDate: dateRange[0].includes('至今') || dateRange[0].includes('现在') ? '至今' : normalizeDate(dateRange[3] + '-' + dateRange[4]),
          description: ''
        }
      } else if (dateRangeSimple) {
        if (currentEdu) data.education.push(currentEdu)
        currentEdu = {
          id: genId(), school: '', major: '', degree: '',
          startDate: dateRangeSimple[1] + '-09',
          endDate: dateRangeSimple[2] + '-06',
          description: ''
        }
      }

      if (dateRange || dateRangeSimple) {
        // 从同一行提取学校（支持更多学校名格式）
        const schoolPatterns = [
          /([\u4e00-\u9fa5]{2,}(?:大学|学院|学校|研究院|研究所|理工大学|科技大学|工业大学|交通大学|师范大学|医科大学|财经大学|政法大学|外语大学|外国语大学))/,
          /([\u4e00-\u9fa5]{2,}(?:职院|技校|中专|高中))/,
          /(?:University|Institute|College|School)\s+(?:of\s+)?[\w\s]+/i,
          /([A-Z][a-z]+\s+(?:University|College|Institute|School))/i
        ]
        for (const pattern of schoolPatterns) {
          const schoolMatch = line.match(pattern)
          if (schoolMatch) {
            if (currentEdu) currentEdu.school = schoolMatch[0]
            break
          }
        }
        // 从同一行提取学位
        const degreeMatch = line.match(/(博士|硕士|学士|本科|大专|专科|中专|高中|MBA|PhD|Master|Bachelor|研究生)/i)
        if (degreeMatch && currentEdu) currentEdu.degree = degreeMatch[1]
      } else if (currentEdu) {
        // 匹配学校名（支持更多格式）
        if (!currentEdu.school) {
          const schoolPatterns = [
            /([\u4e00-\u9fa5]{2,}(?:大学|学院|学校|研究院|研究所|理工大学|科技大学|工业大学|交通大学|师范大学|医科大学|财经大学|政法大学|外语大学|外国语大学))/,
            /([\u4e00-\u9fa5]{2,}(?:职院|技校|中专|高中))/,
            /(?:University|Institute|College|School)\s+(?:of\s+)?[\w\s]+/i,
            /([A-Z][a-z]+\s+(?:University|College|Institute|School))/i
          ]
          for (const pattern of schoolPatterns) {
            const schoolMatch = line.match(pattern)
            if (schoolMatch) {
              currentEdu.school = schoolMatch[0]
              break
            }
          }
          if (currentEdu.school) continue
        }
        
        // 匹配学位
        if (!currentEdu.degree) {
          const degreeMatch = line.match(/(博士|硕士|学士|本科|大专|专科|中专|高中|MBA|PhD|Master|Bachelor|研究生)/i)
          if (degreeMatch) {
            currentEdu.degree = degreeMatch[1]
            continue
          }
        }
        
        // 匹配专业（支持更多格式）
        if (!currentEdu.major) {
          // 方式1：关键词+冒号
          const majorMatch1 = line.match(/(?:专业|方向|Major|Specialization|Department)\s*[:：]?\s*([\u4e00-\u9fa5\w（）()]+)/i)
          if (majorMatch1) {
            currentEdu.major = majorMatch1[1].trim()
            continue
          }
          
          // 方式2：专业关键词结尾
          const majorMatch2 = line.match(/([\u4e00-\u9fa5]{2,}(?:专业|工程|科学|技术|管理|经济|文学|艺术|设计|教育|研究|医学|法学|理学|工学|商学))/)
          if (majorMatch2) {
            currentEdu.major = majorMatch2[0]
            continue
          }
          
          // 方式3：短行不含数字，可能是专业
          if (line.length >= 2 && line.length <= 20 && !/[\d]/.test(line) && !/^(教育|工作|项目|技能|证书|语言|自我)/.test(line)) {
            // 排除一些明显不是专业的行
            if (!/(?:大学|学院|学校|研究院|研究所|博士|硕士|学士|本科|大专|专科)/.test(line)) {
              currentEdu.major = line
              continue
            }
          }
        }
        
        // 其他信息作为描述
        if (line.length > 3) {
          currentEdu.description += (currentEdu.description ? '\n' : '') + line
        }
      }
    }
    if (currentEdu) data.education.push(currentEdu)
  }

  // 如果基本信息中提取到了教育字段，且教育背景章节没有提取到，则使用基本信息的
  if (eduFromBasic && data.education.length === 0) {
    data.education.push(eduFromBasic)
  }

  // ============ 提取工作经历 ============
  const expSection = extractSection(cleanText, ['工作经历', '工作经验', '实习经历', '职业经历', 'Work Experience', 'Experience', 'Employment', 'Professional Experience'])
  if (expSection) {
    const expLines = expSection.split('\n').filter(l => l.trim())
    let currentExp: ExperienceItem | null = null

    for (const line of expLines) {
      const dateRange = line.match(/(\d{4}[\./\-年]\d{1,2})\s*(?:[-–—至到~—])\s*(\d{4}[\./\-年]\d{1,2}|至今|现在|present|Present)/i)

      if (dateRange) {
        if (currentExp) data.experience.push(currentExp)
        currentExp = {
          id: genId(), company: '', position: '',
          startDate: normalizeDate(dateRange[1]),
          endDate: normalizeDate(dateRange[2]),
          description: ''
        }
        // 从同一行提取公司或职位
        const companyMatch = line.match(/([\u4e00-\u9fa5]{2,}(?:公司|集团|科技|有限|股份|实验室|中心|部门|事务所))|(?:Inc\.|Corp\.|Ltd\.|LLC|Group|Company|Co\.)/i)
        if (companyMatch) currentExp.company = companyMatch[0]
      } else if (currentExp) {
        // 匹配公司名
        if (!currentExp.company) {
          const companyMatch = line.match(/([\u4e00-\u9fa5]{2,}(?:公司|集团|科技|有限|股份|实验室|中心|部门|事务所))|(?:Inc\.|Corp\.|Ltd\.|LLC|Group|Company|Co\.)/i)
          if (companyMatch) {
            currentExp.company = companyMatch[0]
            continue
          }
        }
        // 匹配职位
        if (!currentExp.position) {
          const positionVal = findValue(line, ['职位', '岗位', 'Position', 'Title'])
          if (positionVal) {
            currentExp.position = positionVal
            continue
          }
          // 短行作为职位
          if (line.length < 20 && !/[\d。.]/.test(line) && !/^(负责|参与|主导|设计|开发|实现|优化|维护|推动|带领|完成|使用|基于|采用)/.test(line)) {
            currentExp.position = line
            continue
          }
        }
        // 其他作为描述
        if (line.length > 3) {
          currentExp.description += (currentExp.description ? '\n' : '') + line
        }
      }
    }
    if (currentExp) data.experience.push(currentExp)
  }

  // ============ 提取项目经验 ============
  const projSection = extractSection(cleanText, ['项目经验', '项目经历', '项目', 'Projects', 'Project Experience'])
  if (projSection) {
    const projLines = projSection.split('\n').filter(l => l.trim())
    let currentProj: ProjectItem | null = null

    for (const line of projLines) {
      const dateRange = line.match(/(\d{4}[\./\-年]\d{1,2})\s*(?:[-–—至到~—])\s*(\d{4}[\./\-年]\d{1,2}|至今|现在|present|Present)/i)

      if (dateRange) {
        if (currentProj) data.projects.push(currentProj)
        currentProj = {
          id: genId(), name: '', role: '', link: '',
          startDate: normalizeDate(dateRange[1]),
          endDate: normalizeDate(dateRange[2]),
          description: ''
        }
        // 同行可能有项目名
        const beforeDate = line.substring(0, line.indexOf(dateRange[1])).trim()
        if (beforeDate && beforeDate.length < 40) currentProj.name = beforeDate
      } else if (currentProj) {
        if (!currentProj.name && line.length < 40 && !/[\d]/.test(line)) {
          currentProj.name = line
          continue
        }
        if (!currentProj.role) {
          const roleMatch = line.match(/(?:角色|职责|负责|Role|Position|担任)\s*[:：]?\s*(.+)/i)
          if (roleMatch) {
            currentProj.role = roleMatch[1].trim()
            continue
          }
        }
        if (line.length > 3) {
          currentProj.description += (currentProj.description ? '\n' : '') + line
        }
      }
    }
    if (currentProj) data.projects.push(currentProj)
  }

  // ============ 提取专业技能 ============
  const skillSection = extractSection(cleanText, ['专业技能', '技能特长', '技能', 'Skills', 'Technical Skills', '核心技能', '专业能力'])
  if (skillSection) {
    const skillLines = skillSection.split('\n').filter(l => l.trim())
    let currentCat: SkillCategory | null = null

    for (const line of skillLines) {
      // 匹配分类名（如"前端框架：" 或 "编程语言："）
      const catMatch = line.match(/^([\u4e00-\u9fa5\w]{2,10})\s*[:：]/)
      if (catMatch) {
        if (currentCat && currentCat.skills.length) data.skills.push(currentCat)
        currentCat = { id: genId(), name: catMatch[1], skills: [] }
        const restSkills = line.substring(catMatch[0].length)
        if (restSkills.trim()) {
          currentCat.skills.push(...restSkills.split(/[、,，;；\|\/]/).map(s => s.trim()).filter(Boolean))
        }
      } else if (currentCat) {
        const skills = line.split(/[、,，;；\|\/]/).map(s => s.trim()).filter(Boolean)
        if (skills.length) currentCat.skills.push(...skills)
      } else {
        // 没有分类标记，整行作为技能
        const skills = line.split(/[、,，;；\|\/]/).map(s => s.trim()).filter(Boolean)
        if (skills.length > 1) {
          currentCat = { id: genId(), name: '技能', skills }
        } else if (skills.length === 1 && line.length < 30) {
          // 可能是分类名
          currentCat = { id: genId(), name: line, skills: [] }
        }
      }
    }
    if (currentCat && currentCat.skills.length) data.skills.push(currentCat)
  }

  // ============ 提取获奖证书 ============
  const certSection = extractSection(cleanText, ['获奖证书', '证书荣誉', '证书', '荣誉', '奖项', 'Certificates', 'Awards', 'Honors'])
  if (certSection) {
    const certLines = certSection.split('\n').filter(l => l.trim())
    for (const line of certLines) {
      if (line.length < 5) continue
      const cert: CertItem = { id: genId(), name: '', issuer: '', date: '', description: '' }

      const dateMatch = line.match(/(\d{4}[\./\-年]\d{1,2})/)
      if (dateMatch) cert.date = normalizeDate(dateMatch[1])

      const issuerMatch = line.match(/(?:颁发|发证|机构|Issuer|From)\s*[:：]?\s*([\u4e00-\u9fa5\w]+)/i)
      if (issuerMatch) cert.issuer = issuerMatch[1]

      cert.name = line
        .replace(dateMatch?.[0] || '', '')
        .replace(issuerMatch?.[0] || '', '')
        .replace(/[|\-–—·•]/g, '')
        .replace(/^\s*[:：]\s*/, '')
        .trim()

      if (cert.name) data.certifications.push(cert)
    }
  }

  // ============ 提取语言能力 ============
  const langSection = extractSection(cleanText, ['语言能力', '语言', 'Languages', 'Language Skills'])
  if (langSection) {
    const langLines = langSection.split('\n').filter(l => l.trim())
    for (const line of langLines) {
      const langMatch = line.match(/(中文|汉语|普通话|英语|英文|日语|法语|德语|韩语|西班牙语|俄语|Chinese|English|Japanese|French|German|Korean|Spanish|Russian)\s*[:：]?\s*([\u4e00-\u9fa5\w（()（）]+)/i)
      if (langMatch) {
        data.languages.push({
          id: genId(),
          name: langMatch[1],
          proficiency: langMatch[2] || ''
        })
      }
    }
  }

  // ---- 新增：增强项目经验提取（不修改原有逻辑，仅补充外部 PDF 遗漏的项目）----
  enhanceProjectExtraction(cleanText, data)

  return data
}

// ==================== 增强项目经验提取（新增代码，不修改原有逻辑） ====================

/**
 * 英文月份名转数字
 */
function monthNameToNum(month: string): string {
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  }
  return months[month.toLowerCase()] || '01'
}

/**
 * 增强版日期范围匹配
 * 兼容外部 PDF 的各种日期格式：
 * - 2024.1-2024.6（月不带前导零）
 * - 2024/01-2024/06
 * - 2024年1月-2024年6月
 * - 2024.01-至今 / 2024-至今
 * - 2024-2025（纯年份范围）
 * - Jan 2024 - Jun 2024（英文月份）
 * - 2024.01 ~ 2024.06（波浪号）
 */
function matchDateRangeEnhanced(line: string): { start: string; end: string; matchStart: number } | null {
  // 1. YYYY[./-年]M[M] - YYYY[./-年]M[M] 或 YYYY[./-年]M[M] - 至今/现在/present
  const m1 = line.match(/(\d{4})[\.\/\-年](\d{1,2})[月]?\s*(?:[-–—至到~—])\s*(\d{4})[\.\/\-年](\d{1,2})[月]?/i)
  if (m1) {
    return {
      start: normalizeDate(m1[1] + '-' + m1[2]),
      end: normalizeDate(m1[3] + '-' + m1[4]),
      matchStart: m1.index ?? 0
    }
  }

  // 2. YYYY[./-年]M[M] - 至今/现在/present
  const m2 = line.match(/(\d{4})[\.\/\-年](\d{1,2})[月]?\s*(?:[-–—至到~—])\s*(至今|现在|present|Present|当前|Current)/i)
  if (m2) {
    return {
      start: normalizeDate(m2[1] + '-' + m2[2]),
      end: '至今',
      matchStart: m2.index ?? 0
    }
  }

  // 3. 纯年份范围 YYYY - YYYY 或 YYYY - 至今
  const m3 = line.match(/(\d{4})\s*(?:[-–—至到~—])\s*(\d{4}|至今|现在|present|Present|当前|Current)/i)
  if (m3) {
    return {
      start: m3[1],
      end: /至今|现在|present|Present|当前|Current/i.test(m3[2]) ? '至今' : m3[2],
      matchStart: m3.index ?? 0
    }
  }

  // 4. 英文月份 Jan 2024 - Jun 2024
  const m4 = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s*(\d{4})\s*(?:[-–—至到~—])\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s*(\d{4})/i)
  if (m4) {
    return {
      start: m4[2] + '-' + monthNameToNum(m4[1]),
      end: m4[4] + '-' + monthNameToNum(m4[3]),
      matchStart: m4.index ?? 0
    }
  }

  // 5. 英文月份 Jan 2024 - Present
  const m5 = line.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s*(\d{4})\s*(?:[-–—至到~—])\s*(Present|Now|Current|至今)/i)
  if (m5) {
    return {
      start: m5[2] + '-' + monthNameToNum(m5[1]),
      end: '至今',
      matchStart: m5.index ?? 0
    }
  }

  return null
}

/**
 * 增强版项目经验章节提取
 * 兼容外部 PDF 的各种章节标题格式：
 * - 【项目经验】、[项目经历]、项目经验：
 * — 项目经验 —、═ 项目经验 ═
 * - 项目经验 Projects（双语标题）
 * - PROJECT EXPERIENCE（全大写）
 */
function extractProjectSectionEnhanced(text: string): string | null {
  // 已知下一个章节的关键词（用于截断项目章节内容）
  const nextSectionKeywords = [
    '专业技能', '技能特长', '技能', 'Skills', 'Technical Skills', '核心技能',
    '获奖证书', '证书荣誉', '证书', '荣誉', '奖项', 'Certificates', 'Awards',
    '语言能力', '语言', 'Languages',
    '自我评价', '自我评估', '个人评价', 'Self Evaluation',
    '教育背景', '教育经历', '学历', 'Education',
    '工作经历', '工作经验', '实习经历', 'Work Experience',
    '个人简介', '自我简介', 'Profile', 'Summary',
    '其他', 'Other', '兴趣爱好', '兴趣'
  ]

  // 项目章节标题的各种可能格式
  const titlePatterns = [
    // 标准：项目经验/项目经历/项目 + 可能的修饰符
    /(?:^|\n)\s*[【\[（(]?\s*项目(?:经验|经历|描述|列表|展示)?\s*[】\]）)]?\s*[:：]?\s*(?:\n|$)/i,
    // 双语：项目经验 Projects / 项目经历 Project Experience
    /(?:^|\n)\s*项目(?:经验|经历)?\s+Projects?\s*(?:Experience)?\s*[:：]?\s*(?:\n|$)/i,
    // 纯英文：Projects / Project Experience / Key Projects / Selected Projects
    /(?:^|\n)\s*Projects?\s*(?:Experience)?\s*[:：]?\s*(?:\n|$)/i,
    /(?:^|\n)\s*(?:Key|Selected|Notable|Major|Main|Personal)\s+Projects?\s*[:：]?\s*(?:\n|$)/i,
    // 全大写
    /(?:^|\n)\s*PROJECT\s*(?:EXPERIENCE|S)?\s*[:：]?\s*(?:\n|$)/i,
    // 带装饰线：— 项目经验 —、═ 项目经验 ═
    /(?:^|\n)\s*[-—–=═_*~]+\s*项目(?:经验|经历)?\s*[-—–=═_*~]+\s*(?:\n|$)/i,
    // 主要项目 / 参与项目 / 主导项目 / 负责项目 / 开发项目
    /(?:^|\n)\s*[【\[（(]?\s*(?:主要|参与|主导|负责|开发|个人|团队|开源)?\s*项目\s*[】\]）)]?\s*[:：]?\s*(?:\n|$)/i,
  ]

  // 尝试每种标题模式
  for (const pattern of titlePatterns) {
    const match = text.match(pattern)
    if (match && match.index !== undefined) {
      const startPos = match.index + match[0].length

      // 找下一个章节的起始位置
      let endPos = text.length
      for (const kw of nextSectionKeywords) {
        const kwPattern = new RegExp(`(?:^|\\n)\\s*[【\\[（(]?\\s*${escapeRegExp(kw)}\\s*[】\\]）)]?\\s*[:：]?\\s*(?:\\n|$)`, 'i')
        const kwMatch = text.substring(startPos).match(kwPattern)
        if (kwMatch && kwMatch.index !== undefined) {
          const absPos = startPos + kwMatch.index
          if (absPos < endPos) endPos = absPos
        }
      }

      const section = text.substring(startPos, endPos).trim()
      if (section.length > 5) return section
    }
  }

  return null
}

/**
 * 增强项目经验提取（新增函数，不修改原有 parseResumeFromText 逻辑）
 *
 * 当原有逻辑提取到的项目数量为 0 时，使用更宽松的章节识别和日期匹配重新提取。
 * 兼容外部 PDF（Word/WPS/在线简历生成器）的各种格式：
 * - 多种章节标题格式（带括号、装饰线、双语、全大写等）
 * - 多种日期格式（月不带前导零、纯年份、英文月份、波浪号等）
 * - 无日期的项目（按项目名/编号分段）
 * - 多种项目名格式（书名号、引号、前缀等）
 */
function enhanceProjectExtraction(text: string, data: ResumeData): void {
  // 如果原有逻辑已经提取到项目，不覆盖（只补充遗漏的）
  // 但如果已经提取到 3 个以上，说明原有逻辑工作正常，不需要增强
  if (data.projects.length >= 3) return

  // 使用增强版章节提取
  const projSection = extractProjectSectionEnhanced(text)
  if (!projSection) return

  const projLines = projSection.split('\n').map(l => l.trim()).filter(Boolean)
  if (projLines.length === 0) return

  const newProjects: ProjectItem[] = []
  let currentProj: ProjectItem | null = null

  // 已提取的项目名集合（避免重复）
  const existingNames = new Set(data.projects.map(p => p.name.toLowerCase().trim()))

  for (const line of projLines) {
    // 跳过纯分隔线
    if (/^[-—–=═_*~\s]+$/.test(line)) continue

    // 尝试增强版日期匹配
    const dateInfo = matchDateRangeEnhanced(line)

    if (dateInfo) {
      // 找到日期范围，开始新项目
      if (currentProj && currentProj.name) newProjects.push(currentProj)
      currentProj = {
        id: genId(), name: '', role: '', link: '',
        startDate: dateInfo.start,
        endDate: dateInfo.end,
        description: ''
      }
      // 日期前面的文本可能是项目名
      const beforeDate = line.substring(0, dateInfo.matchStart).trim()
      if (beforeDate && beforeDate.length < 50) {
        // 清理项目名中可能的前缀符号
        currentProj.name = beforeDate.replace(/^[•·▪◦\-–—★☆▶►■□◆◇\d.\)\（(]+\s*/, '').trim()
      }
    } else if (currentProj) {
      // 尝试提取项目名
      if (!currentProj.name) {
        // 方式1：项目名：XXX / 项目名称：XXX
        const nameMatch = line.match(/(?:项目名|项目名称|项目|Project\s*Name)\s*[:：]\s*(.+)/i)
        if (nameMatch) {
          const name = nameMatch[1].trim().split(/\s{2,}|\t/)[0].slice(0, 60)
          if (name) {
            currentProj.name = name
            continue
          }
        }

        // 方式2：书名号《XXX》或引号"XXX"
        const bookMatch = line.match(/[《【]([^》】]+)[》】]/)
        if (bookMatch) {
          currentProj.name = bookMatch[1].trim()
          // 行中剩余部分可能是描述
          const rest = line.replace(bookMatch[0], '').trim()
          if (rest.length > 3) {
            currentProj.description += (currentProj.description ? '\n' : '') + rest
          }
          continue
        }

        // 方式3：短行不含日期，可能是项目名（更宽松的长度限制）
        if (line.length <= 50 && !/^\d+$/.test(line)) {
          // 清理前缀符号
          const cleanedName = line.replace(/^[•·▪◦\-–—★☆▶►■□◆◇\d.\)\（(]+\s*/, '').trim()
          if (cleanedName && cleanedName.length >= 2 && cleanedName.length <= 50) {
            // 排除明显是描述的行（包含句号且较长）
            if (!/[。；！？]/.test(cleanedName) || cleanedName.length < 20) {
              currentProj.name = cleanedName
              continue
            }
          }
        }
      }

      // 尝试提取角色
      if (!currentProj.role) {
        const roleMatch = line.match(/(?:角色|职责|负责|担任|Role|Position|Title)\s*[:：]?\s*(.+)/i)
        if (roleMatch) {
          currentProj.role = roleMatch[1].trim().slice(0, 50)
          continue
        }
      }

      // 尝试提取链接
      if (!currentProj.link) {
        const linkMatch = line.match(/https?:\/\/[^\s|<>]+/i)
        if (linkMatch) {
          currentProj.link = linkMatch[0]
        }
      }

      // 其他内容作为描述
      if (line.length > 3) {
        currentProj.description += (currentProj.description ? '\n' : '') + line
      }
    } else {
      // currentProj 为 null（没有日期触发的项目开始）
      // 尝试无日期的项目识别

      // 方式1：项目名：XXX 格式
      const nameMatch = line.match(/(?:项目名|项目名称)\s*[:：]\s*(.+)/i)
      if (nameMatch) {
        if (currentProj && currentProj.name) newProjects.push(currentProj)
        currentProj = {
          id: genId(), name: nameMatch[1].trim().slice(0, 60), role: '', link: '',
          startDate: '', endDate: '', description: ''
        }
        continue
      }

      // 方式2：书名号《XXX》
      const bookMatch = line.match(/[《【]([^》】]+)[》】]/)
      if (bookMatch) {
        if (currentProj && currentProj.name) newProjects.push(currentProj)
        currentProj = {
          id: genId(), name: bookMatch[1].trim(), role: '', link: '',
          startDate: '', endDate: '', description: ''
        }
        const rest = line.replace(bookMatch[0], '').trim()
        if (rest.length > 3) {
          currentProj.description = rest
        }
        continue
      }

      // 方式3：带编号的项目（1. XXX / (1) XXX / 一、XXX）
      const numberedMatch = line.match(/^(?:\d+[.、)\s]|[(（]\d+[)）]\s|[一二三四五六七八九十]+[、.]\s)\s*(.+)/)
      if (numberedMatch) {
        const projName = numberedMatch[1].trim().slice(0, 60)
        if (projName.length >= 2) {
          if (currentProj && currentProj.name) newProjects.push(currentProj)
          currentProj = {
            id: genId(), name: projName, role: '', link: '',
            startDate: '', endDate: '', description: ''
          }
          continue
        }
      }

      // 方式4：带前缀符号的短行（• XXX / ▪ XXX / ★ XXX）
      const bulletMatch = line.match(/^[•·▪◦★☆▶►■□◆◇]\s*(.+)/)
      if (bulletMatch) {
        const projName = bulletMatch[1].trim().slice(0, 60)
        if (projName.length >= 2 && projName.length <= 50) {
          if (currentProj && currentProj.name) newProjects.push(currentProj)
          currentProj = {
            id: genId(), name: projName, role: '', link: '',
            startDate: '', endDate: '', description: ''
          }
          continue
        }
      }
    }
  }
  // 最后一个项目
  if (currentProj && currentProj.name) newProjects.push(currentProj)

  // 将新提取的项目合并到 data.projects（去重）
  for (const proj of newProjects) {
    const nameKey = proj.name.toLowerCase().trim()
    if (!existingNames.has(nameKey)) {
      data.projects.push(proj)
      existingNames.add(nameKey)
    }
  }
}

/**
 * PDF 导入结果（包含解析后的数据和原始文本）
 */
export interface PDFImportResult {
  data: ResumeData
  rawText: string
  /** 导入方式：metadata=元数据恢复, text=文本提取, ocr=OCR识别 */
  method?: 'metadata' | 'text' | 'ocr'
  /** 导入的模板ID（仅 metadata 方式有值） */
  templateId?: string
}

/**
 * 解析嵌入的简历数据 JSON 字符串
 * 支持 v1/v2/v3 三种格式：
 *   v1: 直接是 ResumeData JSON
 *   v2/v3: { resumeData, templateId, exportVersion, exportTime }
 */
function parseEmbeddedData(jsonStr: string): { data: ResumeData; templateId?: string } | null {
  try {
    const parsed = JSON.parse(jsonStr)

    // v2/v3 格式（含 templateId）
    if (parsed && parsed.resumeData && parsed.resumeData.personal) {
      const data = parsed.resumeData as ResumeData
      if (!data.education) data.education = []
      if (!data.experience) data.experience = []
      if (!data.projects) data.projects = []
      if (!data.skills) data.skills = []
      if (!data.certifications) data.certifications = []
      if (!data.languages) data.languages = []
      return { data, templateId: parsed.templateId }
    }

    // v1 格式（直接是 ResumeData）
    const data = parsed as ResumeData
    if (data && data.personal && typeof data.personal.name !== 'undefined') {
      if (!data.education) data.education = []
      if (!data.experience) data.experience = []
      if (!data.projects) data.projects = []
      if (!data.skills) data.skills = []
      if (!data.certifications) data.certifications = []
      if (!data.languages) data.languages = []
      return { data }
    }
  } catch {
    // JSON 解析失败
  }
  return null
}

/**
 * 从 PDF 的 EmbeddedFile 附件中提取简历数据（v4 导出格式专用）
 *
 * v4 导出格式使用 pdf-lib 的 attach() 方法将简历 JSON 作为标准 PDF 附件嵌入
 * （ISO 32000-2 §14.13），所有主流 PDF 阅读器重新保存时都不会丢失。
 * 使用 pdfjs-dist 的 getAttachments() API 读取，这是最可靠的恢复方式。
 *
 * @param file PDF 文件
 * @returns 解析后的 { data, templateId }，如果没有找到则返回 null
 */
async function extractEmbeddedDataFromAttachment(file: File): Promise<{ data: ResumeData; templateId?: string } | null> {
  try {
    const pdfjs = await loadPdfjs()
    const arrayBuffer = await file.arrayBuffer()

    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
      disableAutoFetch: true,
      disableStream: true
    })
    const pdfDoc = await withTimeout(loadingTask.promise, 15000, 'PDF 附件读取')

    const attachments = await pdfDoc.getAttachments()
    if (!attachments) return null

    // 查找 resume.json 附件
    const resumeAttachment = attachments['resume.json']
    if (!resumeAttachment) return null

    // pdfjs 返回的附件对象包含 content 字段（Uint8Array）
    const bytes = resumeAttachment.content
    if (!bytes || bytes.length === 0) return null
    const jsonStr = new TextDecoder('utf-8').decode(bytes)
    const parsed = parseEmbeddedData(jsonStr)
    if (!parsed) {
      console.warn('[PDF Import] EmbeddedFile resume.json 解析失败: JSON 无效，前200字预览:', jsonStr.slice(0, 200))
      return null
    }
    console.info(`[PDF Import] 从 PDF EmbeddedFile 成功恢复数据，姓名=${parsed.data.personal?.name ?? '未知'}`)
    return parsed
  } catch (err) {
    // EmbeddedFile 读取失败时输出警告，便于排查（不打断fallback链）
    if (err instanceof Error && !/timeout/i.test(err.message)) {
      console.warn('[PDF Import] EmbeddedFile 附件读取失败（继续走fallback链）:', err.message)
    }
    return null
  }
}

/**
 * 从原始文件字节中搜索 __RESUME_DATA__ 标记（v3 导出格式专用）
 *
 * v3 导出格式将简历 JSON 追加到 PDF 文件的 %%EOF 标记之后，
 * 不依赖 jsPDF 的 setProperties（实测不可靠），直接读取原始字节。
 * 这是最高优先级的恢复方式，100% 可靠。
 *
 * @param file PDF 文件
 * @returns 解析后的 { data, templateId }，如果没有找到则返回 null
 */
async function extractEmbeddedDataFromRaw(file: File): Promise<{ data: ResumeData; templateId?: string } | null> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    // 将文件转为字符串搜索标记（latin1 保留原始字节）
    // 只搜索文件末尾的最后 500KB（嵌入数据在 %%EOF 之后，位于文件尾部）
    const searchStart = Math.max(0, bytes.length - 500000)
    const searchText = new TextDecoder('utf-8').decode(bytes.slice(searchStart))

    const startMarker = '__RESUME_DATA__'
    const endMarker = '__END_RESUME_DATA__'

    const startIdx = searchText.indexOf(startMarker)
    if (startIdx === -1) return null

    const dataStart = startIdx + startMarker.length
    const endIdx = searchText.indexOf(endMarker, dataStart)
    if (endIdx === -1) return null

    const encodedData = searchText.substring(dataStart, endIdx)
    const jsonStr = decodeURIComponent(encodedData)

    return parseEmbeddedData(jsonStr)
  } catch {
    return null
  }
}

/**
 * 从 PDF 提取的文本中搜索嵌入的简历数据标记
 *
 * 用于浏览器打印方式导出的 PDF（v4 导出格式）：
 * 简历 JSON 数据以白色 1px 字体嵌入页面，打印为 PDF 后作为文字保留。
 * pdfjs-dist 提取文字时可能会在字符之间插入空格，所以需要先去除所有空白字符再搜索。
 *
 * @param text pdfjs-dist 提取的 PDF 全文本
 * @returns 解析后的 { data, templateId }，如果没有找到则返回 null
 */
function extractEmbeddedDataFromText(text: string): { data: ResumeData; templateId?: string } | null {
  try {
    // 去除所有空白字符，防止 pdfjs-dist 在提取时插入空格导致标记被拆分
    const cleanText = text.replace(/\s/g, '')

    const startMarker = '__RESUME_DATA__'
    const endMarker = '__END_RESUME_DATA__'

    const startIdx = cleanText.indexOf(startMarker)
    if (startIdx === -1) return null

    const dataStart = startIdx + startMarker.length
    const endIdx = cleanText.indexOf(endMarker, dataStart)
    if (endIdx === -1) return null

    const encodedData = cleanText.substring(dataStart, endIdx)
    const jsonStr = decodeURIComponent(encodedData)

    return parseEmbeddedData(jsonStr)
  } catch {
    return null
  }
}

/**
 * 尝试从 PDF 元数据中提取嵌入的简历 JSON 数据（v1/v2 导出格式）
 * 使用 pdfjs-dist 读取 PDF 的 Info 字典中的 Keywords 字段
 * 注意：v3 导出格式不再使用此方式（jsPDF setProperties 不可靠），
 *       但保留用于兼容旧版导出的 PDF
 * @returns 解析后的 { data, templateId }，如果没有嵌入数据则返回 null
 */
async function extractEmbeddedResumeData(file: File): Promise<{ data: ResumeData; templateId?: string } | null> {
  const pdfjs = await loadPdfjs()
  const arrayBuffer = await file.arrayBuffer()

  let pdfDoc
  try {
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
      disableAutoFetch: true,
      disableStream: true
    })
    pdfDoc = await withTimeout(loadingTask.promise, 10000, 'PDF 元数据读取')
  } catch {
    return null
  }

  try {
    const metadata = await pdfDoc.getMetadata()
    const keywords = (metadata?.info as any)?.Keywords || ''

    if (keywords) {
      const match = keywords.match(/__RESUME_DATA__(.+?)__END_RESUME_DATA__/s)
      if (match) {
        const jsonStr = decodeURIComponent(match[1])
        return parseEmbeddedData(jsonStr)
      }
    }
  } catch {
    // 元数据解析失败，忽略
  }

  return null
}

// ==================== 外部 PDF 兼容增强（新增代码，不修改原有逻辑） ====================

/**
 * 检测文本是否可能是乱码
 * 判断依据：替换字符(\uFFFD)占比、不可见字符占比、可读字符占比过低等
 * 用于检测 pdfjs 因缺少 cMap 或字体编码问题导致的乱码文本
 */
function isLikelyGarbled(text: string): boolean {
  if (!text || text.trim().length === 0) return true
  const len = text.length
  let replacementCount = 0
  let nonPrintableCount = 0
  let readableCount = 0
  for (const ch of text) {
    const code = ch.codePointAt(0)!
    if (code === 0xFFFD) replacementCount++
    if (code < 0x20 && code !== 0x0A && code !== 0x0D && code !== 0x09) nonPrintableCount++
    if ((code >= 0x4E00 && code <= 0x9FFF) || // CJK 统一汉字
        (code >= 0x41 && code <= 0x5A) ||   // A-Z
        (code >= 0x61 && code <= 0x7A) ||   // a-z
        (code >= 0x30 && code <= 0x39))      // 0-9
      readableCount++
  }
  // 替换字符占比 > 5%
  if (replacementCount / len > 0.05) return true
  // 不可见字符占比 > 30%
  if (nonPrintableCount / len > 0.3) return true
  // 完全没有可读字符
  if (readableCount === 0) return true
  return false
}

/**
 * 使用多种 pdfjs 配置尝试加载 PDF 文档
 * 兼容加密 PDF、特殊编码、缺少 cMap 等各种外部 PDF 场景
 * 每种配置使用独立的 ArrayBuffer 副本，避免 transfer/detach 问题
 */
async function loadPDFDocumentRobust(arrayBuffer: ArrayBuffer): Promise<any | null> {
  const pdfjs = await loadPdfjs()

  const configs = [
    // 配置1: 完整配置 + useSystemFonts + 不禁用流（兼容性最好）
    {
      data: arrayBuffer.slice(0),
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/standard_fonts/',
      useSystemFonts: true,
      disableAutoFetch: false,
      disableStream: false,
    },
    // 配置2: 仅 cMap + useSystemFonts
    {
      data: arrayBuffer.slice(0),
      cMapUrl: '/cmaps/',
      cMapPacked: true,
      useSystemFonts: true,
    },
    // 配置3: 空密码（处理加密 PDF）
    {
      data: arrayBuffer.slice(0),
      password: '',
      cMapUrl: '/cmaps/',
      cMapPacked: true,
    },
    // 配置4: useSystemFonts only
    {
      data: arrayBuffer.slice(0),
      useSystemFonts: true,
    },
    // 配置5: 最简配置（兜底）
    {
      data: arrayBuffer.slice(0),
    },
  ]

  for (let i = 0; i < configs.length; i++) {
    try {
      const loadingTask = pdfjs.getDocument(configs[i])
      const pdfDoc = await withTimeout(loadingTask.promise, 25000, `PDF 加载（配置${i + 1}）`)
      return pdfDoc
    } catch {
      // 当前配置失败，尝试下一个
    }
  }
  return null
}

/**
 * 增强版 PDF 文本提取
 * 使用多种 pdfjs 配置尝试提取文本，兼容 Word/WPS/在线简历生成器等外部工具生成的 PDF
 * 每页独立 try-catch，跳过无法提取的页面而非整体失败
 */
async function extractTextFromPDFRobust(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await loadPDFDocumentRobust(arrayBuffer)
  if (!pdfDoc) return ''

  const allText: string[] = []
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum)
      const textContent = await page.getTextContent()

      // 按行组织文本（与 extractTextFromPDF 相同的逻辑）
      const lines: Map<number, { text: string; x: number }> = new Map()
      textContent.items.forEach((item: any) => {
        if (item.str && item.str.trim()) {
          const y = Math.round(item.transform[5])
          const x = item.transform[4]
          if (lines.has(y)) {
            const existing = lines.get(y)!
            if (x < existing.x) {
              lines.set(y, { text: item.str + ' ' + existing.text, x })
            } else {
              existing.text += ' ' + item.str
            }
          } else {
            lines.set(y, { text: item.str, x })
          }
        }
      })

      const sortedLines = Array.from(lines.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([, val]) => val.text.trim())
        .filter(Boolean)

      allText.push(sortedLines.join('\n'))
    } catch {
      // 跳过无法提取的页面
    }
  }

  try { pdfDoc.destroy() } catch {}
  return allText.join('\n')
}

/**
 * 计算简历数据中已填充的字段数量
 * 用于判断解析结果质量，决定是否需要尝试其他提取方式
 */
function countFilledFields(data: ResumeData): number {
  let count = 0
  if (data.personal.name) count++
  if (data.personal.phone) count++
  if (data.personal.email) count++
  if (data.personal.title) count++
  if (data.personal.gender) count++
  if (data.personal.birthDate) count++
  if (data.personal.location) count++
  if (data.personal.summary) count++
  if (data.selfEvaluation) count++
  if (data.education.length) count++
  if (data.experience.length) count++
  if (data.skills.length) count++
  if (data.projects.length) count++
  return count
}

/**
 * 增强版 OCR 识别
 * 使用多种 pdfjs 配置渲染 PDF 页面为图片，再用 Tesseract.js OCR 识别
 * 兼容标准 pdfjs 配置无法加载的外部 PDF（扫描件/图片 PDF/加密 PDF 等）
 */
async function ocrFromPDFRobust(arrayBuffer: ArrayBuffer, onProgress?: (msg: string) => void): Promise<string> {
  const pdfDoc = await loadPDFDocumentRobust(arrayBuffer)
  if (!pdfDoc) {
    throw new Error('PDF 文件无法加载（所有配置均失败）')
  }

  const Tesseract = await import('tesseract.js')
  const allText: string[] = []

  onProgress?.('正在加载 OCR 引擎和中英文语言包...')
  const worker = await Tesseract.createWorker(['chi_sim', 'eng'], 1, {
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress?.(`OCR 识别中: ${Math.round(m.progress * 100)}%`)
      } else if (m.status === 'loading language traineddata') {
        onProgress?.('正在加载语言模型（约20MB，请耐心等待）...')
      } else if (m.status === 'initializing api') {
        onProgress?.('正在初始化 OCR 引擎...')
      }
    },
    errorHandler: err => {
      console.error('OCR Worker错误:', err)
    }
  })

  await worker.setParameters({
    tessedit_pageseg_mode: '6',
    preserve_interword_spaces: '1',
    user_defined_dpi: '300',
  })

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    onProgress?.(`正在渲染第 ${pageNum}/${pdfDoc.numPages} 页（高清模式）...`)
    try {
      const page = await pdfDoc.getPage(pageNum)
      const scale = 3
      const viewport = page.getViewport({ scale })

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = viewport.width
      canvas.height = viewport.height

      // 先填充白色背景，避免透明背景导致 OCR 混乱
      context.fillStyle = 'white'
      context.fillRect(0, 0, canvas.width, canvas.height)

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise

      // 图像预处理：灰度化 + 对比度增强 + 二值化
      onProgress?.(`正在预处理第 ${pageNum}/${pdfDoc.numPages} 页图像...`)
      preprocessImage(canvas)

      const imageBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(blob => resolve(blob!), 'image/png')
      })

      onProgress?.(`正在识别第 ${pageNum}/${pdfDoc.numPages} 页...`)
      const result = await worker.recognize(imageBlob)

      if (result.data.text && result.data.text.trim()) {
        const cleaned = cleanOcrText(result.data.text)
        if (cleaned.length > 5) {
          allText.push(cleaned)
        }
      }
    } catch {
      // 跳过无法渲染的页面
    }
  }

  await worker.terminate()
  try { pdfDoc.destroy() } catch {}
  return allText.join('\n\n')
}

/**
 * 从 PDF 文件中提取图片（用于提取证件照等嵌入图片）
 *
 * 双重策略：
 * 策略1（优先）：使用 pdfjs 的 OperatorList 直接提取内嵌图片对象
 *   - 支持 paintImageXObject / paintImageXObjectRepeat / paintJpegXObject / paintImageMaskXObject
 *   - 质量最高，直接获取原始像素数据
 *
 * 策略2（兜底）：如果策略1找不到图片，渲染整页到 canvas
 *   - 分析页面右上角、左上角、右上1/4区域，找到最可能是照片的区域
 *   - 通过颜色方差判断：照片区域颜色丰富（方差大），空白区域颜色单一
 *   - 适合 Word/WPS 导出的 PDF（照片被嵌入为整页渲染的一部分）
 *
 * @param file PDF 文件
 * @param onProgress 进度回调
 * @returns base64 格式的图片数据（不含 data: 前缀），如果没有图片则返回空字符串
 */
export async function extractImageFromPDF(
  file: File,
  onProgress?: (msg: string) => void
): Promise<string> {
  const pdfjs = await loadPdfjs()
  const arrayBuffer = await file.arrayBuffer()

  const loadingTask = pdfjs.getDocument({
    data: arrayBuffer,
    cMapUrl: '/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: '/standard_fonts/',
    disableAutoFetch: true,
    disableStream: true,
  })

  const pdfDoc = await loadingTask.promise
  const candidates: { base64: string; width: number; height: number; pageNum: number; score: number }[] = []

  const maxPages = Math.min(pdfDoc.numPages, 2) // 只扫描前 2 页

  // ========== 策略1：OperatorList 直接提取内嵌图片 ==========
  for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
    onProgress?.(`正在扫描第 ${pageNum} 页的图片...`)
    const page = await pdfDoc.getPage(pageNum)

    try {
      const operatorList = await page.getOperatorList()
      const OPS = pdfjs.OPS

      // 支持所有图片绘制操作类型
      const imageOpTypes = [
        OPS.paintImageXObject,
        OPS.paintImageXObjectRepeat,
        OPS.paintJpegXObject,
        OPS.paintImageMaskXObject,
        OPS.paintImageMaskXObjectRepeat,
      ].filter(v => v !== undefined)

      const imageOps: { name: string; transform: number[] }[] = []
      for (let i = 0; i < operatorList.fnArray.length; i++) {
        if (imageOpTypes.includes(operatorList.fnArray[i])) {
          const args = operatorList.argsArray[i]
          if (args && args[0]) {
            imageOps.push({ name: args[0] as string, transform: args[3] as number[] || [] })
          }
        }
      }

      console.info(`[PDF Image] 第${pageNum}页找到 ${imageOps.length} 个图片操作符`)

      // 获取每张图片的实际数据
      for (const { name } of imageOps) {
        try {
          const imgData = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('图片加载超时')), 5000)
            page.objs.get(name, (obj: any) => {
              clearTimeout(timeout)
              resolve(obj)
            })
          })

          if (!imgData || !imgData.data || !imgData.width || !imgData.height) continue

          const w = imgData.width
          const h = imgData.height

          // 过滤掉太小的图片（图标、装饰元素）和太大的图片（背景图）
          if (w < 50 || h < 50) continue
          if (w > 2000 || h > 2000) continue

          // 计算宽高比，证件照通常接近正方形或略宽
          const aspectRatio = w / h
          const isNearSquare = aspectRatio > 0.6 && aspectRatio < 1.8

          // 计算分数
          let score = 0
          if (isNearSquare) score += 30
          if (w >= 100 && w <= 600 && h >= 100 && h <= 600) score += 20
          if (pageNum === 1) score += 15
          score += Math.min(20, 200 / Math.max(w, h) * 10)

          // 将图片数据转为 base64
          const base64 = imageToBase64(imgData, w, h)
          if (base64) {
            candidates.push({ base64, width: w, height: h, pageNum, score })
            console.info(`[PDF Image] 策略1找到图片: ${w}x${h}, 页码=${pageNum}, 分数=${score}`)
          }
        } catch (imgErr) {
          console.warn(`[PDF Image] 提取图片 ${name} 失败:`, imgErr)
        }
      }
    } catch (pageErr) {
      console.warn(`[PDF Image] 扫描第 ${pageNum} 页失败:`, pageErr)
    }

    if (pageNum === 1 && candidates.some(c => c.score >= 50)) {
      break
    }
  }

  // ========== 策略2：渲染整页截图，智能裁剪照片区域 ==========
  if (candidates.length === 0) {
    onProgress?.('内嵌图片未找到，尝试渲染截图识别照片...')

    for (let pageNum = 1; pageNum <= Math.min(pdfDoc.numPages, 1); pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum)
        const viewport = page.getViewport({ scale: 2 })

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!
        canvas.width = viewport.width
        canvas.height = viewport.height

        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise

        onProgress?.('正在分析页面布局识别照片区域...')

        // 尝试从多个区域检测照片
        const detected = detectPhotoRegion(canvas, ctx)
        for (const det of detected) {
          candidates.push({
            base64: det.base64,
            width: det.width,
            height: det.height,
            pageNum,
            score: det.score,
          })
          console.info(`[PDF Image] 策略2裁剪到照片区域: ${det.width}x${det.height}, 分数=${det.score}, 位置=${det.label}`)
        }
      } catch (renderErr) {
        console.warn(`[PDF Image] 策略2渲染第 ${pageNum} 页失败:`, renderErr)
      }
    }
  }

  try { pdfDoc.destroy() } catch {}

  if (candidates.length === 0) {
    onProgress?.('未找到 PDF 中的图片')
    return ''
  }

  // 按分数排序，取最高分
  candidates.sort((a, b) => b.score - a.score)
  const best = candidates[0]
  onProgress?.(`已提取图片: ${best.width}x${best.height}`)
  console.info(`[PDF Image] 最佳候选: ${best.width}x${best.height}, 分数=${best.score}, 页码=${best.pageNum}`)

  // base64 已经是完整 data URL 或纯 base64，统一确保返回完整 data URL
  if (best.base64.startsWith('data:')) {
    return best.base64
  }
  return `data:image/jpeg;base64,${best.base64}`
}

/**
 * 自动检测并裁剪图片周围的空白边距
 *
 * PDF 中提取的图片可能包含大面积白边/背景色，导致照片内容偏移。
 * 本函数扫描像素，找到实际内容的边界框，裁掉周围空白，使照片居中。
 *
 * @param canvas 原始画布
 * @param ctx 画布上下文
 * @param threshold 白色判定阈值（0-255，默认 240，越大越严格）
 * @returns 裁剪后的坐标 { x, y, w, h }，如果全是空白则返回原始尺寸
 */
function trimWhitespace(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  threshold = 240
): { x: number; y: number; w: number; h: number } {
  const W = canvas.width
  const H = canvas.height
  const imageData = ctx.getImageData(0, 0, W, H)
  const data = imageData.data

  let minX = W, minY = H, maxX = 0, maxY = 0
  let foundContent = false

  // 扫描每一行每一列，找到非白色像素的边界
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      // 非白色判定：任意通道低于阈值
      if (r < threshold || g < threshold || b < threshold) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        foundContent = true
      }
    }
  }

  if (!foundContent) {
    return { x: 0, y: 0, w: W, h: H }
  }

  // 加 2px 边距避免裁太紧
  const padding = 2
  minX = Math.max(0, minX - padding)
  minY = Math.max(0, minY - padding)
  maxX = Math.min(W - 1, maxX + padding)
  maxY = Math.min(H - 1, maxY + padding)

  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

/**
 * 将 pdfjs 图片对象转为 data URL
 *
 * 原样返回提取到的图片，不做任何裁剪或缩放。
 * 与手动上传照片行为完全一致，由 CSS object-fit: cover 处理显示。
 */
function imageToBase64(imgData: any, w: number, h: number): string | null {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(w, h)

    if (imgData.data.length === w * h * 4) {
      // RGBA
      imageData.data.set(imgData.data)
    } else if (imgData.data.length === w * h * 3) {
      // RGB → RGBA
      const src = imgData.data
      const dst = imageData.data
      for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
        dst[j] = src[i]
        dst[j + 1] = src[i + 1]
        dst[j + 2] = src[i + 2]
        dst[j + 3] = 255
      }
    } else {
      return null
    }

    ctx.putImageData(imageData, 0, 0)

    // 原样返回完整 data URL，不做任何裁剪
    return canvas.toDataURL('image/jpeg', 0.92)
  } catch {
    return null
  }
}

/**
 * 智能检测 canvas 中的照片区域
 *
 * 简历中的照片通常出现在：
 * 1. 右上角（最常见）
 * 2. 左上角
 * 3. 左侧栏顶部
 *
 * 通过分析颜色方差来区分照片区域和空白区域：
 * - 照片区域：颜色丰富，方差大，有皮肤色调
 * - 空白区域：颜色单一，方差小
 */
function detectPhotoRegion(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): { base64: string; width: number; height: number; score: number; label: string }[] {
  const results: { base64: string; width: number; height: number; score: number; label: string }[] = []
  const W = canvas.width
  const H = canvas.height

  // 定义候选区域（以页面比例为准）
  // 照片比例统一为 3:4（标准证件照），区域宽高比约为 0.75
  const regions = [
    // 右上角
    { x: 0.75, y: 0.03, w: 0.20, h: 0.27, label: '右上角' },
    // 左上角
    { x: 0.03, y: 0.03, w: 0.20, h: 0.27, label: '左上角' },
    // 左侧栏顶部
    { x: 0.03, y: 0.08, w: 0.22, h: 0.30, label: '左侧栏' },
    // 顶部居中
    { x: 0.38, y: 0.03, w: 0.24, h: 0.32, label: '顶部居中' },
  ]

  for (const region of regions) {
    const x = Math.round(W * region.x)
    const y = Math.round(H * region.y)
    const w = Math.round(W * region.w)
    const h = Math.round(H * region.h)

    if (x + w > W || y + h > H) continue

    // 获取区域像素数据
    const imageData = ctx.getImageData(x, y, w, h)
    const data = imageData.data

    // 计算颜色方差和皮肤色比例
    let rSum = 0, gSum = 0, bSum = 0
    let rSqSum = 0, gSqSum = 0, bSqSum = 0
    let skinPixels = 0
    let nonWhitePixels = 0
    const totalPixels = w * h

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      rSum += r
      gSum += g
      bSum += b
      rSqSum += r * r
      gSqSum += g * g
      bSqSum += b * b

      // 判断是否非白色
      if (r < 240 || g < 240 || b < 240) {
        nonWhitePixels++
      }

      // 皮肤色检测（简单 YCbCr 判断）
      // 皮肤色条件：R > G > B, R-B > 15, R > 95, G > 40, B > 20
      if (r > 95 && g > 40 && b > 20 && r > g && g > b && r - b > 15) {
        skinPixels++
      }
    }

    const rVar = rSqSum / totalPixels - (rSum / totalPixels) ** 2
    const gVar = gSqSum / totalPixels - (gSum / totalPixels) ** 2
    const bVar = bSqSum / totalPixels - (bSum / totalPixels) ** 2
    const totalVar = rVar + gVar + bVar

    const nonWhiteRatio = nonWhitePixels / totalPixels
    const skinRatio = skinPixels / totalPixels

    console.info(`[PDF Image] 区域 ${region.label}: 方差=${Math.round(totalVar)}, 非白比例=${(nonWhiteRatio * 100).toFixed(1)}%, 皮肤比例=${(skinRatio * 100).toFixed(1)}%`)

    // 评分标准：
    // - 方差 > 500（颜色丰富，可能是照片）
    // - 非白比例 > 30%（有实质内容）
    // - 皮肤比例 > 5%（含人脸特征）
    let score = 0
    if (totalVar > 500) score += 25
    if (totalVar > 2000) score += 15
    if (nonWhiteRatio > 0.3) score += 20
    if (nonWhiteRatio > 0.6) score += 10
    if (skinRatio > 0.05) score += 30
    if (skinRatio > 0.15) score += 10

    // 如果评分太低，跳过
    if (score < 30) continue

    // 裁剪这个区域，原样返回，不做比例规范化
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = w
    cropCanvas.height = h
    const cropCtx = cropCanvas.getContext('2d')!
    cropCtx.drawImage(canvas, x, y, w, h, 0, 0, w, h)

    // 裁掉空白边距，让照片内容居中
    const trimmed = trimWhitespace(cropCanvas, cropCtx)

    // 基于裁剪后的区域创建最终图片
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = trimmed.w
    finalCanvas.height = trimmed.h
    const finalCtx = finalCanvas.getContext('2d')!
    finalCtx.drawImage(cropCanvas, trimmed.x, trimmed.y, trimmed.w, trimmed.h, 0, 0, trimmed.w, trimmed.h)

    const base64 = finalCanvas.toDataURL('image/jpeg', 0.92)
    if (base64 && base64.length > 100) {
      results.push({
        base64,
        width: trimmed.w,
        height: trimmed.h,
        score,
        label: region.label,
      })
    }
  }

  return results
}

/**
 * 从 PDF 文件导入简历数据
 * 导入策略（按顺序尝试）：
 * 1. 从 PDF 元数据读取嵌入的简历 JSON（本项目导出的 PDF，含模板ID）
 * 2. 从 PDF 提取文本并智能解析（含文本层的标准 PDF）
 * 3. 自动 OCR 识别（扫描件/图片 PDF/浏览器打印生成的 PDF）
 *
 * @param file PDF 文件
 * @param onProgress 进度回调（主要用于 OCR 阶段）
 */
export async function importResumeFromPDF(
  file: File,
  onProgress?: (msg: string) => void
): Promise<PDFImportResult> {
  // Step 0: 优先从 PDF EmbeddedFile 附件读取（v4 导出格式，最可靠）
  // v4 使用 pdf-lib attach() 嵌入标准 PDF 附件，符合 ISO 32000-2 规范
  onProgress?.('正在检查 PDF 附件...')
  try {
    const embedded = await extractEmbeddedDataFromAttachment(file)
    if (embedded) {
      return {
        data: embedded.data,
        rawText: '[从 PDF EmbeddedFile (resume.json) 精确恢复 - 无任何信息损失]',
        method: 'embeddedfile-v4',
        templateId: embedded.templateId
      }
    }
  } catch {
    // EmbeddedFile 读取失败，继续尝试其他方式
  }

  // Step 1a: 从原始文件字节中搜索嵌入数据（v3 导出格式，追加在 %%EOF 之后）
  onProgress?.('正在检查嵌入数据...')
  try {
    const embeddedRaw = await extractEmbeddedDataFromRaw(file)
    if (embeddedRaw) {
      return {
        data: embeddedRaw.data,
        rawText: '[从 PDF 嵌入数据精确恢复]',
        method: 'metadata',
        templateId: embeddedRaw.templateId
      }
    }
  } catch {
    // 原始字节搜索失败，继续尝试其他方式
  }

  // Step 1b: 尝试从 PDF 元数据中读取嵌入的简历数据（v1/v2 旧版导出格式）
  onProgress?.('正在检查 PDF 元数据...')
  try {
    const embedded = await extractEmbeddedResumeData(file)
    if (embedded) {
      return {
        data: embedded.data,
        rawText: '[从 PDF 元数据精确恢复]',
        method: 'metadata',
        templateId: embedded.templateId
      }
    }
  } catch {
    // 嵌入数据读取失败，继续走文本提取流程
  }

  // Step 2: 从 PDF 提取文本并智能解析（适用于有文本层的 PDF）
  onProgress?.('正在提取 PDF 文本...')
  let text: string
  try {
    text = await extractTextFromPDF(file)
  } catch {
    // PDF 解析失败，直接走 OCR
    text = ''
  }

  // Step 2a: 先检查文本中是否有嵌入的简历数据标记（v4 打印导出的 PDF）
  // 浏览器打印方式导出的 PDF 中，简历 JSON 以隐藏文字嵌入，pdfjs-dist 可直接提取
  if (text) {
    const embeddedFromText = extractEmbeddedDataFromText(text)
    if (embeddedFromText) {
      return {
        data: embeddedFromText.data,
        rawText: '[从 PDF 文本中精确恢复]',
        method: 'metadata',
        templateId: embeddedFromText.templateId
      }
    }
  }

  // ---- 新增：乱码检测与增强提取（不修改原有逻辑）----
  // 当标准提取返回乱码时（常见于外部 PDF 缺少 cMap 或字体编码问题），
  // 尝试多种 pdfjs 配置重新提取，可能获得可读文本
  if (text && text.trim().length >= 10 && isLikelyGarbled(text)) {
    onProgress?.('检测到文本可能乱码，正在尝试增强提取（兼容外部 PDF）...')
    try {
      const robustText = await extractTextFromPDFRobust(file)
      if (robustText && robustText.trim().length >= 10 && !isLikelyGarbled(robustText)) {
        text = robustText
      }
    } catch {
      // 增强提取失败，使用原始文本
    }
  }

  // Step 2b: 没有找到嵌入数据，走智能文本解析
  if (text && text.trim().length >= 10) {
    // 成功提取到文本，进行智能解析
    onProgress?.('正在智能解析简历信息...')
    const data = parseResumeFromText(text)
    return { data, rawText: text, method: 'text' }
  }

  // ---- 新增：增强文本提取 + OCR 兜底（兼容外部 PDF，不修改原有逻辑）----
  // 当标准文本提取完全失败时，依次尝试：增强文本提取 → 增强 OCR
  // 覆盖外部 PDF 因加密、特殊编码、缺 cMap 等导致标准 pdfjs 配置失败的场景
  if (!text || text.trim().length < 10) {
    // 尝试增强文本提取（多种 pdfjs 配置）
    onProgress?.('标准文本提取失败，正在尝试增强提取（兼容外部 PDF）...')
    try {
      const robustText = await extractTextFromPDFRobust(file)
      if (robustText && robustText.trim().length >= 10) {
        // 检查是否有嵌入数据
        const embeddedFromText = extractEmbeddedDataFromText(robustText)
        if (embeddedFromText) {
          return {
            data: embeddedFromText.data,
            rawText: '[从 PDF 文本中精确恢复]',
            method: 'metadata',
            templateId: embeddedFromText.templateId
          }
        }
        // 非乱码文本才进行智能解析
        if (!isLikelyGarbled(robustText)) {
          onProgress?.('正在智能解析简历信息...')
          const data = parseResumeFromText(robustText)
          const filledCount = countFilledFields(data)
          if (filledCount >= 3) {
            return { data, rawText: robustText, method: 'text' }
          }
        }
        // 解析结果不足，保留文本供后续 OCR 比对
        text = robustText
      }
    } catch {
      // 增强文本提取失败
    }
  }

  // ---- 新增：增强 OCR 识别（兼容外部 PDF）----
  // 当文本提取失败或返回乱码时，使用多种 pdfjs 配置渲染 PDF 并 OCR
  if (!text || text.trim().length < 10 || isLikelyGarbled(text)) {
    onProgress?.('正在尝试增强 OCR 识别（兼容外部 PDF）...')
    try {
      const robustBuffer = await file.arrayBuffer()
      const robustOcrText = await ocrFromPDFRobust(robustBuffer, (msg) => {
        onProgress?.(msg)
      })
      if (robustOcrText && robustOcrText.trim().length >= 10) {
        onProgress?.('OCR 识别完成，正在智能解析...')
        const data = parseResumeFromText(robustOcrText)
        return { data, rawText: robustOcrText, method: 'ocr' }
      }
    } catch {
      // 增强 OCR 失败，继续走标准 OCR（Step 3）
    }
  }

  // Step 3: PDF 无文本内容，自动启动 OCR 识别
  // 适用于：扫描件、图片 PDF、浏览器打印生成的 PDF（文字被渲染为图片）
  onProgress?.('PDF 无文本层，正在启动 OCR 引擎自动识别...')

  const arrayBuffer = await file.arrayBuffer()
  const ocrText = await ocrFromPDF(arrayBuffer, (msg) => {
    onProgress?.(msg)
  })

  if (!ocrText || ocrText.trim().length < 10) {
    throw new Error('PDF 无法识别（无文本层且 OCR 未能识别出文字），请确认 PDF 内容清晰')
  }

  onProgress?.('OCR 识别完成，正在智能解析...')
  const data = parseResumeFromText(ocrText)
  return { data, rawText: ocrText, method: 'ocr' }
}

