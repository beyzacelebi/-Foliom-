'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'
import './genre.css'

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

export default function GenrePageClient({ genre }: { genre: string }) {
  const router = useRouter()
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!genre) return
    supabase
      .from('stories')
      .select('id, title, genre, cover_url, view_count')
      .ilike('genre', '%' + genre + '%')
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

  const subText = loading ? 'Yukleniyor' : stories.length + ' kitap bulundu'

  return (
    <>
      <NavBar />

      <div className="genre-hero">
        <div className="genre-hero-inner">
          <div className="genre-back" onClick={() => router.back()}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Geri Don
          </div>
          <div className="genre-title">{genre}</div>
          <div className="genre-sub">{subText}</div>
        </div>
      </div>

      <div className="page-wrap">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink3)', fontFamily: 'var(--serif)', fontSize: '1.1rem' }}>Yukleniyor</div>
        ) : stories.length === 0 ? (
          <div className="empty">
            <svg className="empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
            <h3>Bu turde kitap bulunamadi</h3>
            <p>{genre} turunde henuz yayinlanmis kitap yok.</p>
          </div>
        ) : (
          <div className="book-grid">
            {stories.map((s, i) => {
              const pair = GRAD_PAIRS[i % GRAD_PAIRS.length]
              return (
                <div key={s.id} className="bcard" onClick={() => router.push('/story/' + s.id)}>
                  <div className="bcard-cover">
                    <div
                      className="bcard-cover-inner"
                      style={s.cover_url
                        ? { backgroundImage: 'url(' + s.cover_url + ')', backgroundSize: 'cover', backgroundPosition: 'center', padding: 0 }
                        : { background: 'linear-gradient(155deg,' + pair[0] + ',' + pair[1] + ')' }
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

      <footer>2026 Foliom. Tum haklari saklidir.</footer>
    </>
  )
}
