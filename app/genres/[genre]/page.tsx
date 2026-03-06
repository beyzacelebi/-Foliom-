'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'

interface Story {
  id: string
  title: string
  genre: string | null
  cover_url: string | null
  view_count: number
}

const GRAD_PAIRS = [
  ['#1a2e5a', '#3a0e20'], ['#0d2a1a', '#1a3a10'], ['#0d1e3a', '#0d3020'],
  ['#1a2a10', '#102010'], ['#1a1040', '#3a1060'], ['#2a1800', '#402808'],
]

export default function GenrePage() {
  const params = useParams()
  const router = useRouter()
  const genre = decodeURIComponent(params?.genre as string || '')
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!genre) return
    supabase
      .from('stories')
      .select('id, title, genre, cover_url, view_count')
      .ilike('genre', `%${genre}%`)
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .then(({ data }) => {
        setStories(data || [])
        setLoading(false)
      })
  }, [genre])

  function fmtViews(n: number) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return String(n)
  }

  return (
    <>
      <style>{`
:root{--bg:#f2f3f7;--bg2:#e8eaf0;--surface:#fff;--ink:#181c2c;--ink2:#434961;--ink3:#8890aa;--ink4:#b4bacf;
--navy:#1e3a6e;--navy2:#2e4f91;--navy3:#4169af;--navy-lt:#d6e2f7;--navy-xlt:#edf2fc;
--crimson:#6b1a34;--crimson2:#8f2448;--line:#dde0e8;--shade:rgba(24,28,44,.07);--shade2:rgba(24,28,44,.15);--shade3:rgba(24,28,44,.27);
--serif:'Cormorant Garamond',Georgia,serif;--sans:'Nunito Sans',sans-serif;--t:.2s ease}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--sans);background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}button{font-family:inherit;cursor:pointer;border:none;background:none}

.genre-hero{background:linear-gradient(135deg,#0d1c3a 0%,#1a2e5a 50%,#3a0e20 100%);padding:3rem 2.5rem 2.5rem;position:relative;overflow:hidden}
.genre-hero::after{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='60' x2='60' y2='0' stroke='rgba(255,255,255,.04)' stroke-width='1'/%3E%3C/svg%3E")}
.genre-hero-inner{position:relative;z-index:1;max-width:1200px;margin:0 auto}
.genre-back{display:inline-flex;align-items:center;gap:.4rem;color:rgba(255,255,255,.6);font-size:.78rem;font-weight:600;cursor:pointer;margin-bottom:1.5rem;transition:color .2s}
.genre-back:hover{color:#fff}
.genre-back svg{width:15px;height:15px}
.genre-title{font-family:var(--serif);font-size:clamp(2rem,5vw,3.2rem);font-weight:900;color:#fff;margin-bottom:.35rem}
.genre-sub{font-size:.82rem;color:rgba(255,255,255,.55)}

.page-wrap{max-width:1200px;margin:0 auto;padding:2.5rem 2rem 5rem}
.book-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:1.4rem}
.bcard{cursor:pointer}
.bcard-cover{width:100%;aspect-ratio:2/3;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px var(--shade2);position:relative;margin-bottom:.65rem;transition:transform var(--t),box-shadow var(--t)}
.bcard:hover .bcard-cover{transform:translateY(-4px);box-shadow:0 10px 28px var(--shade3)}
.bcard-cover-inner{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:.6rem}
.bcard-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 55%)}
.bcard-title-on{font-family:var(--serif);font-size:.78rem;font-weight:700;color:#fff;line-height:1.25;position:relative;z-index:1;text-shadow:0 1px 4px rgba(0,0,0,.6)}
.bcard-name{font-family:var(--serif);font-size:.88rem;font-weight:700;margin-bottom:.18rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bcard-meta{font-size:.7rem;color:var(--ink3)}
.empty{text-align:center;padding:5rem 2rem;color:var(--ink3)}
.empty-icon{width:56px;height:56px;margin:0 auto 1rem;display:block;opacity:.3}
.empty h3{font-family:var(--serif);font-size:1.4rem;font-weight:900;margin-bottom:.4rem;color:var(--ink2)}
footer{background:var(--ink);color:rgba(255,255,255,.3);padding:1.25rem 2rem;font-size:.75rem;text-align:center}
@media(max-width:600px){.genre-hero{padding:2rem 1.25rem 2rem}.page-wrap{padding:1.5rem 1rem 4rem}.book-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}}
      `}</style>

      <NavBar />

      <div className="genre-hero">
        <div className="genre-hero-inner">
          <div className="genre-back" onClick={() => router.back()}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Geri Dön
          </div>
          <div className="genre-title">{genre}</div>
          <div className="genre-sub">
            {loading ? 'Yükleniyor…' : `${stories.length} kitap bulundu`}
          </div>
        </div>
      </div>

      <div className="page-wrap">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink3)', fontFamily: 'var(--serif)', fontSize: '1.1rem' }}>Yükleniyor…</div>
        ) : stories.length === 0 ? (
          <div className="empty">
            <svg className="empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <h3>Bu türde kitap bulunamadı</h3>
            <p>&ldquo;{genre}&rdquo; türünde henüz yayınlanmış kitap yok.</p>
          </div>
        ) : (
          <div className="book-grid">
            {stories.map((s, i) => {
              const pair = GRAD_PAIRS[i % GRAD_PAIRS.length]
              return (
                <div key={s.id} className="bcard" onClick={() => router.push(`/story/${s.id}`)}>
                  <div className="bcard-cover">
                    <div
                      className="bcard-cover-inner"
                      style={s.cover_url
                        ? { backgroundImage: `url(${s.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center', padding: 0 }
                        : { background: `linear-gradient(155deg,${pair[0]},${pair[1]})` }
                      }
                    >
                      {!s.cover_url && (
                        <>
                          <div className="bcard-overlay" />
                          <div className="bcard-title-on">{s.title}</div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="bcard-name">{s.title}</div>
                  <div className="bcard-meta">{s.view_count > 0 ? fmtViews(s.view_count) + ' okuma' : ''}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <footer>© 2026 Foliom. Tüm hakları saklıdır.</footer>
    </>
  )
}
