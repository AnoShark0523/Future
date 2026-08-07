/**
 * Word 文档导入模块（新增模块，不修改任何现有代码）
 *
 * 功能：使用 mammoth 库从 .docx 文件中提取纯文本，
 *       提取出的文本交给 aiImport.ts 的 parseResumeWithAIRobust 进行智能解析。
 *
 * 依赖：mammoth（已在 package.json 中）
 */

import mammoth from 'mammoth'

/**
 * 从 Word 文件中提取纯文本
 *
 * @param file 用户上传的 .docx 文件
 * @returns 提取出的纯文本内容
 */
export async function extractTextFromWord(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()

  const result = await mammoth.extractRawText({ arrayBuffer })

  // mammoth 返回 { value: string, messages: [] }
  const text = result.value || ''

  if (!text || text.trim().length < 5) {
    throw new Error('Word 文档内容为空或无法提取文本')
  }

  return text
}

/**
 * 从 Word 文件中提取 HTML（保留格式信息，用于更精确的解析）
 *
 * @param file 用户上传的 .docx 文件
 * @returns 提取出的 HTML 内容
 */
export async function extractHtmlFromWord(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()

  const result = await mammoth.convertToHtml({ arrayBuffer })

  return result.value || ''
}
