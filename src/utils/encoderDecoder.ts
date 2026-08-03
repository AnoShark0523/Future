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
  const hexCodes = encoded.split(/\s+/).filter(h => h.length > 0)
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
  const binaryCodes = encoded.split(/\s+/).filter(b => b.length > 0)
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

  // 注意：Web Crypto API不直接支持MD5，使用本地实现
  if (algorithm === 'MD5') {
    return md5(text)
  }

  const algo = algorithm === 'SHA-1' ? 'SHA-1' : 'SHA-256'
  hashBuffer = await crypto.subtle.digest(algo, data)

  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * MD5 哈希算法实现（RFC 1321）
 */
function md5(text: string): string {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  const originalLength = bytes.length

  // 每轮左移位数
  const s = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ]

  // 每轮常量 K = floor(abs(sin(i+1)) * 2^32)
  const K = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ]

  // 初始化哈希值
  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  // 预处理：填充消息
  const bitLength = originalLength * 8
  const paddedLength = Math.ceil((originalLength + 9) / 64) * 64
  const padded = new Uint8Array(paddedLength)
  padded.set(bytes)
  padded[originalLength] = 0x80

  const view = new DataView(padded.buffer)
  // 附加原始长度（64位小端序）
  view.setUint32(paddedLength - 8, bitLength >>> 0, true)
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true)

  // 处理每个 512 位（64 字节）块
  for (let i = 0; i < paddedLength; i += 64) {
    const M = new Array<number>(16)
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(i + j * 4, true)
    }

    let A = a0, B = b0, C = c0, D = d0

    for (let j = 0; j < 64; j++) {
      let F: number
      let g: number

      if (j < 16) {
        F = (B & C) | (~B & D)
        g = j
      } else if (j < 32) {
        F = (D & B) | (~D & C)
        g = (5 * j + 1) % 16
      } else if (j < 48) {
        F = B ^ C ^ D
        g = (3 * j + 5) % 16
      } else {
        F = C ^ (B | ~D)
        g = (7 * j) % 16
      }

      F = (F + A + K[j] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + ((F << s[j]) | (F >>> (32 - s[j])))) >>> 0
    }

    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }

  // 输出（小端序）
  const result = new Uint8Array(16)
  const resultView = new DataView(result.buffer)
  resultView.setUint32(0, a0, true)
  resultView.setUint32(4, b0, true)
  resultView.setUint32(8, c0, true)
  resultView.setUint32(12, d0, true)

  return Array.from(result).map(b => b.toString(16).padStart(2, '0')).join('')
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