'use client'

import NavBar from '@/components/NavBar'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const GRAD_PAIRS = [
  ['#1a2e5a', '#3a0e20'], ['#0d2a1a', '#1a3a10'], ['#0d1e3a', '#0d3020'],
  ['#1a2a10', '#102010'], ['#1a1040', '#3a1060'], ['#2a1800', '#402808'],
  ['#1a0838', '#2d0850'], ['#0a1828', '#1a2838'],
]

interface Story {
  id: string; title: string; genre: string | null;
  is_published: boolean; view_count: number;
  cover_url: string | null; author_id: string; created_at: string;
}

export default function HomePage() {
  const router = useRouter()

  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [loadingStories, setLoadingStories] = useState(true)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setLoggedIn(!!s))
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    supabase
      .from('stories')
      .select('id,title,genre,is_published,view_count,cover_url,author_id,created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setStories(data || [])
        setLoadingStories(false)
      })
  }, [])

  function addToLibrary() {
    if (!loggedIn) { router.push('/auth'); return }
    alert('Kitaplığınıza eklendi!')
  }

  // En çok görüntülenenler
  const topViewed = [...stories].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 10)
  // En yeni eklenenler
  const newest = [...stories].slice(0, 10)
  // Hero & shelf
  const heroStory = topViewed[0] || stories[0] || null
  const shelfStories = stories.slice(0, 5)

  function getGrad(id: string, idx: number) {
    const pair = GRAD_PAIRS[idx % GRAD_PAIRS.length]
    return `linear-gradient(155deg,${pair[0]},${pair[1]})`
  }

  function BookCard({ story, idx, badge }: { story: Story; idx: number; badge?: 'fire' | 'sparkle' }) {
    return (
      <div className="bcard" onClick={() => router.push(`/story/${story.id}`)}>
        <div className="bcard-cover">
          <div className="bcard-cover-bg" style={story.cover_url
            ? { backgroundImage: `url(${story.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: getGrad(story.id, idx) }
          } />
          <div className="bcard-overlay" />
          {badge && (
            <div className={`bcard-badge badge-${badge}`}>
              {badge === 'fire'
                ? <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" /></svg> Trend</>
                : <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" /></svg> Yeni</>
              }
            </div>
          )}
          <div className="bcard-cover-title">{story.title}</div>
        </div>
        <div className="bcard-title">{story.title}</div>
        {story.genre && <div className="bcard-author">{story.genre}</div>}
        <div className="bcard-stats">
          <span className="bcard-stat">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
            {story.view_count > 999 ? `${(story.view_count / 1000).toFixed(1)}K` : story.view_count}
          </span>
        </div>
      </div>
    )
  }


  return (
    <>
      <style>{`
/* ─── TOKENS ─────────────────────────────────── */
:root {
  --bg:         #f2f3f7;
  --bg2:        #e8eaf0;
  --surface:    #ffffff;
  --ink:        #181c2c;
  --ink2:       #434961;
  --ink3:       #8890aa;
  --ink4:       #b4bacf;
  --navy:       #1e3a6e;
  --navy2:      #2e4f91;
  --navy3:      #4169af;
  --navy-lt:    #d6e2f7;
  --navy-xlt:   #edf2fc;
  --crimson:    #6b1a34;
  --crimson2:   #8f2448;
  --crimson3:   #b83360;
  --crimson-lt: #f0d6de;
  --line:       #dde0e8;
  --line2:      #c8ccd8;
  --shade:      rgba(24,28,44,.07);
  --shade2:     rgba(24,28,44,.15);
  --shade3:     rgba(24,28,44,.27);
  --serif:      'Cormorant Garamond', Georgia, serif;
  --sans:       'Nunito Sans', sans-serif;
  --body-t:     'Spectral', Georgia, serif;
  --r-sm: 8px; --r-md: 14px; --r-lg: 20px;
  --t: .2s ease;
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: var(--sans); background: var(--bg); color: var(--ink); line-height: 1.5; min-height: 100vh; -webkit-font-smoothing: antialiased; }
a { text-decoration: none; color: inherit; }
button { font-family: inherit; cursor: pointer; border: none; }
ul { list-style: none; }

/* ─── NAV ──────────────────────────────────── */
nav {
  position: sticky; top: 0; z-index: 200;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
  box-shadow: 0 2px 16px var(--shade);
  height: 62px;
  display: flex; align-items: center;
  padding: 0 2.5rem; gap: 1rem;
}

.nav-logo {
  display: flex; align-items: center; gap: .6rem;
  flex-shrink: 0; cursor: pointer;
}
.nav-logo-mark {
  width: 34px; height: 34px;
  background: linear-gradient(135deg, var(--navy), var(--crimson));
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
}
.nav-logo-mark svg { width: 18px; height: 18px; fill: #fff; }
.nav-logo-text {
  font-family: var(--serif); font-size: 1.45rem; font-weight: 900;
  letter-spacing: 3px; line-height: 1;
  background: linear-gradient(135deg, var(--navy), var(--crimson));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

.nav-sep { width: 1px; height: 22px; background: var(--line); flex-shrink: 0; margin: 0 .2rem; }

.nav-link {
  display: flex; align-items: center; gap: .4rem;
  padding: .4rem .8rem; border-radius: 7px;
  font-size: .83rem; font-weight: 600; color: var(--ink2);
  cursor: pointer; white-space: nowrap;
  transition: background var(--t), color var(--t);
  background: none; border: none;
}
.nav-link svg { width: 16px; height: 16px; }
.nav-link:hover { background: var(--bg2); color: var(--navy); }
.nav-link.active { background: var(--navy-lt); color: var(--navy2); }

.nav-right { display: flex; align-items: center; gap: .55rem; margin-left: auto; flex-shrink: 0; }

/* Arama ikon butonu */
.nav-icon-btn {
  width: 36px; height: 36px; border-radius: 8px;
  background: none; border: 1.5px solid var(--line);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ink3);
  transition: border-color var(--t), color var(--t), background var(--t);
}
.nav-icon-btn svg { width: 18px; height: 18px; }
.nav-icon-btn:hover { border-color: var(--navy3); color: var(--navy2); background: var(--navy-xlt); }

/* Giriş / Üye butonları */
.nav-btn {
  display: flex; align-items: center; gap: .4rem;
  padding: .42rem 1rem; border-radius: 8px;
  font-size: .82rem; font-weight: 700;
  cursor: pointer; white-space: nowrap;
  transition: all var(--t);
}
.nav-btn svg { width: 15px; height: 15px; flex-shrink: 0; }
.nav-btn-ghost { background: none; color: var(--ink2); border: 1.5px solid var(--line); }
.nav-btn-ghost:hover { border-color: var(--navy3); color: var(--navy2); background: var(--navy-xlt); }
.nav-btn-solid { background: linear-gradient(135deg, var(--navy2), var(--crimson2)); color: #fff; border: none; box-shadow: 0 2px 10px rgba(30,58,110,.28); }
.nav-btn-solid:hover { opacity: .88; }

/* ─── HERO ─────────────────────────────────── */
.hero { position: relative; overflow: hidden; min-height: 520px; display: flex; align-items: stretch; }

.hero-main {
  flex: 1; position: relative;
  display: flex; align-items: flex-end;
  padding: 3rem 2.5rem; min-height: 520px;
  cursor: pointer; overflow: hidden;
}
.hero-main-bg {
  position: absolute; inset: 0;
  background: linear-gradient(135deg, #1a2e5a 0%, #0d1c3a 40%, #3a0e20 100%);
  transition: transform .5s ease;
  background-size: cover; background-position: center;
}
.hero-main:hover .hero-main-bg { transform: scale(1.03); }
.hero-main-pattern {
  position: absolute; inset: 0; opacity: .055;
  background-image:
    repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,.3) 20px, rgba(255,255,255,.3) 21px),
    repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(255,255,255,.2) 20px, rgba(255,255,255,.2) 21px);
}
.hero-main-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(10,15,35,.92) 0%, rgba(10,15,35,.35) 55%, transparent 100%);
}
.hero-cover-float {
  position: absolute; right: 6rem; top: 50%; transform: translateY(-50%);
  width: 160px; height: 230px; border-radius: 10px;
  box-shadow: 0 24px 60px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08);
  overflow: hidden; pointer-events: none;
  background: rgba(255,255,255,.06);
}
.hero-cover-float img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hero-cover-float-empty {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--serif); font-size: .9rem; font-style: italic;
  color: rgba(255,255,255,.25); text-align: center; padding: .75rem;
}

.hero-content { position: relative; z-index: 1; max-width: 560px; }

.hero-eyebrow {
  display: inline-flex; align-items: center; gap: .45rem;
  background: rgba(255,255,255,.1); backdrop-filter: blur(6px);
  border: 1px solid rgba(255,255,255,.18);
  color: rgba(255,255,255,.85); font-size: .7rem; font-weight: 700;
  letter-spacing: 1.2px; text-transform: uppercase;
  padding: .3rem .85rem; border-radius: 20px; margin-bottom: 1.1rem;
}
.hero-eyebrow svg { width: 12px; height: 12px; }

.hero-content h1 {
  font-family: var(--serif);
  font-size: clamp(2.2rem, 4.5vw, 3.6rem);
  font-weight: 900; line-height: 1.1; color: #fff; margin-bottom: .75rem;
}
.hero-content h1 em { font-style: italic; color: rgba(255,255,255,.78); }

.hero-meta {
  display: flex; align-items: center; gap: 1.25rem;
  color: rgba(255,255,255,.6); font-size: .78rem; margin-bottom: 1.1rem;
}
.hero-meta strong { color: rgba(255,255,255,.9); }
.hero-dot { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,.38); }
.hero-rating { display: flex; align-items: center; gap: .25rem; }
.hero-rating svg { width: 13px; height: 13px; color: #e0c040; }

.hero-excerpt {
  font-family: var(--body-t); font-size: .9rem;
  color: rgba(255,255,255,.7); line-height: 1.7; margin-bottom: 1.5rem;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.hero-actions { display: flex; gap: .75rem; flex-wrap: wrap; align-items: center; }
.btn-primary {
  display: flex; align-items: center; gap: .5rem;
  background: #fff; color: var(--navy);
  padding: .65rem 1.5rem; border-radius: var(--r-sm);
  font-size: .85rem; font-weight: 700; border: none; cursor: pointer;
  box-shadow: 0 4px 20px rgba(0,0,0,.25); transition: opacity var(--t);
}
.btn-primary svg { width: 16px; height: 16px; }
.btn-primary:hover { opacity: .9; }
.btn-ghost-white {
  display: flex; align-items: center; gap: .5rem;
  background: rgba(255,255,255,.1); color: rgba(255,255,255,.85);
  border: 1px solid rgba(255,255,255,.25);
  padding: .65rem 1.2rem; border-radius: var(--r-sm);
  font-size: .85rem; font-weight: 600; cursor: pointer;
  transition: background var(--t);
}
.btn-ghost-white svg { width: 16px; height: 16px; }
.btn-ghost-white:hover { background: rgba(255,255,255,.2); }

/* ─── HERO SHELF ───────────────────────────── */
.hero-shelf {
  width: 255px; flex-shrink: 0;
  background: #0d1525;
  display: flex; flex-direction: column;
  padding: 1.25rem; gap: .55rem; overflow: hidden;
}
.shelf-hd {
  font-size: .67rem; font-weight: 700; letter-spacing: 1.5px;
  text-transform: uppercase; color: rgba(255,255,255,.36);
  padding-bottom: .75rem; border-bottom: 1px solid rgba(255,255,255,.07);
  display: flex; align-items: center; justify-content: space-between;
}
.shelf-hd a {
  color: rgba(255,255,255,.45); font-size: .67rem; font-weight: 600;
  cursor: pointer; display: flex; align-items: center; gap: .1rem;
  transition: color var(--t);
}
.shelf-hd a:hover { color: rgba(255,255,255,.75); }
.shelf-hd a svg { width: 11px; height: 11px; }

.shelf-row {
  display: flex; gap: .7rem; align-items: center;
  cursor: pointer; padding: .45rem .5rem; border-radius: 8px;
  transition: background var(--t);
}
.shelf-row:hover { background: rgba(255,255,255,.06); }
.shelf-cover { width: 40px; height: 54px; border-radius: 5px; flex-shrink: 0; overflow: hidden; position: relative; }
.shelf-cover-bg { position: absolute; inset: 0; }
.shelf-cover-lbl {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-family: var(--serif); font-size: .52rem; font-style: italic;
  color: rgba(255,255,255,.75); text-align: center; padding: 2px;
  text-shadow: 0 1px 4px rgba(0,0,0,.6);
}
.shelf-info { flex: 1; min-width: 0; }
.shelf-title {
  font-family: var(--serif); font-size: .8rem; font-weight: 700;
  color: rgba(255,255,255,.85); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: .1rem;
}
.shelf-author { font-size: .67rem; color: rgba(255,255,255,.36); }
.shelf-badge {
  font-size: .61rem; font-weight: 700; padding: .14rem .42rem; border-radius: 4px;
  white-space: nowrap; flex-shrink: 0; display: flex; align-items: center; gap: .2rem;
}
.shelf-badge svg { width: 9px; height: 9px; }
.badge-hot  { background: rgba(183,51,96,.28); color: #e8607f; }
.badge-new  { background: rgba(65,105,175,.28); color: #7aadff; }
.badge-done { background: rgba(50,180,100,.18); color: #5de898; }

/* ─── LAYOUT ───────────────────────────────── */
.wrap { max-width: 1280px; margin: 0 auto; padding: 0 2rem; }

.sh { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 1.25rem; }
.sh-title { font-family: var(--serif); font-size: 1.5rem; font-weight: 700; line-height: 1; }
.sh-title em { font-style: italic; color: var(--crimson2); }
.sh-sub { font-size: .77rem; color: var(--ink3); margin-top: .22rem; }
.sh-btn {
  display: flex; align-items: center; gap: .2rem;
  font-size: .78rem; font-weight: 700; color: var(--navy2);
  background: var(--navy-lt); padding: .3rem .7rem .3rem .85rem;
  border-radius: 20px; cursor: pointer; white-space: nowrap;
  transition: filter var(--t); border: none;
}
.sh-btn svg { width: 14px; height: 14px; }
.sh-btn:hover { filter: brightness(.94); }

/* ─── CAROUSEL ─────────────────────────────── */
.carousel {
  display: flex; gap: 1rem;
  overflow-x: auto; padding-bottom: .75rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin; scrollbar-color: var(--line2) transparent;
}
.carousel::-webkit-scrollbar { height: 4px; }
.carousel::-webkit-scrollbar-thumb { background: var(--line2); border-radius: 4px; }

/* ─── BOOK CARD ────────────────────────────── */
.bcard { flex-shrink: 0; width: 148px; scroll-snap-align: start; cursor: pointer; }
.bcard-cover {
  width: 148px; height: 210px; border-radius: var(--r-sm); overflow: hidden;
  position: relative; margin-bottom: .65rem;
  box-shadow: 0 4px 16px var(--shade2); transition: box-shadow var(--t), transform var(--t);
}
.bcard:hover .bcard-cover { box-shadow: 0 10px 28px var(--shade3); transform: translateY(-4px); }
.bcard-cover-bg { position: absolute; inset: 0; transition: transform .35s; }
.bcard:hover .bcard-cover-bg { transform: scale(1.06); }
.bcard-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,15,35,.75) 0%, transparent 50%); }

.bcard-badge {
  position: absolute; top: 7px; left: 7px;
  display: flex; align-items: center; gap: .22rem;
  font-size: .6rem; font-weight: 700; letter-spacing: .3px;
  padding: .17rem .48rem; border-radius: 4px; text-transform: uppercase;
}
.bcard-badge svg { width: 9px; height: 9px; }
.badge-fire { background: rgba(183,51,96,.82); color: #fff; }
.badge-sparkle { background: rgba(46,79,145,.85); color: #fff; }

.bcard-fav-btn {
  position: absolute; top: 7px; right: 7px;
  background: rgba(0,0,0,.32); backdrop-filter: blur(4px);
  border: none; border-radius: 50%; width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #fff; transition: background var(--t);
}
.bcard-fav-btn svg { width: 14px; height: 14px; }
.bcard-fav-btn:hover, .bcard-fav-btn.on { background: var(--crimson2); }

.bcard-cover-title {
  position: absolute; bottom: 0; left: 0; right: 0; padding: .6rem .5rem;
  font-family: var(--serif); font-size: .72rem; font-style: italic; font-weight: 700;
  color: rgba(255,255,255,.9); text-align: center; text-shadow: 0 1px 6px rgba(0,0,0,.6);
}
.bcard-title {
  font-family: var(--serif); font-size: .88rem; font-weight: 700;
  line-height: 1.25; margin-bottom: .2rem;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.bcard-author { font-size: .72rem; color: var(--ink3); margin-bottom: .3rem; }
.bcard-stats { display: flex; gap: .55rem; font-size: .68rem; color: var(--ink4); flex-wrap: wrap; }
.bcard-stat { display: flex; align-items: center; gap: .2rem; }
.bcard-stat svg { width: 11px; height: 11px; flex-shrink: 0; }
.bcard-rating { color: #b89010; font-weight: 700; }
.bcard-rating svg { color: #c4a020; }

/* ─── CATEGORY GRID ────────────────────────── */
.cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(145px, 1fr)); gap: .75rem; }
.cat-card {
  border-radius: var(--r-md); overflow: hidden; cursor: pointer;
  position: relative; aspect-ratio: 1.65 / 1;
  display: flex; align-items: flex-end; padding: .75rem;
  transition: transform var(--t), box-shadow var(--t);
}
.cat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px var(--shade2); }
.cat-bg { position: absolute; inset: 0; }
.cat-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(10,15,35,.78) 0%, rgba(10,15,35,.18) 100%); }
.cat-label {
  position: relative; z-index: 1;
  font-family: var(--serif); font-size: .95rem; font-weight: 700;
  color: #fff; text-shadow: 0 1px 6px rgba(0,0,0,.5);
  display: flex; align-items: center; gap: .45rem;
}
.cat-label svg { width: 15px; height: 15px; flex-shrink: 0; }
.cat-count { position: absolute; top: 8px; right: 10px; z-index: 1; font-size: .62rem; color: rgba(255,255,255,.62); }

/* ─── DIVIDER / GAPS ───────────────────────── */
.divider { height: 1px; background: var(--line); margin: 2.75rem 0; }
.section-top { padding-top: 3rem; }
.section-bottom { padding-bottom: 3rem; }

/* ─── FOOTER ───────────────────────────────── */
footer {
  background: var(--ink);
  padding: 1.25rem 2.5rem;
  text-align: center;
  font-size: .75rem;
  color: rgba(255,255,255,.32);
  margin-top: 4rem;
  letter-spacing: .3px;
}

/* ─── ANİMASYON ────────────────────────────── */
@keyframes fadeSlide { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
.anim    { animation: fadeSlide .45s ease both; }
.anim-d1 { animation-delay: .08s; }
.anim-d2 { animation-delay: .18s; }
.anim-d3 { animation-delay: .28s; }

/* ─── RESPONSIVE ───────────────────────────── */
@media (max-width: 900px) {
  .hero { flex-direction: column; }
  .hero-shelf { width: 100%; }
  .hero-main { min-height: 420px; }
}
@media (max-width: 600px) {
  nav { padding: 0 1.2rem; }
  .wrap { padding: 0 1rem; }
  .hero-main { padding: 2rem 1.25rem; }
  .nav-link span { display: none; }
  footer { padding: 1rem 1.25rem; }
}
      `}</style>
      <div>
        {/* ══════════════════════════════════════════
     NAV
══════════════════════════════════════════ */}
        <NavBar activePage="home" />


        {/* ══════════════════════════════════════════
     HERO
══════════════════════════════════════════ */}
        <div className="hero anim">

          {/* Büyük sol panel */}
          <div className="hero-main">
            <div className="hero-main-bg" style={heroStory?.cover_url ? {
              backgroundImage: `url(${heroStory.cover_url})`,
              filter: 'blur(28px) brightness(.4) saturate(1.3)',
              transform: 'scale(1.1)',
            } : undefined}></div>
            <div className="hero-main-pattern"></div>
            <div className="hero-main-overlay"></div>

            {/* Floating book cover */}
            <div className="hero-cover-float">
              {heroStory?.cover_url
                ? <img src={heroStory.cover_url} alt={heroStory.title} />
                : <div className="hero-cover-float-empty">{heroStory?.title || ''}</div>
              }
            </div>

            <div className="hero-content">
              <div className="hero-eyebrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                </svg>
                Haftanın Öne Çıkanı
              </div>
              {heroStory ? (
                <>
                  <h1>{heroStory.title}</h1>
                  {heroStory.genre && (
                    <div className="hero-meta">
                      <span>{heroStory.genre}</span>
                      <div className="hero-dot" />
                      <span>{heroStory.view_count > 999 ? `${(heroStory.view_count / 1000).toFixed(1)}K` : heroStory.view_count} okuma</span>
                    </div>
                  )}
                  <div className="hero-actions">
                    <button className="btn-primary" onClick={() => router.push(`/story/${heroStory.id}`)}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" /></svg>
                      Okumaya Başla
                    </button>
                  </div>
                </>
              ) : (
                <h1 style={{ color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', fontSize: '1.1rem', fontWeight: 400, marginTop: '0.5rem' }}>
                  {loadingStories ? 'Yükleniyor…' : 'Henüz yayınlanmış kitap yok'}
                </h1>
              )}
            </div>
          </div>

          {/* Sağ mini raf */}
          <div className="hero-shelf">
            <div className="shelf-hd">
              Bu Hafta Trend
            </div>
            {shelfStories.length > 0 ? shelfStories.map((s, i) => (
              <div key={s.id} className="shelf-row" onClick={() => router.push(`/story/${s.id}`)}>
                <div className="shelf-cover">
                  <div className="shelf-cover-bg" style={s.cover_url
                    ? { backgroundImage: `url(${s.cover_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'absolute', inset: 0 }
                    : { background: getGrad(s.id, i), position: 'absolute', inset: 0 }
                  } />
                  <div className="shelf-cover-lbl">{s.title.slice(0, 12)}</div>
                </div>
                <div className="shelf-info">
                  <div className="shelf-title">{s.title}</div>
                  <div className="shelf-author">{s.genre || 'Roman'}</div>
                </div>
                <div className={`shelf-badge ${i === 0 ? 'badge-hot' : i < 3 ? 'badge-new' : 'badge-done'}`}>
                  {i === 0 ? '🔥' : i < 3 ? '✨' : '✓'}
                </div>
              </div>
            )) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.3)', textAlign: 'center', padding: '1rem' }}>
                  {loadingStories ? 'Yükleniyor…' : 'Kitap bulunamadı'}
                </span>
              </div>
            )}
          </div>
        </div>{/* /hero */}


        {/* ══════════════════════════════════════════
     MAIN CONTENT
══════════════════════════════════════════ */}
        <div className="section-top">
          <div className="wrap">

            {/* ── ÇOK OKUNANLAR ── */}
            <div className="anim anim-d1">
              <div className="sh">
                <div>
                  <div className="sh-title">Çok <em>Okunanlar</em></div>
                  <div className="sh-sub">Bu ay en fazla okunan hikayeler</div>
                </div>
                <button className="sh-btn" onClick={() => router.push('/explore?sort=top')}>
                  Tümünü Gör
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
              <div className="carousel">
                {loadingStories ? (
                  <span style={{ fontSize: '.78rem', color: 'var(--ink4)', padding: '0 .5rem' }}>Yükleniyor…</span>
                ) : topViewed.length > 0 ? (
                  topViewed.map((s, i) => <BookCard key={s.id} story={s} idx={i} badge={i < 3 ? 'fire' : undefined} />)
                ) : (
                  <span style={{ fontSize: '.78rem', color: 'var(--ink4)', padding: '0 .5rem' }}>Henüz yayınlanmış kitap yok</span>
                )}
              </div>
            </div>

            <div className="divider"></div>

            {/* ── TÜRE GÖRE KEŞFET ── */}
            <div className="anim anim-d2">
              <div className="sh">
                <div className="sh-title">Türe Göre <em>Keşfet</em></div>
                <button className="sh-btn" onClick={() => router.push('/genres')}>
                  Tüm Türler
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
              <div className="cat-grid">

                {/* Romantik — 2 sütun genişliğinde */}
                <div className="cat-card" style={{ gridColumn: 'span 2' }} onClick={() => router.push('/genres/Romantik')}>
                  <div className="cat-bg" style={{ background: 'linear-gradient(135deg,#1e3a6e,#6b1a34)' }}></div>
                  <div className="cat-overlay"></div>
                  <div className="cat-label">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                    Romantik
                  </div>
                </div>

                {/* Gizem */}
                <div className="cat-card" onClick={() => router.push('/genres/Gizem')}>
                  <div className="cat-bg" style={{ background: 'linear-gradient(135deg,#1a2844,#3a0e20)' }}></div>
                  <div className="cat-overlay"></div>
                  <div className="cat-label">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                    Gizem
                  </div>
                </div>

                {/* Fantastik */}
                <div className="cat-card" onClick={() => router.push('/genres/Fantastik')}>
                  <div className="cat-bg" style={{ background: 'linear-gradient(135deg,#1a3a28,#0e1e3a)' }}></div>
                  <div className="cat-overlay"></div>
                  <div className="cat-label">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>
                    Fantastik
                  </div>
                </div>

                {/* Korku */}
                <div className="cat-card" onClick={() => router.push('/genres/Korku')}>
                  <div className="cat-bg" style={{ background: 'linear-gradient(135deg,#3a1a0e,#1a0e2a)' }}></div>
                  <div className="cat-overlay"></div>
                  <div className="cat-label">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                    Korku
                  </div>
                </div>

                {/* Bilim Kurgu */}
                <div className="cat-card" onClick={() => router.push('/genres/Bilim%20Kurgu')}>
                  <div className="cat-bg" style={{ background: 'linear-gradient(135deg,#0e2a3a,#1e1a3a)' }}></div>
                  <div className="cat-overlay"></div>
                  <div className="cat-label">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" /></svg>
                    Bilim Kurgu
                  </div>
                </div>

                {/* Tarihsel */}
                <div className="cat-card" onClick={() => router.push('/genres/Tarihsel')}>
                  <div className="cat-bg" style={{ background: 'linear-gradient(135deg,#2a1a0e,#0e1a2a)' }}></div>
                  <div className="cat-overlay"></div>
                  <div className="cat-label">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" /></svg>
                    Tarihsel
                  </div>
                </div>

                {/* Drama */}
                <div className="cat-card" onClick={() => router.push('/genres/Drama')}>
                  <div className="cat-bg" style={{ background: 'linear-gradient(135deg,#1a0e3a,#3a1a2e)' }}></div>
                  <div className="cat-overlay"></div>
                  <div className="cat-label">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" /></svg>
                    Drama
                  </div>
                </div>

              </div>
            </div>

            <div className="divider"></div>

            {/* ── YENİ ÇIKANLAR ── */}
            <div className="anim anim-d3 section-bottom">
              <div className="sh">
                <div>
                  <div className="sh-title">Yeni <em>Çıkanlar</em></div>
                  <div className="sh-sub">Son 7 günde eklenen hikayeler</div>
                </div>
                <button className="sh-btn" onClick={() => router.push('/explore?sort=new')}>
                  Tümünü Gör
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
              <div className="carousel">
                {loadingStories ? (
                  <span style={{ fontSize: '.78rem', color: 'var(--ink4)', padding: '0 .5rem' }}>Yükleniyor…</span>
                ) : newest.length > 0 ? (
                  newest.map((s, i) => <BookCard key={s.id} story={s} idx={i + 10} badge={i < 3 ? 'sparkle' : undefined} />)
                ) : (
                  <span style={{ fontSize: '.78rem', color: 'var(--ink4)', padding: '0 .5rem' }}>Henüz yayınlanmış kitap yok</span>
                )}
              </div>
            </div>

          </div>{/* /wrap */}
        </div>


        {/* ══════════════════════════════════════════
     FOOTER
══════════════════════════════════════════ */}
        <footer>
          © 2026 Foliom. Tüm hakları saklıdır.
        </footer>

        {/* Toast */}
        {toast && (
          <div style={{
            position: 'fixed', bottom: '1.75rem', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(24,28,44,.95)', color: '#fff', padding: '.55rem 1.15rem',
            borderRadius: 10, fontSize: '.79rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '.45rem',
            boxShadow: '0 6px 24px rgba(0,0,0,.28)', zIndex: 700, whiteSpace: 'nowrap',
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#5de898" style={{ width: 14, height: 14, flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {toast}
          </div>
        )}


        {/* ══════════════════════════════════════════
     JS
══════════════════════════════════════════ */}
      </div>
    </>
  )
}