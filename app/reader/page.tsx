'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface ChapterData {
  id: string
  story_id: string
  chapter_num: number
  title: string
  content: string | null
  word_count: number
  is_published: boolean
  created_at: string
}

interface AllChapter {
  id: string
  chapter_num: number
  title: string
}

interface ChapterComment {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: { display_name: string | null; username: string | null } | null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function readMinutes(words: number) {
  return Math.max(1, Math.round(words / 200))
}

export default function ReaderPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const chapterId = searchParams?.get('chapter') || ''
  const storyId = searchParams?.get('story') || ''

  const [chapter, setChapter] = useState<ChapterData | null>(null)
  const [allChapters, setAllChapters] = useState<AllChapter[]>([])
  const [storyTitle, setStoryTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [chapterComments, setChapterComments] = useState<ChapterComment[]>([])
  const [chCommentText, setChCommentText] = useState('')
  const [chCommentSending, setChCommentSending] = useState(false)
  const [chCommentToast, setChCommentToast] = useState<string | null>(null)

  const progRef = useRef<HTMLDivElement>(null)
  const topbarRef = useRef<HTMLDivElement>(null)
  const lastScrollRef = useRef(0)

  /* ─── Veri çek ───────────────────────────────────────────────── */
  useEffect(() => {
    if (!chapterId) { setNotFound(true); setLoading(false); return }
    ; (async () => {
      // 1. Bu bölümü çek (sadece yayınlanan)
      const { data: chap, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('id', chapterId)
        .eq('is_published', true)
        .single()

      if (error || !chap) { setNotFound(true); setLoading(false); return }
      setChapter(chap as ChapterData)

      // 2. Kitabın tüm yayınlanmış bölümlerini çek (navigasyon için)
      const sid = storyId || chap.story_id
      const { data: allCh } = await supabase
        .from('chapters')
        .select('id,chapter_num,title')
        .eq('story_id', sid)
        .eq('is_published', true)
        .order('chapter_num', { ascending: true })
      setAllChapters(allCh || [])

      // 3. Hikaye başlığını çek
      const { data: story } = await supabase
        .from('stories')
        .select('title')
        .eq('id', sid)
        .single()
      setStoryTitle(story?.title || '')

      setLoading(false)
    })()
  }, [chapterId, storyId])

  // Bölüm yorumlarını çek (chapterId değiştiğinde)
  useEffect(() => {
    if (!chapterId) return
    setChapterComments([])
    supabase
      .from('chapter_comments')
      .select('id, user_id, content, created_at, profiles(display_name, username)')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })
      .then(({ data }) => setChapterComments((data || []) as unknown as ChapterComment[]))
  }, [chapterId])

  async function sendChapterComment() {
    if (!chCommentText.trim()) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setChCommentToast('Yorum yapmak için giriş yapmalısın'); setTimeout(() => setChCommentToast(null), 2500); return }
    setChCommentSending(true)
    const { data: inserted, error } = await supabase
      .from('chapter_comments')
      .insert({ chapter_id: chapterId, story_id: storyId || chapter?.story_id, user_id: user.id, content: chCommentText.trim() })
      .select('id, user_id, content, created_at, profiles(display_name, username)')
      .single()
    if (error) { setChCommentToast('Yorum gönderilemedi'); setChCommentSending(false); setTimeout(() => setChCommentToast(null), 2500); return }
    setChapterComments(prev => [inserted as unknown as ChapterComment, ...prev])
    setChCommentText('')
    setChCommentToast('Yorum gönderildi!')
    setTimeout(() => setChCommentToast(null), 2500)
    setChCommentSending(false)
  }

  /* ─── Scroll: progress bar + topbar gizle ───────────────────── */
  useEffect(() => {
    function onScroll() {
      const s = window.scrollY
      const h = document.documentElement.scrollHeight - window.innerHeight
      if (progRef.current) progRef.current.style.width = (h > 0 ? (s / h) * 100 : 0) + '%'
      if (topbarRef.current) {
        if (s > 80 && s > lastScrollRef.current) topbarRef.current.classList.add('hide')
        else topbarRef.current.classList.remove('hide')
      }
      lastScrollRef.current = s
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ─── Bölüm değiştir ─────────────────────────────────────────── */
  function goToChapter(ch: AllChapter) {
    const sid = storyId || chapter?.story_id || ''
    router.push(`/reader?chapter=${ch.id}&story=${sid}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const curIdx = allChapters.findIndex(c => c.id === chapterId)
  const prevCh = curIdx > 0 ? allChapters[curIdx - 1] : null
  const nextCh = curIdx >= 0 && curIdx < allChapters.length - 1 ? allChapters[curIdx + 1] : null
  const resolvedStoryId = storyId || chapter?.story_id || ''
  const backUrl = resolvedStoryId ? `/story/${resolvedStoryId}` : '/'

  function goBack() {
    if (resolvedStoryId) router.push(`/story/${resolvedStoryId}`)
    else router.back()
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito Sans',sans-serif", color: '#8890aa' }}>
        Yükleniyor…
      </div>
    )
  }

  if (notFound || !chapter) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', fontFamily: "'Nunito Sans',sans-serif" }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>Bölüm bulunamadı</span>
        <button onClick={() => router.push('/')} style={{ padding: '.55rem 1.2rem', borderRadius: 8, background: '#2e4f91', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Anasayfaya Dön
        </button>
      </div>
    )
  }

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700&family=Spectral:ital,wght@0,400;0,500;1,400&display=swap');
:root{
  --rd-bg:#ffffff;--rd-ink:#111111;--rd-ink2:#333333;--rd-line:rgba(0,0,0,.09);
  --rd-font:'Spectral',Georgia,serif;--rd-size:19px;--rd-lh:1.95;--rd-width:680px;
  --navy:#1e3a6e;--navy2:#2e4f91;--navy3:#4169af;--navy-lt:#d6e2f7;--navy-xlt:#edf2fc;
  --crimson2:#8f2448;--ink4:#b4bacf;--line:#dde0e8;--t:.2s ease;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Nunito Sans',sans-serif;background:var(--rd-bg);color:var(--rd-ink);min-height:100vh;-webkit-font-smoothing:antialiased;transition:background .35s,color .35s}
button{font-family:inherit;cursor:pointer;border:none;background:none}

/* Top bar */
.topbar{position:fixed;top:0;left:0;right:0;z-index:300;height:54px;background:var(--rd-bg);border-bottom:1px solid var(--rd-line);display:flex;align-items:center;gap:.6rem;padding:0 1.5rem;transition:transform .3s ease,background .35s,border-color .35s}
.topbar.hide{transform:translateY(-100%)}
.tb-back{display:flex;align-items:center;gap:.35rem;font-size:.79rem;font-weight:700;color:var(--rd-ink);opacity:.55;transition:opacity var(--t);flex-shrink:0;text-decoration:none;cursor:pointer}
.tb-back:hover{opacity:1}
.tb-back svg{width:16px;height:16px}
.tb-titles{flex:1;text-align:center;overflow:hidden;display:flex;flex-direction:column;align-items:center;gap:1px}
.tb-book{font-family:'Cormorant Garamond',serif;font-size:.88rem;font-weight:700;color:var(--rd-ink);opacity:.8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px}
.tb-chapter{font-size:.68rem;font-weight:600;color:var(--rd-ink);opacity:.42;letter-spacing:.2px;white-space:nowrap}

/* Progress */
.prog-wrap{position:fixed;top:54px;left:0;right:0;z-index:299;height:3px;background:rgba(128,128,160,.12)}
.prog-fill{height:100%;background:linear-gradient(to right,var(--navy2),var(--crimson2));width:0%;transition:width .1s linear}

/* Reader */
.reader-outer{max-width:var(--rd-width);margin:0 auto;padding:88px 2rem 80px}
.chap-header{text-align:center;margin-bottom:3.5rem;padding-bottom:2.5rem;border-bottom:1px solid var(--rd-line)}
.chap-label{display:inline-block;font-size:.67rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#111;opacity:.85;margin-bottom:.7rem}
.chap-title{font-family:'Cormorant Garamond',serif;font-size:clamp(1.9rem,4vw,2.6rem);font-weight:700;line-height:1.12;color:var(--rd-ink);margin-bottom:.9rem}
.chap-meta{display:flex;justify-content:center;gap:1.5rem;font-size:.74rem;color:var(--rd-ink);opacity:.42}
.chap-meta span{display:flex;align-items:center;gap:.3rem}
.chap-meta svg{width:13px;height:13px}

/* Story text */
.story-text{font-family:var(--rd-font);font-size:var(--rd-size);line-height:var(--rd-lh);color:var(--rd-ink)}
.story-text p{margin-bottom:1.5em}
.story-text p:first-child::first-letter{font-family:'Cormorant Garamond',serif;font-size:4.2em;font-weight:900;line-height:.72;float:left;margin-right:.09em;margin-top:.05em;color:#111}
.story-text hr{border:none;text-align:center;margin:2.5em 0;color:var(--rd-ink);opacity:.3;font-size:1.1rem;letter-spacing:.4em}
.story-text hr::after{content:'✦  ✦  ✦'}
.story-text blockquote{border-left:3px solid var(--crimson2);padding-left:1.3rem;margin:1.8em 0;font-style:italic;color:var(--rd-ink);opacity:.75}
.story-empty{color:#b4bacf;font-style:italic;text-align:center;padding:3rem 0}

/* Chapter nav */
.chap-nav{display:flex;align-items:center;justify-content:space-between;margin-top:4rem;padding-top:2.5rem;border-top:1px solid var(--rd-line);gap:1rem}
.cnav-btn{display:flex;align-items:center;gap:.5rem;padding:.7rem 1.4rem;border-radius:11px;font-size:.84rem;font-weight:700;border:1.5px solid var(--rd-line);color:var(--rd-ink);opacity:.7;transition:all var(--t);flex-shrink:0}
.cnav-btn svg{width:17px;height:17px}
.cnav-btn:hover{opacity:1;border-color:var(--navy3);color:var(--navy2)}
.cnav-btn.primary{background:linear-gradient(135deg,var(--navy2),var(--crimson2));color:#fff;border-color:transparent;opacity:1;box-shadow:0 3px 14px rgba(30,58,110,.28)}
.cnav-btn.primary:hover{opacity:.88}
.cnav-btn.disabled{opacity:.25;pointer-events:none}
.cnav-center{text-align:center}
.cnav-prog-text{font-size:.72rem;color:var(--rd-ink);opacity:.45;margin-bottom:.55rem}
.cnav-dots{display:flex;justify-content:center;gap:5px;flex-wrap:wrap;max-width:220px;margin:0 auto}
.cnav-dot{width:7px;height:7px;border-radius:50%;background:var(--rd-line);cursor:pointer;transition:all var(--t);border:none}
.cnav-dot.done{background:var(--navy3);opacity:.55}
.cnav-dot.cur{background:var(--crimson2);transform:scale(1.4);opacity:1}

/* Themes */
body.sepia{--rd-bg:#faf3e8;--rd-ink:#3b2e1e;--rd-ink2:#5a4535;--rd-line:rgba(59,46,30,.1)}
body.dark{--rd-bg:#111318;--rd-ink:#d8d8e8;--rd-ink2:#a0a0c0;--rd-line:rgba(220,220,240,.1)}

/* Settings panel */
.settings-panel{position:fixed;top:60px;right:12px;z-index:400;width:288px;background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 8px 40px rgba(0,0,0,.18);padding:1.1rem;display:none}
.settings-panel.open{display:block;animation:popIn .18s ease}
@keyframes popIn{from{opacity:0;transform:translateY(-8px) scale(.97)}to{opacity:1;transform:none}}
.sp-title{font-size:.68rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#8890aa;margin-bottom:.9rem}
.sp-row{display:flex;align-items:center;margin-bottom:.75rem}
.sp-label{font-size:.8rem;font-weight:600;color:#434961;flex:1}
.sp-ctrl{display:flex;align-items:center;gap:.35rem}
.sp-btn{width:28px;height:28px;border-radius:7px;background:#e8eaf0;border:1px solid #dde0e8;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;color:#434961;transition:all var(--t)}
.sp-btn:hover{background:var(--navy-lt);border-color:var(--navy3);color:var(--navy2)}
.sp-val{font-size:.8rem;font-weight:700;min-width:28px;text-align:center;color:#434961}
.sp-sep{height:1px;background:#dde0e8;margin:.65rem 0}
.sp-opts{display:flex;gap:.35rem}
.sp-opt{flex:1;padding:.38rem .5rem;border-radius:7px;text-align:center;font-size:.73rem;font-weight:700;color:#434961;border:1.5px solid #dde0e8;transition:all var(--t)}
.sp-opt:hover,.sp-opt.on{border-color:var(--navy2);background:var(--navy-xlt);color:var(--navy2)}
.sp-theme{display:flex;gap:.35rem}
.sp-theme-btn{flex:1;height:32px;border-radius:8px;border:2px solid #dde0e8;font-size:.7rem;font-weight:700;transition:all var(--t)}
.sp-theme-btn:hover,.sp-theme-btn.on{border-color:var(--navy2);box-shadow:0 0 0 3px var(--navy-lt)}
.tb-btn{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;color:var(--rd-ink);opacity:.55;transition:opacity var(--t),background var(--t)}
.tb-btn:hover{opacity:1;background:rgba(128,128,160,.12)}
.tb-btn svg{width:19px;height:19px}
.tb-btn.active{opacity:1;background:var(--navy-xlt);color:var(--navy2)}
.tb-actions{display:flex;align-items:center;gap:.25rem;flex-shrink:0}

/* Chapter comments */
.ch-comments{margin-top:3rem;padding-top:2.5rem;border-top:1px solid var(--rd-line)}
.ch-comments-title{font-family:'Cormorant Garamond',serif;font-size:1.35rem;font-weight:700;color:var(--rd-ink);margin-bottom:1.25rem;opacity:.9}
.ch-comment-form textarea{width:100%;padding:.7rem .9rem;border:1.5px solid var(--rd-line);border-radius:9px;font-family:'Nunito Sans',sans-serif;font-size:.88rem;color:var(--rd-ink);background:transparent;resize:vertical;min-height:80px;outline:none;transition:border-color .2s}
.ch-comment-form textarea:focus{border-color:var(--navy3)}
.ch-comment-form-row{display:flex;justify-content:flex-end;margin-top:.5rem}
.ch-comment-btn{display:flex;align-items:center;gap:.4rem;padding:.5rem 1.1rem;border-radius:8px;background:linear-gradient(135deg,var(--navy2),var(--crimson2));color:#fff;font-size:.82rem;font-weight:700;border:none;cursor:pointer;transition:opacity .2s}
.ch-comment-btn:hover{opacity:.88}
.ch-comment-btn svg{width:14px;height:14px}
.ch-comment-list{margin-top:1.25rem;display:flex;flex-direction:column;gap:.7rem}
.ch-comment-item{display:flex;gap:.7rem;padding:.85rem .95rem;border:1px solid var(--rd-line);border-radius:10px}
.ch-comment-ava{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--navy2),var(--crimson2));display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',serif;font-size:.95rem;font-weight:700;color:#fff;flex-shrink:0}
.ch-comment-body{flex:1;min-width:0}
.ch-comment-name{font-size:.77rem;font-weight:700;color:var(--navy2);margin-bottom:.22rem}
.ch-comment-text{font-size:.84rem;color:var(--rd-ink2);line-height:1.6;opacity:.85}
.ch-comment-date{font-size:.68rem;color:var(--rd-ink);opacity:.35;margin-top:.25rem}
.ch-comment-empty{text-align:center;padding:1.5rem;font-size:.82rem;color:var(--rd-ink);opacity:.38;font-style:italic}
.ch-toast{position:fixed;bottom:1.75rem;left:50%;transform:translateX(-50%);background:rgba(24,28,44,.92);color:#fff;padding:.5rem 1.1rem;border-radius:9px;font-size:.79rem;font-weight:600;z-index:999;white-space:nowrap}
@media(max-width:760px){.reader-outer{padding:82px 1.1rem 70px}.cnav-dots{display:none}.cnav-center{display:none}}
      `}</style>

      {/* Top bar */}
      <div className="topbar" ref={topbarRef}>
        <button className="tb-back" onClick={goBack}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Geri
        </button>

        <div className="tb-titles">
          <div className="tb-book">{storyTitle || 'Foliom'}</div>
          <div className="tb-chapter">{chapter.chapter_num}. Bölüm · {chapter.title}</div>
        </div>

        <div className="tb-actions">
          <button
            className="tb-btn"
            id="settings-btn-rd"
            title="Okuma ayarları"
            onClick={() => {
              const p = document.getElementById('rd-settings-panel')
              const b = document.getElementById('settings-btn-rd')
              p?.classList.toggle('open')
              b?.classList.toggle('active', p?.classList.contains('open'))
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Okuma ayarları paneli (saf JS ile — Next SSR safe) */}
      <div className="settings-panel" id="rd-settings-panel">
        <div className="sp-title">Okuma Ayarları</div>
        <div className="sp-row">
          <span className="sp-label">Yazı Boyutu</span>
          <div className="sp-ctrl">
            <button className="sp-btn" onClick={() => { const r = document.documentElement; const cur = parseInt(getComputedStyle(r).getPropertyValue('--rd-size')) || 19; r.style.setProperty('--rd-size', Math.max(14, cur - 1) + 'px') }}>−</button>
            <span className="sp-val">19</span>
            <button className="sp-btn" onClick={() => { const r = document.documentElement; const cur = parseInt(getComputedStyle(r).getPropertyValue('--rd-size')) || 19; r.style.setProperty('--rd-size', Math.min(28, cur + 1) + 'px') }}>+</button>
          </div>
        </div>
        <div className="sp-sep" />
        <div className="sp-row"><span className="sp-label">Tema</span></div>
        <div className="sp-theme">
          <button className="sp-theme-btn on" style={{ background: '#fff', color: '#1a1a2e' }} onClick={e => { document.body.className = ''; document.querySelectorAll('.sp-theme-btn').forEach(b => b.classList.remove('on')); (e.target as HTMLElement).classList.add('on') }}>Beyaz</button>
          <button className="sp-theme-btn" style={{ background: '#faf3e8', color: '#3b2e1e' }} onClick={e => { document.body.className = 'sepia'; document.querySelectorAll('.sp-theme-btn').forEach(b => b.classList.remove('on')); (e.target as HTMLElement).classList.add('on') }}>Krem</button>
          <button className="sp-theme-btn" style={{ background: '#111318', color: '#d8d8e8' }} onClick={e => { document.body.className = 'dark'; document.querySelectorAll('.sp-theme-btn').forEach(b => b.classList.remove('on')); (e.target as HTMLElement).classList.add('on') }}>Gece</button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="prog-wrap"><div className="prog-fill" ref={progRef} /></div>

      {/* Reader içerik */}
      <div className="reader-outer">
        <div className="chap-header">
          <div className="chap-label">{chapter.chapter_num}. Bölüm</div>
          <h1 className="chap-title">{chapter.title}</h1>
          <div className="chap-meta">
            <span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
              {fmtDate(chapter.created_at)}
            </span>
            {chapter.word_count > 0 && (
              <span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                {chapter.word_count >= 1000 ? (chapter.word_count / 1000).toFixed(1) + 'K' : chapter.word_count} kelime · ~{readMinutes(chapter.word_count)} dk
              </span>
            )}
          </div>
        </div>

        {/* Bölüm metni */}
        <div className="story-text">
          {chapter.content ? (
            <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
          ) : (
            <p className="story-empty">Bu bölüm için henüz içerik eklenmemiş.</p>
          )}
        </div>

        {/* Alt navigasyon */}
        <div className="chap-nav">
          <button
            className={`cnav-btn${!prevCh ? ' disabled' : ''}`}
            onClick={() => prevCh && goToChapter(prevCh)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
            Önceki Bölüm
          </button>

          {allChapters.length > 0 && (
            <div className="cnav-center">
              <div className="cnav-prog-text">{curIdx + 1} / {allChapters.length} Bölüm</div>
              <div className="cnav-dots">
                {allChapters.slice(0, 18).map((c, i) => (
                  <button
                    key={c.id}
                    className={`cnav-dot${i < curIdx ? ' done' : ''}${i === curIdx ? ' cur' : ''}`}
                    title={`${c.chapter_num}. ${c.title}`}
                    onClick={() => goToChapter(c)}
                  />
                ))}
              </div>
            </div>
          )}

          {nextCh ? (
            <button className="cnav-btn primary" onClick={() => goToChapter(nextCh)}>
              Sonraki Bölüm
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></svg>
            </button>
          ) : (
            <button className="cnav-btn" onClick={goBack}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
              Kitap Sayfasına Dön
            </button>
          )}
        </div>

        {/* ── Bölüm Yorumları ── */}
        <div className="ch-comments">
          <div className="ch-comments-title">{chapter.chapter_num}. Bölüm Yorumları</div>
          <div className="ch-comment-form">
            <textarea
              placeholder="Bu bölüm hakkında ne düşünüyorsun?"
              value={chCommentText}
              onChange={e => setChCommentText(e.target.value)}
            />
            <div className="ch-comment-form-row">
              <button
                className="ch-comment-btn"
                onClick={sendChapterComment}
                disabled={chCommentSending || !chCommentText.trim()}
                style={{ opacity: chCommentSending || !chCommentText.trim() ? 0.6 : 1 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
                {chCommentSending ? 'Gönderiliyor…' : 'Yorum Yap'}
              </button>
            </div>
          </div>
          {chapterComments.length === 0 ? (
            <div className="ch-comment-empty">Bu bölüm için henüz yorum yapılmamış.</div>
          ) : (
            <div className="ch-comment-list">
              {chapterComments.map(c => {
                const name = c.profiles?.display_name || c.profiles?.username || 'Anonim'
                return (
                  <div key={c.id} className="ch-comment-item">
                    <div className="ch-comment-ava">{name[0]?.toUpperCase() || '?'}</div>
                    <div className="ch-comment-body">
                      <div className="ch-comment-name">{name}</div>
                      <div className="ch-comment-text">{c.content}</div>
                      <div className="ch-comment-date">
                        {new Date(c.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {chCommentToast && <div className="ch-toast">{chCommentToast}</div>}
    </>
  )
}
