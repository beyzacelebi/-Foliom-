'use client'

import NavBar from '@/components/NavBar'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  type: 'follow' | 'comment' | 'rating' | 'newChapter'
  is_read: boolean
  created_at: string
  story_id: string | null
  sender: {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
  } | null
  story_title?: string | null
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Az önce'
  if (mins < 60) return `${mins} dakika önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} saat önce`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} gün önce`
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
}

function groupByDate(items: Notification[]): { label: string; items: Notification[] }[] {
  const now = Date.now()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const weekStart = new Date(now - 7 * 86400000)
  const today: Notification[] = []
  const week: Notification[] = []
  const older: Notification[] = []
  for (const n of items) {
    const d = new Date(n.created_at)
    if (d >= todayStart) today.push(n)
    else if (d >= weekStart) week.push(n)
    else older.push(n)
  }
  const groups = []
  if (today.length) groups.push({ label: 'Bugün', items: today })
  if (week.length) groups.push({ label: 'Bu Hafta', items: week })
  if (older.length) groups.push({ label: 'Daha Eski', items: older })
  return groups
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<'all' | 'follow' | 'comment' | 'rating' | 'newChapter'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth'); return }

      // 1. Fetch user's stories for comments and ratings
      const { data: myStoriesData } = await supabase.from('stories').select('id, title').eq('author_id', user.id)
      const myStoryIds = (myStoriesData || []).map(s => s.id)
      const myStoryMap = Object.fromEntries((myStoriesData || []).map(s => [s.id, s.title]))

      // 2. Fetch user's favorite stories for new chapters
      const { data: myFavsData } = await supabase.from('favorites').select('story_id').eq('user_id', user.id)
      const myFavStoryIds = (myFavsData || []).map(f => f.story_id)

      // Fetch the titles and authors of the favorite stories
      let favStoryMap: Record<string, { title: string, author_id: string }> = {}
      if (myFavStoryIds.length > 0) {
        const { data: favStoriesData } = await supabase.from('stories').select('id, title, author_id').in('id', myFavStoryIds)
        favStoryMap = Object.fromEntries((favStoriesData || []).map((s: any) => [s.id, { title: s.title, author_id: s.author_id }]))
      }

      // Execute all sub-queries in parallel
      const [followsRes, commentsRes, ratingsRes, chaptersRes] = await Promise.all([
        supabase.from('follows').select('follower_id, created_at').eq('following_id', user.id),
        myStoryIds.length > 0 ? supabase.from('story_comments').select('id, user_id, story_id, created_at').in('story_id', myStoryIds) : Promise.resolve({ data: [] }),
        myStoryIds.length > 0 ? supabase.from('ratings').select('id, user_id, story_id, created_at').in('story_id', myStoryIds) : Promise.resolve({ data: [] }),
        myFavStoryIds.length > 0 ? supabase.from('chapters').select('id, story_id, created_at').in('story_id', myFavStoryIds).eq('is_published', true) : Promise.resolve({ data: [] })
      ])

      const rawNotifs: any[] = []

        // Process Follows
        ; (followsRes.data || []).forEach((f: any) => {
          rawNotifs.push({
            id: `f-${f.follower_id}-${f.created_at}`,
            type: 'follow',
            created_at: f.created_at,
            story_id: null,
            sender_id: f.follower_id
          })
        })

        // Process Comments
        ; (commentsRes.data || []).forEach((c: any) => {
          if (c.user_id === user.id) return // Don't notify for own comments
          rawNotifs.push({
            id: `c-${c.id}`,
            type: 'comment',
            created_at: c.created_at,
            story_id: c.story_id,
            sender_id: c.user_id
          })
        })

        // Process Ratings
        ; (ratingsRes.data || []).forEach((r: any) => {
          if (r.user_id === user.id) return
          rawNotifs.push({
            id: `r-${r.id}`,
            type: 'rating',
            created_at: r.created_at,
            story_id: r.story_id,
            sender_id: r.user_id
          })
        })

        // Process New Chapters
        ; (chaptersRes.data || []).forEach((ch: any) => {
          const storyInfo = favStoryMap[ch.story_id]
          if (!storyInfo || storyInfo.author_id === user.id) return // Don't notify for own books
          rawNotifs.push({
            id: `ch-${ch.id}`,
            type: 'newChapter',
            created_at: ch.created_at,
            story_id: ch.story_id,
            sender_id: storyInfo.author_id
          })
        })

      // Sort by newest first
      rawNotifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      if (rawNotifs.length === 0) {
        setLoading(false)
        return
      }

      // Fetch all unique senders
      const senderIds = [...new Set(rawNotifs.map(n => n.sender_id).filter(Boolean))]
      let profileMap: Record<string, any> = {}
      if (senderIds.length > 0) {
        const { data: profilesData } = await supabase.from('profiles').select('id, display_name, username, avatar_url').in('id', senderIds)
        profileMap = Object.fromEntries((profilesData || []).map((p: any) => [p.id, p]))
      }

      // Check localStorage for read status
      const lastReadStr = localStorage.getItem(`last_read_notifs_${user.id}`)
      const lastReadTime = lastReadStr ? parseInt(lastReadStr, 10) : 0

      const assembledNotifs: Notification[] = rawNotifs.map(n => ({
        id: n.id,
        type: n.type,
        is_read: new Date(n.created_at).getTime() <= lastReadTime,
        created_at: n.created_at,
        story_id: n.story_id,
        sender: profileMap[n.sender_id] || null,
        story_title: n.story_id ? (myStoryMap[n.story_id] || favStoryMap[n.story_id]?.title || null) : null
      }))

      setNotifications(assembledNotifs)
      setLoading(false)
    })
  }, [router])

  async function markAllRead() {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        localStorage.setItem(`last_read_notifs_${user.id}`, Date.now().toString())
      }
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    })
  }

  async function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.type === filter)
  const unreadCount = notifications.filter(n => !n.is_read).length
  const counts = {
    all: notifications.length,
    follow: notifications.filter(n => n.type === 'follow').length,
    comment: notifications.filter(n => n.type === 'comment').length,
    rating: notifications.filter(n => n.type === 'rating').length,
    newChapter: notifications.filter(n => n.type === 'newChapter').length,
  }
  const groups = groupByDate(filtered)

  function notifText(n: Notification): string {
    const name = n.sender?.display_name || n.sender?.username || 'Biri'
    const story = n.story_title ? `"${n.story_title}"` : 'bir kitabın'
    if (n.type === 'follow') return `${name} seni takip etmeye başladı`
    if (n.type === 'comment') return `${name}, ${story} kitabına yorum yaptı`
    if (n.type === 'rating') return `${name}, ${story} kitabını puanladı`
    if (n.type === 'newChapter') return `${name}, ${story} adlı kitabına yeni bölüm ekledi`
    return ''
  }

  const typeColors: Record<string, string> = {
    follow: '#2e4f91',
    comment: '#8f2448',
    rating: '#e6a817',
    newChapter: '#1b6b3a',
  }
  const typeIcons: Record<string, string> = {
    follow: 'M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z',
    comment: 'M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z',
    rating: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z',
    newChapter: 'M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25',
  }

  const tabs = [
    { id: 'all' as const, label: 'Tümü' },
    { id: 'follow' as const, label: 'Takipçiler' },
    { id: 'comment' as const, label: 'Yorumlar' },
    { id: 'rating' as const, label: 'Puanlar' },
    { id: 'newChapter' as const, label: 'Bölümler' },
  ]

  return (
    <>
      <style>{`
:root{
  --bg:#f2f3f7;--bg2:#e8eaf0;--surface:#fff;
  --ink:#181c2c;--ink2:#434961;--ink3:#8890aa;--ink4:#b4bacf;
  --navy:#1e3a6e;--navy2:#2e4f91;--navy3:#4169af;--navy-lt:#d6e2f7;--navy-xlt:#edf2fc;
  --crimson:#6b1a34;--crimson2:#8f2448;--crimson3:#b83360;--crimson-lt:#f0d6de;
  --green:#1b6b3a;--green-lt:#e6f7ed;
  --amber:#c47a0a;--amber-lt:#fef3dc;
  --line:#dde0e8;--shade:rgba(24,28,44,.07);--shade2:rgba(24,28,44,.13);
  --serif:'Cormorant Garamond',Georgia,serif;--sans:'Nunito Sans',sans-serif;--t:.2s ease;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--sans);background:var(--bg);color:var(--ink);min-height:100vh;-webkit-font-smoothing:antialiased}
a{text-decoration:none;color:inherit}
button{font-family:inherit;cursor:pointer;border:none;background:none}

.page-wrap{max-width:720px;margin:0 auto;padding:2rem 1.5rem 5rem}
.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:.75rem}
.page-title-row{display:flex;align-items:center;gap:.75rem}
.page-title{font-family:var(--serif);font-size:1.75rem;font-weight:900}
.unread-badge{background:var(--crimson2);color:#fff;font-size:.65rem;font-weight:800;padding:.22rem .55rem;border-radius:20px;letter-spacing:.3px}
.header-actions{display:flex;gap:.5rem}
.hdr-btn{display:flex;align-items:center;gap:.35rem;padding:.38rem .85rem;border-radius:8px;font-size:.77rem;font-weight:700;border:1.5px solid var(--line);color:var(--ink2);transition:all var(--t)}
.hdr-btn:hover{border-color:var(--navy3);color:var(--navy2);background:var(--navy-xlt)}
.hdr-btn svg{width:13px;height:13px}

.notif-settings-bar{background:var(--bg2);border:1px solid var(--line);border-radius:11px;padding:.75rem 1rem;display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem}
.nsb-text{font-size:.79rem;color:var(--ink3)}
.nsb-link{font-size:.79rem;font-weight:700;color:var(--navy2);cursor:pointer;transition:color var(--t);display:flex;align-items:center;gap:.3rem}
.nsb-link:hover{color:var(--crimson2)}
.nsb-link svg{width:13px;height:13px}

.notif-tabs{display:flex;gap:0;border-bottom:1px solid var(--line);margin-bottom:1.5rem}
.nt{padding:.62rem 1rem;font-size:.8rem;font-weight:700;color:var(--ink3);cursor:pointer;border-bottom:2.5px solid transparent;transition:all var(--t);white-space:nowrap;display:flex;align-items:center;gap:.38rem;margin-bottom:-1px;background:none;border-left:none;border-right:none;border-top:none}
.nt:hover{color:var(--ink2)}
.nt.on{color:var(--navy2);border-bottom-color:var(--navy2)}
.nt-count{font-size:.62rem;font-weight:800;padding:.06rem .38rem;border-radius:20px;background:var(--bg2);color:var(--ink3)}
.nt.on .nt-count{background:var(--navy-lt);color:var(--navy2)}

.notif-group{margin-bottom:1.75rem}
.group-label{font-size:.68rem;font-weight:800;letter-spacing:.9px;text-transform:uppercase;color:var(--ink3);margin-bottom:.65rem;padding:0 .1rem}

.notif-item{display:flex;align-items:flex-start;gap:.9rem;background:var(--surface);border:1px solid var(--line);border-radius:13px;padding:.95rem 1.05rem;margin-bottom:.55rem;cursor:pointer;transition:box-shadow var(--t),border-color var(--t),background var(--t);position:relative}
.notif-item:hover{box-shadow:0 4px 18px var(--shade2);border-color:var(--navy-lt)}
.notif-item.unread{background:#fafbff;border-color:var(--navy-lt)}
.notif-item.unread::before{content:'';position:absolute;left:-1px;top:50%;transform:translateY(-50%);width:3px;height:60%;background:linear-gradient(to bottom,var(--navy2),var(--crimson2));border-radius:0 3px 3px 0}

.ni-avatar-wrap{position:relative;flex-shrink:0}
.ni-avatar{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:1.1rem;font-weight:900;color:#fff;overflow:hidden}
.ni-avatar img{width:100%;height:100%;object-fit:cover}
.ni-type-ico{position:absolute;bottom:-3px;right:-3px;width:18px;height:18px;border-radius:50%;border:2px solid var(--surface);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ni-type-ico svg{width:9px;height:9px;color:#fff}

.ni-body{flex:1;min-width:0}
.ni-text{font-size:.83rem;color:var(--ink2);line-height:1.55;margin-bottom:.3rem}
.ni-text strong{color:var(--ink);font-weight:700}
.ni-time{font-size:.69rem;color:var(--ink4)}

.empty-notif{text-align:center;padding:4rem 2rem}
.empty-notif-ico{width:70px;height:70px;margin:0 auto 1rem;border-radius:18px;background:var(--bg2);display:flex;align-items:center;justify-content:center}
.empty-notif-ico svg{width:28px;height:28px;color:var(--ink4)}
.empty-notif h3{font-family:var(--serif);font-size:1.25rem;font-weight:900;margin-bottom:.4rem}
.empty-notif p{font-size:.83rem;color:var(--ink3);max-width:300px;margin:0 auto;line-height:1.65}

footer{background:var(--ink);color:rgba(255,255,255,.3);padding:1.5rem 2.5rem;font-size:.78rem;text-align:center}
@media(max-width:600px){.page-wrap{padding-left:1rem;padding-right:1rem;padding-top:1.5rem}}
      `}</style>

      <NavBar activePage="notifications" hasNotifDot={unreadCount > 0} />

      <div className="page-wrap">
        <div className="page-header">
          <div className="page-title-row">
            <h1 className="page-title">Bildirimler</h1>
            {unreadCount > 0 && <span className="unread-badge">{unreadCount} okunmadı</span>}
          </div>
          <div className="header-actions">
            <button className="hdr-btn" onClick={markAllRead}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Tümünü Okundu İşaretle
            </button>
          </div>
        </div>

        <div className="notif-settings-bar">
          <span className="nsb-text">Hangi bildirimleri aldığını özelleştirebilirsin.</span>
          <button className="nsb-link" onClick={() => router.push('/settings')}>
            Bildirim Ayarları
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        <div className="notif-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nt${filter === tab.id ? ' on' : ''}`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
              <span className="nt-count">{counts[tab.id]}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink4)', fontFamily: 'var(--serif)', fontSize: '1rem' }}>
            Yükleniyor…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-notif">
            <div className="empty-notif-ico">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </div>
            <h3>Bildirim yok</h3>
            <p>Henüz {filter === 'all' ? 'hiç bildirim' : filter === 'follow' ? 'takipçi' : filter === 'comment' ? 'yorum' : filter === 'newChapter' ? 'yeni bölüm' : 'puanlama'} bildirimin yok.</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.label} className="notif-group">
              <div className="group-label">{group.label}</div>
              {group.items.map(n => {
                const senderName = n.sender?.display_name || n.sender?.username || 'Biri'
                const initial = senderName[0]?.toUpperCase() || '?'
                const color = typeColors[n.type] || '#8890aa'
                const icon = typeIcons[n.type]
                return (
                  <div
                    key={n.id}
                    className={`notif-item${n.is_read ? '' : ' unread'}`}
                    onClick={() => {
                      markRead(n.id)
                      if (n.story_id) router.push(`/story/${n.story_id}`)
                      else if (n.type === 'follow' && n.sender?.id) router.push(`/profile/${n.sender.id}`)
                    }}
                  >
                    <div className="ni-avatar-wrap">
                      <div className="ni-avatar" style={{ background: `linear-gradient(135deg,${color},${color}aa)` }}>
                        {n.sender?.avatar_url
                          ? <img src={n.sender.avatar_url} alt={senderName} />
                          : initial
                        }
                      </div>
                      <div className="ni-type-ico" style={{ background: color }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                        </svg>
                      </div>
                    </div>
                    <div className="ni-body">
                      <div className="ni-text"><strong>{senderName}</strong> {notifText(n).replace(senderName, '').trim()}</div>
                      <div className="ni-time">{timeAgo(n.created_at)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      <footer>© 2026 Foliom. Tüm hakları saklıdır.</footer>
    </>
  )
}
