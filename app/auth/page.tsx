'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'giris' | 'kayit'>('giris')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    setError(''); setSuccess(''); setLoading(true)
    if (tab === 'giris') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false) }
      else router.replace('/')
    } else {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName } }
      })
      if (error) { setError(error.message); setLoading(false) }
      else { setSuccess('Kayıt başarılı! E-postanı doğrula.'); setLoading(false) }
    }
  }

  const s: Record<string, React.CSSProperties> = {
    page: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f2f3f7', fontFamily: "'Nunito Sans', sans-serif"
    },
    card: {
      background: '#fff', borderRadius: 18, padding: '2.5rem 2rem', width: '100%', maxWidth: 400,
      boxShadow: '0 8px 40px rgba(24,28,44,.12)', border: '1px solid #dde0e8'
    },
    logo: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem', justifyContent: 'center' },
    mark: {
      width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#1e3a6e,#6b1a34)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    },
    title: {
      fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.5rem', fontWeight: 900,
      background: 'linear-gradient(135deg,#1e3a6e,#6b1a34)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
    },
    tabs: { display: 'flex', gap: 4, background: '#f2f3f7', borderRadius: 10, padding: 4, marginBottom: '1.5rem' },
    tab: {
      flex: 1, padding: '0.5rem', borderRadius: 8, border: 'none', cursor: 'pointer',
      fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: '0.83rem',
      background: 'none', color: '#8890aa', transition: 'all .2s'
    },
    tabActive: { background: '#fff', color: '#1e3a6e', boxShadow: '0 1px 6px rgba(0,0,0,.1)' },
    label: { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#434961', marginBottom: 6 },
    input: {
      width: '100%', background: '#edf2fc', border: '1.5px solid #dde0e8', borderRadius: 10,
      padding: '0.6rem 0.9rem', fontFamily: "'Nunito Sans', sans-serif", fontSize: '0.86rem',
      color: '#181c2c', outline: 'none', boxSizing: 'border-box' as const, marginBottom: '1rem'
    },
    btn: {
      width: '100%', padding: '0.65rem', borderRadius: 10, border: 'none', cursor: 'pointer',
      background: 'linear-gradient(135deg,#2e4f91,#8f2448)', color: '#fff',
      fontFamily: "'Nunito Sans', sans-serif", fontWeight: 700, fontSize: '0.88rem',
      marginTop: 8, opacity: loading ? 0.7 : 1
    },
    err: {
      background: '#fdecea', color: '#c0392b', borderRadius: 9, padding: '0.6rem 0.85rem',
      fontSize: '0.78rem', fontWeight: 600, marginBottom: '1rem'
    },
    ok: {
      background: '#e6f7ed', color: '#1b6b3a', borderRadius: 9, padding: '0.6rem 0.85rem',
      fontSize: '0.78rem', fontWeight: 600, marginBottom: '1rem'
    },
  }

  return (
    <div style={s.page}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@900&family=Nunito+Sans:opsz,wght@6..12,400;6..12,700&display=swap" rel="stylesheet" />
      <div style={s.card}>
        <div style={s.logo}>
          <div style={s.mark}>
            <svg width="18" height="18" fill="#fff" viewBox="0 0 24 24">
              <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
            </svg>
          </div>
          <span style={s.title}>FOLIOM</span>
        </div>

        <div style={s.tabs}>
          <button style={tab === 'giris' ? { ...s.tab, ...s.tabActive } : s.tab} onClick={() => setTab('giris')}>Giriş Yap</button>
          <button style={tab === 'kayit' ? { ...s.tab, ...s.tabActive } : s.tab} onClick={() => setTab('kayit')}>Üye Ol</button>
        </div>

        {error && <div style={s.err}>{error}</div>}
        {success && <div style={s.ok}>{success}</div>}

        {tab === 'kayit' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Ad</label>
              <input style={s.input} type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Adınız" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Soyad</label>
              <input style={s.input} type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Soyadınız" />
            </div>
          </div>
        )}

        <label style={s.label}>E-posta</label>
        <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ornek@email.com" />

        <label style={s.label}>Şifre</label>
        <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

        <button style={s.btn} onClick={handleSubmit} disabled={loading}>
          {loading ? 'Lütfen bekle…' : tab === 'giris' ? 'Giriş Yap' : 'Üye Ol'}
        </button>
      </div>
    </div>
  )
}
