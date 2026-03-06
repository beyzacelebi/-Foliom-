'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'

const GRAD_PAIRS = [
  ['#1a2e5a', '#3a0e20'], ['#0d2a1a', '#1a3a10'], ['#0d1e3a', '#0d3020'],
  ['#1a2a10', '#102010'], ['#1a1040', '#3a1060'], ['#2a1800', '#402808'],
  ['#1a0838', '#2d0850'], ['#0a1828', '#1a2838'],
]

interface Story {
  id: string
  title: string
  genre: string | null
  view_count: number
  cover_url: string | null
  author_id: string
  created_at: string
}

function ExploreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sortParam = searchParams.get('sort') || 'top'

  const [activeSort, setActiveSort] = useState<'top' | 'new'>(sortParam === 'new' ? 'new' : 'top')
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setActiveSort(sortParam === 'new' ? 'new' : 'top')
  }, [sortParam])

  useEffect(() => {
    setLoading(true)
    supabase
      .from('stories')
      .select('id,title,genre,view_count,cover_url,author_id,created_at')
      .eq('is_published', true)
      .order(activeSort === 'top' ? 'view_count' : 'created_at', { ascending: false })
      .then(({ data }) => {
        setStories(data || [])
        setLoading(false)
      })
  }, [activeSort])

  function switchSort(s: 'top' | 'new') {
    setActiveSort(s)
    router.replace(`/explore?sort=${s}`, { scroll: false })
  }

  const filtered = search.trim()
    ? stories.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.genre || '').toLowerCase().includes(search.toLowerCase())
      )
    : stories

  function getGrad(idx: number) {
    const pair = GRAD_PAIRS[idx % GRAD_PAIRS.length]
    return `linear-gradient(155deg,${pair[0]},${pair[1]})`
  }

  function fmtViews(n: number) {
    return n > 999 ? `${(n / 1000).toFixed(1)}K` : String(n)
  }

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;0,900;1,400&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700&display=swap');
:root{
  --bg:#f2f3f7;--bg2:#e8eaf0;--surface:#fff;--ink:#181c2c;--ink2:#434961;--ink3:#8890aa;--ink4:#b4bacf;
  --navy:#1e3a6e;--navy2:#2e4f91;--navy3:#4169af;--navy-lt:#d6e2f7;--navy-xlt:#edf2fc;
  --crimson:#6b1a34;--crimson2:#8f2448;--crimson3:#b83360;--crimson-lt:#f0d6de;
  --line:#dde0e8;--shade:rgba(24,28,44,.07);--shade2:rgba(24,28,44,.15);--shade3:rgba(24,28,44,.27);
  --serif:'Cormorant Garamond',Georgia,serif;--sans:'Nunito Sans',sans-serif;--t:.2s ease
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}button{font-family:inherit;cursor:pointer;border:none}

/* ── PAGE HEADER ── */
.exp-header{background:linear-gradient(135deg,#1a2e5a 0%,#0d1c3a 50%,#3a0e20 100%);padding:3rem 2.5rem 0;position:relative;overflow:hidden}
.exp-header-pattern{position:absolute;inset:0;opacity:.045;background-image:repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,255,255,.4) 20px,rgba(255,255,255,.4) 21px),repeating-linear-gradient(-45deg,transparent,transparent 20px,rgba(255,255,255,.3) 20px,rgba(255,255,255,.3) 21px)}
.exp-header-inner{position:relative;z-index:1;max-width:1080px;margin:0 auto}
.exp-eyebrow{font-size:.68rem;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:.6rem}
.exp-title{font-family:var(--serif);font-size:clamp(2rem,4vw,3rem);font-weight:900;color:#fff;line-height:1.1;margin-bottom:.5rem}
.exp-title em{font-style:italic;color:rgba(255,255,255,.7)}
.exp-sub{font-size:.85rem;color:rgba(255,255,255,.55);margin-bottom:1.75rem}

/* ── SEARCH ── */
.exp-search-wrap{position:relative;max-width:440px;margin-bottom:1.75rem}
.exp-search-ico{position:absolute;left:.85rem;top:50%;transform:translateY(-50%);width:16px;height:16px;color:rgba(255,255,255,.4);pointer-events:none}
.exp-search{width:100%;padding:.65rem 1rem .65rem 2.6rem;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);border-radius:10px;color:#fff;font-size:.85rem;font-family:var(--sans);outline:none;transition:border-color var(--t),background var(--t)}
.exp-search::placeholder{color:rgba(255,255,255,.38)}
.exp-search:focus{border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.16)}

/* ── TABS ── */
.exp-tabs{display:flex;gap:0;border-top:1px solid rgba(255,255,255,.1)}
.exp-tab{padding:.7rem 1.4rem;font-size:.82rem;font-weight:700;color:rgba(255,255,255,.5);background:none;border:none;border-bottom:2.5px solid transparent;cursor:pointer;display:flex;align-items:center;gap:.4rem;margin-bottom:-1px;transition:color var(--t),border-color var(--t);white-space:nowrap}
.exp-tab svg{width:14px;height:14px}
.exp-tab:hover{color:rgba(255,255,255,.8)}
.exp-tab.on{color:#fff;border-bottom-color:#fff}

/* ── CONTENT ── */
.exp-body{max-width:1080px;margin:0 auto;padding:2rem 2.5rem 4rem}

/* ── COUNT BAR ── */
.exp-count{font-size:.78rem;color:var(--ink3);margin-bottom:1.25rem;display:flex;align-items:center;gap:.5rem}
.exp-count strong{color:var(--ink2)}

/* ── GRID ── */
.exp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:1.5rem 1.25rem}

/* ── BOOK CARD ── */
.bc{cursor:pointer}
.bc-cover{width:100%;aspect-ratio:2/3;border-radius:10px;overflow:hidden;position:relative;margin-bottom:.65rem;box-shadow:0 4px 16px var(--shade2);transition:transform var(--t),box-shadow var(--t)}
.bc:hover .bc-cover{transform:translateY(-4px);box-shadow:0 10px 28px var(--shade3)}
.bc-cover-bg{position:absolute;inset:0;transition:transform .35s}
.bc:hover .bc-cover-bg{transform:scale(1.06)}
.bc-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,15,35,.75) 0%,transparent 55%)}
.bc-badge{position:absolute;top:7px;left:7px;display:flex;align-items:center;gap:.22rem;font-size:.6rem;font-weight:700;padding:.17rem .48rem;border-radius:4px;text-transform:uppercase}
.bc-badge svg{width:9px;height:9px}
.badge-fire{background:rgba(183,51,96,.82);color:#fff}
.badge-sparkle{background:rgba(46,79,145,.85);color:#fff}
.bc-rank{position:absolute;top:7px;right:7px;width:22px;height:22px;border-radius:6px;background:rgba(0,0,0,.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-size:.63rem;font-weight:900;color:rgba(255,255,255,.85)}
.bc-cover-title{position:absolute;bottom:0;left:0;right:0;padding:.5rem;font-family:var(--serif);font-size:.72rem;font-style:italic;font-weight:700;color:rgba(255,255,255,.9);text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.6)}
.bc-title{font-family:var(--serif);font-size:.88rem;font-weight:700;line-height:1.25;margin-bottom:.2rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bc-genre{font-size:.72rem;color:var(--ink3);margin-bottom:.25rem}
.bc-stat{display:flex;align-items:center;gap:.22rem;font-size:.68rem;color:var(--ink4)}
.bc-stat svg{width:11px;height:11px}

/* ── EMPTY / LOADING ── */
.exp-empty{text-align:center;padding:4rem 1rem;color:var(--ink3)}
.exp-empty svg{width:48px;height:48px;margin:0 auto 1rem;opacity:.3;display:block}
.exp-empty-title{font-family:var(--serif);font-size:1.1rem;font-weight:900;color:var(--ink2);margin-bottom:.35rem}
.exp-empty-sub{font-size:.82rem}
.exp-skeleton-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:1.5rem 1.25rem}
.skel{border-radius:10px;background:linear-gradient(90deg,var(--bg2) 25%,var(--line) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.skel-cover{aspect-ratio:2/3;border-radius:10px;margin-bottom:.65rem}
.skel-line{height:.65rem;border-radius:4px;margin-bottom:.35rem}
.skel-line.w60{width:60%}
.skel-line.w40{width:40%}

@media(max-width:700px){
  .exp-header{padding:2rem 1rem 0}
  .exp-body{padding:1.5rem 1rem 3rem}
  .exp-search-wrap{max-width:100%}
}
      `}</style>

      <NavBar />

      {/* ── PAGE HEADER ── */}
      <div className="exp-header">
        <div className="exp-header-pattern" />
        <div className="exp-header-inner">
          <div className="exp-eyebrow">Keşfet</div>
          {activeSort === 'top' ? (
            <>
              <div className="exp-title">Çok <em>Okunanlar</em></div>
              <div className="exp-sub">En fazla okunan hikayeler</div>
            </>
          ) : (
            <>
              <div className="exp-title">Yeni <em>Çıkanlar</em></div>
              <div className="exp-sub">Son eklenen hikayeler</div>
            </>
          )}

          {/* Search */}
          <div className="exp-search-wrap">
            <svg className="exp-search-ico" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              className="exp-search"
              type="text"
              placeholder="Başlık veya tür ara…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="exp-tabs">
            <button
              className={`exp-tab${activeSort === 'top' ? ' on' : ''}`}
              onClick={() => switchSort('top')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
              </svg>
              Çok Okunanlar
            </button>
            <button
              className={`exp-tab${activeSort === 'new' ? ' on' : ''}`}
              onClick={() => switchSort('new')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
              </svg>
              Yeni Çıkanlar
            </button>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="exp-body">

        {/* Count bar */}
        {!loading && (
          <div className="exp-count">
            <strong>{filtered.length}</strong> hikaye bulundu
            {search && <span>· &ldquo;{search}&rdquo; için</span>}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="exp-skeleton-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>
                <div className="skel skel-cover" />
                <div className="skel skel-line" />
                <div className="skel skel-line w60" />
                <div className="skel skel-line w40" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="exp-empty">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <div className="exp-empty-title">Sonuç bulunamadı</div>
            <div className="exp-empty-sub">
              {search ? `"${search}" için eşleşen hikaye yok` : 'Henüz yayınlanmış hikaye bulunmuyor'}
            </div>
          </div>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <div className="exp-grid">
            {filtered.map((story, i) => (
              <div key={story.id} className="bc" onClick={() => router.push(`/story/${story.id}`)}>
                <div className="bc-cover">
                  <div
                    className="bc-cover-bg"
                    style={story.cover_url
                      ? { backgroundImage: `url(${story.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                      : { background: getGrad(i) }
                    }
                  />
                  <div className="bc-overlay" />

                  {/* Badge */}
                  {i < 3 && activeSort === 'top' && (
                    <div className="bc-badge badge-fire">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
                      </svg>
                      Trend
                    </div>
                  )}
                  {i < 3 && activeSort === 'new' && (
                    <div className="bc-badge badge-sparkle">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                      </svg>
                      Yeni
                    </div>
                  )}

                  {/* Rank number */}
                  {i < 10 && activeSort === 'top' && (
                    <div className="bc-rank">#{i + 1}</div>
                  )}

                  {!story.cover_url && (
                    <div className="bc-cover-title">{story.title}</div>
                  )}
                </div>

                <div className="bc-title">{story.title}</div>
                {story.genre && <div className="bc-genre">{story.genre}</div>}
                <div className="bc-stat">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  {fmtViews(story.view_count || 0)}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <footer style={{ background: 'var(--ink)', color: 'rgba(255,255,255,.3)', padding: '1.5rem 2.5rem', fontSize: '.78rem', textAlign: 'center' }}>
        © 2025 Foliom. Tüm hakları saklıdır.
      </footer>
    </>
  )
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreContent />
    </Suspense>
  )
}
