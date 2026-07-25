/**
 * 评分系统
 * 综合时间和准确率给出 D/C/B/A/S/SR 评级
 */

export type Grade = 'D' | 'C' | 'B' | 'A' | 'S' | 'SR'

export interface GradeInfo {
  grade: Grade
  name: string
  color: string
  icon: string
  description: string
  minScore: number
}

export const gradeInfos: GradeInfo[] = [
  {
    grade: 'D',
    name: 'D级',
    color: '#95a5a6',
    icon: '⚠️',
    description: '需要加油',
    minScore: 0
  },
  {
    grade: 'C',
    name: 'C级',
    color: '#3498db',
    icon: '📚',
    description: '及格水平',
    minScore: 40
  },
  {
    grade: 'B',
    name: 'B级',
    color: '#2ecc71',
    icon: '✨',
    description: '良好水平',
    minScore: 60
  },
  {
    grade: 'A',
    name: 'A级',
    color: '#9b59b6',
    icon: '🌟',
    description: '优秀水平',
    minScore: 75
  },
  {
    grade: 'S',
    name: 'S级',
    color: '#f39c12',
    icon: '⭐',
    description: '大师水平',
    minScore: 90
  },
  {
    grade: 'SR',
    name: 'SR级',
    color: '#e74c3c',
    icon: '👑',
    description: '传说水平',
    minScore: 98
  }
]

export interface ScoreInput {
  timeUsed: number        // 实际用时(秒)
  timeLimit: number       // 时间限制(秒)
  accuracy: number        // 准确率 (0-100)
  codeLines: number       // 代码总行数
  correctLines: number    // 正确行数
}

export interface ScoreResult {
  totalScore: number      // 总分 (0-100)
  grade: Grade            // 评级
  gradeInfo: GradeInfo    // 评级信息
  timeScore: number       // 时间得分
  accuracyScore: number   // 准确率得分
  speedScore: number      // 速度得分(每分钟行数)
  wpm: number             // 每分钟行数
  details: {
    timeUsed: number
    timeLimit: number
    accuracy: number
    codeLines: number
    correctLines: number
  }
}

/**
 * 计算得分
 * 评分标准：
 * - 准确率 (20%): 代码完成度（智能对比，容忍轻微空格差异）
 * - 时间 (45%): 用时占比（核心指标，越快越好）
 * - 速度 (35%): 每分钟输入的有效行数（核心指标，体现打字速度）
 */
export function calculateScore(input: ScoreInput): ScoreResult {
  const { timeUsed, timeLimit, accuracy, codeLines, correctLines } = input

  // 1. 准确率得分 (0-100)
  const accuracyScore = accuracy

  // 2. 时间得分 (0-100)
  // 用时越短得分越高，超过时间限制得分为0
  let timeScore: number
  if (timeUsed <= 0) {
    timeScore = 0
  } else if (timeUsed >= timeLimit * 2) {
    timeScore = 0
  } else {
    // 在时间限制内得高分，超过则递减
    const ratio = timeUsed / timeLimit
    if (ratio <= 0.5) {
      timeScore = 100
    } else if (ratio <= 1.0) {
      // 50%-100% 时间用完，得分从 100 降到 70
      timeScore = 100 - (ratio - 0.5) * 60
    } else {
      // 超过时间限制，得分从 70 降到 0
      timeScore = Math.max(0, 70 - (ratio - 1.0) * 70)
    }
  }

  // 3. 速度得分 (每分钟有效行数)
  // WPM = 正确行数 / 用时(分钟)
  const minutes = timeUsed / 60
  const wpm = minutes > 0 ? Math.round(correctLines / minutes) : 0

  // 速度得分映射：
  // 0 WPM = 0分
  // 10 WPM = 50分
  // 20 WPM = 80分
  // 30+ WPM = 100分
  let speedScore: number
  if (wpm <= 0) {
    speedScore = 0
  } else if (wpm >= 30) {
    speedScore = 100
  } else if (wpm >= 20) {
    speedScore = 80 + (wpm - 20) * 2
  } else if (wpm >= 10) {
    speedScore = 50 + (wpm - 10) * 3
  } else {
    speedScore = wpm * 5
  }

  // 4. 总分计算
  // 准确率权重 20%，时间权重 45%，速度权重 35%
  const totalScore = Math.round(
    accuracyScore * 0.2 + timeScore * 0.45 + speedScore * 0.35
  )

  // 5. 确定评级
  let grade: Grade = 'D'
  let gradeInfo = gradeInfos[0]

  // 找到符合分数的最高评级
  for (let i = gradeInfos.length - 1; i >= 0; i--) {
    if (totalScore >= gradeInfos[i].minScore) {
      grade = gradeInfos[i].grade
      gradeInfo = gradeInfos[i]
      break
    }
  }

  // 特殊规则：准确率低于 50% 直接降为 D
  if (accuracy < 50) {
    grade = 'D'
    gradeInfo = gradeInfos[0]
  }

  return {
    totalScore,
    grade,
    gradeInfo,
    timeScore: Math.round(timeScore),
    accuracyScore: Math.round(accuracyScore),
    speedScore: Math.round(speedScore),
    wpm,
    details: {
      timeUsed,
      timeLimit,
      accuracy,
      codeLines,
      correctLines
    }
  }
}

/**
 * 格式化时间显示
 */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
