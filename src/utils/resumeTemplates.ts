/**
 * 简历生成器 - 数据类型与模板渲染
 */

// ==================== 数据类型定义 ====================

export interface PersonalInfo {
  name: string
  title: string
  gender: string         // 性别
  birthDate: string      // 出生年月
  photo: string          // 照片（base64 data URL）
  politicalStatus: string // 政治面貌
  ethnicity: string      // 民族
  phone: string
  email: string
  location: string
  website: string
  github: string
  linkedin: string
  englishLevel: string   // 英语水平
  summary: string        // 个人简介/自我简介（和姓名同级，简短）
}

export interface SelfEvaluation {
  id: string
  content: string        // 自我评价内容
}

export interface EducationItem {
  id: string
  school: string
  major: string
  degree: string
  startDate: string
  endDate: string
  description: string
}

export interface ExperienceItem {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
}

export interface ProjectItem {
  id: string
  name: string
  role: string
  link: string
  startDate: string
  endDate: string
  description: string
}

export interface SkillCategory {
  id: string
  name: string
  skills: string[]  // 技能名称列表，如 ['Vue 3', 'React', 'TypeScript']
}

export interface CertItem {
  id: string
  name: string
  issuer: string
  date: string
  description: string
}

export interface LanguageItem {
  id: string
  name: string
  proficiency: string // 如：母语、流利、熟练、基础
}

export interface ResumeData {
  personal: PersonalInfo
  selfEvaluation: string   // 自我评价（独立模块，和工作经历同级）
  education: EducationItem[]
  experience: ExperienceItem[]
  projects: ProjectItem[]
  skills: SkillCategory[]
  certifications: CertItem[]
  languages: LanguageItem[]
}

export type TemplateId = 'modern' | 'classic' | 'minimal' | 'creative'

export interface TemplateInfo {
  id: TemplateId
  name: string
  description: string
  icon: string
}

export const templates: TemplateInfo[] = [
  { id: 'modern', name: '现代简约', description: '双栏布局，侧边栏深色', icon: '🏠' },
  { id: 'classic', name: '经典商务', description: '单栏居中，传统正式', icon: '📋' },
  { id: 'minimal', name: '极简风格', description: '大量留白，聚焦内容', icon: '⚪' },
  { id: 'creative', name: '创意双色', description: '彩色横幅，进度条技能', icon: '🎨' }
]

// ==================== 工具函数 ====================

let idCounter = 0
export function genId(): string {
  return `r${Date.now()}${idCounter++}`
}

export function createEmptyResume(): ResumeData {
  return {
    personal: {
      name: '',
      title: '',
      gender: '',
      birthDate: '',
      photo: '',
      politicalStatus: '',
      ethnicity: '',
      phone: '',
      email: '',
      location: '',
      website: '',
      github: '',
      linkedin: '',
      englishLevel: '',
      summary: ''
    },
    selfEvaluation: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    languages: []
  }
}

export function createSampleResume(): ResumeData {
  return {
    personal: {
      name: '张明轩',
      title: '高级前端工程师',
      gender: '男',
      birthDate: '1994-05',
      photo: '',
      politicalStatus: '中共党员',
      ethnicity: '汉族',
      phone: '138-0000-0000',
      email: 'zhangmx@example.com',
      location: '上海市浦东新区',
      website: 'https://zhangmx.dev',
      github: 'https://github.com/zhangmx',
      linkedin: 'https://linkedin.com/in/zhangmx',
      englishLevel: 'CET-6（580分）',
      summary: '5年前端开发经验，精通 Vue/React，专注性能优化与工程化。'
    },
    selfEvaluation: '性格沉稳，抗压能力强，对技术有持续的热情和追求。具备良好的沟通能力和团队协作精神，能够快速适应新环境和新挑战。在工作中注重细节，追求卓越，善于总结和分享技术经验。主导过多个大型项目从 0 到 1 的搭建，具备丰富的技术管理经验。',
    education: [
      {
        id: genId(),
        school: '上海交通大学',
        major: '计算机科学与技术',
        degree: '硕士',
        startDate: '2016-09',
        endDate: '2019-06',
        description: 'GPA 3.8/4.0，获学业一等奖学金。研究方向：前端性能优化。'
      },
      {
        id: genId(),
        school: '同济大学',
        major: '软件工程',
        degree: '学士',
        startDate: '2012-09',
        endDate: '2016-06',
        description: '专业排名前 5%，任学生会技术部部长。'
      }
    ],
    experience: [
      {
        id: genId(),
        company: '字节跳动',
        position: '高级前端工程师',
        startDate: '2021-07',
        endDate: '至今',
        description: '负责飞书文档核心模块开发，主导编辑器性能优化项目。\n引入微前端架构，将首屏加载时间从 3.2s 降至 1.1s。\n带领 4 人小组完成表格协同编辑功能，日活用户 50 万+。'
      },
      {
        id: genId(),
        company: '蚂蚁集团',
        position: '前端工程师',
        startDate: '2019-07',
        endDate: '2021-06',
        description: '参与蚂蚁云控制台开发，维护 20+ 业务模块。\n设计并实现通用组件库，覆盖 80% 业务场景。\n推动 TypeScript 全面落地，代码缺陷率下降 40%。'
      }
    ],
    projects: [
      {
        id: genId(),
        name: '飞书文档协同编辑器',
        role: '前端负责人',
        link: 'https://feishu.cn',
        startDate: '2022-03',
        endDate: '2022-12',
        description: '基于 CRDT 算法实现实时协同编辑，支持百人同时在线。架构设计、核心算法实现、性能调优全程参与。'
      },
      {
        id: genId(),
        name: '通用组件库 Helios-UI',
        role: '维护者',
        link: 'https://github.com/zhangmx/helios-ui',
        startDate: '2020-01',
        endDate: '2021-06',
        description: 'Vue 3 + TypeScript 组件库，含 60+ 组件，周下载量 8000+。'
      }
    ],
    skills: [
      {
        id: genId(),
        name: '前端框架',
        skills: ['Vue 3', 'React', 'TypeScript']
      },
      {
        id: genId(),
        name: '工程化',
        skills: ['Vite', 'Webpack', 'CI/CD']
      },
      {
        id: genId(),
        name: '其他',
        skills: ['Node.js', 'Canvas/WebGL', 'Python']
      }
    ],
    certifications: [
      {
        id: genId(),
        name: 'PMP 项目管理认证',
        issuer: 'PMI',
        date: '2022-08',
        description: '项目管理专业人士资格认证'
      },
      {
        id: genId(),
        name: 'AWS Solutions Architect',
        issuer: 'Amazon Web Services',
        date: '2021-05',
        description: 'AWS 解决方案架构师助理级认证'
      }
    ],
    languages: [
      { id: genId(), name: '中文', proficiency: '母语' },
      { id: genId(), name: '英语', proficiency: '流利（CET-6）' },
      { id: genId(), name: '日语', proficiency: '基础（N3）' }
    ]
  }
}

// ==================== Markdown 导出 ====================

export function exportMarkdown(data: ResumeData): string {
  const p = data.personal
  let md = `# ${p.name}\n\n`
  md += `**${p.title}**\n\n`

  // 基本信息
  const basics: string[] = []
  if (p.gender) basics.push(`性别：${p.gender}`)
  if (p.birthDate) basics.push(`出生年月：${p.birthDate}`)
  if (p.ethnicity) basics.push(`民族：${p.ethnicity}`)
  if (p.politicalStatus) basics.push(`政治面貌：${p.politicalStatus}`)
  if (basics.length) md += basics.join(' | ') + '\n\n'

  const contacts: string[] = []
  if (p.phone) contacts.push(`📱 ${p.phone}`)
  if (p.email) contacts.push(`📧 ${p.email}`)
  if (p.location) contacts.push(`📍 ${p.location}`)
  if (p.englishLevel) contacts.push(`🔤 英语：${p.englishLevel}`)
  if (p.website) contacts.push(`🌐 ${p.website}`)
  if (p.github) contacts.push(`💻 ${p.github}`)
  if (p.linkedin) contacts.push(`💼 ${p.linkedin}`)
  if (contacts.length) md += contacts.join(' | ') + '\n\n'
  md += '---\n\n'

  if (p.summary) {
    md += `## 个人简介\n\n${p.summary}\n\n`
  }

  if (data.selfEvaluation) {
    md += `## 自我评价\n\n${data.selfEvaluation}\n\n`
  }

  if (data.experience.length) {
    md += `## 工作经历\n\n`
    data.experience.forEach(e => {
      md += `### ${e.position} | ${e.company}\n`
      md += `*${e.startDate} - ${e.endDate}*\n\n`
      if (e.description) md += `${e.description.replace(/\n/g, '\n')}\n\n`
    })
  }

  if (data.education.length) {
    md += `## 教育背景\n\n`
    data.education.forEach(e => {
      md += `### ${e.degree} · ${e.major}\n`
      md += `**${e.school}** | *${e.startDate} - ${e.endDate}*\n\n`
      if (e.description) md += `${e.description}\n\n`
    })
  }

  if (data.projects.length) {
    md += `## 项目经验\n\n`
    data.projects.forEach(p => {
      md += `### ${p.name}${p.role ? ' | ' + p.role : ''}\n`
      const meta: string[] = []
      if (p.startDate) meta.push(`*${p.startDate} - ${p.endDate}*`)
      if (p.link) meta.push(`🔗 [${p.link}](${p.link})`)
      if (meta.length) md += meta.join(' | ') + '\n\n'
      if (p.description) md += `${p.description}\n\n`
    })
  }

  if (data.skills.length) {
    md += `## 专业技能\n\n`
    data.skills.forEach(cat => {
      md += `**${cat.name}**: ${cat.skills.join('、')}\n\n`
    })
  }

  if (data.certifications.length) {
    md += `## 获奖证书\n\n`
    data.certifications.forEach(c => {
      md += `- **${c.name}** - ${c.issuer} (${c.date})\n`
    })
    md += '\n'
  }

  if (data.languages.length) {
    md += `## 语言能力\n\n`
    data.languages.forEach(l => {
      md += `- ${l.name}: ${l.proficiency}\n`
    })
  }

  return md
}
