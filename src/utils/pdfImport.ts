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
 * 通用键值对提取
 * 支持 "关键词：值"、"关键词: 值"、"关键词 值"、"关键词　值"（全角空格）
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
 */
function normalizeDate(s: string): string {
  let d = s.trim()
  d = d.replace(/年/g, '-').replace(/月/g, '').replace(/日/g, '').replace(/\./g, '-')
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

  // ============ 提取姓名 ============
  const nameVal = findValue(cleanText, ['姓名', 'Name', 'Full Name'])
  if (nameVal) {
    // 清理可能的多余信息
    data.personal.name = nameVal.split(/\s+/)[0].replace(/[（(].*$/, '')
  } else {
    // 没有明确标记，取前几行中最像姓名的
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      const line = lines[i]
      // 跳过纯数字、符号、过长行
      if (/^[\d\s\W|\/]+$/.test(line)) continue
      if (line.length > 20) continue
      if (/[:：]/.test(line)) continue
      // 跳过包含明显简历关键词的行
      if (/简历|RESUME|CV|Curriculum/i.test(line)) continue
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
      // 英文名
      if (/^[A-Z][a-z]+\s[A-Z][a-z]+$/.test(line)) {
        data.personal.name = line
        break
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
  // 先用关键词找
  const phoneVal = findValue(cleanText, ['手机', '电话', '联系方式', '联系电话', 'Phone', 'Tel', 'Mobile', 'Cell'])
  if (phoneVal) {
    data.personal.phone = phoneVal.replace(/[^\d\-\+]/g, '')
  } else {
    // 直接在全文搜索手机号
    const phoneMatch = cleanText.match(/1[3-9]\d{1}[\s\-]?\d{4}[\s\-]?\d{4}/)
    if (phoneMatch) data.personal.phone = phoneMatch[0]
  }

  // ============ 提取邮箱 ============
  const emailVal = findValue(cleanText, ['邮箱', '电子邮箱', 'E-mail', 'Email', 'E-mail地址'])
  if (emailVal) {
    data.personal.email = emailVal.replace(/\s/g, '')
  } else {
    const emailMatch = cleanText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)
    if (emailMatch) data.personal.email = emailMatch[0]
  }

  // ============ 提取性别 ============
  const genderVal = findValue(cleanText, ['性别', 'Gender'])
  if (genderVal) {
    const m = genderVal.match(/男|女/)
    if (m) data.personal.gender = m[0]
  }

  // ============ 提取出生年月 ============
  const birthVal = findValue(cleanText, ['出生年月', '出生日期', '生日', '出生', 'Birth', 'Birthday', 'Date of Birth'])
  if (birthVal) {
    data.personal.birthDate = normalizeDate(birthVal)
  } else {
    // 尝试匹配 "1994年5月" 或 "1994-05" 格式
    const birthMatch = cleanText.match(/(\d{4}[\-/年]\d{1,2}[\-/月]?)/)
    if (birthMatch && !data.personal.birthDate) {
      data.personal.birthDate = normalizeDate(birthMatch[1])
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
  const englishVal = findValue(cleanText, ['英语水平', '英语', '外语水平', '外语', 'English', 'English Level'])
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

  // ============ 提取教育背景 ============
  const eduSection = extractSection(cleanText, ['教育背景', '教育经历', '学历', 'Education', 'Educational Background'])
  if (eduSection) {
    const eduLines = eduSection.split('\n').filter(l => l.trim())
    let currentEdu: EducationItem | null = null

    for (const line of eduLines) {
      // 匹配日期范围
      const dateRange = line.match(/(\d{4}[\./\-年]\d{1,2})\s*(?:[-–—至到~—])\s*(\d{4}[\./\-年]\d{1,2}|至今|现在|present|Present)/i)

      if (dateRange) {
        if (currentEdu) data.education.push(currentEdu)
        currentEdu = {
          id: genId(), school: '', major: '', degree: '',
          startDate: normalizeDate(dateRange[1]),
          endDate: normalizeDate(dateRange[2]),
          description: ''
        }
        // 从同一行提取学校
        const schoolMatch = line.match(/([\u4e00-\u9fa5]{2,}(?:大学|学院|学校|研究院|研究所|理工大学))|(?:University|Institute|College|School)\s+of\s+[\w\s]+/i)
        if (schoolMatch) currentEdu.school = schoolMatch[0]
        // 从同一行提取学位
        const degreeMatch = line.match(/(博士|硕士|学士|本科|大专|专科|MBA|PhD|Master|Bachelor)/i)
        if (degreeMatch) currentEdu.degree = degreeMatch[1]
      } else if (currentEdu) {
        // 匹配学校名
        if (!currentEdu.school) {
          const schoolMatch = line.match(/([\u4e00-\u9fa5]{2,}(?:大学|学院|学校|研究院|研究所|理工大学))|(?:University|Institute|College|School)\s+of\s+[\w\s]+/i)
          if (schoolMatch) {
            currentEdu.school = schoolMatch[0]
            continue
          }
        }
        // 匹配学位
        if (!currentEdu.degree) {
          const degreeMatch = line.match(/(博士|硕士|学士|本科|大专|专科|MBA|PhD|Master|Bachelor)/i)
          if (degreeMatch) {
            currentEdu.degree = degreeMatch[1]
            // 同行可能有专业
            const majorMatch = line.match(/([\u4e00-\u9fa5]{2,}(?:专业|工程|科学|技术|管理|经济|文学|艺术|设计|教育))/)
            if (majorMatch) currentEdu.major = majorMatch[0]
            continue
          }
        }
        // 匹配专业
        if (!currentEdu.major) {
          const majorMatch = line.match(/(?:专业|方向|Major|Specialization|Department)\s*[:：]?\s*([\u4e00-\u9fa5\w（）()]+)/i)
          if (majorMatch) {
            currentEdu.major = majorMatch[1].trim()
            continue
          }
          // 如果短行不含数字，可能是专业
          if (line.length < 25 && !/[\d]/.test(line) && !currentEdu.major) {
            const majorKw = line.match(/([\u4e00-\u9fa5]{2,}(?:专业|工程|科学|技术|管理|经济|文学|艺术|设计|教育))/)
            if (majorKw) {
              currentEdu.major = majorKw[0]
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
