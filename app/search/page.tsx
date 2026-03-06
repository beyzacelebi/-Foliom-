'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'

const GRAD_PAIRS = [
  ['#1a2e5a', '#3a0e20'], ['#0d2a1a', '#1a3a10'], ['#0d1e3a', '#0d3020'],
  ['#1a2a10', '#102010'], ['#1a1040', '#3a1060'], ['#2a1800', '#402808'],
  ['#1a0838', '#2d0850'], ['#0a1828', '#1a2838'],
]

const AVA_GRADS = [
  'linear-gradient(135deg,#1e3a6e,#6b1a34)',
  'linear-gradient(135deg,#1a3a28,#0e1e3a)',
  'linear-gradient(135deg,#3a1a0e,#1a0e2a)',
  'linear-gradient(135deg,#0e2a3a,#1e1a3a)',
]

const GENRES = [
  { id: 'all', label: 'Tümü' },
  { id: 'roman', label: 'Roman' },
  { id: 'romantik', label: 'Romantik' },
  { id: 'genclik', label: 'Gençlik' },
  { id: 'gizem', label: 'Gizem' },
  { id: 'korku', label: 'Korku' },
  { id: 'gerilim', label: 'Gerilim' },
  { id: 'bilimkurgu', label: 'Bilim Kurgu' },
  { id: 'fantastik', label: 'Fantastik' },
  { id: 'tarih', label: 'Tarihî' },
  { id: 'macera', label: 'Macera' },
  { id: 'psikolojik', label: 'Psikolojik' },
  { id: 'siir', label: 'Şiir' },
]

const GENRE_CARDS = [
  { id: 'romantik', name: 'Romantik', grad: ['#5a0a28', '#8f2448'], icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg> },
  { id: 'gizem', name: 'Gizem', grad: ['#1a1040', '#3a1060'], icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg> },
  { id: 'korku', name: 'Korku', grad: ['#0a0a14', '#1a0820'], icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg> },
  { id: 'bilimkurgu', name: 'Bilim Kurgu', grad: ['#081830', '#0a2040'], icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg> },
  { id: 'genclik', name: 'Gençlik', grad: ['#0a2810', '#1a4020'], icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg> },
  { id: 'tarih', name: 'Tarihî', grad: ['#2a1800', '#402808'], icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" /></svg> },
  { id: 'fantastik', name: 'Fantastik', grad: ['#1a0838', '#2d0850'], icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg> },
  { id: 'psikolojik', name: 'Psikolojik', grad: ['#0a1828', '#1a2838'], icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg> },
]

type SortKey = 'pop' | 'new' | 'az'
type StatusFilter = 'all' | 'ongoing' | 'done'

interface Story {
  id: string; title: string; genre: string | null;
  view_count: number; cover_url: string | null;
  status: string | null; created_at: string;
}

interface Author {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  story_count?: number
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase()
  return parts[0]?.[0]?.toUpperCase() || '?'
}

export default function SearchPage() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [genre, setGenre] = useState('all')
  const [sort, setSort] = useState<SortKey>('pop')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [resultTab, setResultTab] = useState<'books' | 'authors'>('books')
  const [advOpen, setAdvOpen] = useState(false)

  const [stories, setStories] = useState<Story[]>([])
  const [authors, setAuthors] = useState<Author[]>([])
  const [discoverAuthors, setDiscoverAuthors] = useState<Author[]>([])
  const [loadingStories, setLoadingStories] = useState(true)
  const [loadingAuthors, setLoadingAuthors] = useState(false)

  const hasFilter = q.length > 0 || genre !== 'all' || statusFilter !== 'all'

  // İlk yükleme: kitaplar
  useEffect(() => {
    supabase
      .from('stories')
      .select('id,title,genre,view_count,cover_url,status,created_at')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .then(({ data }) => { setStories(data || []); setLoadingStories(false) })
  }, [])

  // Keşfet modu: popüler yazarlar
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id,display_name,username,avatar_url,bio')
      .not('display_name', 'is', null)
      .limit(8)
      .then(({ data }) => setDiscoverAuthors((data || []) as Author[]))
  }, [])

  // Arama: yazarlar
  const searchAuthors = useCallback(async (query: string) => {
    if (!query) { setAuthors([]); return }
    setLoadingAuthors(true)
    const { data } = await supabase
      .from('profiles')
      .select('id,display_name,username,avatar_url,bio')
      .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(20)
    setAuthors((data || []) as Author[])
    setLoadingAuthors(false)
  }, [])

  useEffect(() => {
    if (q) searchAuthors(q)
    else setAuthors([])
  }, [q, searchAuthors])

  function doSearch(val: string) {
    const trimmed = val.trim()
    setQ(trimmed.toLowerCase())
    setInputVal(val)
  }

  function filterByGenre(g: string) {
    setGenre(g)
    if (g !== 'all') { setQ(''); setInputVal('') }
    window.scrollTo({ top: 280, behavior: 'smooth' })
  }

  const filteredBooks = stories.filter(s => {
    const matchQ = !q || s.title.toLowerCase().includes(q) || (s.genre || '').toLowerCase().includes(q)
    const matchGenre = genre === 'all' || (s.genre || '').toLowerCase().replace(/\s+/g, '') === genre ||
      (s.genre || '').toLowerCase().includes(genre)
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'ongoing' && (!s.status || s.status === 'published')) ||
      (statusFilter === 'done' && s.status === 'completed')
    return matchQ && matchGenre && matchStatus
  }).sort((a, b) => {
    if (sort === 'new') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sort === 'az') return a.title.localeCompare(b.title, 'tr')
    return (b.view_count || 0) - (a.view_count || 0)
  })

  function fmtViews(n: number) {
    return n > 999 ? `${(n / 1000).toFixed(1)}K` : String(n)
  }

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,700;0,900;1,400&family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700&family=Spectral:ital,wght@0,400;1,400&display=swap');
:root{
  --bg:#f2f3f7;--bg2:#e8eaf0;--surface:#fff;--ink:#181c2c;--ink2:#434961;--ink3:#8890aa;--ink4:#b4bacf;
  --navy:#1e3a6e;--navy2:#2e4f91;--navy3:#4169af;--navy-lt:#d6e2f7;--navy-xlt:#edf2fc;
  --crimson:#6b1a34;--crimson2:#8f2448;--crimson3:#b83360;--crimson-lt:#f0d6de;
  --green:#1b6b3a;--green-lt:#e6f7ed;
  --line:#dde0e8;--shade:rgba(24,28,44,.07);--shade2:rgba(24,28,44,.13);--shade3:rgba(24,28,44,.22);
  --serif:'Cormorant Garamond',Georgia,serif;--sans:'Nunito Sans',sans-serif;--body-t:'Spectral',Georgia,serif;--t:.2s ease
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}button{font-family:inherit;cursor:pointer;border:none;background:none}

/* ── HERO ── */
.search-hero{position:relative;background:linear-gradient(135deg,#0d1c3a 0%,#1a2e5a 45%,#2a0e20 100%);padding:3.5rem 2.5rem 4rem;overflow:hidden;text-align:center}
.sh-deco{position:absolute;border-radius:50%;opacity:.12}
.sh-deco-1{width:320px;height:320px;background:radial-gradient(circle,var(--navy3),transparent 70%);top:-80px;left:-60px}
.sh-deco-2{width:280px;height:280px;background:radial-gradient(circle,var(--crimson2),transparent 70%);bottom:-80px;right:-40px}
.sh-deco-3{width:200px;height:200px;background:radial-gradient(circle,#4a2080,transparent 70%);top:20%;right:15%}
.sh-inner{position:relative;max-width:640px;margin:0 auto}
.sh-eyebrow{display:inline-flex;align-items:center;gap:.4rem;font-size:.72rem;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:.75rem}
.sh-eyebrow svg{width:14px;height:14px}
.sh-title{font-family:var(--serif);font-size:clamp(2rem,5vw,2.8rem);font-weight:900;color:#fff;line-height:1.05;margin-bottom:.55rem}
.sh-title em{font-style:italic;background:linear-gradient(135deg,#f0d6de,#b83360);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sh-sub{font-size:.82rem;color:rgba(255,255,255,.45);margin-bottom:1.6rem}
.sh-search-box{display:flex;gap:.5rem;max-width:520px;margin:0 auto}
.sh-inp{flex:1;height:48px;border-radius:12px;border:none;padding:0 1.2rem;font-family:var(--sans);font-size:.9rem;color:var(--ink);outline:none;background:rgba(255,255,255,.96);box-shadow:0 4px 20px rgba(0,0,0,.2)}
.sh-submit{height:48px;width:48px;border-radius:12px;flex-shrink:0;background:linear-gradient(135deg,var(--navy2),var(--crimson2));color:#fff;border:none;display:flex;align-items:center;justify-content:center;transition:opacity var(--t);box-shadow:0 4px 16px rgba(30,58,110,.4)}
.sh-submit:hover{opacity:.88}.sh-submit svg{width:20px;height:20px}

/* ── FİLTRE BARI ── */
.filter-zone{background:var(--surface);border-bottom:1px solid var(--line);padding:.85rem 2.5rem;position:sticky;top:62px;z-index:100;box-shadow:0 2px 8px var(--shade)}
.genre-strip{display:flex;gap:.4rem;overflow-x:auto;padding-bottom:.55rem;scrollbar-width:none}
.genre-strip::-webkit-scrollbar{display:none}
.gchip{padding:.35rem .9rem;border-radius:20px;font-size:.76rem;font-weight:700;border:1.5px solid var(--line);color:var(--ink2);background:none;white-space:nowrap;transition:all var(--t);cursor:pointer}
.gchip.on{background:var(--navy2);color:#fff;border-color:var(--navy2)}
.gchip:hover:not(.on){background:var(--bg2);border-color:var(--line)}
.filter-toolbar{display:flex;align-items:center;gap:.6rem;flex-wrap:wrap;padding-top:.1rem}
.ft-filter-btn{display:flex;align-items:center;gap:.4rem;padding:.38rem .8rem;border-radius:8px;border:1.5px solid var(--line);font-size:.78rem;font-weight:700;color:var(--ink2);transition:all var(--t);cursor:pointer;position:relative}
.ft-filter-btn:hover{border-color:var(--navy3);color:var(--navy2);background:var(--navy-xlt)}
.ft-filter-btn svg{width:15px;height:15px}
.filter-badge{position:absolute;top:-5px;right:-5px;background:var(--crimson2);color:#fff;font-size:.6rem;font-weight:800;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.ft-sep{width:1px;height:20px;background:var(--line);flex-shrink:0}
.ft-sort-label{font-size:.75rem;color:var(--ink3);font-weight:600;white-space:nowrap}
.ft-sort-sel{padding:.35rem .65rem;border-radius:8px;border:1.5px solid var(--line);font-family:var(--sans);font-size:.78rem;color:var(--ink2);outline:none;cursor:pointer;background:var(--surface);transition:border-color var(--t)}
.ft-sort-sel:focus{border-color:var(--navy3)}
.results-pill{font-size:.75rem;font-weight:700;color:var(--ink3);padding:.25rem .7rem;background:var(--bg2);border-radius:20px}
.results-pill strong{color:var(--ink2)}
.ft-view-btns{display:flex;gap:.3rem;margin-left:auto}
.vbtn{width:30px;height:30px;border-radius:7px;border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;color:var(--ink3);transition:all var(--t);cursor:pointer}
.vbtn.on{background:var(--navy-xlt);border-color:var(--navy-lt);color:var(--navy2)}.vbtn svg{width:13px;height:13px}
.adv-panel{display:none;border-top:1px solid var(--line);padding:.85rem 0 .1rem;margin-top:.6rem;gap:1.5rem;flex-wrap:wrap}
.adv-panel.open{display:flex}
.af-group{display:flex;flex-direction:column;gap:.4rem}
.af-lbl{font-size:.72rem;font-weight:700;color:var(--ink3);text-transform:uppercase;letter-spacing:.8px}
.af-chips{display:flex;gap:.35rem;flex-wrap:wrap}
.af-chip{padding:.28rem .7rem;border-radius:16px;font-size:.74rem;font-weight:700;border:1.5px solid var(--line);color:var(--ink2);cursor:pointer;transition:all var(--t)}
.af-chip.on{background:var(--navy2);color:#fff;border-color:var(--navy2)}

/* ── ANA İÇERİK ── */
.main-wrap{max-width:1200px;margin:0 auto;padding:2rem 2.5rem 5rem}

/* ── SONUÇ TABLARI ── */
.result-tabs{display:flex;gap:0;border-bottom:1px solid var(--line);margin-bottom:1.75rem}
.rtab{padding:.65rem 1.1rem;font-size:.82rem;font-weight:700;color:var(--ink3);border-bottom:2.5px solid transparent;cursor:pointer;display:flex;align-items:center;gap:.4rem;margin-bottom:-1px;transition:all var(--t)}
.rtab svg{width:15px;height:15px}
.rtab.on{color:var(--navy2);border-bottom-color:var(--navy2)}
.rtab-cnt{font-size:.65rem;font-weight:800;padding:.08rem .4rem;border-radius:20px;background:var(--bg2);color:var(--ink3)}
.rtab.on .rtab-cnt{background:var(--navy-lt);color:var(--navy2)}

/* ── KİTAP GRID ── */
.book-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:1.5rem 1.1rem}
.bcard{cursor:pointer}
.bcard-cover{width:100%;aspect-ratio:2/3;border-radius:12px;overflow:hidden;position:relative;margin-bottom:.7rem;box-shadow:0 6px 20px var(--shade2);transition:transform var(--t),box-shadow var(--t)}
.bcard:hover .bcard-cover{transform:translateY(-5px);box-shadow:0 14px 34px var(--shade3)}
.bcard-cover-bg{position:absolute;inset:0;transition:transform .35s}
.bcard:hover .bcard-cover-bg{transform:scale(1.07)}
.bcard-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(8,12,28,.82) 0%,transparent 55%)}
.bcard-status{position:absolute;top:.55rem;left:.55rem;font-size:.57rem;font-weight:800;text-transform:uppercase;letter-spacing:.4px;padding:.18rem .5rem;border-radius:5px;z-index:2}
.s-ongoing{background:rgba(46,79,145,.85);color:#fff}.s-done{background:rgba(27,107,58,.85);color:#fff}
.bcard-cover-title{position:absolute;bottom:.6rem;left:.6rem;right:.6rem;font-family:var(--serif);font-size:.8rem;font-style:italic;font-weight:700;color:rgba(255,255,255,.9);line-height:1.3;text-shadow:0 1px 6px rgba(0,0,0,.7);z-index:1}
.bcard-views{position:absolute;bottom:.55rem;right:.6rem;display:flex;align-items:center;gap:.2rem;font-size:.62rem;font-weight:700;color:rgba(255,255,255,.7);z-index:1}
.bcard-views svg{width:10px;height:10px}
.bcard-title{font-family:var(--serif);font-size:.9rem;font-weight:700;line-height:1.25;margin-bottom:.22rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.bcard-genre{font-size:.72rem;color:var(--ink3)}

/* ── KİTAP LİSTE ── */
.book-list{display:flex;flex-direction:column;gap:.65rem}
.brow{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:.9rem 1.1rem;display:flex;align-items:flex-start;gap:1rem;cursor:pointer;transition:box-shadow var(--t),border-color var(--t),transform var(--t)}
.brow:hover{box-shadow:0 6px 22px var(--shade2);border-color:var(--navy-lt);transform:translateY(-1px)}
.brow-thumb{width:52px;height:74px;border-radius:9px;flex-shrink:0;overflow:hidden;position:relative;box-shadow:0 3px 10px var(--shade2)}
.brow-thumb-bg{position:absolute;inset:0;background-size:cover;background-position:center}
.brow-thumb-lbl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:.52rem;font-style:italic;color:rgba(255,255,255,.8);text-align:center;padding:2px;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.brow-body{flex:1;min-width:0}
.brow-top{display:flex;align-items:center;gap:.55rem;margin-bottom:.18rem;flex-wrap:wrap}
.brow-title{font-family:var(--serif);font-size:.95rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brow-badge{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.4px;padding:.13rem .48rem;border-radius:5px;flex-shrink:0}
.brow-genre{font-size:.73rem;color:var(--ink3);margin-bottom:.35rem}
.brow-stat{display:flex;align-items:center;gap:.25rem;font-size:.7rem;color:var(--ink4)}
.brow-stat svg{width:11px;height:11px}

/* ── YAZAR GRID ── */
.author-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:.85rem}
.author-card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:1.1rem 1.1rem 1rem;display:flex;align-items:flex-start;gap:.9rem;cursor:pointer;transition:box-shadow var(--t),border-color var(--t),transform var(--t)}
.author-card:hover{box-shadow:0 6px 24px var(--shade2);border-color:var(--navy-lt);transform:translateY(-2px)}
.author-ava{width:50px;height:50px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:1.2rem;font-weight:900;color:#fff;overflow:hidden;box-shadow:0 3px 10px rgba(0,0,0,.2)}
.author-ava img{width:100%;height:100%;object-fit:cover}
.author-body{flex:1;min-width:0}
.author-name{font-family:var(--serif);font-size:.95rem;font-weight:900;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:.12rem}
.author-handle{font-size:.73rem;color:var(--ink3);margin-bottom:.3rem}
.author-bio{font-size:.75rem;color:var(--ink2);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}

/* ── KEŞFET ── */
.disc-section{margin-bottom:2.75rem}
.disc-header{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:1.1rem}
.disc-title{font-family:var(--serif);font-size:1.3rem;font-weight:900}
.disc-title em{font-style:italic;color:var(--crimson2)}

/* ── TÜR KARTI ── */
.genre-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:.75rem}
.genre-card{height:100px;border-radius:13px;cursor:pointer;overflow:hidden;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;padding:.75rem;position:relative;transition:transform var(--t),box-shadow var(--t)}
.genre-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,.22)}
.genre-card-icon{position:absolute;top:.65rem;right:.75rem;opacity:.7;color:#fff;width:22px;height:22px}
.genre-card-icon svg{width:22px;height:22px}
.genre-card-name{font-family:var(--serif);font-size:1rem;font-weight:900;color:#fff;position:relative;z-index:1}

/* ── BOŞ DURUM ── */
.empty-state{text-align:center;padding:4.5rem 2rem;color:var(--ink3)}
.empty-state svg{width:52px;height:52px;margin:0 auto 1rem;display:block;opacity:.28}
.empty-title{font-family:var(--serif);font-size:1.15rem;font-weight:900;color:var(--ink2);margin-bottom:.4rem}
.empty-sub{font-size:.82rem}

/* ── SKELETON ── */
.skel{background:linear-gradient(90deg,var(--bg2) 25%,var(--line) 50%,var(--bg2) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:8px}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* ── TOAST ── */
.toast{position:fixed;bottom:1.75rem;left:50%;transform:translateX(-50%);background:rgba(24,28,44,.95);color:#fff;padding:.55rem 1.15rem;border-radius:10px;font-size:.79rem;font-weight:600;display:flex;align-items:center;gap:.45rem;box-shadow:0 6px 24px rgba(0,0,0,.28);z-index:700;pointer-events:none}
.toast svg{width:14px;height:14px;color:#5de898}

footer{background:var(--ink);color:rgba(255,255,255,.3);padding:1.5rem 2.5rem;font-size:.78rem;text-align:center}

@media(max-width:700px){
  .search-hero{padding:2.5rem 1rem 3rem}
  .filter-zone{padding:.75rem 1rem}
  .main-wrap{padding:1.5rem 1rem 4rem}
  .book-grid{grid-template-columns:repeat(auto-fill,minmax(135px,1fr))}
  .author-grid{grid-template-columns:1fr}
}
      `}</style>

      <NavBar activePage="search" />

      {/* ── HERO ── */}
      <div className="search-hero">
        <div className="sh-deco sh-deco-1" />
        <div className="sh-deco sh-deco-2" />
        <div className="sh-deco sh-deco-3" />
        <div className="sh-inner">
          <div className="sh-eyebrow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg>
            Keşfet
          </div>
          <h1 className="sh-title">Bir sonraki <em>favorini</em> bul</h1>
          <p className="sh-sub">Kitap ve yazarlarda ara</p>
          <div className="sh-search-box">
            <input
              className="sh-inp"
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch(inputVal)}
              placeholder="Kitap adı, yazar veya tür ara…"
              autoFocus
            />
            <button className="sh-submit" onClick={() => doSearch(inputVal)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── FİLTRE ── */}
      <div className="filter-zone">
        <div className="genre-strip">
          {GENRES.map(g => (
            <button key={g.id} className={`gchip${genre === g.id ? ' on' : ''}`} onClick={() => filterByGenre(g.id)}>
              {g.label}
            </button>
          ))}
        </div>
        <div className="filter-toolbar">
          <button className="ft-filter-btn" onClick={() => setAdvOpen(p => !p)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>
            Filtre
            {statusFilter !== 'all' && <div className="filter-badge">1</div>}
          </button>
          <div className="ft-sep" />
          <span className="ft-sort-label">Sırala:</span>
          <select className="ft-sort-sel" value={sort} onChange={e => setSort(e.target.value as SortKey)}>
            <option value="pop">En Popüler</option>
            <option value="new">En Yeni</option>
            <option value="az">A → Z</option>
          </select>
          {hasFilter && (
            <div className="results-pill">
              <strong>{filteredBooks.length}</strong> kitap · <strong>{authors.length}</strong> yazar
            </div>
          )}
          <div className="ft-view-btns">
            <button className={`vbtn${viewMode === 'grid' ? ' on' : ''}`} onClick={() => setViewMode('grid')} title="Grid">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
            </button>
            <button className={`vbtn${viewMode === 'list' ? ' on' : ''}`} onClick={() => setViewMode('list')} title="Liste">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
            </button>
          </div>
        </div>
        <div className={`adv-panel${advOpen ? ' open' : ''}`}>
          <div className="af-group">
            <div className="af-lbl">Kitap Durumu</div>
            <div className="af-chips">
              {([['all', 'Tümü'], ['ongoing', 'Devam Ediyor'], ['done', 'Tamamlandı']] as const).map(([val, lbl]) => (
                <button key={val} className={`af-chip${statusFilter === val ? ' on' : ''}`} onClick={() => setStatusFilter(val)}>{lbl}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── İÇERİK ── */}
      <div className="main-wrap">
        {hasFilter ? (
          <>
            {/* Sekme */}
            <div className="result-tabs">
              <button className={`rtab${resultTab === 'books' ? ' on' : ''}`} onClick={() => setResultTab('books')}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
                Kitaplar
                <span className="rtab-cnt">{filteredBooks.length}</span>
              </button>
              <button className={`rtab${resultTab === 'authors' ? ' on' : ''}`} onClick={() => setResultTab('authors')}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                Yazarlar
                <span className="rtab-cnt">{authors.length}</span>
              </button>
            </div>

            {/* KİTAPLAR */}
            {resultTab === 'books' && (
              loadingStories ? (
                <div className="book-grid">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i}>
                      <div className="skel" style={{ aspectRatio: '2/3', borderRadius: 12, marginBottom: '.7rem' }} />
                      <div className="skel" style={{ height: '.7rem', marginBottom: '.4rem' }} />
                      <div className="skel" style={{ height: '.6rem', width: '60%' }} />
                    </div>
                  ))}
                </div>
              ) : filteredBooks.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
                  <div className="empty-title">Kitap bulunamadı</div>
                  <div className="empty-sub">"{q || genre}" için eşleşen sonuç yok</div>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="book-grid">
                  {filteredBooks.map((s, i) => {
                    const pair = GRAD_PAIRS[i % GRAD_PAIRS.length]
                    return (
                      <div key={s.id} className="bcard" onClick={() => router.push(`/story/${s.id}`)}>
                        <div className="bcard-cover">
                          <div className="bcard-cover-bg" style={s.cover_url
                            ? { backgroundImage: `url(${s.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { background: `linear-gradient(155deg,${pair[0]},${pair[1]})` }
                          } />
                          <div className="bcard-overlay" />
                          {s.status === 'completed' && <div className="bcard-status s-done">Tamamlandı</div>}
                          {!s.cover_url && <div className="bcard-cover-title">{s.title}</div>}
                          <div className="bcard-views">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                            {fmtViews(s.view_count || 0)}
                          </div>
                        </div>
                        <div className="bcard-title">{s.title}</div>
                        {s.genre && <div className="bcard-genre">{s.genre}</div>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="book-list">
                  {filteredBooks.map((s, i) => {
                    const pair = GRAD_PAIRS[i % GRAD_PAIRS.length]
                    return (
                      <div key={s.id} className="brow" onClick={() => router.push(`/story/${s.id}`)}>
                        <div className="brow-thumb">
                          <div className="brow-thumb-bg" style={s.cover_url
                            ? { backgroundImage: `url(${s.cover_url})`, position: 'absolute', inset: 0 }
                            : { background: `linear-gradient(155deg,${pair[0]},${pair[1]})`, position: 'absolute', inset: 0 }
                          } />
                          {!s.cover_url && <div className="brow-thumb-lbl">{s.title.slice(0, 14)}</div>}
                        </div>
                        <div className="brow-body">
                          <div className="brow-top">
                            <div className="brow-title">{s.title}</div>
                            {s.status === 'completed' && <span className="brow-badge s-done">Tamamlandı</span>}
                          </div>
                          {s.genre && <div className="brow-genre">{s.genre}</div>}
                          <div className="brow-stat">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                            {fmtViews(s.view_count || 0)} okuma
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {/* YAZARLAR */}
            {resultTab === 'authors' && (
              loadingAuthors ? (
                <div className="author-grid">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: '.9rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: '1.1rem' }}>
                      <div className="skel" style={{ width: 50, height: 50, borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skel" style={{ height: '.75rem', marginBottom: '.4rem' }} />
                        <div className="skel" style={{ height: '.65rem', width: '55%', marginBottom: '.5rem' }} />
                        <div className="skel" style={{ height: '.6rem' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : authors.length === 0 ? (
                <div className="empty-state">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                  <div className="empty-title">Yazar bulunamadı</div>
                  <div className="empty-sub">"{q}" ile eşleşen yazar yok</div>
                </div>
              ) : (
                <div className="author-grid">
                  {authors.map((a, i) => {
                    const name = a.display_name || a.username || 'Kullanıcı'
                    return (
                      <div key={a.id} className="author-card" onClick={() => router.push(`/profile/${a.id}`)}>
                        <div className="author-ava" style={{ background: AVA_GRADS[i % AVA_GRADS.length] }}>
                          {a.avatar_url
                            ? <img src={a.avatar_url} alt={name} />
                            : getInitials(name)
                          }
                        </div>
                        <div className="author-body">
                          <div className="author-name">{name}</div>
                          {a.username && <div className="author-handle">@{a.username}</div>}
                          {a.bio && <div className="author-bio">{a.bio}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </>
        ) : (
          /* ── KEŞFET MODU ── */
          <>
            <div className="disc-section">
              <div className="disc-header">
                <div className="disc-title">Türlere Göre <em>Keşfet</em></div>
              </div>
              <div className="genre-grid">
                {GENRE_CARDS.map(g => (
                  <div
                    key={g.id}
                    className="genre-card"
                    style={{ background: `linear-gradient(135deg,${g.grad[0]},${g.grad[1]})` }}
                    onClick={() => filterByGenre(g.id)}
                  >
                    <div className="genre-card-icon">{g.icon}</div>
                    <div className="genre-card-name">{g.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {discoverAuthors.length > 0 && (
              <div className="disc-section">
                <div className="disc-header">
                  <div className="disc-title">Yazarları <em>Keşfet</em></div>
                </div>
                <div className="author-grid">
                  {discoverAuthors.map((a, i) => {
                    const name = a.display_name || a.username || 'Kullanıcı'
                    return (
                      <div key={a.id} className="author-card" onClick={() => router.push(`/profile/${a.id}`)}>
                        <div className="author-ava" style={{ background: AVA_GRADS[i % AVA_GRADS.length] }}>
                          {a.avatar_url
                            ? <img src={a.avatar_url} alt={name} />
                            : getInitials(name)
                          }
                        </div>
                        <div className="author-body">
                          <div className="author-name">{name}</div>
                          {a.username && <div className="author-handle">@{a.username}</div>}
                          {a.bio && <div className="author-bio">{a.bio}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <footer>© 2026 Foliom. Tüm hakları saklıdır.</footer>
    </>
  )
}
