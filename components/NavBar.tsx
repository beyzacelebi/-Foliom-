'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ─── Types ───────────────────────────────────────────────────────────────────
export type NavPage =
  | 'home' | 'library' | 'notifications' | 'profile'
  | 'settings' | 'analytics' | 'story' | 'search'

interface NavBarProps {
  activePage?: NavPage
  /** "Geri" butonu göster — profil sayfası için */
  showBack?: boolean
  /** "Anasayfa" linki göster — story / book-detail sayfaları için */
  showHomeLink?: boolean
  /** Avatar üzerindeki bildirim noktası; default true */
  hasNotifDot?: boolean
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const NAV_CSS = `
nav{position:sticky;top:0;z-index:200;background:var(--surface,#fff);
    border-bottom:1px solid var(--line,#dde0e8);
    box-shadow:0 2px 16px rgba(24,28,44,.07);
    height:62px;display:flex;align-items:center;padding:0 2.5rem;gap:1rem}
.nav-logo{display:flex;align-items:center;gap:.6rem;flex-shrink:0;cursor:pointer;text-decoration:none}
.nav-logo-mark{width:34px;height:34px;
    background:linear-gradient(135deg,var(--navy,#1e3a6e),var(--crimson,#6b1a34));
    border-radius:9px;display:flex;align-items:center;justify-content:center}
.nav-logo-mark svg{width:18px;height:18px;fill:#fff}
.nav-logo-text{font-family:var(--serif,'Cormorant Garamond',Georgia,serif);
    font-size:1.45rem;font-weight:900;letter-spacing:3px;line-height:1;
    background:linear-gradient(135deg,var(--navy,#1e3a6e),var(--crimson,#6b1a34));
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.nav-sep{width:1px;height:22px;background:var(--line,#dde0e8);flex-shrink:0;margin:0 .2rem}
.nav-link{display:flex;align-items:center;gap:.38rem;padding:.4rem .8rem;border-radius:7px;
    font-size:.82rem;font-weight:600;color:var(--ink2,#434961);background:none;border:none;
    cursor:pointer;white-space:nowrap;font-family:var(--sans,'Nunito Sans',sans-serif);
    transition:background .2s ease,color .2s ease}
.nav-link svg{width:15px;height:15px;flex-shrink:0}
.nav-link:hover{background:var(--bg2,#e8eaf0);color:var(--navy,#1e3a6e)}
.nav-link.active{background:var(--navy-xlt,#edf2fc);color:var(--navy2,#2e4f91);font-weight:700}
.nav-right{margin-left:auto;display:flex;align-items:center;gap:.55rem;flex-shrink:0}
.nav-icon-btn{width:36px;height:36px;border-radius:8px;background:none;
    border:1.5px solid var(--line,#dde0e8);display:flex;align-items:center;justify-content:center;
    cursor:pointer;color:var(--ink3,#8890aa);
    transition:border-color .2s ease,color .2s ease,background .2s ease}
.nav-icon-btn svg{width:18px;height:18px}
.nav-icon-btn:hover{border-color:var(--navy3,#4169af);color:var(--navy2,#2e4f91);background:var(--navy-xlt,#edf2fc)}
.nav-icon-btn.active{border-color:var(--navy3,#4169af);color:var(--navy2,#2e4f91);background:var(--navy-xlt,#edf2fc)}
.nav-notif-wrap{position:relative;display:inline-flex;align-items:center}
.nav-notif-dot{position:absolute;top:5px;right:5px;width:7px;height:7px;border-radius:50%;
    background:var(--crimson3,#b83360);border:2px solid var(--surface,#fff);pointer-events:none}
.nav-avatar{width:36px;height:36px;border-radius:50%;flex-shrink:0;
    background:linear-gradient(135deg,var(--navy2,#2e4f91),var(--crimson2,#8f2448));
    display:flex;align-items:center;justify-content:center;
    font-family:var(--serif,'Cormorant Garamond',Georgia,serif);
    font-size:.95rem;font-weight:900;color:#fff;
    cursor:pointer;border:2px solid transparent;transition:all .2s ease}
.nav-avatar:hover{border-color:var(--navy3,#4169af);box-shadow:0 0 0 3px rgba(65,105,175,.18)}
.nav-avatar.active{border-color:var(--navy3,#4169af);box-shadow:0 0 0 3px rgba(65,105,175,.18)}
.nav-btn{display:flex;align-items:center;gap:.4rem;padding:.42rem 1rem;border-radius:8px;
    font-size:.82rem;font-weight:700;cursor:pointer;white-space:nowrap;
    font-family:var(--sans,'Nunito Sans',sans-serif);transition:all .2s ease}
.nav-btn svg{width:14px;height:14px;flex-shrink:0}
.nav-btn-danger{background:none;color:var(--red,#c0392b);border:1.5px solid rgba(192,57,43,.35)}
.nav-btn-danger:hover{background:var(--red-lt,#fdecea);border-color:var(--red,#c0392b)}
.nav-btn-ghost{background:none;color:var(--ink2,#434961);border:1.5px solid var(--line,#dde0e8)}
.nav-btn-ghost:hover{border-color:var(--navy3,#4169af);color:var(--navy2,#2e4f91);background:var(--navy-xlt,#edf2fc)}
.nav-btn-solid{background:linear-gradient(135deg,var(--navy2,#2e4f91),var(--crimson2,#8f2448));color:#fff;border:none;box-shadow:0 2px 10px rgba(30,58,110,.28)}
.nav-btn-solid:hover{opacity:.88}
@media(max-width:640px){nav{padding:0 1rem;gap:.55rem}
  .nav-link span{display:none}
  .nav-btn-danger span{display:none}
  .nav-btn-ghost span{display:none}
}
`

// ─── SVG helpers ─────────────────────────────────────────────────────────────
const Logo = () => (
  <svg viewBox="0 0 24 24">
    <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
  </svg>
)

const IcoHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
)

const IcoBack = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
  </svg>
)

const IcoLibrary = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
)

const IcoBell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
  </svg>
)

const IcoSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
)

// ─── Component ───────────────────────────────────────────────────────────────
export default function NavBar({
  activePage,
  showBack = false,
  showHomeLink = false,
  hasNotifDot = true,
}: NavBarProps) {
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [initials, setInitials] = useState('?')

  function makeInitials(session: import('@supabase/supabase-js').Session | null) {
    if (!session) return '?'
    const name: string =
      session.user.user_metadata?.full_name ||
      session.user.user_metadata?.name ||
      session.user.email || ''
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    if (parts[0]?.length >= 2) return parts[0].slice(0, 2).toUpperCase()
    return parts[0]?.[0]?.toUpperCase() || '?'
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session)
      setInitials(makeInitials(session))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session)
      setInitials(makeInitials(session))
    })
    return () => subscription.unsubscribe()
  }, [])

  const go = (path: string) => router.push(path)

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const isActive = (page: NavPage) => activePage === page

  return (
    <>
      <style>{NAV_CSS}</style>

      <nav>
        {/* Logo */}
        <a className="nav-logo" href="/" onClick={(e) => { e.preventDefault(); go('/') }}>
          <div className="nav-logo-mark"><Logo /></div>
          <span className="nav-logo-text">FOLIOM</span>
        </a>

        {/* Sol: Geri butonu (profil sayfası) */}
        {showBack && (
          <>
            <div className="nav-sep" />
            <button className="nav-link" onClick={() => router.back()}>
              <IcoBack />
              <span>Geri</span>
            </button>
          </>
        )}

        {/* Sol: Anasayfa linki (story / book-detail sayfaları) */}
        {showHomeLink && !showBack && (
          <>
            <div className="nav-sep" />
            <button
              className={`nav-link${isActive('home') ? ' active' : ''}`}
              onClick={() => go('/')}
            >
              <IcoHome />
              <span>Anasayfa</span>
            </button>
          </>
        )}

        {/* Sol: Anasayfa aktif (ana sayfa) */}
        {isActive('home') && !showBack && !showHomeLink && (
          <>
            <div className="nav-sep" />
            <button className="nav-link active">
              <IcoHome />
              <span>Anasayfa</span>
            </button>
          </>
        )}

        {/* Sağ grup */}
        <div className="nav-right">

          {/* Giriş yapılmışsa: Kütüphane + Bildirimler + Arama + Avatar + Çıkış */}
          {loggedIn === true && (
            <>
              {/* Kütüphane linki */}
              <button
                className={`nav-link${isActive('library') ? ' active' : ''}`}
                onClick={() => go('/library')}
              >
                <IcoLibrary />
                <span>Kütüphane</span>
              </button>

              {/* Bildirimler */}
              <div className="nav-notif-wrap">
                <button
                  className={`nav-icon-btn${isActive('notifications') ? ' active' : ''}`}
                  onClick={() => go('/notifications')}
                  title="Bildirimler"
                >
                  <IcoBell />
                </button>
                {hasNotifDot && !isActive('notifications') && (
                  <span className="nav-notif-dot" />
                )}
              </div>

              {/* Arama */}
              <button
                className={`nav-icon-btn${isActive('search') ? ' active' : ''}`}
                onClick={() => go('/search')}
                title="Ara"
              >
                <IcoSearch />
              </button>

              {/* Avatar */}
              <button
                className={`nav-avatar${isActive('profile') || isActive('settings') ? ' active' : ''}`}
                onClick={() => go('/profile')}
                title="Profilim"
              >
                {initials}
              </button>

              {/* Çıkış Yap */}
              <button className="nav-btn nav-btn-danger" onClick={signOut}>
                <span>Çıkış Yap</span>
              </button>
            </>
          )}

          {/* Giriş yapılmamışsa: Arama + Giriş Yap + Üye Ol */}
          {loggedIn === false && (
            <>
              {/* Arama — herkese açık */}
              <button
                className={`nav-icon-btn${isActive('search') ? ' active' : ''}`}
                onClick={() => go('/search')}
                title="Ara"
              >
                <IcoSearch />
              </button>

              <button className="nav-btn nav-btn-ghost" onClick={() => go('/auth')}>
                <span>Giriş Yap</span>
              </button>

              <button className="nav-btn nav-btn-solid" onClick={() => go('/auth')}>
                <span>Üye Ol</span>
              </button>
            </>
          )}

          {/* loggedIn === null: yükleniyor, hiç gösterme (layout kaymasını önler) */}

        </div>
      </nav>
    </>
  )
}
