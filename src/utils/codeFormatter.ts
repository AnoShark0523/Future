/**
 * 代码格式化工具函数
 */
import * as prettier from 'prettier/standalone'
import babelPlugin from 'prettier/plugins/babel'
import estreePlugin from 'prettier/plugins/estree'
import typescriptPlugin from 'prettier/plugins/typescript'
import htmlPlugin from 'prettier/plugins/html'
import postcssPlugin from 'prettier/plugins/postcss'
import markdownPlugin from 'prettier/plugins/markdown'
import yamlPlugin from 'prettier/plugins/yaml'
import graphqlPlugin from 'prettier/plugins/graphql'

// Prettier 插件集合（standalone 模式必须显式注册）
// 注：prettier-plugin-sh 在浏览器环境下不兼容（sh-syntax 缺少 processor 导出）
// 注：prettier-plugin-java 依赖 web-tree-sitter.wasm，Vite 开发模式下 wasm MIME 类型不正确，
//     改为动态导入，失败时回退到简单格式化
// 注：prettier-plugin-sql 同样改为动态导入
const prettierPlugins = [
  babelPlugin,
  estreePlugin,
  typescriptPlugin,
  htmlPlugin,
  postcssPlugin,
  markdownPlugin,
  yamlPlugin,
  graphqlPlugin
]

// 动态加载的插件缓存
let sqlPluginLoaded: any = null
let javaPluginLoaded: any = null
let sqlPluginFailed = false
let javaPluginFailed = false

/**
 * 动态加载 SQL 插件（可能因 wasm 问题失败）
 */
async function loadSqlPlugin(): Promise<any> {
  if (sqlPluginLoaded) return sqlPluginLoaded
  if (sqlPluginFailed) return null
  try {
    const mod = await import('prettier-plugin-sql')
    sqlPluginLoaded = mod.default || mod
    return sqlPluginLoaded
  } catch {
    sqlPluginFailed = true
    return null
  }
}

/**
 * 动态加载 Java 插件（依赖 wasm，浏览器环境可能失败）
 */
async function loadJavaPlugin(): Promise<any> {
  if (javaPluginLoaded) return javaPluginLoaded
  if (javaPluginFailed) return null
  try {
    const mod = await import('prettier-plugin-java')
    javaPluginLoaded = mod.default || mod
    return javaPluginLoaded
  } catch {
    javaPluginFailed = true
    return null
  }
}

interface FormatterOptions {
  parser: string
  tabWidth?: number
  useTabs?: boolean
  semi?: boolean
  singleQuote?: boolean
  trailingComma?: 'none' | 'es5' | 'all'
  bracketSpacing?: boolean
  arrowParens?: 'avoid' | 'always'
  printWidth?: number
}

/**
 * 代码统计结果接口
 */
export interface CodeStats {
  lines: number          // 总行数
  characters: number     // 字符数
  functions: number      // 函数数
  comments: number       // 注释行数
  codeLines: number      // 代码行数
  blankLines: number     // 空白行数
}

/**
 * 语法错误信息接口
 */
export interface SyntaxError {
  line: number
  column: number
  message: string
  severity: 'error' | 'warning'
}

/**
 * 获取语言的parser类型
 * 返回空字符串表示该语言没有Prettier parser（使用简单格式化）
 */
export function getParser(language: string): string {
  const parserMap: Record<string, string> = {
    javascript: 'babel',
    typescript: 'typescript',
    json: 'json',
    html: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    markdown: 'markdown',
    yaml: 'yaml',
    graphql: 'graphql',
    vue: 'vue',
    angular: 'angular',
    mdx: 'mdx',
    sql: 'sql',
    // shell / dockerfile 走简单格式化（prettier-plugin-sh 浏览器不兼容）
    java: 'java',
    // C/C++ 使用专用格式化器（在 formatCode 中特殊处理）
    c: 'c',
    cpp: 'cpp'
    // python / go / rust 暂无 Prettier 官方插件，使用简单格式化
  }

  return parserMap[language.toLowerCase()] || ''
}

/**
 * C/C++ 代码格式化器
 * 专门处理 C/C++ 代码，模仿 clang-format 风格
 */
function formatCCode(code: string, options: FormatterOptions): string {
  const indentUnit = options.useTabs ? '\t' : ' '.repeat(options.tabWidth ?? 2)

  // 第一步：清理原始代码
  let processed = code
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/[ \t]+$/gm, '')

  // 第二步：保护字符串和注释
  const strings: string[] = []
  const comments: string[] = []
  processed = processed.replace(/\/\*[\s\S]*?\*\//g, m => {
    comments.push(m)
    return `\x00C${comments.length - 1}\x00`
  })
  processed = processed.replace(/\/\/[^\n]*/g, m => {
    comments.push(m)
    return `\x00C${comments.length - 1}\x00`
  })
  // 保护 #include <...> 尖括号包含的头文件（避免被当作字符串）
  const includes: string[] = []
  processed = processed.replace(/#include\s*<[^>]+>/g, m => {
    includes.push(m)
    return `\x00I${includes.length - 1}\x00`
  })
  processed = processed.replace(/"(?:[^"\\]|\\.)*"/g, m => {
    strings.push(m)
    return `\x00S${strings.length - 1}\x00`
  })
  processed = processed.replace(/'(?:[^'\\]|\\.)*'/g, m => {
    strings.push(m)
    return `\x00S${strings.length - 1}\x00`
  })

  // 第三步：合并为一行
  processed = processed.replace(/\n\s*/g, ' ')
  processed = processed.replace(/\s+/g, ' ').trim()

  // 第四步：智能拆分
  // 4.1 预处理指令：#include/#define 等前面加换行
  processed = processed.replace(/#(\s*)(include|define|ifdef|ifndef|endif|else|elif|pragma|error|warning|undef|line)/gi, '\n#$1$2')

  // 恢复 #include 占位符
  includes.forEach((inc, i) => {
    processed = processed.replace(`\x00I${i}\x00`, inc)
  })

  // 每个 #include 后强制换行（如果不是已换行）
  processed = processed.replace(/(#include\s*<[^>]+>)(?!$)(?!\n)/g, '$1\n')
  processed = processed.replace(/(#include\s*"[^"]+")(?!$)(?!\n)/g, '$1\n')

  // 4.2 访问修饰符前换行（注意：private: 后的内容也要换行）
  processed = processed.replace(/\b(public|private|protected)\s*:\s*/gi, '\n$1:\n')

  // 4.3 分号后换行（用更精确的方式：不在 for 循环括号内）
  // 先把 for(...) 中的分号保护起来
  const forLoops: string[] = []
  processed = processed.replace(/\bfor\s*\([^)]*\)/g, m => {
    forLoops.push(m)
    return `\x00F${forLoops.length - 1}\x00`
  })

  // 4.4 类定义结束 }; 保护起来（避免被拆开）
  const classEnds: string[] = []
  processed = processed.replace(/\}\s*;/g, m => {
    classEnds.push('};')
    return `\x00E${classEnds.length - 1}\x00`
  })

  // 4.5 在 } 前换行
  processed = processed.replace(/\s*\}/g, '\n}')
  // 4.6 在 } 后换行
  processed = processed.replace(/\}\s*/g, '}\n')

  // 4.7 分号后换行
  processed = processed.replace(/;\s*/g, ';\n')

  // 4.8 在 { 前确保有空格
  processed = processed.replace(/\s*\{/g, ' {')

  // 4.9 { 后换行
  processed = processed.replace(/{\s*/g, '{\n')

  // 恢复 for 循环
  forLoops.forEach((f, i) => {
    processed = processed.replace(`\x00F${i}\x00`, f)
  })

  // 恢复类结束符 };（单独一行）
  classEnds.forEach((e, i) => {
    processed = processed.replace(`\x00E${i}\x00`, '};\n')
  })

  // 第五步：智能合并 - 让 { 跟在特定结构后
  const mergePatterns = [
    // 函数定义: 返回类型 函数名(...) {
    /(\b(?:int|void|float|double|char|bool|auto|string|long|short|unsigned|signed|size_t|std::\w+|const\s+[\w:]+|static\s+[\w:]+)\s+\*?\w+\s*\([^)]*\))\s*\n?\s*\{/g,
    // 控制结构
    /(\b(?:if|else\s+if|for|while|switch)\s*\([^)]*\))\s*\n?\s*\{/g,
    /(\belse)\s*\n?\s*\{/g,
    /(\bdo)\s*\n?\s*\{/g,
    /(\b(?:class|struct|namespace|enum|union)\s+\w+)\s*\n?\s*\{/g,
    /(\b(?:try|catch)\s*(?:\([^)]*\))?)\s*\n?\s*\{/g,
  ]
  mergePatterns.forEach(pattern => {
    processed = processed.replace(pattern, '$1 {')
  })

  // 第六步：清理
  processed = processed
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .replace(/^\n+/, '')
    .trim()

  // 恢复字符串和注释
  strings.forEach((s, i) => {
    processed = processed.replace(`\x00S${i}\x00`, s)
  })
  comments.forEach((c, i) => {
    processed = processed.replace(`\x00C${i}\x00`, c)
  })

  // 第七步：缩进
  const lines = processed.split('\n')
  let level = 0
  const out: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      out.push('')
      continue
    }

    const openBraces = (trimmed.match(/{/g) || []).length
    const closeBraces = (trimmed.match(/}/g) || []).length

    let currentLevel = level
    if (/^[}\s]*}/.test(trimmed)) {
      currentLevel = Math.max(0, level - 1)
    }

    out.push(indentUnit.repeat(currentLevel) + trimmed)

    level += openBraces - closeBraces
    level = Math.max(0, level)
  }

  // 第八步：精细调整空行
  let result = out.join('\n')
  result = result
    // } 后面如果非 }/else/catch/while 开头，加空行
    .replace(/}\n(?!\s*(?:}|else|catch|while|finally|#))/g, '}\n\n')
    // }; 后面加空行（类定义结束）
    .replace(/\};\n(?!\s*(?:}|#))/g, '};\n\n')
    // 预处理指令前空行（除非上一行也是预处理指令）
    .replace(/([^#\n])\n(#)/g, '$1\n\n$2')
    // 连续的 #include 不空行
    .replace(/(#\s*include[^\n]*\n)\n(#\s*include)/g, '$1$2')
    // class/struct/namespace 前空行
    .replace(/([^\n])\n(\s*(?:class|struct|namespace|enum)\s)/g, '$1\n\n$2')
    // 函数定义前空行
    .replace(/}\n(\s*(?:int|void|float|double|char|bool|auto|string|long|short|unsigned|signed|size_t|std::\w+|const|static)\s)/g, '}\n\n$1')
    // 多个空行变一个
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd() + '\n'

  return result
}

/**
 * 简单格式化（用于 Prettier 不支持的语言：Python/Go/Rust 等）
 * 智能拆分单行代码并添加缩进
 */
function simpleFormat(code: string, options: FormatterOptions): string {
  const indentUnit = options.useTabs ? '\t' : ' '.repeat(options.tabWidth ?? 2)

  // 第一步：智能拆分单行代码
  let processed = code

  // ========== C/C++ 特殊处理 ==========
  // 预处理指令：每个 # 开头的行单独一行
  processed = processed.replace(/#include/gi, '\n#include')
  processed = processed.replace(/#define/gi, '\n#define')
  processed = processed.replace(/#ifdef/gi, '\n#ifdef')
  processed = processed.replace(/#ifndef/gi, '\n#ifndef')
  processed = processed.replace(/#endif/gi, '\n#endif')
  processed = processed.replace(/#pragma/gi, '\n#pragma')

  // ========== 通用处理 ==========
  // 1. 分号后换行
  processed = processed.replace(/;\s*/g, ';\n')

  // 2. 在 { 前换行，并确保 { 单独一行
  processed = processed.replace(/\s*\{\s*/g, '\n{\n')

  // 3. 在 } 前后换行
  processed = processed.replace(/\s*\}\s*/g, '\n}\n')

  // 4. 在特定关键字前换行（C/C++/Go/Rust/Python）
  const keywords = [
    'int', 'float', 'double', 'char', 'void', 'bool', 'auto',
    'class', 'struct', 'namespace', 'template', 'typedef',
    'if', 'else', 'for', 'while', 'switch', 'case', 'default',
    'return', 'break', 'continue', 'try', 'catch', 'throw',
    'def', 'func', 'fn', 'impl', 'let', 'const', 'var'
  ]
  keywords.forEach(kw => {
    // 在关键字前换行（确保前面不是换行符或空白）
    const regex = new RegExp(`(?<![\\n\\s])\\b${kw}\\b`, 'g')
    processed = processed.replace(regex, '\n' + kw)
  })

  // C++ 访问修饰符单独一行
  processed = processed.replace(/\b(public|private|protected)\s*:/gi, '\n$1:')

  // 5. 清理多余空格和空行
  processed = processed
    .replace(/[ \t]+/g, ' ')           // 多个空格变一个
    .replace(/\n\s*\n\s*\n/g, '\n\n')  // 多个空行变两个
    .replace(/^\s+/, '')               // 清除开头空格
    .trim()

  // ========== 第二步：基于括号层级添加缩进 ==========
  const lines = processed.split('\n')
  let level = 0
  const out: string[] = []

  for (const raw of lines) {
    const trimmed = raw.trim()
    if (!trimmed) {
      out.push('')
      continue
    }

    // 检查是否是闭合符号开头的行（需要先降级）
    const closeMatch = trimmed.match(/^([}\])]+)/)
    if (closeMatch) {
      level = Math.max(0, level - closeMatch[1].length)
    }

    // 添加当前行（带缩进）
    out.push(indentUnit.repeat(level) + trimmed)

    // 检查是否需要升级缩进级别
    const openCount = (trimmed.match(/[{[(]/g) || []).length
    const closeCount = (trimmed.match(/[}\])]/g) || []).length

    level += openCount - closeCount
    level = Math.max(0, level)
  }

  return out.join('\n').trimEnd() + '\n'
}

/**
 * 格式化代码
 */
export async function formatCode(
  code: string,
  options: FormatterOptions
): Promise<string> {
  try {
    // C/C++ 使用专用格式化器
    if (options.parser === 'c' || options.parser === 'cpp') {
      return formatCCode(code, options)
    }

    // 没有 parser 的语言走简单格式化
    if (!options.parser) {
      return simpleFormat(code, options)
    }

    // SQL 和 Java 需要动态加载插件（依赖 wasm，可能失败）
    let plugins = prettierPlugins
    if (options.parser === 'sql') {
      const sqlPlugin = await loadSqlPlugin()
      if (sqlPlugin) {
        plugins = [...prettierPlugins, sqlPlugin]
      } else {
        // SQL 插件加载失败，回退到简单格式化
        return simpleFormat(code, options)
      }
    } else if (options.parser === 'java') {
      const javaPlugin = await loadJavaPlugin()
      if (javaPlugin) {
        plugins = [...prettierPlugins, javaPlugin]
      } else {
        // Java 插件加载失败，回退到简单格式化
        return simpleFormat(code, options)
      }
    }

    // Markdown 和 YAML 的特殊预处理
    let processedCode = code
    if (options.parser === 'markdown') {
      // Markdown: 确保标题、列表前有换行
      processedCode = code
        .replace(/([^\n])(#{1,6}\s)/g, '$1\n$2')           // 标题前换行
        .replace(/([^\n])([-*+]\s)/g, '$1\n$2')            // 列表前换行
        .replace(/([^\n])(\d+\.\s)/g, '$1\n$2')            // 有序列表前换行
        .replace(/([^\n])(```)/g, '$1\n$2')                // 代码块前换行
        .replace(/(\*\*[^*]+\*\*)([^\n*])/g, '$1 $2')      // 粗体后加空格
        .replace(/(\*[^*]+\*)([^\n*])/g, '$1 $2')          // 斜体后加空格
    } else if (options.parser === 'yaml') {
      // YAML: 确保键值对前有换行
      processedCode = code
        .replace(/([^\n])(\w+:)/g, '$1\n$2')               // 键前换行
        .replace(/:\s*(?=\w)/g, ': ')                       // 冒号后加空格
    }

    const formatted = await prettier.format(processedCode, {
      parser: options.parser,
      plugins: plugins,
      tabWidth: options.tabWidth ?? 2,
      useTabs: options.useTabs ?? false,
      semi: options.semi ?? true,
      singleQuote: options.singleQuote ?? false,
      trailingComma: options.trailingComma ?? 'es5',
      bracketSpacing: options.bracketSpacing ?? true,
      arrowParens: options.arrowParens ?? 'always',
      printWidth: options.printWidth ?? 80,
      // Markdown 特定选项：强制换行
      proseWrap: options.parser === 'markdown' ? 'always' : 'preserve',
      // YAML 特定选项
      quoteProps: 'as-needed'
    })

    return formatted
  } catch (error: any) {
    // 如果 Prettier 失败，尝试简单格式化
    if (options.parser === 'markdown' || options.parser === 'yaml') {
      try {
        return simpleFormat(code, options)
      } catch {
        // 简单格式化也失败，返回原代码
        return code
      }
    }
    throw new Error(`格式化失败: ${error.message}`)
  }
}

/**
 * 检查代码是否需要格式化
 */
export async function checkFormatting(
  code: string,
  options: FormatterOptions
): Promise<boolean> {
  try {
    const formatted = await formatCode(code, options)
    return code !== formatted
  } catch (error) {
    return false
  }
}

/**
 * 代码压缩/最小化
 */
export function minifyCode(code: string, language: string): string {
  // 移除注释和多余空白
  let minified = code

  // 根据语言类型处理
  switch (language) {
    case 'javascript':
    case 'typescript':
    case 'java':
    case 'go':
    case 'rust':
    case 'c':
    case 'cpp':
      // 移除单行注释
      minified = minified.replace(/\/\/.*$/gm, '')
      // 移除多行注释
      minified = minified.replace(/\/\*[\s\S]*?\*\//g, '')
      // 移除多余空白
      minified = minified.replace(/\s+/g, ' ')
      // 移除操作符周围的空格
      minified = minified.replace(/\s*([{}();,:=+\-*/&|<>!])\s*/g, '$1')
      break

    case 'python':
    case 'shell':
      // 移除Python/Shell注释
      minified = minified.replace(/#.*$/gm, '')
      // 移除多行字符串（Python三引号）
      minified = minified.replace(/'''[\s\S]*?'''/g, '')
      minified = minified.replace(/"""[\s\S]*?"""/g, '')
      minified = minified.replace(/\s+/g, ' ')
      break

    case 'html':
    case 'vue':
      // 移除HTML注释
      minified = minified.replace(/<!--[\s\S]*?-->/g, '')
      // 移除多余空白
      minified = minified.replace(/\s+/g, ' ')
      // 移除标签间空白
      minified = minified.replace(/>\s+</g, '><')
      break

    case 'css':
    case 'scss':
    case 'less':
      // 移除CSS注释
      minified = minified.replace(/\/\*[\s\S]*?\*\//g, '')
      // 移除多余空白
      minified = minified.replace(/\s+/g, ' ')
      minified = minified.replace(/\s*([{};:,])\s*/g, '$1')
      break

    case 'sql':
      // 移除SQL注释
      minified = minified.replace(/--.*$/gm, '')
      minified = minified.replace(/\/\*[\s\S]*?\*\//g, '')
      minified = minified.replace(/\s+/g, ' ')
      break

    default:
      // 通用处理：移除多余空白
      minified = minified.replace(/\s+/g, ' ').trim()
  }

  return minified.trim()
}

/**
 * 统计代码信息
 */
export function analyzeCode(code: string, language: string): CodeStats {
  const lines = code.split('\n')

  let functions = 0
  let comments = 0
  let blankLines = 0
  let codeLines = 0

  // 统计空白行和代码行
  lines.forEach(line => {
    const trimmed = line.trim()
    if (trimmed === '') {
      blankLines++
    } else {
      codeLines++
    }
  })

  // 根据语言统计函数和注释
  switch (language) {
    case 'javascript':
    case 'typescript':
      // 函数统计（包括function关键字、箭头函数、方法简写）
      functions = (code.match(/function\s+\w+|=>\s*{|=>\s*\w+|\w+\s*\([^)]*\)\s*{/g) || []).length
      // 注释行统计
      comments = lines.filter(line => {
        const trimmed = line.trim()
        return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')
      }).length
      break

    case 'python':
      // Python函数统计
      functions = (code.match(/^\s*def\s+\w+/gm) || []).length
      // Python注释统计（#开头的行）
      comments = lines.filter(line => line.trim().startsWith('#')).length
      break

    case 'java':
    case 'go':
    case 'rust':
    case 'c':
    case 'cpp':
      // 类C语言函数统计
      functions = (code.match(/func\s+\w+|func\s*\(|public\s+\w+\s+\w+\s*\(|private\s+\w+\s+\w+\s*\(|\w+\s+\w+\s*\([^)]*\)\s*{/g) || []).length
      // 注释统计
      comments = lines.filter(line => {
        const trimmed = line.trim()
        return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#include') || trimmed.startsWith('#define')
      }).length
      break

    case 'sql':
      // SQL函数/存储过程统计
      functions = (code.match(/create\s+(function|procedure)\s+\w+/gi) || []).length
      // SQL注释统计
      comments = lines.filter(line => {
        const trimmed = line.trim()
        return trimmed.startsWith('--') || trimmed.startsWith('/*')
      }).length
      break

    case 'shell':
    case 'dockerfile':
      // Shell函数统计
      functions = (code.match(/^\s*function\s+\w+|^\s*\w+\s*\(\)\s*{/gm) || []).length
      // Shell注释统计
      comments = lines.filter(line => line.trim().startsWith('#')).length
      break

    case 'css':
    case 'scss':
    case 'less':
      // CSS选择器统计作为"函数"计数
      functions = (code.match(/[.#]?[\w-]+\s*{/g) || []).length
      // CSS注释统计
      comments = lines.filter(line => line.trim().startsWith('/*') || line.trim().startsWith('*')).length
      break

    case 'html':
    case 'vue':
      // HTML标签统计
      functions = (code.match(/<[a-z][\w-]*/gi) || []).length
      // HTML注释统计
      comments = lines.filter(line => line.trim().startsWith('<!--')).length
      break

    default:
      // 默认统计：简单的行数统计
      comments = 0
  }

  return {
    lines: lines.length,
    characters: code.length,
    functions,
    comments,
    codeLines,
    blankLines
  }
}

/**
 * 简单的语法检查
 */
export function checkSyntax(code: string, language: string): SyntaxError[] {
  const errors: SyntaxError[] = []

  // 简单的括号匹配检查
  const brackets = { '{': '}', '[': ']', '(': ')' }
  const stack: { char: string, line: number, column: number }[] = []
  const lines = code.split('\n')

  lines.forEach((line, lineIndex) => {
    let columnIndex = 0
    for (const char of line) {
      columnIndex++
      if (char in brackets) {
        stack.push({ char, line: lineIndex + 1, column: columnIndex })
      } else if (Object.values(brackets).includes(char)) {
        const last = stack.pop()
        if (!last || brackets[last.char as keyof typeof brackets] !== char) {
          errors.push({
            line: lineIndex + 1,
            column: columnIndex,
            message: `未匹配的括号: ${char}`,
            severity: 'error'
          })
        }
      }
    }
  })

  // 检查未闭合的括号
  stack.forEach(item => {
    errors.push({
      line: item.line,
      column: item.column,
      message: `未闭合的括号: ${item.char}`,
      severity: 'error'
    })
  })

  // 语言特定的检查
  if (language === 'javascript' || language === 'typescript') {
    // 检查常见错误
    const jsLines = code.split('\n')
    jsLines.forEach((line, index) => {
      // 检查缺少分号的语句（简单检查）
      if (line.trim().endsWith(')') && !line.trim().endsWith('();') &&
          !line.includes('if') && !line.includes('for') && !line.includes('while') &&
          !line.trim().endsWith('{') && !line.trim().endsWith('}') &&
          !line.trim().endsWith(',')) {
        // 这只是一个简单提示，不是真正的错误
        // errors.push({
        //   line: index + 1,
        //   column: line.length,
        //   message: '可能缺少分号',
        //   severity: 'warning'
        // })
      }
    })
  }

  return errors
}

/**
 * 格式化配置选项描述
 */
export const formatterConfigDescriptions: Record<string, string> = {
  tabWidth: '缩进宽度',
  useTabs: '使用Tab代替空格',
  semi: '在语句末尾添加分号',
  singleQuote: '使用单引号代替双引号',
  trailingComma: '在多行语法中添加尾逗号',
  bracketSpacing: '在对象字面量的括号之间添加空格',
  arrowParens: '箭头函数参数括号',
  printWidth: '每行最大字符数'
}

/**
 * 代码片段模板
 */
export const codeTemplates: Record<string, { name: string; code: string; description: string }> = {
  'react-component': {
    name: 'React 组件',
    description: 'React函数组件模板',
    code: `import React from 'react';

interface Props {
  title: string;
  onClick?: () => void;
}

const MyComponent: React.FC<Props> = ({ title, onClick }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    console.log('Component mounted');
  }, []);

  return (
    <div className="container">
      <h1>{title}</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      {onClick && (
        <button onClick={onClick}>
          Click me
        </button>
      )}
    </div>
  );
};

export default MyComponent;`
  },
  'vue-component': {
    name: 'Vue 组件',
    description: 'Vue 3 组合式API组件模板',
    code: `<template>
  <div class="my-component">
    <h1>{{ title }}</h1>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Props {
  title: string
}

const props = defineProps<Props>()
const count = ref(0)

const increment = () => {
  count.value++
}

onMounted(() => {
  console.log('Component mounted')
})
</script>

<style scoped>
.my-component {
  padding: 20px;
}
</style>`
  },
  'python-class': {
    name: 'Python 类',
    description: 'Python类模板',
    code: `class MyClass:
    """一个示例类"""

    def __init__(self, name: str):
        """初始化方法"""
        self.name = name
        self._private_var = None

    @property
    def private_var(self):
        """获取私有变量"""
        return self._private_var

    @private_var.setter
    def private_var(self, value):
        """设置私有变量"""
        self._private_var = value

    def greet(self) -> str:
        """问候方法"""
        return f"Hello, {self.name}!"

    @staticmethod
    def static_method():
        """静态方法"""
        return "This is a static method"


# 使用示例
if __name__ == "__main__":
    obj = MyClass("World")
    print(obj.greet())`
  },
  'typescript-interface': {
    name: 'TypeScript 接口',
    description: 'TypeScript接口定义模板',
    code: `interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  roles: UserRole[];
  createdAt: Date;
  updatedAt?: Date;
}

enum UserRole {
  Admin = 'ADMIN',
  Editor = 'EDITOR',
  Viewer = 'VIEWER'
}

interface CreateUserRequest {
  name: string;
  email: string;
  age?: number;
}

interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: number;
}

type UserResponse = Omit<User, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt?: string;
};`
  },
  'api-handler': {
    name: 'API 处理器',
    description: 'Express/Fastify风格的API处理器',
    code: `import { Request, Response } from 'express';

interface UserParams {
  id: string;
}

interface UserBody {
  name: string;
  email: string;
}

// GET /users/:id
export const getUser = async (
  req: Request<UserParams>,
  res: Response
) => {
  try {
    const { id } = req.params;
    // const user = await UserService.findById(id);

    res.json({
      success: true,
      data: { id, name: 'Example User' }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// POST /users
export const createUser = async (
  req: Request<{}, {}, UserBody>,
  res: Response
) => {
  try {
    const userData = req.body;
    // const user = await UserService.create(userData);

    res.status(201).json({
      success: true,
      data: userData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};`
  },
  'sql-table': {
    name: 'SQL 表结构',
    description: 'SQL建表语句模板',
    code: `-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();`
  },
  'shell-script': {
    name: 'Shell 脚本',
    description: 'Bash脚本模板',
    code: `#!/bin/bash

# 脚本说明
# 用途: 示例Shell脚本模板

set -euo pipefail

# 颜色定义
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "\${GREEN}[INFO]\${NC} $1"
}

log_error() {
    echo -e "\${RED}[ERROR]\${NC} $1"
}

log_warn() {
    echo -e "\${YELLOW}[WARN]\${NC} $1"
}

# 主函数
main() {
    local input_file="\${1:-}"
    local output_dir="\${2:-./output}"

    # 参数检查
    if [[ -z "$input_file" ]]; then
        log_error "Usage: $0 <input_file> [output_dir]"
        exit 1
    fi

    # 检查文件是否存在
    if [[ ! -f "$input_file" ]]; then
        log_error "File not found: $input_file"
        exit 1
    fi

    # 创建输出目录
    mkdir -p "$output_dir"
    log_info "Created output directory: $output_dir"

    # 处理文件
    log_info "Processing file: $input_file"
    # ... 处理逻辑 ...

    log_info "Done!"
}

main "$@"`
  },
  'dockerfile': {
    name: 'Dockerfile',
    description: '多阶段构建的Dockerfile模板',
    code: `# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production \\
    PORT=3000

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 创建非root用户
RUN addgroup -g 1001 -S nodejs \\
    && adduser -S nextjs -u 1001

USER nextjs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
    CMD node healthcheck.js || exit 1

# 启动命令
CMD ["node", "dist/index.js"]`
  },
  'c-program': {
    name: 'C 程序',
    description: 'C语言基础程序模板',
    code: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// 结构体定义
typedef struct {
    char name[50];
    int age;
    float score;
} Student;

// 函数声明
void print_student(Student *s);
Student* create_student(const char *name, int age, float score);
void free_student(Student *s);

int main(int argc, char *argv[]) {
    printf("Hello, C World!\\n");

    // 创建学生
    Student *s = create_student("张三", 20, 95.5);
    if (s == NULL) {
        fprintf(stderr, "Memory allocation failed\\n");
        return 1;
    }

    // 打印学生信息
    print_student(s);

    // 释放内存
    free_student(s);

    return 0;
}

Student* create_student(const char *name, int age, float score) {
    Student *s = (Student*)malloc(sizeof(Student));
    if (s != NULL) {
        strncpy(s->name, name, sizeof(s->name) - 1);
        s->name[sizeof(s->name) - 1] = '\\0';
        s->age = age;
        s->score = score;
    }
    return s;
}

void print_student(Student *s) {
    printf("Name: %s\\n", s->name);
    printf("Age: %d\\n", s->age);
    printf("Score: %.2f\\n", s->score);
}

void free_student(Student *s) {
    free(s);
}`
  },
  'cpp-class': {
    name: 'C++ 类',
    description: 'C++面向对象类模板',
    code: `#include <iostream>
#include <string>
#include <memory>
#include <vector>

namespace myapp {

// 基类
class Person {
protected:
    std::string name;
    int age;

public:
    Person(const std::string& name, int age)
        : name(name), age(age) {}

    virtual ~Person() = default;

    virtual void greet() const {
        std::cout << "Hello, I'm " << name
                  << ", " << age << " years old." << std::endl;
    }

    // Getters
    const std::string& getName() const { return name; }
    int getAge() const { return age; }

    // Setters
    void setAge(int newAge) { age = newAge; }
};

// 派生类
class Student : public Person {
private:
    std::vector<float> grades;

public:
    Student(const std::string& name, int age)
        : Person(name, age) {}

    void addGrade(float grade) {
        grades.push_back(grade);
    }

    float getAverageGrade() const {
        if (grades.empty()) return 0.0f;
        float sum = 0.0f;
        for (float g : grades) {
            sum += g;
        }
        return sum / grades.size();
    }

    void greet() const override {
        Person::greet();
        std::cout << "My average grade is: "
                  << getAverageGrade() << std::endl;
    }
};

} // namespace myapp

int main() {
    using namespace myapp;

    auto student = std::make_unique<Student>("张三", 20);
    student->addGrade(85.5);
    student->addGrade(92.0);
    student->addGrade(78.5);

    student->greet();

    return 0;
}`
  }
}