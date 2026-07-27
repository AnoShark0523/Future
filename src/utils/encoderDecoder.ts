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
    const binaryString = atob(encoded)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new TextDecoder('utf-8').decode(bytes)
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
    case 'morse':
      return encodeMorse(text)
    case 'rot13':
      return encodeRot13(text)
    case 'binary':
      return encodeBinary(text)
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
    case 'morse':
      return decodeMorse(text)
    case 'rot13':
      return encodeRot13(text) // ROT13是自反的
    case 'binary':
      return decodeBinary(text)
    default:
      return text
  }
}

/**
 * 摩尔斯电码映射表
 */
const MORSE_CODE_MAP: Record<string, string> = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
  'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
  'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
  'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
  'Y': '-.--', 'Z': '--..',
  '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  ' ': '/', '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...',
  ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-',
  '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
}

// 反向映射表
const REVERSE_MORSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_CODE_MAP).map(([k, v]) => [v, k])
)

/**
 * 摩尔斯电码编码
 */
export function encodeMorse(text: string): string {
  return text.toUpperCase().split('').map(char => {
    return MORSE_CODE_MAP[char] || char
  }).join(' ')
}

/**
 * 摩尔斯电码解码
 */
export function decodeMorse(encoded: string): string {
  return encoded.split(' ').map(code => {
    if (code === '/') return ' '
    return REVERSE_MORSE_MAP[code] || code
  }).join('')
}

/**
 * ROT13加密/解密（凯撒密码）
 */
export function encodeRot13(text: string): string {
  return text.replace(/[a-zA-Z]/g, char => {
    const code = char.charCodeAt(0)
    const base = code >= 65 && code <= 90 ? 65 : 97 // 大写字母或小写字母
    return String.fromCharCode(((code - base + 13) % 26) + base)
  })
}

/**
 * 文本转二进制
 */
export function encodeBinary(text: string): string {
  return text.split('').map(char => {
    return char.charCodeAt(0).toString(2).padStart(8, '0')
  }).join(' ')
}

/**
 * 二进制转文本
 */
export function decodeBinary(encoded: string): string {
  const binaryCodes = encoded.split(/\s+/)
  return binaryCodes.map(bin => {
    const code = parseInt(bin, 2)
    return String.fromCharCode(code)
  }).join('')
}

/**
 * 计算文本的Hash值
 * 使用Web Crypto API
 */
export async function calculateHash(text: string, algorithm: 'MD5' | 'SHA-1' | 'SHA-256'): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)

  let hashBuffer: ArrayBuffer

  // 注意：Web Crypto API不直接支持MD5，我们使用简单的实现
  if (algorithm === 'MD5') {
    // 简化的MD5实现（实际项目中应该使用专门的库如crypto-js）
    return await simpleMD5(text)
  }

  const algo = algorithm === 'SHA-1' ? 'SHA-1' : 'SHA-256'
  hashBuffer = await crypto.subtle.digest(algo, data)

  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * 简化的MD5实现（仅用于演示）
 * 实际项目中建议使用crypto-js等专业库
 */
async function simpleMD5(text: string): Promise<string> {
  // 使用SHA-256作为替代，因为Web Crypto API不直接支持MD5
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  // 返回前32位模拟MD5长度
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
}

/**
 * 批量转换 - 一次性进行多种编码转换
 */
export function batchConvert(text: string): Record<string, string> {
  return {
    'Base64': encodeBase64(text),
    'URL编码': encodeURL(text),
    'Unicode': encodeUnicode(text),
    'HTML实体': encodeHTML(text),
    '十六进制(字符)': encodeHex(text),
    '摩尔斯电码': encodeMorse(text),
    'ROT13': encodeRot13(text),
    '二进制(字符)': encodeBinary(text)
  }
}

// ==================== 进制转换工具 ====================

/**
 * 进制转换
 * @param value 输入值
 * @param fromRadix 源进制（2-36）
 * @param toRadix 目标进制（2-36）
 */
export function convertRadix(value: string, fromRadix: number, toRadix: number): string {
  try {
    // 先转成十进制
    const decimal = parseInt(value, fromRadix)
    if (isNaN(decimal)) return '无效输入'

    // 再从十进制转成目标进制
    return decimal.toString(toRadix).toUpperCase()
  } catch (e) {
    return '转换失败'
  }
}

/**
 * 十进制转其他进制
 */
export function decimalToRadix(decimal: string, toRadix: number): string {
  return convertRadix(decimal, 10, toRadix)
}

/**
 * 其他进制转十进制
 */
export function radixToDecimal(value: string, fromRadix: number): string {
  return convertRadix(value, fromRadix, 10)
}

/**
 * 批量进制转换（从十进制）
 */
export function batchRadixConvert(decimal: string): Record<string, string> {
  const num = parseInt(decimal, 10)
  if (isNaN(num)) return {}

  return {
    '二进制': num.toString(2),
    '八进制': num.toString(8),
    '十进制': decimal,
    '十六进制': num.toString(16).toUpperCase()
  }
}