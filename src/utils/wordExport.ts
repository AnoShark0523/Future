/**
 * Word 文档导出模块（新增模块，不修改任何现有代码）
 *
 * 功能：使用 docx 库将简历数据生成格式化的 .docx 文件，
 *       包含标题、联系方式、教育经历、工作经历、项目经历、技能等模块。
 *
 * 依赖：docx（已通过 npm install docx 安装）
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  TabStopType,
  TabStopPosition,
  ShadingType,
  type ISectionOptions,
} from 'docx'
import type { ResumeData } from './resumeTemplates'

// ==================== 样式常量 ====================

const FONT_FAMILY = '微软雅黑'
const FONT_FAMILY_EN = 'Microsoft YaHei'

// 主题色
const PRIMARY_COLOR = '2B579A'    // 深蓝
const ACCENT_COLOR = '4472C4'     // 中蓝
const TEXT_COLOR = '333333'       // 深灰
const LIGHT_COLOR = '666666'      // 中灰
const BORDER_COLOR = 'B4C7E7'     // 浅蓝边框

// ==================== 辅助函数 ====================

/**
 * 创建标题段落（姓名 + 职位）
 */
function createHeader(data: ResumeData): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const p = data.personal

  // 姓名标题
  if (p.name) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: p.name,
            bold: true,
            size: 36, // 18pt
            font: { name: FONT_FAMILY, hint: 'eastAsia' },
            color: PRIMARY_COLOR,
          }),
        ],
      })
    )
  }

  // 职位/头衔
  if (p.title) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: p.title,
            size: 24, // 12pt
            font: { name: FONT_FAMILY, hint: 'eastAsia' },
            color: ACCENT_COLOR,
          }),
        ],
      })
    )
  }

  // 分隔线
  paragraphs.push(
    new Paragraph({
      spacing: { after: 200 },
      border: {
        bottom: { color: BORDER_COLOR, space: 1, style: BorderStyle.SINGLE, size: 6 },
      },
      children: [],
    })
  )

  return paragraphs
}

/**
 * 创建联系方式段落
 */
function createContactInfo(data: ResumeData): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const p = data.personal

  const contacts: string[] = []
  if (p.phone) contacts.push(`电话：${p.phone}`)
  if (p.email) contacts.push(`邮箱：${p.email}`)
  if (p.location) contacts.push(`地址：${p.location}`)
  if (p.website) contacts.push(`网站：${p.website}`)
  if (p.github) contacts.push(`GitHub：${p.github}`)
  if (p.linkedin) contacts.push(`LinkedIn：${p.linkedin}`)

  if (contacts.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: contacts.join('  |  '),
            size: 18, // 9pt
            font: { name: FONT_FAMILY, hint: 'eastAsia' },
            color: LIGHT_COLOR,
          }),
        ],
      })
    )
  }

  // 个人简介
  if (p.summary) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 100, after: 200 },
        children: [
          new TextRun({
            text: p.summary,
            size: 20, // 10pt
            font: { name: FONT_FAMILY, hint: 'eastAsia' },
            color: TEXT_COLOR,
          }),
        ],
      })
    )
  }

  return paragraphs
}

/**
 * 创建模块标题（如"教育经历"、"工作经历"等）
 */
function createSectionTitle(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 300, after: 150 },
    shading: {
      type: ShadingType.SOLID,
      color: PRIMARY_COLOR,
      fill: PRIMARY_COLOR,
    },
    children: [
      new TextRun({
        text: `  ${title}`,
        bold: true,
        size: 24, // 12pt
        font: { name: FONT_FAMILY, hint: 'eastAsia' },
        color: 'FFFFFF',
      }),
    ],
  })
}

/**
 * 创建条目标题行（如公司名 + 日期）
 */
function createEntryTitle(left: string, right: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
    children: [
      new TextRun({
        text: left,
        bold: true,
        size: 22, // 11pt
        font: { name: FONT_FAMILY, hint: 'eastAsia' },
        color: TEXT_COLOR,
      }),
      new TextRun({ text: '\t', size: 22 }),
      new TextRun({
        text: right,
        size: 20, // 10pt
        font: { name: FONT_FAMILY, hint: 'eastAsia' },
        color: LIGHT_COLOR,
      }),
    ],
  })
}

/**
 * 创建条目副标题（如职位 + 专业）
 */
function createEntrySubtitle(text: string): Paragraph {
  if (!text) return new Paragraph({ children: [] })
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({
        text,
        size: 20, // 10pt
        font: { name: FONT_FAMILY, hint: 'eastAsia' },
        color: ACCENT_COLOR,
        italics: true,
      }),
    ],
  })
}

/**
 * 创建描述段落（支持多行）
 */
function createDescription(text: string): Paragraph {
  if (!text) return new Paragraph({ children: [] })

  // 按 \n 分割多行
  const lines = text.split('\n').filter((l) => l.trim())

  return new Paragraph({
    spacing: { after: 80 },
    children: lines.flatMap((line, idx) => {
      const runs: TextRun[] = []
      if (idx > 0) runs.push(new TextRun({ text: '', break: 1 }))
      runs.push(
        new TextRun({
          text: line,
          size: 20, // 10pt
          font: { name: FONT_FAMILY, hint: 'eastAsia' },
          color: TEXT_COLOR,
        })
      )
      return runs
    }),
  })
}

/**
 * 创建链接段落
 */
function createLinkParagraph(label: string, url: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: `${label}：`,
        size: 20,
        font: { name: FONT_FAMILY, hint: 'eastAsia' },
        color: LIGHT_COLOR,
      }),
      new TextRun({
        text: url,
        size: 20,
        font: { name: FONT_FAMILY, hint: 'eastAsia' },
        color: ACCENT_COLOR,
        underline: { type: 'single' as any },
      }),
    ],
  })
}

// ==================== 各模块生成 ====================

function buildSelfEvaluation(data: ResumeData): Paragraph[] {
  if (!data.selfEvaluation || !data.selfEvaluation.trim()) return []
  return [
    createSectionTitle('自我评价'),
    createDescription(data.selfEvaluation),
  ]
}

function buildEducation(data: ResumeData): Paragraph[] {
  if (!data.education || data.education.length === 0) return []
  const paragraphs: Paragraph[] = [createSectionTitle('教育经历')]

  for (const edu of data.education) {
    const dateRange = [edu.startDate, edu.endDate].filter(Boolean).join(' - ')
    const schoolLine = [edu.school, edu.degree ? `（${edu.degree}）` : ''].join('')
    paragraphs.push(createEntryTitle(schoolLine, dateRange))

    const subParts = [edu.major].filter(Boolean)
    if (subParts.length) paragraphs.push(createEntrySubtitle(subParts.join(' · ')))

    if (edu.description) paragraphs.push(createDescription(edu.description))
  }

  return paragraphs
}

function buildExperience(data: ResumeData): Paragraph[] {
  if (!data.experience || data.experience.length === 0) return []
  const paragraphs: Paragraph[] = [createSectionTitle('工作经历')]

  for (const exp of data.experience) {
    const dateRange = [exp.startDate, exp.endDate].filter(Boolean).join(' - ')
    paragraphs.push(createEntryTitle(exp.company || '', dateRange))

    if (exp.position) paragraphs.push(createEntrySubtitle(exp.position))

    if (exp.description) paragraphs.push(createDescription(exp.description))
  }

  return paragraphs
}

function buildProjects(data: ResumeData): Paragraph[] {
  if (!data.projects || data.projects.length === 0) return []
  const paragraphs: Paragraph[] = [createSectionTitle('项目经历')]

  for (const proj of data.projects) {
    const dateRange = [proj.startDate, proj.endDate].filter(Boolean).join(' - ')
    paragraphs.push(createEntryTitle(proj.name || '', dateRange))

    if (proj.role) paragraphs.push(createEntrySubtitle(proj.role))

    if (proj.description) paragraphs.push(createDescription(proj.description))

    if (proj.link) paragraphs.push(createLinkParagraph('项目链接', proj.link))
  }

  return paragraphs
}

function buildSkills(data: ResumeData): Paragraph[] {
  if (!data.skills || data.skills.length === 0) return []
  const paragraphs: Paragraph[] = [createSectionTitle('专业技能')]

  for (const cat of data.skills) {
    if (cat.skills && cat.skills.length > 0) {
      paragraphs.push(
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: `${cat.name}：`,
              bold: true,
              size: 20,
              font: { name: FONT_FAMILY, hint: 'eastAsia' },
              color: TEXT_COLOR,
            }),
            new TextRun({
              text: cat.skills.join('、'),
              size: 20,
              font: { name: FONT_FAMILY, hint: 'eastAsia' },
              color: TEXT_COLOR,
            }),
          ],
        })
      )
    }
  }

  return paragraphs
}

function buildCertifications(data: ResumeData): Paragraph[] {
  if (!data.certifications || data.certifications.length === 0) return []
  const paragraphs: Paragraph[] = [createSectionTitle('证书与荣誉')]

  for (const cert of data.certifications) {
    const dateRange = cert.date || ''
    paragraphs.push(createEntryTitle(cert.name || '', dateRange))

    const subParts = [cert.issuer].filter(Boolean)
    if (subParts.length) paragraphs.push(createEntrySubtitle(subParts.join(' · ')))

    if (cert.description) paragraphs.push(createDescription(cert.description))
  }

  return paragraphs
}

function buildLanguages(data: ResumeData): Paragraph[] {
  if (!data.languages || data.languages.length === 0) return []
  const paragraphs: Paragraph[] = [createSectionTitle('语言能力')]

  for (const lang of data.languages) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: `${lang.name}：`,
            bold: true,
            size: 20,
            font: { name: FONT_FAMILY, hint: 'eastAsia' },
            color: TEXT_COLOR,
          }),
          new TextRun({
            text: lang.proficiency,
            size: 20,
            font: { name: FONT_FAMILY, hint: 'eastAsia' },
            color: TEXT_COLOR,
          }),
        ],
      })
    )
  }

  return paragraphs
}

// ==================== 主导出函数 ====================

/**
 * 将简历数据导出为 Word 文档
 *
 * @param data 简历数据
 * @param filename 输出文件名（不含扩展名）
 * @returns Blob 对象，可直接用于下载
 */
export async function exportResumeToWord(
  data: ResumeData,
  filename: string = '简历'
): Promise<Blob> {
  // 组装所有段落
  const children: Paragraph[] = [
    ...createHeader(data),
    ...createContactInfo(data),
    ...buildSelfEvaluation(data),
    ...buildEducation(data),
    ...buildExperience(data),
    ...buildProjects(data),
    ...buildSkills(data),
    ...buildCertifications(data),
    ...buildLanguages(data),
  ]

  // 创建文档
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: { name: FONT_FAMILY, hint: 'eastAsia' },
            size: 20, // 10pt 默认
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,   // 0.5 inch
              bottom: 720,
              left: 720,
              right: 720,
            },
          },
        } as ISectionOptions['properties'],
        children,
      } as ISectionOptions,
    ],
  })

  // 生成 Blob
  const blob = await Packer.toBlob(doc)
  return blob
}

/**
 * 触发浏览器下载 Word 文件
 */
export function downloadWordBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
