'use client'

import NavBar from '@/components/NavBar'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const GRAD_PAIRS = [['#1a2e5a', '#3a0e20'], ['#0d2a1a', '#1a3a10'], ['#0d1e3a', '#0d3020'], ['#1a2a10', '#102010'], ['#1a1040', '#3a1060'], ['#0d1a3a', '#1a0d2e']]

interface StoryRow { id: string; title: string; genre: string; status: string | null; is_published: boolean; view_count: number; cover_url: string | null; author_id: string; created_at: string; chapter_count?: number }
interface ChapterRow { id: string; story_id: string; chapter_num: number; title: string; word_count: number; is_published: boolean; created_at: string }

const SECTIONS = ['overview', 'books', 'chapters', 'audience', 'comments', 'milestones'] as const
type Section = typeof SECTIONS[number]

/* ─── Donut bileşeni ─── */
function DonutChart({ data }: { data: { label: string; v: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.v, 0)
  const R = 52, r = 30, cx = 62, cy = 62
  let startAngle = -Math.PI / 2
  const arcs = data.map((d) => {
    const angle = (d.v / total) * Math.PI * 2
    const x1 = cx + R * Math.cos(startAngle), y1 = cy + R * Math.sin(startAngle)
    const x2 = cx + R * Math.cos(startAngle + angle), y2 = cy + R * Math.sin(startAngle + angle)
    const x3 = cx + r * Math.cos(startAngle + angle), y3 = cy + r * Math.sin(startAngle + angle)
    const x4 = cx + r * Math.cos(startAngle), y4 = cy + r * Math.sin(startAngle)
    const lg = angle > Math.PI ? 1 : 0
    const path = `M${x1},${y1} A${R},${R} 0 ${lg},1 ${x2},${y2} L${x3},${y3} A${r},${r} 0 ${lg},0 ${x4},${y4} Z`
    startAngle += angle
    return { ...d, path, pct: Math.round((d.v / total) * 100) }
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
      <svg width="124" height="124" viewBox="0 0 124 124" style={{ flexShrink: 0 }}>
        {arcs.map((a, i) => <path key={i} d={a.path} fill={a.color} style={{ cursor: 'pointer', transition: 'opacity .2s' }} />)}
        <text x={cx} y={cy + 5} textAnchor="middle" fontFamily="'Cormorant Garamond'" fontSize="14" fontWeight="900" fill="#181c2c">{data.length}T</text>
      </svg>
      <div style={{ flex: 1, minWidth: 120, display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
        {arcs.map((a, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: a.color, flexShrink: 0 }} />
              <div style={{ fontSize: '.77rem', fontWeight: 600, color: '#434961', flex: 1 }}>{a.label}</div>
              <div style={{ fontSize: '.77rem', fontWeight: 800, color: '#181c2c' }}>{a.pct}%</div>
            </div>
            <div style={{ height: 3, background: '#e8eaf0', borderRadius: 2, marginTop: '.18rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${a.pct}%`, background: a.color, borderRadius: 2 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Çizgi Grafik ─── */
function LineChart({ reads, votes }: { reads: number[]; votes: number[] }) {
  const svgRef = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (!svgRef.current) return
    const svg = svgRef.current
    const W = svg.parentElement?.offsetWidth || 600
    const H = 200
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    svg.setAttribute('width', String(W))
    svg.innerHTML = ''
    const pad = { t: 10, r: 20, b: 30, l: 42 }
    const cW = W - pad.l - pad.r, cH = H - pad.t - pad.b
    const labels = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
    const maxR = Math.max(...reads, 1), maxV = Math.max(...votes, 1)
    const sx = (i: number) => pad.l + (i / (labels.length - 1)) * cW
    const sy = (v: number, max: number) => pad.t + cH - (v / max) * cH
    const ns = 'http://www.w3.org/2000/svg'
    const mk = (tag: string, attrs: Record<string, string | number>) => {
      const el = document.createElementNS(ns, tag)
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)))
      return el
    }
      ;[0, .25, .5, .75, 1].forEach(t => {
        const y = pad.t + cH * (1 - t)
        svg.appendChild(mk('line', { x1: pad.l, y1: y, x2: pad.l + cW, y2: y, stroke: '#dde0e8', 'stroke-width': 1, 'stroke-dasharray': '4,4' }))
        const tx = mk('text', { x: pad.l - 5, y: y + 3, 'text-anchor': 'end', fill: '#b4bacf', 'font-size': 9, 'font-family': 'Nunito Sans' })
        tx.textContent = Math.round(maxR * t / 1000) + 'K'
        svg.appendChild(tx)
      })
    labels.forEach((l, i) => {
      const tx = mk('text', { x: sx(i), y: H - 6, 'text-anchor': 'middle', fill: '#8890aa', 'font-size': 9, 'font-family': 'Nunito Sans' })
      tx.textContent = l; svg.appendChild(tx)
    })
    const buildPath = (data: number[], max: number) => data.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i)},${sy(v, max)}`).join(' ')
    svg.appendChild(mk('path', { d: buildPath(reads, maxR) + ` L${sx(11)},${pad.t + cH} L${sx(0)},${pad.t + cH} Z`, fill: '#2e4f91', opacity: .18 }))
    svg.appendChild(mk('path', { d: buildPath(reads, maxR), fill: 'none', stroke: '#2e4f91', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }))
    svg.appendChild(mk('path', { d: buildPath(votes, maxV) + ` L${sx(11)},${pad.t + cH} L${sx(0)},${pad.t + cH} Z`, fill: '#b83360', opacity: .18 }))
    svg.appendChild(mk('path', { d: buildPath(votes, maxV), fill: 'none', stroke: '#b83360', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }))
    reads.forEach((v, i) => {
      const c = mk('circle', { cx: sx(i), cy: sy(v, maxR), r: 4, fill: '#2e4f91', style: 'cursor:pointer' })
      svg.appendChild(c)
    })
  }, [reads, votes])
  return <svg ref={svgRef} height="200" style={{ width: '100%', overflow: 'visible' }} />
}

function fmtNum(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>('overview')
  const [activePeriod, setActivePeriod] = useState('7')
  const [toast, setToast] = useState<string | null>(null)
  const [stories, setStories] = useState<StoryRow[]>([])
  const [chapters, setChapters] = useState<ChapterRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth'); return }

      // Adım 1: Sadece bu kullanıcıya ait hikayeler
      const { data: storiesData } = await supabase
        .from('stories')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      const myStoryIds = (storiesData || []).map((s: StoryRow) => s.id)

      // Adım 2: Chapters'ı YALNIZCA bu kullanıcının hikayeleriyle filtrele.
      // myStoryIds boşsa hiç sorgu yapma — başka kullanıcının verisi asla gelmesin.
      let chapsData: ChapterRow[] = []
      if (myStoryIds.length > 0) {
        const { data } = await supabase
          .from('chapters')
          .select('id,story_id,chapter_num,title,word_count,is_published,created_at')
          .in('story_id', myStoryIds)
          .order('created_at', { ascending: false })
        chapsData = data || []
      }

      const storiesWithCounts = (storiesData || []).map((s: StoryRow) => ({
        ...s,
        chapter_count: chapsData.filter((c: ChapterRow) => c.story_id === s.id).length,
      }))

      setStories(storiesWithCounts)
      setChapters(chapsData)
      setLoading(false)
    })
  }, [router])


  const totalViews = stories.reduce((s, b) => s + (b.view_count || 0), 0)
  const publishedChapters = chapters.filter(c => c.is_published).length

  // Monthly published chapters for current year
  const monthlyReads = Array(12).fill(0)
  const monthlyVotes = Array(12).fill(0)
  const currentYear = new Date().getFullYear()
  chapters.forEach(c => {
    if (!c.is_published || !c.created_at) return
    const d = new Date(c.created_at)
    if (d.getFullYear() !== currentYear) return
    monthlyReads[d.getMonth()] += 1
    monthlyVotes[d.getMonth()] += 1
  })

  const genreMap: Record<string, number> = {}
  stories.forEach(s => { genreMap[s.genre || 'Diğer'] = (genreMap[s.genre || 'Diğer'] || 0) + 1 })
  const genreColors = ['#2e4f91', '#b83360', '#1b6b3a', '#c47a0a', '#8890aa', '#4a2080']
  const genreData = Object.entries(genreMap).map(([label, v], i) => ({ label, v, color: genreColors[i % genreColors.length] }))

  const kpiData = [
    { type: 'k-reads', ico: '#2e4f91', label: 'Toplam Görüntüleme', value: fmtNum(totalViews), spark: Array(12).fill(0).map((_, i) => Math.round(10 + i * 7)), icoPath: 'M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z' },
    { type: 'k-votes', ico: '#c47a0a', label: 'Toplam Hikaye', value: String(stories.length), spark: Array(12).fill(0).map((_, i) => Math.round(5 + i * 5)), icoPath: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25' },
    { type: 'k-comm', ico: '#1b6b3a', label: 'Toplam Bölüm', value: String(chapters.length), spark: Array(12).fill(0).map((_, i) => Math.round(3 + i * 4)), icoPath: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z' },
    { type: 'k-lib', ico: '#4a2080', label: 'Yayınlanan Bölüm', value: String(publishedChapters), spark: Array(12).fill(0).map((_, i) => Math.round(2 + i * 3)), icoPath: 'M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z' },
  ]

  function showToast(msg: string) {
    setToast(msg); setTimeout(() => setToast(null), 2500)
  }

  const sbItems = [
    { id: 'overview' as Section, label: 'Genel Bakış' },
    { id: 'books' as Section, label: 'Hikaye Performansı', badge: stories.length > 0 ? String(stories.length) : undefined },
    { id: 'chapters' as Section, label: 'Bölüm Analizi' },
    { id: 'audience' as Section, label: 'Okuyucu Kitlesi' },
    { id: 'comments' as Section, label: 'Yorumlar' },
    { id: 'milestones' as Section, label: 'Hedefler' },
  ]

  return (
    <>
      <NavBar />
      <style>{`
        .an-shell{display:flex;padding-top:64px;min-height:100vh;background:#f2f3f7;font-family:'Nunito Sans',sans-serif}
        .an-sidebar{width:228px;flex-shrink:0;position:fixed;top:64px;left:0;bottom:0;background:#fff;border-right:1px solid #dde0e8;overflow-y:auto;padding:1.25rem 0;z-index:200}
        .an-sb-label{font-size:.62rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#b4bacf;padding:0 1.25rem;margin-bottom:.45rem;display:block}
        .an-sb-item{display:flex;align-items:center;gap:.6rem;padding:.58rem 1.25rem;font-size:.82rem;font-weight:600;color:#434961;cursor:pointer;background:none;border-left:3px solid transparent;width:100%;text-align:left;border-right:none;border-top:none;border-bottom:none;transition:all .2s;font-family:inherit}
        .an-sb-item:hover{background:#e8eaf0;color:#181c2c}
        .an-sb-item.active{background:#edf2fc;color:#2e4f91;font-weight:700;border-left-color:#2e4f91}
        .an-sb-badge{margin-left:auto;font-size:.6rem;font-weight:800;padding:.1rem .42rem;border-radius:20px;background:#e8eaf0;color:#8890aa}
        .an-sb-item.active .an-sb-badge{background:#d6e2f7;color:#2e4f91}
        .an-main{margin-left:228px;flex:1;min-width:0}
        .an-section{display:none;padding:2rem 2rem 5rem}
        .an-section.on{display:block;animation:secIn .22s ease}
        @keyframes secIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        .an-page-hd{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:1.75rem;flex-wrap:wrap;gap:1rem}
        .an-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.85rem;font-weight:900}
        .an-sub{font-size:.78rem;color:#8890aa;margin-top:.12rem}
        .an-period{display:flex;background:#e8eaf0;border-radius:10px;padding:.25rem;gap:.2rem}
        .an-pt{padding:.38rem .85rem;border-radius:7px;font-size:.77rem;font-weight:700;color:#8890aa;cursor:pointer;background:none;border:none;font-family:inherit;transition:all .2s;white-space:nowrap}
        .an-pt.on{background:#fff;color:#2e4f91;box-shadow:0 1px 6px rgba(24,28,44,.13)}
        .kpi-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(195px,1fr));gap:1.1rem;margin-bottom:2rem}
        .kpi-card{background:#fff;border:1px solid #dde0e8;border-radius:16px;padding:1.25rem 1.35rem;position:relative;overflow:hidden;transition:box-shadow .2s,border-color .2s}
        .kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:16px 16px 0 0}
        .kpi-card.k-reads::before{background:linear-gradient(to right,#2e4f91,#4169af)}
        .kpi-card.k-follow::before{background:linear-gradient(to right,#8f2448,#b83360)}
        .kpi-card.k-votes::before{background:linear-gradient(to right,#c47a0a,#e09020)}
        .kpi-card.k-comm::before{background:linear-gradient(to right,#1b6b3a,#22854a)}
        .kpi-card.k-lib::before{background:linear-gradient(to right,#4a2080,#6a30a8)}
        .kpi-val{font-family:'Cormorant Garamond',Georgia,serif;font-size:2rem;font-weight:900;line-height:1;margin-bottom:.2rem}
        .kpi-lbl{font-size:.74rem;color:#8890aa;margin-bottom:.55rem}
        .kpi-trend{display:flex;align-items:center;gap:.22rem;font-size:.72rem;font-weight:800}
        .kpi-trend.up{color:#22854a} .kpi-trend.down{color:#c0392b}
        .charts-row{display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem}
        .charts-row.wide{grid-template-columns:2fr 1fr}
        .chart-card{background:#fff;border:1px solid #dde0e8;border-radius:16px;padding:1.35rem}
        .chart-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.05rem;font-weight:900}
        .chart-sub{font-size:.72rem;color:#8890aa;margin-top:.06rem}
        .chart-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.35rem;flex-wrap:wrap;gap:.5rem}
        .geo-row{display:flex;align-items:center;gap:.75rem;padding:.3rem 0}
        .geo-country{font-size:.8rem;font-weight:600;flex:1}
        .geo-track{flex:1;max-width:100px;height:5px;background:#e8eaf0;border-radius:3px;overflow:hidden}
        .geo-fill{height:100%;background:linear-gradient(to right,#2e4f91,#8f2448);border-radius:3px}
        .geo-pct{font-size:.72rem;font-weight:800;color:#2e4f91;width:34px;text-align:right}
        .cp-row{display:flex;align-items:center;gap:.85rem;margin-bottom:.5rem}
        .cp-num{font-size:.72rem;font-weight:800;color:#b4bacf;width:20px;text-align:right;flex-shrink:0}
        .cp-title-t{font-size:.8rem;font-weight:600;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#434961}
        .cp-track{width:120px;flex-shrink:0;height:6px;background:#e8eaf0;border-radius:3px;overflow:hidden}
        .cp-fill{height:100%;background:linear-gradient(to right,#2e4f91,#4169af);border-radius:3px}
        .cp-val2{font-size:.73rem;font-weight:700;color:#434961;width:42px;text-align:right;flex-shrink:0}
        .data-table{width:100%;border-collapse:collapse}
        .data-table thead th{padding:.65rem .9rem;text-align:left;font-size:.7rem;font-weight:800;letter-spacing:.7px;text-transform:uppercase;color:#8890aa;border-bottom:2px solid #dde0e8;white-space:nowrap}
        .data-table tbody tr{border-bottom:1px solid #dde0e8;cursor:pointer;transition:background .2s}
        .data-table tbody tr:hover{background:#e8eaf0}
        .data-table td{padding:.7rem .9rem;font-size:.82rem;vertical-align:middle}
        .td-thumb{width:30px;height:44px;border-radius:5px;overflow:hidden;flex-shrink:0}
        .ms-card{background:#fff;border:1px solid #dde0e8;border-radius:14px;padding:1.1rem}
        .ms-card.achieved{border-color:rgba(27,107,58,.3);background:#e6f7ed}
        .ms-ico{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:.65rem}
        .ms-lbl{font-size:.76rem;font-weight:700;color:#434961;margin-bottom:.18rem}
        .ms-val{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.2rem;font-weight:900;margin-bottom:.45rem}
        .ms-progress{height:6px;background:#e8eaf0;border-radius:3px;overflow:hidden;margin-bottom:.3rem}
        .ms-pfill{height:100%;border-radius:3px;transition:width 1s ease}
        .ms-meta{font-size:.68rem;color:#8890aa}
        .ms-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.85rem}
        .ci-item{display:flex;align-items:flex-start;gap:.8rem;background:#e8eaf0;border-radius:12px;padding:.85rem 1rem;margin-bottom:.65rem}
        .ci-ava{width:36px;height:36px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',Georgia,serif;font-size:.95rem;font-weight:900;color:#fff}
        .ci-user{font-size:.8rem;font-weight:700}
        .ci-book{font-size:.72rem;font-weight:600;color:#2e4f91}
        .ci-time{font-size:.68rem;color:#b4bacf;margin-left:auto}
        .ci-text{font-size:.81rem;color:#434961;line-height:1.6;margin-top:.22rem}
        .an-toast{position:fixed;bottom:1.75rem;left:50%;transform:translateX(-50%);background:rgba(24,28,44,.96);color:#fff;z-index:700;padding:.55rem 1.15rem;border-radius:10px;font-size:.79rem;font-weight:600;display:flex;align-items:center;gap:.45rem;box-shadow:0 6px 24px rgba(0,0,0,.28);white-space:nowrap}
        .hm-days{display:grid;grid-template-columns:repeat(52,1fr);gap:3px;margin-bottom:.35rem}
        .hm-day{aspect-ratio:1;border-radius:2px;cursor:pointer}
        .bar-chart{display:flex;align-items:flex-end;gap:6px;height:160px;padding:0 .25rem}
        .bar-group2{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
        .bar2{border-radius:4px 4px 0 0;width:calc(50% - 1.5px);transition:height .7s;cursor:pointer;min-height:2px}
        .bar-lbl2{font-size:.63rem;color:#8890aa;font-weight:600}
        @media(max-width:900px){.an-sidebar{display:none}.an-main{margin-left:0}.charts-row,.charts-row.wide{grid-template-columns:1fr}}
      `}</style>

      <div className="an-shell">
        {/* Sidebar */}
        <aside className="an-sidebar">
          <span className="an-sb-label">Genel Bakış</span>
          {sbItems.map(item => (
            <button key={item.id} className={`an-sb-item${activeSection === item.id ? ' active' : ''}`} onClick={() => setActiveSection(item.id)}>
              {item.label}
              {item.badge && <span className="an-sb-badge">{item.badge}</span>}
            </button>
          ))}
          <div style={{ height: 1, background: '#dde0e8', margin: '.65rem 1.25rem' }} />
          <span className="an-sb-label">Kitaplarım</span>
          {loading ? (
            <div style={{ padding: '1rem 1.25rem', fontSize: '.75rem', color: '#8890aa' }}>Yükleniyor…</div>
          ) : stories.length === 0 ? (
            <div style={{ padding: '1rem 1.25rem', fontSize: '.75rem', color: '#8890aa' }}>Henüz hikaye yok</div>
          ) : stories.map((s, i) => {
            const g = GRAD_PAIRS[i % GRAD_PAIRS.length]
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '.55rem', padding: '.45rem 1.25rem', cursor: 'pointer' }}
                onClick={() => { setActiveSection('books'); showToast(s.title + ' seçildi') }}>
                <div style={{ width: 24, height: 36, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ width: '100%', height: '100%', background: `linear-gradient(155deg,${g[0]},${g[1]})` }} />
                </div>
                <div>
                  <div style={{ fontSize: '.75rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 120 }}>{s.title}</div>
                  <div style={{ fontSize: '.65rem', color: '#8890aa' }}>{fmtNum(s.view_count || 0)} görüntüleme</div>
                </div>
              </div>
            )
          })}
        </aside>

        {/* Main */}
        <main className="an-main">
          {/* GENEL BAKIŞ */}
          <div className={`an-section${activeSection === 'overview' ? ' on' : ''}`}>
            <div className="an-page-hd">
              <div><div className="an-title">Genel Bakış</div><div className="an-sub">Tüm kitapların toplam performansı</div></div>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="an-period">
                  {['7', '30', '90', '365'].map(p => (
                    <button key={p} className={`an-pt${activePeriod === p ? ' on' : ''}`} onClick={() => { setActivePeriod(p); showToast(`Dönem güncellendi: ${p === '7' ? '7 Gün' : p === '30' ? '30 Gün' : p === '90' ? '3 Ay' : '1 Yıl'}`) }}>
                      {p === '7' ? '7 Gün' : p === '30' ? '30 Gün' : p === '90' ? '3 Ay' : '1 Yıl'}
                    </button>
                  ))}
                </div>
                <button onClick={() => showToast('Rapor hazırlanıyor…')} style={{ display: 'flex', alignItems: 'center', gap: '.38rem', padding: '.42rem 1rem', borderRadius: 8, fontSize: '.78rem', fontWeight: 700, border: '1.5px solid #dde0e8', color: '#434961', cursor: 'pointer', background: 'none', fontFamily: 'inherit', transition: 'all .2s' }}>
                  ↓ Dışa Aktar
                </button>
              </div>
            </div>

            {/* KPI */}
            <div className="kpi-grid">
              {kpiData.map((k, i) => (
                <div key={i} className={`kpi-card ${k.type}`}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg,${k.ico},${k.ico}dd)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="#fff" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d={k.icoPath} /></svg>
                    </div>
                  </div>
                  <div className="kpi-val">{k.value}</div>
                  <div className="kpi-lbl">{k.label}</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 28, marginTop: '.65rem' }}>
                    {k.spark.map((v, si) => {
                      const maxSpark = Math.max(...k.spark, 1)
                      return <div key={si} style={{ flex: 1, borderRadius: '2px 2px 0 0', minWidth: 4, height: `${Math.round((v / maxSpark) * 26) + 2}px`, background: k.ico, opacity: 0.3 + (v / maxSpark) * 0.7 }} />
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="charts-row wide">
              <div className="chart-card">
                <div className="chart-hd">
                  <div><div className="chart-title">Bölüm Yayın Trendi</div><div className="chart-sub">Aylık yayınlanan bölüm sayısı</div></div>
                  <div style={{ display: 'flex', gap: '.9rem' }}>
                    {[{ c: '#2e4f91', l: 'Bölüm' }, { c: '#b83360', l: 'Oy' }].map((lg, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '.32rem', fontSize: '.7rem', fontWeight: 600, color: '#8890aa' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: lg.c }} />{lg.l}
                      </div>
                    ))}
                  </div>
                </div>
                <LineChart reads={monthlyReads} votes={monthlyVotes} />
              </div>
              <div className="chart-card">
                <div className="chart-hd"><div><div className="chart-title">Tür Dağılımı</div><div className="chart-sub">Kitap sayısına göre</div></div></div>
                {genreData.length > 0
                  ? <DonutChart data={genreData} />
                  : <div style={{ fontSize: '.8rem', color: '#8890aa', padding: '2rem 0', textAlign: 'center' }}>Henüz kitap yok</div>
                }
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-hd"><div><div className="chart-title">Yayın Takvimi</div><div className="chart-sub">Bölüm yayın aktivitesi (son 52 hafta)</div></div></div>
              <div className="hm-days">
                {Array.from({ length: 52 }, (_, weekIdx) => {
                  const weekStart = new Date()
                  weekStart.setDate(weekStart.getDate() - (51 - weekIdx) * 7)
                  const weekEnd = new Date(weekStart)
                  weekEnd.setDate(weekEnd.getDate() + 7)
                  const count = chapters.filter(c => {
                    if (!c.is_published || !c.created_at) return false
                    const d = new Date(c.created_at)
                    return d >= weekStart && d < weekEnd
                  }).length
                  const cs = ['#e8eaf0', '#b8ccee', '#7aaad8', '#4169af', '#2e4f91']
                  return <div key={weekIdx} className="hm-day" style={{ background: cs[Math.min(count, 4)] }} title={`${count} bölüm`} />
                })}
              </div>
            </div>
          </div>

          {/* HİKAYE PERFORMANSI */}
          <div className={`an-section${activeSection === 'books' ? ' on' : ''}`}>
            <div className="an-page-hd">
              <div><div className="an-title">Hikaye Performansı</div><div className="an-sub">Hikaye bazında detaylı istatistikler</div></div>
            </div>
            <div className="chart-card" style={{ marginBottom: '1.25rem', overflowX: 'auto' }}>
              <div className="chart-hd"><div><div className="chart-title">Tüm Hikayeler</div><div className="chart-sub">Oluşturma tarihine göre sıralı</div></div></div>
              <table className="data-table">
                <thead><tr><th>#</th><th>Hikaye</th><th>Görüntüleme</th><th>Bölüm</th><th>Durum</th></tr></thead>
                <tbody>
                  {stories.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#8890aa', padding: '2rem' }}>Henüz hikaye yok</td></tr>
                  ) : stories.map((s, i) => {
                    const g = GRAD_PAIRS[i % GRAD_PAIRS.length]
                    return (
                      <tr key={s.id} onClick={() => showToast(`${s.title} açılıyor…`)}>
                        <td style={{ fontFamily: 'Cormorant Garamond', fontWeight: 900, fontSize: '.95rem', color: i < 3 ? '#2e4f91' : '#8890aa' }}>{i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                          <div className="td-thumb"><div style={{ width: '100%', height: '100%', background: `linear-gradient(155deg,${g[0]},${g[1]})` }} /></div>
                          <div><div style={{ fontWeight: 700, fontSize: '.84rem' }}>{s.title}</div><div style={{ fontSize: '.68rem', color: '#8890aa' }}>{s.genre}</div></div>
                        </div></td>
                        <td style={{ fontWeight: 700 }}>{fmtNum(s.view_count || 0)}</td>
                        <td style={{ fontWeight: 700 }}>{s.chapter_count || 0}</td>
                        <td><span style={{ fontSize: '.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.4px', padding: '.15rem .5rem', borderRadius: 5, color: '#fff', background: s.is_published ? 'rgba(46,79,145,.85)' : 'rgba(139,139,139,.7)' }}>{s.is_published ? 'Yayında' : 'Taslak'}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="chart-card">
              <div className="chart-hd">
                <div><div className="chart-title">Hikaye Bölüm Sayısı</div><div className="chart-sub">Hikayelere göre yayınlanan bölüm</div></div>
              </div>
              {stories.length === 0 ? (
                <div style={{ fontSize: '.8rem', color: '#8890aa', padding: '2rem 0', textAlign: 'center' }}>Henüz hikaye yok</div>
              ) : (
                <div className="bar-chart">
                  {stories.slice(0, 5).map((s, i) => {
                    const maxChaps = Math.max(...stories.slice(0, 5).map(x => x.chapter_count || 0), 1)
                    const h1 = Math.round(((s.chapter_count || 0) / maxChaps) * 140)
                    const shortTitle = s.title.split(' ').slice(0, 2).join(' ')
                    return (
                      <div key={s.id} className="bar-group2" onClick={() => showToast(`${s.title}: ${s.chapter_count || 0} bölüm`)}>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, flex: 1 }}>
                          <div className="bar2" style={{ height: Math.max(h1, 2), background: 'linear-gradient(to top,#2e4f91,#4169af)', width: '60%' }} />
                        </div>
                        <div className="bar-lbl2">{shortTitle}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* BÖLÜM ANALİZİ */}
          <div className={`an-section${activeSection === 'chapters' ? ' on' : ''}`}>
            <div className="an-page-hd"><div><div className="an-title">Bölüm Analizi</div><div className="an-sub">Yayınlanan bölümler</div></div></div>
            <div className="chart-card">
              <div className="chart-hd"><div><div className="chart-title">Bölüm Listesi</div><div className="chart-sub">Kelime sayısına göre</div></div></div>
              {chapters.length === 0 ? (
                <div style={{ fontSize: '.8rem', color: '#8890aa', padding: '2rem 0', textAlign: 'center' }}>Henüz bölüm yok</div>
              ) : (() => {
                const maxWc = Math.max(...chapters.map(c => c.word_count || 0), 1)
                return chapters.slice(0, 10).map((c, i) => (
                  <div key={c.id} className="cp-row">
                    <div className="cp-num">{i + 1}</div>
                    <div className="cp-title-t">Bölüm {c.chapter_num} — {c.title}</div>
                    <div className="cp-track"><div className="cp-fill" style={{ width: `${Math.round(((c.word_count || 0) / maxWc) * 100)}%` }} /></div>
                    <div className="cp-val2">{c.word_count || 0}k</div>
                  </div>
                ))
              })()}
            </div>
          </div>

          {/* OKUYUCU KİTLESİ */}
          <div className={`an-section${activeSection === 'audience' ? ' on' : ''}`}>
            <div className="an-page-hd"><div><div className="an-title">Okuyucu Kitlesi</div><div className="an-sub">İstatistikler okuyucu verisi toplandıkça güncellenir</div></div></div>
            <div className="chart-card">
              <div className="chart-hd"><div><div className="chart-title">Kitap & Bölüm Özeti</div><div className="chart-sub">Mevcut içerik durumu</div></div></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '.85rem', paddingTop: '.5rem' }}>
                {[
                  { label: 'Toplam Hikaye', value: stories.length, color: '#2e4f91' },
                  { label: 'Yayında', value: stories.filter(s => s.is_published).length, color: '#1b6b3a' },
                  { label: 'Taslak', value: stories.filter(s => !s.is_published).length, color: '#8890aa' },
                  { label: 'Toplam Bölüm', value: chapters.length, color: '#c47a0a' },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#e8eaf0', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond,Georgia,serif', fontSize: '1.8rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '.72rem', color: '#8890aa', marginTop: '.18rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* YORUMLAR */}
          <div className={`an-section${activeSection === 'comments' ? ' on' : ''}`}>
            <div className="an-page-hd"><div><div className="an-title">Yorumlar</div><div className="an-sub">Okuyucu geri bildirimleri</div></div></div>
            <div className="chart-card">
              <div className="chart-hd"><div><div className="chart-title">Toplam Yorum</div><div className="chart-sub">Kitaplara göre</div></div></div>
              {stories.length === 0 ? (
                <div style={{ fontSize: '.8rem', color: '#8890aa', padding: '2rem 0', textAlign: 'center' }}>Henüz hikaye yok</div>
              ) : stories.map((s, i) => (
                <div key={s.id} className="cp-row">
                  <div className="cp-num">{i + 1}</div>
                  <div className="cp-title-t">{s.title}</div>
                  <div className="cp-track"><div className="cp-fill" style={{ width: `${Math.min(100, Math.round(((s.view_count || 0) / Math.max(...stories.map(x => x.view_count || 0), 1)) * 100))}%` }} /></div>
                  <div className="cp-val2">{fmtNum(s.view_count || 0)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* HEDEFLER */}
          <div className={`an-section${activeSection === 'milestones' ? ' on' : ''}`}>
            <div className="an-page-hd"><div><div className="an-title">Hedefler & Dönüm Noktaları</div><div className="an-sub">Büyüme hedeflerini takip et</div></div></div>
            <div className="chart-card">
              <div className="chart-hd"><div><div className="chart-title">Uzun Vadeli Hedefler</div><div className="chart-sub">Platform milestones</div></div></div>
              <div className="ms-grid">
                {[
                  { label: '5M Toplam Görüntüleme', current: totalViews, target: 5000000, color: '#2e4f91' },
                  { label: '15 Yayınlanan Hikaye', current: stories.filter(s => s.is_published).length, target: 15, color: '#1b6b3a' },
                  { label: '100 Bölüm Yayını', current: publishedChapters, target: 100, color: '#c47a0a' },
                ].map((g, i) => {
                  const pct = Math.min(100, Math.round((g.current / g.target) * 100))
                  return (
                    <div key={i} className="ms-card">
                      <div className="ms-ico" style={{ background: `linear-gradient(135deg,${g.color},${g.color}cc)` }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="#fff" style={{ width: 18, height: 18 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
                      </div>
                      <div className="ms-lbl">{g.label}</div>
                      <div className="ms-val">{fmtNum(g.current)} / {fmtNum(g.target)}</div>
                      <div className="ms-progress"><div className="ms-pfill" style={{ width: `${pct}%`, background: g.color }} /></div>
                      <div className="ms-meta">%{pct} tamamlandı</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </main>
      </div>

      {toast && (
        <div className="an-toast">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5de898" style={{ width: 14, height: 14, flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          {toast}
        </div>
      )}
    </>
  )
}
