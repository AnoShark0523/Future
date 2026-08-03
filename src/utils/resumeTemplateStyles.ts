/**
 * 50 套高颜值简历模板配置
 * 严格按"提示词要求"文档实现 + 21套自创扩展
 * 每套模板都有独特布局、配色、装饰细节
 */

export type ResumeLayout =
  | 'sidebar-left'
  | 'sidebar-right'
  | 'banner-top'
  | 'banner-center'
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
  'banner-center': '居中通栏',
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

  // 模板2：旷野风景全屏背景简约通栏款
  { id: 't02', name: '旷野风景通栏文艺', category: '居中通栏', layout: 'banner-center',
    theme: 'desert-wilderness', description: '低透明度沙漠风景背景+白色圆角内容卡+圆形头像',
    primaryColor: '#c19a6b', secondaryColor: '#8b7355', backgroundColor: '#fffbf0', textColor: '#3a3a3a', lightText: '#ffffff', accentColor: '#c19a6b',
    features: ['photo-bg', 'rounded-card', 'circle-photo', 'dashed-divider', 'line-icons'] },

  // 模板5：时间轴纵向色块侧边履历技术岗
  { id: 't05', name: '彩色时间轴技术岗', category: '时间轴', layout: 'timeline',
    theme: 'macaron-timeline-tech', description: '左侧固定信息栏+右侧垂直时间轴+彩色圆角色块',
    primaryColor: '#5dade2', secondaryColor: '#58d68d', backgroundColor: '#f8f9fa', textColor: '#2c3e50', lightText: '#ffffff', accentColor: '#f5b7b1',
    features: ['timeline-dots', 'colored-blocks', 'progress-bar', 'sidebar-mini'] },

  // 模板6：深黑暗夜简约代码风项目管理
  { id: 't06', name: '暗夜代码项目管理', category: '深色主题', layout: 'dark-theme',
    theme: 'dark-code-pm', description: '炭黑底色+//注释板块分割+黄色高亮标题+代码风格',
    primaryColor: '#222228', secondaryColor: '#2d2d35', backgroundColor: '#222228', textColor: '#e0e0e0', lightText: '#ffffff', accentColor: '#f1c40f',
    features: ['code-style', 'yellow-line', 'icon-cards', 'circle-photo'] },

  // 模板10：森林狼王艺术摄影背景高端商务文艺
  { id: 't10', name: '森林摄影轻奢文艺', category: '居中通栏', layout: 'banner-center',
    theme: 'forest-photo-luxury', description: '暗调森林摄影背景+白色内容主体+方形人像+英文装饰标题',
    primaryColor: '#2c3e2d', secondaryColor: '#4a5d4b', backgroundColor: '#ffffff', textColor: '#2c3e50', lightText: '#ffffff', accentColor: '#8b7355',
    features: ['photo-bg', 'frame-title', 'square-photo', 'dashed-divider', 'line-icons'] },

  // ======== 第2组：新媒体/传媒/市场系列（10套）========

  // 模板11：深灰竖侧边创意文案斜切排版
  { id: 't11', name: '深灰橙斜新媒体创意', category: '商务侧栏', layout: 'sidebar-left',
    theme: 'gray-orange-creative', description: '深灰竖侧栏+橙色斜切标签+斜向技能文字+橙色边框文本框',
    primaryColor: '#363638', secondaryColor: '#e67722', backgroundColor: '#ffffff', textColor: '#111111', lightText: '#ffffff', accentColor: '#e67722',
    features: ['slanted-tabs', 'skewed-text', 'orange-border-box', 'square-photo'] },

  // 模板12：简约蓝色圆点分割传媒影视岗
  { id: 't12', name: '蓝圆点传媒清爽', category: '简洁居中', layout: 'clean-center',
    theme: 'blue-dot-media', description: '纯白通栏+空心圆序号+浅蓝细线分割+对勾项目符号',
    primaryColor: '#48a8c8', secondaryColor: '#5dade2', backgroundColor: '#ffffff', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#48a8c8',
    features: ['circle-number', 'blue-line', 'check-mark', 'circle-photo'] },

  // 模板14：淡绿色侧边竖线文艺文案应届生
  { id: 't14', name: '薄荷绿文艺文案', category: '简洁居中', layout: 'clean-center',
    theme: 'mint-green-literary', description: '米白底色+淡绿通栏横幅+竖向绿条标题栏+圆点标记',
    primaryColor: '#4a9e5e', secondaryColor: '#5cb572', backgroundColor: '#fdfbf7', textColor: '#1a3a1a', lightText: '#ffffff', accentColor: '#4a9e5e',
    features: ['green-banner', 'vertical-title', 'dot-marker', 'square-photo'] },

  // 模板16：纯横线节点极简商务时间轴销售运营
  { id: 't16', name: '极简线条销售时间轴', category: '时间轴', layout: 'timeline',
    theme: 'minimal-line-sales', description: '纯白底+黑色实心方块节点+水平横线时间轴+无色块装饰',
    primaryColor: '#1a1a1a', secondaryColor: '#444444', backgroundColor: '#ffffff', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#1a1a1a',
    features: ['square-node', 'horizontal-timeline', 'no-decoration', 'photo-top-right'] },

  // 模板17：浅灰方格底块分区电子工程师技术
  { id: 't17', name: '方格底电子工程师', category: '简洁居中', layout: 'clean-center',
    theme: 'grid-bg-engineer', description: '浅灰小方格暗纹+白色分块区域+浅灰标题底色+中英对照',
    primaryColor: '#4a4a4a', secondaryColor: '#6a6a6a', backgroundColor: '#f0f0f0', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#4a90d9',
    features: ['grid-bg', 'block-section', 'gray-title-bar', 'bilingual-title'] },

  // 模板18：蓝色虚线分段金融银行应届生
  { id: 't18', name: '蓝虚线金融银行', category: '简洁居中', layout: 'clean-center',
    theme: 'blue-dashed-finance', description: '纯白通栏+蓝色长短虚线分割+蓝色圆角标签+菱形项目符号',
    primaryColor: '#4286d1', secondaryColor: '#1a5fb4', backgroundColor: '#ffffff', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#4286d1',
    features: ['dashed-divider', 'number-label', 'diamond-bullet', 'circle-photo'] },

  // 模板19：简约金融银行微调版
  { id: 't19', name: '蓝标签金融精简版', category: '简洁居中', layout: 'clean-center',
    theme: 'blue-label-finance-lite', description: '同上微调+统一蓝色圆角标题框+荣誉单独列表+技能横排',
    primaryColor: '#3a7bd5', secondaryColor: '#1a5fb4', backgroundColor: '#ffffff', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#3a7bd5',
    features: ['dashed-divider', 'rounded-title', 'horizontal-skills', 'circle-photo'] },

  // 模板20：浅蓝左侧竖侧边国风竹子双栏营销硕士
  { id: 't20', name: '浅蓝竹子国风双栏', category: '商务侧栏', layout: 'sidebar-left',
    theme: 'bamboo-ink-master', description: '浅灰蓝侧栏+水墨竹子暗纹+斜三角装饰+大于号列表符',
    primaryColor: '#5a7aa4', secondaryColor: '#4a6a94', backgroundColor: '#ffffff', textColor: '#2c3e50', lightText: '#ffffff', accentColor: '#3a5a7a',
    features: ['ink-bamboo', 'triangle-deco', 'gt-bullet', 'sidebar-light'] },

  // ======== 第3组：后端/财会/法务/设计系列（9套+1微调话术）========

  // 模板21：深色暗纹法务律师应届生竖排简约
  { id: 't21', name: '深色暗纹法务律师', category: '深色主题', layout: 'dark-theme',
    theme: 'dark-lawyer-vertical', description: '深炭黑底+卷草暗纹+青蓝标题+白色细竖线分割+左侧信息竖排',
    primaryColor: '#222226', secondaryColor: '#2d2d33', backgroundColor: '#222226', textColor: '#f5f5f5', lightText: '#ffffff', accentColor: '#78d0d0',
    features: ['dark-bg', 'scroll-pattern', 'vertical-divider', 'left-info'] },

  // 模板22：深色边框时间轴PHP后端开发双栏技术
  { id: 't22', name: '深色框PHP后端时间轴', category: '深色主题', layout: 'dark-theme',
    theme: 'dark-php-timeline', description: '深灰底+虚线外框+红色圆点时间轴+灰色进度条+双栏',
    primaryColor: '#333538', secondaryColor: '#3d3f43', backgroundColor: '#333538', textColor: '#e8e8e8', lightText: '#ffffff', accentColor: '#e03535',
    features: ['dashed-border', 'red-dot-timeline', 'gray-progress', 'circle-photo'] },

  // 模板23：薄荷绿几何边角文艺文科博士极简
  { id: 't23', name: '薄荷绿几何博士', category: '简洁居中', layout: 'clean-center',
    theme: 'mint-geo-phd', description: '纯白底+淡青绿几何多边形角饰+居中照片+细竖线分割+宽松留白',
    primaryColor: '#62c8b8', secondaryColor: '#48b89e', backgroundColor: '#ffffff', textColor: '#2c3e3a', lightText: '#ffffff', accentColor: '#62c8b8',
    features: ['geo-corner', 'center-photo', 'vertical-divider', 'wide-spacing'] },

  // 模板25：左侧蓝竖条欧式双栏平面设计艺术
  { id: 't25', name: '藏蓝欧式设计双栏', category: '商务侧栏', layout: 'sidebar-left',
    theme: 'navy-euro-design', description: '藏蓝竖侧栏+欧式建筑线稿暗纹+能力进度条+圆形爱好图标',
    primaryColor: '#2468bb', secondaryColor: '#1a4a8c', backgroundColor: '#f8f9fa', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#2468bb',
    features: ['euro-architecture', 'progress-bar', 'hobby-icons', 'circle-photo'] },

  // 模板26：纯深色居中对称运营管理
  { id: 't26', name: '深色对称运营管理', category: '深色主题', layout: 'dark-theme',
    theme: 'dark-symmetric-ops', description: '纯黑深灰底+居中对称排布+黄色标题+左右双列',
    primaryColor: '#202022', secondaryColor: '#2a2a2e', backgroundColor: '#202022', textColor: '#e8e8e8', lightText: '#ffffff', accentColor: '#e8c258',
    features: ['dark-bg', 'center-symmetric', 'yellow-title', 'circle-photo'] },

  // 模板28：深灰背景顶部照片竖向排版商务
  { id: 't28', name: '深灰鎏金竖排商务', category: '深色主题', layout: 'dark-theme',
    theme: 'dark-gold-vertical-biz', description: '深炭灰底+顶部居中照片+金色标题+左右两列竖向排布',
    primaryColor: '#28282a', secondaryColor: '#333336', backgroundColor: '#28282a', textColor: '#d5d5d5', lightText: '#ffffff', accentColor: '#d4b866',
    features: ['dark-bg', 'gold-title', 'top-center-photo', 'two-col-vertical'] },

  // ======== 第4组：自创扩展模板（21套）========

  // 模板31：科技蓝绿流光侧栏
  { id: 't31', name: '科技流光蓝绿侧栏', category: '商务侧栏', layout: 'sidebar-left',
    theme: 'tech-flow-cyan', description: '深蓝侧栏+蓝绿流光渐变+发光节点+科技感进度条',
    primaryColor: '#0a1929', secondaryColor: '#132f4c', backgroundColor: '#0d1117', textColor: '#c9d1d9', lightText: '#58a6ff', accentColor: '#00d2d3',
    features: ['tech-glow', 'flow-gradient', 'glow-node', 'tech-progress', 'circle-photo'] },

  // 模板32：杂志期刊艺术黑白
  { id: 't32', name: '杂志期刊艺术黑白', category: '优雅极简', layout: 'elegant-minimal',
    theme: 'magazine-bw-art', description: '杂志排版+大号衬线标题+黑白配色+期号装饰+栏式文本',
    primaryColor: '#1a1a1a', secondaryColor: '#333333', backgroundColor: '#fafaf8', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#8b0000',
    features: ['magazine-layout', 'serif-title', 'issue-number', 'column-text'] },

  // 模板33：手账胶带贴纸可爱风
  { id: 't33', name: '手账胶带贴纸可爱', category: '时间轴', layout: 'timeline',
    theme: 'journal-tape-cute', description: '横线纸底+彩色胶带贴纸+手写体+圆点贴纸标注+拍立得照片',
    primaryColor: '#ff69b4', secondaryColor: '#ffb7c5', backgroundColor: '#fffafd', textColor: '#5a4a4a', lightText: '#ffffff', accentColor: '#ff69b4',
    features: ['lined-paper', 'washi-tape', 'sticker-dot', 'polaroid-photo', 'handwritten'] },

  // 模板34：日式无印良品极简
  { id: 't34', name: '日式无印良品极简', category: '简洁居中', layout: 'clean-center',
    theme: 'muji-japanese-minimal', description: '原木色+大量留白+极细线条+无衬线字体+自然素雅',
    primaryColor: '#5a6650', secondaryColor: '#8a9080', backgroundColor: '#faf9f6', textColor: '#3a3a3a', lightText: '#ffffff', accentColor: '#a09080',
    features: ['muji-style', 'thin-line', 'extreme-whitespace', 'circle-photo'] },

  // 模板36：复古打字机信纸风
  { id: 't36', name: '复古打字机信纸', category: '简洁居中', layout: 'clean-center',
    theme: 'typewriter-letter-retro', description: '泛黄信纸底+打字机等宽字体+红色修正标记+手写签名',
    primaryColor: '#5a4a3a', secondaryColor: '#7a6a5a', backgroundColor: '#f5f0e0', textColor: '#3a2a1a', lightText: '#ffffff', accentColor: '#8b0000',
    features: ['aged-paper', 'monospace-font', 'red-mark', 'signature', 'circle-photo'] },

  // 模板37：蓝白地中海海洋风
  { id: 't37', name: '蓝白地中海海洋', category: '居中通栏', layout: 'banner-center',
    theme: 'mediterranean-ocean', description: '蓝白配色+波浪纹装饰+圆形舷窗照片+海洋元素',
    primaryColor: '#1a5276', secondaryColor: '#2e86c1', backgroundColor: '#f0f8ff', textColor: '#1a3a5a', lightText: '#ffffff', accentColor: '#2e86c1',
    features: ['wave-deco', 'porthole-photo', 'ocean-elements', 'circle-photo'] },

  // 模板38：渐变波普艺术撞色
  { id: 't38', name: '波普艺术撞色', category: '卡片模块', layout: 'card-style',
    theme: 'pop-art-clash', description: '高饱和撞色+网点背景+对话框元素+波普圆点',
    primaryColor: '#ff006e', secondaryColor: '#3a86ff', backgroundColor: '#fffbeb', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#ffbe0b',
    features: ['halftone-bg', 'speech-bubble', 'pop-dot', 'clash-colors'] },

  // 模板39：北欧几何插画右侧栏
  { id: 't39', name: '北欧几何插画', category: '现代分割', layout: 'sidebar-right',
    theme: 'nordic-geo-illustration', description: '右侧灰蓝侧栏+北欧简约几何插画+圆形头像+柔和配色',
    primaryColor: '#5b7c99', secondaryColor: '#7a9ab5', backgroundColor: '#fafafa', textColor: '#3a4a5a', lightText: '#ffffff', accentColor: '#e8956a',
    features: ['nordic-illustration', 'geo-shape', 'circle-photo', 'soft-color'] },

  // 模板40：中国红喜庆国风
  { id: 't40', name: '中国红国风喜庆', category: '居中通栏', layout: 'banner-center',
    theme: 'chinese-red-festive', description: '大红底色+金色祥云纹+竖排标题+印章装饰+回纹边框',
    primaryColor: '#c41e3a', secondaryColor: '#8b0000', backgroundColor: '#fff5f5', textColor: '#4a0000', lightText: '#ffd700', accentColor: '#ffd700',
    features: ['cloud-pattern', 'vertical-title', 'seal-stamp', 'meander-border', 'circle-photo'] },

  // 模板41：暗紫赛博朋克霓虹
  { id: 't41', name: '赛博朋克霓虹紫', category: '深色主题', layout: 'dark-theme',
    theme: 'cyberpunk-neon-purple', description: '暗紫底色+霓虹粉紫青光效+故障艺术+发光边框',
    primaryColor: '#1a0a2e', secondaryColor: '#251044', backgroundColor: '#0d0518', textColor: '#e0d0ff', lightText: '#ffffff', accentColor: '#ff00ff',
    features: ['neon-glow', 'glitch-art', 'glow-border', 'scan-line', 'circle-photo'] },

  // 模板42：牛皮纸复古档案风
  { id: 't42', name: '牛皮纸复古档案', category: '简洁居中', layout: 'clean-center',
    theme: 'kraft-archive-retro', description: '牛皮纸底色+打孔档案标签+红色印章+复古边框',
    primaryColor: '#8b6914', secondaryColor: '#a07820', backgroundColor: '#d4b896', textColor: '#3a2a1a', lightText: '#ffffff', accentColor: '#8b0000',
    features: ['kraft-paper', 'archive-tag', 'red-stamp', 'vintage-border', 'circle-photo'] },

  // 模板43：渐变极光北极光风
  { id: 't43', name: '极光渐变北极光', category: '居中通栏', layout: 'banner-center',
    theme: 'aurora-gradient-north', description: '极光绿紫渐变背景+星空点缀+白色半透明卡片+梦幻光效',
    primaryColor: '#00b894', secondaryColor: '#6c5ce7', backgroundColor: '#0a0a2e', textColor: '#e8e8f0', lightText: '#ffffff', accentColor: '#00cec9',
    features: ['aurora-gradient', 'star-sparkle', 'glass-card', 'glow-effect', 'circle-photo'] },

  // 模板44：极简线条素描风
  { id: 't44', name: '极简线条素描', category: '优雅极简', layout: 'elegant-minimal',
    theme: 'minimal-line-sketch', description: '纯白底+细线手绘素描装饰+极简排版+大量留白',
    primaryColor: '#2c3e50', secondaryColor: '#5a6a7a', backgroundColor: '#ffffff', textColor: '#2c3e50', lightText: '#ffffff', accentColor: '#7f8c8d',
    features: ['line-sketch', 'thin-border', 'extreme-whitespace', 'circle-photo'] },

  // 模板45：绿色生态自然环保风
  { id: 't45', name: '绿色生态自然环保', category: '商务侧栏', layout: 'sidebar-left',
    theme: 'green-eco-natural', description: '墨绿侧栏+树叶纹理+自然元素图标+环保色系',
    primaryColor: '#1b5e20', secondaryColor: '#2e7d32', backgroundColor: '#f1f8e9', textColor: '#1b3a1f', lightText: '#ffffff', accentColor: '#4caf50',
    features: ['leaf-texture', 'nature-icon', 'eco-color', 'circle-photo'] },

  // 模板46：鎏金黑金奢华商务
  { id: 't46', name: '黑金鎏金奢华', category: '深色主题', layout: 'dark-theme',
    theme: 'black-gold-luxury', description: '纯黑底+烫金质感标题+金色细线分割+奢华质感',
    primaryColor: '#0a0a0a', secondaryColor: '#1a1a1a', backgroundColor: '#0a0a0a', textColor: '#e0e0e0', lightText: '#ffffff', accentColor: '#d4af37',
    features: ['gold-texture', 'gold-line', 'luxury-shadow', 'circle-photo'] },

  // 模板47：马赛克拼贴艺术风
  { id: 't47', name: '马赛克拼贴艺术', category: '卡片模块', layout: 'card-style',
    theme: 'mosaic-collage-art', description: '彩色马赛克方块拼接背景+不规则内容区块+艺术拼贴感',
    primaryColor: '#e74c3c', secondaryColor: '#3498db', backgroundColor: '#fafafa', textColor: '#2c3e50', lightText: '#ffffff', accentColor: '#f39c12',
    features: ['mosaic-bg', 'irregular-block', 'art-collage', 'circle-photo'] },

  // 模板48：水彩晕染梦幻渐变
  { id: 't48', name: '水彩晕染梦幻', category: '居中通栏', layout: 'banner-center',
    theme: 'watercolor-dream', description: '水彩晕染背景+柔和渐变+白色半透明卡片+梦幻色调',
    primaryColor: '#d63384', secondaryColor: '#e85d9e', backgroundColor: '#fff5f5', textColor: '#3a2a3a', lightText: '#ffffff', accentColor: '#6a4c93',
    features: ['watercolor-bg', 'soft-gradient', 'glass-card', 'circle-photo'] },

  // 模板49：工业蒸汽朋克风
  { id: 't49', name: '工业蒸汽朋克', category: '深色主题', layout: 'dark-theme',
    theme: 'steampunk-industrial', description: '深棕底色+齿轮机械元素+铜管装饰+复古工业风',
    primaryColor: '#3e2723', secondaryColor: '#5d4037', backgroundColor: '#2a1f1a', textColor: '#d7ccc8', lightText: '#ffffff', accentColor: '#bf6a02',
    features: ['gear-deco', 'copper-pipe', 'industrial-rivet', 'circle-photo'] },

  // 模板50：极简白纸黑字学术风
  { id: 't50', name: '极简学术白纸黑字', category: '简洁居中', layout: 'clean-center',
    theme: 'academic-minimal-bw', description: '纯白底+黑色衬线字体+学术排版+无装饰+极致留白',
    primaryColor: '#1a1a1a', secondaryColor: '#444444', backgroundColor: '#ffffff', textColor: '#1a1a1a', lightText: '#ffffff', accentColor: '#444444',
    features: ['academic-layout', 'serif-font', 'no-decoration', 'extreme-whitespace'] },
]

export const resumeTemplateCategories = ['全部', ...Array.from(new Set(resumeTemplateStyles.map(t => t.category)))]

export function getResumeTemplate(id: string): ResumeTemplateStyle {
  return resumeTemplateStyles.find(t => t.id === id) || resumeTemplateStyles[0]
}
