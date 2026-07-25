/**
 * 文档解析和智能提取工具函数
 */

// 同义词字典（基础版，作为示例）
const synonymDict: Record<string, string[]> = {
  '技术': ['技能', '技艺', '方法', '技术手段', '工艺', '技术方案'],
  '应用': ['使用', '运用', '利用', '实践', '应用场景', '应用领域'],
  '发展': ['进步', '提升', '增长', '演变', '发展历程', '发展趋势'],
  
  // 山岳类
  '山岳': ['山峰', '山脉', '高山', '峻岭', '山峦', '山脊', '山峰', '山顶', '山巅'],
  '山': ['峰', '岭', '峦', '崖', '壁', '岩', '谷', '壑'],
  
  // 水流类
  '水': ['河', '江', '湖', '海', '溪', '泉', '流', '浪', '波'],
  '河流': ['江', '河', '溪', '流', '水系', '河道'],
  
  // 情感类（保留）
  '情话': ['爱意', '喜欢', '爱', '欢喜', '心动', '思念', '牵挂', '眷恋', '深情', '温柔', '甜蜜', '浪漫', '表白', '告白', '倾心', '钟情', '宠爱', '珍惜'],
  '爱': ['喜欢', '钟情', '倾心', '深爱', '热爱', '爱护', '疼爱', '心爱', '挚爱', '宠爱'],
}

// 常见部首字典（用于字形相似度）
const radicalDict: Record<string, string[]> = {
  '山': ['峰', '岭', '峦', '崖', '岩', '岳', '巅', '脊'],
  '水': ['河', '江', '湖', '海', '溪', '泉', '流', '浪', '波', '洋'],
  '木': ['树', '林', '森', '木', '材', '村', '枝', '叶'],
  '火': ['烧', '燃', '焰', '灯', '烛', '烤', '烘', '燥'],
  '土': ['地', '坡', '堤', '坝', '域', '填', '埋', '坑'],
  '金': ['铁', '钢', '银', '铜', '钱', '银', '铺', '锅'],
}

// 情感词汇库（用于情感分析）
const emotionalWords = {
  positive: ['喜欢', '爱', '幸福', '快乐', '开心', '甜蜜', '温柔', '温暖', '美好', '珍贵', '珍惜', '思念', '牵挂', '欢喜', '心动', '倾心', '钟情', '陪伴', '守护', '疼爱'],
  romantic: ['浪漫', '甜蜜', '温柔', '心动', '欢喜', '倾心', '钟情', '表白', '告白', '情话', '爱意', '眷恋', '深情', '宠溺', '撒娇'],
  intimate: ['宝贝', '亲爱的', '老婆', '老公', '媳妇', '老公', '心肝', '亲爱的', '心爱'],
}

// 无意义词汇列表
const meaninglessWords = [
  '嗯', '啊', '呃', '那个', '这个', '就是说', '然后', '所以', 
  '其实', '反正', '可能', '应该', '大概', '对吧', '是吧'
]

/**
 * 计算两个字符串的相似度（Jaccard相似度）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.split(''))
  const set2 = new Set(str2.split(''))
  
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return intersection.size / union.size
}

/**
 * 获取关键字的同义词和相似词（智能扩展 + 阈值控制）
 * @param keyword 关键字
 * @param level 联想程度：strict（严格）、medium（适中）、loose（宽松）
 */
function expandKeyword(keyword: string, level: 'strict' | 'medium' | 'loose' = 'medium'): string[] {
  const expanded = new Set<string>()
  expanded.add(keyword)
  
  // 严格模式：只保留原词和精确同义词
  if (level === 'strict') {
    // 1. 查找同义词字典（仅完全匹配）
    if (synonymDict[keyword]) {
      synonymDict[keyword].forEach(word => expanded.add(word))
    }
    return Array.from(expanded)
  }
  
  // 适中模式：精确同义词 + 部分相似词
  if (level === 'medium') {
    // 1. 查找同义词字典
    if (synonymDict[keyword]) {
      synonymDict[keyword].forEach(word => expanded.add(word))
    }
    
    // 2. 查找反查同义词（限制数量）
    Object.entries(synonymDict).forEach(([key, synonyms]) => {
      if (synonyms.includes(keyword) && expanded.size < 10) {
        expanded.add(key)
      }
    })
    
    // 3. 智能生成相似词（仅字形相似）
    const generated = generateSimilarWords(keyword, 'medium')
    generated.slice(0, 5).forEach(word => expanded.add(word))
    
    return Array.from(expanded)
  }
  
  // 宽松模式：全部联想
  // 1. 查找同义词字典
  if (synonymDict[keyword]) {
    synonymDict[keyword].forEach(word => expanded.add(word))
  }
  
  // 2. 查找反查同义词
  Object.entries(synonymDict).forEach(([key, synonyms]) => {
    if (synonyms.includes(keyword)) {
      expanded.add(key)
      synonyms.forEach(s => {
        if (s !== keyword) expanded.add(s)
      })
    }
  })
  
  // 3. 智能生成相似词（全部）
  const generated = generateSimilarWords(keyword, 'loose')
  generated.forEach(word => expanded.add(word))
  
  return Array.from(expanded)
}

/**
 * 智能生成相似词（核心算法 + 级别控制）
 */
function generateSimilarWords(keyword: string, level: 'strict' | 'medium' | 'loose' = 'medium'): string[] {
  const similar: string[] = []
  
  if (level === 'strict') {
    // 严格模式：不生成相似词
    return similar
  }
  
  if (level === 'medium') {
    // 适中模式：只生成字形相似的词
    const shapeSimilar = getShapeSimilarWords(keyword)
    similar.push(...shapeSimilar.slice(0, 3))
    return similar
  }
  
  // 宽松模式：生成所有相似词
  // 1. 基于部首生成相似词
  for (const char of keyword) {
    for (const [radical, words] of Object.entries(radicalDict)) {
      if (char === radical || words.includes(char)) {
        words.forEach(word => {
          if (word !== keyword) {
            similar.push(word)
          }
        })
      }
    }
  }
  
  // 2. 基于字形相似度（使用预定义规则）
  const shapeSimilar = getShapeSimilarWords(keyword)
  similar.push(...shapeSimilar)
  
  // 3. 基于语义联想（通用规则）
  const semanticSimilar = getSemanticSimilarWords(keyword)
  similar.push(...semanticSimilar)
  
  return [...new Set(similar)]
}

/**
 * 获取字形相似的词汇
 */
function getShapeSimilarWords(keyword: string): string[] {
  const similar: string[] = []
  
  // 山岳类 -> 山峰、山脉等
  if (keyword.includes('山') || keyword.includes('峰') || keyword.includes('岭') || keyword.includes('岳')) {
    similar.push('山峰', '山脉', '峻岭', '山峦', '山脊', '山顶', '山巅', '高山')
  }
  
  // 水流类 -> 江河湖海等
  if (keyword.includes('水') || keyword.includes('河') || keyword.includes('江') || keyword.includes('海')) {
    similar.push('河流', '江河', '湖泊', '海洋', '溪流', '泉水', '波涛', '浪花')
  }
  
  // 树木类 -> 森林、树林等
  if (keyword.includes('树') || keyword.includes('木') || keyword.includes('林')) {
    similar.push('树木', '森林', '树林', '枝叶', '树干', '树叶')
  }
  
  // 建筑、城市类
  if (keyword.includes('楼') || keyword.includes('房') || keyword.includes('城') || keyword.includes('市')) {
    similar.push('高楼', '房屋', '城市', '都市', '建筑', '楼房')
  }
  
  return similar
}

/**
 * 获取语义相似的词汇（通用联想）
 */
function getSemanticSimilarWords(keyword: string): string[] {
  const similar: string[] = []
  
  // 动词联想
  const verbAssociations: Record<string, string[]> = {
    '看': ['观', '望', '视', '见', '瞧', '盯'],
    '说': ['讲', '谈', '述', '道', '告', '言'],
    '想': ['思', '念', '虑', '谋', '思量', '思考'],
    '走': ['行', '跑', '奔', '步', '行进', '行走'],
    '吃': ['食', '餐', '用', '品', '进食', '用餐'],
  }
  
  // 形容词联想
  const adjAssociations: Record<string, string[]> = {
    '大': ['巨大', '庞大', '宏伟', '宏大', '巨大', '广'],
    '小': ['微小', '细小', '渺小', '小', '细微', '细'],
    '高': ['高大', '巍峨', '高耸', '崇高', '高度'],
    '快': ['迅速', '快速', '敏捷', '飞快', '急速'],
  }
  
  // 查找联想词
  const allAssociations = [
    ...Object.values(verbAssociations),
    ...Object.values(adjAssociations)
  ]
  
  allAssociations.forEach(associations => {
    if (associations.includes(keyword)) {
      associations.forEach(word => {
        if (word !== keyword) similar.push(word)
      })
    }
  })
  
  return similar
}

/**
 * 检查句子是否包含关键字或其相似词（增强版 + 阈值控制）
 */
function containsKeywordOrSimilar(
  sentence: string, 
  keywords: string[],
  level: 'strict' | 'medium' | 'loose' = 'medium'
): {
  found: boolean
  matchedKeywords: string[]
  score: number
} {
  const matchedKeywords: string[] = []
  let score = 0

  keywords.forEach(keyword => {
    // 获取扩展的关键词（根据阈值）
    const expanded = expandKeyword(keyword, level)
    
    expanded.forEach(similarWord => {
      // 直接匹配
      if (sentence.includes(similarWord)) {
        matchedKeywords.push(similarWord)
        const similarity = similarWord === keyword ? 1 : 0.8
        score += similarity
      }
      
      // 字符级模糊匹配（仅在宽松模式下）
      if (level === 'loose') {
        const keywordChars = similarWord.split('')
        const matchedChars = keywordChars.filter(char => sentence.includes(char))
        if (matchedChars.length >= Math.floor(keywordChars.length * 0.6)) {
          if (!matchedKeywords.includes(similarWord)) {
            matchedKeywords.push(similarWord + '(部分匹配)')
            score += 0.3
          }
        }
      }
    })
  })

  return {
    found: matchedKeywords.length > 0,
    matchedKeywords,
    score
  }
}

/**
 * 关键字提取模式（支持相似度阈值）
 */
export function extractWithKeywords(
  text: string, 
  keywords: string[],
  similarityLevel: 'strict' | 'medium' | 'loose' = 'medium'
): {
  sentences: string[]
  paragraphGroups: { paragraph: number; sentences: string[] }[]
  matchScore: number
} {
  // 按段落分割
  const paragraphs = text.split(/\n\n+/)
  const allSentences: string[] = []
  const paragraphGroups: { paragraph: number; sentences: string[] }[] = []
  let totalScore = 0

  paragraphs.forEach((paragraph, pIndex) => {
    // 按句子分割
    const sentences = paragraph.split(/[。！？\n.!?]+/).filter(s => s.trim().length > 0)
    const groupSentences: string[] = []

    sentences.forEach(sentence => {
      const trimmed = sentence.trim()
      if (trimmed.length < 5) return // 跳过太短的句子

      const result = containsKeywordOrSimilar(trimmed, keywords, similarityLevel)
      
      if (result.found) {
        allSentences.push(trimmed)
        groupSentences.push(trimmed)
        totalScore += result.score
      }
    })

    if (groupSentences.length > 0) {
      paragraphGroups.push({
        paragraph: pIndex + 1,
        sentences: groupSentences
      })
    }
  })

  return {
    sentences: allSentences,
    paragraphGroups,
    matchScore: totalScore
  }
}

/**
 * 评估句子的重要性（用于智能提取）
 */
function evaluateSentenceImportance(sentence: string): number {
  let score = 0
  
  // 1. 长度评分（适中长度的句子得分高）
  const length = sentence.length
  if (length >= 10 && length <= 50) {
    score += 2
  } else if (length >= 8 && length <= 80) {
    score += 1
  } else if (length < 5 || length > 150) {
    score -= 1 // 太短或太长扣分
  }

  // 2. 词汇丰富度评分
  const uniqueChars = new Set(sentence.split(''))
  const richness = uniqueChars.size / length
  if (richness > 0.6) score += 1

  // 3. 包含重要关键词加分
  const importantWords = ['技术', '应用', '发展', '研究', '创新', '解决', '方案', '分析', '方法', '实现']
  importantWords.forEach(word => {
    if (sentence.includes(word)) score += 0.5
  })

  // 4. 包含连接词和逻辑词加分（语义连贯）
  const connectiveWords = ['因此', '所以', '但是', '然而', '同时', '此外', '首先', '其次', '最后', '总之']
  connectiveWords.forEach(word => {
    if (sentence.includes(word)) score += 0.5
  })

  // 5. 包含无意义词汇扣分
  meaninglessWords.forEach(word => {
    if (sentence.includes(word)) score -= 0.5
  })

  // 6. 包含数字或专有名词加分（通常包含关键信息）
  if (/\d+/.test(sentence)) score += 0.5

  return score
}

/**
 * 智能提取模式（无关键字自动提取）
 */
export function extractAutomatically(text: string): {
  sentences: string[]
  paragraphGroups: { paragraph: number; sentences: string[] }[]
  matchScore: number
} {
  const paragraphs = text.split(/\n\n+/)
  const allSentences: string[] = []
  const paragraphGroups: { paragraph: number; sentences: string[] }[] = []
  let totalScore = 0

  paragraphs.forEach((paragraph, pIndex) => {
    const sentences = paragraph.split(/[。！？\n.!?]+/).filter(s => s.trim().length > 0)
    const groupSentences: string[] = []
    
    const scoredSentences = sentences.map(sentence => {
      const trimmed = sentence.trim()
      const score = evaluateSentenceImportance(trimmed)
      return { sentence: trimmed, score }
    })

    // 过滤得分低于阈值的句子
    const threshold = 1.5
    scoredSentences.forEach(item => {
      if (item.score >= threshold) {
        allSentences.push(item.sentence)
        groupSentences.push(item.sentence)
        totalScore += item.score
      }
    })

    if (groupSentences.length > 0) {
      paragraphGroups.push({
        paragraph: pIndex + 1,
        sentences: groupSentences
      })
    }
  })

  return {
    sentences: allSentences,
    paragraphGroups,
    matchScore: totalScore
  }
}

/**
 * 在原文中高亮显示提取的句子
 */
export function highlightText(originalText: string, extractedSentences: string[]): string {
  let highlighted = originalText
  
  // 转义HTML特殊字符
  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  // 先转义整个文本
  highlighted = escapeHtml(highlighted)

  // 对每个提取的句子进行高亮
  extractedSentences.forEach(sentence => {
    const escapedSentence = escapeHtml(sentence)
    // 使用绿色背景高亮
    const highlightedSentence = `<span style="background-color: rgba(16, 185, 129, 0.3); padding: 2px 4px; border-radius: 3px;">${escapedSentence}</span>`
    // 替换（注意：只替换第一次出现，避免重复）
    highlighted = highlighted.replace(escapedSentence, highlightedSentence)
  })

  return highlighted
}

/**
 * 获取文本统计信息
 */
export function getStatistics(text: string): {
  paragraphs: number
  totalSentences: number
  characters: number
  words: number
} {
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length
  const totalSentences = text.split(/[。！？\n.!?]+/).filter(s => s.trim().length > 0).length
  const characters = text.length
  const words = text.split(/\s+/).filter(w => w.length > 0).length

  return {
    paragraphs,
    totalSentences,
    characters,
    words
  }
}

/**
 * 提取关键句子（保留旧函数兼容性）
 */
export function extractKeySentences(text: string, maxSentences = 5): string[] {
  const result = extractAutomatically(text)
  return result.sentences.slice(0, maxSentences)
}

/**
 * 提取关键词（保留旧函数兼容性）
 */
export function extractKeywords(text: string, maxKeywords = 10): string[] {
  // 移除HTML标签和特殊字符
  const cleanText = text.replace(/<[^>]*>/g, '').replace(/[^\w\s\u4e00-\u9fa5]/g, '')

  // 分词
  const words = cleanText.split(/\s+|[，。！？；：]/)

  // 统计词频
  const wordFreq: Record<string, number> = {}
  words.forEach(word => {
    if (word.length > 1) {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    }
  })

  // 按词频排序并返回前N个关键词
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word)
}

/**
 * 生成简单摘要（保留旧函数兼容性）
 */
export function generateSummary(text: string): string {
  const sentences = extractAutomatically(text)
  return sentences.sentences.slice(0, 3).join(' ')
}

// 导出其他可能需要的函数
export const getTextStatistics = getStatistics
export const extractByKeywords = extractWithKeywords