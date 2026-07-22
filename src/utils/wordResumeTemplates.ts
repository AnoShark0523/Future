/**
 * Word 简历模板配置
 * 基于用户提供的115套科林简历模板
 */

export interface WordTemplate {
  id: number
  name: string         // 模板名称（去掉"五百丁"等前缀）
  docxPath: string     // word模板文件路径
  previewPath: string  // 预览图路径
  category: string     // 分类
  color: string        // 主色调
}

/**
 * 解析模板文件名，提取编号和名称
 * 如 "1.五百丁蓝黑色简历.docx" → { num: 1, name: "蓝黑色简历" }
 */
function parseTemplateFilename(filename: string): { num: number; name: string } {
  // 移除扩展名
  const base = filename.replace(/\.docx?$/i, '')
  // 匹配开头的数字
  const match = base.match(/^(\d+)\s*\.?\s*(.*)/)
  if (match) {
    let name = match[2] || `模板${match[1]}`
    // 去掉"五百丁"前缀
    name = name.replace(/^五百丁_?/, '').replace(/^五百丁/, '')
    return { num: parseInt(match[1]), name: name || `模板${match[1]}` }
  }
  return { num: 0, name: base }
}

// 原始模板文件名列表（从 public/word-templates/ 读取）
const templateFiles = [
  '1.五百丁蓝黑色简历.docx',
  '2.五百丁沙漠背景样式简历.docx',
  '3.五百丁分割线简历.docx',
  '4..lowpoly风格.docx',
  '5.彩色时间轴简历.docx',
  '6.产品经理简历.docx',
  '7.产品运营_数据分析-统计图.docx',
  '8.橙黄蓝-多年经验.docx',
  '9..IOS毛玻璃.docx',
  '10.五百丁狼_背景样式简历.docx',
  '11.创意内容.docx',
  '12.淡蓝色时间轴.docx',
  '13.时间轴黑蓝色块商务风.docx',
  '14.淡绿色时间轴.docx',
  '15.五百丁分隔简历.docx',
  '16.多年经验-简洁线条.docx',
  '17.方块背景简历.docx',
  '18.分层简洁简历.docx',
  '19.分条简洁.docx',
  '20.规整分栏.docx',
  '22.含icon蓝色边简历.docx',
  '23.含icon-应届.docx',
  '24.含公司logo.docx',
  '25.黑白灰-多年经验.docx',
  '26.黑白灰简洁简历.docx',
  '27.黑粉商务风.docx',
  '28.红白灰-多年经验.docx',
  '29.红白色时间轴简历.docx',
  '30.传统极简简历.docx',
  '31.红色肌理红色肌理风格.docx',
  '32.红色简洁欧美.docx',
  '33.红色时间轴简历.docx',
  '34.灰蓝色时间轴.docx',
  '35.极简英文简历.docx',
  '36.简洁传统.docx',
  '37.简洁红白色简历.docx',
  '38.简洁橘色简历.docx',
  '39.橘色简洁.docx',
  '40.酷黑.docx',
  '41.酷黑炫彩.docx',
  '42.蓝色框架简历.docx',
  '43.蓝红绿时尚简历模板.docx',
  '44.蓝灰色块基本款.docx',
  '45.蓝色简洁.docx',
  '46..豆瓣风格.docx',
  '47.蓝色星空分隔简历.docx',
  '48..传统两栏.docx',
  '49.百科风格简历.docx',
  '50.鹰背景样式简历.docx',
  '65.五百丁红黑色商务风中轴分布.docx',
  '71.简历常用icon-Word简历模板图标.docx',
  '72.绿色多时间轴简历.docx',
  '73.绿色极简简历.docx',
  '74.绿色时尚模块.docx',
  '75.蒙特里安-多年经验.docx',
  '76.墨绿色可调技能环.docx',
  '77.牛仔布肌理多年经验.docx',
  '78.欧美毕业生简历.docx',
  '79.欧美风简洁.docx',
  '80.浅蓝色简洁.docx',
  '81.清新素雅.docx',
  '83.绿色条状简历 .docx',
  '84.蓝色条纹状简历.docx',
  '85.橘色条纹状简历.docx',
  '86.绿色多彩商务.docx',
  '87.蓝色多彩商务.docx',
  '88.橘色多彩商务.docx',
  '89.商业分析师简历-bing搜索风格.docx',
  '90..淡绿色商务简历.docx',
  '91.时间轴黑绿色块商务风.docx',
  '92.时间轴黑红色块商务风.docx',
  '93.彩色史努比Snoopy .docx',
  '94.纯色史努比Snoopy.docx',
  '95无色简洁.docx',
  '96.严肃规整.docx',
  '97.英文蓝色简洁.docx',
  '98.英文深紫色简历.docx',
  '99.中轴对称简历.docx',
  '100.紫色边简洁简历.docx',
  '102.docx',
  '103.docx',
  '105.docx',
  '107.docx',
  '108 .docx',
  '110 .docx',
  '111.docx',
  '115.docx'
]

// 生成模板列表
export const wordTemplates: WordTemplate[] = templateFiles.map(file => {
  const { num, name } = parseTemplateFilename(file)
  // 预览图编号（文件名中的数字部分）
  const previewNum = num || parseInt(file.match(/^(\d+)/)?.[1] || '0')

  // 分类判断
  let category = '其他'
  const lowerName = name.toLowerCase()
  if (name.includes('时间轴')) category = '时间轴'
  else if (name.includes('商务') || name.includes('中轴')) category = '商务'
  else if (name.includes('简洁') || name.includes('极简') || name.includes('简约')) category = '简洁'
  else if (name.includes('多年经验')) category = '多年经验'
  else if (name.includes('欧美') || name.includes('英文')) category = '英文'
  else if (name.includes('创意') || name.includes('lowpoly') || name.includes('毛玻璃') || name.includes('酷黑')) category = '创意'
  else if (name.includes('彩色') || name.includes('多彩')) category = '彩色'

  // 主色调判断
  let color = '#667eea'
  if (name.includes('蓝黑') || name.includes('黑蓝')) color = '#1a237e'
  else if (name.includes('蓝') && name.includes('简洁')) color = '#2196f3'
  else if (name.includes('蓝')) color = '#1565c0'
  else if (name.includes('红黑') || name.includes('黑红')) color = '#c62828'
  else if (name.includes('红')) color = '#e53935'
  else if (name.includes('绿')) color = '#43a047'
  else if (name.includes('橘') || name.includes('橙')) color = '#ff9800'
  else if (name.includes('紫')) color = '#8e24aa'
  else if (name.includes('黑白') || name.includes('黑') || name.includes('酷')) color = '#424242'
  else if (name.includes('粉')) color = '#e91e63'

  return {
    id: previewNum,
    name,
    docxPath: `${import.meta.env.BASE_URL}word-templates/${encodeURIComponent(file)}`,
    previewPath: `${import.meta.env.BASE_URL}resume-previews/word-templates/${previewNum}.JPG`,
    category,
    color
  }
}).sort((a, b) => a.id - b.id)

/**
 * 使用 mammoth.js 加载 word 模板，返回 HTML
 */
export async function loadWordTemplate(docxPath: string): Promise<string> {
  try {
    const response = await fetch(docxPath)
    const arrayBuffer = await response.arrayBuffer()
    const mammoth = await import('mammoth')
    const result = await mammoth.convertToHtml({ arrayBuffer })
    return result.value || ''
  } catch (error) {
    console.error('加载Word模板失败:', error)
    throw new Error(`无法加载模板: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}
