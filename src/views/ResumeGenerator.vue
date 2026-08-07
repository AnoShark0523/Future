<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useNotification } from '@/composables/useNotification'
import { useClipboard } from '@/composables/useClipboard'
import {
  type ResumeData,
  type EducationItem,
  type ExperienceItem,
  type ProjectItem,
  type SkillCategory,
  type CertItem,
  type LanguageItem,
  createEmptyResume,
  createSampleResume,
  exportMarkdown,
  genId
} from '@/utils/resumeTemplates'
import { importResumeFromPDF, ocrFromPDF, parseResumeFromText, extractTextFromPDF } from '@/utils/pdfImport'
import { exportResumeToPDF } from '@/utils/pdfExport'
import {
  resumeTemplateStyles,
  resumeTemplateCategories,
  getResumeTemplate,
  type ResumeTemplateStyle
} from '@/utils/resumeTemplateStyles'
import ResumePreview from '@/components/ResumePreview.vue'
import AISettingsPanel from '@/components/AISettingsPanel.vue'
import { parseResumeWithAI, parseResumeWithAIRobust, hasApiKey } from '@/utils/aiImport'
import { optimizeResumeWithAI, canAIExport } from '@/utils/aiExport'
import {
  User,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Wrench,
  Award,
  Languages,
  FileText,
  Download,
  Printer,
  Code2,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  Copy,
  Eye,
  Sparkles,
  LayoutTemplate,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Palette,
  ScanLine,
  Cpu,
  Settings,
  Sparkle,
  Info
} from 'lucide-vue-next'

const { notification, success, error } = useNotification()
const { copyToClipboard } = useClipboard()

// ==================== 状态 ====================

const resumeData = ref<ResumeData>(createEmptyResume())
const selectedTemplate = ref<string>('s1')
const showTemplateGallery = ref(false)
const templateCategory = ref('全部')
const activeSection = ref<string>('personal')
const previewScale = ref(75)

// 折叠面板状态
const expandedSections = ref<Record<string, boolean>>({
  personal: true,
  selfEvaluation: false,
  education: false,
  experience: false,
  projects: false,
  skills: false,
  certifications: false,
  languages: false
})

// 自动保存
const autoSaveKey = 'resume_generator_data'
const autoSaveTemplateKey = 'resume_generator_template'
const lastSaved = ref<string>('')

// Markdown 导出弹窗
const showMarkdownExport = ref(false)
const markdownContent = ref('')

// PDF 导入状态
const importingPDF = ref(false)
const importProgress = ref('')
const showOCRButton = ref(false)
const lastPDFFile = ref<File | null>(null)
const ocrInProgress = ref(false)

// PDF 导出状态
const exportingPDF = ref(false)
const exportProgress = ref('')
const exportPercent = ref(0)
const lastExportedBlob = ref<Blob | null>(null)

// ---- 新增：AI 导入状态 ----
const showAISettings = ref(false)
const aiImporting = ref(false)
const aiImportProgress = ref('')
const aiImportEnabled = ref(hasApiKey())
const aiExporting = ref(false)
const aiExportProgress = ref('')
const aiExportStep = ref(0)
const aiExportPercent = ref(0)
const aiExportEnabled = ref(canAIExport())

// ==================== 计算属性 ====================

const currentStyle = computed<ResumeTemplateStyle>(() =>
  getResumeTemplate(selectedTemplate.value)
)

const filteredTemplates = computed(() => {
  if (templateCategory.value === '全部') return resumeTemplateStyles
  return resumeTemplateStyles.filter(t => t.category === templateCategory.value)
})

// 是否有内容
const hasContent = computed(() => {
  const p = resumeData.value.personal
  return !!(p.name || p.title || p.email ||
    resumeData.value.education.length ||
    resumeData.value.experience.length ||
    resumeData.value.projects.length)
})

// ==================== 自动保存 ====================

let saveTimer: ReturnType<typeof setTimeout> | null = null

const autoSave = () => {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(autoSaveKey, JSON.stringify(resumeData.value))
      localStorage.setItem(autoSaveTemplateKey, selectedTemplate.value)
      lastSaved.value = new Date().toLocaleTimeString('zh-CN')
    } catch (e) {
      // 忽略存储错误
    }
  }, 500)
}

const loadSaved = () => {
  try {
    const saved = localStorage.getItem(autoSaveKey)
    if (saved) {
      const data = JSON.parse(saved)
      if (data && data.personal) {
        resumeData.value = data
      }
    }
    const savedTpl = localStorage.getItem(autoSaveTemplateKey)
    if (savedTpl && resumeTemplateStyles.some(t => t.id === savedTpl)) {
      selectedTemplate.value = savedTpl
    }
  } catch (e) {
    // 忽略
  }
}

// 监听数据变化自动保存
watch(resumeData, () => autoSave(), { deep: true })
watch(selectedTemplate, () => autoSave())

// ==================== CRUD 操作 ====================

const addEducation = () => {
  resumeData.value.education.push({
    id: genId(), school: '', major: '', degree: '',
    startDate: '', endDate: '', description: ''
  })
}

const addExperience = () => {
  resumeData.value.experience.push({
    id: genId(), company: '', position: '',
    startDate: '', endDate: '', description: ''
  })
}

const addProject = () => {
  resumeData.value.projects.push({
    id: genId(), name: '', role: '', link: '',
    startDate: '', endDate: '', description: ''
  })
}

const addSkillCategory = () => {
  resumeData.value.skills.push({
    id: genId(), name: '', skills: []
  })
}

const addSkill = (cat: SkillCategory) => {
  cat.skills.push('')
}

const addCertification = () => {
  resumeData.value.certifications.push({
    id: genId(), name: '', issuer: '', date: '', description: ''
  })
}

const addLanguage = () => {
  resumeData.value.languages.push({
    id: genId(), name: '', proficiency: ''
  })
}

// 通用删除和移动
const removeItem = <T extends { id: string }>(arr: T[], id: string) => {
  const idx = arr.findIndex(item => item.id === id)
  if (idx > -1) arr.splice(idx, 1)
}

const moveItem = <T extends { id: string }>(arr: T[], id: string, direction: 'up' | 'down') => {
  const idx = arr.findIndex(item => item.id === id)
  if (idx === -1) return
  if (direction === 'up' && idx > 0) {
    [arr[idx], arr[idx - 1]] = [arr[idx - 1], arr[idx]]
  } else if (direction === 'down' && idx < arr.length - 1) {
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
  }
}

const duplicateItem = <T extends { id: string }>(arr: T[], id: string) => {
  const idx = arr.findIndex(item => item.id === id)
  if (idx === -1) return
  const copy = { ...arr[idx], id: genId() }
  arr.splice(idx + 1, 0, copy)
}

// ==================== 数据操作 ====================

const loadSample = () => {
  if (hasContent.value) {
    if (!confirm('当前已有内容，加载示例将覆盖，确定吗？')) return
  }
  resumeData.value = createSampleResume()
  success('已加载示例数据')
}

const clearAll = () => {
  if (!confirm('确定要清空所有内容吗？此操作不可撤销。')) return
  resumeData.value = createEmptyResume()
  success('已清空所有内容')
}

const handleExportMarkdown = () => {
  markdownContent.value = exportMarkdown(resumeData.value)
  showMarkdownExport.value = true
}

const copyMarkdown = async () => {
  if (await copyToClipboard(markdownContent.value)) {
    success('Markdown 已复制到剪贴板')
  }
}

const downloadMarkdown = () => {
  const blob = new Blob([markdownContent.value], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${resumeData.value.personal.name || '简历'}.md`
  a.click()
  URL.revokeObjectURL(url)
  success('Markdown 文件已下载')
}

const exportJSON = () => {
  const json = JSON.stringify(resumeData.value, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${resumeData.value.personal.name || '简历'}.json`
  a.click()
  URL.revokeObjectURL(url)
  success('JSON 数据已下载')
}

const importJSON = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      let content = e.target?.result as string

      // 移除可能的BOM头和空白字符
      content = content.trim().replace(/^\uFEFF/, '')

      // 尝试解析JSON
      const data = JSON.parse(content)

      // 验证数据结构
      if (data && typeof data === 'object') {
        // 如果数据有personal字段，直接使用
        if (data.personal) {
          resumeData.value = data
          success('数据导入成功')
        } else {
          // 尝试作为完整数据结构处理
          try {
            // 检查是否有必要的字段结构
            const hasValidStructure = data.name !== undefined ||
                                       data.education !== undefined ||
                                       data.experience !== undefined

            if (hasValidStructure) {
              // 直接作为resumeData使用
              resumeData.value = {
                personal: data.personal || { name: data.name || '', title: '', gender: '', birthDate: '', photo: '', politicalStatus: '', ethnicity: '', phone: '', email: '', location: '', website: '', github: '', linkedin: '', englishLevel: '', summary: '' },
                selfEvaluation: data.selfEvaluation || '',
                education: data.education || [],
                experience: data.experience || [],
                projects: data.projects || [],
                skills: data.skills || [],
                certifications: data.certifications || [],
                languages: data.languages || []
              }
              success('数据导入成功')
            } else {
              error('文件格式不正确：缺少简历数据结构')
            }
          } catch {
            error('文件格式不正确')
          }
        }
      } else {
        error('文件内容为空或格式不正确')
      }
    } catch (parseError) {
      console.error('JSON解析错误:', parseError)
      error('解析失败，请确保文件是有效的JSON格式')
    }
  }

  reader.onerror = () => {
    error('文件读取失败')
  }

  reader.readAsText(file, 'UTF-8')
  input.value = ''
}

// PDF 导入（自动识别：元数据→文本提取→OCR，无需手动选择）
const importPDFFile = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (file.size > 10 * 1024 * 1024) {
    error('PDF 文件大小不能超过 10MB')
    input.value = ''
    return
  }

  importingPDF.value = true
  showOCRButton.value = false
  lastPDFFile.value = file
  importProgress.value = '正在解析 PDF 内容...'

  try {
    const { data, rawText, method, templateId } = await importResumeFromPDF(file, (msg) => {
      importProgress.value = msg
    })

    importProgress.value = '正在提取简历信息...'

    // 如果元数据中包含模板ID，恢复模板选择
    if (templateId && resumeTemplateStyles.some(t => t.id === templateId)) {
      selectedTemplate.value = templateId
    }

    // 检查有效字段数量
    let filledCount = 0
    if (data.personal.name) filledCount++
    if (data.personal.phone) filledCount++
    if (data.personal.email) filledCount++
    if (data.personal.title) filledCount++
    if (data.personal.gender) filledCount++
    if (data.personal.birthDate) filledCount++
    if (data.personal.location) filledCount++
    if (data.personal.summary) filledCount++
    if (data.selfEvaluation) filledCount++
    if (data.education.length) filledCount++
    if (data.experience.length) filledCount++
    if (data.skills.length) filledCount++
    if (data.projects.length) filledCount++

    // 根据导入方式生成提示信息
    const methodLabel = method === 'embeddedfile-v4' ? '（PDF附件无损恢复v4 · 100%精确）' :
                        method === 'metadata' ? '（元数据精确恢复，含模板）' :
                        method === 'ocr' ? '（OCR 自动识别）' :
                        method === 'text' ? '（文本提取）' : ''

    if (filledCount >= 3) {
      resumeData.value = data
      success(`PDF 导入成功${methodLabel}，已提取 ${filledCount} 项信息`)
    } else if (filledCount > 0) {
      // 提取到部分信息，同时把原始文本放到自我评价
      if (rawText && !data.selfEvaluation) {
        data.selfEvaluation = rawText.slice(0, 2000)
      }
      resumeData.value = data
      success(`PDF 导入部分成功${methodLabel}，已提取 ${filledCount} 项信息，原始文本已放入自我评价`)
    } else {
      // 完全没提取到结构化数据，把原始文本放到自我评价
      if (rawText && rawText.trim().length > 10) {
        resumeData.value = createEmptyResume()
        resumeData.value.selfEvaluation = rawText.slice(0, 3000)
        success(`PDF 文本已导入到自我评价${methodLabel}，请手动编辑各字段`)
      } else {
        error('未能从 PDF 提取任何内容，请确认 PDF 文件有效')
      }
    }
  } catch (err) {
    console.error('PDF 导入失败:', err)
    const msg = err instanceof Error ? err.message : '未知错误'
    error(`PDF 导入失败：${msg}`)
  } finally {
    importingPDF.value = false
    importProgress.value = ''
    input.value = ''
  }
}

// 手动触发 OCR 识别（用于扫描件）
const handleOCRImport = async () => {
  if (!lastPDFFile.value) return

  ocrInProgress.value = true
  importingPDF.value = true
  importProgress.value = '正在加载 OCR 引擎...'

  try {
    const arrayBuffer = await lastPDFFile.value.arrayBuffer()
    const text = await ocrFromPDF(arrayBuffer, (msg) => {
      importProgress.value = msg
    })

    if (!text || text.trim().length < 10) {
      error('OCR 未能识别出文字，请确认 PDF 内容清晰、分辨率足够。建议使用清晰扫描件或拍照件')
      return
    }

    importProgress.value = '正在智能提取简历信息...'
    const data = parseResumeFromText(text)

    // 检查有效字段数量
    let filledCount = 0
    if (data.personal.name) filledCount++
    if (data.personal.phone) filledCount++
    if (data.personal.email) filledCount++
    if (data.personal.title) filledCount++
    if (data.personal.gender) filledCount++
    if (data.personal.birthDate) filledCount++
    if (data.personal.location) filledCount++
    if (data.education.length) filledCount++
    if (data.experience.length) filledCount++
    if (data.skills.length) filledCount++
    if (data.projects.length) filledCount++

    if (filledCount >= 2) {
      // 成功提取到较多结构化信息
      if (!data.selfEvaluation) {
        // 将原始 OCR 文本存入个人简介，方便用户校对
        data.personal.summary = `（以下为 OCR 原始识别文本，请校对修正）\n${text.slice(0, 500)}`
      }
      resumeData.value = data
      success(`OCR 识别成功！已提取 ${filledCount} 项结构化信息，请检查并修正各字段`)
    } else if (filledCount >= 1) {
      // 提取到部分信息
      if (!data.selfEvaluation) {
        data.selfEvaluation = text.slice(0, 1500)
      }
      resumeData.value = data
      success(`OCR 识别部分成功，已提取 ${filledCount} 项信息，原始文本已放入自我评价供参考`)
    } else {
      // 未能提取结构化信息，但有 OCR 文本
      resumeData.value = createEmptyResume()
      resumeData.value.selfEvaluation = text.slice(0, 3000)
      success('OCR 已识别文本（放入自我评价），请手动编辑各字段。建议使用更清晰的扫描件重试')
    }

    showOCRButton.value = false
  } catch (err) {
    console.error('OCR 导入失败:', err)
    const msg = err instanceof Error ? err.message : '未知错误'
    error(`OCR 识别失败：${msg}`)
  } finally {
    ocrInProgress.value = false
    importingPDF.value = false
    importProgress.value = ''
  }
}

// ---- 新增：AI 智能导入 PDF ----
// 先用现有逻辑提取 PDF 文本，再调用 AI 大模型解析为结构化 JSON
// 不影响原有导入流程，作为独立的导入按钮使用
const handleAIImportPDF = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // 检查是否已配置 API Key
  if (!hasApiKey()) {
    error('请先点击"AI设置"按钮，配置硅基流动 API Key')
    input.value = ''
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    error('PDF 文件大小不能超过 10MB')
    input.value = ''
    return
  }

  aiImporting.value = true
  aiImportProgress.value = '正在提取 PDF 文本...'

  try {
    // Step 1: 提取 PDF 文本（复用现有逻辑）
    let text = ''
    try {
      text = await extractTextFromPDF(file)
    } catch {
      // 标准提取失败，尝试 OCR
      aiImportProgress.value = 'PDF 无文本层，正在启动 OCR...'
      const arrayBuffer = await file.arrayBuffer()
      text = await ocrFromPDF(arrayBuffer, (msg) => {
        aiImportProgress.value = msg
      })
    }

    if (!text || text.trim().length < 10) {
      error('PDF 无法提取文本内容，请确认文件有效')
      return
    }

    // Step 2: 调用 AI 解析（使用增强版，带重试和容错）
    aiImportProgress.value = '正在调用 AI 大模型解析简历...'
    const data = await parseResumeWithAIRobust(text, (msg) => {
      aiImportProgress.value = msg
    })

    // Step 3: 应用解析结果
    resumeData.value = data

    // 统计提取到的字段数
    let filledCount = 0
    if (data.personal.name) filledCount++
    if (data.personal.phone) filledCount++
    if (data.personal.email) filledCount++
    if (data.personal.title) filledCount++
    if (data.personal.photo) filledCount++
    if (data.education.length) filledCount++
    if (data.experience.length) filledCount++
    if (data.projects.length) filledCount++
    if (data.skills.length) filledCount++

    const hasPhoto = data.personal.photo ? '（含照片）' : ''
    success(`AI 智能导入成功${hasPhoto}！已提取 ${filledCount} 项信息（姓名、工作、项目、技能等全部识别）`)
  } catch (err) {
    console.error('AI 导入失败:', err)
    const msg = err instanceof Error ? err.message : '未知错误'
    error(`AI 导入失败：${msg}`)
  } finally {
    aiImporting.value = false
    aiImportProgress.value = ''
    input.value = ''
  }
}

// ---- 新增：打开 AI 设置面板 ----
const openAISettings = () => {
  showAISettings.value = true
}

// ---- 新增：关闭 AI 设置面板时刷新状态 ----
const handleCloseAISettings = () => {
  showAISettings.value = false
  aiImportEnabled.value = hasApiKey()
  aiExportEnabled.value = canAIExport()
}

// ---- 新增：AI 智能导出 PDF ----
// 流程：AI 优化内容 → 现有 html2canvas+jsPDF 生成 PDF → 嵌入数据
const handleAIExportPDF = async () => {
  if (!hasContent.value) return

  if (!hasApiKey()) {
    error('请先点击"AI设置"按钮，配置硅基流动 API Key')
    return
  }

  aiExporting.value = true
  aiExportStep.value = 0
  aiExportPercent.value = 0
  const t0 = Date.now()

  // 步骤定义：[步骤号, 起始百分比, 结束百分比, 步骤名]
  // Step 1: AI API 调用（0-55%，最慢）
  // Step 2: 应用优化结果（55-60%）
  // Step 3: 截图渲染 html2canvas（60-80%）
  // Step 4: 生成 PDF + 嵌入数据（80-95%）
  // Step 5: 保存文件（95-100%）
  const STEP_RANGES: Record<number, [number, number]> = {
    1: [0, 55],
    2: [55, 60],
    3: [60, 80],
    4: [80, 95],
    5: [95, 100],
  }
  const STEP_NAMES: Record<number, string> = {
    1: 'AI优化',
    2: '应用结果',
    3: '截图渲染',
    4: '生成PDF',
    5: '保存',
  }

  const log = (step: number, msg: string) => {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    aiExportStep.value = step
    const range = STEP_RANGES[step] || [0, 100]
    aiExportPercent.value = range[1]
    aiExportProgress.value = `[${elapsed}s] ${msg}`
    console.info(`[AI Export ${elapsed}s] Step ${step}/${STEP_NAMES[step]} (${range[1]}%): ${msg}`)
  }

  let tickTimer: ReturnType<typeof setInterval> | null = null

  try {
    // Step 1: AI 优化简历内容（最慢，主要瓶颈）
    // 启动计时器，每秒更新耗时显示，让用户知道正在工作
    let lastMsg = 'AI 正在优化文案内容（调用大模型，请耐心等待）...'
    tickTimer = setInterval(() => {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
      aiExportProgress.value = `[${elapsed}s] ${lastMsg}`
    }, 1000)

    log(1, lastMsg)
    const result = await optimizeResumeWithAI(resumeData.value, {
      polishContent: true,
      onProgress: (msg) => {
        lastMsg = msg
        log(1, msg)
      }
    })
    if (tickTimer) { clearInterval(tickTimer); tickTimer = null }

    // Step 2: 临时应用优化后的数据到预览
    log(2, '正在应用 AI 优化结果...')
    resumeData.value = result.optimizedData

    // 等待 Vue 响应式更新完成
    await new Promise(resolve => setTimeout(resolve, 300))

    // Step 3 & 4: 使用现有导出管线生成 PDF
    log(3, '正在截图渲染（html2canvas）...')
    const blob = await exportResumeToPDF(
      result.optimizedData,
      `${resumeData.value.personal.name || '简历'}_AI优化.pdf`,
      (msg: string) => {
        // 根据导出管线的进度消息映射到步骤
        if (msg.includes('截图') || msg.includes('渲染') || msg.includes('定位') || msg.includes('加载图片')) {
          log(3, msg)
        } else if (msg.includes('PDF') || msg.includes('嵌入') || msg.includes('文本')) {
          log(4, msg)
        } else {
          log(3, msg)
        }
      },
      selectedTemplate.value
    )

    // Step 5: 触发下载
    log(5, '正在保存文件...')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${resumeData.value.personal.name || '简历'}_AI优化.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    aiExportPercent.value = 100
    const totalTime = ((Date.now() - t0) / 1000).toFixed(1)
    let msg = `AI 智能导出成功！耗时 ${totalTime}s`
    if (result.suggestions.length > 0) {
      msg += `，优化了 ${result.suggestions.length} 项内容`
    }
    success(msg)
  } catch (err) {
    console.error('AI 导出失败:', err)
    const msg = err instanceof Error ? err.message : '未知错误'
    error(`AI 导出失败：${msg}`)
  } finally {
    if (tickTimer) clearInterval(tickTimer)
    aiExporting.value = false
    aiExportProgress.value = ''
    aiExportStep.value = 0
    aiExportPercent.value = 0
  }
}

// 导出 PDF（html2canvas + jsPDF，生成真实 PDF 文件，中文不乱码，嵌入数据可导入恢复）
const handleExportPDF = async () => {
  if (!hasContent.value) return

  exportingPDF.value = true
  exportPercent.value = 0
  const t0 = Date.now()
  const log = (step: string) => {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
    exportProgress.value = `[${elapsed}s] ${step}`
    // 根据进度消息映射百分比
    const msgPct: Record<string, number> = {
      '正在定位简历模板': 5,
      '正在加载图片资源': 10,
      '正在渲染简历': 15,
      '正在生成 PDF 文件': 65,
      '正在嵌入简历数据': 75,
      '正在写入文本层': 85,
      '正在嵌入简历数据（EmbeddedFile）': 90,
      '正在保存文件': 95,
    }
    let pct = 0
    for (const [key, val] of Object.entries(msgPct)) {
      if (step.includes(key)) { pct = val; break }
    }
    if (pct > 0) exportPercent.value = pct
    console.info(`[PDF Export ${elapsed}s] (${pct}%): ${step}`)
  }

  try {
    log('正在准备导出...')
    const blob = await exportResumeToPDF(
      resumeData.value,
      `${resumeData.value.personal.name || '简历'}.pdf`,
      (msg: string) => log(msg),
      selectedTemplate.value
    )

    // 触发浏览器下载
    log('正在保存文件...')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${resumeData.value.personal.name || '简历'}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    exportPercent.value = 100
    const totalTime = ((Date.now() - t0) / 1000).toFixed(1)
    success(`PDF 导出成功！耗时 ${totalTime}s，文件可被本项目导入恢复全部数据`)
  } catch (err) {
    console.error('PDF 导出失败:', err)
    const msg = err instanceof Error ? err.message : '未知错误'
    error(`PDF 导出失败：${msg}`)
  } finally {
    exportingPDF.value = false
    exportProgress.value = ''
    exportPercent.value = 0
  }
}

const handlePrint = () => {
  const resumeEl = document.querySelector('.resume-paper') as HTMLElement
  if (!resumeEl) {
    error('未找到简历内容')
    return
  }

  // 克隆简历元素
  const clonedResume = resumeEl.cloneNode(true) as HTMLElement
  clonedResume.style.transform = 'none'
  clonedResume.style.transformOrigin = 'top left'
  clonedResume.style.width = '210mm'
  clonedResume.style.margin = '0'
  clonedResume.style.boxShadow = 'none'

  // 获取当前页面所有样式
  const styles = document.querySelectorAll('style, link[rel="stylesheet"]')
  let styleHTML = ''
  styles.forEach(style => {
    styleHTML += style.outerHTML
  })

  // 创建打印HTML — 严格A4单页，zoom缩放防止分页
  const printHTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>简历</title>
  ${styleHTML}
  <style>
    @page { size: A4; margin: 0; }
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }
    #print-wrapper {
      width: 210mm;
      height: 297mm;
      overflow: hidden;
      position: relative;
    }
    .resume-paper {
      width: 210mm !important;
      min-height: 0 !important;
      height: 297mm !important;
      max-height: 297mm !important;
      overflow: hidden !important;
      margin: 0 !important;
      box-shadow: none !important;
      transform: none !important;
      transform-origin: top left !important;
    }
  </style>
</head>
<body>
  <div id="print-wrapper">
    ${clonedResume.outerHTML}
  </div>
</body>
</html>`

  // 创建离屏iframe（需可见尺寸才能正确渲染测量）
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-9999px'
  iframe.style.top = '0'
  iframe.style.width = '820px'
  iframe.style.height = '1200px'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
  if (!iframeDoc) {
    error('创建打印窗口失败')
    document.body.removeChild(iframe)
    return
  }

  iframeDoc.open()
  iframeDoc.write(printHTML)
  iframeDoc.close()

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe)
  }

  // 等待渲染完成后测量并缩放
  iframe.onload = () => {
    setTimeout(() => {
      const iDoc = iframe.contentDocument
      const iWin = iframe.contentWindow
      if (!iDoc || !iWin) { cleanup(); return }

      const resume = iDoc.querySelector('.resume-paper') as HTMLElement
      if (!resume) { cleanup(); return }

      // 测量实际内容高度
      const actualHeightPx = resume.scrollHeight
      const a4HeightPx = 297 * 96 / 25.4 // ≈ 1122.52px

      if (actualHeightPx > a4HeightPx) {
        // 使用 zoom 替代 transform: scale()
        // 原因：transform 不改变布局尺寸，浏览器打印引擎仍按原始高度分页
        //       zoom 会真正改变元素布局尺寸，打印时不会产生第二页
        const scale = a4HeightPx / actualHeightPx
        resume.style.zoom = String(scale)
      }

      // 等待缩放应用后打印
      setTimeout(() => {
        iWin.focus()
        iWin.print()
        setTimeout(cleanup, 2000)
      }, 300)
    }, 600)
  }

  // 备用：如果onload不触发
  setTimeout(() => {
    if (document.body.contains(iframe)) {
      const iWin = iframe.contentWindow
      const iDoc = iframe.contentDocument
      if (iDoc && iWin) {
        const resume = iDoc.querySelector('.resume-paper') as HTMLElement
        if (resume) {
          const actualHeightPx = resume.scrollHeight
          const a4HeightPx = 297 * 96 / 25.4
          if (actualHeightPx > a4HeightPx) {
            const scale = a4HeightPx / actualHeightPx
            resume.style.zoom = String(scale)
          }
        }
        iWin.focus()
        iWin.print()
        setTimeout(cleanup, 2000)
      } else {
        cleanup()
      }
    }
  }, 3000)
}

// 照片上传
const handlePhotoUpload = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    error('照片大小不能超过 2MB')
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    resumeData.value.personal.photo = e.target?.result as string
    success('照片上传成功')
  }
  reader.readAsDataURL(file)
}

const removePhoto = () => {
  resumeData.value.personal.photo = ''
}

// ==================== 折叠面板 ====================

const toggleSection = (section: string) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadSaved()
})
</script>

<template>
  <div class="container mx-auto px-4 py-6 max-w-[1600px]">
    <!-- 字数提示横幅 -->
    <div class="word-limit-banner">
      <span class="banner-icon">!</span>
      <span class="banner-text">
        <strong>注意：</strong>PDF 导出为单页 A4，请自行控制各模块字数。内容过多会导致排版拥挤或显示不全，建议精简描述、突出重点。可参考右侧预览效果调整。
      </span>
    </div>

    <!-- 标题栏 -->
    <div class="flex flex-wrap items-center justify-between mb-6 gap-4">
      <div>
        <h1 class="text-3xl font-bold gradient-text flex items-center gap-2">
          <FileText class="w-8 h-8" />
          简历生成器
        </h1>
        <p class="text-text-secondary text-sm mt-1">50 套精选模板 · 实时预览 · 多格式导出</p>
      </div>

      <div class="flex flex-wrap gap-2">
        <!-- 模板选择 -->
        <button
          @click="showTemplateGallery = true"
          class="px-4 py-2 rounded-lg glass hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
        >
          <LayoutTemplate class="w-4 h-4" />
          {{ currentStyle.name }}
          <Palette class="w-3 h-3" :style="{ color: currentStyle.primaryColor }" />
        </button>

        <!-- 示例数据 -->
        <button
          @click="loadSample"
          class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors flex items-center gap-2 text-sm"
        >
          <Sparkles class="w-4 h-4" />
          示例数据
        </button>

        <!-- 清空 -->
        <button
          @click="clearAll"
          class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-red-600/20 transition-colors flex items-center gap-2 text-sm"
        >
          <Trash2 class="w-4 h-4" />
          清空
        </button>

        <!-- 导出 Markdown -->
        <button
          @click="handleExportMarkdown"
          :disabled="!hasContent"
          class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors flex items-center gap-2 text-sm disabled:opacity-40"
        >
          <Code2 class="w-4 h-4" />
          Markdown
        </button>

        <!-- 导出 JSON -->
        <button
          @click="exportJSON"
          :disabled="!hasContent"
          class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors flex items-center gap-2 text-sm disabled:opacity-40"
        >
          <Download class="w-4 h-4" />
          JSON
        </button>

        <!-- 导入 JSON -->
        <label class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors flex items-center gap-2 text-sm cursor-pointer">
          <FolderGit2 class="w-4 h-4" />
          导入JSON
          <input type="file" accept=".json" @change="importJSON" class="hidden" />
        </label>

        <!-- 导入 PDF -->
        <label
          class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary transition-colors flex items-center gap-2 text-sm cursor-pointer disabled:opacity-40"
          :class="{ 'pointer-events-none opacity-50': importingPDF }"
        >
          <FileText v-if="!importingPDF" class="w-4 h-4" />
          <svg v-else class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ importingPDF ? (importProgress || '导入中...') : '导入PDF' }}
          <input type="file" accept=".pdf" @change="importPDFFile" class="hidden" :disabled="importingPDF" />
        </label>

        <!-- ---- 新增：AI 智能导入 PDF ---- -->
        <label
          class="px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 border border-purple-500/40 transition-colors flex items-center gap-2 text-sm cursor-pointer disabled:opacity-40"
          :class="{ 'pointer-events-none opacity-50': aiImporting }"
          :title="aiImportEnabled ? 'AI 智能导入（带重试容错），任何来源的 PDF 都能准确识别所有字段' : '请先点击右侧 AI设置 配置 API Key'"
        >
          <Cpu v-if="!aiImporting" class="w-4 h-4" />
          <svg v-else class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          {{ aiImporting ? (aiImportProgress || 'AI解析中...') : 'AI导入PDF' }}
          <input type="file" accept=".pdf" @change="handleAIImportPDF" class="hidden" :disabled="aiImporting" />
        </label>

        <!-- PDF 导入照片提醒 -->
        <span class="text-xs text-amber-400/80 flex items-center gap-1 ml-1" title="PDF 格式限制，照片需手动上传">
          <Info class="w-3.5 h-3.5" />
          导入PDF不会自动填充照片，请手动上传
        </span>

        <!-- ---- 新增：AI 设置按钮 ---- -->
        <button
          @click="openAISettings"
          class="px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 text-sm border"
          :class="aiImportEnabled
            ? 'bg-green-600/15 hover:bg-green-600/25 text-green-300 border-green-500/30'
            : 'bg-amber-600/15 hover:bg-amber-600/25 text-amber-300 border-amber-500/30 animate-pulse'"
          :title="aiImportEnabled ? 'AI 导入已配置，点击修改设置' : '点击配置 AI 导入（需要硅基流动 API Key）'"
        >
          <Settings class="w-4 h-4" />
          AI设置
          <span v-if="aiImportEnabled" class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
          <span v-else class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
        </button>

        <!-- 扫描件 OCR（仅当普通导入失败时显示） -->
        <button
          v-if="showOCRButton && !ocrInProgress"
          @click="handleOCRImport"
          class="px-4 py-2 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-600/40 transition-colors flex items-center gap-2 text-sm animate-pulse"
        >
          <ScanLine class="w-4 h-4" />
          扫描件 OCR
        </button>

        <!-- OCR 进行中提示 -->
        <div
          v-if="ocrInProgress"
          class="px-4 py-2 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-600/40 flex items-center gap-2 text-sm"
        >
          <ScanLine class="w-4 h-4 animate-pulse" />
          <span>{{ importProgress || 'OCR 处理中...' }}</span>
        </div>

        <!-- 导出 PDF（html2canvas + jsPDF，生成真实 PDF 文件，中文不乱码，嵌入数据可导入恢复） -->
        <button
          @click="handleExportPDF"
          :disabled="!hasContent || exportingPDF"
          class="gradient-btn !py-2 !px-4 disabled:opacity-40 flex items-center gap-2 text-sm whitespace-nowrap"
          title="生成真实 PDF 文件并下载，排版与预览一致，且可被本项目导入恢复全部数据"
        >
          <Download v-if="!exportingPDF" class="w-4 h-4 flex-shrink-0" />
          <span v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block flex-shrink-0"></span>
          {{ exportingPDF ? '导出中...' : '导出PDF' }}
        </button>

        <!-- AI 智能导出 PDF（AI优化内容 + 现有导出管线） -->
        <button
          @click="handleAIExportPDF"
          :disabled="!hasContent || aiExporting"
          class="gradient-btn !py-2 !px-4 disabled:opacity-40 flex items-center gap-2 text-sm whitespace-nowrap !from-purple-600 !to-indigo-600"
          :title="aiExportEnabled ? 'AI 自动优化文案后导出 PDF，内容更专业、排版更好' : '请先配置 AI 设置'"
        >
          <Sparkles v-if="!aiExporting" class="w-4 h-4 flex-shrink-0" />
          <span v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block flex-shrink-0"></span>
          {{ aiExporting ? 'AI优化中...' : 'AI智能导出' }}
        </button>

        <!-- 打印预览（浏览器打印，视觉保真） -->
        <button
          @click="handlePrint"
          :disabled="!hasContent"
          class="px-4 py-2 rounded-lg bg-bg-secondary hover:bg-bg-tertiary text-text-primary border border-border-color transition-colors flex items-center gap-2 text-sm"
          title="使用浏览器打印功能，视觉效果更好但导出的PDF可能无法导入"
        >
          <Printer class="w-4 h-4" />
          打印预览
        </button>
      </div>
    </div>

    <!-- AI 智能导出进度条 -->
    <div
      v-if="aiExporting"
      class="mb-3 rounded-xl overflow-hidden border border-purple-500/30 bg-purple-950/20"
    >
      <div class="px-4 py-3">
        <!-- 进度文本行 -->
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-purple-200 flex items-center gap-2 min-w-0">
            <span class="w-3.5 h-3.5 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin inline-block flex-shrink-0"></span>
            <span class="truncate">{{ aiExportProgress || 'AI优化中...' }}</span>
          </span>
          <span class="text-sm text-purple-300 font-mono font-bold flex-shrink-0 ml-2">{{ aiExportPercent }}%</span>
        </div>
        <!-- 进度条主体 -->
        <div class="h-2.5 rounded-full bg-purple-900/40 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 transition-all duration-500 ease-out relative overflow-hidden"
            :style="{ width: aiExportPercent + '%' }"
          >
            <!-- 流光动画 -->
            <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
          </div>
        </div>
        <!-- 步骤指示器 -->
        <div class="flex justify-between mt-2.5 text-[10px]">
          <div
            v-for="(name, idx) in ['AI优化', '应用结果', '截图渲染', '生成PDF', '保存']"
            :key="idx"
            class="flex flex-col items-center gap-0.5 flex-1"
          >
            <div
              class="w-2 h-2 rounded-full transition-colors duration-300"
              :class="aiExportStep > idx ? 'bg-purple-400' : (aiExportStep === idx + 1 ? 'bg-purple-400 animate-ping' : 'bg-purple-900/50')"
            ></div>
            <span
              class="transition-colors duration-300"
              :class="aiExportStep >= idx + 1 ? 'text-purple-300 font-medium' : 'text-purple-700'"
            >{{ name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 普通导出进度条 -->
    <div
      v-if="exportingPDF"
      class="mb-3 rounded-xl overflow-hidden border border-cyan-500/30 bg-cyan-950/20"
    >
      <div class="px-4 py-3">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-medium text-cyan-200 flex items-center gap-2 min-w-0">
            <span class="w-3.5 h-3.5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin inline-block flex-shrink-0"></span>
            <span class="truncate">{{ exportProgress || '导出中...' }}</span>
          </span>
          <span class="text-sm text-cyan-300 font-mono font-bold flex-shrink-0 ml-2">{{ exportPercent }}%</span>
        </div>
        <div class="h-2.5 rounded-full bg-cyan-900/40 overflow-hidden">
          <div
            class="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
            :style="{ width: exportPercent + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 自动保存状态 -->
    <div v-if="lastSaved" class="text-xs text-text-tertiary mb-3 flex items-center gap-1">
      <Save class="w-3 h-3" />
      自动保存于 {{ lastSaved }}
    </div>

    <!-- 主体：编辑 + 预览 -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- ============ 左侧编辑区 ============ -->
      <div class="space-y-3">
        <!-- 个人信息 -->
        <div class="glass rounded-xl overflow-hidden">
          <button
            @click="toggleSection('personal')"
            class="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <span class="flex items-center gap-2 font-semibold">
              <User class="w-4 h-4 text-primary" />
              个人信息
            </span>
            <component :is="expandedSections.personal ? ChevronDown : ChevronRight" class="w-4 h-4 text-text-tertiary" />
          </button>

          <div v-show="expandedSections.personal" class="px-5 pb-4 space-y-3">
            <!-- 照片上传 -->
            <div class="flex items-center gap-4 p-3 rounded-lg bg-bg-secondary">
              <div class="w-20 h-24 rounded-lg overflow-hidden bg-bg-tertiary flex items-center justify-center border-2 border-dashed border-white/20">
                <img v-if="resumeData.personal.photo" :src="resumeData.personal.photo" class="w-full h-full object-cover" />
                <User v-else class="w-8 h-8 text-text-tertiary" />
              </div>
              <div class="flex-1">
                <label class="text-xs text-text-tertiary mb-1 block">个人照片（选填）</label>
                <div class="flex gap-2">
                  <label class="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-xs cursor-pointer transition-colors">
                    上传照片
                    <input type="file" accept="image/*" @change="handlePhotoUpload" class="hidden" />
                  </label>
                  <button v-if="resumeData.personal.photo" @click="removePhoto" class="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-xs transition-colors">
                    移除
                  </button>
                </div>
                <p class="text-xs text-text-tertiary mt-1">建议尺寸 295×413px，大小不超过 2MB</p>
              </div>
            </div>

            <!-- 基本信息 -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-text-tertiary mb-1 block">姓名 <span class="text-red-400">*</span></label>
                <input v-model="resumeData.personal.name" placeholder="张三"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label class="text-xs text-text-tertiary mb-1 block">职位/头衔</label>
                <input v-model="resumeData.personal.title" placeholder="前端工程师"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label class="text-xs text-text-tertiary mb-1 block">性别</label>
                <select v-model="resumeData.personal.gender"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                  <option value="">不填</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-text-tertiary mb-1 block">出生年月</label>
                <input v-model="resumeData.personal.birthDate" type="month"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label class="text-xs text-text-tertiary mb-1 block">民族</label>
                <input v-model="resumeData.personal.ethnicity" placeholder="汉族"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label class="text-xs text-text-tertiary mb-1 block">政治面貌</label>
                <select v-model="resumeData.personal.politicalStatus"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                  <option value="">不填</option>
                  <option value="中共党员">中共党员</option>
                  <option value="中共预备党员">中共预备党员</option>
                  <option value="共青团员">共青团员</option>
                  <option value="民主党派">民主党派</option>
                  <option value="群众">群众</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-text-tertiary mb-1 block">电话</label>
                <input v-model="resumeData.personal.phone" placeholder="138-0000-0000"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label class="text-xs text-text-tertiary mb-1 block">邮箱</label>
                <input v-model="resumeData.personal.email" placeholder="email@example.com"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label class="text-xs text-text-tertiary mb-1 block">现居地</label>
                <input v-model="resumeData.personal.location" placeholder="上海市"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label class="text-xs text-text-tertiary mb-1 block">英语水平</label>
                <input v-model="resumeData.personal.englishLevel" placeholder="CET-6 / 雅思 7.0 / 流利"
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label class="text-xs text-text-tertiary mb-1 block">GitHub</label>
                <input v-model="resumeData.personal.github" placeholder="https://github.com/..."
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <div>
                <label class="text-xs text-text-tertiary mb-1 block">个人主页/博客</label>
                <input v-model="resumeData.personal.website" placeholder="https://..."
                  class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
            </div>
            <!-- 个人简介 -->
            <div>
              <label class="text-xs text-text-tertiary mb-1 block">个人简介</label>
              <textarea v-model="resumeData.personal.summary" rows="2" placeholder="简短介绍（如：5年前端开发经验，精通 Vue/React）..."
                class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"></textarea>
            </div>
          </div>
        </div>

        <!-- 自我评价 -->
        <div class="glass rounded-xl overflow-hidden">
          <button @click="toggleSection('selfEvaluation')" class="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
            <span class="flex items-center gap-2 font-semibold">
              <User class="w-4 h-4 text-primary" />
              自我评价
            </span>
            <component :is="expandedSections.selfEvaluation ? ChevronDown : ChevronRight" class="w-4 h-4 text-text-tertiary" />
          </button>
          <div v-show="expandedSections.selfEvaluation" class="px-5 pb-4">
            <textarea v-model="resumeData.selfEvaluation" rows="5" placeholder="自我评价：性格特点、核心能力、职业规划、团队协作能力等..."
              class="w-full px-3 py-2 rounded-lg bg-bg-secondary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"></textarea>
          </div>
        </div>

        <!-- 工作经历 -->
        <div class="glass rounded-xl overflow-hidden">
          <button @click="toggleSection('experience')" class="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
            <span class="flex items-center gap-2 font-semibold">
              <Briefcase class="w-4 h-4 text-primary" />
              工作经历
              <span v-if="resumeData.experience.length" class="text-xs bg-primary/20 px-2 py-0.5 rounded">{{ resumeData.experience.length }}</span>
            </span>
            <div class="flex items-center gap-2">
              <span @click.stop="addExperience" class="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 flex items-center gap-1">
                <Plus class="w-3 h-3" /> 添加
              </span>
              <component :is="expandedSections.experience ? ChevronDown : ChevronRight" class="w-4 h-4 text-text-tertiary" />
            </div>
          </button>
          <div v-show="expandedSections.experience" class="px-5 pb-4 space-y-3">
            <div v-for="(exp, idx) in resumeData.experience" :key="exp.id" class="p-3 rounded-lg bg-bg-secondary border border-white/5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-text-tertiary">#{{ idx + 1 }}</span>
                <div class="flex gap-1">
                  <button @click="moveItem(resumeData.experience, exp.id, 'up')" class="p-1 hover:bg-white/10 rounded" title="上移"><ArrowUp class="w-3 h-3" /></button>
                  <button @click="moveItem(resumeData.experience, exp.id, 'down')" class="p-1 hover:bg-white/10 rounded" title="下移"><ArrowDown class="w-3 h-3" /></button>
                  <button @click="duplicateItem(resumeData.experience, exp.id)" class="p-1 hover:bg-white/10 rounded" title="复制"><Copy class="w-3 h-3" /></button>
                  <button @click="removeItem(resumeData.experience, exp.id)" class="p-1 hover:bg-red-600/20 rounded text-red-400" title="删除"><Trash2 class="w-3 h-3" /></button>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 mb-2">
                <input v-model="exp.company" placeholder="公司名称" class="px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <input v-model="exp.position" placeholder="职位" class="px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <input v-model="exp.startDate" placeholder="2021-07" class="px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <input v-model="exp.endDate" placeholder="至今" class="px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
              </div>
              <textarea v-model="exp.description" rows="5" placeholder="工作描述（每行一条要点）..." class="w-full px-3 py-2 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y min-h-[100px]"></textarea>
            </div>
            <div v-if="!resumeData.experience.length" class="text-center py-4 text-text-tertiary text-sm">
              暂无工作经历，点击上方"添加"
            </div>
          </div>
        </div>

        <!-- 教育背景 -->
        <div class="glass rounded-xl overflow-hidden">
          <button @click="toggleSection('education')" class="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
            <span class="flex items-center gap-2 font-semibold">
              <GraduationCap class="w-4 h-4 text-primary" />
              教育背景
              <span v-if="resumeData.education.length" class="text-xs bg-primary/20 px-2 py-0.5 rounded">{{ resumeData.education.length }}</span>
            </span>
            <div class="flex items-center gap-2">
              <span @click.stop="addEducation" class="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 flex items-center gap-1">
                <Plus class="w-3 h-3" /> 添加
              </span>
              <component :is="expandedSections.education ? ChevronDown : ChevronRight" class="w-4 h-4 text-text-tertiary" />
            </div>
          </button>
          <div v-show="expandedSections.education" class="px-5 pb-4 space-y-3">
            <div v-for="(edu, idx) in resumeData.education" :key="edu.id" class="p-3 rounded-lg bg-bg-secondary border border-white/5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-text-tertiary">#{{ idx + 1 }}</span>
                <div class="flex gap-1">
                  <button @click="moveItem(resumeData.education, edu.id, 'up')" class="p-1 hover:bg-white/10 rounded"><ArrowUp class="w-3 h-3" /></button>
                  <button @click="moveItem(resumeData.education, edu.id, 'down')" class="p-1 hover:bg-white/10 rounded"><ArrowDown class="w-3 h-3" /></button>
                  <button @click="duplicateItem(resumeData.education, edu.id)" class="p-1 hover:bg-white/10 rounded"><Copy class="w-3 h-3" /></button>
                  <button @click="removeItem(resumeData.education, edu.id)" class="p-1 hover:bg-red-600/20 rounded text-red-400"><Trash2 class="w-3 h-3" /></button>
                </div>
              </div>
              <div class="space-y-2">
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="text-xs text-text-tertiary mb-0.5 block">学校名称</label>
                    <input v-model="edu.school" placeholder="清华大学" class="w-full px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label class="text-xs text-text-tertiary mb-0.5 block">专业</label>
                    <input v-model="edu.major" placeholder="计算机科学与技术" class="w-full px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="text-xs text-text-tertiary mb-0.5 block">学历</label>
                    <select v-model="edu.degree" class="w-full px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                      <option value="">请选择</option>
                      <option value="高中">高中</option>
                      <option value="中专">中专</option>
                      <option value="大专">大专</option>
                      <option value="本科">本科</option>
                      <option value="硕士">硕士</option>
                      <option value="博士">博士</option>
                    </select>
                  </div>
                  <div>
                    <label class="text-xs text-text-tertiary mb-0.5 block">入学时间</label>
                    <input v-model="edu.startDate" placeholder="2016-09" class="w-full px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label class="text-xs text-text-tertiary mb-0.5 block">毕业时间</label>
                    <input v-model="edu.endDate" placeholder="2020-06" class="w-full px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                </div>
                <div>
                  <label class="text-xs text-text-tertiary mb-0.5 block">在校经历（选填）</label>
                  <textarea v-model="edu.description" rows="3" placeholder="主修课程、获奖情况、社团活动等..." class="w-full px-3 py-2 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y min-h-[60px]"></textarea>
                </div>
              </div>
            </div>
            <div v-if="!resumeData.education.length" class="text-center py-4 text-text-tertiary text-sm">
              暂无教育背景，点击上方"添加"
            </div>
          </div>
        </div>

        <!-- 项目经验 -->
        <div class="glass rounded-xl overflow-hidden">
          <button @click="toggleSection('projects')" class="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
            <span class="flex items-center gap-2 font-semibold">
              <FolderGit2 class="w-4 h-4 text-primary" />
              项目经验
              <span v-if="resumeData.projects.length" class="text-xs bg-primary/20 px-2 py-0.5 rounded">{{ resumeData.projects.length }}</span>
            </span>
            <div class="flex items-center gap-2">
              <span @click.stop="addProject" class="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 flex items-center gap-1">
                <Plus class="w-3 h-3" /> 添加
              </span>
              <component :is="expandedSections.projects ? ChevronDown : ChevronRight" class="w-4 h-4 text-text-tertiary" />
            </div>
          </button>
          <div v-show="expandedSections.projects" class="px-5 pb-4 space-y-3">
            <div v-for="(proj, idx) in resumeData.projects" :key="proj.id" class="p-3 rounded-lg bg-bg-secondary border border-white/5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs text-text-tertiary">#{{ idx + 1 }}</span>
                <div class="flex gap-1">
                  <button @click="moveItem(resumeData.projects, proj.id, 'up')" class="p-1 hover:bg-white/10 rounded"><ArrowUp class="w-3 h-3" /></button>
                  <button @click="moveItem(resumeData.projects, proj.id, 'down')" class="p-1 hover:bg-white/10 rounded"><ArrowDown class="w-3 h-3" /></button>
                  <button @click="duplicateItem(resumeData.projects, proj.id)" class="p-1 hover:bg-white/10 rounded"><Copy class="w-3 h-3" /></button>
                  <button @click="removeItem(resumeData.projects, proj.id)" class="p-1 hover:bg-red-600/20 rounded text-red-400"><Trash2 class="w-3 h-3" /></button>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-2 mb-2">
                <input v-model="proj.name" placeholder="项目名称" class="px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <input v-model="proj.role" placeholder="角色（选填）" class="px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <input v-model="proj.link" placeholder="项目链接（选填）" class="px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <div class="grid grid-cols-2 gap-2">
                  <input v-model="proj.startDate" placeholder="2022-03" class="px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  <input v-model="proj.endDate" placeholder="2022-12" class="px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                </div>
              </div>
              <textarea v-model="proj.description" rows="5" placeholder="项目描述..." class="w-full px-3 py-2 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-y min-h-[100px]"></textarea>
            </div>
            <div v-if="!resumeData.projects.length" class="text-center py-4 text-text-tertiary text-sm">
              暂无项目经验，点击上方"添加"
            </div>
          </div>
        </div>

        <!-- 专业技能 -->
        <div class="glass rounded-xl overflow-hidden">
          <button @click="toggleSection('skills')" class="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
            <span class="flex items-center gap-2 font-semibold">
              <Wrench class="w-4 h-4 text-primary" />
              专业技能
              <span v-if="resumeData.skills.length" class="text-xs bg-primary/20 px-2 py-0.5 rounded">{{ resumeData.skills.length }}</span>
            </span>
            <div class="flex items-center gap-2">
              <span @click.stop="addSkillCategory" class="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 flex items-center gap-1">
                <Plus class="w-3 h-3" /> 添加分类
              </span>
              <component :is="expandedSections.skills ? ChevronDown : ChevronRight" class="w-4 h-4 text-text-tertiary" />
            </div>
          </button>
          <div v-show="expandedSections.skills" class="px-5 pb-4 space-y-3">
            <div v-for="cat in resumeData.skills" :key="cat.id" class="p-3 rounded-lg bg-bg-secondary border border-white/5">
              <div class="flex items-center gap-2 mb-2">
                <input v-model="cat.name" placeholder="分类名称（如：前端框架）" class="flex-1 px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                <button @click="addSkill(cat)" class="px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 text-xs flex items-center gap-1"><Plus class="w-3 h-3" />技能</button>
                <button @click="removeItem(resumeData.skills, cat.id)" class="p-1 hover:bg-red-600/20 rounded text-red-400"><Trash2 class="w-3 h-3" /></button>
              </div>
              <div class="flex flex-wrap gap-2">
                <div v-for="(skill, sIdx) in cat.skills" :key="sIdx" class="flex items-center gap-1">
                  <input v-model="cat.skills[sIdx]" placeholder="技能名称" class="w-32 px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  <button @click="cat.skills.splice(sIdx, 1)" class="p-1 hover:bg-red-600/20 rounded text-red-400"><X class="w-3 h-3" /></button>
                </div>
              </div>
            </div>
            <div v-if="!resumeData.skills.length" class="text-center py-4 text-text-tertiary text-sm">
              暂无技能，点击上方"添加分类"
            </div>
          </div>
        </div>

        <!-- 获奖证书 + 语言能力 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <!-- 证书 -->
          <div class="glass rounded-xl overflow-hidden">
            <button @click="toggleSection('certifications')" class="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
              <span class="flex items-center gap-2 font-semibold text-sm">
                <Award class="w-4 h-4 text-primary" />
                证书
              </span>
              <div class="flex items-center gap-2">
                <span @click.stop="addCertification" class="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 flex items-center gap-1">
                  <Plus class="w-3 h-3" />
                </span>
                <component :is="expandedSections.certifications ? ChevronDown : ChevronRight" class="w-4 h-4 text-text-tertiary" />
              </div>
            </button>
            <div v-show="expandedSections.certifications" class="px-5 pb-4 space-y-2">
              <div v-for="cert in resumeData.certifications" :key="cert.id" class="p-2 rounded bg-bg-secondary space-y-1.5">
                <div class="flex items-center gap-2">
                  <input v-model="cert.name" placeholder="证书名称" class="flex-1 px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none" />
                  <button @click="removeItem(resumeData.certifications, cert.id)" class="p-1 text-red-400 hover:bg-red-600/20 rounded"><X class="w-3 h-3" /></button>
                </div>
                <div class="grid grid-cols-2 gap-1.5">
                  <input v-model="cert.issuer" placeholder="颁发机构" class="px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none" />
                  <input v-model="cert.date" placeholder="2022-08" class="px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none" />
                </div>
              </div>
              <div v-if="!resumeData.certifications.length" class="text-center py-3 text-text-tertiary text-xs">暂无</div>
            </div>
          </div>

          <!-- 语言 -->
          <div class="glass rounded-xl overflow-hidden">
            <button @click="toggleSection('languages')" class="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
              <span class="flex items-center gap-2 font-semibold text-sm">
                <Languages class="w-4 h-4 text-primary" />
                语言
              </span>
              <div class="flex items-center gap-2">
                <span @click.stop="addLanguage" class="text-xs px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 flex items-center gap-1">
                  <Plus class="w-3 h-3" />
                </span>
                <component :is="expandedSections.languages ? ChevronDown : ChevronRight" class="w-4 h-4 text-text-tertiary" />
              </div>
            </button>
            <div v-show="expandedSections.languages" class="px-5 pb-4 space-y-2">
              <div v-for="lang in resumeData.languages" :key="lang.id" class="p-2 rounded bg-bg-secondary space-y-1.5">
                <div class="flex items-center gap-2">
                  <input v-model="lang.name" placeholder="语言" class="flex-1 px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none" />
                  <button @click="removeItem(resumeData.languages, lang.id)" class="p-1 text-red-400 hover:bg-red-600/20 rounded"><X class="w-3 h-3" /></button>
                </div>
                <input v-model="lang.proficiency" placeholder="熟练度（如：CET-6 / 精通 / 熟练）" class="w-full px-3 py-1.5 rounded bg-bg-tertiary text-white text-sm focus:outline-none" />
              </div>
              <div v-if="!resumeData.languages.length" class="text-center py-3 text-text-tertiary text-xs">暂无</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============ 右侧预览区 ============ -->
      <div class="lg:sticky lg:top-4 lg:self-start">
        <div class="glass rounded-xl p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold flex items-center gap-2">
              <Eye class="w-4 h-4 text-primary" />
              实时预览
            </span>
            <div class="flex items-center gap-2">
              <select v-model.number="previewScale" class="px-2 py-1 rounded bg-bg-secondary text-white text-xs focus:outline-none">
                <option :value="50">50%</option>
                <option :value="75">75%</option>
                <option :value="100">100%</option>
              </select>
              <span class="text-xs text-text-tertiary">{{ currentStyle.name }}</span>
            </div>
          </div>

          <!-- 预览容器 -->
          <div class="bg-gray-300 rounded-lg p-2 overflow-auto flex justify-center" style="max-height: 80vh;">
            <ResumePreview
              :data="resumeData"
              :style="currentStyle"
              :scale="previewScale"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 模板选择弹窗 ============ -->
    <div v-if="showTemplateGallery" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" @click.self="showTemplateGallery = false">
      <div class="glass rounded-2xl p-6 max-w-6xl w-full mx-4 max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold gradient-text flex items-center gap-2">
            <LayoutTemplate class="w-5 h-5" />
            选择模板（{{ resumeTemplateStyles.length }} 套）
          </h2>
          <button @click="showTemplateGallery = false" class="p-2 hover:bg-white/10 rounded-lg">
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- 分类筛选 -->
        <div class="flex flex-wrap gap-2 mb-4 border-b border-white/10 pb-3">
          <button
            v-for="cat in resumeTemplateCategories"
            :key="cat"
            @click="templateCategory = cat"
            :class="`px-3 py-1.5 rounded-full text-xs transition-all ${
              templateCategory === cat ? 'bg-primary text-white' : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary'
            }`"
          >
            {{ cat }}
          </button>
        </div>

        <!-- 模板列表 -->
        <div class="overflow-auto flex-1">
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div
              v-for="tpl in filteredTemplates"
              :key="tpl.id"
              @click="selectedTemplate = tpl.id; showTemplateGallery = false"
              :class="`p-3 rounded-xl cursor-pointer transition-all border-2 ${
                selectedTemplate === tpl.id ? 'border-primary bg-primary/10' : 'border-transparent bg-bg-secondary hover:bg-bg-tertiary'
              }`"
            >
              <div
                class="aspect-[3/4] rounded-lg flex flex-col items-center justify-center mb-2 p-3 text-center"
                :style="{ background: `linear-gradient(135deg, ${tpl.primaryColor}22, ${tpl.primaryColor}44)` }"
              >
                <LayoutTemplate class="w-10 h-10 mb-2" :style="{ color: tpl.primaryColor }" />
                <div class="text-[10px] px-2 py-0.5 rounded-full" :style="{ background: tpl.primaryColor, color: tpl.lightText }">
                  {{ tpl.category }}
                </div>
              </div>
              <div class="font-semibold text-sm truncate">{{ tpl.name }}</div>
              <div class="text-xs text-text-tertiary mt-0.5 line-clamp-2" style="min-height: 2.5em;">{{ tpl.description }}</div>
            </div>
          </div>
          <div class="mt-4 text-center text-xs text-text-tertiary">
            共 {{ filteredTemplates.length }} 套模板
          </div>
        </div>
      </div>
    </div>

    <!-- ============ Markdown 导出弹窗 ============ -->
    <div v-if="showMarkdownExport" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60" @click.self="showMarkdownExport = false">
      <div class="glass rounded-2xl p-6 max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold gradient-text flex items-center gap-2">
            <Code2 class="w-5 h-5" />
            Markdown 导出
          </h2>
          <div class="flex gap-2">
            <button @click="copyMarkdown" class="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-sm">复制</button>
            <button @click="downloadMarkdown" class="px-3 py-1.5 rounded-lg bg-primary/20 hover:bg-primary/30 text-sm">下载</button>
            <button @click="showMarkdownExport = false" class="p-2 hover:bg-white/10 rounded-lg">
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>
        <pre class="flex-1 overflow-auto p-4 rounded-lg bg-bg-secondary text-text-primary text-sm font-mono whitespace-pre-wrap">{{ markdownContent }}</pre>
      </div>
    </div>

    <!-- 通知 -->
    <div
      v-if="notification"
      :class="`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg transition-all ${
        notification.type === 'success' ? 'bg-green-600 text-white' :
        notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
      }`"
    >
      {{ notification.message }}
    </div>

    <!-- ---- 新增：AI 设置面板 ---- -->
    <AISettingsPanel :show="showAISettings" @close="handleCloseAISettings" />
  </div>
</template>

<style scoped>
/* 组件局部样式 */

/* 字数提示横幅 */
.word-limit-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 18px;
  margin-bottom: 16px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.08));
  border: 1.5px solid rgba(251, 191, 36, 0.35);
  box-shadow: 0 2px 12px rgba(245, 158, 11, 0.1);
}
.banner-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f59e0b;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}
.banner-text {
  font-size: 13.5px;
  color: #d97706;
  line-height: 1.5;
}
.banner-text strong {
  color: #b45309;
}
</style>
