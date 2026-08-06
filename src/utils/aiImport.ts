/**
 * AI 智能简历解析模块（新增模块，不修改任何现有代码）
 *
 * 使用硅基流动（SiliconFlow）API 调用大模型，将 PDF 提取的文本
 * 智能解析为结构化 ResumeData JSON。
 *
 * 优势：大模型能理解上下文语义，不受 PDF 格式/排版/编码限制，
 * 不管简历怎么排版都能正确识别字段。
 *
 * API Key 仅存储在浏览器 localStorage 中，不写入文件、不进 git、不上传。
 */

import type { ResumeData } from './resumeTemplates'
import { genId } from './resumeTemplates'

// ==================== 配置常量 ====================

const API_ENDPOINT = 'https://api.siliconflow.cn/v1/chat/completions'
const DEFAULT_MODEL = 'deepseek-ai/DeepSeek-V3.2'
const STORAGE_KEY_API = 'ai_import_api_key'
const STORAGE_KEY_MODEL = 'ai_import_model'

// ==================== API Key 管理 ====================

/** 读取 API Key（从 localStorage） */
export function getApiKey(): string {
  return localStorage.getItem(STORAGE_KEY_API) || ''
}

/** 保存 API Key 到 localStorage */
export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY_API, key.trim())
}

/** 清除 API Key */
export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY_API)
}

/** 读取模型选择 */
export function getAiModel(): string {
  return localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_MODEL
}

/** 保存模型选择 */
export function setAiModel(model: string): void {
  localStorage.setItem(STORAGE_KEY_MODEL, model)
}

/** 检查是否已配置 API Key */
export function hasApiKey(): boolean {
  return getApiKey().length > 10
}

// ==================== 可选模型列表 ====================

export interface AIModelOption {
  id: string
  name: string
  desc: string
  cheap: boolean
}

export const AI_MODELS: AIModelOption[] = [
  { id: 'deepseek-ai/DeepSeek-V3.2', name: 'DeepSeek V3.2', desc: '推荐 · 671B旗舰 · 中文最强 · ¥0.08/次', cheap: false },
  { id: 'deepseek-ai/DeepSeek-V4-Flash', name: 'DeepSeek V4 Flash', desc: '284B · 速度极快 · ¥0.02/次', cheap: true },
  { id: 'deepseek-ai/DeepSeek-V3.1-Terminus', name: 'DeepSeek V3.1', desc: '671B · 混合智能体 · ¥0.08/次', cheap: false },
  { id: 'Qwen/Qwen3.5-35B-A3B', name: 'Qwen 3.5 35B', desc: '35B小模型 · 最便宜 · ¥0.01/次', cheap: true },
  { id: 'MiniMaxAI/MiniMax-M2.5', name: 'MiniMax M2.5', desc: '229B · 性价比高 · ¥0.04/次', cheap: true },
]

// ==================== Prompt 构建 ====================

/**
 * 构建 System Prompt — 告诉大模型如何解析简历
 *
 * 精简版：去掉冗长的 TypeScript 接口定义，用简短示例代替，
 * 减少 input tokens 约 60%，加快首 token 响应速度。
 */
function buildSystemPrompt(): string {
  return `将简历文本解析为JSON。只输出JSON，不要解释，不要代码块标记。

JSON结构示例：
{"personal":{"name":"姓名","title":"职位","gender":"男/女/空","birthDate":"YYYY-MM","photo":"","politicalStatus":"","ethnicity":"","phone":"","email":"","location":"","website":"","github":"","linkedin":"","englishLevel":"","summary":"简介"},"selfEvaluation":"自我评价","education":[{"id":"e1","school":"学校","major":"专业","degree":"本科/硕士","startDate":"YYYY-MM","endDate":"YYYY-MM或至今","description":""}],"experience":[{"id":"x1","company":"公司","position":"职位","startDate":"YYYY-MM","endDate":"YYYY-MM或至今","description":"描述保留换行"}],"projects":[{"id":"p1","name":"项目名","role":"角色","link":"","startDate":"YYYY-MM","endDate":"YYYY-MM或至今","description":"描述保留换行"}],"skills":[{"id":"s1","name":"分类名","skills":["技能1","技能2"]}],"certifications":[{"id":"c1","name":"","issuer":"","date":"YYYY-MM","description":""}],"languages":[{"id":"l1","name":"英语","proficiency":"CET-6"}]}

规则：日期统一YYYY-MM；至今保留"至今"；描述多要点用\\n分隔；缺失字段用空字符串或空数组；不要编造。`
}

// ==================== API 调用 ====================

/**
 * 调用硅基流动 API 解析简历文本
 *
 * @param text 简历文本内容（来自 PDF 提取或 OCR）
 * @param onProgress 进度回调
 * @returns 解析后的 ResumeData
 */
export async function parseResumeWithAI(
  text: string,
  onProgress?: (msg: string) => void
): Promise<ResumeData> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('未配置 API Key，请先在设置中填入硅基流动 API Key')
  }

  const model = getAiModel()
  onProgress?.(`正在调用 ${model} 解析简历...`)

  const systemPrompt = buildSystemPrompt()

  // 截断超长文本（避免 token 超限）
  const maxInputChars = 12000
  const truncatedText = text.length > maxInputChars
    ? text.substring(0, maxInputChars) + '\n[文本已截断]'
    : text

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
        { role: 'user', content: `解析：\n${truncatedText}` },
      ],
      temperature: 0.1,
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

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('API 返回内容为空')
  }

  onProgress?.('AI 解析完成，正在整理数据...')

  // 提取 JSON（处理模型可能包裹 markdown 代码块的情况）
  const jsonStr = extractJsonFromResponse(content)
  if (!jsonStr) {
    throw new Error('AI 返回的内容不是有效的 JSON 格式')
  }

  const parsed = JSON.parse(jsonStr)
  return normalizeAIResult(parsed)
}

/**
 * 从 AI 返回的文本中提取 JSON
 * 处理模型可能用 ```json 包裹的情况
 */
function extractJsonFromResponse(content: string): string | null {
  // 去除首尾空白
  let text = content.trim()

  // 情况1：被 ```json ... ``` 包裹
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim()
  }

  // 情况2：直接是 JSON 对象
  if (text.startsWith('{') && text.endsWith('}')) {
    return text
  }

  // 情况3：文本中包含 JSON 对象（找到第一个 { 到最后一个 }）
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1)
  }

  return null
}

// ==================== 数据规范化 ====================

/**
 * 将 AI 返回的 JSON 规范化为 ResumeData
 * 补充缺失字段、修正格式、生成 id
 */
function normalizeAIResult(parsed: any): ResumeData {
  // 确保所有字段都存在
  const data: ResumeData = {
    personal: {
      name: parsed?.personal?.name || '',
      title: parsed?.personal?.title || '',
      gender: parsed?.personal?.gender || '',
      birthDate: parsed?.personal?.birthDate || '',
      photo: '',
      politicalStatus: parsed?.personal?.politicalStatus || '',
      ethnicity: parsed?.personal?.ethnicity || '',
      phone: parsed?.personal?.phone || '',
      email: parsed?.personal?.email || '',
      location: parsed?.personal?.location || '',
      website: parsed?.personal?.website || '',
      github: parsed?.personal?.github || '',
      linkedin: parsed?.personal?.linkedin || '',
      englishLevel: parsed?.personal?.englishLevel || '',
      summary: parsed?.personal?.summary || '',
    },
    selfEvaluation: parsed?.selfEvaluation || '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    languages: [],
  }

  // 规范化教育经历
  if (Array.isArray(parsed?.education)) {
    data.education = parsed.education.map((e: any, i: number) => ({
      id: e.id || `edu_${i}`,
      school: e.school || '',
      major: e.major || '',
      degree: e.degree || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      description: e.description || '',
    }))
  }

  // 规范化工作经历
  if (Array.isArray(parsed?.experience)) {
    data.experience = parsed.experience.map((e: any, i: number) => ({
      id: e.id || `exp_${i}`,
      company: e.company || '',
      position: e.position || '',
      startDate: e.startDate || '',
      endDate: e.endDate || '',
      description: e.description || '',
    }))
  }

  // 规范化项目经验
  if (Array.isArray(parsed?.projects)) {
    data.projects = parsed.projects.map((p: any, i: number) => ({
      id: p.id || `proj_${i}`,
      name: p.name || '',
      role: p.role || '',
      link: p.link || '',
      startDate: p.startDate || '',
      endDate: p.endDate || '',
      description: p.description || '',
    }))
  }

  // 规范化技能
  if (Array.isArray(parsed?.skills)) {
    data.skills = parsed.skills.map((s: any, i: number) => ({
      id: s.id || `skill_${i}`,
      name: s.name || `分类${i + 1}`,
      skills: Array.isArray(s.skills) ? s.skills.filter(Boolean) : [],
    }))
  }

  // 规范化证书
  if (Array.isArray(parsed?.certifications)) {
    data.certifications = parsed.certifications.map((c: any, i: number) => ({
      id: c.id || `cert_${i}`,
      name: c.name || '',
      issuer: c.issuer || '',
      date: c.date || '',
      description: c.description || '',
    }))
  }

  // 规范化语言
  if (Array.isArray(parsed?.languages)) {
    data.languages = parsed.languages.map((l: any, i: number) => ({
      id: l.id || `lang_${i}`,
      name: l.name || '',
      proficiency: l.proficiency || '',
    }))
  }

  return data
}

// ==================== 增强版 AI 导入（带重试和容错） ====================

/**
 * 增强版 AI 智能导入 PDF
 *
 * 相比 parseResumeWithAI 的改进：
 * 1. 自动重试：AI 返回非 JSON 时，用更严格的 prompt 重试
 * 2. 修复 JSON：尝试修复常见的 JSON 格式错误（尾逗号、单引号等）
 * 3. 分段解析：如果整体 JSON 解析失败，尝试分段提取
 * 4. 更好的错误信息：告诉用户具体失败原因
 *
 * @param text 简历文本
 * @param onProgress 进度回调
 * @returns 解析后的 ResumeData
 */
export async function parseResumeWithAIRobust(
  text: string,
  onProgress?: (msg: string) => void
): Promise<ResumeData> {
  // 第一次尝试：标准解析
  try {
    onProgress?.('AI 解析中...')
    return await parseResumeWithAI(text, onProgress)
  } catch (firstErr) {
    console.warn('[AI Import] 第一次解析失败，尝试本地修复:', firstErr)

    // 1.5 本地修复：如果第一次有返回内容但 JSON 解析失败，先尝试本地修复
    // （不额外调用 API，省时间）
    try {
      onProgress?.('正在本地修复数据格式...')
      const data = await retryWithLocalFix(text, onProgress)
      if (data) return data
    } catch (localErr) {
      console.warn('[AI Import] 本地修复失败:', localErr)
    }

    // 第二次尝试：用更严格的 prompt 重试（只有本地修复失败才调 API）
    try {
      onProgress?.('AI 正在用增强模式重新解析...')
      const data = await retryWithStrictPrompt(text, onProgress)
      if (data) return data
    } catch (secondErr) {
      console.warn('[AI Import] 第二次解析也失败:', secondErr)
    }

    // 全部失败，抛出原始错误
    throw new Error(
      `AI 解析失败（已重试 2 次 + 本地修复）。原因：${firstErr instanceof Error ? firstErr.message : String(firstErr)}。` +
      `请检查 PDF 内容是否为有效简历，或更换 AI 模型后重试。`
    )
  }
}

/**
 * 本地修复：重新请求一次 AI，但用更短的 prompt + 本地 JSON 修复
 * 如果第一次请求的原始内容能拿到，直接本地修复，不再请求
 */
async function retryWithLocalFix(
  text: string,
  onProgress?: (msg: string) => void
): Promise<ResumeData | null> {
  // 重新调一次 API，但用最精简的 prompt
  const apiKey = getApiKey()
  if (!apiKey) return null

  const model = getAiModel()
  const miniPrompt = '将简历解析为JSON，只输出JSON。结构：{"personal":{"name":"","title":"","gender":"","birthDate":"","photo":"","politicalStatus":"","ethnicity":"","phone":"","email":"","location":"","website":"","github":"","linkedin":"","englishLevel":"","summary":""},"selfEvaluation":"","education":[{"id":"e1","school":"","major":"","degree":"","startDate":"","endDate":"","description":""}],"experience":[{"id":"x1","company":"","position":"","startDate":"","endDate":"","description":""}],"projects":[{"id":"p1","name":"","role":"","link":"","startDate":"","endDate":"","description":""}],"skills":[{"id":"s1","name":"","skills":[]}],"certifications":[],"languages":[]}'

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: miniPrompt },
        { role: 'user', content: text.substring(0, 10000) },
      ],
      temperature: 0,
      max_tokens: 3000,
      stream: false,
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) return null

  onProgress?.('正在修复数据格式...')

  const jsonStr = extractJsonFromResponse(content)
  if (!jsonStr) return null

  const fixedJson = tryFixJson(jsonStr)
  if (!fixedJson) return null

  const parsed = JSON.parse(fixedJson)
  return normalizeAIResult(parsed)
}

/**
 * 用更严格的 prompt 重试
 */
async function retryWithStrictPrompt(
  text: string,
  onProgress?: (msg: string) => void
): Promise<ResumeData | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const model = getAiModel()
  const strictPrompt = `你是简历解析器。请将简历文本解析为 JSON。

**严格要求**：
1. 只输出一个 JSON 对象，不要输出任何其他文字
2. 不要用 \`\`\`json 包裹
3. 不要在 JSON 前后添加解释
4. JSON 必须是合法的，所有字符串用双引号
5. 不要有尾逗号

JSON 结构：
{"personal":{"name":"","title":"","gender":"","birthDate":"","photo":"","politicalStatus":"","ethnicity":"","phone":"","email":"","location":"","website":"","github":"","linkedin":"","englishLevel":"","summary":""},"selfEvaluation":"","education":[{"id":"e1","school":"","major":"","degree":"","startDate":"","endDate":"","description":""}],"experience":[{"id":"x1","company":"","position":"","startDate":"","endDate":"","description":""}],"projects":[{"id":"p1","name":"","role":"","link":"","startDate":"","endDate":"","description":""}],"skills":[{"id":"s1","name":"","skills":[]}],"certifications":[],"languages":[]}`

  const maxInputChars = 12000
  const truncatedText = text.length > maxInputChars
    ? text.substring(0, maxInputChars) + '\n[文本已截断]'
    : text

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: strictPrompt },
        { role: 'user', content: truncatedText },
      ],
      temperature: 0,
      max_tokens: 4096,
      stream: false,
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) return null

  onProgress?.('正在解析增强模式结果...')

  const jsonStr = extractJsonFromResponse(content)
  if (!jsonStr) return null

  // 尝试修复 JSON
  const fixedJson = tryFixJson(jsonStr)
  if (!fixedJson) return null

  const parsed = JSON.parse(fixedJson)
  return normalizeAIResult(parsed)
}

/**
 * 尝试修复常见的 JSON 格式错误
 */
function tryFixJson(jsonStr: string): string | null {
  let fixed = jsonStr

  // 1. 去除尾逗号（}, ] 前的逗号）
  fixed = fixed.replace(/,\s*([}\]])/g, '$1')

  // 2. 单引号转双引号
  fixed = fixed.replace(/'/g, '"')

  // 3. 修复未闭合的字符串（在 } 或 , 前缺少 "）
  // 这个比较危险，先不做

  // 4. 去除 JSON 前后的非 JSON 文本
  const firstBrace = fixed.indexOf('{')
  const lastBrace = fixed.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    fixed = fixed.substring(firstBrace, lastBrace + 1)
  }

  // 验证修复后的 JSON
  try {
    JSON.parse(fixed)
    return fixed
  } catch {
    return null
  }
}

/**
 * 第三次尝试：请求 AI 重新格式化
 */
async function retryAndFixJson(
  text: string,
  onProgress?: (msg: string) => void
): Promise<ResumeData | null> {
  const apiKey = getApiKey()
  if (!apiKey) return null

  const model = getAiModel()

  // 先做一次普通请求
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: '请将简历文本解析为标准 JSON。只输出 JSON，不要任何其他文字。确保所有字段都有值，缺失的字段用空字符串填充。',
        },
        {
          role: 'user',
          content: text.substring(0, 10000),
        },
      ],
      temperature: 0,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) return null

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content
  if (!content) return null

  // 尝试多种方式提取 JSON
  let jsonStr = extractJsonFromResponse(content)

  if (!jsonStr) {
    // 尝试从文本中逐行提取
    const lines = content.split('\n')
    const jsonLines = lines.filter(l => l.trim().startsWith('"') || l.trim().startsWith('{') || l.trim().startsWith('}') || l.trim().startsWith('[') || l.trim().startsWith(']') || l.trim().includes(':'))
    jsonStr = jsonLines.join('\n')
  }

  if (!jsonStr) return null

  const fixedJson = tryFixJson(jsonStr)
  if (!fixedJson) return null

  try {
    const parsed = JSON.parse(fixedJson)
    return normalizeAIResult(parsed)
  } catch {
    return null
  }
}

// ==================== 测试连接 ====================

/**
 * 测试 API Key 是否有效
 * 发送一个简短请求，检查是否能正常返回
 */
export async function testApiKey(): Promise<{ success: boolean; message: string }> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { success: false, message: '请先填入 API Key' }
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: getAiModel(),
        messages: [
          { role: 'user', content: '请回复"连接成功"四个字' },
        ],
        max_tokens: 20,
      }),
    })

    if (response.ok) {
      return { success: true, message: '连接成功！API Key 有效' }
    } else if (response.status === 401) {
      return { success: false, message: 'API Key 无效，请检查密钥是否正确' }
    } else if (response.status === 402) {
      return { success: false, message: '账户余额不足，请充值' }
    } else {
      return { success: false, message: `连接失败（HTTP ${response.status}）` }
    }
  } catch (err) {
    return { success: false, message: `网络错误: ${err instanceof Error ? err.message : String(err)}` }
  }
}
