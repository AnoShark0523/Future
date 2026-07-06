/**
 * 编码解码工具函数
 */

/**
 * Base64 编码
 */
export function encodeBase64(text: string): string {
  try {
    // 处理UTF-8字符
    const utf8Text = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16))
    })
    return btoa(utf8Text)
  } catch (e) {
    return ''
  }
}

/**
 * Base64 解码
 */
export function decodeBase64(encoded: string): string {
  try {
    const utf8Text = atob(encoded)
    return decodeURIComponent(utf8Text.replace(/[\u0080-\uFFFF]/g, (_, p1) => {
      return `%${(p1.charCodeAt(0) >> 4).toString(16)}${(p1.charCodeAt(0) & 0x0F).toString(16)}`
    }))
  } catch (e) {
    return ''
  }
}

/**
 * URL 编码
 */
export function encodeURL(text: string): string {
  return encodeURIComponent(text)
}

/**
 * URL 解码
 */
export function decodeURL(encoded: string): string {
  try {
    return decodeURIComponent(encoded)
  } catch (e) {
    return ''
  }
}

/**
 * Unicode 编码
 */
export function encodeUnicode(text: string): string {
  return text.split('').map(char => {
    const code = char.charCodeAt(0)
    if (code > 127) {
      return `\\u${code.toString(16).padStart(4, '0')}`
    }
    return char
  }).join('')
}

/**
 * Unicode 解码
 */
export function decodeUnicode(encoded: string): string {
  return encoded.replace(/\\u([0-9a-fA-F]{4})/g, (_, p1) => {
    return String.fromCharCode(parseInt(p1, 16))
  })
}

/**
 * HTML实体编码
 */
export function encodeHTML(text: string): string {
  const htmlEntities: Record<string, string> = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&apos;',
    ' ': '&nbsp;'
  }

  return text.replace(/[<>&"'\s]/g, char => htmlEntities[char] || char)
}

/**
 * HTML实体解码
 */
export function decodeHTML(encoded: string): string {
  const htmlEntities: Record<string, string> = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&apos;': "'",
    '&nbsp;': ' '
  }

  return encoded.replace(/&[^;]+;/g, entity => htmlEntities[entity] || entity)
}

/**
 * 十六进制编码
 */
export function encodeHex(text: string): string {
  return text.split('').map(char => {
    const code = char.charCodeAt(0)
    return code.toString(16).padStart(2, '0')
  }).join(' ')
}

/**
 * 十六进制解码
 */
export function decodeHex(encoded: string): string {
  const hexCodes = encoded.split(/\s+/)
  return hexCodes.map(hex => {
    const code = parseInt(hex, 16)
    return String.fromCharCode(code)
  }).join('')
}

/**
 * 根据类型执行编码
 */
export function encode(type: string, text: string): string {
  switch (type) {
    case 'base64':
      return encodeBase64(text)
    case 'url':
      return encodeURL(text)
    case 'unicode':
      return encodeUnicode(text)
    case 'html':
      return encodeHTML(text)
    case 'hex':
      return encodeHex(text)
    default:
      return text
  }
}

/**
 * 根据类型执行解码
 */
export function decode(type: string, text: string): string {
  switch (type) {
    case 'base64':
      return decodeBase64(text)
    case 'url':
      return decodeURL(text)
    case 'unicode':
      return decodeUnicode(text)
    case 'html':
      return decodeHTML(text)
    case 'hex':
      return decodeHex(text)
    default:
      return text
  }
}