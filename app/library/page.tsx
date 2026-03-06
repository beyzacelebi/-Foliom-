'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import NavBar from '@/components/NavBar'

type BookStatus = 'reading' | 'later' | 'done' | 'lists'

interface UserBook {
  story_id: string
  status: BookStatus
  title: string
  genre: string | null
  cover_url: string | null
  created_at: string
}

interface ReadingList {
  id: string
  name: string
  description: string | null
  items: UserBook[]
}

const BADGE = {
  reading: { cls: 'badge-reading', txt: 'Okunuyor' },
  later: { cls: 'badge-later', txt: 'Sonra Oku' },
  done: { cls: 'badge-done', txt: 'Tamamlandı' },
  lists: { cls: 'badge-later', txt: 'Listede' },
}

export default function LibraryPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<BookStatus>('reading')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQ, setSearchQ] = useState('')
  const [books, setBooks] = useState<Record<BookStatus, UserBook[]>>({ reading: [], later: [], done: [], lists: [] })
  const [readingLists, setReadingLists] = useState<ReadingList[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  const fetchBooks = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/auth'); return }
    setUserId(session.user.id)

    const { data, error } = await supabase
      .from('favorites')
      .select('story_id, created_at, stories(id, title, genre, cover_url)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) { console.error(error); setLoading(false); return }

    const items: UserBook[] = (data || []).map((fav: any) => ({
      story_id: fav.story_id,
      status: 'later' as BookStatus,
      title: fav.stories?.title || 'Bilinmeyen',
      genre: fav.stories?.genre || null,
      cover_url: fav.stories?.cover_url || null,
      created_at: fav.created_at,
    }))

    const grouped: Record<BookStatus, UserBook[]> = { reading: [], later: items, done: [], lists: [] }
    setBooks(grouped)

    // Load Reading Lists
    const { data: listData } = await supabase
      .from('reading_lists')
      .select('id, name, description, reading_list_items(story_id, created_at, stories(id, title, genre, cover_url))')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (listData) {
      const parsedLists: ReadingList[] = listData.map((list: any) => ({
        id: list.id,
        name: list.name,
        description: list.description,
        items: (list.reading_list_items || []).map((i: any) => ({
          story_id: i.story_id,
          status: 'lists' as BookStatus,
          title: i.stories?.title || 'Bilinmeyen',
          genre: i.stories?.genre || null,
          cover_url: i.stories?.cover_url || null,
          created_at: i.created_at,
        }))
      }))
      setReadingLists(parsedLists)
    }

    setLoading(false)
  }, [router])

  useEffect(() => { fetchBooks() }, [fetchBooks])

  async function removeBook(storyId: string) {
    if (!userId) return
    const { error } = await supabase.from('favorites').delete().eq('story_id', storyId).eq('user_id', userId)
    if (!error) { fetchBooks(); showToast('Kitap kütüphaneden kaldırıldı') }
  }

  async function removeFromList(listId: string, storyId: string) {
    if (!userId) return
    const { error } = await supabase.from('reading_list_items').delete().eq('list_id', listId).eq('story_id', storyId)
    if (!error) { fetchBooks(); showToast('Kitap listeden kaldırıldı') }
  }

  const filtered = books[activeTab].filter(b =>
    !searchQ || b.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    (b.genre || '').toLowerCase().includes(searchQ.toLowerCase())
  )

  return (
    <>
      <style>{`
:root{--bg:#f2f3f7;--bg2:#e8eaf0;--surface:#fff;--ink:#181c2c;--ink2:#434961;--ink3:#8890aa;--ink4:#b4bacf;
  --navy:#1e3a6e;--navy2:#2e4f91;--navy3:#4169af;--navy-lt:#d6e2f7;--navy-xlt:#edf2fc;
  --crimson:#6b1a34;--crimson2:#8f2448;--crimson3:#b83360;--crimson-lt:#f0d6de;
  --green:#1b6b3a;--green-lt:#e6f7ed;--amber:#c47a0a;--amber-lt:#fef3dc;
  --line:#dde0e8;--shade:rgba(24,28,44,.07);--shade2:rgba(24,28,44,.13);
  --serif:'Cormorant Garamond',Georgia,serif;--sans:'Nunito Sans',sans-serif;--t:.2s ease}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--sans);background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}button{font-family:inherit;cursor:pointer;border:none;background:none}
.page-wrap{max-width:1100px;margin:0 auto;padding:2rem 2.5rem 5rem}
.page-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:1.75rem;flex-wrap:wrap;gap:1rem}
.page-title{font-family:var(--serif);font-size:2rem;font-weight:900;margin-bottom:.2rem}
.page-sub{font-size:.83rem;color:var(--ink3)}
.stats-banner{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.75rem;margin-bottom:2rem}
.stat-card{background:var(--surface);border:1px solid var(--line);border-radius:12px;padding:.95rem 1rem;display:flex;flex-direction:column;gap:.15rem}
.stat-card-num{font-family:var(--serif);font-size:1.6rem;font-weight:900;background:linear-gradient(135deg,var(--navy2),var(--crimson2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.stat-card-lbl{font-size:.71rem;color:var(--ink3);font-weight:600}
.lib-tabs{display:flex;gap:0;border-bottom:1px solid var(--line);margin-bottom:1.75rem;overflow-x:auto}
.lib-tabs::-webkit-scrollbar{display:none}
.lt{padding:.68rem 1.1rem;font-size:.81rem;font-weight:700;color:var(--ink3);border-bottom:2.5px solid transparent;cursor:pointer;white-space:nowrap;transition:all var(--t);display:flex;align-items:center;gap:.4rem;margin-bottom:-1px;background:none;border-top:none;border-left:none;border-right:none}
.lt svg{width:15px;height:15px}.lt:hover{color:var(--ink2)}.lt.on{color:var(--navy2);border-bottom-color:var(--navy2)}
.lt-cnt{font-size:.63rem;font-weight:800;padding:.07rem .4rem;border-radius:20px;background:var(--bg2);color:var(--ink3)}
.lt.on .lt-cnt{background:var(--navy-lt);color:var(--navy2)}
.toolbar-row{display:flex;align-items:center;gap:.65rem;margin-bottom:1.35rem;flex-wrap:wrap}
.search-wrap{flex:1;min-width:180px;position:relative;max-width:340px}
.search-inp{width:100%;height:36px;background:var(--surface);border:1.5px solid var(--line);border-radius:9px;padding:0 1rem 0 2.4rem;font-family:var(--sans);font-size:.81rem;color:var(--ink);outline:none;transition:border-color var(--t)}
.search-inp:focus{border-color:var(--navy3)}
.search-ico{position:absolute;left:.65rem;top:50%;transform:translateY(-50%);width:14px;height:14px;color:var(--ink4);pointer-events:none}
.view-btns{display:flex;gap:.3rem;margin-left:auto}
.vbtn{width:32px;height:32px;border-radius:7px;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--ink3);transition:all var(--t)}
.vbtn:hover{border-color:var(--navy3);color:var(--navy2)}.vbtn.on{background:var(--navy-xlt);border-color:var(--navy-lt);color:var(--navy2)}.vbtn svg{width:14px;height:14px}
.book-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:1.25rem}
.bcard{cursor:pointer}
.bcard-cover{width:100%;aspect-ratio:2/3;border-radius:11px;overflow:hidden;box-shadow:0 4px 16px var(--shade2);position:relative;margin-bottom:.65rem;transition:transform var(--t),box-shadow var(--t)}
.bcard:hover .bcard-cover{transform:translateY(-5px);box-shadow:0 12px 30px rgba(24,28,44,.18)}
.bcard-cover-inner{width:100%;height:100%;display:flex;align-items:flex-end;padding:.65rem;position:relative}
.bcard-pattern{position:absolute;inset:0;opacity:.055;background-image:repeating-linear-gradient(45deg,transparent,transparent 18px,rgba(255,255,255,.4) 18px,rgba(255,255,255,.4) 19px)}
.bcard-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,.72) 0%,transparent 55%)}
.bcard-title-on-cover{font-family:var(--serif);font-size:.88rem;font-weight:900;color:#fff;line-height:1.2;position:relative;z-index:1}
.bcard-status-badge{position:absolute;top:.55rem;left:.55rem;font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.4px;backdrop-filter:blur(4px);z-index:2;padding:.18rem .5rem;border-radius:4px}
.badge-reading{background:rgba(46,79,145,.85);color:#fff}.badge-later{background:rgba(196,122,10,.85);color:#fff}.badge-done{background:rgba(27,107,58,.85);color:#fff}
.bcard-progress-wrap{height:3px;background:var(--line);border-radius:2px;margin:.5rem 0 .2rem;overflow:hidden}
.bcard-progress{height:100%;background:linear-gradient(to right,var(--navy2),var(--crimson2));border-radius:2px}
.bcard-name{font-size:.83rem;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:.12rem}
.bcard-author{font-size:.7rem;color:var(--ink3)}.bcard-pct{font-size:.68rem;font-weight:700;color:var(--navy2)}
.book-list{display:flex;flex-direction:column;gap:.65rem}
.brow{background:var(--surface);border:1px solid var(--line);border-radius:13px;padding:.95rem 1.1rem;display:flex;align-items:center;gap:1rem;cursor:pointer;transition:box-shadow var(--t),border-color var(--t)}
.brow:hover{box-shadow:0 4px 18px var(--shade2);border-color:var(--navy-lt)}
.brow-thumb{width:38px;height:55px;border-radius:7px;flex-shrink:0;overflow:hidden;box-shadow:0 2px 8px var(--shade2)}
.brow-body{flex:1;min-width:0}.brow-top{display:flex;align-items:center;gap:.55rem;margin-bottom:.25rem;flex-wrap:wrap}
.brow-name{font-size:.9rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brow-badge{font-size:.6rem;font-weight:800;text-transform:uppercase;letter-spacing:.4px;padding:.14rem .5rem;border-radius:5px;flex-shrink:0}
.brow-author{font-size:.73rem;color:var(--ink3);margin-bottom:.45rem}
.brow-progress-wrap{height:4px;background:var(--line);border-radius:2px;overflow:hidden;max-width:320px}
.brow-progress{height:100%;background:linear-gradient(to right,var(--navy2),var(--crimson2));border-radius:2px}
.brow-prog-info{display:flex;gap:1rem;margin-top:.3rem;font-size:.7rem;color:var(--ink3)}
.brow-prog-info strong{color:var(--ink2);font-weight:700}
.brow-right{flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:.45rem}
.brow-action{display:flex;gap:.35rem}
.brow-btn{width:30px;height:30px;border-radius:7px;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--ink3);transition:all var(--t)}
.brow-btn:hover{border-color:var(--navy3);color:var(--navy2);background:var(--navy-xlt)}
.brow-btn.del:hover{border-color:var(--crimson3);color:var(--crimson2);background:var(--crimson-lt)}.brow-btn svg{width:14px;height:14px}
.brow-continue{padding:.32rem .8rem;border-radius:7px;font-size:.73rem;font-weight:800;background:linear-gradient(135deg,var(--navy2),var(--crimson2));color:#fff;border:none;transition:opacity var(--t);white-space:nowrap}
.brow-continue:hover{opacity:.88}
.empty-lib{text-align:center;padding:4.5rem 2rem}
.empty-ico{width:72px;height:72px;margin:0 auto 1.1rem;border-radius:18px;background:var(--bg2);display:flex;align-items:center;justify-content:center}
.empty-ico svg{width:30px;height:30px;color:var(--ink4)}
.empty-lib h3{font-family:var(--serif);font-size:1.3rem;font-weight:900;margin-bottom:.4rem}
.empty-lib p{font-size:.83rem;color:var(--ink3);max-width:300px;margin:0 auto 1.25rem;line-height:1.65}
.empty-lib-btn{display:inline-flex;align-items:center;gap:.4rem;padding:.52rem 1.1rem;border-radius:9px;font-size:.82rem;font-weight:700;background:linear-gradient(135deg,var(--navy2),var(--crimson2));color:#fff;border:none;box-shadow:0 2px 10px rgba(30,58,110,.25);transition:opacity var(--t)}
.empty-lib-btn:hover{opacity:.88}.empty-lib-btn svg{width:14px;height:14px}
.toast{position:fixed;bottom:1.75rem;left:50%;transform:translateX(-50%);background:rgba(24,28,44,.95);color:#fff;padding:.55rem 1.15rem;border-radius:10px;font-size:.79rem;font-weight:600;display:flex;align-items:center;gap:.45rem;box-shadow:0 6px 24px rgba(0,0,0,.28);z-index:700;pointer-events:none}
.toast svg{width:14px;height:14px;color:#5de898}
.list-section-title{font-family:var(--serif);font-size:1.4rem;font-weight:900;color:var(--navy);margin-bottom:.4rem;padding-bottom:.4rem;border-bottom:1px solid var(--line);margin-top:2rem}
.list-section-desc{font-size:.82rem;color:var(--ink3);margin-bottom:1rem}
footer{background:var(--ink);color:rgba(255,255,255,.3);padding:1.5rem 2.5rem;font-size:.78rem;text-align:center}
@media(max-width:640px){.page-wrap{padding:1.5rem 1rem 4rem}}
`}</style>

      <NavBar activePage="library" />

      <div className="page-wrap">

        <div className="page-header">
          <div>
            <div className="page-title">Kütüphanem</div>
            <div className="page-sub">Tüm kitap listelerin ve okuma geçmişin</div>
          </div>
        </div>

        {/* İstatistikler */}
        <div className="stats-banner">
          {[
            { num: books.reading.length + books.later.length + books.done.length, lbl: 'Toplam Kitap' },
            { num: readingLists.length, lbl: 'Okuma Listeleri' },
            { num: books.done.length, lbl: 'Tamamlanan' },
            { num: books.later.length, lbl: 'Sonra Okuyacak' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div className="stat-card-num">{s.num}</div>
              <div className="stat-card-lbl">{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Sekmeler */}
        <div className="lib-tabs">
          {([
            { id: 'reading' as BookStatus, label: 'Şu An Okuyorum', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /> },
            { id: 'later' as BookStatus, label: 'Sonra Oku', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /> },
            { id: 'done' as BookStatus, label: 'Tamamlananlar', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /> },
            { id: 'lists' as BookStatus, label: 'Okuma Listelerim', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /> },
          ] as const).map(tab => (
            <button
              key={tab.id}
              className={`lt${activeTab === tab.id ? ' on' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                {tab.icon}
              </svg>
              {tab.label}
              <span className="lt-cnt">{books[tab.id].length}</span>
            </button>
          ))}
        </div>

        {/* Araç çubuğu */}
        <div className="toolbar-row">
          <div className="search-wrap">
            <svg className="search-ico" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              className="search-inp"
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Kütüphaneni ara…"
            />
          </div>
          <div className="view-btns" style={{ marginLeft: 'auto' }}>
            <button className={`vbtn${viewMode === 'grid' ? ' on' : ''}`} onClick={() => setViewMode('grid')} title="Grid görünüm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
              </svg>
            </button>
            <button className={`vbtn${viewMode === 'list' ? ' on' : ''}`} onClick={() => setViewMode('list')} title="Liste görünüm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </button>
          </div>
        </div>

        {/* İçerik */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--ink3)' }}>Yükleniyor…</div>
        ) : activeTab === 'lists' ? (
          readingLists.length === 0 ? (
            <div className="empty-lib">
              <div className="empty-ico">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
              </div>
              <h3>Henüz Okuma Listeniz Yok</h3>
              <p>Profilinizden yeni bir okuma listesi oluşturabilirsiniz.</p>
              <button className="empty-lib-btn" onClick={() => router.push('/profile')}>
                Profilime Git
              </button>
            </div>
          ) : (
            <div>
              {readingLists.map(list => {
                const listItemsFiltered = list.items.filter(b =>
                  !searchQ || b.title.toLowerCase().includes(searchQ.toLowerCase()) ||
                  (b.genre || '').toLowerCase().includes(searchQ.toLowerCase())
                )

                return (
                  <div key={list.id} style={{ marginBottom: '3rem' }}>
                    <div className="list-section-title">{list.name}</div>
                    {list.description && <div className="list-section-desc">{list.description}</div>}

                    {listItemsFiltered.length === 0 ? (
                      <div style={{ padding: '2rem 1rem', color: 'var(--ink4)', fontSize: '.8rem', fontStyle: 'italic' }}>
                        Bu listede kitap yok.
                      </div>
                    ) : viewMode === 'grid' ? (
                      <div className="book-grid">
                        {listItemsFiltered.map(b => {
                          const bd = BADGE.lists
                          return (
                            <div key={b.story_id} className="bcard">
                              <div className="bcard-cover" onClick={() => router.push(`/story/${b.story_id}`)}>
                                <div className="bcard-cover-inner" style={b.cover_url ? { padding: 0 } : { background: 'linear-gradient(155deg,#1a2e5a,#6b1a34)' }}>
                                  {b.cover_url
                                    ? <img src={b.cover_url} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <>
                                      <div className="bcard-pattern" />
                                      <div className="bcard-overlay" />
                                      <div className="bcard-title-on-cover">{b.title}</div>
                                    </>
                                  }
                                </div>
                                <div className={`bcard-status-badge ${bd.cls}`}>{bd.txt}</div>
                              </div>
                              <div className="bcard-name" title={b.title}>{b.title}</div>
                              <div className="bcard-author">{b.genre || ''}</div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="book-list">
                        {listItemsFiltered.map(b => {
                          const bd = BADGE.lists
                          return (
                            <div key={b.story_id} className="brow">
                              <div className="brow-thumb" onClick={() => router.push(`/story/${b.story_id}`)}>
                                {b.cover_url
                                  ? <img src={b.cover_url} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(155deg,#1a2e5a,#6b1a34)' }} />
                                }
                              </div>
                              <div className="brow-body" onClick={() => router.push(`/story/${b.story_id}`)}>
                                <div className="brow-top">
                                  <div className="brow-name">{b.title}</div>
                                  <span className={`brow-badge ${bd.cls}`}>{bd.txt}</span>
                                </div>
                                <div className="brow-author">{b.genre || ''}</div>
                              </div>
                              <div className="brow-right">
                                <div className="brow-action">
                                  <button className="brow-btn del" title="Listeden Kaldır" onClick={() => removeFromList(list.id, b.story_id)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                    </svg>
                                  </button>
                                </div>
                                <button className="brow-continue" onClick={() => router.push(`/story/${b.story_id}`)}>
                                  Okumaya Başla
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )
        ) : filtered.length === 0 ? (
          <div className="empty-lib">
            <div className="empty-ico">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3>{searchQ ? 'Kitap bulunamadı' : 'Bu listede henüz kitap yok'}</h3>
            <p>{searchQ ? 'Farklı bir arama dene.' : 'Keşfet bölümünden kitap ekleyebilirsin.'}</p>
            <button className="empty-lib-btn" onClick={() => router.push('/search')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              Kitap Keşfet
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="book-grid">
            {filtered.map(b => {
              const bd = BADGE[activeTab]
              return (
                <div key={b.story_id} className="bcard">
                  <div className="bcard-cover" onClick={() => router.push(`/story/${b.story_id}`)}>
                    <div className="bcard-cover-inner" style={b.cover_url ? { padding: 0 } : { background: 'linear-gradient(155deg,#1a2e5a,#6b1a34)' }}>
                      {b.cover_url
                        ? <img src={b.cover_url} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <>
                          <div className="bcard-pattern" />
                          <div className="bcard-overlay" />
                          <div className="bcard-title-on-cover">{b.title}</div>
                        </>
                      }
                    </div>
                    <div className={`bcard-status-badge ${bd.cls}`}>{bd.txt}</div>
                  </div>
                  <div className="bcard-name" title={b.title}>{b.title}</div>
                  <div className="bcard-author">{b.genre || ''}</div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="book-list">
            {filtered.map(b => {
              const bd = BADGE[activeTab]
              return (
                <div key={b.story_id} className="brow">
                  <div className="brow-thumb">
                    {b.cover_url
                      ? <img src={b.cover_url} alt={b.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(155deg,#1a2e5a,#6b1a34)' }} />
                    }
                  </div>
                  <div className="brow-body">
                    <div className="brow-top">
                      <div className="brow-name">{b.title}</div>
                      <span className={`brow-badge ${bd.cls}`}>{bd.txt}</span>
                    </div>
                    <div className="brow-author">{b.genre || ''}</div>
                  </div>
                  <div className="brow-right">
                    <div className="brow-action">
                      <button className="brow-btn del" title="Kütüphaneden Kaldır" onClick={() => removeBook(b.story_id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      </button>
                    </div>
                    <button className="brow-continue" onClick={() => router.push(`/story/${b.story_id}`)}>
                      Okumaya Başla
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {toast && (
        <div className="toast">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          {toast}
        </div>
      )}

      <footer>© 2026 Foliom. Tüm hakları saklıdır.</footer>
    </>
  )
}
