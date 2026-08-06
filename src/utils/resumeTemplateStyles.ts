/**
 * 50 套高颜值简历模板配置
 * 严格按"提示词要求"文档实现 + 21套自创扩展
 * 每套模板都有独特布局、配色、装饰细节
 */

export type ResumeLayout =
  | 'sidebar-left'
  | 'sidebar-right'
  | 'banner-top'
  | 'timeline'
  | 'clean-center'
  | 'two-column'
  | 'card-style'
  | 'elegant-minimal'
  | 'modern-split'
  | 'dark-theme'
  | 'dashboard'

export interface ResumeTemplateStyle {
  id: string
  name: string
  category: string
  description: string
  layout: ResumeLayout
  theme: string
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  lightText: string
  accentColor: string
  features: string[] // 特殊视觉特征标识
}

export const layoutCategories: Record<ResumeLayout, string> = {
  'sidebar-left': '左侧栏',
  'sidebar-right': '右侧栏',
  'banner-top': '顶部横幅',
  'timeline': '时间轴',
  'clean-center': '简洁居中',
  'two-column': '双栏分栏',
  'card-style': '卡片模块',
  'elegant-minimal': '优雅极简',
  'modern-split': '现代分割',
  'dark-theme': '深色主题',
  'dashboard': '数据图表'
}

// ========== 50 套模板 ==========
export const resumeTemplateStyles: ResumeTemplateStyle[] = [

  // ======== 第1组：通用前置规则模板（10套）========

  // 模板5：时间轴纵向色块侧边履历技术岗
  { id: 't05', name: '彩色时间轴技术岗', category: '时间轴', layout: 'timeline',
    theme: 'macaron-timeline-tech', description: '左侧固定信息栏+右侧垂直时间轴+彩色圆角色块',
    primaryColor: '#3a7bbf', secondaryColor: '#3db572', backgroundColor: '#f5f7fa', textColor: '#2c3e50', lightText: '#ffffff', accentColor: '#e67e73',
    features: ['timeline-dots', 'colored-blocks', 'progress-bar', 'sidebar-mini'] },

  // 模板6：深黑暗夜简约代码风项目管理
  { id: 't06', name: '暗夜代码项目管理', category: '深色主题', layout: 'dark-theme',
    theme: 'dark-code-pm', description: '炭黑底色+//注释板块分割+黄色高亮标题+代码风格',
    primaryColor: '#1a1a20', secondaryColor: '#2a2a32', backgroundColor: '#1a1a20', textColor: '#e8e8e8', lightText: '#ffffff', accentColor: '#f0c040',
    features: ['code-style', 'yellow-line', 'icon-cards', 'circle-photo'] },

  // ======== 第2组：新媒体/传媒/市场系列（10套）========

  // 模板11：深灰竖侧边创意文案斜切排版
  { id: 't11', name: '深灰橙斜新媒体创意', category: '商务侧栏', layout: 'sidebar-left',
    theme: 'gray-orange-creative', description: '深灰竖侧栏+橙色斜切标签+斜向技能文字+橙色边框文本框',
    primaryColor: '#2e2e30', secondaryColor: '#d96c1a', backgroundColor: '#fefefe', textColor: '#111111', lightText: '#ffffff', accentColor: '#d96c1a',
    features: ['slanted-tabs', 'skewed-text', 'orange-border-box', 'square-photo'] },

  // 模板12：简约蓝色圆点分割传媒影视岗
  { id: 't12', name: '蓝圆点传媒清爽', category: '简洁居中', layout: 'clean-center',
    theme: 'blue-dot-media', description: '纯白通栏+空心圆序号+浅蓝细线分割+对勾项目符号',
    primaryColor: '#3a8ca8', secondaryColor: '#5dade2', backgroundColor: '#ffffff', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#3a8ca8',
    features: ['circle-number', 'blue-line', 'check-mark', 'circle-photo'] },

  // 模板14：淡绿色侧边竖线文艺文案应届生
  { id: 't14', name: '薄荷绿文艺文案', category: '简洁居中', layout: 'clean-center',
    theme: 'mint-green-literary', description: '米白底色+淡绿通栏横幅+竖向绿条标题栏+圆点标记',
    primaryColor: '#3a8a4a', secondaryColor: '#5cb572', backgroundColor: '#faf8f2', textColor: '#1a3a1a', lightText: '#ffffff', accentColor: '#3a8a4a',
    features: ['green-banner', 'vertical-title', 'dot-marker', 'square-photo'] },

  // 模板16：纯横线节点极简商务时间轴销售运营
  { id: 't16', name: '极简线条销售时间轴', category: '时间轴', layout: 'timeline',
    theme: 'minimal-line-sales', description: '纯白底+黑色实心方块节点+水平横线时间轴+无色块装饰',
    primaryColor: '#1a1a1a', secondaryColor: '#666666', backgroundColor: '#ffffff', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#1a1a1a',
    features: ['square-node', 'horizontal-timeline', 'no-decoration', 'photo-top-right'] },

  // 模板17：浅灰方格底块分区电子工程师技术
  { id: 't17', name: '方格底电子工程师', category: '简洁居中', layout: 'clean-center',
    theme: 'grid-bg-engineer', description: '浅灰小方格暗纹+白色分块区域+浅灰标题底色+中英对照',
    primaryColor: '#3a3a3a', secondaryColor: '#7a7a7a', backgroundColor: '#f5f5f5', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#3a7bc5',
    features: ['grid-bg', 'block-section', 'gray-title-bar', 'bilingual-title'] },

  // 模板18：蓝色虚线分段金融银行应届生
  { id: 't18', name: '蓝虚线金融银行', category: '简洁居中', layout: 'clean-center',
    theme: 'blue-dashed-finance', description: '纯白通栏+蓝色长短虚线分割+蓝色圆角标签+菱形项目符号',
    primaryColor: '#3a7bc5', secondaryColor: '#1a5fb4', backgroundColor: '#ffffff', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#3a7bc5',
    features: ['dashed-divider', 'number-label', 'diamond-bullet', 'circle-photo'] },

  // 模板19：简约金融银行微调版
  { id: 't19', name: '蓝标签金融精简版', category: '简洁居中', layout: 'clean-center',
    theme: 'blue-label-finance-lite', description: '同上微调+统一蓝色圆角标题框+荣誉单独列表+技能横排',
    primaryColor: '#2a6bc5', secondaryColor: '#1a5fb4', backgroundColor: '#ffffff', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#2a6bc5',
    features: ['dashed-divider', 'rounded-title', 'horizontal-skills', 'circle-photo'] },

  // 模板20：浅蓝左侧竖侧边国风竹子双栏营销硕士
  { id: 't20', name: '浅蓝竹子国风双栏', category: '商务侧栏', layout: 'sidebar-left',
    theme: 'bamboo-ink-master', description: '浅灰蓝侧栏+水墨竹子暗纹+斜三角装饰+大于号列表符',
    primaryColor: '#4a6a94', secondaryColor: '#3a5a7a', backgroundColor: '#ffffff', textColor: '#2c3e50', lightText: '#ffffff', accentColor: '#2a4a6a',
    features: ['ink-bamboo', 'triangle-deco', 'gt-bullet', 'sidebar-light'] },

  // ======== 第3组：后端/财会/法务/设计系列（9套+1微调话术）========

  // 模板21：深色暗纹法务律师应届生竖排简约
  { id: 't21', name: '深色暗纹法务律师', category: '深色主题', layout: 'dark-theme',
    theme: 'dark-lawyer-vertical', description: '深炭黑底+卷草暗纹+青蓝标题+白色细竖线分割+左侧信息竖排',
    primaryColor: '#1a1a1e', secondaryColor: '#28282e', backgroundColor: '#1a1a1e', textColor: '#f0f0f0', lightText: '#ffffff', accentColor: '#6ac8c8',
    features: ['dark-bg', 'scroll-pattern', 'vertical-divider', 'left-info'] },

  // 模板22：深色边框时间轴PHP后端开发双栏技术
  { id: 't22', name: '深色框PHP后端时间轴', category: '深色主题', layout: 'dark-theme',
    theme: 'dark-php-timeline', description: '深灰底+虚线外框+红色圆点时间轴+灰色进度条+双栏',
    primaryColor: '#2c2d30', secondaryColor: '#3a3b3e', backgroundColor: '#2c2d30', textColor: '#e0e0e0', lightText: '#ffffff', accentColor: '#d02525',
    features: ['dashed-border', 'red-dot-timeline', 'gray-progress', 'circle-photo'] },

  // 模板23：薄荷绿几何边角文艺文科博士极简
  { id: 't23', name: '薄荷绿几何博士', category: '简洁居中', layout: 'clean-center',
    theme: 'mint-geo-phd', description: '纯白底+淡青绿几何多边形角饰+居中照片+细竖线分割+宽松留白',
    primaryColor: '#4ab8a8', secondaryColor: '#3aa890', backgroundColor: '#ffffff', textColor: '#2c3e3a', lightText: '#ffffff', accentColor: '#4ab8a8',
    features: ['geo-corner', 'center-photo', 'vertical-divider', 'wide-spacing'] },

  // 模板25：左侧蓝竖条欧式双栏平面设计艺术
  { id: 't25', name: '藏蓝欧式设计双栏', category: '商务侧栏', layout: 'sidebar-left',
    theme: 'navy-euro-design', description: '藏蓝竖侧栏+欧式建筑线稿暗纹+能力进度条+圆形爱好图标',
    primaryColor: '#1a4a8c', secondaryColor: '#143a74', backgroundColor: '#f5f7fa', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#1a4a8c',
    features: ['euro-architecture', 'progress-bar', 'hobby-icons', 'circle-photo'] },

  // 模板26：纯深色居中对称运营管理
  { id: 't26', name: '深色对称运营管理', category: '深色主题', layout: 'dark-theme',
    theme: 'dark-symmetric-ops', description: '纯黑深灰底+居中对称排布+黄色标题+左右双列',
    primaryColor: '#18181a', secondaryColor: '#242428', backgroundColor: '#18181a', textColor: '#e0e0e0', lightText: '#ffffff', accentColor: '#e0b850',
    features: ['dark-bg', 'center-symmetric', 'yellow-title', 'circle-photo'] },

  // 模板28：深灰背景顶部照片竖向排版商务
  { id: 't28', name: '深灰鎏金竖排商务', category: '深色主题', layout: 'dark-theme',
    theme: 'dark-gold-vertical-biz', description: '深炭灰底+顶部居中照片+金色标题+左右两列竖向排布',
    primaryColor: '#202022', secondaryColor: '#2c2c30', backgroundColor: '#202022', textColor: '#d0d0d0', lightText: '#ffffff', accentColor: '#cca854',
    features: ['dark-bg', 'gold-title', 'top-center-photo', 'two-col-vertical'] },

  // ======== 第4组：自创扩展模板（21套）========

  // 模板31：科技蓝绿流光侧栏
  { id: 't31', name: '科技流光蓝绿侧栏', category: '商务侧栏', layout: 'sidebar-left',
    theme: 'tech-flow-cyan', description: '深蓝侧栏+蓝绿流光渐变+发光节点+科技感进度条',
    primaryColor: '#0a1929', secondaryColor: '#0f2a44', backgroundColor: '#0a0e14', textColor: '#e6edf3', lightText: '#58a6ff', accentColor: '#00e6e6',
    features: ['tech-glow', 'flow-gradient', 'glow-node', 'tech-progress', 'circle-photo'] },

  // 模板32：杂志期刊艺术黑白
  { id: 't32', name: '杂志期刊艺术黑白', category: '优雅极简', layout: 'elegant-minimal',
    theme: 'magazine-bw-art', description: '杂志排版+大号衬线标题+黑白配色+期号装饰+栏式文本',
    primaryColor: '#1a1a1a', secondaryColor: '#2e2e2e', backgroundColor: '#f5f5f0', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#a00000',
    features: ['magazine-layout', 'serif-title', 'issue-number', 'column-text'] },

  // 模板33：手账胶带贴纸可爱风
  { id: 't33', name: '手账胶带贴纸可爱', category: '时间轴', layout: 'timeline',
    theme: 'journal-tape-cute', description: '横线纸底+彩色胶带贴纸+手写体+圆点贴纸标注+拍立得照片',
    primaryColor: '#ff4da6', secondaryColor: '#ffa8c9', backgroundColor: '#fff5fa', textColor: '#553d36', lightText: '#ffffff', accentColor: '#ff85c0',
    features: ['lined-paper', 'washi-tape', 'sticker-dot', 'polaroid-photo', 'handwritten'] },

  // 模板34：日式无印良品极简
  { id: 't34', name: '日式无印良品极简', category: '简洁居中', layout: 'clean-center',
    theme: 'muji-japanese-minimal', description: '原木色+大量留白+极细线条+无衬线字体+自然素雅',
    primaryColor: '#4a5a40', secondaryColor: '#6a7a60', backgroundColor: '#f8f7f2', textColor: '#333333', lightText: '#ffffff', accentColor: '#9c8a78',
    features: ['muji-style', 'thin-line', 'extreme-whitespace', 'circle-photo'] },

  // 模板36：复古打字机信纸风
  { id: 't36', name: '复古打字机信纸', category: '简洁居中', layout: 'clean-center',
    theme: 'typewriter-letter-retro', description: '泛黄信纸底+打字机等宽字体+红色修正标记+手写签名',
    primaryColor: '#4a3c2e', secondaryColor: '#6d5d4e', backgroundColor: '#f2ebd9', textColor: '#2e2418', lightText: '#ffffff', accentColor: '#b30000',
    features: ['aged-paper', 'monospace-font', 'red-mark', 'signature', 'circle-photo'] },

  // 模板38：渐变波普艺术撞色
  { id: 't38', name: '波普艺术撞色', category: '卡片模块', layout: 'card-style',
    theme: 'pop-art-clash', description: '高饱和撞色+网点背景+对话框元素+波普圆点',
    primaryColor: '#ff0056', secondaryColor: '#2a75ff', backgroundColor: '#fff8e1', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#ffaa00',
    features: ['halftone-bg', 'speech-bubble', 'pop-dot', 'clash-colors'] },

  // 模板39：北欧几何插画右侧栏
  { id: 't39', name: '北欧几何插画', category: '现代分割', layout: 'sidebar-right',
    theme: 'nordic-geo-illustration', description: '右侧灰蓝侧栏+北欧简约几何插画+圆形头像+柔和配色',
    primaryColor: '#4a6a85', secondaryColor: '#6c8ba8', backgroundColor: '#f5f7fa', textColor: '#2c3e50', lightText: '#ffffff', accentColor: '#e67e22',
    features: ['nordic-illustration', 'geo-shape', 'circle-photo', 'soft-color'] },

  // 模板41：暗紫赛博朋克霓虹
  { id: 't41', name: '赛博朋克霓虹紫', category: '深色主题', layout: 'dark-theme',
    theme: 'cyberpunk-neon-purple', description: '暗紫底色+霓虹粉紫青光效+故障艺术+发光边框',
    primaryColor: '#150a25', secondaryColor: '#2a114a', backgroundColor: '#0a0512', textColor: '#f0e6ff', lightText: '#ffffff', accentColor: '#ff00ff',
    features: ['neon-glow', 'glitch-art', 'glow-border', 'scan-line', 'circle-photo'] },

  // 模板42：牛皮纸复古档案风
  { id: 't42', name: '牛皮纸复古档案', category: '简洁居中', layout: 'clean-center',
    theme: 'kraft-archive-retro', description: '牛皮纸底色+打孔档案标签+红色印章+复古边框',
    primaryColor: '#755c12', secondaryColor: '#8f7324', backgroundColor: '#c9a870', textColor: '#2e2418', lightText: '#ffffff', accentColor: '#cc0000',
    features: ['kraft-paper', 'archive-tag', 'red-stamp', 'vintage-border', 'circle-photo'] },

  // 模板44：极简线条素描风
  { id: 't44', name: '极简线条素描', category: '优雅极简', layout: 'elegant-minimal',
    theme: 'minimal-line-sketch', description: '纯白底+细线手绘素描装饰+极简排版+大量留白',
    primaryColor: '#2c3e50', secondaryColor: '#4a5a6a', backgroundColor: '#ffffff', textColor: '#2c3e50', lightText: '#ffffff', accentColor: '#95a5a6',
    features: ['line-sketch', 'thin-border', 'extreme-whitespace', 'circle-photo'] },

  // 模板45：绿色生态自然环保风
  { id: 't45', name: '绿色生态自然环保', category: '商务侧栏', layout: 'sidebar-left',
    theme: 'green-eco-natural', description: '墨绿侧栏+树叶纹理+自然元素图标+环保色系',
    primaryColor: '#164716', secondaryColor: '#2a6b2a', backgroundColor: '#edf7e9', textColor: '#1a331a', lightText: '#ffffff', accentColor: '#43a047',
    features: ['leaf-texture', 'nature-icon', 'eco-color', 'circle-photo'] },

  // 模板46：鎏金黑金奢华商务
  { id: 't46', name: '黑金鎏金奢华', category: '深色主题', layout: 'dark-theme',
    theme: 'black-gold-luxury', description: '纯黑底+烫金质感标题+金色细线分割+奢华质感',
    primaryColor: '#0a0a0a', secondaryColor: '#1a1a1a', backgroundColor: '#050505', textColor: '#f0f0f0', lightText: '#ffffff', accentColor: '#ffd700',
    features: ['gold-texture', 'gold-line', 'luxury-shadow', 'circle-photo'] },

  // 模板47：马赛克拼贴艺术风
  { id: 't47', name: '马赛克拼贴艺术', category: '卡片模块', layout: 'card-style',
    theme: 'mosaic-collage-art', description: '彩色马赛克方块拼接背景+不规则内容区块+艺术拼贴感',
    primaryColor: '#e74c3c', secondaryColor: '#2980b9', backgroundColor: '#f5f5f5', textColor: '#2c3e50', lightText: '#ffffff', accentColor: '#f1c40f',
    features: ['mosaic-bg', 'irregular-block', 'art-collage', 'circle-photo'] },

  // 模板49：工业蒸汽朋克风
  { id: 't49', name: '工业蒸汽朋克', category: '深色主题', layout: 'dark-theme',
    theme: 'steampunk-industrial', description: '深棕底色+齿轮机械元素+铜管装饰+复古工业风',
    primaryColor: '#35241e', secondaryColor: '#4d382f', backgroundColor: '#1f1714', textColor: '#e8e0dd', lightText: '#ffffff', accentColor: '#d17a08',
    features: ['gear-deco', 'copper-pipe', 'industrial-rivet', 'circle-photo'] },

  // 模板50：极简白纸黑字学术风
  { id: 't50', name: '极简学术白纸黑字', category: '简洁居中', layout: 'clean-center',
    theme: 'academic-minimal-bw', description: '纯白底+黑色衬线字体+学术排版+无装饰+极致留白',
    primaryColor: '#1a1a1a', secondaryColor: '#3a3a3a', backgroundColor: '#ffffff', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#666666',
    features: ['academic-layout', 'serif-font', 'no-decoration', 'extreme-whitespace'] },
]

export const resumeTemplateCategories = ['全部', ...Array.from(new Set(resumeTemplateStyles.map(t => t.category)))]

export function getResumeTemplate(id: string): ResumeTemplateStyle {
  return resumeTemplateStyles.find(t => t.id === id) || resumeTemplateStyles[0]
}
