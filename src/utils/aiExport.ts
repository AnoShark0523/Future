/**
 * AI 智能导出模块（新增模块，不修改任何现有代码）
 *
 * 功能：
 * 1. 调用大模型分析简历内容，给出优化建议
 * 2. 自动润色简历文案（自我评价、项目描述、工作经历）
 * 3. 优化后的数据传给现有 exportResumeToPDF 生成"完美 PDF"
 *
 * 核心理念：AI 负责内容质量，html2canvas+jsPDF 负责视觉排版
 */

import type { ResumeData } from './resumeTemplates'
import { getApiKey, getAiModel, hasApiKey } from './aiImport'

const API_ENDPOINT = 'https://api.siliconflow.cn/v1/chat/completions'

// ==================== 类型定义 ====================

export interface AIExportOptions {
  /** 是否润色文案（默认 true） */
  polishContent?: boolean
  /** 是否优化排版建议（默认 true） */
  optimizeLayout?: boolean
  /** 进度回调 */
  onProgress?: (msg: string) => void
}

export interface AIExportResult {
  /** 优化后的简历数据 */
  optimizedData: ResumeData
  /** AI 生成的优化说明 */
  suggestions: string[]
  /** 使用的模板 ID 建议（如果 AI 推荐了更合适的模板） */
  recommendedTemplate?: string
}

// ==================== Prompt 构建 ====================

function buildExportSystemPrompt(): string {
  return `审查并优化简历内容。只输出JSON，不要解释。

优化原则：保持真实不编造；口语化改专业表达；用STAR法则优化项目描述；删除冗余；保持长度不膨胀。

输出格式：{"optimizedData":{/*优化后的完整简历数据，结构与输入相同*/},"suggestions":["优化说明1","优化说明2"],"recommendedTemplate":""}`
}

function buildExportUserPrompt(data: ResumeData): string {
  return `优化以下简历。保持skills、education、联系方式不变，优化selfEvaluation、experience描述、projects描述、summary。

${JSON.stringify(data)}`
}

// ==================== API 调用 ====================

/**
 * AI 智能优化简历内容
 *
 * @param data 原始简历数据
 * @param options 导出选项
 * @returns 优化后的结果
 */
export async function optimizeResumeWithAI(
  data: ResumeData,
  options: AIExportOptions = {}
): Promise<AIExportResult> {
  const { polishContent = true, optimizeLayout = true, onProgress } = options

  if (!hasApiKey()) {
    throw new Error('未配置 API Key，请先在 AI 设置中填入硅基流动 API Key')
  }

  const apiKey = getApiKey()
  const model = getAiModel()

  onProgress?.(`正在调用 ${model} 分析简历...`)

  const systemPrompt = buildExportSystemPrompt()
  const userPrompt = buildExportUserPrompt(data)

  // 控制输入大小
  const maxInputChars = 15000
  const truncatedPrompt = userPrompt.length > maxInputChars
    ? userPrompt.substring(0, maxInputChars) + '\n[数据已截断]'
    : userPrompt

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: truncatedPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    let errMsg = `API 调用失败（HTTP ${response.status}）`
    if (response.status === 401) errMsg = 'API Key 无效，请检查密钥是否正确'
    else if (response.status === 402) errMsg = '账户余额不足，请充值'
    else if (response.status === 429) errMsg = '请求过于频繁，请稍后重试'
    else if (errText) errMsg += `: ${errText.substring(0, 200)}`
    throw new Error(errMsg)
  }

  const respData = await response.json()
  const content = respData?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('API 返回内容为空')
  }

  onProgress?.('AI 分析完成，正在整理优化结果...')

  // 提取 JSON
  const jsonStr = extractJsonFromResponse(content)
  if (!jsonStr) {
    throw new Error('AI 返回的内容不是有效的 JSON 格式')
  }

  const parsed = JSON.parse(jsonStr)

  // 合并优化结果
  const optimizedData = mergeOptimizedData(data, parsed.optimizedData || parsed)

  const suggestions: string[] = Array.isArray(parsed.suggestions)
    ? parsed.suggestions
    : []

  const recommendedTemplate = parsed.recommendedTemplate || undefined

  // 如果不需要润色，返回原始数据
  if (!polishContent) {
    return {
      optimizedData: data,
      suggestions,
      recommendedTemplate,
    }
  }

  return {
    optimizedData,
    suggestions,
    recommendedTemplate,
  }
}

// ==================== JSON 提取 ====================

function extractJsonFromResponse(content: string): string | null {
  let text = content.trim()

  // 去除 markdown 代码块
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim()
  }

  // 直接是 JSON 对象
  if (text.startsWith('{') && text.endsWith('}')) {
    return text
  }

  // 找到 JSON 对象
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1)
  }

  return null
}

// ==================== 数据合并 ====================

/**
 * 将 AI 优化后的数据与原始数据合并
 * 保留原始数据的基本信息，只更新文案内容
 */
function mergeOptimizedData(original: ResumeData, optimized: any): ResumeData {
  const result: ResumeData = JSON.parse(JSON.stringify(original))

  if (!optimized || typeof optimized !== 'object') return result

  // 合并 personal（只更新文案字段，不更新联系方式）
  if (optimized.personal) {
    if (optimized.personal.summary) result.personal.summary = optimized.personal.summary
    if (optimized.personal.title) result.personal.title = optimized.personal.title
  }

  // 合并 selfEvaluation
  if (typeof optimized.selfEvaluation === 'string' && optimized.selfEvaluation.trim()) {
    result.selfEvaluation = optimized.selfEvaluation
  }

  // 合并 experience（只更新 description）
  if (Array.isArray(optimized.experience)) {
    for (let i = 0; i < optimized.experience.length && i < result.experience.length; i++) {
      const optExp = optimized.experience[i]
      if (optExp && typeof optExp.description === 'string' && optExp.description.trim()) {
        result.experience[i].description = optExp.description
      }
      if (optExp && typeof optExp.position === 'string' && optExp.position.trim()) {
        result.experience[i].position = optExp.position
      }
    }
  }

  // 合并 projects（只更新 description）
  if (Array.isArray(optimized.projects)) {
    for (let i = 0; i < optimized.projects.length && i < result.projects.length; i++) {
      const optProj = optimized.projects[i]
      if (optProj && typeof optProj.description === 'string' && optProj.description.trim()) {
        result.projects[i].description = optProj.description
      }
      if (optProj && typeof optProj.role === 'string' && optProj.role.trim()) {
        result.projects[i].role = optProj.role
      }
    }
  }

  // 合并 certifications（只更新 description）
  if (Array.isArray(optimized.certifications)) {
    for (let i = 0; i < optimized.certifications.length && i < result.certifications.length; i++) {
      const optCert = optimized.certifications[i]
      if (optCert && typeof optCert.description === 'string' && optCert.description.trim()) {
        result.certifications[i].description = optCert.description
      }
    }
  }

  return result
}

// ==================== 导出辅助 ====================

/**
 * 检查 AI 导出是否可用
 */
export function canAIExport(): boolean {
  return hasApiKey()
}
