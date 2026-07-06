/**
 * 时间戳转换工具函数
 */
import { format, formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 时间戳转日期
 */
export function timestampToDate(timestamp: number, formatStr = 'yyyy-MM-dd HH:mm:ss'): string {
  // 判断是秒级还是毫秒级时间戳
  const ms = timestamp > 1e12 ? timestamp : timestamp * 1000

  try {
    const date = new Date(ms)
    return format(date, formatStr, { locale: zhCN })
  } catch (e) {
    return '无效时间戳'
  }
}

/**
 * 日期转时间戳
 */
export function dateToTimestamp(dateStr: string, unit: 's' | 'ms' = 's'): number {
  try {
    const date = new Date(dateStr)
    const ms = date.getTime()
    return unit === 's' ? Math.floor(ms / 1000) : ms
  } catch (e) {
    return 0
  }
}

/**
 * 相对时间
 */
export function getRelativeTime(timestamp: number): string {
  // 判断是秒级还是毫秒级时间戳
  const ms = timestamp > 1e12 ? timestamp : timestamp * 1000

  try {
    const date = new Date(ms)
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
  } catch (e) {
    return '无效时间戳'
  }
}

/**
 * 自动检测时间戳类型
 */
export function detectTimestampType(timestamp: number): 's' | 'ms' {
  return timestamp > 1e12 ? 'ms' : 's'
}

/**
 * 获取当前时间戳
 */
export function getCurrentTimestamp(unit: 's' | 'ms' = 's'): number {
  const ms = Date.now()
  return unit === 's' ? Math.floor(ms / 1000) : ms
}