/**
 * 文本差异对比工具函数
 */
import * as Diff from 'diff'

interface DiffLine {
  value: string
  added?: boolean
  removed?: boolean
  count?: number
}

interface DiffResult {
  leftLines: DiffLine[]
  rightLines: DiffLine[]
  stats: {
    added: number
    removed: number
    unchanged: number
  }
}

/**
 * 对比两个文本的差异
 */
export function diffText(oldText: string, newText: string): DiffResult {
  // 使用diff库进行对比
  const diffResult = Diff.diffLines(oldText, newText)

  const leftLines: DiffLine[] = []
  const rightLines: DiffLine[] = []

  let added = 0
  let removed = 0
  let unchanged = 0

  diffResult.forEach((part: any) => {
    const lines = part.value.split('\n').filter(line => line.trim() !== '')

    if (part.added) {
      // 新增的行只显示在右侧
      added += lines.length
      rightLines.push({
        value: part.value,
        added: true,
        count: part.count
      })
    } else if (part.removed) {
      // 删除的行只显示在左侧
      removed += lines.length
      leftLines.push({
        value: part.value,
        removed: true,
        count: part.count
      })
    } else {
      // 未改变的行显示在两侧
      unchanged += lines.length
      leftLines.push({
        value: part.value,
        count: part.count
      })
      rightLines.push({
        value: part.value,
        count: part.count
      })
    }
  })

  return {
    leftLines,
    rightLines,
    stats: {
      added,
      removed,
      unchanged
    }
  }
}

/**
 * 对比两个文本的字符差异（用于更细粒度的对比）
 */
export function diffChars(oldText: string, newText: string): DiffLine[] {
  return Diff.diffChars(oldText, newText)
}

/**
 * 对比两个文本的单词差异
 */
export function diffWords(oldText: string, newText: string): DiffLine[] {
  return Diff.diffWords(oldText, newText)
}

/**
 * 统计差异行数
 */
export function countDiffLines(diffResult: DiffResult): string {
  const { added, removed, unchanged } = diffResult.stats
  const total = added + removed + unchanged

  return `总计: ${total} 行 | 新增: ${added} 行 | 删除: ${removed} 行 | 未改: ${unchanged} 行`
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