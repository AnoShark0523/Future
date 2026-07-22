/**
 * 时间戳转换工具函数
 */
import { format, formatDistanceToNow, differenceInMilliseconds, addDays, addHours, addMinutes, addSeconds } from 'date-fns'
import { zhCN } from 'date-fns/locale'

// 时区配置
export interface TimeZoneInfo {
  name: string
  timezone: string
  offset: string
}

// 常用时区列表
export const COMMON_TIMEZONES: TimeZoneInfo[] = [
  { name: '北京', timezone: 'Asia/Shanghai', offset: 'UTC+8' },
  { name: '东京', timezone: 'Asia/Tokyo', offset: 'UTC+9' },
  { name: '伦敦', timezone: 'Europe/London', offset: 'UTC+0/+1' },
  { name: '纽约', timezone: 'America/New_York', offset: 'UTC-5/-4' },
  { name: '洛杉矶', timezone: 'America/Los_Angeles', offset: 'UTC-8/-7' },
  { name: '悉尼', timezone: 'Australia/Sydney', offset: 'UTC+10/+11' },
  { name: '巴黎', timezone: 'Europe/Paris', offset: 'UTC+1/+2' },
  { name: '迪拜', timezone: 'Asia/Dubai', offset: 'UTC+4' }
]

// 时间格式模板
export const TIME_FORMAT_TEMPLATES = {
  iso: 'yyyy-MM-dd\'T\'HH:mm:ss.SSSxxx',
  rfc2822: 'EEE, d MMM yyyy HH:mm:ss xxx',
  default: 'yyyy-MM-dd HH:mm:ss',
  shortDate: 'yyyy-MM-dd',
  shortTime: 'HH:mm:ss',
  fullDateTime: 'yyyy年MM月dd日 HH时mm分ss秒',
  custom: '自定义'
}

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
 * 相对时间（增强版）
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

/**
 * 获取多个时区的时间
 */
export function getTimeInTimezones(timestamp: number): Array<TimeZoneInfo & { time: string }> {
  const ms = timestamp > 1e12 ? timestamp : timestamp * 1000
  const date = new Date(ms)

  return COMMON_TIMEZONES.map(tz => ({
    ...tz,
    time: formatInTimezone(date, tz.timezone)
  }))
}

/**
 * 在指定时区格式化时间
 */
export function formatInTimezone(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date)
  } catch (e) {
    return '无效时区'
  }
}

/**
 * 计算倒计时
 */
export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  total: number
  isExpired: boolean
}

export function getCountdown(targetTimestamp: number): Countdown {
  const ms = targetTimestamp > 1e12 ? targetTimestamp : targetTimestamp * 1000
  const now = Date.now()
  const diff = ms - now

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      total: 0,
      isExpired: true
    }
  }

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  return {
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
    total: diff,
    isExpired: false
  }
}

/**
 * 计算两个时间戳的时间差
 */
export interface TimeDifference {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  formatted: string
}

export function calculateTimeDifference(
  timestamp1: number,
  timestamp2: number
): TimeDifference {
  const ms1 = timestamp1 > 1e12 ? timestamp1 : timestamp1 * 1000
  const ms2 = timestamp2 > 1e12 ? timestamp2 : timestamp2 * 1000

  const diff = Math.abs(ms2 - ms1)
  const totalSeconds = Math.floor(diff / 1000)
  const totalMinutes = Math.floor(totalSeconds / 60)
  const totalHours = Math.floor(totalMinutes / 60)
  const days = Math.floor(totalHours / 24)

  const hours = totalHours % 24
  const minutes = totalMinutes % 60
  const seconds = totalSeconds % 60

  const formatted = `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs: diff,
    formatted
  }
}

/**
 * 时间加减运算
 */
export function addTime(
  timestamp: number,
  amount: number,
  unit: 'days' | 'hours' | 'minutes' | 'seconds'
): number {
  const ms = timestamp > 1e12 ? timestamp : timestamp * 1000
  const date = new Date(ms)

  let newDate: Date
  switch (unit) {
    case 'days':
      newDate = addDays(date, amount)
      break
    case 'hours':
      newDate = addHours(date, amount)
      break
    case 'minutes':
      newDate = addMinutes(date, amount)
      break
    case 'seconds':
      newDate = addSeconds(date, amount)
      break
  }

  // 返回与输入相同单位的时间戳
  return timestamp > 1e12 ? newDate.getTime() : Math.floor(newDate.getTime() / 1000)
}

/**
 * 批量转换时间戳
 */
export function batchConvertTimestamps(
  timestamps: number[],
  formatStr: string = 'yyyy-MM-dd HH:mm:ss'
): Array<{ input: number; output: string; relative: string }> {
  return timestamps.map(ts => ({
    input: ts,
    output: timestampToDate(ts, formatStr),
    relative: getRelativeTime(ts)
  }))
}

/**
 * 获取更详细的相对时间描述
 */
export function getDetailedRelativeTime(timestamp: number): string {
  const ms = timestamp > 1e12 ? timestamp : timestamp * 1000
  const now = Date.now()
  const diff = now - ms

  const absDiff = Math.abs(diff)
  const seconds = Math.floor(absDiff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  const isPast = diff > 0

  if (years > 0) return `${years}年${isPast ? '前' : '后'}`
  if (months > 0) return `${months}个月${isPast ? '前' : '后'}`
  if (days > 0) return `${days}天${isPast ? '前' : '后'}`
  if (hours > 0) return `${hours}小时${isPast ? '前' : '后'}`
  if (minutes > 0) return `${minutes}分钟${isPast ? '前' : '后'}`
  if (seconds > 0) return `${seconds}秒${isPast ? '前' : '后'}`

  return '刚刚'
}