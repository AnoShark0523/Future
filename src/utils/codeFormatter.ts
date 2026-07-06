/**
 * 代码格式化工具函数
 */
import prettier from 'prettier'

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
 * 获取语言的parser类型
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
    flow: 'flow',
    mdx: 'mdx'
  }

  return parserMap[language.toLowerCase()] || 'babel'
}

/**
 * 格式化代码
 */
export async function formatCode(
  code: string,
  options: FormatterOptions
): Promise<string> {
  try {
    const formatted = await prettier.format(code, {
      parser: options.parser,
      tabWidth: options.tabWidth ?? 2,
      useTabs: options.useTabs ?? false,
      semi: options.semi ?? true,
      singleQuote: options.singleQuote ?? false,
      trailingComma: options.trailingComma ?? 'es5',
      bracketSpacing: options.bBracketSpacing ?? true,
      arrowParens: options.arrowParens ?? 'always',
      printWidth: options.printWidth ?? 80
    })

    return formatted
  } catch (error: any) {
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