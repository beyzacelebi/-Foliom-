'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

// ─── Veri ─────────────────────────────────────────────────────────────────────
const GR = [
  ['#1e3a6e','#6b1a34'],['#1a2844','#3a0e20'],['#1a3a28','#0e1e3a'],
  ['#3a1a0e','#1a0e2a'],['#0e2a3a','#1e1a3a'],['#2a1a0e','#0e1a2a'],
  ['#1a0e3a','#3a1a2e'],['#1e2a50','#50121e'],['#0e1e30','#2e0e1e'],
]
const STORIES = [
  { id:1,  title:'Yarım Kalan Mektuplar',   author:'Zeynep A.',  rating:4.8, reads:'12.4K', chapters:18, gr:GR[0] },
  { id:2,  title:'Gece Yarısı Kütüphanesi', author:'Mert K.',    rating:4.6, reads:'8.9K',  chapters:24, gr:GR[1] },
  { id:3,  title:'Tuzdan Bir Şehir',        author:'Elif D.',    rating:4.5, reads:'5.6K',  chapters:32, gr:GR[2] },
  { id:4,  title:'Son Nefes Protokolü',     author:'Berk Y.',    rating:4.7, reads:'9.2K',  chapters:20, gr:GR[3] },
  { id:5,  title:'Dedektif Olmak İstedim',  author:'Selin T.',   rating:4.4, reads:'7.1K',  chapters:15, gr:GR[4] },
  { id:6,  title:'Kızıl Ormanda',           author:'Deniz Ç.',   rating:4.3, reads:'4.8K',  chapters:12, gr:GR[5] },
  { id:7,  title:'Mutfak Masasında Barış',  author:'Aylin R.',   rating:4.6, reads:'6.3K',  chapters:8,  gr:GR[6] },
  { id:8,  title:'Rüzgârın Sesi',           author:'Okan B.',    rating:4.9, reads:'15.6K', chapters:11, gr:GR[7] },
  { id:9,  title:'Sis Perdesinin Ardında',  author:'Ceren M.',   rating:4.5, reads:'6.8K',  chapters:22, gr:GR[8] },
  { id:10, title:'Işıltılı Geçmiş',         author:'Emre S.',    rating:4.3, reads:'3.4K',  chapters:9,  gr:GR[0] },
]
const hotStories = [...STORIES].sort((a,b) => parseFloat(b.reads) - parseFloat(a.reads))
const newStories = [...STORIES].sort((a,b) => b.id - a.id)

// ─── Küçük ikonlar ─────────────────────────────────────────────────────────────
const StarSm   = () => <svg viewBox="0 0 24 24" fill="currentColor" style={{width:11,height:11,color:'#c4a020',flexShrink:0}}><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006Z" clipRule="evenodd"/></svg>
const BookSm   = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:11,height:11,flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/></svg>
const DocSm    = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:11,height:11,flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg>
const HeartOut = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" style={{width:14,height:14}}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/></svg>
const HeartFill= () => <svg viewBox="0 0 24 24" fill="currentColor" style={{width:14,height:14}}><path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"/></svg>
const FireXs   = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:9,height:9,flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"/></svg>
const SparkXs  = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{width:9,height:9,flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/></svg>
const CheckXs  = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width:9,height:9,flexShrink:0}}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
const ChevR    = () => <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" style={{width:14,height:14}}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5"/></svg>

// ─── Kitap Kartı ────────────────────────────────────────────────────────────────
function BookCard({ s, type, favs, onToggle }: {
  s: typeof STORIES[0], type: 'hot'|'new',
  favs: Set<number>, onToggle: (id:number) => void
}) {
  const isFav = favs.has(s.id)
  return (
    <div className="bcard">
      <div className="bcard-cover">
        <div className="bcard-cover-bg" style={{background:`linear-gradient(135deg,${s.gr[0]},${s.gr[1]})`}}/>
        <div className="bcard-overlay"/>
        <div className={`bcard-badge ${type==='hot'?'badge-fire':'badge-sparkle'}`}>
          {type==='hot' ? <FireXs/> : <SparkXs/>}
          {type==='hot' ? 'Trend' : 'Yeni'}
        </div>
        <button className={`bcard-fav-btn${isFav?' on':''}`} onClick={()=>onToggle(s.id)}>
          {isFav ? <HeartFill/> : <HeartOut/>}
        </button>
        <div className="bcard-cover-title">{s.title}</div>
      </div>
      <div className="bcard-title">{s.title}</div>
      <div className="bcard-author">{s.author}</div>
      <div className="bcard-stats">
        <span className="bcard-stat bcard-rating"><StarSm/> {s.rating}</span>
        <span className="bcard-stat"><BookSm/> {s.reads}</span>
        <span className="bcard-stat"><DocSm/> {s.chapters} Bölüm</span>
      </div>
    </div>
  )
}

// ─── Sayfa ─────────────────────────────────────────────────────────────────────
export default function FeedPage() {
  const router = useRouter()
  const [favs, setFavs] = useState<Set<number>>(new Set())

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace('/landing')
    })
    try { setFavs(new Set(JSON.parse(localStorage.getItem('foliom_favs')||'[]'))) } catch {}
  }, [router])

  function toggleFav(id: number) {
    setFavs(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem('foliom_favs', JSON.stringify([...next]))
      return next
    })
  }

  return (
    <>
      <style>{`
:root{
  --bg:#f2f3f7;--bg2:#e8eaf0;--surface:#fff;
  --ink:#181c2c;--ink2:#434961;--ink3:#8890aa;--ink4:#b4bacf;
  --navy:#1e3a6e;--navy2:#2e4f91;--navy3:#4169af;--navy-lt:#d6e2f7;--navy-xlt:#edf2fc;
  --crimson:#6b1a34;--crimson2:#8f2448;--crimson3:#b83360;--crimson-lt:#f0d6de;
  --red:#c0392b;--red-lt:#fdecea;
  --line:#dde0e8;--line2:#c8ccd8;
  --shade:rgba(24,28,44,.07);--shade2:rgba(24,28,44,.15);--shade3:rgba(24,28,44,.27);
  --serif:'Cormorant Garamond',Georgia,serif;
  --sans:'Nunito Sans',sans-serif;
  --body-t:'Spectral',Georgia,serif;
  --r-sm:8px;--r-md:14px;--t:.2s ease;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--ink);line-height:1.5;min-height:100vh;-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}
button{font-family:inherit;cursor:pointer;border:none}

/* ── HERO ── */
.hero{position:relative;overflow:hidden;min-height:520px;display:flex;align-items:stretch}
.hero-main{flex:1;position:relative;display:flex;align-items:flex-end;padding:3rem 2.5rem;min-height:520px;cursor:pointer;overflow:hidden}
.hero-main-bg{position:absolute;inset:0;background:linear-gradient(135deg,#1a2e5a 0%,#0d1c3a 40%,#3a0e20 100%);transition:transform .5s ease}
.hero-main:hover .hero-main-bg{transform:scale(1.03)}
.hero-main-pattern{position:absolute;inset:0;opacity:.055;background-image:repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,255,255,.3) 20px,rgba(255,255,255,.3) 21px),repeating-linear-gradient(-45deg,transparent,transparent 20px,rgba(255,255,255,.2) 20px,rgba(255,255,255,.2) 21px)}
.hero-main-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,15,35,.92) 0%,rgba(10,15,35,.35) 55%,transparent 100%)}
.hero-book-deco{position:absolute;right:3rem;top:50%;transform:translateY(-50%);opacity:.09;pointer-events:none}
.hero-book-deco svg{fill:#fff}
.hero-content{position:relative;z-index:1;max-width:560px}
.hero-eyebrow{display:inline-flex;align-items:center;gap:.45rem;background:rgba(255,255,255,.1);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.85);font-size:.7rem;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:.3rem .85rem;border-radius:20px;margin-bottom:1.1rem}
.hero-eyebrow svg{width:12px;height:12px}
.hero-content h1{font-family:var(--serif);font-size:clamp(2.2rem,4.5vw,3.6rem);font-weight:900;line-height:1.1;color:#fff;margin-bottom:.75rem}
.hero-content h1 em{font-style:italic;color:rgba(255,255,255,.78)}
.hero-meta{display:flex;align-items:center;gap:1.25rem;color:rgba(255,255,255,.6);font-size:.78rem;margin-bottom:1.1rem}
.hero-meta strong{color:rgba(255,255,255,.9)}
.hero-dot{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.38)}
.hero-rating{display:flex;align-items:center;gap:.25rem}
.hero-rating svg{width:13px;height:13px;color:#e0c040}
.hero-excerpt{font-family:var(--body-t);font-size:.9rem;color:rgba(255,255,255,.7);line-height:1.7;margin-bottom:1.5rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.hero-actions{display:flex;gap:.75rem;flex-wrap:wrap;align-items:center}
.btn-primary{display:flex;align-items:center;gap:.5rem;background:#fff;color:var(--navy);padding:.65rem 1.5rem;border-radius:var(--r-sm);font-size:.85rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(0,0,0,.25);transition:opacity var(--t)}
.btn-primary svg{width:16px;height:16px}
.btn-primary:hover{opacity:.9}
.btn-ghost-white{display:flex;align-items:center;gap:.5rem;background:rgba(255,255,255,.1);color:rgba(255,255,255,.85);border:1px solid rgba(255,255,255,.25);padding:.65rem 1.2rem;border-radius:var(--r-sm);font-size:.85rem;font-weight:600;cursor:pointer;transition:background var(--t)}
.btn-ghost-white svg{width:16px;height:16px}
.btn-ghost-white:hover{background:rgba(255,255,255,.2)}

/* ── HERO SHELF ── */
.hero-shelf{width:255px;flex-shrink:0;background:#0d1525;display:flex;flex-direction:column;padding:1.25rem;gap:.55rem;overflow:hidden}
.shelf-hd{font-size:.67rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.36);padding-bottom:.75rem;border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;justify-content:space-between}
.shelf-hd a{color:rgba(255,255,255,.45);font-size:.67rem;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:.1rem;transition:color var(--t)}
.shelf-hd a:hover{color:rgba(255,255,255,.75)}
.shelf-hd a svg{width:11px;height:11px}
.shelf-row{display:flex;gap:.7rem;align-items:center;cursor:pointer;padding:.45rem .5rem;border-radius:8px;transition:background var(--t)}
.shelf-row:hover{background:rgba(255,255,255,.06)}
.shelf-cover{width:40px;height:54px;border-radius:5px;flex-shrink:0;overflow:hidden;position:relative}
.shelf-cover-bg{position:absolute;inset:0}
.shelf-cover-lbl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:.52rem;font-style:italic;color:rgba(255,255,255,.75);text-align:center;padding:2px;text-shadow:0 1px 4px rgba(0,0,0,.6)}
.shelf-info{flex:1;min-width:0}
.shelf-title{font-family:var(--serif);font-size:.8rem;font-weight:700;color:rgba(255,255,255,.85);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:.1rem}
.shelf-author{font-size:.67rem;color:rgba(255,255,255,.36)}
.shelf-badge{font-size:.61rem;font-weight:700;padding:.14rem .42rem;border-radius:4px;white-space:nowrap;flex-shrink:0;display:flex;align-items:center;gap:.2rem}
.badge-hot{background:rgba(183,51,96,.28);color:#e8607f}
.badge-new{background:rgba(65,105,175,.28);color:#7aadff}
.badge-done{background:rgba(50,180,100,.18);color:#5de898}

/* ── LAYOUT ── */
.wrap{max-width:1280px;margin:0 auto;padding:0 2rem}
.sh{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:1.25rem}
.sh-title{font-family:var(--serif);font-size:1.5rem;font-weight:700;line-height:1}
.sh-title em{font-style:italic;color:var(--crimson2)}
.sh-sub{font-size:.77rem;color:var(--ink3);margin-top:.22rem}
.sh-btn{display:flex;align-items:center;gap:.2rem;font-size:.78rem;font-weight:700;color:var(--navy2);background:var(--navy-lt);padding:.3rem .7rem .3rem .85rem;border-radius:20px;cursor:pointer;white-space:nowrap;transition:filter var(--t);border:none}
.sh-btn:hover{filter:brightness(.94)}

/* ── CAROUSEL ── */
.carousel{display:flex;gap:1rem;overflow-x:auto;padding-bottom:.75rem;scroll-snap-type:x mandatory;scrollbar-width:thin;scrollbar-color:var(--line2) transparent}
.carousel::-webkit-scrollbar{height:4px}
.carousel::-webkit-scrollbar-thumb{background:var(--line2);border-radius:4px}

/* ── BOOK CARD ── */
.bcard{flex-shrink:0;width:148px;scroll-snap-align:start;cursor:pointer}
.bcard-cover{width:148px;height:210px;border-radius:var(--r-sm);overflow:hidden;position:relative;margin-bottom:.65rem;box-shadow:0 4px 16px var(--shade2);transition:box-shadow var(--t),transform var(--t)}
.bcard:hover .bcard-cover{box-shadow:0 10px 28px var(--shade3);transform:translateY(-4px)}
.bcard-cover-bg{position:absolute;inset:0;transition:transform .35s}
.bcard:hover .bcard-cover-bg{transform:scale(1.06)}
.bcard-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,15,35,.75) 0%,transparent 50%)}
.bcard-badge{position:absolute;top:7px;left:7px;display:flex;align-items:center;gap:.22rem;font-size:.6rem;font-weight:700;letter-spacing:.3px;padding:.17rem .48rem;border-radius:4px;text-transform:uppercase}
.badge-fire{background:rgba(183,51,96,.82);color:#fff}
.badge-sparkle{background:rgba(46,79,145,.85);color:#fff}
.bcard-fav-btn{position:absolute;top:7px;right:7px;background:rgba(0,0,0,.32);backdrop-filter:blur(4px);border:none;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;transition:background var(--t)}
.bcard-fav-btn:hover,.bcard-fav-btn.on{background:var(--crimson2)}
.bcard-cover-title{position:absolute;bottom:0;left:0;right:0;padding:.6rem .5rem;font-family:var(--serif);font-size:.72rem;font-style:italic;font-weight:700;color:rgba(255,255,255,.9);text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.6)}
.bcard-title{font-family:var(--serif);font-size:.88rem;font-weight:700;line-height:1.25;margin-bottom:.2rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bcard-author{font-size:.72rem;color:var(--ink3);margin-bottom:.3rem}
.bcard-stats{display:flex;gap:.55rem;font-size:.68rem;color:var(--ink4);flex-wrap:wrap}
.bcard-stat{display:flex;align-items:center;gap:.2rem}
.bcard-rating{color:#b89010;font-weight:700}

/* ── CAT GRID ── */
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:.75rem}
.cat-card{border-radius:var(--r-md);overflow:hidden;cursor:pointer;position:relative;aspect-ratio:1.65/1;display:flex;align-items:flex-end;padding:.75rem;transition:transform var(--t),box-shadow var(--t)}
.cat-card:hover{transform:translateY(-3px);box-shadow:0 8px 24px var(--shade2)}
.cat-bg{position:absolute;inset:0}
.cat-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,15,35,.78) 0%,rgba(10,15,35,.18) 100%)}
.cat-label{position:relative;z-index:1;font-family:var(--serif);font-size:.95rem;font-weight:700;color:#fff;text-shadow:0 1px 6px rgba(0,0,0,.5);display:flex;align-items:center;gap:.45rem}
.cat-label svg{width:15px;height:15px;flex-shrink:0}
.cat-count{position:absolute;top:8px;right:10px;z-index:1;font-size:.62rem;color:rgba(255,255,255,.62)}

.divider{height:1px;background:var(--line);margin:2.75rem 0}
.section-top{padding-top:3rem}
.section-bottom{padding-bottom:3rem}
footer{background:var(--ink);padding:1.25rem 2.5rem;text-align:center;font-size:.75rem;color:rgba(255,255,255,.32);margin-top:4rem;letter-spacing:.3px}
@keyframes fadeSlide{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.anim{animation:fadeSlide .45s ease both}
.anim-d1{animation-delay:.08s}
.anim-d2{animation-delay:.18s}
.anim-d3{animation-delay:.28s}
@media(max-width:900px){.hero{flex-direction:column}.hero-shelf{width:100%}.hero-main{min-height:420px}}
@media(max-width:600px){.wrap{padding:0 1rem}.hero-main{padding:2rem 1.25rem}}
      `}</style>

      <NavBar activePage="home" />

      {/* ══ HERO ══ */}
      <div className="hero anim">

        {/* Sol büyük panel */}
        <div className="hero-main">
          <div className="hero-main-bg"/>
          <div className="hero-main-pattern"/>
          <div className="hero-main-overlay"/>
          <div className="hero-book-deco">
            <svg width="200" height="290" viewBox="0 0 220 320">
              <rect x="20" y="10" width="150" height="210" rx="4"/>
              <rect x="10" y="15" width="12" height="200" rx="2" opacity=".55"/>
              <line x1="40" y1="58"  x2="150" y2="58"  stroke="rgba(255,255,255,.45)" strokeWidth="1.5"/>
              <line x1="40" y1="78"  x2="150" y2="78"  stroke="rgba(255,255,255,.28)" strokeWidth="1"/>
              <line x1="40" y1="98"  x2="130" y2="98"  stroke="rgba(255,255,255,.2)"  strokeWidth="1"/>
              <line x1="40" y1="118" x2="145" y2="118" stroke="rgba(255,255,255,.18)" strokeWidth="1"/>
              <rect x="40" y="230" width="150" height="210" rx="4" opacity=".22"/>
              <rect x="30" y="235" width="12"  height="200" rx="2" opacity=".1"/>
            </svg>
          </div>
          <div className="hero-content">
            <div className="hero-eyebrow">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"/>
              </svg>
              Haftanın Öne Çıkanı
            </div>
            <h1>Yarım Kalan<br/><em>Mektuplar</em></h1>
            <div className="hero-meta">
              <strong>Zeynep A.</strong>
              <div className="hero-dot"/>
              <span>Romantik · Drama</span>
              <div className="hero-dot"/>
              <span>18 Bölüm</span>
              <div className="hero-dot"/>
              <span className="hero-rating">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006Z" clipRule="evenodd"/>
                </svg>
                4.8
              </span>
            </div>
            <p className="hero-excerpt">
              İki yıl önce ayrıldım ondan. Bavulum hâlâ dolabın en üst rafında duruyor,
              açmaya cesaret edemiyorum — çünkü içinde senin tüm mektupların var.
            </p>
            <div className="hero-actions">
              <button className="btn-primary">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"/>
                </svg>
                Okumaya Başla
              </button>
              <button className="btn-ghost-white">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"/>
                </svg>
                Kitaplığıma Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Sağ mini raf */}
        <div className="hero-shelf">
          <div className="shelf-hd">
            Bu Hafta Trend
            <a href="#">Tümü <ChevR/></a>
          </div>
          {[
            {title:'Gece Yarısı Kütüphanesi',author:'Mert K.',  bg:'#1e3a6e,#6b1a34',lbl:'Gece Yarısı Kütüp.',badge:'hot' as const},
            {title:'Rüzgârın Sesi',          author:'Okan B.',  bg:'#2e4a7a,#6b1a34',lbl:'Rüzgârın Sesi',   badge:'new' as const},
            {title:'Tuzdan Bir Şehir',        author:'Elif D.',  bg:'#3a1a0e,#1e2a4a',lbl:'Tuzdan Bir Şehir',badge:'done' as const},
            {title:'Son Nefes Protokolü',     author:'Berk Y.',  bg:'#1a3a2a,#2a1e4a',lbl:'Son Nefes',       badge:'hot' as const},
            {title:'Kızıl Ormanda',           author:'Deniz Ç.',bg:'#3a0e1e,#0e1a3a',lbl:'Kızıl Ormanda',  badge:'new' as const},
          ].map(item => (
            <div className="shelf-row" key={item.title}>
              <div className="shelf-cover">
                <div className="shelf-cover-bg" style={{background:`linear-gradient(135deg,${item.bg})`}}/>
                <div className="shelf-cover-lbl">{item.lbl}</div>
              </div>
              <div className="shelf-info">
                <div className="shelf-title">{item.title}</div>
                <div className="shelf-author">{item.author}</div>
              </div>
              <span className={`shelf-badge badge-${item.badge}`}>
                {item.badge==='hot'  && <><FireXs/>Sıcak</>}
                {item.badge==='new'  && <><SparkXs/>Yeni</>}
                {item.badge==='done' && <><CheckXs/>Tamam</>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div className="section-top">
        <div className="wrap">

          {/* Çok Okunanlar */}
          <div className="anim anim-d1">
            <div className="sh">
              <div>
                <div className="sh-title">Çok <em>Okunanlar</em></div>
                <div className="sh-sub">Bu ay en fazla okunan hikayeler</div>
              </div>
              <button className="sh-btn">Tümünü Gör <ChevR/></button>
            </div>
            <div className="carousel">
              {hotStories.map(s=><BookCard key={s.id} s={s} type="hot" favs={favs} onToggle={toggleFav}/>)}
            </div>
          </div>

          <div className="divider"/>

          {/* Türe Göre Keşfet */}
          <div className="anim anim-d2">
            <div className="sh">
              <div className="sh-title">Türe Göre <em>Keşfet</em></div>
              <button className="sh-btn">Tüm Türler <ChevR/></button>
            </div>
            <div className="cat-grid">
              {/* Romantik — 2 sütun */}
              <div className="cat-card" style={{gridColumn:'span 2'}}>
                <div className="cat-bg" style={{background:'linear-gradient(135deg,#1e3a6e,#6b1a34)'}}/>
                <div className="cat-overlay"/>
                <div className="cat-label">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/></svg>
                  Romantik
                </div>
                <div className="cat-count">43 hikaye</div>
              </div>
              {[
                {label:'Gizem',      bg:'#1a2844,#3a0e20',count:'28', d:'m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z'},
                {label:'Fantastik',  bg:'#1a3a28,#0e1e3a',count:'35', d:'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z'},
                {label:'Korku',      bg:'#3a1a0e,#1a0e2a',count:'18', d:'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'},
                {label:'Bilim Kurgu',bg:'#0e2a3a,#1e1a3a',count:'21', d:'M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z'},
                {label:'Tarihsel',   bg:'#2a1a0e,#0e1a2a',count:'15', d:'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z'},
                {label:'Drama',      bg:'#1a0e3a,#3a1a2e',count:'30', d:'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5'},
              ].map(cat=>(
                <div className="cat-card" key={cat.label}>
                  <div className="cat-bg" style={{background:`linear-gradient(135deg,${cat.bg})`}}/>
                  <div className="cat-overlay"/>
                  <div className="cat-label">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={cat.d}/>
                    </svg>
                    {cat.label}
                  </div>
                  <div className="cat-count">{cat.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="divider"/>

          {/* Yeni Çıkanlar */}
          <div className="anim anim-d3 section-bottom">
            <div className="sh">
              <div>
                <div className="sh-title">Yeni <em>Çıkanlar</em></div>
                <div className="sh-sub">Son 7 günde eklenen hikayeler</div>
              </div>
              <button className="sh-btn">Tümünü Gör <ChevR/></button>
            </div>
            <div className="carousel">
              {newStories.map(s=><BookCard key={s.id} s={s} type="new" favs={favs} onToggle={toggleFav}/>)}
            </div>
          </div>

        </div>
      </div>

      <footer>© 2026 Foliom. Tüm hakları saklıdır.</footer>
    </>
  )
}
