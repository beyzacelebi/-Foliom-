'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'
import './profile.css'

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

export default function UserProfileClient({ profileId }: { profileId: string }) {
  const router = useRouter()

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
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        if (user.id === profileId) {
          router.replace('/profile')
          return
        }
        const { data: followData } = await supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', profileId)
          .maybeSingle()
        setFollowing(!!followData)
      }

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
      showToast('Takipten cikaldi')
    } else {
      await supabase.from('follows').insert({ follower_id: currentUserId, following_id: profileId })
      setFollowing(true)
      setFollowerCount(c => c + 1)
      showToast('Takip edildi!')
    }
    setFollowLoading(false)
  }

  const displayName = profile?.display_name || profile?.username || 'Kullanici'
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
      id: 'followers', label: 'Takipciler', count: followerCount,
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
          Yukleniyor
        </div>
      </>
    )
  }

  if (notFound || !profile) {
    return (
      <>
        <NavBar />
        <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2rem', fontWeight: 700 }}>Profil bulunamadi</span>
          <button onClick={() => router.back()} style={{ padding: '.55rem 1.2rem', borderRadius: 8, background: '#2e4f91', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Geri Don</button>
        </div>
      </>
    )
  }

  return (
    <>
      <NavBar />

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
                className={'btn-follow ' + (following ? 'unfollow' : 'follow')}
                onClick={toggleFollow}
                disabled={followLoading}
              >
                {followLoading ? '...' : following ? 'Takipten Cik' : 'Takip Et'}
              </button>
            )}
          </div>
        </div>

        <div className="profile-stats">
          <div className="stat-item" onClick={() => setActiveTab('followers')}>
            <div className="stat-num">{followerCount.toLocaleString('tr-TR')}</div>
            <div className="stat-lbl">Takipci</div>
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

        {profile.bio && (
          <>
            <div className={'profile-about' + (aboutExpanded ? '' : ' collapsed')}>
              {profile.bio}
            </div>
            {profile.bio.length > 120 && (
              <button className="about-toggle" onClick={() => setAboutExpanded(v => !v)}>
                {aboutExpanded ? 'Daha Az Goster' : 'Devamini Oku'}
              </button>
            )}
          </>
        )}
      </div>

      <div className="profile-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={'p-tab' + (activeTab === tab.id ? ' on' : '')}
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

      <div className="content-wrap">

        {activeTab === 'books' && (
          <>
            <div className="sec-header">
              <div className="sec-title">
                Yayinlanan Kitaplar
                <span className="sec-title-count">{stories.length}</span>
              </div>
            </div>
            {stories.length === 0 ? (
              <div className="empty-panel">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
                <div className="empty-panel-title">Henuz yayinlanmis kitap yok</div>
                <div className="empty-panel-sub">Bu yazar henuz bir kitap yayinlamamis.</div>

                ) : (
              <div className="follow-grid">
                {followingList.map(u => (
                  <div key={u.id} className="follow-card" onClick={() => router.push('/profile/' + u.id)}>
                    <div className="fc-ava">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={u.display_name || ''} />
                        : (u.display_name || u.username || '?')[0].toUpperCase()
                      }
                    </div>
                    <div className="fc-name">{u.display_name || u.username || 'Kullanici'}</div>
                    {u.username && <div className="fc-sub">{'@' + u.username}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {toast && <div className="toast">{toast}</div>}

      <footer>2026 Foliom. Tum haklari saklidir.</footer>
    </>
  )
}
