'use client'

import NavBar from '@/components/NavBar'
import { useRouter } from 'next/navigation'

const GENRES = [
  { id: 'romantik', name: 'Romantik', icon: 'favorite', grad: ['#5a0a28', '#8f2448'], desc: 'Duygusal derinlik ve beşeri ilişkiler odağı' },
  { id: 'gizem', name: 'Gizem', icon: 'search', grad: ['#1a1040', '#3a1060'], desc: 'Analitik kurgu ve çözülmeyi bekleyen muammalar' },
  { id: 'fantastik', name: 'Fantastik', icon: 'auto_awesome', grad: ['#1a0838', '#2d0850'], desc: 'Spekülatif dünyalar ve doğaüstü kurgular' },
  { id: 'genclik', name: 'Gençlik', icon: 'school', grad: ['#0a2810', '#1a4020'], desc: 'Bireysel gelişim ve adaptasyon süreçleri' },
  { id: 'korku', name: 'Korku', icon: 'visibility', grad: ['#0a0a14', '#1a0820'], desc: 'Primal korkular ve karanlık anlatı dinamikleri' },
  { id: 'bilimkurgu', name: 'Bilim Kurgu', icon: 'rocket_launch', grad: ['#081830', '#0a2040'], desc: 'Teknolojik öngörüler ve evrensel tasavvurlar' },
  { id: 'tarih', name: 'Tarihî', icon: 'account_balance', grad: ['#2a1800', '#402808'], desc: 'Kronolojik gerçeklik ve dönem ruhu analizi' },
  { id: 'psikolojik', name: 'Psikolojik', icon: 'psychology', grad: ['#0a1828', '#1a2838'], desc: 'Bilişsel süreçler ve içsel karakter arkları' },
  { id: 'macera', name: 'Macera', icon: 'explore', grad: ['#0d2218', '#1a3a10'], desc: 'Yüksek tempolu keşif ve dinamik olay örgüsü' },
  { id: 'roman', name: 'Roman', icon: 'menu_book', grad: ['#1a2e5a', '#3a0e20'], desc: 'Kapsamlı anlatı yapısı ve karakter gelişimi' },
  { id: 'gerilim', name: 'Gerilim', icon: 'bolt', grad: ['#0a0a1a', '#2a0a20'], desc: 'Dinamik tansiyon ve sürükleyici kurgu yapısı' },
  { id: 'siir', name: 'Şiir', icon: 'history_edu', grad: ['#1a2a10', '#102010'], desc: 'Lirik ifade ve estetik dil formları' },
];

export default function GenresPage() {
  const router = useRouter()

  function goToGenre(id: string) {
    router.push(`/search?genre=${id}`)
  }

  return (
    <>
      <style>{`
:root {
  --bg:#f2f3f7; --bg2:#e8eaf0; --surface:#fff;
  --ink:#181c2c; --ink2:#434961; --ink3:#8890aa; --ink4:#b4bacf;
  --navy:#1e3a6e; --navy2:#2e4f91; --navy3:#4169af;
  --navy-lt:#d6e2f7; --navy-xlt:#edf2fc;
  --crimson:#6b1a34; --crimson2:#8f2448;
  --line:#dde0e8; --shade:rgba(24,28,44,.07); --shade2:rgba(24,28,44,.15);
  --serif:'Cormorant Garamond',Georgia,serif;
  --sans:'Nunito Sans',sans-serif;
  --t:.2s ease;
}
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0; }
body { font-family:var(--sans); background:var(--bg); color:var(--ink); min-height:100vh; -webkit-font-smoothing:antialiased; }

.page-header {
  background:linear-gradient(135deg,#1a2e5a 0%,#0d1c3a 50%,#3a0e20 100%);
  padding:3.5rem 2.5rem 3rem; position:relative; overflow:hidden;
}
.page-header-bg {
  position:absolute; inset:0; opacity:.07;
  background-image:repeating-linear-gradient(45deg,transparent,transparent 30px,rgba(255,255,255,.5) 30px,rgba(255,255,255,.5) 31px),
                   repeating-linear-gradient(-45deg,transparent,transparent 30px,rgba(255,255,255,.3) 30px,rgba(255,255,255,.3) 31px);
}
.page-header-content { position:relative; z-index:1; max-width:1080px; margin:0 auto; }
.page-eyebrow { font-size:.72rem; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:rgba(255,255,255,.45); margin-bottom:.5rem; }
.page-title { font-family:var(--serif); font-size:2.8rem; font-weight:900; color:#fff; line-height:1.1; margin-bottom:.5rem; }
.page-title em { color:rgba(255,180,160,.9); font-style:normal; }
.page-subtitle { font-size:.9rem; color:rgba(255,255,255,.55); max-width:480px; }

.main-wrap { max-width:1080px; margin:0 auto; padding:2.5rem 2.5rem 4rem; }

.genres-grid {
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(240px,1fr));
  gap:1.25rem;
}

.genre-card {
  border-radius:16px; overflow:hidden; cursor:pointer; position:relative;
  min-height:160px; display:flex; flex-direction:column; justify-content:flex-end;
  padding:1.25rem;
  transition:transform var(--t), box-shadow var(--t);
  box-shadow:0 4px 16px rgba(0,0,0,.18);
}
.genre-card:hover { transform:translateY(-4px); box-shadow:0 12px 32px rgba(0,0,0,.28); }
.genre-card-bg { position:absolute; inset:0; }
.genre-card-overlay {
  position:absolute; inset:0;
  background:linear-gradient(to top, rgba(0,0,0,.65) 0%, rgba(0,0,0,.1) 60%, transparent 100%);
}
.genre-card-emoji { font-size:2.2rem; position:relative; z-index:1; margin-bottom:.4rem; line-height:1; }
.genre-card-name { font-family:var(--serif); font-size:1.35rem; font-weight:900; color:#fff; position:relative; z-index:1; line-height:1.1; margin-bottom:.3rem; }
.genre-card-desc { font-size:.72rem; color:rgba(255,255,255,.6); position:relative; z-index:1; line-height:1.5; }
.genre-card-arrow {
  position:absolute; top:1rem; right:1rem; z-index:1;
  width:28px; height:28px; border-radius:50%;
  background:rgba(255,255,255,.15); backdrop-filter:blur(4px);
  display:flex; align-items:center; justify-content:center;
  transition:background var(--t), transform var(--t);
}
.genre-card:hover .genre-card-arrow { background:rgba(255,255,255,.28); transform:translateX(2px); }
.genre-card-arrow svg { width:14px; height:14px; color:#fff; }

footer { background:#181c2c; color:rgba(255,255,255,.3); padding:1.5rem 2.5rem; font-size:.78rem; }

@media(max-width:700px) {
  .page-header { padding:2.5rem 1rem 2rem; }
  .main-wrap { padding:1.5rem 1rem 3rem; }
  .page-title { font-size:2rem; }
  .genres-grid { grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:1rem; }
  .genre-card { min-height:130px; padding:1rem; }
}
      `}</style>

      <NavBar activePage="search" showBack={true} />

      <div className="page-header">
        <div className="page-header-bg" />
        <div className="page-header-content">
          <div className="page-eyebrow">Foliom · Keşfet</div>
          <div className="page-title">Tüm <em>Türler</em></div>
          <div className="page-subtitle">Beğendiğin türleri keşfet, okumak istediğin hikayeleri bul.</div>
        </div>
      </div>

      <div className="main-wrap">
        <div className="genres-grid">
          {GENRES.map(g => (
            <div
              key={g.id}
              className="genre-card"
              onClick={() => goToGenre(g.id)}
            >
              <div
                className="genre-card-bg"
                style={{ background: `linear-gradient(135deg,${g.grad[0]},${g.grad[1]})` }}
              />
              <div className="genre-card-overlay" />
              <div className="genre-card-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
              <div className="genre-card-emoji">{g.icon}</div>
              <div className="genre-card-name">{g.name}</div>
              <div className="genre-card-desc">{g.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <footer>© 2026 Foliom. Tüm hakları saklıdır.</footer>
    </>
  )
}
