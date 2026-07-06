/**
 * 文档解析和提取工具函数
 */

interface ExtractResult {
  keywords: string[]
  keySentences: string[]
  summary: string
}

/**
 * 提取关键词
 */
export function extractKeywords(text: string, maxKeywords = 10): string[] {
  // 移除HTML标签和特殊字符
  const cleanText = text.replace(/<[^>]*>/g, '').replace(/[^\w\s\u4e00-\u9fa5]/g, '')

  // 分词（简单实现：按空格和标点符号分割）
  const words = cleanText.split(/\s+|[，。！？；：]/)

  // 统计词频
  const wordFreq: Record<string, number> = {}
  words.forEach(word => {
    if (word.length > 1) { // 忽略单字
      wordFreq[word] = (wordFreq[word] || 0) + 1
    }
  })

  // 按词频排序并返回前N个关键词
  const sortedWords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)

  return sortedWords
}

/**
 * 提取关键句子
 */
export function extractKeySentences(text: string, maxSentences = 5): string[] {
  // 按句子分割
  const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 10)

  // 简单策略：选择包含关键词最多的句子
  const keywords = extractKeywords(text, 20)
  const scoredSentences = sentences.map(sentence => {
    const score = keywords.reduce((acc, keyword) => {
      return acc + (sentence.includes(keyword) ? 1 : 0)
    }, 0)
    return { sentence, score }
  })

  // 按分数排序并返回前N个句子
  return scoredSentences
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .map(item => item.sentence.trim())
}

/**
 * 生成简单摘要
 */
export function generateSummary(text: string): string {
  const keySentences = extractKeySentences(text, 3)
  return keySentences.join(' ')
}

/**
 * 主提取函数
 */
export function extractDocument(text: string): ExtractResult {
  const keywords = extractKeywords(text)
  const keySentences = extractKeySentences(text)
  const summary = generateSummary(text)

  return {
    keywords,
    keySentences,
    summary
  }
}

/**
 * 导出为Markdown格式
 */
export function exportToMarkdown(result: ExtractResult): string {
  let markdown = '# 文档提取结果\n\n'
  markdown += '## 摘要\n'
  markdown += result.summary + '\n\n'
  markdown += '## 关键词\n'
  markdown += result.keywords.map(k => `- ${k}`).join('\n') + '\n\n'
  markdown += '## 关键句子\n'
  markdown += result.keySentences.map(s => `- ${s}`).join('\n')
  return markdown
}

/**
 * 导出为JSON格式
 */
export function exportToJSON(result: ExtractResult): string {
  return JSON.stringify(result, null, 2)
}