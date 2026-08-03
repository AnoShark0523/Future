/**
 * 代码对比工具
 * 逐行对比代码，生成差异信息
 */

export interface DiffLine {
  lineNumber: number        // 左侧行号
  expected: string          // 期望的代码
  actual: string | null     // 实际输入的代码（null表示缺失）
  isCorrect: boolean        // 是否正确
  isMissing: boolean        // 是否缺失
  isExtra: boolean          // 是否多余
}

export interface DiffResult {
  lines: DiffLine[]
  correctCount: number      // 正确行数
  wrongCount: number        // 错误行数
  missingCount: number      // 缺失行数
  extraCount: number        // 多余行数
  accuracy: number          // 准确率 (0-100)
  wrongLines: DiffLine[]    // 所有错误的行
}

/**
 * 标准化代码行（智能处理空格差异）
 * - 制表符统一转换为2空格
 * - 行尾空白去除
 * - 行中间多个连续空格压缩为单个空格
 * - 保留行首缩进（仅做制表符标准化）
 */
function normalizeLine(line: string): string {
  // 1. 制表符统一转换为2空格
  let normalized = line.replace(/\t/g, '  ')
  // 2. 去除行尾空白
  normalized = normalized.replace(/\s+$/, '')
  // 3. 提取行首缩进（保留缩进，因为缩进影响代码结构）
  const leadingMatch = normalized.match(/^(\s*)/)
  const leading = leadingMatch ? leadingMatch[1] : ''
  // 4. 行中间多个连续空格压缩为单个空格
  const rest = normalized.substring(leading.length).replace(/ {2,}/g, ' ')
  return leading + rest
}

/**
 * Levenshtein 相似度（接受已标准化的字符串，避免重复标准化）
 */
function levenshteinSimilarity(na: string, nb: string): number {
  if (na === nb) return 1
  if (!na && !nb) return 1
  if (!na || !nb) return 0

  // 编辑距离 (Levenshtein)
  const m = na.length
  const n = nb.length
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = na[i - 1] === nb[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      )
    }
  }
  const maxLen = Math.max(m, n)
  return maxLen === 0 ? 1 : 1 - dp[m][n] / maxLen
}

// 行匹配阈值：相似度达到此值即认为"正确"（容忍轻微差异）
const MATCH_THRESHOLD = 0.85

/**
 * 相似度判断函数类型（使用索引避免重复标准化）
 */
type SimilarityFn = (i: number, j: number) => boolean

/**
 * 简单的行级 LCS 算法
 * 找出两段代码的最长公共子序列
 * 使用相似度阈值判断行是否匹配
 */
function lcs(m: number, n: number, similar: SimilarityFn): number[][] {
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (similar(i - 1, j - 1)) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  return dp
}

/**
 * 回溯 LCS，生成差异信息
 */
function backtrack(
  dp: number[][],
  m: number,
  n: number,
  similar: SimilarityFn
): Array<{ type: 'same' | 'missing' | 'extra'; aIndex: number; bIndex: number }> {
  const result: Array<{ type: 'same' | 'missing' | 'extra'; aIndex: number; bIndex: number }> = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && similar(i - 1, j - 1)) {
      result.unshift({ type: 'same', aIndex: i - 1, bIndex: j - 1 })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'extra', aIndex: -1, bIndex: j - 1 })
      j--
    } else {
      result.unshift({ type: 'missing', aIndex: i - 1, bIndex: -1 })
      i--
    }
  }

  return result
}

/**
 * 对比两段代码
 * @param expected 期望的代码（样例）
 * @param actual 实际输入的代码
 */
export function diffCode(expected: string, actual: string): DiffResult {
  const expectedLines = expected.split('\n')
  const actualLines = actual.split('\n')

  // 去除尾部空行（由末尾换行符产生，避免行数统计偏多）
  if (expectedLines.length > 0 && expectedLines[expectedLines.length - 1] === '') {
    expectedLines.pop()
  }
  if (actualLines.length > 0 && actualLines[actualLines.length - 1] === '') {
    actualLines.pop()
  }

  // 预标准化所有行，避免在 LCS DP 中重复标准化
  const normalizedExpected = expectedLines.map(normalizeLine)
  const normalizedActual = actualLines.map(normalizeLine)

  // 相似度缓存（避免同一行对在 LCS 和 backtrack 中重复计算 Levenshtein 距离）
  const simCache = new Map<string, boolean>()
  const similar: SimilarityFn = (i: number, j: number): boolean => {
    const key = `${i},${j}`
    let cached = simCache.get(key)
    if (cached === undefined) {
      cached = levenshteinSimilarity(normalizedExpected[i], normalizedActual[j]) >= MATCH_THRESHOLD
      simCache.set(key, cached)
    }
    return cached
  }

  // 计算LCS
  const dp = lcs(expectedLines.length, actualLines.length, similar)
  const trace = backtrack(dp, expectedLines.length, actualLines.length, similar)

  const lines: DiffLine[] = []
  const wrongLines: DiffLine[] = []
  let correctCount = 0
  let wrongCount = 0
  let missingCount = 0
  let extraCount = 0

  // 构建差异结果
  for (const item of trace) {
    if (item.type === 'same') {
      lines.push({
        lineNumber: item.aIndex + 1,
        expected: expectedLines[item.aIndex],
        actual: actualLines[item.bIndex],
        isCorrect: true,
        isMissing: false,
        isExtra: false
      })
      correctCount++
    } else if (item.type === 'missing') {
      // 期望有，实际没有
      lines.push({
        lineNumber: item.aIndex + 1,
        expected: expectedLines[item.aIndex],
        actual: null,
        isCorrect: false,
        isMissing: true,
        isExtra: false
      })
      missingCount++
      wrongLines.push(lines[lines.length - 1])
    } else {
      // 实际有，期望没有（多余）
      lines.push({
        lineNumber: -1,
        expected: '',
        actual: actualLines[item.bIndex],
        isCorrect: false,
        isMissing: false,
        isExtra: true
      })
      extraCount++
      wrongLines.push(lines[lines.length - 1])
    }
  }

  // 对于错误的行（非missing/extra但内容不同），也加入wrongLines
  // 这里其实 same 是内容完全相同的，所以不需要额外处理
  wrongCount = missingCount + extraCount

  // 计算准确率
  const totalExpected = expectedLines.length
  const accuracy = totalExpected > 0
    ? Math.round((correctCount / totalExpected) * 100)
    : 0

  return {
    lines,
    correctCount,
    wrongCount,
    missingCount,
    extraCount,
    accuracy,
    wrongLines
  }
}

/**
 * 字符级对比，找出同一行内的差异字符
 */
export function charDiff(expected: string, actual: string): Array<{
  char: string
  expected: boolean  // 是否在期望中
  actual: boolean    // 是否在实际中
}> {
  // 简单的字符级对比
  const expChars = expected.split('')
  const actChars = actual.split('')

  // LCS for chars
  const m = expChars.length
  const n = actChars.length
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (expChars[i - 1] === actChars[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // 回溯
  const result: Array<{ char: string; expected: boolean; actual: boolean }> = []
  let i = m
  let j = n

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && expChars[i - 1] === actChars[j - 1]) {
      result.unshift({ char: expChars[i - 1], expected: true, actual: true })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ char: actChars[j - 1], expected: false, actual: true })
      j--
    } else {
      result.unshift({ char: expChars[i - 1], expected: true, actual: false })
      i--
    }
  }

  return result
}

/**
 * 生成高亮 HTML（错误行用红色背景标记）
 */
export function highlightDiff(diff: DiffResult): string {
  return diff.lines.map(line => {
    if (line.isMissing) {
      // 缺失的行：红色背景
      const escaped = escapeHtml(line.expected)
      return `<div class="diff-line diff-missing">${escaped}</div>`
    } else if (line.isExtra) {
      // 多余的行：橙色背景
      const escaped = escapeHtml(line.actual || '')
      return `<div class="diff-line diff-extra">${escaped}</div>`
    } else if (line.isCorrect) {
      // 正确的行：正常显示
      const escaped = escapeHtml(line.expected)
      return `<div class="diff-line diff-correct">${escaped}</div>`
    } else {
      // 内容不同
      const escaped = escapeHtml(line.expected)
      return `<div class="diff-line diff-wrong">${escaped}</div>`
    }
  }).join('\n')
}

/**
 * HTML 转义
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
