'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'
import './list.css'

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

export default function ReadingListClient({ listId }: { listId: string }) {
  const router = useRouter()
  const [list, setList] = useState<ReadingList | null>(null)
  const [items, setItems] = useState<ListItem[]>([])
  const [owner, setOwner] = useState<Owner | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!listId) return
    ;(async () => {
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
          Yukleniyor
        </div>
      </>
    )
  }

  if (notFound || !list) {
    return (
      <>
        <NavBar />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2rem', fontWeight: 700 }}>Liste bulunamadi</span>
          <button onClick={() => router.back()} style={{ padding: '.55rem 1.2rem', borderRadius: 8, background: '#2e4f91', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Geri Don</button>
        </div>
      </>
    )
  }

  return (
    <>
      <NavBar />

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
                <span className="list-meta-sep">.</span>
                <span className="list-owner" onClick={() => router.push('/profile/' + owner.id)}>
                  {owner.display_name || owner.username || 'Kullanici'}
                </span>
                <span className="list-meta-sep">tarafindan</span>
              </>
            )}
          </div>
        </div>
      </div>

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
            <div className="empty-panel-title">Bu listede henuz kitap yok</div>
            <div className="empty-panel-sub">Kitap kesfetmek icin ana sayfaya don.</div>
          </div>
        ) : (
          <div className="book-grid">
            {items.map((item, i) => {
              const pair = GRAD_PAIRS[i % GRAD_PAIRS.length]
              return (
                <div key={item.story_id} className="book-card" onClick={() => router.push('/story/' + item.story_id)}>
                  <div className="book-cover">
                    <div
                      className="book-cover-bg"
                      style={item.cover_url ? undefined : { background: 'linear-gradient(155deg,' + pair[0] + ',' + pair[1] + ')' }}
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

      <footer>2026 Foliom. Tum haklari saklidir.</footer>
    </>
  )
}
