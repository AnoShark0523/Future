<script setup lang="ts">
import { computed } from 'vue'
import type { ResumeData } from '@/utils/resumeTemplates'
import type { ResumeTemplateStyle } from '@/utils/resumeTemplateStyles'

const props = defineProps<{
  data: ResumeData
  style: ResumeTemplateStyle
  scale: number
}>()

const d = computed(() => props.data)
const p = computed(() => props.data.personal)
const s = computed(() => props.style)

const cssVars = computed(() => ({
  '--primary': s.value.primaryColor,
  '--secondary': s.value.secondaryColor,
  '--bg': s.value.backgroundColor,
  '--text': s.value.textColor,
  '--light': s.value.lightText,
  '--accent': s.value.accentColor
}))

function hasFeature(name: string): boolean {
  return s.value.features.includes(name)
}

const rootClasses = computed(() => [
  `theme-${s.value.theme}`,
  `layout-${s.value.layout}`,
  // 动态生成所有 feature 的 class
  ...s.value.features.map(f => `has-${f}`),
  {
    'has-circle-photo': hasFeature('circle-photo'),
    'has-square-photo': !hasFeature('circle-photo')
  }
])

function formatDateRange(start: string, end: string): string {
  const st = start || ''
  const ed = end || '至今'
  if (!st && !end) return ''
  if (!st) return ed
  return `${st} - ${ed}`
}

const hasAnyContent = computed(() => {
  const r = d.value
  return !!(
    p.value.name ||
    p.value.title ||
    r.education.length ||
    r.experience.length ||
    r.projects.length ||
    r.skills.length ||
    r.certifications.length ||
    r.languages.length ||
    r.selfEvaluation ||
    p.value.summary
  )
})

const contactItems = computed(() => {
  const items: { icon: string; text: string }[] = []
  if (p.value.phone) items.push({ icon: '📱', text: p.value.phone })
  if (p.value.email) items.push({ icon: '✉️', text: p.value.email })
  if (p.value.location) items.push({ icon: '📍', text: p.value.location })
  if (p.value.website) items.push({ icon: '🌐', text: p.value.website })
  if (p.value.github) items.push({ icon: '💻', text: p.value.github })
  if (p.value.linkedin) items.push({ icon: '🔗', text: p.value.linkedin })
  return items
})

const basicItems = computed(() => {
  const items: { label: string; value: string }[] = []
  if (p.value.gender) items.push({ label: '性别', value: p.value.gender })
  if (p.value.birthDate) items.push({ label: '出生', value: p.value.birthDate })
  if (p.value.ethnicity) items.push({ label: '民族', value: p.value.ethnicity })
  if (p.value.politicalStatus) items.push({ label: '政治面貌', value: p.value.politicalStatus })
  // 学历信息整合到个人信息区域
  const edu = d.value.education[0]
  if (edu) {
    if (edu.degree) items.push({ label: '学历', value: edu.degree })
    if (edu.school) items.push({ label: '学校', value: edu.school })
    if (edu.major) items.push({ label: '专业', value: edu.major })
    if (edu.endDate) items.push({ label: '毕业', value: edu.endDate })
  }
  if (p.value.englishLevel) items.push({ label: '英语', value: p.value.englishLevel })
  return items
})

const skillRings = computed(() => {
  const rings: { name: string; percent: number; color: string }[] = []
  const colors = [
    s.value.primaryColor,
    s.value.secondaryColor,
    s.value.accentColor,
    '#f39c12',
    '#27ae60',
    '#9b59b6'
  ]
  let idx = 0
  d.value.skills.forEach((cat) => {
    cat.skills.filter(Boolean).forEach((skill) => {
      if (rings.length >= 6) return
      rings.push({
        name: skill,
        percent: 60 + ((idx * 17 + 13) % 40),
        color: colors[idx % colors.length]
      })
      idx++
    })
  })
  return rings
})

const skillBars = computed(() => {
  const bars: { name: string; percent: number; category: string }[] = []
  let idx = 0
  d.value.skills.forEach((cat) => {
    cat.skills.filter(Boolean).forEach((skill) => {
      bars.push({
        name: skill,
        percent: 60 + ((idx * 23 + 7) % 40),
        category: cat.name
      })
      idx++
    })
  })
  return bars
})

const pieChartData = computed(() => {
  const data: { name: string; value: number; color: string }[] = []
  const colors = [
    s.value.primaryColor,
    s.value.secondaryColor,
    s.value.accentColor,
    '#f39c12',
    '#27ae60',
    '#9b59b6'
  ]
  d.value.skills.forEach((cat, i) => {
    const val = cat.skills.filter(Boolean).length
    if (val > 0) {
      data.push({ name: cat.name, value: val, color: colors[i % colors.length] })
    }
  })
  return data
})

const pieGradient = computed(() => {
  const data = pieChartData.value
  if (!data.length) return ''
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (total === 0) return ''
  let acc = 0
  const stops: string[] = []
  data.forEach((item) => {
    const start = (acc / total) * 100
    acc += item.value
    const end = (acc / total) * 100
    stops.push(`${item.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`)
  })
  return `conic-gradient(${stops.join(', ')})`
})

const barChartData = computed(() => {
  const items: { label: string; value: number }[] = []
  d.value.experience.forEach((exp, i) => {
    items.push({
      label: exp.company || exp.position,
      value: 50 + ((i * 19 + 7) % 50)
    })
  })
  d.value.projects.forEach((proj, i) => {
    items.push({
      label: proj.name,
      value: 50 + (((i + 10) * 17 + 5) % 50)
    })
  })
  return items.slice(0, 8)
})

const lineChartPath = computed(() => {
  const data = pieChartData.value
  if (data.length < 2) return ''
  const max = Math.max(...data.map((item) => item.value), 1)
  const n = data.length
  return data
    .map((item, i) => {
      const x = (i / (n - 1)) * 100
      const y = 100 - (item.value / max) * 75 - 10
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
})

const timelineItems = computed(() => {
  type Merged = { id: string; date: string; title: string; subtitle: string; desc: string; type: 'edu' | 'exp' | 'proj' }
  const items: Merged[] = []
  d.value.experience.forEach((e) => {
    items.push({
      id: e.id,
      date: e.startDate || '',
      title: e.position,
      subtitle: e.company,
      desc: e.description,
      type: 'exp'
    })
  })
  d.value.education.forEach((e) => {
    items.push({
      id: e.id,
      date: e.startDate || '',
      title: e.school,
      subtitle: `${e.degree}${e.major ? ' · ' + e.major : ''}`,
      desc: e.description,
      type: 'edu'
    })
  })
  d.value.projects.forEach((e) => {
    items.push({
      id: e.id,
      date: e.startDate || '',
      title: e.name,
      subtitle: e.role,
      desc: e.description,
      type: 'proj'
    })
  })
  return items.sort((a, b) => b.date.localeCompare(a.date))
})

const skillTags = computed(() => {
  const tags: string[] = []
  d.value.skills.forEach((cat) => {
    cat.skills.filter(Boolean).forEach((skill) => tags.push(skill))
  })
  return tags
})
</script>

<template>
  <div
    class="resume-paper"
    :class="rootClasses"
    :style="{
      transform: `scale(${scale / 100})`,
      transformOrigin: 'top center',
      width: '210mm',
      minHeight: '297mm',
      background: s.backgroundColor,
      color: s.textColor,
      ...cssVars
    }"
  >
    <!-- ==================== 背景层 ==================== -->
    <div class="bg-layer" aria-hidden="true">
      <div class="bg-geometric" v-if="hasFeature('geometric-bg')"></div>
      <div class="bg-grid" v-if="hasFeature('grid-bg')"></div>
      <div class="bg-photo" v-if="hasFeature('photo-bg')"></div>
    </div>

    <!-- 水印 -->
    <div class="watermark" v-if="hasFeature('watermark')" aria-hidden="true">PERSONAL RESUME</div>

    <!-- ==================== 左侧栏布局 ==================== -->
    <div v-if="s.layout === 'sidebar-left'" class="layout-sidebar-left content-layer">
      <aside class="sidebar">
        <div class="sidebar-brand">PERSONAL RESUME</div>

        <div class="photo-wrap sidebar-photo">
          <img v-if="p.photo" :src="p.photo" class="photo-img" />
          <div v-else class="photo-placeholder">照片</div>
        </div>

        <div class="sidebar-name-wrap">
          <div v-if="p.name" class="sidebar-name">{{ p.name }}</div>
          <div v-if="p.title" class="sidebar-subtitle">{{ p.title }}</div>
        </div>

        <div class="sidebar-section" v-if="basicItems.length">
          <div class="section-title sidebar-section-title">基础信息</div>
          <div class="sidebar-list">
            <div v-for="item in basicItems" :key="item.label" class="sidebar-row">
              <span class="sidebar-label">{{ item.label }}</span>
              <span class="sidebar-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <div class="sidebar-section" v-if="contactItems.length">
          <div class="section-title sidebar-section-title">联系方式</div>
          <div class="sidebar-list">
            <div v-for="(item, idx) in contactItems" :key="idx" class="sidebar-row">
              <span class="sidebar-icon">{{ item.icon }}</span>
              <span class="sidebar-value">{{ item.text }}</span>
            </div>
          </div>
        </div>

        <div class="sidebar-section" v-if="d.skills.length">
          <div class="section-title sidebar-section-title">专业技能</div>
          <div v-for="cat in d.skills" :key="cat.id" class="skill-block">
            <div class="skill-cat-name">{{ cat.name }}</div>
            <div class="skill-tags">{{ cat.skills.filter(Boolean).join('、') }}</div>
          </div>
        </div>

        <div class="sidebar-section" v-if="d.certifications.length">
          <div class="section-title sidebar-section-title">证书</div>
          <div v-for="cert in d.certifications" :key="cert.id" class="sidebar-cert">
            <strong>{{ cert.name }}</strong>
            <span v-if="cert.date"> ({{ cert.date }})</span>
          </div>
        </div>

        <div class="sidebar-section" v-if="d.languages.length">
          <div class="section-title sidebar-section-title">语言</div>
          <div v-for="lang in d.languages" :key="lang.id" class="sidebar-cert">
            <strong>{{ lang.name }}</strong>
            <span v-if="lang.proficiency">：{{ lang.proficiency }}</span>
          </div>
        </div>
      </aside>

      <main class="main-right">
        <section v-if="p.summary" class="section">
          <div class="section-title"><span class="section-icon">👤</span>个人简介</div>
          <p class="section-body">{{ p.summary }}</p>
        </section>

        <section v-if="d.experience.length" class="section">
          <div class="section-title"><span class="section-icon">💼</span>工作经历</div>
          <div v-for="exp in d.experience" :key="exp.id" class="entry-row">
            <div class="entry-meta">
              <span class="entry-position">{{ exp.position }}<span v-if="exp.company"> · {{ exp.company }}</span></span>
              <span class="entry-date">{{ formatDateRange(exp.startDate, exp.endDate) }}</span>
            </div>
            <p v-if="exp.description" class="entry-desc">{{ exp.description }}</p>
          </div>
        </section>

        <section v-if="d.projects.length" class="section">
          <div class="section-title"><span class="section-icon">🚀</span>项目经验</div>
          <div v-for="proj in d.projects" :key="proj.id" class="entry-row">
            <div class="entry-meta">
              <span class="entry-position">{{ proj.name }}<span v-if="proj.role"> · {{ proj.role }}</span><span v-if="proj.link"> · <a :href="proj.link" target="_blank" class="entry-link">{{ proj.link }}</a></span></span>
              <span class="entry-date">{{ formatDateRange(proj.startDate, proj.endDate) }}</span>
            </div>
            <p v-if="proj.description" class="entry-desc">{{ proj.description }}</p>
          </div>
        </section>

        <section v-if="d.selfEvaluation" class="section">
          <div class="section-title"><span class="section-icon">📝</span>自我评价</div>
          <p class="section-body">{{ d.selfEvaluation }}</p>
        </section>
      </main>
    </div>

    <!-- ==================== 右侧栏布局 ==================== -->
    <div v-else-if="s.layout === 'sidebar-right'" class="layout-sidebar-right content-layer">
      <main class="main-left">
        <header class="main-header-centered">
          <div v-if="p.name" class="main-name">{{ p.name }}</div>
          <div v-if="p.title" class="main-title-text">{{ p.title }}</div>
          <div class="contact-bar" v-if="contactItems.length">
            <span v-for="(item, idx) in contactItems" :key="idx" class="contact-item">{{ item.icon }} {{ item.text }}</span>
          </div>
        </header>

        <section v-if="p.summary" class="section">
          <div class="section-title"><span class="section-icon">👤</span>个人简介</div>
          <p class="section-body">{{ p.summary }}</p>
        </section>

        <section v-if="d.selfEvaluation" class="section">
          <div class="section-title"><span class="section-icon">📝</span>自我评价</div>
          <p class="section-body">{{ d.selfEvaluation }}</p>
        </section>

        <section v-if="d.experience.length" class="section">
          <div class="section-title"><span class="section-icon">💼</span>工作经历</div>
          <div v-for="exp in d.experience" :key="exp.id" class="entry-row">
            <div class="entry-meta">
              <span class="entry-position">{{ exp.position }}<span v-if="exp.company"> · {{ exp.company }}</span></span>
              <span class="entry-date">{{ formatDateRange(exp.startDate, exp.endDate) }}</span>
            </div>
            <p v-if="exp.description" class="entry-desc">{{ exp.description }}</p>
          </div>
        </section>

        <section v-if="d.projects.length" class="section">
          <div class="section-title"><span class="section-icon">🚀</span>项目经验</div>
          <div v-for="proj in d.projects" :key="proj.id" class="entry-row">
            <div class="entry-meta">
              <span class="entry-position">{{ proj.name }}<span v-if="proj.role"> · {{ proj.role }}</span><span v-if="proj.link"> · <a :href="proj.link" target="_blank" class="entry-link">{{ proj.link }}</a></span></span>
              <span class="entry-date">{{ formatDateRange(proj.startDate, proj.endDate) }}</span>
            </div>
            <p v-if="proj.description" class="entry-desc">{{ proj.description }}</p>
          </div>
        </section>

      </main>

      <aside class="sidebar sidebar-right">
        <div class="photo-wrap right-photo">
          <img v-if="p.photo" :src="p.photo" class="photo-img" />
          <div v-else class="photo-placeholder">照片</div>
        </div>

        <div class="sidebar-section" v-if="basicItems.length">
          <div class="section-title sidebar-section-title">基本信息</div>
          <div class="sidebar-list">
            <div v-for="item in basicItems" :key="item.label" class="sidebar-row">
              <span class="sidebar-label">{{ item.label }}</span>
              <span class="sidebar-value">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <div class="sidebar-section" v-if="d.skills.length">
          <div class="section-title sidebar-section-title">专业技能</div>
          <div v-for="cat in d.skills" :key="cat.id" class="skill-block">
            <div class="skill-cat-name">{{ cat.name }}</div>
            <div class="skill-tags">{{ cat.skills.filter(Boolean).join('、') }}</div>
          </div>
        </div>

        <div class="sidebar-section" v-if="d.certifications.length">
          <div class="section-title sidebar-section-title">证书</div>
          <div v-for="cert in d.certifications" :key="cert.id" class="sidebar-cert">
            <strong>{{ cert.name }}</strong><span v-if="cert.date"> ({{ cert.date }})</span>
          </div>
        </div>

        <div class="sidebar-section" v-if="d.languages.length">
          <div class="section-title sidebar-section-title">语言</div>
          <div v-for="lang in d.languages" :key="lang.id" class="sidebar-cert">
            <strong>{{ lang.name }}</strong><span v-if="lang.proficiency">：{{ lang.proficiency }}</span>
          </div>
        </div>
      </aside>
    </div>

    <!-- ==================== 顶部横幅布局 ==================== -->
    <div v-else-if="s.layout === 'banner-top'" class="layout-banner-top content-layer">
      <header class="banner-header">
        <div class="photo-wrap banner-photo">
          <img v-if="p.photo" :src="p.photo" class="photo-img" />
          <div v-else class="photo-placeholder">照片</div>
        </div>
        <div class="banner-info">
          <div v-if="p.name" class="banner-name">{{ p.name }}</div>
          <div v-if="p.title" class="banner-title-text">{{ p.title }}</div>
          <div class="contact-bar" v-if="contactItems.length">
            <span v-for="(item, idx) in contactItems" :key="idx" class="contact-item">{{ item.icon }} {{ item.text }}</span>
          </div>
          <div class="basic-bar" v-if="basicItems.length">
            <span v-for="item in basicItems" :key="item.label" class="basic-item">{{ item.label }}：{{ item.value }}</span>
          </div>
        </div>
      </header>

      <main class="banner-main">
        <section v-if="p.summary" class="section">
          <div class="section-title"><span class="section-icon">👤</span>个人简介</div>
          <p class="section-body summary-box">{{ p.summary }}</p>
        </section>

        <section v-if="d.selfEvaluation" class="section">
          <div class="section-title"><span class="section-icon">📝</span>自我评价</div>
          <p class="section-body">{{ d.selfEvaluation }}</p>
        </section>

        <div class="two-col">
          <div class="col">
            <section v-if="d.experience.length" class="section">
              <div class="section-title"><span class="section-icon">💼</span>工作经历</div>
              <div v-for="exp in d.experience" :key="exp.id" class="entry-row">
                <div class="entry-meta">
                  <span class="entry-position">{{ exp.position }}</span>
                  <span class="entry-date">{{ formatDateRange(exp.startDate, exp.endDate) }}</span>
                </div>
                <div class="entry-sub">{{ exp.company }}</div>
                <p v-if="exp.description" class="entry-desc">{{ exp.description }}</p>
              </div>
            </section>

            <section v-if="d.projects.length" class="section">
              <div class="section-title"><span class="section-icon">🚀</span>项目经验</div>
              <div v-for="proj in d.projects" :key="proj.id" class="entry-row">
                <div class="entry-meta">
                  <span class="entry-position">{{ proj.name }}</span>
                  <span class="entry-date">{{ formatDateRange(proj.startDate, proj.endDate) }}</span>
                </div>
                <div class="entry-sub" v-if="proj.role">{{ proj.role }}</div>
                <p v-if="proj.description" class="entry-desc">{{ proj.description }}</p>
              </div>
            </section>
          </div>

          <div class="col">
            <section v-if="d.skills.length" class="section">
              <div class="section-title"><span class="section-icon">⚡</span>专业技能</div>
              <div v-for="cat in d.skills" :key="cat.id" class="skill-block">
                <div class="skill-cat-name">{{ cat.name }}</div>
                <div class="skill-tags">{{ cat.skills.filter(Boolean).join('、') }}</div>
              </div>
            </section>

            <section v-if="d.certifications.length" class="section">
              <div class="section-title"><span class="section-icon">🏆</span>获奖证书</div>
              <div v-for="cert in d.certifications" :key="cert.id" class="cert-row">
                <strong>{{ cert.name }}</strong>
                <span v-if="cert.issuer"> - {{ cert.issuer }}</span>
                <span v-if="cert.date"> ({{ cert.date }})</span>
              </div>
            </section>

            <section v-if="d.languages.length" class="section">
              <div class="section-title"><span class="section-icon">🌐</span>语言能力</div>
              <div v-for="lang in d.languages" :key="lang.id" class="lang-row">
                <strong>{{ lang.name }}</strong><span v-if="lang.proficiency">：{{ lang.proficiency }}</span>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>

    <!-- ==================== 居中横幅布局 ==================== -->
    <div v-else-if="s.layout === 'banner-center'" class="layout-banner-center content-layer">
      <header class="center-header">
        <div class="photo-wrap center-photo">
          <img v-if="p.photo" :src="p.photo" class="photo-img" />
          <div v-else class="photo-placeholder">照片</div>
        </div>
        <div v-if="p.name" class="center-name">{{ p.name }}</div>
        <div v-if="p.title" class="center-title-text">{{ p.title }}</div>
        <div class="contact-strip" v-if="contactItems.length || basicItems.length">
          <span v-for="(item, idx) in contactItems" :key="'c' + idx" class="strip-item">{{ item.icon }} {{ item.text }}</span>
          <span v-for="item in basicItems" :key="item.label" class="strip-item">{{ item.label }}：{{ item.value }}</span>
        </div>
      </header>

      <main class="center-main">
        <section v-if="p.summary" class="section">
          <p class="section-body center">{{ p.summary }}</p>
        </section>

        <section v-if="d.selfEvaluation" class="section">
          <div class="section-title"><span class="section-icon">📝</span>自我评价</div>
          <p class="section-body justify">{{ d.selfEvaluation }}</p>
        </section>

        <section v-if="d.experience.length" class="section">
          <div class="section-title"><span class="section-icon">💼</span>工作经历</div>
          <div v-for="exp in d.experience" :key="exp.id" class="entry-row">
            <div class="entry-meta">
              <span class="entry-position">{{ exp.position }}<span v-if="exp.company"> · {{ exp.company }}</span></span>
              <span class="entry-date">{{ formatDateRange(exp.startDate, exp.endDate) }}</span>
            </div>
            <p v-if="exp.description" class="entry-desc">{{ exp.description }}</p>
          </div>
        </section>

        <section v-if="d.projects.length" class="section">
          <div class="section-title"><span class="section-icon">🚀</span>项目经验</div>
          <div v-for="proj in d.projects" :key="proj.id" class="entry-row">
            <div class="entry-meta">
              <span class="entry-position">{{ proj.name }}<span v-if="proj.role"> · {{ proj.role }}</span><span v-if="proj.link"> · <a :href="proj.link" target="_blank" class="entry-link">{{ proj.link }}</a></span></span>
              <span class="entry-date">{{ formatDateRange(proj.startDate, proj.endDate) }}</span>
            </div>
            <p v-if="proj.description" class="entry-desc">{{ proj.description }}</p>
          </div>
        </section>

        <section v-if="d.skills.length" class="section">
          <div class="section-title"><span class="section-icon">⚡</span>专业技能</div>
          <div v-for="cat in d.skills" :key="cat.id" class="skill-block">
            <div class="skill-cat-name">{{ cat.name }}</div>
            <div class="skill-tags">{{ cat.skills.filter(Boolean).join('、') }}</div>
          </div>
        </section>

        <section v-if="d.certifications.length || d.languages.length" class="section">
          <div class="section-title"><span class="section-icon">🏅</span>其他</div>
          <div v-for="cert in d.certifications" :key="cert.id" class="cert-row">
            <strong>{{ cert.name }}</strong>
            <span v-if="cert.issuer"> - {{ cert.issuer }}</span>
            <span v-if="cert.date"> ({{ cert.date }})</span>
          </div>
          <div v-for="lang in d.languages" :key="lang.id" class="lang-row">
            <strong>{{ lang.name }}</strong><span v-if="lang.proficiency">：{{ lang.proficiency }}</span>
          </div>
        </section>
      </main>
    </div>

    <!-- ==================== 时间轴布局 ==================== -->
    <div v-else-if="s.layout === 'timeline'" class="layout-timeline content-layer">
      <header class="timeline-header">
        <div class="photo-wrap timeline-photo">
          <img v-if="p.photo" :src="p.photo" class="photo-img" />
          <div v-else class="photo-placeholder">照片</div>
        </div>
        <div class="timeline-head-info">
          <div v-if="p.name" class="timeline-name">{{ p.name }}</div>
          <div v-if="p.title" class="timeline-title-text">{{ p.title }}</div>
          <div class="contact-bar" v-if="contactItems.length">
            <span v-for="(item, idx) in contactItems" :key="idx" class="contact-item">{{ item.icon }} {{ item.text }}</span>
          </div>
        </div>
      </header>

      <main class="timeline-main">
        <section v-if="p.summary || d.selfEvaluation" class="section">
          <p v-if="p.summary" class="section-body">{{ p.summary }}</p>
          <p v-if="d.selfEvaluation" class="section-body">{{ d.selfEvaluation }}</p>
        </section>

        <section v-if="timelineItems.length" class="section">
          <div class="section-title"><span class="section-icon">📅</span>履历时间轴</div>
          <div class="timeline-list">
            <div v-for="item in timelineItems" :key="item.id" class="timeline-item">
              <div class="timeline-dot" :class="`dot-${item.type}`"></div>
              <div class="entry-meta">
                <span class="entry-position">{{ item.title }}<span v-if="item.subtitle"> · {{ item.subtitle }}</span></span>
                <span class="entry-date">{{ item.date }}</span>
              </div>
              <p v-if="item.desc" class="entry-desc">{{ item.desc }}</p>
            </div>
          </div>
        </section>

        <div class="two-col">
          <section v-if="d.skills.length" class="section">
            <div class="section-title"><span class="section-icon">⚡</span>专业技能</div>
            <div v-for="cat in d.skills" :key="cat.id" class="skill-block">
              <div class="skill-cat-name">{{ cat.name }}</div>
              <div class="skill-tags">{{ cat.skills.filter(Boolean).join('、') }}</div>
            </div>
          </section>

          <section v-if="d.certifications.length || d.languages.length" class="section">
            <div class="section-title"><span class="section-icon">🏅</span>其他</div>
            <div v-for="cert in d.certifications" :key="cert.id" class="cert-row">
              <strong>{{ cert.name }}</strong><span v-if="cert.date"> ({{ cert.date }})</span>
            </div>
            <div v-for="lang in d.languages" :key="lang.id" class="lang-row">
              <strong>{{ lang.name }}</strong><span v-if="lang.proficiency">：{{ lang.proficiency }}</span>
            </div>
          </section>
        </div>
      </main>
    </div>

    <!-- ==================== 简洁居中布局 ==================== -->
    <div v-else-if="s.layout === 'clean-center'" class="layout-clean-center content-layer">
      <header class="clean-header">
        <div v-if="p.photo" class="photo-wrap clean-photo">
          <img :src="p.photo" class="photo-img" />
        </div>
        <div v-if="p.name" class="clean-name">{{ p.name }}</div>
        <div v-if="p.title" class="clean-title-text">{{ p.title }}</div>
        <div class="clean-meta">
          <span v-for="item in basicItems" :key="item.label">{{ item.label }}：{{ item.value }}</span>
          <span v-for="(item, idx) in contactItems" :key="idx">{{ item.icon }} {{ item.text }}</span>
        </div>
        <hr class="clean-divider" />
      </header>

      <main class="clean-main">
        <section v-if="p.summary" class="section">
          <p class="section-body center">{{ p.summary }}</p>
        </section>

        <section v-if="d.selfEvaluation" class="section">
          <div class="section-title"><span class="section-icon">📝</span>自我评价</div>
          <p class="section-body justify">{{ d.selfEvaluation }}</p>
        </section>

        <section v-if="d.experience.length" class="section">
          <div class="section-title"><span class="section-icon">💼</span>工作经历</div>
          <div v-for="exp in d.experience" :key="exp.id" class="entry-row">
            <div class="entry-meta">
              <span class="entry-position">{{ exp.position }}<span v-if="exp.company"> · {{ exp.company }}</span></span>
              <span class="entry-date">{{ formatDateRange(exp.startDate, exp.endDate) }}</span>
            </div>
            <p v-if="exp.description" class="entry-desc">{{ exp.description }}</p>
          </div>
        </section>

        <section v-if="d.projects.length" class="section">
          <div class="section-title"><span class="section-icon">🚀</span>项目经验</div>
          <div v-for="proj in d.projects" :key="proj.id" class="entry-row">
            <div class="entry-meta">
              <span class="entry-position">{{ proj.name }}<span v-if="proj.role"> · {{ proj.role }}</span><span v-if="proj.link"> · <a :href="proj.link" target="_blank" class="entry-link">{{ proj.link }}</a></span></span>
              <span class="entry-date">{{ formatDateRange(proj.startDate, proj.endDate) }}</span>
            </div>
            <p v-if="proj.description" class="entry-desc">{{ proj.description }}</p>
          </div>
        </section>

        <section v-if="d.skills.length" class="section">
          <div class="section-title"><span class="section-icon">⚡</span>专业技能</div>
          <div v-for="cat in d.skills" :key="cat.id" class="skill-block">
            <div class="skill-cat-name">{{ cat.name }}</div>
            <div class="skill-tags">{{ cat.skills.filter(Boolean).join('、') }}</div>
          </div>
        </section>

        <section v-if="d.certifications.length || d.languages.length" class="section">
          <div class="section-title"><span class="section-icon">🏅</span>其他</div>
          <div v-for="cert in d.certifications" :key="cert.id" class="cert-row">
            <strong>{{ cert.name }}</strong><span v-if="cert.date"> ({{ cert.date }})</span>
          </div>
          <div v-for="lang in d.languages" :key="lang.id" class="lang-row">
            <strong>{{ lang.name }}</strong><span v-if="lang.proficiency">：{{ lang.proficiency }}</span>
          </div>
        </section>
      </main>
    </div>

    <!-- ==================== 双栏分栏布局 ==================== -->
    <div v-else-if="s.layout === 'two-column'" class="layout-two-column content-layer">
      <header class="two-col-header">
        <div class="two-col-brand">
          <div v-if="p.name" class="brand-name">{{ p.name }}</div>
          <div v-if="p.title" class="brand-sub">{{ p.title }}</div>
        </div>
        <div class="photo-wrap two-col-photo">
          <img v-if="p.photo" :src="p.photo" class="photo-img" />
          <div v-else class="photo-placeholder">照片</div>
        </div>
      </header>

      <div class="contact-strip" v-if="contactItems.length || basicItems.length">
        <span v-for="(item, idx) in contactItems" :key="'c' + idx" class="strip-item">{{ item.icon }} {{ item.text }}</span>
        <span v-for="item in basicItems" :key="item.label" class="strip-item">{{ item.label }}：{{ item.value }}</span>
      </div>

      <main class="two-col-main">
        <div class="col">
          <section v-if="d.selfEvaluation" class="section">
            <div class="section-title"><span class="section-icon">📝</span>自我评价</div>
            <p class="section-body">{{ d.selfEvaluation }}</p>
          </section>

          <section v-if="d.skills.length" class="section">
            <div class="section-title"><span class="section-icon">⚡</span>专业技能</div>
            <div v-for="cat in d.skills" :key="cat.id" class="skill-block">
              <div class="skill-cat-name">{{ cat.name }}</div>
              <div class="skill-tags">{{ cat.skills.filter(Boolean).join('、') }}</div>
            </div>
          </section>

          <section v-if="d.certifications.length" class="section">
            <div class="section-title"><span class="section-icon">🏆</span>获奖证书</div>
            <div v-for="cert in d.certifications" :key="cert.id" class="cert-row">
              <strong>{{ cert.name }}</strong>
              <span v-if="cert.issuer"> - {{ cert.issuer }}</span>
              <span v-if="cert.date"> ({{ cert.date }})</span>
            </div>
          </section>

          <section v-if="d.languages.length" class="section">
            <div class="section-title"><span class="section-icon">🌐</span>语言能力</div>
            <div v-for="lang in d.languages" :key="lang.id" class="lang-row">
              <strong>{{ lang.name }}</strong><span v-if="lang.proficiency">：{{ lang.proficiency }}</span>
            </div>
          </section>
        </div>

        <div class="col">
          <section v-if="p.summary" class="section">
            <div class="section-title"><span class="section-icon">👤</span>个人简介</div>
            <p class="section-body">{{ p.summary }}</p>
          </section>

          <section v-if="d.experience.length" class="section">
            <div class="section-title"><span class="section-icon">💼</span>工作经历</div>
            <div v-for="exp in d.experience" :key="exp.id" class="entry-row">
              <div class="entry-meta">
                <span class="entry-position">{{ exp.position }}<span v-if="exp.company"> · {{ exp.company }}</span></span>
                <span class="entry-date">{{ formatDateRange(exp.startDate, exp.endDate) }}</span>
              </div>
              <p v-if="exp.description" class="entry-desc">{{ exp.description }}</p>
            </div>
          </section>

          <section v-if="d.projects.length" class="section">
            <div class="section-title"><span class="section-icon">🚀</span>项目经验</div>
            <div v-for="proj in d.projects" :key="proj.id" class="entry-row">
              <div class="entry-meta">
                <span class="entry-position">{{ proj.name }}<span v-if="proj.role"> · {{ proj.role }}</span></span>
                <span class="entry-date">{{ formatDateRange(proj.startDate, proj.endDate) }}</span>
              </div>
              <p v-if="proj.description" class="entry-desc">{{ proj.description }}</p>
            </div>
          </section>

        </div>
      </main>
    </div>

    <!-- ==================== 卡片模块布局 ==================== -->
    <div v-else-if="s.layout === 'card-style'" class="layout-card-style content-layer">
      <header class="card-header">
        <div class="photo-wrap card-photo">
          <img v-if="p.photo" :src="p.photo" class="photo-img" />
          <div v-else class="photo-placeholder">照片</div>
        </div>
        <div class="card-head-info">
          <div v-if="p.name" class="card-name">{{ p.name }}</div>
          <div v-if="p.title" class="card-title-text">{{ p.title }}</div>
          <div class="contact-bar" v-if="contactItems.length">
            <span v-for="(item, idx) in contactItems" :key="idx" class="contact-item">{{ item.icon }} {{ item.text }}</span>
          </div>
          <div class="info-strip" v-if="basicItems.length">
            <span v-for="item in basicItems" :key="item.label" class="info-strip-item">{{ item.label }}：{{ item.value }}</span>
          </div>
        </div>
      </header>

      <main class="card-grid" :class="{ 'four-grid': hasFeature('four-grid') }">
        <section v-if="p.summary" class="card-section full">
          <div class="section-title"><span class="section-icon">👤</span>个人简介</div>
          <p class="section-body">{{ p.summary }}</p>
        </section>

        <section v-if="d.selfEvaluation" class="card-section full">
          <div class="section-title"><span class="section-icon">📝</span>自我评价</div>
          <p class="section-body">{{ d.selfEvaluation }}</p>
        </section>

        <section v-if="d.experience.length" class="card-section">
          <div class="section-title"><span class="section-icon">💼</span>工作经历</div>
          <div v-for="exp in d.experience" :key="exp.id" class="entry-row">
            <div class="entry-meta">
              <span class="entry-position">{{ exp.position }}</span>
              <span class="entry-date">{{ formatDateRange(exp.startDate, exp.endDate) }}</span>
            </div>
            <div class="entry-sub">{{ exp.company }}</div>
            <p v-if="exp.description" class="entry-desc">{{ exp.description }}</p>
          </div>
        </section>

        <section v-if="d.projects.length" class="card-section">
          <div class="section-title"><span class="section-icon">🚀</span>项目经验</div>
          <div v-for="proj in d.projects" :key="proj.id" class="entry-row">
            <div class="entry-meta">
              <span class="entry-position">{{ proj.name }}</span>
              <span class="entry-date">{{ formatDateRange(proj.startDate, proj.endDate) }}</span>
            </div>
            <div class="entry-sub" v-if="proj.role">{{ proj.role }}</div>
            <p v-if="proj.description" class="entry-desc">{{ proj.description }}</p>
          </div>
        </section>

        <section v-if="d.skills.length" class="card-section">
          <div class="section-title"><span class="section-icon">⚡</span>专业技能</div>
          <div v-for="cat in d.skills" :key="cat.id" class="skill-block">
            <div class="skill-cat-name">{{ cat.name }}</div>
            <div class="skill-tags">{{ cat.skills.filter(Boolean).join('、') }}</div>
          </div>
        </section>

        <section v-if="d.certifications.length" class="card-section">
          <div class="section-title"><span class="section-icon">🏆</span>获奖证书</div>
          <div v-for="cert in d.certifications" :key="cert.id" class="cert-row">
            <strong>{{ cert.name }}</strong>
            <span v-if="cert.issuer"> - {{ cert.issuer }}</span>
            <span v-if="cert.date"> ({{ cert.date }})</span>
          </div>
        </section>

        <section v-if="d.languages.length" class="card-section">
          <div class="section-title"><span class="section-icon">🌐</span>语言能力</div>
          <div v-for="lang in d.languages" :key="lang.id" class="lang-row">
            <strong>{{ lang.name }}</strong><span v-if="lang.proficiency">：{{ lang.proficiency }}</span>
          </div>
        </section>
      </main>
    </div>

    <!-- ==================== 优雅极简布局 ==================== -->
    <div v-else-if="s.layout === 'elegant-minimal'" class="layout-elegant-minimal content-layer">
      <header class="elegant-header">
        <div v-if="p.photo" class="photo-wrap elegant-photo">
          <img :src="p.photo" class="photo-img" />
        </div>
        <div v-if="p.name" class="elegant-name">{{ p.name }}</div>
        <div v-if="p.title" class="elegant-title-text">{{ p.title }}</div>
        <div class="elegant-meta">
          <span v-for="item in basicItems" :key="item.label">{{ item.value }}</span>
          <span v-for="(item, idx) in contactItems" :key="idx">{{ item.text }}</span>
        </div>
      </header>

      <main class="elegant-main">
        <section v-if="p.summary" class="section">
          <p class="section-body elegant">{{ p.summary }}</p>
        </section>

        <section v-if="d.selfEvaluation" class="section">
          <div class="section-title"><span class="section-icon">📝</span>自我评价</div>
          <p class="section-body justify">{{ d.selfEvaluation }}</p>
        </section>

        <section v-if="d.experience.length" class="section">
          <div class="section-title"><span class="section-icon">💼</span>工作经历</div>
          <div v-for="exp in d.experience" :key="exp.id" class="elegant-row">
            <div class="elegant-row-title">{{ exp.position }}</div>
            <div class="elegant-row-sub">{{ exp.company }} · {{ formatDateRange(exp.startDate, exp.endDate) }}</div>
            <p v-if="exp.description" class="entry-desc">{{ exp.description }}</p>
          </div>
        </section>

        <section v-if="d.projects.length" class="section">
          <div class="section-title"><span class="section-icon">🚀</span>项目经验</div>
          <div v-for="proj in d.projects" :key="proj.id" class="elegant-row">
            <div class="elegant-row-title">{{ proj.name }}<span v-if="proj.link"> · <a :href="proj.link" target="_blank" class="entry-link">{{ proj.link }}</a></span></div>
            <div class="elegant-row-sub">{{ proj.role }} · {{ formatDateRange(proj.startDate, proj.endDate) }}</div>
            <p v-if="proj.description" class="entry-desc">{{ proj.description }}</p>
          </div>
        </section>

        <section v-if="d.skills.length" class="section">
          <div class="section-title"><span class="section-icon">⚡</span>专业技能</div>
          <div v-for="cat in d.skills" :key="cat.id" class="skill-block">
            <div class="skill-cat-name">{{ cat.name }}</div>
            <div class="skill-tags">{{ cat.skills.filter(Boolean).join(', ') }}</div>
          </div>
        </section>

        <section v-if="d.certifications.length || d.languages.length" class="section">
          <div class="section-title"><span class="section-icon">🏅</span>其他</div>
          <div v-for="cert in d.certifications" :key="cert.id" class="cert-row">
            <strong>{{ cert.name }}</strong><span v-if="cert.date"> ({{ cert.date }})</span>
          </div>
          <div v-for="lang in d.languages" :key="lang.id" class="lang-row">
            <strong>{{ lang.name }}</strong><span v-if="lang.proficiency">：{{ lang.proficiency }}</span>
          </div>
        </section>
      </main>
    </div>

    <!-- ==================== 现代分割布局 ==================== -->
    <div v-else-if="s.layout === 'modern-split'" class="layout-modern-split content-layer">
      <header class="split-header">
        <div class="split-head-info">
          <div v-if="p.name" class="split-name">{{ p.name }}</div>
          <div v-if="p.title" class="split-title-text">{{ p.title }}</div>
        </div>
        <div class="photo-wrap split-photo">
          <img v-if="p.photo" :src="p.photo" class="photo-img" />
          <div v-else class="photo-placeholder">照片</div>
        </div>
      </header>

      <div class="split-body">
        <div class="split-left">
          <section v-if="basicItems.length || contactItems.length" class="section">
            <div class="section-title"><span class="section-icon">📋</span>基本信息</div>
            <div class="info-list">
              <div v-for="item in basicItems" :key="item.label">{{ item.label }}：{{ item.value }}</div>
              <div v-for="(item, idx) in contactItems" :key="idx">{{ item.icon }} {{ item.text }}</div>
            </div>
          </section>

          <section v-if="p.summary" class="section">
            <div class="section-title"><span class="section-icon">👤</span>个人简介</div>
            <p class="section-body">{{ p.summary }}</p>
          </section>

          <section v-if="d.selfEvaluation" class="section">
            <div class="section-title"><span class="section-icon">📝</span>自我评价</div>
            <p class="section-body">{{ d.selfEvaluation }}</p>
          </section>

          <section v-if="d.skills.length" class="section">
            <div class="section-title"><span class="section-icon">⚡</span>专业技能</div>
            <div v-for="cat in d.skills" :key="cat.id" class="skill-block">
              <div class="skill-cat-name">{{ cat.name }}</div>
              <div class="skill-tags">{{ cat.skills.filter(Boolean).join('、') }}</div>
            </div>
          </section>

          <section v-if="d.languages.length" class="section">
            <div class="section-title"><span class="section-icon">🌐</span>语言能力</div>
            <div v-for="lang in d.languages" :key="lang.id" class="lang-row">
              <strong>{{ lang.name }}</strong><span v-if="lang.proficiency">：{{ lang.proficiency }}</span>
            </div>
          </section>
        </div>

        <div class="split-right">
          <section v-if="d.experience.length" class="section">
            <div class="section-title"><span class="section-icon">💼</span>工作经历</div>
            <div v-for="exp in d.experience" :key="exp.id" class="entry-row">
              <div class="entry-meta">
                <span class="entry-position">{{ exp.position }}<span v-if="exp.company"> · {{ exp.company }}</span></span>
                <span class="entry-date">{{ formatDateRange(exp.startDate, exp.endDate) }}</span>
              </div>
              <p v-if="exp.description" class="entry-desc">{{ exp.description }}</p>
            </div>
          </section>

          <section v-if="d.projects.length" class="section">
            <div class="section-title"><span class="section-icon">🚀</span>项目经验</div>
            <div v-for="proj in d.projects" :key="proj.id" class="entry-row">
              <div class="entry-meta">
                <span class="entry-position">{{ proj.name }}<span v-if="proj.role"> · {{ proj.role }}</span></span>
                <span class="entry-date">{{ formatDateRange(proj.startDate, proj.endDate) }}</span>
              </div>
              <p v-if="proj.description" class="entry-desc">{{ proj.description }}</p>
            </div>
          </section>

          <section v-if="d.certifications.length" class="section">
            <div class="section-title"><span class="section-icon">🏆</span>获奖证书</div>
            <div v-for="cert in d.certifications" :key="cert.id" class="cert-row">
              <strong>{{ cert.name }}</strong>
              <span v-if="cert.issuer"> - {{ cert.issuer }}</span>
              <span v-if="cert.date"> ({{ cert.date }})</span>
            </div>
          </section>
        </div>
      </div>
    </div>

    <!-- ==================== 深色主题布局 ==================== -->
    <div v-else-if="s.layout === 'dark-theme'" class="layout-dark-theme content-layer">
      <header class="dark-header">
        <div class="photo-wrap dark-photo">
          <img v-if="p.photo" :src="p.photo" class="photo-img" />
          <div v-else class="photo-placeholder">照片</div>
        </div>
        <div class="dark-head-info">
          <div v-if="p.name" class="dark-name">{{ p.name }}</div>
          <div v-if="p.title" class="dark-title-text">{{ p.title }}</div>
          <div class="dark-meta">
            <span v-for="item in basicItems" :key="item.label">{{ item.label }}：{{ item.value }}</span>
            <span v-for="(item, idx) in contactItems" :key="idx">{{ item.icon }} {{ item.text }}</span>
          </div>
        </div>
      </header>

      <main class="dark-main">
        <div class="two-col">
          <div class="col">
            <section v-if="p.summary" class="section">
              <div class="section-title"><span class="section-icon">👤</span>个人简介</div>
              <p class="section-body">{{ p.summary }}</p>
            </section>

            <section v-if="d.selfEvaluation" class="section">
              <div class="section-title"><span class="section-icon">📝</span>自我评价</div>
              <p class="section-body">{{ d.selfEvaluation }}</p>
            </section>

            <section v-if="d.skills.length" class="section">
              <div class="section-title"><span class="section-icon">⚡</span>专业技能</div>
              <div v-for="cat in d.skills" :key="cat.id" class="skill-block">
                <div class="skill-cat-name">{{ cat.name }}</div>
                <div class="skill-tags">{{ cat.skills.filter(Boolean).join('、') }}</div>
              </div>
            </section>

            <section v-if="d.certifications.length" class="section">
              <div class="section-title"><span class="section-icon">🏆</span>获奖证书</div>
              <div v-for="cert in d.certifications" :key="cert.id" class="cert-row">
                <strong>{{ cert.name }}</strong>
                <span v-if="cert.issuer"> - {{ cert.issuer }}</span>
                <span v-if="cert.date"> ({{ cert.date }})</span>
              </div>
            </section>

            <section v-if="d.languages.length" class="section">
              <div class="section-title"><span class="section-icon">🌐</span>语言能力</div>
              <div v-for="lang in d.languages" :key="lang.id" class="lang-row">
                <strong>{{ lang.name }}</strong><span v-if="lang.proficiency">：{{ lang.proficiency }}</span>
              </div>
            </section>
          </div>

          <div class="col">
            <section v-if="d.experience.length" class="section">
              <div class="section-title"><span class="section-icon">💼</span>工作经历</div>
              <div v-for="exp in d.experience" :key="exp.id" class="entry-row">
                <div class="entry-meta">
                  <span class="entry-position">{{ exp.position }}<span v-if="exp.company"> · {{ exp.company }}</span></span>
                  <span class="entry-date">{{ formatDateRange(exp.startDate, exp.endDate) }}</span>
                </div>
                <p v-if="exp.description" class="entry-desc">{{ exp.description }}</p>
              </div>
            </section>

            <section v-if="d.projects.length" class="section">
              <div class="section-title"><span class="section-icon">🚀</span>项目经验</div>
              <div v-for="proj in d.projects" :key="proj.id" class="entry-row">
                <div class="entry-meta">
                  <span class="entry-position">{{ proj.name }}<span v-if="proj.role"> · {{ proj.role }}</span></span>
                  <span class="entry-date">{{ formatDateRange(proj.startDate, proj.endDate) }}</span>
                </div>
                <p v-if="proj.description" class="entry-desc">{{ proj.description }}</p>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>

    <!-- ==================== 数据图表布局 ==================== -->
    <div v-else-if="s.layout === 'dashboard'" class="layout-dashboard content-layer">
      <header class="dashboard-header">
        <div class="dashboard-head-info">
          <div v-if="p.name" class="dashboard-name">{{ p.name }}</div>
          <div v-if="p.title" class="dashboard-title-text">{{ p.title }}</div>
          <div class="dashboard-meta">
            <span v-for="(item, idx) in contactItems" :key="idx">{{ item.icon }} {{ item.text }}</span>
          </div>
        </div>
        <div class="photo-wrap dashboard-photo">
          <img v-if="p.photo" :src="p.photo" class="photo-img" />
          <div v-else class="photo-placeholder">照片</div>
        </div>
      </header>

      <main class="dashboard-main">
        <!-- 数据图表区 -->
        <div class="dashboard-charts">
          <section v-if="hasFeature('pie-chart') && pieChartData.length" class="chart-card">
            <div class="section-title"><span class="section-icon">📊</span>技能分布</div>
            <div class="chart-body">
              <div class="pie-chart" :style="{ background: pieGradient }">
                <div class="pie-chart-center">
                  <span class="pie-chart-total">{{ pieChartData.reduce((s, i) => s + i.value, 0) }}</span>
                  <span class="pie-chart-label">技能</span>
                </div>
              </div>
              <div class="pie-legend">
                <div v-for="(item, idx) in pieChartData" :key="idx" class="legend-item">
                  <span class="legend-color" :style="{ background: item.color }"></span>
                  <span class="legend-name">{{ item.name }}</span>
                  <span class="legend-value">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </section>

          <section v-if="hasFeature('bar-chart') && barChartData.length" class="chart-card">
            <div class="section-title"><span class="section-icon">📈</span>项目经验强度</div>
            <div class="bar-chart">
              <div v-for="(bar, idx) in barChartData" :key="idx" class="bar-col">
                <div class="bar-track">
                  <div class="bar-fill" :style="{ height: bar.value + '%' }"></div>
                </div>
                <div class="bar-label">{{ bar.label }}</div>
              </div>
            </div>
          </section>

          <section v-if="hasFeature('line-chart') && lineChartPath" class="chart-card">
            <div class="section-title"><span class="section-icon">📉</span>履历趋势</div>
            <div class="line-chart">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient :id="'lc-' + s.id" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" :stop-color="s.accentColor" stop-opacity="0.5" />
                    <stop offset="100%" :stop-color="s.accentColor" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path :d="lineChartPath + ` L 100,100 L 0,100 Z`" :fill="`url(#lc-${s.id})`" />
                <path :d="lineChartPath" fill="none" :stroke="s.accentColor" stroke-width="1.5" vector-effect="non-scaling-stroke" />
              </svg>
              <div class="line-chart-x">
                <span v-for="(item, idx) in pieChartData" :key="idx">{{ item.name }}</span>
              </div>
            </div>
          </section>
        </div>

        <!-- 内容详情区 -->
        <div class="two-col">
          <div class="col">
            <section v-if="p.summary" class="section">
              <div class="section-title"><span class="section-icon">👤</span>个人简介</div>
              <p class="section-body">{{ p.summary }}</p>
            </section>

            <section v-if="d.selfEvaluation" class="section">
              <div class="section-title"><span class="section-icon">📝</span>自我评价</div>
              <p class="section-body">{{ d.selfEvaluation }}</p>
            </section>

            <section v-if="d.skills.length" class="section">
              <div class="section-title"><span class="section-icon">⚡</span>专业技能</div>
              <div v-for="cat in d.skills" :key="cat.id" class="skill-block">
                <div class="skill-cat-name">{{ cat.name }}</div>
                <div class="skill-tags">{{ cat.skills.filter(Boolean).join('、') }}</div>
              </div>
            </section>

            <section v-if="d.certifications.length" class="section">
              <div class="section-title"><span class="section-icon">🏆</span>获奖证书</div>
              <div v-for="cert in d.certifications" :key="cert.id" class="cert-row">
                <strong>{{ cert.name }}</strong>
                <span v-if="cert.issuer"> - {{ cert.issuer }}</span>
                <span v-if="cert.date"> ({{ cert.date }})</span>
              </div>
            </section>
          </div>

          <div class="col">
            <section v-if="d.experience.length" class="section">
              <div class="section-title"><span class="section-icon">💼</span>工作经历</div>
              <div v-for="exp in d.experience" :key="exp.id" class="entry-row">
                <div class="entry-meta">
                  <span class="entry-position">{{ exp.position }}<span v-if="exp.company"> · {{ exp.company }}</span></span>
                  <span class="entry-date">{{ formatDateRange(exp.startDate, exp.endDate) }}</span>
                </div>
                <p v-if="exp.description" class="entry-desc">{{ exp.description }}</p>
              </div>
            </section>

            <section v-if="d.projects.length" class="section">
              <div class="section-title"><span class="section-icon">🚀</span>项目经验</div>
              <div v-for="proj in d.projects" :key="proj.id" class="entry-row">
                <div class="entry-meta">
                  <span class="entry-position">{{ proj.name }}<span v-if="proj.role"> · {{ proj.role }}</span></span>
                  <span class="entry-date">{{ formatDateRange(proj.startDate, proj.endDate) }}</span>
                </div>
                <p v-if="proj.description" class="entry-desc">{{ proj.description }}</p>
              </div>
            </section>

          </div>
        </div>
      </main>
    </div>

    <!-- 空状态 -->
    <div v-if="!hasAnyContent" class="empty-state">
      <p>请在左侧输入信息，预览将实时显示</p>
    </div>

    <!-- 城市剪影底部装饰 -->
    <div class="city-silhouette" v-if="hasFeature('city-silhouette')" aria-hidden="true">
      <svg viewBox="0 0 800 100" preserveAspectRatio="none">
        <path d="M0,100 L0,75 L20,75 L20,55 L40,55 L40,70 L60,70 L60,40 L80,40 L80,60 L100,60 L100,30 L120,30 L120,65 L140,65 L140,45 L160,45 L160,70 L180,70 L180,35 L200,35 L200,55 L220,55 L220,25 L240,25 L240,60 L260,60 L260,40 L280,40 L280,70 L300,70 L300,50 L320,50 L320,30 L340,30 L340,65 L360,65 L360,45 L380,45 L380,55 L400,55 L400,25 L420,25 L420,50 L440,50 L440,70 L460,70 L460,40 L480,40 L480,60 L500,60 L500,30 L520,30 L520,55 L540,55 L540,45 L560,45 L560,65 L580,65 L580,35 L600,35 L600,70 L620,70 L620,50 L640,50 L640,40 L660,40 L660,60 L680,60 L680,45 L700,45 L700,30 L720,30 L720,55 L740,55 L740,65 L760,65 L760,40 L780,40 L780,60 L800,60 L800,100 Z" fill="currentColor" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* ==================== 基础重置 ==================== */
* { box-sizing: border-box; }

.resume-paper {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Arial, sans-serif;
  font-size: 12.5px;
  line-height: 1.55;
  position: relative;
  box-sizing: border-box;
  display: block;
  width: 210mm;
  min-height: 297mm;
}

.content-layer {
  position: relative;
  z-index: 1;
  width: 100%;
  box-sizing: border-box;
}

/* ==================== 背景层 ==================== */
.bg-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-geometric {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, var(--primary)22 25%, transparent 25%) -50px 0,
    linear-gradient(225deg, var(--accent)22 25%, transparent 25%) -50px 0,
    linear-gradient(315deg, var(--primary)22 25%, transparent 25%),
    linear-gradient(45deg, var(--accent)22 25%, transparent 25%);
  background-size: 100px 100px;
  opacity: 0.6;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--primary) 1px, transparent 1px),
    linear-gradient(90deg, var(--primary) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.08;
}

.bg-photo {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, var(--primary) 0%, transparent 45%),
    linear-gradient(135deg, var(--secondary) 0%, transparent 60%),
    radial-gradient(circle at 80% 10%, var(--accent)33, transparent 50%);
  opacity: 0.85;
}

/* 水印 */
.watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-30deg);
  font-size: 72px;
  font-weight: 900;
  color: var(--accent);
  opacity: 0.07;
  letter-spacing: 12px;
  z-index: 0;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}

/* ==================== 照片系统 ==================== */
.photo-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.35);
  font-size: 11px;
}

.photo-square .photo-wrap { border-radius: 4px; }
.photo-circle .photo-wrap { border-radius: 50%; }

/* ==================== 标题系统 ==================== */
.section-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--primary);
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  border-left: 3px solid var(--primary);
  padding-left: 10px;
}
.section-icon {
  font-size: 15px;
}

/* 斜切标题 */
.has-slanted-header .section-title {
  color: #fff;
  background: linear-gradient(110deg, var(--primary) 82%, transparent 82%);
  padding: 5px 36px 5px 12px;
  display: inline-flex;
  margin-left: -4px;
  clip-path: polygon(0 0, 92% 0, 100% 100%, 0 100%);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  border-left: none;
}
.has-slanted-header .section-title .section-icon {
  color: #fff;
}

/* 代码风格 */
.has-code-style .section-title {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  border-left: none;
  padding-left: 0;
}
.has-code-style .section-title::before {
  content: '//';
  color: var(--accent);
  font-weight: 700;
  margin-right: 4px;
}
.has-code-style .section-title .section-icon {
  display: none;
}

/* 虚线分割 */
.has-dashed-divider .section {
  border-bottom: 1px dashed var(--primary);
  padding-bottom: 8px;
  margin-bottom: 10px;
}
.has-dashed-divider .section:last-child {
  border-bottom: none;
}

/* ==================== 技能圆环 ==================== */
.skill-rings-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.skill-ring-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.skill-ring {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: conic-gradient(var(--c) var(--p), rgba(0, 0, 0, 0.08) 0);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.skill-ring::before {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg);
}
.skill-ring-text {
  position: relative;
  font-size: 11px;
  font-weight: 700;
  color: var(--c);
}
.skill-ring-name {
  font-size: 10px;
  margin-top: 4px;
  text-align: center;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ==================== 进度条 ==================== */
.skill-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.skill-bar-head {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 3px;
}
.skill-bar-name {
  font-weight: 600;
}
.skill-bar-cat {
  color: var(--accent);
  font-size: 10px;
}
.skill-bar-track {
  height: 6px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 3px;
  overflow: hidden;
}
.skill-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: 3px;
  transition: width 0.3s;
}

/* ==================== 布局：左侧栏 ==================== */
.layout-sidebar-left {
  display: flex;
  min-height: 297mm;
}
.sidebar {
  width: 35%;
  flex: 0 0 35%;
  padding: 16px 14px;
  background: var(--primary);
  color: var(--light);
  position: relative;
  box-sizing: border-box;
  overflow-wrap: break-word;
}
.sidebar-brand {
  font-size: 11px;
  letter-spacing: 3px;
  font-weight: 700;
  opacity: 0.7;
  margin-bottom: 6px;
}
.sidebar-job {
  font-size: 12px;
  margin-bottom: 12px;
  opacity: 0.9;
}
.sidebar-photo {
  width: 100px;
  height: 120px;
  margin: 0 auto 12px;
  border: 3px solid rgba(255, 255, 255, 0.3);
}
.sidebar-name-wrap {
  text-align: center;
  margin-bottom: 14px;
}
.sidebar-name {
  font-size: 22px;
  font-weight: 700;
}
.sidebar-subtitle {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 3px;
}
.sidebar-section {
  margin-bottom: 12px;
}
.sidebar-section-title {
  font-size: 13px;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.25);
  padding-bottom: 5px;
  margin-bottom: 10px;
  color: var(--light);
  background: none;
  border-left: none;
  padding-left: 0;
  clip-path: none;
  text-shadow: none;
  display: block;
}
.has-slanted-header .sidebar-section-title {
  background: var(--secondary);
  color: #fff;
  padding: 4px 10px;
  clip-path: polygon(0 0, 90% 0, 100% 100%, 0 100%);
  border-bottom: none;
}
.has-code-style .sidebar-section-title::before {
  content: '//';
  margin-right: 4px;
  color: var(--accent);
}
.has-code-style .sidebar-section-title {
  background: none;
  clip-path: none;
}
.sidebar-list {
  font-size: 11.5px;
  line-height: 1.65;
}
.sidebar-row {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin-bottom: 3px;
}
.sidebar-label {
  opacity: 0.7;
  white-space: nowrap;
}
.sidebar-value {
  word-break: break-all;
}
.sidebar-icon {
  width: 16px;
  text-align: center;
}
.sidebar-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sidebar-tag {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}
.sidebar-cert {
  font-size: 12px;
  margin-bottom: 4px;
}
.sidebar-summary {
  font-size: 12px;
  line-height: 1.7;
  opacity: 0.9;
}

/* 侧栏内技能/证书/语言颜色覆盖（确保深色背景下可读） */
.sidebar .skill-cat-name {
  color: var(--light) !important;
  opacity: 0.95;
}
.sidebar .skill-tags {
  color: rgba(255, 255, 255, 0.8) !important;
}
.sidebar .cert-row,
.sidebar .lang-row {
  color: rgba(255, 255, 255, 0.8) !important;
}
.sidebar .sidebar-cert {
  color: rgba(255, 255, 255, 0.85);
}
.sidebar .sidebar-cert strong {
  color: var(--light);
}

.main-right {
  flex: 1;
  padding: 16px 20px;
  background: var(--bg);
}
.main-header {
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--primary);
}
.main-name {
  font-size: 26px;
  font-weight: 700;
  color: var(--primary);
}
.main-title-text {
  font-size: 13px;
  color: var(--secondary);
  margin-top: 3px;
}

/* ==================== 布局：右侧栏 ==================== */
.layout-sidebar-right {
  display: flex;
  min-height: 297mm;
}
.main-left {
  flex: 1;
  padding: 18px 20px;
  background: var(--bg);
}
.main-header-centered {
  text-align: center;
  margin-bottom: 14px;
}
.sidebar-right {
  width: 32%;
  padding: 18px 14px;
}
.right-photo {
  width: 85px;
  height: 105px;
  margin: 0 auto 14px;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

/* ==================== 布局：顶部横幅 ==================== */
.layout-banner-top {
  min-height: 297mm;
  background: var(--bg);
}
.banner-header {
  padding: 18px 24px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: var(--light);
  display: flex;
  align-items: center;
  gap: 20px;
}
.banner-photo {
  width: 85px;
  height: 105px;
  border: 3px solid rgba(255, 255, 255, 0.35);
}
.banner-info {
  flex: 1;
}
.banner-name {
  font-size: 24px;
  font-weight: 700;
}
.banner-title-text {
  font-size: 13px;
  opacity: 0.9;
  margin-top: 3px;
}
.banner-main {
  padding: 16px 22px;
}

/* ==================== 布局：居中横幅 ==================== */
.layout-banner-center {
  min-height: 297mm;
  background: var(--bg);
}
.center-header {
  padding: 4px 24px 6px;
  text-align: center;
  position: relative;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: var(--light);
}
.has-photo-bg .center-header {
  background: transparent;
  color: var(--light);
}
.center-photo {
  width: 58px;
  height: 58px;
  margin: 0 auto 3px;
  border: 3px solid rgba(255, 255, 255, 0.4);
}
.center-name {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}
.center-title-text {
  font-size: 12px;
  opacity: 0.9;
  margin-top: 1px;
}
.contact-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px 10px;
  margin-top: 4px;
  padding: 3px 10px;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  font-size: 10px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}
.strip-item {
  white-space: nowrap;
}
.center-main {
  padding: 8px 28px;
}

/* ==================== 布局：时间轴 ==================== */
.layout-timeline {
  min-height: 297mm;
  padding: 18px 24px;
  background: var(--bg);
}
.timeline-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 3px solid var(--primary);
  margin-bottom: 12px;
}
.timeline-photo {
  width: 80px;
  height: 100px;
  border: 3px solid var(--primary);
}
.timeline-head-info {
  flex: 1;
}
.timeline-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
}
.timeline-title-text {
  font-size: 12px;
  color: var(--secondary);
  margin-top: 2px;
}
.timeline-list {
  position: relative;
  padding-left: 20px;
  border-left: 2px solid var(--primary);
}
.timeline-item {
  margin-bottom: 10px;
  position: relative;
}
.timeline-dot {
  position: absolute;
  left: -29px;
  top: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid var(--bg);
  box-shadow: 0 0 0 2px var(--primary);
}
.timeline-dot.dot-edu { background: var(--secondary); box-shadow: 0 0 0 2px var(--secondary); }
.timeline-dot.dot-proj { background: var(--accent); box-shadow: 0 0 0 2px var(--accent); }
.timeline-main {
  padding: 0 4px;
}

/* ==================== 布局：简洁居中 ==================== */
.layout-clean-center {
  min-height: 297mm;
  padding: 14px 36px;
  background: var(--bg);
}
.clean-header {
  text-align: center;
  margin-bottom: 10px;
}
.clean-photo {
  width: 80px;
  height: 100px;
  margin: 0 auto 6px;
  border: 2px solid var(--primary);
  border-radius: 4px;
  overflow: hidden;
}
.has-circle-photo .clean-photo {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}
.clean-name {
  font-size: 24px;
  font-weight: 700;
}
.clean-title-text {
  font-size: 12px;
  color: var(--secondary);
  margin-top: 3px;
}
.clean-meta {
  font-size: 10px;
  color: #888;
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 12px;
}
.clean-divider {
  border: none;
  border-top: 2px solid var(--primary);
  margin-top: 8px;
}
.clean-main {
  padding: 0 8px;
}

/* ==================== 布局：双栏分栏 ==================== */
.layout-two-column {
  min-height: 297mm;
  padding: 18px 22px;
  background: var(--bg);
}
.two-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 10px;
  border-bottom: 3px solid var(--primary);
  margin-bottom: 10px;
}
.two-col-brand {
  position: relative;
}
.brand-name {
  font-size: 28px;
  font-weight: 900;
  color: var(--primary);
  line-height: 1;
}
.brand-sub {
  font-size: 11px;
  color: var(--secondary);
  margin-top: 4px;
}
.two-col-photo {
  width: 80px;
  height: 100px;
  border: 3px solid var(--accent);
}
.layout-two-column .contact-strip {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: var(--text);
  margin: 0 0 12px;
}
.two-col-main {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.two-col-main .col {
  flex: 1;
  min-width: 0;
}

/* ==================== 布局：卡片模块 ==================== */
.layout-card-style {
  min-height: 297mm;
  padding: 10px 14px;
  background: var(--bg);
}
.card-header {
  padding: 8px 12px;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: var(--light);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.card-photo {
  width: 58px;
  height: 72px;
  border: 2px solid rgba(255, 255, 255, 0.3);
}
.card-head-info {
  flex: 1;
  min-width: 0;
}
.card-name {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
}
.card-title-text {
  font-size: 11px;
  opacity: 0.9;
  margin-top: 1px;
}
.card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.card-grid.four-grid {
  grid-template-columns: repeat(4, 1fr);
}
.card-grid .full {
  grid-column: 1 / -1;
}
.card-section {
  background: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

/* ==================== 布局：优雅极简 ==================== */
.layout-elegant-minimal {
  min-height: 297mm;
  padding: 14px 36px;
  background: var(--bg);
}
.elegant-header {
  margin-bottom: 10px;
  text-align: center;
}
.elegant-photo {
  width: 70px;
  height: 85px;
  margin: 0 auto 6px;
  border: 2px solid var(--primary);
  border-radius: 4px;
  overflow: hidden;
}
.has-circle-photo .elegant-photo {
  width: 70px;
  height: 70px;
  border-radius: 50%;
}
.elegant-name {
  font-size: 26px;
  font-weight: 300;
  letter-spacing: 3px;
}
.elegant-title-text {
  font-size: 11px;
  color: var(--secondary);
  margin-top: 3px;
  letter-spacing: 1px;
}
.elegant-meta {
  font-size: 10px;
  color: #999;
  margin-top: 5px;
  line-height: 1.6;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 3px 12px;
}
.elegant-main {
  padding: 0 8px;
}
.elegant-row {
  margin-bottom: 8px;
}
.elegant-row-title {
  font-size: 14px;
  font-weight: 500;
}
.elegant-row-sub {
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
  margin-top: 2px;
}
.layout-elegant-minimal .section-title {
  border-left: none;
  border-bottom: 1px solid var(--primary);
  padding-left: 0;
  padding-bottom: 6px;
  letter-spacing: 2px;
}

/* ==================== 布局：现代分割 ==================== */
.layout-modern-split {
  min-height: 297mm;
  background: var(--bg);
}
.split-header {
  padding: 16px 24px;
  background: var(--primary);
  color: var(--light);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.split-head-info {
  flex: 1;
}
.split-name {
  font-size: 24px;
  font-weight: 700;
}
.split-title-text {
  font-size: 13px;
  opacity: 0.9;
  margin-top: 3px;
}
.split-photo {
  width: 80px;
  height: 100px;
  border: 3px solid rgba(255, 255, 255, 0.3);
}
.split-body {
  display: flex;
  min-height: calc(297mm - 90px);
}
.split-left {
  width: 40%;
  padding: 16px 18px;
  border-right: 2px solid var(--accent);
  background: rgba(0, 0, 0, 0.02);
}
.split-right {
  flex: 1;
  padding: 16px 18px;
}

/* ==================== 布局：深色主题 ==================== */
.layout-dark-theme {
  min-height: 297mm;
  background: var(--bg);
  color: var(--text);
  padding: 16px 20px;
}
.dark-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 12px;
}
.dark-photo {
  width: 80px;
  height: 100px;
  border: 3px solid var(--accent);
}
.dark-head-info {
  flex: 1;
}
.dark-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
}
.dark-title-text {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 3px;
}
.dark-meta {
  font-size: 10.5px;
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  opacity: 0.75;
}
.dark-main {
  padding: 0 4px;
}
.layout-dark-theme .section-title {
  color: var(--accent);
  border-left-color: var(--accent);
}
.layout-dark-theme .section-body,
.layout-dark-theme .entry-desc {
  color: var(--text);
  opacity: 0.85;
}
.layout-dark-theme .entry-position {
  color: var(--text);
}
.layout-dark-theme .entry-sub,
.layout-dark-theme .entry-date {
  color: var(--text);
  opacity: 0.6;
}
.layout-dark-theme .skill-cat-name {
  color: var(--accent);
}
.layout-dark-theme .skill-tags {
  color: var(--text);
  opacity: 0.85;
}
.layout-dark-theme .skill-bar-track {
  background: rgba(255, 255, 255, 0.08);
}
.layout-dark-theme .card-section {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* ==================== 布局：数据图表 ==================== */
.layout-dashboard {
  min-height: 297mm;
  padding: 16px 20px;
  background: var(--bg);
}
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 3px solid var(--primary);
  margin-bottom: 12px;
}
.dashboard-head-info {
  flex: 1;
}
.dashboard-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--primary);
}
.dashboard-title-text {
  font-size: 12px;
  color: var(--secondary);
  margin-top: 3px;
}
.dashboard-meta {
  font-size: 10.5px;
  color: #666;
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}
.dashboard-photo {
  width: 80px;
  height: 100px;
  border: 3px solid var(--accent);
}
.dashboard-main {
  padding: 0 4px;
}
.dashboard-charts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 12px;
}
.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.04);
}
.chart-body {
  display: flex;
  gap: 12px;
  align-items: center;
}
.pie-chart {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  position: relative;
  flex-shrink: 0;
}
.pie-chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.pie-chart-total {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
}
.pie-chart-label {
  font-size: 9px;
  color: #888;
}
.pie-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.legend-color {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  flex-shrink: 0;
}
.legend-name {
  flex: 1;
}
.legend-value {
  font-weight: 700;
  color: var(--primary);
}
.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 6px;
  height: 120px;
  padding: 8px 4px 0;
}
.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  min-width: 0;
}
.bar-track {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px 4px 0 0;
  overflow: hidden;
}
.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, var(--accent), var(--primary));
  border-radius: 4px 4px 0 0;
  transition: height 0.3s;
}
.bar-label {
  font-size: 9px;
  color: #666;
  margin-top: 4px;
  text-align: center;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.line-chart {
  height: 120px;
  position: relative;
}
.line-chart svg {
  width: 100%;
  height: 100px;
  display: block;
}
.line-chart-x {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #666;
  margin-top: 4px;
}
.skill-tags-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.dashboard-skill-tag {
  font-size: 11px;
  padding: 3px 10px;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid var(--primary);
  color: var(--primary);
  border-radius: 12px;
}

/* ==================== 通用内容样式 ==================== */
.section {
  margin-bottom: 12px;
}
.section-body {
  font-size: 12px;
  line-height: 1.6;
  color: #555;
}
.section-body.center { text-align: center; }
.section-body.justify { text-align: justify; }
.section-body.elegant {
  font-size: 13px;
  font-weight: 300;
  color: #666;
}
.summary-box {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.03);
  border-left: 4px solid var(--primary);
  border-radius: 4px;
}

.entry-row,
.edu-row,
.proj-row,
.exp-row {
  margin-bottom: 8px;
}
.entry-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 10px;
}
.entry-position {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}
.entry-sub {
  font-size: 11.5px;
  color: #666;
  margin-top: 2px;
}
.entry-date {
  font-size: 10.5px;
  color: #999;
  white-space: nowrap;
}
.entry-desc {
  font-size: 11.5px;
  line-height: 1.55;
  color: #555;
  margin-top: 3px;
  white-space: pre-line;
}

.entry-link {
  color: var(--accent);
  text-decoration: none;
  font-size: 12px;
  word-break: break-all;
}

.entry-link:hover {
  text-decoration: underline;
}

.skill-block {
  margin-bottom: 6px;
  word-break: break-word;
  overflow-wrap: break-word;
}
.skill-cat-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 1px;
}
.skill-tags {
  font-size: 11px;
  line-height: 1.55;
  color: #555;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}

.cert-row,
.lang-row {
  font-size: 12px;
  margin-bottom: 4px;
  color: #555;
}

.info-list {
  font-size: 12px;
  line-height: 2;
  color: #555;
}

.contact-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 6px;
  font-size: 10.5px;
}
.contact-item {
  white-space: nowrap;
}
.info-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 10px;
  margin-top: 4px;
  font-size: 10px;
  color: rgba(255,255,255,0.9);
}
.info-strip-item {
  white-space: nowrap;
}

.two-col {
  display: flex;
  gap: 24px;
}
.two-col .col {
  flex: 1;
  min-width: 0;
}

.basic-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-top: 8px;
  font-size: 11px;
  opacity: 0.9;
}
.basic-item {
  white-space: nowrap;
}

/* ==================== 城市剪影 ==================== */
.city-silhouette {
  position: relative;
  width: 100%;
  height: 60px;
  margin-top: 20px;
  color: var(--primary);
  opacity: 0.85;
  z-index: 1;
  pointer-events: none;
}
.city-silhouette svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
  display: block;
}

/* ==================== 空状态 ==================== */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 297mm;
  color: #999;
  font-size: 14px;
  position: absolute;
  inset: 0;
  z-index: 10;
  background: var(--bg);
}

/* ==================== 主题微调 ==================== */
/* 深色背景主题 */
.layout-dark-theme .photo-placeholder {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.4);
}
.layout-dark-theme.has-grid-bg .bg-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px);
  opacity: 0.3;
}
.layout-dark-theme.has-geometric-bg .bg-geometric {
  opacity: 0.4;
}

/* banner-center + photo-bg 时 header 文字色 */
.has-photo-bg .center-header {
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

/* sidebar 内的圆环颜色覆盖 */
.sidebar .skill-rings-grid {
  grid-template-columns: repeat(2, 1fr);
}
.sidebar .skill-ring::before {
  background: var(--primary);
}
.sidebar .skill-ring-text {
  color: var(--light);
}

/* 暗色主题下饼图中心色 */
.layout-dashboard .pie-chart-center,
.layout-dashboard .chart-card {
  background: var(--bg);
}

/* ================================================================ */
/* ============ 缺失的 Feature CSS（通用视觉特征） ============ */
/* ================================================================ */

/* 圆形照片 */
.has-circle-photo .photo-wrap,
.has-circle-photo .photo-img {
  border-radius: 50%;
}
.has-circle-photo .sidebar-photo {
  width: 100px;
  height: 100px;
  border: 3px solid var(--accent);
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
}

/* 方形照片 */
.has-square-photo .photo-wrap {
  border-radius: 4px;
}
.has-square-photo .sidebar-photo {
  width: 90px;
  height: 110px;
  border: 2px solid var(--accent);
}

/* 进度条 */
.has-progress-bar .skill-bar-item {
  margin-bottom: 8px;
}
.has-progress-bar .skill-bar-track {
  height: 6px;
  background: rgba(0,0,0,0.08);
  border-radius: 3px;
  overflow: hidden;
}
.layout-dark-theme.has-progress-bar .skill-bar-track {
  background: rgba(255,255,255,0.1);
}
.has-progress-bar .skill-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
}

/* 侧边飘带装饰 */
.has-side-ribbon .sidebar::before {
  content: '';
  position: absolute;
  top: 20px;
  right: -8px;
  width: 0;
  height: 0;
  border-top: 12px solid transparent;
  border-bottom: 12px solid transparent;
  border-left: 12px solid var(--primary);
  z-index: 5;
}

/* 四宫格 */
.has-four-grid .card-grid {
  display: grid !important;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

/* 底部联系条 */
.has-bottom-bar .resume-paper > .content-layer {
  padding-bottom: 50px;
}
.has-bottom-bar .bottom-contact-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--primary);
  color: var(--light);
  padding: 8px 24px;
  display: flex;
  gap: 20px;
  justify-content: center;
  font-size: 11px;
  z-index: 2;
}

/* 圆角卡片容器 */
.has-rounded-card .center-header,
.has-rounded-card .banner-header {
  border-radius: 16px;
  overflow: hidden;
}

/* 虚线外框 */
.has-dashed-border {
  border: 2px dashed var(--accent);
  margin: 8px;
}

/* 渐变背景 */
.has-gradient-bg {
  background: linear-gradient(135deg, var(--primary), var(--secondary)) !important;
}

/* 三卡片布局 */
.has-three-cards .card-grid {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* 框架标题 */
.has-frame-title .center-name,
.has-frame-title .main-name {
  border: 2px solid var(--primary);
  padding: 8px 20px;
  display: inline-block;
}

/* 中英双语标题 */
.has-en-cn-title .center-name::after,
.has-en-cn-title .main-name::after {
  content: 'RESUME';
  display: block;
  font-size: 11px;
  letter-spacing: 6px;
  color: var(--accent);
  font-weight: 400;
  margin-top: 2px;
}

/* 深色侧栏 */
.has-sidebar-dark .sidebar {
  background: var(--primary);
  color: var(--light);
}
.has-sidebar-dark .sidebar-section-title {
  color: var(--accent);
}

/* 浅色侧栏 */
.has-sidebar-light .sidebar {
  background: var(--primary);
  opacity: 0.95;
}

/* 竖线分割 */
.has-vertical-divider .section {
  border-left: 2px solid var(--accent);
  padding-left: 16px;
  margin-bottom: 16px;
}

/* ================================================================ */
/* ============ 50 套主题专属 CSS ============ */
/* ================================================================ */

/* ---- t01 深灰斜切商务侧栏 ---- */
.theme-gray-slanted-business .layout-sidebar-left {
  min-height: 297mm;
}
.theme-gray-slanted-business .sidebar {
  background: linear-gradient(180deg, #323741 0%, #232830 100%);
  position: relative;
  width: 32%;
  flex: 0 0 32%;
  padding: 18px 14px;
}
.theme-gray-slanted-business .sidebar::after {
  content: '';
  position: absolute;
  top: 0; right: 0; bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, var(--accent), transparent);
}
.theme-gray-slanted-business .main-right {
  flex: 1;
  padding: 16px 22px 16px;
  border-top: none;
  background: #ffffff;
}
.theme-gray-slanted-business .sidebar-brand {
  color: var(--accent);
  font-size: 9px;
  letter-spacing: 3px;
  border-bottom: 1px solid rgba(255,255,255,0.12);
  padding-bottom: 6px;
  margin-bottom: 10px;
  text-align: center;
}
.theme-gray-slanted-business .sidebar-photo {
  width: 100px;
  height: 124px;
  margin: 0 auto 12px;
  border: 2px solid rgba(35,127,201,0.5);
  border-radius: 2px;
}
.theme-gray-slanted-business .sidebar-name-wrap {
  text-align: center;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.theme-gray-slanted-business .sidebar-name {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
}
.theme-gray-slanted-business .sidebar-subtitle {
  font-size: 12px;
  color: var(--accent);
  margin-top: 3px;
  font-weight: 500;
  opacity: 1;
}
.theme-gray-slanted-business .sidebar-section {
  margin-bottom: 14px;
}
.theme-gray-slanted-business .sidebar-section-title {
  color: #ffffff;
  background: rgba(35, 127, 201, 0.85);
  padding: 3px 14px;
  font-size: 12px;
  font-weight: 700;
  clip-path: polygon(0 0, 92% 0, 100% 100%, 0 100%);
  display: inline-block;
  margin-bottom: 8px;
  border-bottom: none;
  letter-spacing: 1px;
}
.theme-gray-slanted-business .sidebar-list {
  font-size: 11.5px;
  line-height: 1.8;
}
.theme-gray-slanted-business .sidebar-row {
  margin-bottom: 2px;
}
.theme-gray-slanted-business .skill-block {
  margin-bottom: 6px;
}
.theme-gray-slanted-business .skill-cat-name {
  font-size: 11.5px;
  color: rgba(255,255,255,0.95) !important;
  font-weight: 600;
  margin-bottom: 2px;
}
.theme-gray-slanted-business .skill-tags {
  font-size: 11px;
  color: rgba(255,255,255,0.75) !important;
  line-height: 1.6;
}
.theme-gray-slanted-business .sidebar-cert {
  font-size: 11.5px;
  color: rgba(255,255,255,0.8);
  margin-bottom: 2px;
}
.theme-gray-slanted-business .section {
  margin-bottom: 12px;
}
.theme-gray-slanted-business.has-slanted-header .section-title {
  color: #ffffff;
  background: linear-gradient(110deg, var(--accent) 82%, transparent 82%);
  font-size: 13px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  letter-spacing: 1px;
}
.theme-gray-slanted-business.has-slanted-header .section-title .section-icon {
  color: #ffffff;
}
.theme-gray-slanted-business .entry-row {
  margin-bottom: 8px;
}
.theme-gray-slanted-business .entry-position {
  font-size: 13px;
  font-weight: 600;
  color: #232741;
}
.theme-gray-slanted-business .entry-date {
  font-size: 11.5px;
  color: #888;
}
.theme-gray-slanted-business .entry-sub {
  font-size: 12px;
  color: #555;
  margin-top: 2px;
}
.theme-gray-slanted-business .entry-desc {
  font-size: 12px;
  color: #444;
  line-height: 1.65;
  margin-top: 4px;
}
.theme-gray-slanted-business .entry-link {
  color: var(--accent);
  text-decoration: none;
  font-size: 11.5px;
  word-break: break-all;
}
.theme-gray-slanted-business .entry-link:hover {
  text-decoration: underline;
}
.theme-gray-slanted-business .section-body {
  font-size: 12px;
  color: #444;
  line-height: 1.7;
}

/* ---- t02 旷野风景通栏文艺 ---- */
.theme-desert-wilderness .bg-photo {
  background:
    linear-gradient(180deg, rgba(193,154,107,0.9) 0%, rgba(139,115,85,0.5) 15%, transparent 25%);
  opacity: 1;
  bottom: auto;
  height: 25%;
}
.theme-desert-wilderness .center-header {
  background: #ffffff;
  border-radius: 0 0 20px 20px;
  padding: 30px 40px 20px;
  margin: 0 auto;
  max-width: 92%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  position: relative;
  z-index: 2;
}
.theme-desert-wilderness .center-name {
  color: #2c3e50;
}
.theme-desert-wilderness .center-title-text {
  color: #5a4a3a;
}
.theme-desert-wilderness .contact-strip {
  color: #4a4a4a;
  background: rgba(193,154,107,0.1);
  border-color: rgba(193,154,107,0.3);
}
.theme-desert-wilderness .section-title {
  color: #5a3a1a;
  border-bottom: 2px dashed var(--accent);
  padding-bottom: 4px;
}
.theme-desert-wilderness .entry-position,
.theme-desert-wilderness .entry-sub {
  color: #2c3e50;
}
.theme-desert-wilderness .entry-desc {
  color: #4a4a4a;
}
.theme-desert-wilderness .entry-date {
  color: #8a7a6a;
}
.theme-desert-wilderness .skill-cat-name {
  color: #5a3a1a;
}
.theme-desert-wilderness .skill-tags {
  color: #4a4a4a;
}
.theme-desert-wilderness .cert-row,
.theme-desert-wilderness .lang-row {
  color: #4a4a4a;
}
.theme-desert-wilderness .section-body {
  color: #4a4a4a;
}

/* ---- t05 彩色时间轴技术岗 ---- */
.theme-macaron-timeline-tech .timeline-axis {
  border-left: 3px solid var(--accent);
}
.theme-macaron-timeline-tech .timeline-node {
  background: var(--accent);
  border: 3px solid var(--bg);
  box-shadow: 0 0 0 2px var(--accent);
}
.theme-macaron-timeline-tech .timeline-item:nth-child(3n+1) .timeline-card {
  background: rgba(93,173,226,0.12);
  border-left: 3px solid #5dade2;
}
.theme-macaron-timeline-tech .timeline-item:nth-child(3n+2) .timeline-card {
  background: rgba(88,214,141,0.12);
  border-left: 3px solid #58d68d;
}
.theme-macaron-timeline-tech .timeline-item:nth-child(3n+3) .timeline-card {
  background: rgba(245,183,177,0.12);
  border-left: 3px solid #f5b7b1;
}
.theme-macaron-timeline-tech .sidebar-mini {
  background: var(--primary);
  color: var(--light);
  padding: 20px 16px;
  border-radius: 0 16px 16px 0;
}

/* ---- t06 暗夜代码项目管理 ---- */
.theme-dark-code-pm .bg-layer {
  background:
    repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(241,196,15,0.02) 2px, rgba(241,196,15,0.02) 4px);
}
.theme-dark-code-pm .section-title {
  border-bottom: 1px solid var(--accent);
  padding-bottom: 4px;
}
.theme-dark-code-pm .entry-row {
  border-left: 2px solid rgba(241,196,15,0.3);
  padding-left: 12px;
}
.theme-dark-code-pm .main-name {
  color: var(--accent);
  font-family: 'Consolas', monospace;
}

/* ---- t10 森林摄影轻奢文艺 ---- */
.theme-forest-photo-luxury .bg-photo {
  background:
    linear-gradient(180deg, rgba(44,62,45,0.92) 0%, rgba(74,93,75,0.5) 15%, transparent 25%);
  opacity: 1;
  bottom: auto;
  height: 25%;
}
.theme-forest-photo-luxury .center-header {
  background: #ffffff;
  border: 1px solid rgba(139,115,85,0.3);
  border-radius: 4px;
  padding: 24px 32px;
  max-width: 90%;
  margin: 0 auto 16px;
  position: relative;
  z-index: 2;
}
.theme-forest-photo-luxury .center-name {
  color: #2c3e50;
}
.theme-forest-photo-luxury .center-title-text {
  color: #5a5a5a;
}
.theme-forest-photo-luxury .contact-strip {
  color: #4a4a4a;
  background: rgba(139,115,85,0.1);
  border-color: rgba(139,115,85,0.3);
}
.theme-forest-photo-luxury .section-title {
  color: #2c3e2d;
}
.theme-forest-photo-luxury .entry-position,
.theme-forest-photo-luxury .entry-sub {
  color: #2c3e50;
}
.theme-forest-photo-luxury .entry-desc {
  color: #4a4a4a;
}
.theme-forest-photo-luxury .entry-date {
  color: #8a8a8a;
}
.theme-forest-photo-luxury .skill-cat-name {
  color: #2c3e2d;
}
.theme-forest-photo-luxury .skill-tags {
  color: #4a4a4a;
}
.theme-forest-photo-luxury .cert-row,
.theme-forest-photo-luxury .lang-row {
  color: #4a4a4a;
}
.theme-forest-photo-luxury .section-body {
  color: #4a4a4a;
}
.theme-forest-photo-luxury .center-name {
  font-family: 'Georgia', serif;
  letter-spacing: 2px;
}
.theme-forest-photo-luxury .center-name::before {
  content: '— ';
  color: var(--accent);
}
.theme-forest-photo-luxury .center-name::after {
  content: ' —';
  color: var(--accent);
}

/* ---- t11 深灰橙斜新媒体创意 ---- */
.theme-gray-orange-creative .sidebar {
  background: linear-gradient(180deg, #363638, #2a2a2c);
  position: relative;
}
.theme-gray-orange-creative .sidebar-section-title {
  background: var(--accent);
  color: #fff;
  padding: 4px 14px;
  clip-path: polygon(0 0, 100% 0, 90% 100%, 0 100%);
  display: inline-block;
  font-size: 13px;
}
.theme-gray-orange-creative .sidebar-tag {
  border: 1px solid var(--accent);
  color: var(--accent);
  padding: 2px 10px;
  border-radius: 0 8px 0 8px;
  display: inline-block;
  margin: 2px;
  font-size: 11px;
}
.theme-gray-orange-creative .main-right {
  border-left: 3px solid var(--accent);
}

/* ---- t12 蓝圆点传媒清爽 ---- */
.theme-blue-dot-media .section-title {
  color: var(--primary);
  border-bottom: 2px solid var(--primary);
  padding-bottom: 4px;
}
.theme-blue-dot-media .section-title::before {
  content: '○';
  color: var(--accent);
  margin-right: 6px;
  font-size: 16px;
}
.theme-blue-dot-media .entry-desc::before {
  content: '✓ ';
  color: var(--primary);
}
.theme-blue-dot-media .center-header {
  border-bottom: 3px double var(--primary);
  padding-bottom: 14px;
}

/* ---- t14 薄荷绿文艺文案 ---- */
.theme-mint-green-literary .center-header {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: var(--light);
  padding: 20px 30px;
  border-radius: 0 0 24px 24px;
  text-align: center;
}
.theme-mint-green-literary .section-title {
  border-left: 4px solid var(--primary);
  padding-left: 10px;
  background: linear-gradient(90deg, rgba(165,216,134,0.15), transparent);
}
.theme-mint-green-literary .entry-desc::before {
  content: '●';
  color: var(--primary);
  margin-right: 6px;
  font-size: 8px;
  vertical-align: middle;
}

/* ---- t16 极简线条销售时间轴 ---- */
.theme-minimal-line-sales .timeline-axis {
  border-left: 2px solid var(--text);
}
.theme-minimal-line-sales .timeline-node {
  background: var(--text);
  border-radius: 0;
  width: 10px; height: 10px;
}
.theme-minimal-line-sales .section-title {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 13px;
  border-bottom: 1px solid var(--text);
}
.theme-minimal-line-sales .center-header {
  border-bottom: 1px solid var(--text);
  padding-bottom: 12px;
}

/* ---- t17 方格底电子工程师 ---- */
.theme-grid-bg-engineer .bg-grid {
  background-image:
    linear-gradient(rgba(74,74,74,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74,74,74,0.1) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.5;
}
.theme-grid-bg-engineer .section {
  background: rgba(255,255,255,0.8);
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 12px;
}
.theme-grid-bg-engineer .section-title {
  background: rgba(74,74,74,0.08);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
}
.theme-grid-bg-engineer .section-title::after {
  content: attr(data-en);
  display: inline;
  font-size: 10px;
  color: var(--accent);
  margin-left: 8px;
  text-transform: uppercase;
}

/* ---- t18 蓝虚线金融银行 ---- */
.theme-blue-dashed-finance .section {
  border-bottom: 2px dashed var(--primary);
  padding-bottom: 12px;
  margin-bottom: 14px;
}
.theme-blue-dashed-finance .section:last-child {
  border-bottom: none;
}
.theme-blue-dashed-finance .section-title {
  background: var(--primary);
  color: var(--light);
  padding: 3px 14px;
  border-radius: 20px;
  display: inline-block;
  font-size: 13px;
}
.theme-blue-dashed-finance .entry-desc::before {
  content: '◆';
  color: var(--primary);
  margin-right: 5px;
  font-size: 8px;
}

/* ---- t19 蓝标签金融精简版 ---- */
.theme-blue-label-finance-lite .section {
  border-bottom: 1px dashed var(--primary);
  padding-bottom: 10px;
  margin-bottom: 12px;
}
.theme-blue-label-finance-lite .section:last-child {
  border-bottom: none;
}
.theme-blue-label-finance-lite .section-title {
  background: var(--primary);
  color: var(--light);
  padding: 4px 16px;
  border-radius: 4px;
  display: inline-block;
}
.theme-blue-label-finance-lite .skill-tags-inline {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.theme-blue-label-finance-lite .skill-tags-inline span {
  background: rgba(58,123,213,0.1);
  border: 1px solid var(--primary);
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
}

/* ---- t20 浅蓝竹子国风双栏 ---- */
.theme-bamboo-ink-master .sidebar {
  background: var(--primary);
  position: relative;
}
.theme-bamboo-ink-master .sidebar::before {
  content: '';
  position: absolute;
  top: 10%; left: 20px;
  width: 2px; height: 60%;
  background: linear-gradient(180deg, transparent, rgba(255,255,255,0.2), transparent);
}
.theme-bamboo-ink-master .sidebar-section-title {
  color: var(--light);
  font-family: 'KaiTi', 'STKaiti', serif;
  border-bottom-color: rgba(255,255,255,0.25);
}
.theme-bamboo-ink-master .sidebar-tag {
  color: var(--light);
  border-bottom: 1px solid rgba(255,255,255,0.3);
}
.theme-bamboo-ink-master .sidebar-list,
.theme-bamboo-ink-master .sidebar-row,
.theme-bamibo-ink-master .sidebar-value,
.theme-bamboo-ink-master .sidebar-value,
.theme-bamboo-ink-master .sidebar-cert,
.theme-bamboo-ink-master .sidebar-summary {
  color: rgba(255,255,255,0.85);
}
.theme-bamboo-ink-master .sidebar-label {
  color: rgba(255,255,255,0.6);
}
.theme-bamboo-ink-master .entry-desc::before {
  content: '›';
  color: var(--light);
  margin-right: 4px;
}
.theme-bamboo-ink-master .main-right .section-title {
  color: var(--primary);
  border-left-color: var(--primary);
}
.theme-bamboo-ink-master .main-right {
  border-left: 2px solid var(--accent);
}

/* ---- t21 深色暗纹法务律师 ---- */
.theme-dark-lawyer-vertical {
  background: var(--primary) !important;
}
.theme-dark-lawyer-vertical .bg-layer {
  background:
    repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(120,208,208,0.03) 30px, rgba(120,208,208,0.03) 60px);
}
.theme-dark-lawyer-vertical .section-title {
  color: var(--accent);
  border-left: 3px solid var(--accent);
  padding-left: 10px;
}
.theme-dark-lawyer-vertical .main-content {
  border-left: 1px solid rgba(255,255,255,0.1);
  padding-left: 20px;
}

/* ---- t22 深色框PHP后端时间轴 ---- */
.theme-dark-php-timeline {
  border: 2px dashed var(--accent);
  margin: 6px;
}
.theme-dark-php-timeline .timeline-axis {
  border-left: 2px solid var(--accent);
}
.theme-dark-php-timeline .timeline-node {
  background: var(--accent);
  border-radius: 50%;
  width: 10px; height: 10px;
}
.theme-dark-php-timeline .skill-bar-fill {
  background: linear-gradient(90deg, var(--accent), rgba(224,53,53,0.5));
}

/* ---- t23 薄荷绿几何博士 ---- */
.theme-mint-geo-phd .center-header {
  position: relative;
}
.theme-mint-geo-phd .center-header::before {
  content: '';
  position: absolute;
  top: -10px; left: -10px;
  width: 40px; height: 40px;
  border-top: 3px solid var(--primary);
  border-left: 3px solid var(--primary);
}
.theme-mint-geo-phd .center-header::after {
  content: '';
  position: absolute;
  bottom: -10px; right: -10px;
  width: 40px; height: 40px;
  border-bottom: 3px solid var(--primary);
  border-right: 3px solid var(--primary);
}
.theme-mint-geo-phd .section {
  border-left: 1px solid var(--primary);
  padding-left: 16px;
}
.theme-mint-geo-phd .section-title {
  color: var(--primary);
  font-weight: 300;
  letter-spacing: 1px;
}

/* ---- t25 藏蓝欧式设计双栏 ---- */
.theme-navy-euro-design .sidebar {
  background: var(--primary);
  position: relative;
}
.theme-navy-euro-design .sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 50% 10%, rgba(255,255,255,0.08), transparent 30%),
    repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.03) 40px, rgba(255,255,255,0.03) 41px);
}
.theme-navy-euro-design .skill-bar-fill {
  background: linear-gradient(90deg, var(--accent), #74b9ff);
}
.theme-navy-euro-design .sidebar-section-title {
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

/* ---- t26 深色对称运营管理 ---- */
.theme-dark-symmetric-ops {
  background: var(--primary) !important;
}
.theme-dark-symmetric-ops .center-header {
  text-align: center;
  border-bottom: 2px solid var(--accent);
  padding-bottom: 16px;
}
.theme-dark-symmetric-ops .center-name {
  color: var(--accent);
  font-size: 28px;
}
.theme-dark-symmetric-ops .two-col-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.theme-dark-symmetric-ops .section-title {
  color: var(--accent);
  border-bottom: 1px solid rgba(232,194,88,0.3);
}

/* ---- t28 深灰鎏金竖排商务 ---- */
.theme-dark-gold-vertical-biz {
  background: var(--primary) !important;
}
.theme-dark-gold-vertical-biz .center-header {
  text-align: center;
  padding: 24px 0;
  border-bottom: 2px solid var(--accent);
}
.theme-dark-gold-vertical-biz .center-name {
  color: var(--accent);
  font-family: 'Georgia', serif;
  letter-spacing: 4px;
}
.theme-dark-gold-vertical-biz .section-title {
  color: var(--accent);
  border-bottom: 1px solid rgba(212,184,102,0.3);
}
.theme-dark-gold-vertical-biz .two-col-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 0 24px;
}

/* ---- t31 科技流光蓝绿侧栏 ---- */
.theme-tech-flow-cyan .sidebar {
  background: linear-gradient(180deg, #0a1929, #0d1117);
  position: relative;
  overflow: hidden;
}
.theme-tech-flow-cyan .sidebar::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: conic-gradient(from 0deg, transparent, rgba(0,210,211,0.1), transparent, rgba(88,166,255,0.1), transparent);
  animation: rotate 20s linear infinite;
}
.theme-tech-flow-cyan .sidebar-section-title {
  color: var(--accent);
  text-shadow: 0 0 8px rgba(0,210,211,0.5);
}
.theme-tech-flow-cyan .skill-bar-fill {
  background: linear-gradient(90deg, var(--accent), #58a6ff);
  box-shadow: 0 0 6px rgba(0,210,211,0.4);
}
/* t31: 深色主内容区的标题和文字颜色修复 */
.theme-tech-flow-cyan .main-right .section-title {
  color: var(--accent);
  border-left-color: var(--accent);
}
.theme-tech-flow-cyan .main-right .entry-position {
  color: var(--text);
}
.theme-tech-flow-cyan .main-right .entry-desc {
  color: rgba(201,209,217,0.7);
}
.theme-tech-flow-cyan .main-right .entry-date {
  color: rgba(201,209,217,0.5);
}
.theme-tech-flow-cyan .main-right .entry-sub {
  color: rgba(201,209,217,0.6);
}
.theme-tech-flow-cyan .main-right .skill-cat-name {
  color: var(--accent);
}
.theme-tech-flow-cyan .main-right .skill-tags {
  color: rgba(201,209,217,0.8);
}
.theme-tech-flow-cyan .main-right .cert-row,
.theme-tech-flow-cyan .main-right .lang-row {
  color: rgba(201,209,217,0.7);
}
.theme-tech-flow-cyan .main-right .section-body {
  color: rgba(201,209,217,0.8);
}
.theme-tech-flow-cyan .main-right .info-list {
  color: rgba(201,209,217,0.8);
}
.theme-tech-flow-cyan .main-right .main-name {
  color: var(--accent);
}
.theme-tech-flow-cyan .main-right .main-title-text {
  color: var(--lightText);
}
@keyframes rotate { to { transform: rotate(360deg); } }

/* ---- t32 杂志期刊艺术黑白 ---- */
.theme-magazine-bw-art .center-header {
  border-top: 4px solid var(--text);
  border-bottom: 1px solid var(--text);
  padding: 16px 0;
  text-align: left;
}
.theme-magazine-bw-art .center-name {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -1px;
}
.theme-magazine-bw-art .center-name::after {
  content: 'No. 001';
  float: right;
  font-size: 11px;
  color: var(--accent);
  font-weight: 400;
  letter-spacing: 2px;
  margin-top: 16px;
}
.theme-magazine-bw-art .section-title {
  font-family: 'Georgia', serif;
  font-size: 18px;
  text-transform: uppercase;
  letter-spacing: 3px;
  border-top: 1px solid var(--text);
  padding-top: 8px;
}
.theme-magazine-bw-art .entry-desc {
  column-count: 2;
  column-gap: 20px;
}

/* ---- t33 手账胶带贴纸可爱 ---- */
.theme-journal-tape-cute .bg-layer {
  background:
    repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(255,105,180,0.06) 28px, rgba(255,105,180,0.06) 29px);
}
.theme-journal-tape-cute .center-header {
  position: relative;
  background: rgba(255,250,253,0.9);
  padding: 16px 20px;
  border-radius: 4px;
}
.theme-journal-tape-cute .center-header::before {
  content: '';
  position: absolute;
  top: -8px; left: 50%;
  transform: translateX(-50%) rotate(-2deg);
  width: 100px; height: 20px;
  background: rgba(255,105,180,0.4);
  border-radius: 2px;
}
.theme-journal-tape-cute .section-title {
  font-family: 'Comic Sans MS', 'YouYuan', cursive;
  color: var(--primary);
}
.theme-journal-tape-cute .timeline-node {
  background: var(--accent);
  border: 2px dashed var(--primary);
}

/* ---- t34 日式无印良品极简 ---- */
.theme-muji-japanese-minimal .center-header {
  text-align: center;
  padding: 40px 20px 20px;
}
.theme-muji-japanese-minimal .center-name {
  font-weight: 300;
  letter-spacing: 4px;
  color: var(--primary);
}
.theme-muji-japanese-minimal .section-title {
  font-weight: 300;
  font-size: 12px;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: var(--secondary);
  border-bottom: 1px solid var(--secondary);
}
.theme-muji-japanese-minimal .section {
  margin-bottom: 24px;
}
.theme-muji-japanese-minimal .entry-desc {
  line-height: 1.8;
}

/* ---- t36 复古打字机信纸 ---- */
.theme-typewriter-letter-retro .bg-layer {
  background: rgba(245,240,224,1);
}
.theme-typewriter-letter-retro .center-header {
  border-bottom: 2px solid var(--text);
  padding-bottom: 10px;
}
.theme-typewriter-letter-retro .center-name {
  font-family: 'Courier New', 'Consolas', monospace;
  font-size: 22px;
}
.theme-typewriter-letter-retro .section-title {
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  font-size: 12px;
}
.theme-typewriter-letter-retro .section-title::after {
  content: '_';
  color: var(--accent);
  animation: blink 1s infinite;
}
@keyframes blink { 50% { opacity: 0; } }
.theme-typewriter-letter-retro .entry-desc {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
}

/* ---- t37 蓝白地中海海洋 ---- */
.theme-mediterranean-ocean .bg-layer {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(46,134,193,0.15), transparent 50%);
}
.theme-mediterranean-ocean .center-header {
  position: relative;
  text-align: center;
  padding: 20px 0 16px;
}
.theme-mediterranean-ocean .center-header::after {
  content: '';
  display: block;
  margin: 10px auto 0;
  width: 80%;
  height: 12px;
  background:
    radial-gradient(circle at 10% 50%, transparent 8px, var(--primary) 8px, var(--primary) 10px, transparent 10px),
    radial-gradient(circle at 30% 50%, transparent 8px, var(--primary) 8px, var(--primary) 10px, transparent 10px),
    radial-gradient(circle at 50% 50%, transparent 8px, var(--primary) 8px, var(--primary) 10px, transparent 10px);
}
.theme-mediterranean-ocean .section-title {
  color: var(--primary);
  border-bottom: 1px solid var(--primary);
}
.theme-mediterranean-ocean .sidebar-photo {
  border: 4px solid var(--primary);
  border-radius: 50%;
  box-shadow: 0 0 0 4px var(--bg), 0 0 0 6px var(--accent);
}

/* ---- t38 波普艺术撞色 ---- */
.theme-pop-art-clash .bg-layer {
  background:
    radial-gradient(circle at 20% 20%, rgba(255,0,110,0.1) 20%, transparent 20%),
    radial-gradient(circle at 80% 60%, rgba(58,134,255,0.1) 15%, transparent 15%),
    radial-gradient(circle at 50% 80%, rgba(255,190,11,0.1) 12%, transparent 12%);
}
.theme-pop-art-clash .center-header {
  border: 3px solid var(--text);
  border-radius: 0;
  box-shadow: 6px 6px 0 var(--accent);
  padding: 16px 24px;
}
.theme-pop-art-clash .center-name {
  font-weight: 900;
  text-transform: uppercase;
}
.theme-pop-art-clash .section-title {
  background: var(--accent);
  color: var(--text);
  padding: 4px 12px;
  display: inline-block;
  transform: rotate(-1deg);
}
.theme-pop-art-clash .card-grid > div:nth-child(odd) {
  background: rgba(255,0,110,0.1);
  border: 2px solid var(--primary);
}
.theme-pop-art-clash .card-grid > div:nth-child(even) {
  background: rgba(58,134,255,0.1);
  border: 2px solid var(--secondary);
}
.theme-pop-art-clash .card-header {
  padding: 6px 12px;
  margin-bottom: 6px;
  gap: 10px;
}
.theme-pop-art-clash .card-photo {
  width: 55px;
  height: 68px;
}
.theme-pop-art-clash .info-strip {
  font-size: 9.5px;
  gap: 2px 8px;
  color: rgba(255,255,255,0.85);
}

/* ---- t39 北欧几何插画 ---- */
.theme-nordic-geo-illustration .right-sidebar {
  background: var(--primary);
  position: relative;
  overflow: hidden;
}
.theme-nordic-geo-illustration .right-sidebar::before {
  content: '';
  position: absolute;
  bottom: 0; right: 0;
  width: 120px; height: 120px;
  background: var(--accent);
  border-radius: 50% 50% 0 0;
  opacity: 0.3;
}
.theme-nordic-geo-illustration .right-sidebar::after {
  content: '';
  position: absolute;
  top: 20px; left: 20px;
  width: 0; height: 0;
  border-left: 30px solid transparent;
  border-right: 30px solid transparent;
  border-bottom: 50px solid var(--accent);
  opacity: 0.2;
}
.theme-nordic-geo-illustration .section-title {
  color: var(--primary);
  font-weight: 300;
  letter-spacing: 2px;
}

/* ---- t40 中国红国风喜庆 ---- */
.theme-chinese-red-festive .bg-layer {
  background: rgba(196,30,58,0.03);
}
.theme-chinese-red-festive .center-header {
  background: var(--primary);
  color: var(--accent);
  padding: 24px 30px;
  text-align: center;
  border: 2px solid var(--accent);
  position: relative;
}
.theme-chinese-red-festive .center-header::before {
  content: '印';
  position: absolute;
  top: 8px; right: 12px;
  width: 36px; height: 36px;
  background: var(--accent);
  color: var(--primary);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 900;
  font-family: 'KaiTi', serif;
}
.theme-chinese-red-festive .center-name {
  font-family: 'KaiTi', 'STKaiti', serif;
  color: var(--accent);
}
.theme-chinese-red-festive .section-title {
  font-family: 'KaiTi', serif;
  color: var(--primary);
  border-bottom: 1px solid var(--primary);
}

/* ---- t41 赛博朋克霓虹紫 ---- */
.theme-cyberpunk-neon-purple .bg-layer {
  background:
    repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,0,255,0.03) 2px, rgba(255,0,255,0.03) 4px);
}
.theme-cyberpunk-neon-purple .center-header {
  border: 1px solid var(--accent);
  box-shadow: 0 0 10px var(--accent), inset 0 0 10px rgba(255,0,255,0.1);
  padding: 16px 24px;
}
.theme-cyberpunk-neon-purple .center-name {
  color: var(--accent);
  text-shadow: 0 0 8px var(--accent), 2px 2px 0 rgba(0,255,255,0.3);
}
.theme-cyberpunk-neon-purple .section-title {
  color: var(--accent);
  text-shadow: 0 0 4px var(--accent);
  border-bottom: 1px solid var(--accent);
}
.theme-cyberpunk-neon-purple .entry-row {
  border-left: 2px solid var(--accent);
  box-shadow: -2px 0 4px rgba(255,0,255,0.2);
}

/* ---- t42 牛皮纸复古档案 ---- */
.theme-kraft-archive-retro .bg-layer {
  background:
    repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(139,105,20,0.04) 80px, rgba(139,105,20,0.04) 82px),
    repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(139,105,20,0.04) 80px, rgba(139,105,20,0.04) 82px);
}
.theme-kraft-archive-retro .center-header {
  border: 2px solid var(--text);
  padding: 14px 20px;
  position: relative;
}
.theme-kraft-archive-retro .center-header::before {
  content: '档案 No.001';
  position: absolute;
  top: -10px; left: 16px;
  background: var(--bg);
  padding: 0 8px;
  font-size: 10px;
  color: var(--accent);
}
.theme-kraft-archive-retro .center-header::after {
  content: '已审核';
  position: absolute;
  bottom: -12px; right: 16px;
  width: 50px; height: 50px;
  border: 2px solid var(--accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: var(--accent);
  transform: rotate(-15deg);
}
.theme-kraft-archive-retro .section-title {
  border-bottom: 2px double var(--text);
}

/* ---- t43 极光渐变北极光 ---- */
.theme-aurora-gradient-north .bg-layer {
  background:
    linear-gradient(135deg, rgba(0,184,148,0.3) 0%, transparent 40%),
    linear-gradient(225deg, rgba(108,92,231,0.3) 0%, transparent 40%),
    linear-gradient(180deg, rgba(0,206,201,0.2) 0%, transparent 60%);
}
.theme-aurora-gradient-north .bg-layer::after {
  content: '✦ ✧ ✦ ✧ ✦';
  position: absolute;
  top: 20px; left: 0; right: 0;
  text-align: center;
  color: rgba(255,255,255,0.3);
  font-size: 14px;
  letter-spacing: 40px;
}
.theme-aurora-gradient-north .center-header {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 16px;
  padding: 20px 28px;
  margin: 16px auto;
  max-width: 90%;
}
.theme-aurora-gradient-north .center-name {
  text-shadow: 0 0 12px rgba(0,206,201,0.6);
}
.theme-aurora-gradient-north .section-title {
  color: var(--accent);
  text-shadow: 0 0 4px rgba(0,206,201,0.3);
}

/* ---- t44 极简线条素描 ---- */
.theme-minimal-line-sketch .center-header {
  text-align: center;
  padding: 30px 0 16px;
}
.theme-minimal-line-sketch .center-header::before {
  content: '';
  display: block;
  margin: 0 auto 12px;
  width: 60px; height: 1px;
  background: var(--text);
}
.theme-minimal-line-sketch .center-header::after {
  content: '';
  display: block;
  margin: 12px auto 0;
  width: 60px; height: 1px;
  background: var(--text);
}
.theme-minimal-line-sketch .center-name {
  font-family: 'Georgia', serif;
  font-weight: 300;
  letter-spacing: 4px;
}
.theme-minimal-line-sketch .section-title {
  font-weight: 300;
  text-align: center;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-size: 12px;
}
.theme-minimal-line-sketch .section {
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

/* ---- t45 绿色生态自然环保 ---- */
.theme-green-eco-natural .sidebar {
  background: linear-gradient(180deg, var(--primary), var(--secondary));
  position: relative;
  overflow: hidden;
}
.theme-green-eco-natural .sidebar::before {
  content: '🌿';
  position: absolute;
  bottom: 10px; right: 10px;
  font-size: 60px;
  opacity: 0.08;
}
.theme-green-eco-natural .sidebar::after {
  content: '🍃';
  position: absolute;
  top: 20px; right: 20px;
  font-size: 40px;
  opacity: 0.08;
}
/* 侧栏内文字用白色/浅色 */
.theme-green-eco-natural .sidebar .section-title {
  color: var(--light) !important;
  border-left-color: var(--accent);
}
.theme-green-eco-natural .sidebar .sidebar-label {
  opacity: 0.7;
}
.theme-green-eco-natural .sidebar .sidebar-value {
  color: rgba(255,255,255,0.95);
}
.theme-green-eco-natural .sidebar .sidebar-cert,
.theme-green-eco-natural .sidebar .lang-row {
  color: rgba(255,255,255,0.85);
}
.theme-green-eco-natural .sidebar .sidebar-summary {
  color: rgba(255,255,255,0.9);
}
.theme-green-eco-natural .sidebar .skill-cat-name {
  color: var(--light) !important;
}
.theme-green-eco-natural .sidebar .skill-tags {
  color: rgba(255,255,255,0.85) !important;
}
.theme-green-eco-natural .section-title {
  color: var(--primary);
  border-left: 4px solid var(--accent);
}
.theme-green-eco-natural .entry-desc::before {
  content: '🌱';
  margin-right: 4px;
  font-size: 10px;
}

/* ---- t46 黑金鎏金奢华 ---- */
.theme-black-gold-luxury {
  background: var(--primary) !important;
}
.theme-black-gold-luxury .center-header {
  text-align: center;
  padding: 30px 0 16px;
  border-bottom: 1px solid var(--accent);
  position: relative;
}
.theme-black-gold-luxury .center-header::before {
  content: '';
  position: absolute;
  bottom: -1px; left: 30%; right: 30%;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
}
.theme-black-gold-luxury .center-name {
  color: var(--accent);
  font-family: 'Georgia', serif;
  text-shadow: 0 0 8px rgba(212,175,55,0.3);
}
.theme-black-gold-luxury .section-title {
  color: var(--accent);
  border-bottom: 1px solid rgba(212,175,55,0.3);
  font-family: 'Georgia', serif;
}
.theme-black-gold-luxury .entry-row {
  border-left: 1px solid rgba(212,175,55,0.3);
  padding-left: 14px;
}

/* ---- t47 马赛克拼贴艺术 ---- */
.theme-mosaic-collage-art .bg-layer {
  background:
    repeating-conic-gradient(from 0deg at 50% 50%, var(--primary) 0deg 15deg, var(--secondary) 15deg 30deg, var(--accent) 30deg 45deg, transparent 45deg 60deg);
  background-size: 40px 40px;
  opacity: 0.08;
}
.theme-mosaic-collage-art .card-grid > div:nth-child(1) {
  border-top: 4px solid var(--primary);
}
.theme-mosaic-collage-art .card-grid > div:nth-child(2) {
  border-top: 4px solid var(--secondary);
}
.theme-mosaic-collage-art .card-grid > div:nth-child(3) {
  border-top: 4px solid var(--accent);
}
.theme-mosaic-collage-art .card-grid > div {
  border-radius: 0;
  padding: 14px;
  background: rgba(255,255,255,0.9);
}
.theme-mosaic-collage-art .section-title {
  border-left: 4px solid var(--accent);
  padding-left: 10px;
}
.theme-mosaic-collage-art .card-header {
  padding: 6px 12px;
  margin-bottom: 6px;
  gap: 10px;
}
.theme-mosaic-collage-art .card-photo {
  width: 55px;
  height: 68px;
}
.theme-mosaic-collage-art .info-strip {
  font-size: 9.5px;
  gap: 2px 8px;
  color: rgba(255,255,255,0.85);
}

/* ---- t48 水彩晕染梦幻 ---- */
.theme-watercolor-dream .bg-layer {
  background:
    radial-gradient(ellipse at 20% 10%, rgba(214,51,132,0.08), transparent 20%),
    radial-gradient(ellipse at 85% 5%, rgba(232,93,158,0.06), transparent 20%);
}
.theme-watercolor-dream .center-header {
  background: #ffffff;
  border-radius: 20px;
  padding: 20px 28px;
  margin: 16px auto;
  max-width: 90%;
}
.theme-watercolor-dream .center-name {
  color: #2a1a2a;
  font-weight: 300;
}
.theme-watercolor-dream .center-title-text {
  color: #5a4a5a;
}
.theme-watercolor-dream .contact-strip {
  color: #4a4a4a;
  background: rgba(214,51,132,0.08);
  border-color: rgba(214,51,132,0.2);
}
.theme-watercolor-dream .section-title {
  color: #6a0d4a;
  border-bottom: 2px solid var(--accent);
}
.theme-watercolor-dream .section {
  background: #ffffff;
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 12px;
}
.theme-watercolor-dream .entry-position,
.theme-watercolor-dream .entry-sub {
  color: #2a1a2a;
}
.theme-watercolor-dream .entry-desc {
  color: #4a4a4a;
}
.theme-watercolor-dream .entry-date {
  color: #8a7a8a;
}
.theme-watercolor-dream .skill-cat-name {
  color: #6a0d4a;
}
.theme-watercolor-dream .skill-tags {
  color: #4a4a4a;
}
.theme-watercolor-dream .cert-row,
.theme-watercolor-dream .lang-row {
  color: #4a4a4a;
}
.theme-watercolor-dream .section-body {
  color: #4a4a4a;
}

/* ---- t49 工业蒸汽朋克 ---- */
.theme-steampunk-industrial .bg-layer {
  background:
    radial-gradient(circle at 15% 85%, rgba(191,106,2,0.08), transparent 25%),
    radial-gradient(circle at 85% 15%, rgba(191,106,2,0.06), transparent 25%),
    repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(62,39,35,0.03) 20px, rgba(62,39,35,0.03) 21px);
}
.theme-steampunk-industrial .center-header {
  border: 2px solid var(--accent);
  border-radius: 4px;
  padding: 16px 24px;
  position: relative;
}
.theme-steampunk-industrial .center-header::before {
  content: '⚙';
  position: absolute;
  top: -12px; left: 16px;
  background: var(--bg);
  padding: 0 6px;
  font-size: 18px;
  color: var(--accent);
}
.theme-steampunk-industrial .center-header::after {
  content: '⚙';
  position: absolute;
  bottom: -12px; right: 16px;
  background: var(--bg);
  padding: 0 6px;
  font-size: 14px;
  color: var(--accent);
}
.theme-steampunk-industrial .section-title {
  color: var(--accent);
  border-bottom: 1px solid var(--accent);
  font-family: 'Georgia', serif;
}

/* ---- t50 极简学术白纸黑字 ---- */
.theme-academic-minimal-bw .center-header {
  text-align: center;
  padding: 40px 0 20px;
  border-bottom: 2px solid var(--text);
  margin-bottom: 20px;
}
.theme-academic-minimal-bw .center-name {
  font-family: 'Georgia', 'Times New Roman', serif;
  font-weight: 400;
  font-size: 24px;
  letter-spacing: 2px;
}
.theme-academic-minimal-bw .section-title {
  font-family: 'Georgia', serif;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
  border-bottom: 1px solid var(--text);
  padding-bottom: 4px;
  margin-bottom: 10px;
}
.theme-academic-minimal-bw .section {
  margin-bottom: 20px;
}
.theme-academic-minimal-bw .entry-desc {
  font-family: 'Georgia', serif;
  line-height: 1.7;
  font-size: 13px;
}

/* ============ 通用增强：仅补充缺失细节，不覆盖布局尺寸 ============ */

/* 避免内容溢出 */
.resume-paper,
.content-layer,
.sidebar,
.main-right,
.col:first-child,
.col:last-child,
.card-grid,
.center-header,
.banner-header {
  box-sizing: border-box;
}

/* sidebar 照片居中 */
.sidebar-photo {
  margin: 0 auto 16px;
}

/* banner-top 头部 flex */
.banner-header {
  display: flex;
  align-items: center;
  gap: 20px;
}
.banner-header .photo-wrap {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

/* banner-center 居中 */
.center-header {
  text-align: center;
}
.center-header .photo-wrap {
  width: 90px;
  height: 90px;
  margin: 0 auto 12px;
}

/* timeline 节点细节 */
.timeline-item {
  position: relative;
  padding-left: 28px;
  margin-bottom: 18px;
}
.timeline-axis {
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  border-left: 2px solid var(--primary);
}
.timeline-node {
  position: absolute;
  left: 0;
  top: 4px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--primary);
  border: 2px solid var(--bg);
  z-index: 1;
}
.timeline-card {
  padding: 10px 14px;
  border-radius: 6px;
}

/* two-column 等分 */
.two-col-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

/* card-style 单列 */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

/* dark-theme 空照片 */
.layout-dark-theme .photo-placeholder {
  background: rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.4);
}

/* 文本溢出保护 */
.entry-desc,
.sidebar-summary,
.section-body {
  word-break: break-word;
  overflow-wrap: break-word;
}

/* ============ 双栏布局：彩色背景栏内文字颜色修复 ============ */
/* 两栏布局中，左/右栏如果用 var(--primary) 做背景色，
   内部的 section-title / entry-position / entry-desc 等需要用浅色 */
.layout-two-column .col:first-child,
.layout-two-column .col:last-child {
  overflow-wrap: break-word;
}
/* ============ dark-theme 布局文字颜色修复 ============ */
.layout-dark-theme .entry-desc {
  color: rgba(255,255,255,0.7);
}
.layout-dark-theme .entry-date {
  color: rgba(255,255,255,0.5);
}
.layout-dark-theme .entry-sub {
  color: rgba(255,255,255,0.6);
}
.layout-dark-theme .cert-row,
.layout-dark-theme .lang-row {
  color: rgba(255,255,255,0.7);
}
.layout-dark-theme .skill-tags {
  color: rgba(255,255,255,0.8);
}
.layout-dark-theme .skill-cat-name {
  color: var(--accent);
}
.layout-dark-theme .info-list {
  color: rgba(255,255,255,0.8);
}
.layout-dark-theme .section-body {
  color: rgba(255,255,255,0.8);
}

/* ============ 通用：深色头部背景的文字用浅色 ============ */
/* 仅对头部背景是深色/彩色的模板生效，排除白色头部的模板 */
.theme-dark-code-pm .center-header,
.theme-mint-green-literary .center-header,
.theme-dark-symmetric-ops .center-header,
.theme-dark-gold-vertical-biz .center-header,
.theme-chinese-red-festive .center-header,
.theme-cyberpunk-neon-purple .center-header,
.theme-black-gold-luxury .center-header,
.theme-aurora-gradient-north .center-header {
  color: var(--light);
}
.theme-dark-code-pm .center-header .center-name,
.theme-mint-green-literary .center-header .center-name,
.theme-dark-symmetric-ops .center-header .center-name,
.theme-dark-gold-vertical-biz .center-header .center-name,
.theme-chinese-red-festive .center-header .center-name,
.theme-cyberpunk-neon-purple .center-header .center-name,
.theme-black-gold-luxury .center-header .center-name,
.theme-aurora-gradient-north .center-header .center-name {
  color: var(--light);
}
.theme-dark-code-pm .center-header .center-title-text,
.theme-mint-green-literary .center-header .center-title-text,
.theme-dark-symmetric-ops .center-header .center-title-text,
.theme-dark-gold-vertical-biz .center-header .center-title-text,
.theme-chinese-red-festive .center-header .center-title-text,
.theme-cyberpunk-neon-purple .center-header .center-title-text,
.theme-black-gold-luxury .center-header .center-title-text,
.theme-aurora-gradient-north .center-header .center-title-text {
  color: rgba(255,255,255,0.9);
}

/* ============ 深色背景模板（非dark-theme布局）的文字颜色修复 ============ */
/* t43 极光：banner-center 布局，深色背景 */
.theme-aurora-gradient-north .section-title {
  color: var(--accent);
  border-left-color: var(--accent);
}
.theme-aurora-gradient-north .entry-desc {
  color: rgba(232,232,240,0.7);
}
.theme-aurora-gradient-north .entry-date {
  color: rgba(232,232,240,0.5);
}
.theme-aurora-gradient-north .entry-sub {
  color: rgba(232,232,240,0.6);
}
.theme-aurora-gradient-north .entry-position {
  color: var(--text);
}
.theme-aurora-gradient-north .skill-cat-name {
  color: var(--accent);
}
.theme-aurora-gradient-north .skill-tags {
  color: rgba(232,232,240,0.8);
}
.theme-aurora-gradient-north .cert-row,
.theme-aurora-gradient-north .lang-row {
  color: rgba(232,232,240,0.7);
}
.theme-aurora-gradient-north .section-body {
  color: rgba(232,232,240,0.8);
}

/* ========== 打印样式 ========== */
@media print {
  @page {
    size: A4;
    margin: 0;
  }

  .resume-paper {
    transform: none !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    width: 210mm !important;
    min-height: 297mm !important;
    height: auto !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 12mm !important;
    overflow: visible !important;
    z-index: 999999 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    page-break-after: always;
  }

  .resume-paper * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    overflow: visible !important;
  }

  .bg-layer,
  .bg-photo,
  .bg-pattern {
    opacity: 0.5 !important;
  }

  .section,
  .entry-row,
  .sidebar-section,
  .elegant-row,
  .card-section {
    page-break-inside: avoid;
  }
}
</style>
