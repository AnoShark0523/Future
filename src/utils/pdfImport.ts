/**
 * PDF 导入解析工具
 * 使用 pdfjs-dist 提取 PDF 文本内容，并智能匹配到简历数据结构
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
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.1.200/pdf.worker.min.mjs`
  }

  return pdfjs
}

/**
 * 从 PDF 文件提取全部文本
 */
export async function extractTextFromPDF(file: File): Promise<string> {
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

  const pdfDoc = await loadingTask.promise
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

  return data
}

/**
 * 从 PDF 文件导入简历数据
 */
export async function importResumeFromPDF(file: File): Promise<ResumeData> {
  const text = await extractTextFromPDF(file)

  if (!text || text.trim().length < 10) {
    throw new Error('PDF 文件内容为空或无法提取文本（可能是扫描件）')
  }

  const data = parseResumeFromText(text)
  return data
}
