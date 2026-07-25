/**
 * 文本差异对比工具函数 - 支持行内字符级高亮
 */
import * as Diff from 'diff'

export interface DiffSegment {
  value: string
  added?: boolean
  removed?: boolean
}

export interface DiffLine {
  leftSegments: DiffSegment[]
  rightSegments: DiffSegment[]
  hasDifference: boolean
}

export interface DiffResult {
  lines: DiffLine[]
  stats: {
    added: number
    removed: number
    unchanged: number
    modified: number
  }
}

/**
 * 对两个字符串进行字符级diff，生成左右segments
 */
function createCharDiffSegments(oldText: string, newText: string): { left: DiffSegment[], right: DiffSegment[] } {
  const charDiff = Diff.diffChars(oldText, newText)
  const left: DiffSegment[] = []
  const right: DiffSegment[] = []

  charDiff.forEach((part: any) => {
    if (part.added) {
      right.push({ value: part.value, added: true })
    } else if (part.removed) {
      left.push({ value: part.value, removed: true })
    } else {
      const segment = { value: part.value }
      left.push(segment)
      right.push(segment)
    }
  })

  return { left, right }
}

/**
 * 按行分割文本，保留中间空行，去掉末尾空行
 */
function splitLines(text: string): string[] {
  if (text === '') return []
  const lines = text.split('\n')
  if (lines[lines.length - 1] === '') {
    lines.pop()
  }
  return lines
}

/**
 * 对比两个文本的差异
 */
export function diffText(oldText: string, newText: string): DiffResult {
  const lineDiff = Diff.diffLines(oldText, newText)
  const lines: DiffLine[] = []

  let added = 0
  let removed = 0
  let unchanged = 0
  let modified = 0

  for (let i = 0; i < lineDiff.length; i++) {
    const part = lineDiff[i]
    const partLines = splitLines(part.value)

    if (part.added) {
      added += partLines.length
      partLines.forEach(line => {
        lines.push({
          leftSegments: [{ value: '' }],
          rightSegments: [{ value: line, added: true }],
          hasDifference: true
        })
      })
    } else if (part.removed) {
      const nextPart = lineDiff[i + 1]

      if (nextPart && nextPart.added) {
        const addedLines = splitLines(nextPart.value)
        i++

        const maxLen = Math.max(partLines.length, addedLines.length)
        modified += maxLen

        for (let j = 0; j < maxLen; j++) {
          const oldLine = partLines[j] || ''
          const newLine = addedLines[j] || ''

          const { left, right } = createCharDiffSegments(oldLine, newLine)

          lines.push({
            leftSegments: left.length ? left : [{ value: '' }],
            rightSegments: right.length ? right : [{ value: '' }],
            hasDifference: true
          })
        }
      } else {
        removed += partLines.length
        partLines.forEach(line => {
          lines.push({
            leftSegments: [{ value: line, removed: true }],
            rightSegments: [{ value: '' }],
            hasDifference: true
          })
        })
      }
    } else {
      unchanged += partLines.length
      partLines.forEach(line => {
        const segment = { value: line }
        lines.push({
          leftSegments: [segment],
          rightSegments: [segment],
          hasDifference: false
        })
      })
    }
  }

  return {
    lines,
    stats: { added, removed, unchanged, modified }
  }
}

/**
 * 统计差异行数
 */
export function countDiffLines(diffResult: DiffResult): string {
  const { added, removed, unchanged, modified } = diffResult.stats
  const total = added + removed + unchanged + modified

  return `总计: ${total} 行 | 新增: ${added} 行 | 删除: ${removed} 行 | 修改: ${modified} 行 | 未改: ${unchanged} 行`
}

/**
 * 导出对比报告
 */
export function exportDiffReport(oldText: string, newText: string, diffResult: DiffResult): string {
  let report = '# 文本对比报告\n\n'
  report += '## 统计信息\n'
  report += countDiffLines(diffResult) + '\n\n'

  report += '## 详细差异\n\n'
  report += '### 左侧文本（原始）\n'
  report += '```\n'
  report += oldText
  report += '\n```\n\n'

  report += '### 右侧文本（修改）\n'
  report += '```\n'
  report += newText
  report += '\n```\n'

  return report
}
