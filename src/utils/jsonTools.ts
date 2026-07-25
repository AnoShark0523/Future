/**
 * JSON工具函数集合
 */

// ==================== JSON转CSV ====================

/**
 * 将JSON数组转换为CSV格式
 */
export function jsonToCSV(json: any[]): string {
  if (!Array.isArray(json) || json.length === 0) {
    throw new Error('JSON必须是非空数组')
  }

  // 获取所有可能的键
  const allKeys = new Set<string>()
  json.forEach(item => {
    if (typeof item === 'object' && item !== null) {
      Object.keys(item).forEach(key => allKeys.add(key))
    }
  })

  const keys = Array.from(allKeys)
  if (keys.length === 0) {
    throw new Error('JSON数组中没有有效的对象')
  }

  // CSV转义函数
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // 构建CSV
  const header = keys.map(escapeCSV).join(',')
  const rows = json.map(item => {
    return keys.map(key => escapeCSV(item[key])).join(',')
  })

  return [header, ...rows].join('\n')
}

/**
 * 下载CSV文件
 */
export function downloadCSV(csvContent: string, filename: string = 'data.csv'): void {
  const BOM = '\uFEFF' // UTF-8 BOM
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// ==================== JSON转XML ====================

/**
 * 将JSON转换为XML格式
 */
export function jsonToXML(json: any, rootName: string = 'root'): string {
  const convert = (obj: any, tagName: string): string => {
    if (obj === null || obj === undefined) {
      return `<${tagName}/>`
    }

    if (Array.isArray(obj)) {
      return obj.map(item => convert(item, 'item')).join('\n  ')
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj)
      if (keys.length === 0) {
        return `<${tagName}/>`
      }
      const content = keys.map(key => convert(obj[key], key)).join('\n  ')
      return `<${tagName}>\n  ${content}\n</${tagName}>`
    }

    // 基本类型
    const escaped = String(obj)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
    return `<${tagName}>${escaped}</${tagName}>`
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n${convert(json, rootName)}`
}

// ==================== JSON Schema验证 ====================

export interface SchemaValidationError {
  path: string
  message: string
}

/**
 * 简单的JSON Schema验证器
 * 注意：这是一个简化实现，不支持所有JSON Schema特性
 */
export function validateJSONSchema(json: any, schema: any): SchemaValidationError[] {
  const errors: SchemaValidationError[] = []

  const validate = (value: any, schemaNode: any, path: string = 'root') => {
    if (!schemaNode || typeof schemaNode !== 'object') return

    // 类型检查
    if (schemaNode.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value
      if (actualType !== schemaNode.type && !(schemaNode.type === 'number' && actualType === 'number')) {
        if (schemaNode.type === 'integer' && !Number.isInteger(value)) {
          errors.push({ path, message: `期望类型为 ${schemaNode.type}，实际为 ${actualType}` })
        } else if (schemaNode.type !== 'integer') {
          errors.push({ path, message: `期望类型为 ${schemaNode.type}，实际为 ${actualType}` })
        }
      }
    }

    // 必填属性检查
    if (schemaNode.required && Array.isArray(schemaNode.required)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        schemaNode.required.forEach((prop: string) => {
          if (!(prop in value)) {
            errors.push({ path: `${path}.${prop}`, message: `缺少必填属性: ${prop}` })
          }
        })
      }
    }

    // 属性验证
    if (schemaNode.properties && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.keys(value).forEach(key => {
        if (schemaNode.properties[key]) {
          validate(value[key], schemaNode.properties[key], `${path}.${key}`)
        }
      })
    }

    // 数组项验证
    if (schemaNode.items && Array.isArray(value)) {
      value.forEach((item, index) => {
        validate(item, schemaNode.items, `${path}[${index}]`)
      })
    }

    // 枚举值检查
    if (schemaNode.enum && Array.isArray(schemaNode.enum)) {
      if (!schemaNode.enum.includes(value)) {
        errors.push({ path, message: `值必须是以下之一: ${schemaNode.enum.join(', ')}` })
      }
    }

    // 最小值/最大值检查
    if (typeof value === 'number') {
      if (schemaNode.minimum !== undefined && value < schemaNode.minimum) {
        errors.push({ path, message: `值 ${value} 小于最小值 ${schemaNode.minimum}` })
      }
      if (schemaNode.maximum !== undefined && value > schemaNode.maximum) {
        errors.push({ path, message: `值 ${value} 大于最大值 ${schemaNode.maximum}` })
      }
    }

    // 字符串长度检查
    if (typeof value === 'string') {
      if (schemaNode.minLength !== undefined && value.length < schemaNode.minLength) {
        errors.push({ path, message: `字符串长度 ${value.length} 小于最小长度 ${schemaNode.minLength}` })
      }
      if (schemaNode.maxLength !== undefined && value.length > schemaNode.maxLength) {
        errors.push({ path, message: `字符串长度 ${value.length} 大于最大长度 ${schemaNode.maxLength}` })
      }
    }

    // 数组长度检查
    if (Array.isArray(value)) {
      if (schemaNode.minItems !== undefined && value.length < schemaNode.minItems) {
        errors.push({ path, message: `数组长度 ${value.length} 小于最小长度 ${schemaNode.minItems}` })
      }
      if (schemaNode.maxItems !== undefined && value.length > schemaNode.maxItems) {
        errors.push({ path, message: `数组长度 ${value.length} 大于最大长度 ${schemaNode.maxItems}` })
      }
    }
  }

  validate(json, schema)
  return errors
}

// ==================== JSON Path查询 ====================

/**
 * 使用专业库实现JSONPath查询
 * 支持所有标准JSONPath语法
 */
export async function jsonPathQuery(json: any, path: string): Promise<any[]> {
  if (!path || path === '$') {
    return [json]
  }

  try {
    // 动态导入jsonpath-plus库
    const { JSONPath } = await import('jsonpath-plus')
    
    // 执行查询
    const result = JSONPath({
      path: path,
      json: json,
      wrap: true // 总是返回数组
    })

    return result || []
  } catch (error) {
    console.error('JSONPath查询错误:', error)
    return []
  }
}

// ==================== JSON差异对比 ====================

export interface JsonDiffResult {
  type: 'added' | 'removed' | 'modified' | 'unchanged'
  path: string
  oldValue?: any
  newValue?: any
}

/**
 * 深度对比两个JSON的差异
 */
export function diffJSON(oldJson: any, newJson: any, path: string = ''): JsonDiffResult[] {
  const results: JsonDiffResult[] = []

  // 类型不同
  if (typeof oldJson !== typeof newJson || Array.isArray(oldJson) !== Array.isArray(newJson)) {
    results.push({
      type: 'modified',
      path: path || 'root',
      oldValue: oldJson,
      newValue: newJson
    })
    return results
  }

  // 基本类型比较
  if (typeof oldJson !== 'object' || oldJson === null) {
    if (oldJson !== newJson) {
      results.push({
        type: 'modified',
        path: path || 'root',
        oldValue: oldJson,
        newValue: newJson
      })
    }
    return results
  }

  // 数组比较
  if (Array.isArray(oldJson) && Array.isArray(newJson)) {
    const maxLen = Math.max(oldJson.length, newJson.length)
    for (let i = 0; i < maxLen; i++) {
      const currentPath = path ? `${path}[${i}]` : `[${i}]`
      if (i >= oldJson.length) {
        results.push({
          type: 'added',
          path: currentPath,
          newValue: newJson[i]
        })
      } else if (i >= newJson.length) {
        results.push({
          type: 'removed',
          path: currentPath,
          oldValue: oldJson[i]
        })
      } else {
        results.push(...diffJSON(oldJson[i], newJson[i], currentPath))
      }
    }
    return results
  }

  // 对象比较
  const oldKeys = Object.keys(oldJson)
  const newKeys = Object.keys(newJson)
  const allKeys = new Set([...oldKeys, ...newKeys])

  allKeys.forEach(key => {
    const currentPath = path ? `${path}.${key}` : key
    const inOld = key in oldJson
    const inNew = key in newJson

    if (!inOld && inNew) {
      results.push({
        type: 'added',
        path: currentPath,
        newValue: newJson[key]
      })
    } else if (inOld && !inNew) {
      results.push({
        type: 'removed',
        path: currentPath,
        oldValue: oldJson[key]
      })
    } else {
      results.push(...diffJSON(oldJson[key], newJson[key], currentPath))
    }
  })

  return results
}

/**
 * 格式化差异结果为HTML（带高亮）
 */
export function formatDiffHTML(diffs: JsonDiffResult[]): string {
  if (diffs.length === 0) {
    return '<div class="text-success">✓ 两个JSON完全相同</div>'
  }

  const lines = diffs.map(diff => {
    let className = ''
    let icon = ''
    let content = ''

    switch (diff.type) {
      case 'added':
        className = 'diff-added'
        icon = '+'
        content = `${diff.path}: ${JSON.stringify(diff.newValue)}`
        break
      case 'removed':
        className = 'diff-removed'
        icon = '-'
        content = `${diff.path}: ${JSON.stringify(diff.oldValue)}`
        break
      case 'modified':
        className = 'diff-modified'
        icon = '~'
        content = `${diff.path}: ${JSON.stringify(diff.oldValue)} → ${JSON.stringify(diff.newValue)}`
        break
      default:
        return ''
    }

    return `<div class="${className}">${icon} ${content}</div>`
  }).filter(line => line !== '')

  return lines.join('\n')
}

// ==================== JSON统计信息 ====================

export interface JsonStats {
  keyCount: number          // 键的总数量
  maxDepth: number          // 最大层级深度
  arrayCount: number        // 数组数量
  objectCount: number       // 对象数量
  primitiveCount: number    // 基本类型数量
  nullCount: number         // null值数量
  totalSize: number         // 总节点数
}

/**
 * 统计JSON的结构信息（修正版，避免重复统计）
 */
export function getJsonStats(json: any): JsonStats {
  const stats: JsonStats = {
    keyCount: 0,
    maxDepth: 0,
    arrayCount: 0,
    objectCount: 0,
    primitiveCount: 0,
    nullCount: 0,
    totalSize: 0
  }

  const analyze = (value: any, depth: number) => {
    stats.totalSize++
    stats.maxDepth = Math.max(stats.maxDepth, depth)

    if (value === null) {
      stats.nullCount++
      return
    }

    if (Array.isArray(value)) {
      stats.arrayCount++
      value.forEach(item => analyze(item, depth + 1))
      return
    }

    if (typeof value === 'object') {
      stats.objectCount++
      const keys = Object.keys(value)
      stats.keyCount += keys.length
      // 不再递归分析value本身，只分析value的属性值
      keys.forEach(key => {
        analyze(value[key], depth + 1)
      })
      return
    }

    // 基本类型
    stats.primitiveCount++
  }

  analyze(json, 0)
  return stats
}

/**
 * 格式化统计信息为文本（简洁版）
 */
export function formatStats(stats: JsonStats): string {
  return `📊 JSON统计信息

总键数量：${stats.keyCount}
最大层级深度：${stats.maxDepth}
数组数量：${stats.arrayCount}
对象数量：${stats.objectCount}
基本类型数量：${stats.primitiveCount}
null值数量：${stats.nullCount}
总节点数：${stats.totalSize}

成员：键(${stats.keyCount}) 深度(${stats.maxDepth}) 数组(${stats.arrayCount}) 对象(${stats.objectCount}) 基本类型(${stats.primitiveCount}) null(${stats.nullCount}) 节点(${stats.totalSize})`
}