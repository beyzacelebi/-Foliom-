'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'

interface ReadingList {
  id: string
  name: string
  description: string | null
  user_id: string
}

interface ListItem {
  story_id: string
  title: string
  genre: string | null
  cover_url: string | null
  view_count: number
}

interface Owner {
  id: string
  display_name: string | null
  username: string | null
}

const GRAD_PAIRS = [
  ['#1a2e5a', '#3a0e20'], ['#0d2a1a', '#1a3a10'], ['#0d1e3a', '#0d3020'],
  ['#1a2a10', '#102010'], ['#1a1040', '#3a1060'], ['#2a1800', '#402808'],
]

export default function ReadingListPage() {
  const params = useParams()
  const router = useRouter()
  const listId = params?.id as string

  const [list, setList] = useState<ReadingList | null>(null)
  const [items, setItems] = useState<ListItem[]>([])
  const [owner, setOwner] = useState<Owner | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!listId) return
    ;(async () => {
      // Listeyi çek
      const { data: listData, error: listErr } = await supabase
        .from('reading_lists')
        .select('id, name, description, user_id')
        .eq('id', listId)
        .single()

      if (listErr || !listData) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setList(listData as ReadingList)

      // Liste öğelerini kitap bilgileriyle birlikte çek
      const { data: itemsData } = await supabase
        .from('reading_list_items')
        .select('story_id, created_at, stories(id, title, genre, cover_url, view_count)')
        .eq('list_id', listId)
        .order('created_at', { ascending: false })

      const parsed: ListItem[] = (itemsData || []).map((row: any) => ({
        story_id: row.story_id,
        title: row.stories?.title || 'Bilinmeyen',
        genre: row.stories?.genre || null,
        cover_url: row.stories?.cover_url || null,
        view_count: row.stories?.view_count || 0,
      }))
      setItems(parsed)

      // Liste sahibinin profilini çek
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .eq('id', listData.user_id)
        .single()
      if (ownerData) setOwner(ownerData as Owner)

      setLoading(false)
    })()
  }, [listId])

  if (loading) {
    return (
      <>
        <NavBar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', color: '#8890aa' }}>
          Yükleniyor…
        </div>
      </>
    )
  }

  if (notFound || !list) {
    return (
      <>
        <NavBar />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2rem', fontWeight: 700 }}>Liste bulunamadı</span>
          <button onClick={() => router.back()} style={{ padding: '.55rem 1.2rem', borderRadius: 8, background: '#2e4f91', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Geri Dön</button>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700&family=Nunito+Sans:opsz,wght@6..12,300;6..12,400;6..12,600;6..12,700&display=swap');
:root{--bg:#f2f3f7;--bg2:#e8eaf0;--surface:#fff;--ink:#181c2c;--ink2:#434961;--ink3:#8890aa;--ink4:#b4bacf;
--navy:#1e3a6e;--navy2:#2e4f91;--navy3:#4169af;--navy-lt:#d6e2f7;--navy-xlt:#edf2fc;
--crimson:#6b1a34;--crimson2:#8f2448;
--line:#dde0e8;--shade:rgba(24,28,44,.07);--shade2:rgba(24,28,44,.15);--shade3:rgba(24,28,44,.27);
--serif:'Cormorant Garamond',Georgia,serif;--sans:'Nunito Sans',sans-serif;--t:.2s ease}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--sans);background:var(--bg);color:var(--ink);line-height:1.5;min-height:100vh;-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}button{font-family:inherit;cursor:pointer;border:none}

.list-hero{background:var(--surface);border-bottom:1px solid var(--line);padding:2.5rem 2.5rem 2rem}
.list-hero-inner{max-width:1080px;margin:0 auto}
.back-btn{display:inline-flex;align-items:center;gap:.4rem;font-size:.8rem;font-weight:700;color:var(--ink3);background:none;border:none;cursor:pointer;padding:0;margin-bottom:1.25rem;transition:color var(--t)}
.back-btn:hover{color:var(--navy2)}
.back-btn svg{width:16px;height:16px}
.list-icon{width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,var(--navy2),var(--crimson2));display:flex;align-items:center;justify-content:center;margin-bottom:1rem}
.list-icon svg{width:26px;height:26px;color:#fff}
.list-title{font-family:var(--serif);font-size:2rem;font-weight:900;line-height:1.15;margin-bottom:.4rem}
.list-desc{font-size:.9rem;color:var(--ink2);margin-bottom:.75rem;max-width:560px}
.list-meta{font-size:.78rem;color:var(--ink3);display:flex;align-items:center;gap:.5rem;flex-wrap:wrap}
.list-meta-sep{opacity:.4}
.list-owner{font-weight:700;color:var(--navy2);cursor:pointer;transition:color var(--t)}
.list-owner:hover{color:var(--crimson2)}

.content-wrap{max-width:1080px;margin:0 auto;padding:2rem 2.5rem 4rem}
.sec-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem}
.sec-title{font-family:var(--serif);font-size:1.35rem;font-weight:900;display:flex;align-items:center;gap:.55rem}
.sec-title-count{font-size:.78rem;font-weight:700;color:var(--ink3)}

.book-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:1.25rem}
.book-card{cursor:pointer}
.book-cover{width:100%;aspect-ratio:2/3;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px var(--shade2);position:relative;margin-bottom:.65rem;transition:transform var(--t),box-shadow var(--t)}
.book-card:hover .book-cover{transform:translateY(-4px);box-shadow:0 10px 28px var(--shade3)}
.book-cover-bg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:.5rem;position:relative;overflow:hidden}
.book-cover-title{font-family:var(--serif);font-size:.95rem;font-weight:900;color:#fff;text-align:center;padding:0 .5rem;line-height:1.2;position:relative;z-index:1}
.book-cover-pattern{position:absolute;inset:0;opacity:.06;background-image:repeating-linear-gradient(45deg,transparent,transparent 15px,rgba(255,255,255,.4) 15px,rgba(255,255,255,.4) 16px),repeating-linear-gradient(-45deg,transparent,transparent 15px,rgba(255,255,255,.3) 15px,rgba(255,255,255,.3) 16px)}
.book-name{font-size:.83rem;font-weight:700;color:var(--ink);margin-bottom:.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.book-meta{font-size:.7rem;color:var(--ink3)}

.empty-panel{text-align:center;padding:4rem 1rem;color:var(--ink3)}
.empty-panel svg{width:48px;height:48px;margin:0 auto 1rem;display:block;opacity:.3}
.empty-panel-title{font-family:var(--serif);font-size:1.1rem;font-weight:900;color:var(--ink2);margin-bottom:.35rem}
.empty-panel-sub{font-size:.82rem}

footer{background:var(--ink);color:rgba(255,255,255,.3);padding:1.5rem 2.5rem;font-size:.78rem;text-align:center;margin-top:auto}

@media(max-width:700px){
  .list-hero{padding:1.5rem 1rem 1.25rem}
  .content-wrap{padding:1.5rem 1rem 3rem}
  .list-title{font-size:1.5rem}
  .book-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}
}
      `}</style>

      <NavBar />

      {/* ── HERO ── */}
      <div className="list-hero">
        <div className="list-hero-inner">
          <button className="back-btn" onClick={() => router.back()}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Geri
          </button>

          <div className="list-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </div>

          <div className="list-title">{list.name}</div>
          {list.description && <div className="list-desc">{list.description}</div>}

          <div className="list-meta">
            <span>{items.length} kitap</span>
            {owner && (
              <>
                <span className="list-meta-sep">·</span>
                <span
                  className="list-owner"
                  onClick={() => router.push(`/profile/${owner.id}`)}
                >
                  {owner.display_name || owner.username || 'Kullanıcı'}
                </span>
                <span className="list-meta-sep">tarafından</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── KİTAPLAR ── */}
      <div className="content-wrap">
        <div className="sec-header">
          <div className="sec-title">
            Kitaplar
            <span className="sec-title-count">{items.length}</span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="empty-panel">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <div className="empty-panel-title">Bu listede henüz kitap yok</div>
            <div className="empty-panel-sub">Kitap keşfetmek için ana sayfaya dön.</div>
          </div>
        ) : (
          <div className="book-grid">
            {items.map((item, i) => {
              const pair = GRAD_PAIRS[i % GRAD_PAIRS.length]
              return (
                <div key={item.story_id} className="book-card" onClick={() => router.push(`/story/${item.story_id}`)}>
                  <div className="book-cover">
                    <div
                      className="book-cover-bg"
                      style={item.cover_url ? undefined : { background: `linear-gradient(155deg,${pair[0]},${pair[1]})` }}
                    >
                      {item.cover_url
                        ? <img src={item.cover_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <><div className="book-cover-pattern" /><div className="book-cover-title">{item.title}</div></>
                      }
                    </div>
                  </div>
                  <div className="book-name">{item.title}</div>
                  <div className="book-meta">{item.genre || ''}</div>
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
