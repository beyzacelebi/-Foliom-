'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'

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

const GRAD_PAIRS = [
  ['#1a2e5a', '#3a0e20'], ['#0d2a1a', '#1a3a10'], ['#0d1e3a', '#0d3020'],
  ['#1a2a10', '#102010'], ['#1a1040', '#3a1060'], ['#2a1800', '#402808'],
]

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params?.id as string

  const [profile, setProfile] = useState<Profile | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followerList, setFollowerList] = useState<FollowUser[]>([])
  const [followingList, setFollowingList] = useState<FollowUser[]>([])

  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const [activeTab, setActiveTab] = useState('books')
  const [aboutExpanded, setAboutExpanded] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

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
    if (!profileId) return
    ;(async () => {
      // Mevcut kullanıcıyı al (opsiyonel)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        // Kendi profiliyse /profile'e yönlendir
        if (user.id === profileId) {
          router.replace('/profile')
          return
        }
        // Takip durumunu kontrol et
        const { data: followData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profileId)
          .maybeSingle()
        setFollowing(!!followData)
      }

      // Profili çek
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, cover_url')
        .eq('id', profileId)
        .single()

      if (profileErr || !profileData) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setProfile(profileData as Profile)

      // Yayınlanan kitapları çek
      const { data: storiesData } = await supabase
        .from('stories')
        .select('id, title, genre, cover_url, view_count')
        .eq('author_id', profileId)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
      setStories(storiesData || [])

      await fetchCounts(profileId)
      setLoading(false)
    })()
  }, [profileId, router, fetchCounts])

  useEffect(() => {
    if (!profileId) return
    if (activeTab === 'followers') fetchFollowerList(profileId)
    if (activeTab === 'following') fetchFollowingList(profileId)
  }, [activeTab, profileId, fetchFollowerList, fetchFollowingList])

  async function toggleFollow() {
    if (!currentUserId) { router.push('/auth'); return }
    setFollowLoading(true)
    if (following) {
      await supabase.from('follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', profileId)
      setFollowing(false)
      setFollowerCount(c => Math.max(0, c - 1))
      showToast('Takipten çıkıldı')
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profileId })
      setFollowing(true)
      setFollowerCount(c => c + 1)
      showToast('Takip edildi!')
    }
    setFollowLoading(false)
  }

  const displayName = profile?.display_name || profile?.username || 'Kullanıcı'
  const handle = profile?.username ? '@' + profile.username : ''
  const initials = (() => {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase()
    return parts[0]?.[0]?.toUpperCase() || '?'
  })()

  const totalViews = stories.reduce((s, x) => s + (x.view_count || 0), 0)

  const TABS = [
    {
      id: 'books', label: 'Kitaplar', count: stories.length,
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
    },
    {
      id: 'followers', label: 'Takipçiler', count: followerCount,
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.75 3.75 0 1 1-6.75 0 3.75 3.75 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
    },
    {
      id: 'following', label: 'Takip Edilenler', count: followingCount, icon: null
    },
  ]

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

  if (notFound || !profile) {
    return (
      <>
        <NavBar />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2rem', fontWeight: 700 }}>Profil bulunamadı</span>
          <button onClick={() => router.back()} style={{ padding: '.55rem 1.2rem', borderRadius: 8, background: '#2e4f91', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Geri Dön</button>
        </div>
      </>
    )
  }

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
.cover-wrap{position:relative;height:240px;overflow:hidden;background:linear-gradient(135deg,#1a2e5a 0%,#0d1c3a 40%,#3a0e20 100%)}
.cover-img{width:100%;height:100%;object-fit:cover;display:block}
.cover-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,15,35,.65) 0%,rgba(10,15,35,.1) 60%,transparent 100%)}
.profile-identity{background:var(--surface);border-bottom:1px solid var(--line);padding:0 2.5rem 1.5rem;position:relative}
.avatar-ring{position:absolute;top:-44px;left:2.5rem;width:88px;height:88px;border-radius:50%;border:4px solid var(--surface);background:linear-gradient(135deg,var(--navy2),var(--crimson2));display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 4px 18px rgba(0,0,0,.22)}
.avatar-ring img{width:100%;height:100%;object-fit:cover}
.av-initials{font-family:var(--serif);font-size:2rem;font-weight:900;color:#fff;user-select:none}
.profile-top-row{display:flex;align-items:flex-end;justify-content:space-between;padding-top:52px;gap:1rem;flex-wrap:wrap}
.profile-name-block{min-width:0}
.profile-name{font-family:var(--serif);font-size:1.75rem;font-weight:900;line-height:1.1;display:flex;align-items:center;gap:.55rem;flex-wrap:wrap}
.profile-handle{font-size:.83rem;color:var(--ink3);margin-top:.2rem}
.profile-actions{display:flex;align-items:center;gap:.5rem;flex-shrink:0}
.btn-follow{padding:.52rem 1.35rem;border-radius:9px;font-size:.84rem;font-weight:700;border:none;cursor:pointer;transition:all var(--t)}
.btn-follow.unfollow{background:var(--bg2);color:var(--ink2);border:1.5px solid var(--line)}
.btn-follow.unfollow:hover{border-color:var(--red);color:var(--red);background:var(--red-lt)}
.btn-follow.follow{background:linear-gradient(135deg,var(--navy2),var(--crimson2));color:#fff}
.btn-follow.follow:hover{opacity:.87}
.btn-follow:disabled{opacity:.5;cursor:not-allowed}
.profile-stats{display:flex;gap:2rem;margin-top:1.1rem;flex-wrap:wrap}
.stat-item{cursor:pointer}
.stat-item:hover .stat-num{color:var(--navy2)}
.stat-num{font-family:var(--serif);font-size:1.2rem;font-weight:900;color:var(--ink)}
.stat-lbl{font-size:.72rem;color:var(--ink3);margin-top:-.1rem}
.profile-about{margin-top:.85rem;max-width:580px;font-family:var(--body-t);font-size:.88rem;color:var(--ink2);line-height:1.7}
.profile-about.collapsed{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.about-toggle{font-size:.77rem;font-weight:700;color:var(--navy2);background:none;border:none;cursor:pointer;margin-top:.3rem;padding:0;display:block;transition:color var(--t)}
.about-toggle:hover{color:var(--crimson2)}
.profile-tabs{background:var(--surface);border-bottom:1px solid var(--line);padding:0 2.5rem;display:flex;gap:0;position:sticky;top:62px;z-index:100;overflow-x:auto}
.profile-tabs::-webkit-scrollbar{display:none}
.p-tab{padding:.72rem 1rem;font-size:.82rem;font-weight:700;color:var(--ink3);border-bottom:2.5px solid transparent;cursor:pointer;white-space:nowrap;transition:color var(--t),border-color var(--t);display:flex;align-items:center;gap:.4rem;margin-bottom:-1px;background:none;border-left:none;border-right:none;border-top:none}
.p-tab svg{width:15px;height:15px}
.p-tab:hover{color:var(--ink2)}
.p-tab.on{color:var(--navy2);border-bottom-color:var(--navy2)}
.p-tab-count{font-size:.64rem;font-weight:800;padding:.08rem .4rem;border-radius:20px;background:var(--bg2);color:var(--ink3)}
.p-tab.on .p-tab-count{background:var(--navy-lt);color:var(--navy2)}
.content-wrap{max-width:1080px;margin:0 auto;padding:2rem 2.5rem 4rem}
.sec-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem}
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
.follow-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem}
.follow-card{background:var(--surface);border:1px solid var(--line);border-radius:13px;padding:1rem;display:flex;flex-direction:column;align-items:center;gap:.5rem;text-align:center;transition:box-shadow var(--t),border-color var(--t);cursor:pointer}
.follow-card:hover{box-shadow:0 4px 18px var(--shade2);border-color:var(--navy-lt)}
.fc-ava{width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:1.3rem;font-weight:900;color:#fff;overflow:hidden;background:linear-gradient(135deg,var(--navy2),var(--crimson2))}
.fc-ava img{width:100%;height:100%;object-fit:cover}
.fc-name{font-size:.85rem;font-weight:700;color:var(--ink)}
.fc-sub{font-size:.7rem;color:var(--ink3)}
.empty-panel{text-align:center;padding:3rem 1rem;color:var(--ink3)}
.empty-panel svg{width:44px;height:44px;margin:0 auto 1rem;display:block;opacity:.35}
.empty-panel-title{font-family:var(--serif);font-size:1rem;font-weight:900;color:var(--ink2);margin-bottom:.3rem}
.empty-panel-sub{font-size:.8rem}
.toast{position:fixed;bottom:1.75rem;left:50%;transform:translateX(-50%);background:rgba(24,28,44,.95);color:#fff;z-index:600;padding:.55rem 1.15rem;border-radius:10px;font-size:.79rem;font-weight:600;box-shadow:0 6px 24px rgba(0,0,0,.28);pointer-events:none;animation:toastIn .2s ease}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
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
            {currentUserId && currentUserId !== profileId && (
              <button
                className={`btn-follow ${following ? 'unfollow' : 'follow'}`}
                onClick={toggleFollow}
                disabled={followLoading}
              >
                {followLoading ? '…' : following ? 'Takipten Çık' : 'Takip Et'}
              </button>
            )}
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
        {profile.bio && (
          <>
            <div className={`profile-about${aboutExpanded ? '' : ' collapsed'}`}>
              {profile.bio}
            </div>
            {profile.bio.length > 120 && (
              <button className="about-toggle" onClick={() => setAboutExpanded(v => !v)}>
                {aboutExpanded ? 'Daha Az Göster' : 'Devamını Oku'}
              </button>
            )}
          </>
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
            </div>
            {stories.length === 0 ? (
              <div className="empty-panel">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                <div className="empty-panel-title">Henüz yayınlanmış kitap yok</div>
                <div className="empty-panel-sub">Bu yazar henüz bir kitap yayınlamamış.</div>
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
                <div className="empty-panel-title">Henüz takipçi yok</div>
                <div className="empty-panel-sub">Bu yazarın henüz takipçisi bulunmuyor.</div>
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
                <div className="empty-panel-title">Henüz kimseyi takip etmiyor</div>
                <div className="empty-panel-sub">Bu yazar henüz kimseyi takip etmiyor.</div>
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

      {toast && (
        <div className="toast">{toast}</div>
      )}

      <footer>© 2026 Foliom. Tüm hakları saklıdır.</footer>
    </>
  )
}
