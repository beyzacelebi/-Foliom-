'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'

const GRAD_PAIRS = [
  ['#1a2e5a', '#3a0e20'], ['#0d2a1a', '#1a3a10'], ['#0d1e3a', '#0d3020'],
  ['#1a2a10', '#102010'], ['#1a1040', '#3a1060'], ['#2a1800', '#402808'],
]

interface Profile {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  cover_url: string | null
}

interface Story {
  id: string
  title: string
  genre: string | null
  cover_url: string | null
  view_count: number
}

interface FollowUser {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

interface ReadingList {
  id: string
  name: string
  description: string | null
  book_count: number
}

export default function MyProfilePage() {
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [readingLists, setReadingLists] = useState<ReadingList[]>([])
  const [loading, setLoading] = useState(true)
  const [myId, setMyId] = useState<string | null>(null)

  // Liste oluşturma modal
  const [showCreateList, setShowCreateList] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [newListDesc, setNewListDesc] = useState('')
  const [creatingList, setCreatingList] = useState(false)

  const [deleteListId, setDeleteListId] = useState<string | null>(null)
  const [deletingList, setDeletingList] = useState(false)

  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followerList, setFollowerList] = useState<FollowUser[]>([])
  const [followingList, setFollowingList] = useState<FollowUser[]>([])

  // ── FIX 1: NavBar ile aynı kaynak ──────────────────────────────────────────
  // NavBar user_metadata.first_name + last_name'den okuyor; biz de aynısını yapıyoruz
  const [metaDisplayName, setMetaDisplayName] = useState<string | null>(null)
  const [metaBio, setMetaBio] = useState<string | null>(null)
  // ───────────────────────────────────────────────────────────────────────────

  const [website, setWebsite] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('books')
  const [moreOpen, setMoreOpen] = useState(false)
  const [aboutExpanded, setAboutExpanded] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'warn' } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string, type: 'ok' | 'warn' = 'ok') {
    setToast({ msg, type })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  // ── FIX 2: user_metadata'dan ad+soyad oku (NavBar ile birebir aynı mantık) ─
  // Settings full_name + website kaydeder; NavBar da full_name'den okur
  function readMetaName(metadata: Record<string, any>) {
    const full = (metadata?.full_name || metadata?.name || '').trim()
    setMetaDisplayName(full || null)
    setWebsite(metadata?.website || null)
    setMetaBio((metadata?.bio || '').trim() || null)
  }

  async function fetchProfileFromDb(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name, bio, avatar_url, cover_url')
      .eq('id', userId)
      .single()
    if (data) setProfile(data as Profile)
  }
  // ───────────────────────────────────────────────────────────────────────────

  const fetchCounts = useCallback(async (userId: string) => {
    const [{ count: fc }, { count: ing }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ])
    setFollowerCount(fc || 0)
    setFollowingCount(ing || 0)
  }, [])

  const fetchFollowerList = useCallback(async (userId: string) => {
    const { data } = await supabase.from('follows').select('follower_id').eq('following_id', userId)
    const ids = (data || []).map((r: any) => r.follower_id)
    if (!ids.length) { setFollowerList([]); return }
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', ids)
    setFollowerList((profiles || []) as FollowUser[])
  }, [])

  const fetchFollowingList = useCallback(async (userId: string) => {
    const { data } = await supabase.from('follows').select('following_id').eq('follower_id', userId)
    const ids = (data || []).map((r: any) => r.following_id)
    if (!ids.length) { setFollowingList([]); return }
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .in('id', ids)
    setFollowingList((profiles || []) as FollowUser[])
  }, [])

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      const userId = user.id
      setMyId(userId)

      // ── FIX 2 (devam): ilk yüklemede metadata'dan oku ──
      readMetaName(user.user_metadata || {})

      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, cover_url')
        .eq('id', userId)
        .single()
      if (profileErr || !profileData) { setLoading(false); return }
      setProfile(profileData as Profile)

      const { data: storiesData } = await supabase
        .from('stories')
        .select('id, title, genre, cover_url, view_count')
        .eq('author_id', userId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
      setStories(storiesData || [])

      const { data: listsData } = await supabase
        .from('reading_lists')
        .select('id, name, description, book_count')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setReadingLists(listsData || [])

      await fetchCounts(userId)
      setLoading(false)
    })()
  }, [router, fetchCounts])

  // ── FIX 3: Ayarlar kaydedildiğinde NavBar ile birlikte burada da güncellenir ─
  // updateUser() → TOKEN_REFRESHED event → onAuthStateChange tetiklenir
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        readMetaName(session.user.user_metadata || {})
        fetchProfileFromDb(session.user.id)
      }
    })
    return () => subscription.unsubscribe()
  }, [])
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!myId) return
    if (activeTab === 'followers') fetchFollowerList(myId)
    if (activeTab === 'following') fetchFollowingList(myId)
  }, [activeTab, myId, fetchFollowerList, fetchFollowingList])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function createList() {
    if (!newListName.trim() || !myId) return
    setCreatingList(true)
    const { data, error } = await supabase
      .from('reading_lists')
      .insert({ user_id: myId, name: newListName.trim(), description: newListDesc.trim() || null, book_count: 0 })
      .select('id, name, description, book_count')
      .single()
    setCreatingList(false)
    if (error) { console.error('createList error:', error); showToast('Liste oluşturulamadı: ' + error.message, 'warn'); return }
    setReadingLists(prev => [data as ReadingList, ...prev])
    setNewListName('')
    setNewListDesc('')
    setShowCreateList(false)
    showToast('Liste oluşturuldu!')
  }

  async function deleteList() {
    if (!deleteListId) return
    setDeletingList(true)
    const { error } = await supabase.from('reading_lists').delete().eq('id', deleteListId)
    setDeletingList(false)
    if (error) { showToast('Liste silinemedi', 'warn'); return }
    setReadingLists(prev => prev.filter(l => l.id !== deleteListId))
    setDeleteListId(null)
    showToast('Liste silindi')
  }

  function shareProfile() {
    setMoreOpen(false)
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Profil bağlantısı kopyalandı!'))
      .catch(() => showToast('Kopyalama başarısız', 'warn'))
  }

  // ── FIX 1 (devam): önce metadata adı, sonra profiles, sonra username ──
  const displayName = metaDisplayName || profile?.display_name || profile?.username || 'Kullanıcı'
  const handle = profile?.username ? '@' + profile.username : ''

  // NavBar ile aynı baş harf mantığı → avatar uyuşur
  const initials = (() => {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase()
    return parts[0]?.[0]?.toUpperCase() || '?'
  })()

  const totalViews = stories.reduce((s, x) => s + (x.view_count || 0), 0)

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

  if (!profile) {
    return (
      <>
        <NavBar />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2rem', fontWeight: 700 }}>Profil bulunamadı</span>
          <button onClick={() => router.push('/auth')} style={{ padding: '.55rem 1.2rem', borderRadius: 8, background: '#2e4f91', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Giriş Yap</button>
        </div>
      </>
    )
  }

  const TABS = [
    { id: 'books', label: 'Kitaplar', count: stories.length, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg> },
    { id: 'lists', label: 'Okuma Listeleri', count: readingLists.length, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg> },
    { id: 'followers', label: 'Takipçiler', count: followerCount, icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.75 3.75 0 1 1-6.75 0 3.75 3.75 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg> },
    { id: 'following', label: 'Takip Edilenler', count: followingCount, icon: null },
  ]

  return (
    <>
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700&family=Nunito+Sans:opsz,wght@6..12,300;6..12,400;6..12,600;6..12,700&family=Spectral:ital,wght@0,400;0,500;1,400&display=swap');
:root{--bg:#f2f3f7;--bg2:#e8eaf0;--surface:#fff;--ink:#181c2c;--ink2:#434961;--ink3:#8890aa;--ink4:#b4bacf;
--navy:#1e3a6e;--navy2:#2e4f91;--navy3:#4169af;--navy-lt:#d6e2f7;--navy-xlt:#edf2fc;
--crimson:#6b1a34;--crimson2:#8f2448;--crimson3:#b83360;--crimson-lt:#f0d6de;
--green:#1b6b3a;--green-lt:#e6f7ed;--red:#c0392b;--red-lt:#fdecea;--amber:#c47a0a;--amber-lt:#fef3dc;
--line:#dde0e8;--shade:rgba(24,28,44,.07);--shade2:rgba(24,28,44,.15);--shade3:rgba(24,28,44,.27);
--serif:'Cormorant Garamond',Georgia,serif;--sans:'Nunito Sans',sans-serif;--body-t:'Spectral',Georgia,serif;--t:.2s ease}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--ink);line-height:1.5;min-height:100vh;-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}button{font-family:inherit;cursor:pointer;border:none}

/* ── COVER ── */
.cover-wrap{position:relative;height:240px;overflow:hidden;background:linear-gradient(135deg,#1a2e5a 0%,#0d1c3a 40%,#3a0e20 100%)}
.cover-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}
.cover-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,15,35,.65) 0%,rgba(10,15,35,.1) 60%,transparent 100%)}
/* ── PROFILE IDENTITY ── */
.profile-identity{background:var(--surface);border-bottom:1px solid var(--line);padding:0 2.5rem 1.5rem;position:relative}
.avatar-ring{position:absolute;top:-44px;left:2.5rem;width:88px;height:88px;border-radius:50%;border:4px solid var(--surface);background:linear-gradient(135deg,var(--navy2),var(--crimson2));display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.22);cursor:pointer;transition:transform var(--t)}
.avatar-ring:hover{transform:scale(1.05)}
.avatar-ring img{width:100%;height:100%;object-fit:cover}
.av-initials{font-family:var(--serif);font-size:2rem;font-weight:900;color:#fff;user-select:none}
.profile-top-row{display:flex;align-items:flex-end;justify-content:space-between;padding-top:52px;gap:1rem;flex-wrap:wrap}
.profile-name-block{min-width:0}
.profile-name{font-family:var(--serif);font-size:1.75rem;font-weight:900;line-height:1.1;display:flex;align-items:center;gap:.55rem;flex-wrap:wrap}
.profile-handle{font-size:.83rem;color:var(--ink3);margin-top:.2rem}
.profile-actions{display:flex;align-items:center;gap:.5rem;flex-shrink:0}

/* ── MORE MENU ── */
.more-menu-wrap{position:relative}
.btn-more{width:36px;height:36px;border-radius:9px;border:1.5px solid var(--line);background:none;color:var(--ink3);display:flex;align-items:center;justify-content:center;transition:all var(--t)}
.btn-more:hover{border-color:var(--navy3);color:var(--navy2);background:var(--navy-xlt)}
.btn-more svg{width:18px;height:18px}
.more-dropdown{position:absolute;top:calc(100% + 6px);right:0;min-width:178px;background:var(--surface);border:1px solid var(--line);border-radius:12px;box-shadow:0 8px 32px var(--shade2);z-index:300;overflow:hidden;animation:ddFade .15s ease}
@keyframes ddFade{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
.dd-item{display:flex;align-items:center;gap:.6rem;padding:.62rem 1rem;font-size:.81rem;font-weight:600;color:var(--ink2);cursor:pointer;transition:background var(--t)}
.dd-item svg{width:15px;height:15px;flex-shrink:0}
.dd-item:hover{background:var(--bg2)}
.dd-item.danger{color:var(--red)}
.dd-item.danger:hover{background:var(--red-lt)}
.dd-sep{height:1px;background:var(--line)}

/* ── STATS ── */
.profile-stats{display:flex;gap:2rem;margin-top:1.1rem;flex-wrap:wrap}
.stat-item{cursor:pointer}
.stat-item:hover .stat-num{color:var(--navy2)}
.stat-num{font-family:var(--serif);font-size:1.2rem;font-weight:900;color:var(--ink)}
.stat-lbl{font-size:.72rem;color:var(--ink3);margin-top:-.1rem}

/* ── BIO ── */
.profile-about{margin-top:.85rem;max-width:580px;font-family:var(--body-t);font-size:.88rem;color:var(--ink2);line-height:1.7}
.profile-about.collapsed{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.about-toggle{font-size:.77rem;font-weight:700;color:var(--navy2);background:none;border:none;cursor:pointer;margin-top:.3rem;padding:0;display:block;transition:color var(--t)}
.about-toggle:hover{color:var(--crimson2)}

/* ── TABS ── */
.profile-tabs{background:var(--surface);border-bottom:1px solid var(--line);padding:0 2.5rem;display:flex;gap:0;position:sticky;top:62px;z-index:100;overflow-x:auto}
.profile-tabs::-webkit-scrollbar{display:none}
.p-tab{padding:.72rem 1rem;font-size:.82rem;font-weight:700;color:var(--ink3);border-bottom:2.5px solid transparent;cursor:pointer;white-space:nowrap;transition:color var(--t),border-color var(--t);display:flex;align-items:center;gap:.4rem;margin-bottom:-1px;background:none;border-left:none;border-right:none;border-top:none}
.p-tab svg{width:15px;height:15px}
.p-tab:hover{color:var(--ink2)}
.p-tab.on{color:var(--navy2);border-bottom-color:var(--navy2)}
.p-tab-count{font-size:.64rem;font-weight:800;padding:.08rem .4rem;border-radius:20px;background:var(--bg2);color:var(--ink3)}
.p-tab.on .p-tab-count{background:var(--navy-lt);color:var(--navy2)}

/* ── CONTENT ── */
.content-wrap{max-width:1080px;margin:0 auto;padding:2rem 2.5rem 4rem}
.sec-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem}
.sec-title{font-family:var(--serif);font-size:1.35rem;font-weight:900;display:flex;align-items:center;gap:.55rem}
.sec-title-count{font-size:.78rem;font-weight:700;color:var(--ink3)}
.sec-link{font-size:.78rem;font-weight:700;color:var(--navy2);cursor:pointer;transition:color var(--t);background:none;border:none}
.sec-link:hover{color:var(--crimson2)}

/* ── BOOK GRID ── */
.book-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:1.25rem}
.book-card{cursor:pointer}
.book-cover{width:100%;aspect-ratio:2/3;border-radius:10px;overflow:hidden;box-shadow:0 4px 16px var(--shade2);position:relative;margin-bottom:.65rem;transition:transform var(--t),box-shadow var(--t)}
.book-card:hover .book-cover{transform:translateY(-4px);box-shadow:0 10px 28px var(--shade3)}
.book-cover-bg{width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:.5rem;position:relative;overflow:hidden}
.book-cover-title{font-family:var(--serif);font-size:.95rem;font-weight:900;color:#fff;text-align:center;padding:0 .5rem;line-height:1.2;position:relative;z-index:1}
.book-cover-pattern{position:absolute;inset:0;opacity:.06;background-image:repeating-linear-gradient(45deg,transparent,transparent 15px,rgba(255,255,255,.4) 15px,rgba(255,255,255,.4) 16px),repeating-linear-gradient(-45deg,transparent,transparent 15px,rgba(255,255,255,.3) 15px,rgba(255,255,255,.3) 16px)}
.book-name{font-size:.83rem;font-weight:700;color:var(--ink);margin-bottom:.2rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.book-meta{font-size:.7rem;color:var(--ink3)}

/* ── READING LISTS ── */
.reading-list-grid{display:flex;flex-direction:column;gap:1rem}
.rl-card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:1.1rem 1.25rem;display:flex;align-items:center;gap:1.1rem;transition:box-shadow var(--t),border-color var(--t);cursor:pointer}
.rl-card:hover{box-shadow:0 4px 20px var(--shade2);border-color:var(--navy-lt)}
.rl-icon{width:48px;height:48px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--navy2),var(--crimson2))}
.rl-icon svg{width:22px;height:22px;color:#fff}
.rl-info{flex:1;min-width:0}
.rl-name{font-size:.9rem;font-weight:700;margin-bottom:.2rem}
.rl-sub{font-size:.74rem;color:var(--ink3)}
.rl-count{font-family:var(--serif);font-size:1.5rem;font-weight:900;color:var(--ink3);flex-shrink:0}

/* ── FOLLOW GRID ── */
.follow-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem}
.follow-card{background:var(--surface);border:1px solid var(--line);border-radius:13px;padding:1rem;display:flex;flex-direction:column;align-items:center;gap:.5rem;text-align:center;transition:box-shadow var(--t),border-color var(--t);cursor:pointer}
.follow-card:hover{box-shadow:0 4px 18px var(--shade2);border-color:var(--navy-lt)}
.fc-ava{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:1.3rem;font-weight:900;color:#fff;overflow:hidden;background:linear-gradient(135deg,var(--navy2),var(--crimson2))}
.fc-ava img{width:100%;height:100%;object-fit:cover}
.fc-name{font-size:.85rem;font-weight:700;color:var(--ink)}
.fc-sub{font-size:.7rem;color:var(--ink3)}

/* ── EMPTY STATE ── */
.empty-panel{text-align:center;padding:3rem 1rem;color:var(--ink3)}
.empty-panel svg{width:44px;height:44px;margin:0 auto 1rem;display:block;opacity:.35}
.empty-panel-title{font-family:var(--serif);font-size:1rem;font-weight:900;color:var(--ink2);margin-bottom:.3rem}
.empty-panel-sub{font-size:.8rem}
.empty-action{display:inline-flex;align-items:center;gap:.4rem;margin-top:1rem;padding:.5rem 1.2rem;border-radius:9px;font-size:.82rem;font-weight:700;background:linear-gradient(135deg,var(--navy2),var(--crimson2));color:#fff;border:none;cursor:pointer;transition:opacity var(--t)}
.empty-action:hover{opacity:.87}

/* ── TOAST ── */
.toast{position:fixed;bottom:1.75rem;left:50%;transform:translateX(-50%);background:rgba(24,28,44,.95);color:#fff;z-index:600;padding:.55rem 1.15rem;border-radius:10px;font-size:.79rem;font-weight:600;display:flex;align-items:center;gap:.45rem;box-shadow:0 6px 24px rgba(0,0,0,.28);pointer-events:none;animation:toastIn .2s ease}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
.toast svg{width:14px;height:14px}
.toast.ok svg{color:#5de898}
.toast.warn svg{color:#fbbf24}

/* ── CREATE LIST MODAL ── */
.modal-back{position:fixed;inset:0;background:rgba(10,15,35,.62);backdrop-filter:blur(4px);z-index:500;display:flex;align-items:center;justify-content:center;padding:1rem}
.modal-box{background:var(--surface);border-radius:18px;padding:1.75rem;width:100%;max-width:420px;box-shadow:0 24px 64px rgba(0,0,0,.22);animation:modalIn .2s ease}
@keyframes modalIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
.modal-title{font-family:var(--serif);font-size:1.35rem;font-weight:900;margin-bottom:1.25rem}
.modal-field{margin-bottom:.85rem}
.modal-label{font-size:.75rem;font-weight:700;color:var(--ink3);margin-bottom:.35rem;display:block}
.modal-input{width:100%;padding:.6rem .85rem;border:1.5px solid var(--line);border-radius:9px;font-family:var(--sans);font-size:.875rem;color:var(--ink);background:var(--bg);outline:none;transition:border-color var(--t)}
.modal-input:focus{border-color:var(--navy3)}
.modal-textarea{min-height:72px;resize:vertical}
.modal-actions{display:flex;gap:.6rem;justify-content:flex-end;margin-top:1.1rem}
.modal-btn-cancel{padding:.52rem 1.1rem;border-radius:8px;font-size:.82rem;font-weight:700;background:none;border:1.5px solid var(--line);color:var(--ink3);cursor:pointer;transition:all var(--t)}
.modal-btn-cancel:hover{border-color:var(--ink3);color:var(--ink2)}
.modal-btn-create{padding:.52rem 1.25rem;border-radius:8px;font-size:.82rem;font-weight:700;background:linear-gradient(135deg,var(--navy2),var(--crimson2));color:#fff;border:none;cursor:pointer;transition:opacity var(--t)}
.modal-btn-create:hover{opacity:.87}
.modal-btn-create:disabled{opacity:.5;cursor:not-allowed}

/* ── FOOTER ── */
footer{background:var(--ink);color:rgba(255,255,255,.3);padding:1.5rem 2.5rem;font-size:.78rem;text-align:center;margin-top:auto}

@media(max-width:700px){
  .profile-identity{padding:0 1rem 1.25rem}
  .avatar-ring{left:1rem}
  .content-wrap{padding:1.5rem 1rem 3rem}
  .profile-tabs{padding:0 1rem}
  .cover-wrap{height:160px}
  .book-grid{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}
  .follow-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
}
      `}</style>

      <NavBar />

      {/* ── COVER ── */}
      <div className="cover-wrap">
        {profile.cover_url
          ? <img src={profile.cover_url} alt="Kapak" className="cover-img" />
          : (
            <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', inset: 0 }}>
              <defs>
                <linearGradient id="covGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#1a2e5a' }} />
                  <stop offset="45%" style={{ stopColor: '#0d1c3a' }} />
                  <stop offset="100%" style={{ stopColor: '#3a0e20' }} />
                </linearGradient>
                <pattern id="covPat" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="40" x2="40" y2="0" stroke="rgba(255,255,255,.04)" strokeWidth="1" />
                  <line x1="-10" y1="40" x2="30" y2="0" stroke="rgba(255,255,255,.03)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#covGrad)" />
              <rect width="100%" height="100%" fill="url(#covPat)" />
              <circle cx="75%" cy="50%" r="110" fill="rgba(107,26,52,.18)" />
              <circle cx="82%" cy="30%" r="60" fill="rgba(30,58,110,.2)" />
            </svg>
          )
        }
        <div className="cover-overlay" />
      </div>

      {/* ── PROFILE IDENTITY ── */}
      <div className="profile-identity">
        <div className="avatar-ring">
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="Avatar" />
            : <div className="av-initials">{initials}</div>
          }
        </div>

        <div className="profile-top-row">
          <div className="profile-name-block">
            <div className="profile-name">{displayName}</div>
            {handle && <div className="profile-handle">{handle}</div>}
          </div>

          <div className="profile-actions">
            {/* ── THREE-DOT MENU ── */}
            <div className="more-menu-wrap" ref={moreRef}>
              <button className="btn-more" onClick={() => setMoreOpen(v => !v)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                </svg>
              </button>
              {moreOpen && (
                <div className="more-dropdown">
                  <div className="dd-item" onClick={() => { setMoreOpen(false); router.push('/analytics') }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                    </svg>
                    Profil Analizi
                  </div>
                  <div className="dd-item" onClick={() => { setMoreOpen(false); router.push('/settings') }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                    Ayarlar
                  </div>
                  <div className="dd-sep" />
                  <div className="dd-item" onClick={shareProfile}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                    </svg>
                    Profili Paylaş
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── STATS ── */}
        <div className="profile-stats">
          <div className="stat-item" onClick={() => setActiveTab('followers')}>
            <div className="stat-num">{followerCount.toLocaleString('tr-TR')}</div>
            <div className="stat-lbl">Takipçi</div>
          </div>
          <div className="stat-item" onClick={() => setActiveTab('following')}>
            <div className="stat-num">{followingCount.toLocaleString('tr-TR')}</div>
            <div className="stat-lbl">Takip</div>
          </div>
          <div className="stat-item" onClick={() => setActiveTab('books')}>
            <div className="stat-num">{stories.length}</div>
            <div className="stat-lbl">Kitap</div>
          </div>
          <div className="stat-item">
            <div className="stat-num">{totalViews.toLocaleString('tr-TR')}</div>
            <div className="stat-lbl">Toplam Okuma</div>
          </div>
        </div>

        {/* ── BIO ── */}
        {(profile.bio || metaBio) && (
          <>
            <div className={`profile-about${aboutExpanded ? '' : ' collapsed'}`}>
              {profile.bio || metaBio}
            </div>
            {(profile.bio || metaBio)!.length > 120 && (
              <button className="about-toggle" onClick={() => setAboutExpanded(v => !v)}>
                {aboutExpanded ? 'Daha Az Göster' : 'Devamını Oku'}
              </button>
            )}
          </>
        )}

        {/* ── WEBSİTE ── */}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '.35rem', marginTop: '.65rem', fontSize: '.82rem', fontWeight: 600, color: 'var(--navy2)', wordBreak: 'break-all', transition: 'color var(--t)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--crimson2)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--navy2)')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" style={{ width: 14, height: 14, flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            {website.replace(/^https?:\/\//, '')}
          </a>
        )}
      </div>

      {/* ── TABS ── */}
      <div className="profile-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`p-tab${activeTab === tab.id ? ' on' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className="p-tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="content-wrap">

        {/* KİTAPLAR */}
        {activeTab === 'books' && (
          <>
            <div className="sec-header">
              <div className="sec-title">
                Yayınlanan Kitaplar
                <span className="sec-title-count">{stories.length}</span>
              </div>
              <button className="sec-link" onClick={() => router.push('/write')}>
                + Yeni Kitap
              </button>
            </div>
            {stories.length === 0 ? (
              <div className="empty-panel">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                <div className="empty-panel-title">Henüz kitap yayınlamadın</div>
                <div className="empty-panel-sub">İlk kitabını yayınlamaya hazır mısın?</div>
                <button className="empty-action" onClick={() => router.push('/write')}>
                  Yazmaya Başla
                </button>
              </div>
            ) : (
              <div className="book-grid">
                {stories.map((story, i) => {
                  const pair = GRAD_PAIRS[i % GRAD_PAIRS.length]
                  return (
                    <div key={story.id} className="book-card" onClick={() => router.push(`/story/${story.id}`)}>
                      <div className="book-cover">
                        <div
                          className="book-cover-bg"
                          style={story.cover_url ? undefined : { background: `linear-gradient(155deg,${pair[0]},${pair[1]})` }}
                        >
                          {story.cover_url
                            ? <img src={story.cover_url} alt={story.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <><div className="book-cover-pattern" /><div className="book-cover-title">{story.title}</div></>
                          }
                        </div>
                      </div>
                      <div className="book-name">{story.title}</div>
                      <div className="book-meta">{story.genre || ''}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* OKUMA LİSTELERİ */}
        {activeTab === 'lists' && (
          <>
            <div className="sec-header">
              <div className="sec-title">
                Okuma Listeleri
                <span className="sec-title-count">{readingLists.length}</span>
              </div>
              <button className="sec-link" onClick={() => setShowCreateList(true)}>
                + Yeni Liste
              </button>
            </div>
            {readingLists.length === 0 ? (
              <div className="empty-panel">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                <div className="empty-panel-title">Henüz liste oluşturmadın</div>
                <div className="empty-panel-sub">Beğendiğin kitapları listeler halinde düzenle.</div>
                <button className="empty-action" onClick={() => setShowCreateList(true)}>
                  İlk Listeyi Oluştur
                </button>
              </div>
            ) : (
              <div className="reading-list-grid">
                {readingLists.map((list) => (
                  <div key={list.id} className="rl-card" onClick={() => router.push(`/list/${list.id}`)}>
                    <div className="rl-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    </div>
                    <div className="rl-info">
                      <div className="rl-name">{list.name}</div>
                      <div className="rl-sub">{list.description || 'Açıklama yok'}</div>
                    </div>
                    <div className="rl-count">{list.book_count || 0}</div>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteListId(list.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink4)', padding: '4px', borderRadius: 6, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color var(--t)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink4)')}
                      title="Listeyi sil"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" style={{ width: 17, height: 17 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAKİPÇİLER */}
        {activeTab === 'followers' && (
          <>
            <div className="sec-header">
              <div className="sec-title">
                Takipçiler
                <span className="sec-title-count">{followerCount}</span>
              </div>
            </div>
            {followerList.length === 0 ? (
              <div className="empty-panel">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <div className="empty-panel-title">Henüz takipçin yok</div>
                <div className="empty-panel-sub">Kitaplarını yayınladıkça takipçi kazanmaya başlayacaksın.</div>
              </div>
            ) : (
              <div className="follow-grid">
                {followerList.map(u => (
                  <div key={u.id} className="follow-card" onClick={() => router.push(`/profile/${u.id}`)}>
                    <div className="fc-ava">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={u.display_name || ''} />
                        : (u.display_name || u.username || '?')[0].toUpperCase()
                      }
                    </div>
                    <div className="fc-name">{u.display_name || u.username || 'Kullanıcı'}</div>
                    {u.username && <div className="fc-sub">@{u.username}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAKİP EDİLENLER */}
        {activeTab === 'following' && (
          <>
            <div className="sec-header">
              <div className="sec-title">
                Takip Edilenler
                <span className="sec-title-count">{followingCount}</span>
              </div>
            </div>
            {followingList.length === 0 ? (
              <div className="empty-panel">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                <div className="empty-panel-title">Henüz kimseyi takip etmiyorsun</div>
                <div className="empty-panel-sub">Keşfet sayfasından yazarları takip edebilirsin.</div>
                <button className="empty-action" onClick={() => router.push('/explore')}>
                  Keşfet
                </button>
              </div>
            ) : (
              <div className="follow-grid">
                {followingList.map(u => (
                  <div key={u.id} className="follow-card" onClick={() => router.push(`/profile/${u.id}`)}>
                    <div className="fc-ava">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={u.display_name || ''} />
                        : (u.display_name || u.username || '?')[0].toUpperCase()
                      }
                    </div>
                    <div className="fc-name">{u.display_name || u.username || 'Kullanıcı'}</div>
                    {u.username && <div className="fc-sub">@{u.username}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {/* ── CREATE LIST MODAL ── */}
      {showCreateList && (
        <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) setShowCreateList(false) }}>
          <div className="modal-box">
            <div className="modal-title">Yeni Okuma Listesi</div>
            <div className="modal-field">
              <label className="modal-label">Liste Adı *</label>
              <input
                className="modal-input"
                placeholder="Örn: Favori Kitaplarım"
                value={newListName}
                onChange={e => setNewListName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createList()}
                autoFocus
                maxLength={60}
              />
            </div>
            <div className="modal-field">
              <label className="modal-label">Açıklama (isteğe bağlı)</label>
              <textarea
                className="modal-input modal-textarea"
                placeholder="Liste hakkında kısa bir açıklama…"
                value={newListDesc}
                onChange={e => setNewListDesc(e.target.value)}
                maxLength={200}
              />
            </div>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => { setShowCreateList(false); setNewListName(''); setNewListDesc('') }}>
                İptal
              </button>
              <button
                className="modal-btn-create"
                onClick={createList}
                disabled={!newListName.trim() || creatingList}
              >
                {creatingList ? 'Oluşturuluyor…' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE LIST CONFIRM MODAL ── */}
      {deleteListId && (
        <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) setDeleteListId(null) }}>
          <div className="modal-box">
            <div className="modal-title">Listeyi Sil</div>
            <p style={{ fontSize: '.88rem', color: 'var(--ink2)', marginBottom: '1.25rem' }}>
              Bu okuma listesini kalıcı olarak silmek istediğinden emin misin? Bu işlem geri alınamaz.
            </p>
            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={() => setDeleteListId(null)}>
                İptal
              </button>
              <button
                className="modal-btn-create"
                onClick={deleteList}
                disabled={deletingList}
                style={{ background: 'var(--red)' }}
              >
                {deletingList ? 'Siliniyor…' : 'Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'ok' ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          )}
          {toast.msg}
        </div>
      )}

      <footer>© 2026 Foliom. Tüm hakları saklıdır.</footer>
    </>
  )
}