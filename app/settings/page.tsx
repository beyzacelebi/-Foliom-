'use client'

import NavBar from '@/components/NavBar'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'

type NotifKey = 'follower' | 'comment' | 'like' | 'newChapter' | 'followedAuthor' | 'email' | 'newsletter'
type PrivacyKey = 'privateAccount' | 'allowMessages' | 'searchIndexing'


export default function SettingsPage() {
  const router = useRouter()
  const { theme, toggle: toggleTheme } = useTheme()
  const [section, setSection] = useState('s-profile')
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'warn' | 'err' } | null>(null)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deactivateModal, setDeactivateModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Profil state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [initials, setInitials] = useState('?')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'ok' | 'err'>('idle')
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Şifre state
  const [curPass, setCurPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confPass, setConfPass] = useState('')
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConf, setShowConf] = useState(false)

  // Bildirim
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    follower: true, comment: true, like: false, newChapter: true,
    followedAuthor: true, email: false, newsletter: true,
  })

  // Gizlilik
  const [privacy, setPrivacy] = useState<Record<PrivacyKey, boolean>>({
    privateAccount: false, allowMessages: true, searchIndexing: true,
  })
  const [profileVisibility, setProfileVisibility] = useState('Herkese Açık')
  const [listVisibility, setListVisibility] = useState('Yalnızca Takipçiler')
  const [activityVisibility, setActivityVisibility] = useState('Takipçilerim')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/auth'); return }
      setEmail(user.email || '')
      const fullName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      const [fn, ...ln] = fullName.split(' ')
      setFirstName(fn || '')
      setLastName(ln.join(' ') || '')
      setUsername(user.user_metadata?.username || user.email?.split('@')[0] || '')
      setBio(user.user_metadata?.bio || '')
      setLocation(user.user_metadata?.location || '')
      setWebsite(user.user_metadata?.website || '')
      if (fullName) {
        const parts = fullName.split(' ')
        setInitials((parts[0]?.[0] || '') + (parts[1]?.[0] || ''))
      }
      const { data: profileData } = await supabase
        .from('profiles')
        .select('avatar_url, bio, username, display_name')
        .eq('id', user.id)
        .maybeSingle()
      if (profileData) {
        setAvatarUrl(profileData.avatar_url || null)
        if (profileData.bio) setBio(profileData.bio)
        if (profileData.username) setUsername(profileData.username)
        if (profileData.display_name) {
          const parts = profileData.display_name.split(' ')
          setFirstName(parts[0] || '')
          setLastName(parts.slice(1).join(' ') || '')
          setInitials((parts[0]?.[0] || '') + (parts[1]?.[0] || ''))
        }
      }
    })
  }, [router])

  function showToast(msg: string, type: 'ok' | 'warn' | 'err' = 'ok') {
    setToast({ msg, type })
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 2600)
  }

  function checkUsername(val: string) {
    setUsername(val)
    setUsernameStatus('idle')
    if (usernameTimer.current) clearTimeout(usernameTimer.current)
    if (!val || val.length < 3) return
    usernameTimer.current = setTimeout(() => {
      const taken = ['admin', 'foliom', 'test'].includes(val.toLowerCase())
      setUsernameStatus(taken ? 'err' : 'ok')
    }, 700)
  }

  function passStrength(val: string) {
    let s = 0
    if (val.length >= 8) s++
    if (/[A-Z]/.test(val)) s++
    if (/[0-9]/.test(val)) s++
    if (/[^a-zA-Z0-9]/.test(val)) s++
    return s
  }

  async function saveProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const fullName = `${firstName} ${lastName}`.trim()
    // user_metadata güncelle
    await supabase.auth.updateUser({ data: { full_name: fullName, username, bio, location, website } })
    // profiles tablosunu da güncelle
    await supabase.from('profiles').upsert({
      id: session.user.id,
      display_name: fullName || null,
      username: username || null,
      bio: bio || null,
      avatar_url: avatarUrl || null,
    }, { onConflict: 'id' })
    showToast('Profil bilgilerin güncellendi!')
    const parts = fullName.split(' ')
    setInitials((parts[0]?.[0] || '') + (parts[1]?.[0] || ''))
    router.refresh()
  }

  async function downloadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    showToast('Veriler hazırlanıyor…', 'ok')
    const [{ data: profile }, { data: stories }, { data: comments }, { data: ratings }, { data: followersData }, { data: followingData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('stories').select('*').eq('author_id', user.id),
      supabase.from('story_comments').select('*').eq('user_id', user.id),
      supabase.from('ratings').select('*').eq('user_id', user.id),
      supabase.from('follows').select('*').eq('following_id', user.id),
      supabase.from('follows').select('*').eq('follower_id', user.id),
    ])
    const payload = {
      exported_at: new Date().toISOString(),
      profile,
      stories: stories || [],
      comments: comments || [],
      ratings: ratings || [],
      followers: followersData || [],
      following: followingData || [],
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `foliom-data-${user.id.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Veriler indirildi!')
  }

  async function deactivateAccount() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ is_active: false }).eq('id', user.id)
    if (error) { showToast('Hata: ' + error.message, 'err'); return }
    setDeactivateModal(false)
    showToast('Hesabın devre dışı bırakıldı.')
    setTimeout(async () => {
      await supabase.auth.signOut()
      router.push('/')
    }, 1500)
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'HESABIMI SİL') { showToast('"HESABIMI SİL" yazmanı bekliyoruz', 'warn'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setDeleteModal(false); setDeleteConfirm('')
    showToast('Hesabın siliniyor…')
    // Delete user data from all tables (RLS allows user to delete their own rows)
    await Promise.all([
      supabase.from('story_comments').delete().eq('user_id', user.id),
      supabase.from('ratings').delete().eq('user_id', user.id),
      supabase.from('follows').delete().eq('follower_id', user.id),
      supabase.from('follows').delete().eq('following_id', user.id),
      supabase.from('notifications').delete().eq('recipient_id', user.id),
      supabase.from('notifications').delete().eq('sender_id', user.id),
      supabase.from('reading_lists').delete().eq('user_id', user.id),
    ])
    await supabase.from('stories').delete().eq('author_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)
    await supabase.auth.signOut()
    router.push('/')
  }

  async function updatePassword() {
    if (!curPass) { showToast('Mevcut şifreni gir', 'err'); return }
    if (newPass !== confPass) { showToast('Şifreler eşleşmiyor', 'err'); return }
    if (newPass.length < 8) { showToast('Şifre en az 8 karakter olmalı', 'err'); return }
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: curPass })
    if (signInError) { showToast('Mevcut şifre yanlış', 'err'); return }
    const { error } = await supabase.auth.updateUser({ password: newPass })
    if (error) { showToast(error.message, 'err'); return }
    showToast('Şifren başarıyla güncellendi!')
    setCurPass(''); setNewPass(''); setConfPass('')
  }


  const navItems = [
    { id: 's-profile', label: 'Profil Bilgileri', grp: 'Hesap' },
    { id: 's-account', label: 'Hesap & Güvenlik', grp: 'Hesap' },
    { id: 's-notif', label: 'Bildirimler', grp: 'Hesap' },
    { id: 's-privacy', label: 'Gizlilik', grp: 'Hesap' },
    { id: 's-appear', label: 'Görünüm', grp: 'Hesap' },
    { id: 's-danger', label: 'Tehlikeli Alan', grp: 'Tehlikeli', danger: true },
  ]

  const strengthColors = ['', '#c0392b', '#e67e22', '#e0c040', '#1b6b3a']
  const strengthLabels = ['', 'Çok Zayıf', 'Zayıf', 'İyi', 'Güçlü']
  const ps = passStrength(newPass)

  return (
    <>
      <NavBar />
      <style>{`
        .st-layout{display:flex;max-width:1000px;margin:0 auto;padding:2rem 2.5rem 5rem;gap:2rem;align-items:flex-start;font-family:'Nunito Sans',sans-serif}
        .st-nav{width:220px;flex-shrink:0;position:sticky;top:80px;background:#fff;border:1px solid #dde0e8;border-radius:14px;padding:.75rem .5rem;box-shadow:0 2px 10px rgba(24,28,44,.07)}
        .sn-lbl{font-size:.62rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#b4bacf;padding:.15rem .75rem;display:block;margin-bottom:.4rem}
        .sn-btn{display:flex;align-items:center;gap:.6rem;padding:.58rem .85rem;border-radius:9px;width:100%;text-align:left;font-family:'Nunito Sans',sans-serif;font-size:.83rem;font-weight:600;color:#434961;cursor:pointer;background:none;border:none;transition:all .2s;margin-bottom:.06rem}
        .sn-btn:hover{background:#e8eaf0;color:#181c2c}
        .sn-btn.on{background:#edf2fc;color:#2e4f91;font-weight:700}
        .sn-btn.danger{color:#c0392b}
        .sn-btn.danger:hover{background:#fdecea}
        .sn-sep{height:1px;background:#dde0e8;margin:.6rem .5rem}
        .st-content{flex:1;min-width:0;display:flex;flex-direction:column;gap:1.5rem}
        .sc{background:#fff;border:1px solid #dde0e8;border-radius:16px;overflow:hidden}
        .sc-hd{padding:1.25rem 1.5rem;border-bottom:1px solid #dde0e8;display:flex;align-items:center;gap:.65rem}
        .sc-ico{width:36px;height:36px;border-radius:9px;flex-shrink:0;display:flex;align-items:center;justify-content:center}
        .sc-ico svg{width:18px;height:18px;color:#fff}
        .sc-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;font-weight:900}
        .sc-sub{font-size:.74rem;color:#8890aa;margin-top:.08rem}
        .sc-body{padding:1.5rem}
        .field{margin-bottom:1.15rem}
        .field:last-child{margin-bottom:0}
        .f-label{display:flex;align-items:center;justify-content:space-between;font-size:.78rem;font-weight:700;color:#434961;margin-bottom:.42rem}
        .f-hint{font-size:.7rem;color:#8890aa;font-weight:400}
        .f-inp{width:100%;box-sizing:border-box;background:#e8eaf0;border:1.5px solid #dde0e8;border-radius:10px;padding:.58rem .9rem;font-family:'Nunito Sans',sans-serif;font-size:.86rem;color:#181c2c;outline:none;transition:border-color .2s,box-shadow .2s}
        .f-inp:focus{border-color:#4169af;box-shadow:0 0 0 3px rgba(65,105,175,.12)}
        .f-inp::placeholder{color:#b4bacf}
        .f-inp:disabled{opacity:.55;cursor:not-allowed}
        .f-ta{width:100%;box-sizing:border-box;background:#e8eaf0;border:1.5px solid #dde0e8;border-radius:10px;padding:.58rem .9rem;font-family:'Nunito Sans',sans-serif;font-size:.86rem;color:#181c2c;outline:none;resize:none;min-height:80px;transition:border-color .2s}
        .f-ta:focus{border-color:#4169af;box-shadow:0 0 0 3px rgba(65,105,175,.12)}
        .f-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.15rem}
        .f-row .field{margin-bottom:0}
        .f-info{font-size:.72rem;margin-top:.35rem;display:flex;align-items:center;gap:.3rem}
        .f-info.ok{color:#1b6b3a} .f-info.err{color:#c0392b}
        .pass-wrap{position:relative}
        .pass-wrap .f-inp{padding-right:2.8rem}
        .pass-eye{position:absolute;right:.75rem;top:50%;transform:translateY(-50%);color:#8890aa;cursor:pointer;background:none;border:none;padding:0;transition:color .2s}
        .pass-eye:hover{color:#2e4f91}
        .pass-eye svg{width:16px;height:16px}
        .tgl-row{display:flex;align-items:center;justify-content:space-between;padding:.85rem 0;border-bottom:1px solid #dde0e8}
        .tgl-row:last-child{border-bottom:none;padding-bottom:0}
        .tgl-lbl{font-size:.83rem;font-weight:700;color:#181c2c;margin-bottom:.12rem}
        .tgl-desc{font-size:.72rem;color:#8890aa;line-height:1.45}
        .tgl{position:relative;width:40px;height:22px;flex-shrink:0}
        .tgl input{opacity:0;width:0;height:0}
        .tgl-sl{position:absolute;inset:0;background:#dde0e8;border-radius:22px;cursor:pointer;transition:background .2s}
        .tgl-sl::before{content:'';position:absolute;width:16px;height:16px;left:3px;top:3px;background:#fff;border-radius:50%;transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.15)}
        .tgl input:checked+.tgl-sl{background:#2e4f91}
        .tgl input:checked+.tgl-sl::before{transform:translateX(18px)}
        .btn-row{display:flex;gap:.6rem;margin-top:1.25rem;flex-wrap:wrap}
        .btn{display:inline-flex;align-items:center;gap:.38rem;padding:.52rem 1.15rem;border-radius:9px;font-family:'Nunito Sans',sans-serif;font-size:.82rem;font-weight:700;cursor:pointer;transition:all .2s}
        .btn svg{width:14px;height:14px}
        .btn-primary{background:linear-gradient(135deg,#2e4f91,#8f2448);color:#fff;border:none;box-shadow:0 2px 10px rgba(30,58,110,.25)}
        .btn-primary:hover{opacity:.87}
        .btn-ghost{background:none;border:1.5px solid #dde0e8;color:#434961}
        .btn-ghost:hover{border-color:#4169af;color:#2e4f91;background:#edf2fc}
        .btn-danger{background:#c0392b;color:#fff;border:none;box-shadow:0 2px 10px rgba(192,57,43,.22)}
        .btn-danger:hover{opacity:.87}
        .btn-danger-ghost{background:none;border:1.5px solid rgba(192,57,43,.3);color:#c0392b}
        .btn-danger-ghost:hover{background:#fdecea}
        .ava-section{display:flex;align-items:center;gap:1.25rem;padding-bottom:1.35rem;border-bottom:1px solid #dde0e8;margin-bottom:1.35rem}
        .ava-circle{width:72px;height:72px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#2e4f91,#8f2448);display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',Georgia,serif;font-size:1.8rem;font-weight:900;color:#fff}
        .po-row{display:flex;align-items:center;justify-content:space-between;padding:.85rem 0;border-bottom:1px solid #dde0e8}
        .po-row:last-child{border-bottom:none;padding-bottom:0}
        .po-lbl{font-size:.83rem;font-weight:700;color:#181c2c;margin-bottom:.1rem}
        .po-desc{font-size:.72rem;color:#8890aa;line-height:1.4}
        .po-sel{padding:.36rem .65rem;border-radius:8px;border:1.5px solid #dde0e8;font-family:'Nunito Sans',sans-serif;font-size:.78rem;color:#434961;outline:none;cursor:pointer;background:#fff;transition:border-color .2s}
        .po-sel:focus{border-color:#4169af}
        .dz{background:rgba(192,57,43,.04);border:1.5px solid rgba(192,57,43,.2);border-radius:16px;padding:1.35rem 1.5rem}
        .dz-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.05rem;font-weight:900;color:#c0392b;margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}
        .dz-title svg{width:18px;height:18px}
        .dz-row{display:flex;align-items:center;justify-content:space-between;padding:.9rem 0;border-bottom:1px solid rgba(192,57,43,.12);gap:1rem;flex-wrap:wrap}
        .dz-row:last-child{border-bottom:none;padding-bottom:0}
        .dz-lbl{font-size:.83rem;font-weight:700;color:#181c2c}
        .dz-desc{font-size:.72rem;color:#8890aa;margin-top:.1rem;line-height:1.4}
        .modal-back{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:500;display:flex;align-items:center;justify-content:center;padding:1.5rem}
        .modal{background:#fff;border-radius:18px;width:100%;max-width:420px;box-shadow:0 20px 56px rgba(0,0,0,.25);overflow:hidden;animation:mIn .2s ease}
        @keyframes mIn{from{opacity:0;transform:translateY(-12px) scale(.97)}to{opacity:1;transform:none}}
        .modal-hd{padding:1.25rem 1.5rem;border-bottom:1px solid #dde0e8}
        .modal-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.2rem;font-weight:900}
        .modal-body{padding:1.1rem 1.5rem 1.25rem;font-size:.84rem;color:#434961;line-height:1.65}
        .modal-warn{margin-top:.75rem;background:#fdecea;border-radius:9px;padding:.65rem .85rem;font-size:.76rem;color:#c0392b;display:flex;gap:.45rem}
        .modal-warn svg{width:14px;height:14px;flex-shrink:0;margin-top:1px}
        .modal-ft{display:flex;justify-content:flex-end;gap:.6rem;padding:1rem 1.5rem;border-top:1px solid #dde0e8}
        .st-toast{position:fixed;bottom:1.75rem;left:50%;transform:translateX(-50%);background:rgba(24,28,44,.96);color:#fff;padding:.55rem 1.15rem;border-radius:10px;font-size:.79rem;font-weight:600;display:flex;align-items:center;gap:.45rem;box-shadow:0 6px 24px rgba(0,0,0,.28);z-index:700;white-space:nowrap}
        .st-toast.ok svg{color:#5de898} .st-toast.err svg{color:#ff8080} .st-toast.warn svg{color:#fbbf24}
        .section-sep{font-size:.87rem;font-weight:800;margin-bottom:1rem;color:#181c2c;padding-bottom:.75rem;border-bottom:1px solid #dde0e8}
        @media(max-width:760px){.st-layout{flex-direction:column;padding:1rem 1rem 4rem;gap:1rem}.st-nav{width:100%;position:static;display:flex;flex-wrap:wrap;gap:.3rem;border-radius:10px;padding:.5rem}.sn-lbl,.sn-sep{display:none}.sn-btn{width:auto;flex:none;padding:.4rem .75rem;border-radius:20px;font-size:.78rem}.f-row{grid-template-columns:1fr}}
      `}</style>

      <div style={{ background: '#f2f3f7', minHeight: '100vh', paddingTop: 64 }}>
        <div className="st-layout">

          {/* Sol Nav */}
          <div className="st-nav">
            <span className="sn-lbl">Hesap</span>
            {navItems.filter(n => n.grp === 'Hesap').map(n => (
              <button key={n.id} className={`sn-btn${section === n.id ? ' on' : ''}${n.danger ? ' danger' : ''}`}
                onClick={() => { setSection(n.id); document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
                {n.label}
              </button>
            ))}
            <div className="sn-sep" />
            <span className="sn-lbl">Tehlikeli</span>
            {navItems.filter(n => n.grp === 'Tehlikeli').map(n => (
              <button key={n.id} className={`sn-btn danger${section === n.id ? ' on' : ''}`}
                onClick={() => { setSection(n.id); document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
                {n.label}
              </button>
            ))}
          </div>

          {/* İçerik */}
          <div className="st-content">

            {/* 1. Profil */}
            <div className="sc" id="s-profile">
              <div className="sc-hd">
                <div className="sc-ico" style={{ background: 'linear-gradient(135deg,#2e4f91,#8f2448)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                </div>
                <div><div className="sc-title">Profil Bilgileri</div><div className="sc-sub">Herkese görünen bilgilerin</div></div>
              </div>
              <div className="sc-body">
                <div className="ava-section">
                  <div className="ava-circle" style={{ overflow: 'hidden', padding: 0 }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{initials.toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.88rem', color: '#181c2c' }}>Profil Fotoğrafı</div>
                    <div style={{ fontSize: '.74rem', color: '#8890aa', marginTop: '.3rem' }}>Profil fotoğrafı değiştirme şu an devre dışı.</div>
                  </div>
                </div>
                <div className="f-row">
                  <div className="field"><div className="f-label">Ad</div><input className="f-inp" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Adın" /></div>
                  <div className="field"><div className="f-label">Soyad</div><input className="f-inp" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Soyadın" /></div>
                </div>
                <div className="field">
                  <div className="f-label">Kullanıcı Adı <span className="f-hint">foliom.com/@kullaniciadi</span></div>
                  <input className="f-inp" value={username} onChange={e => checkUsername(e.target.value)} placeholder="kullaniciadi" />
                  {usernameStatus === 'ok' && <div className="f-info ok">✓ Bu kullanıcı adı uygun.</div>}
                  {usernameStatus === 'err' && <div className="f-info err">✗ Bu kullanıcı adı alınmış.</div>}
                </div>
                <div className="field"><div className="f-label">Hakkında</div><textarea className="f-ta" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Kendin hakkında birkaç cümle…" /></div>
                <div className="field"><div className="f-label">Konum <span className="f-hint">isteğe bağlı</span></div><input className="f-inp" value={location} onChange={e => setLocation(e.target.value)} placeholder="Şehir, Ülke" /></div>
                <div className="field"><div className="f-label">Web Sitesi <span className="f-hint">isteğe bağlı</span></div><input className="f-inp" type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" /></div>
                <div className="btn-row">
                  <button className="btn btn-primary" onClick={saveProfile}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    Değişiklikleri Kaydet
                  </button>
                  <button className="btn btn-ghost" onClick={() => showToast('Değişiklikler iptal edildi')}>İptal</button>
                </div>
              </div>
            </div>

            {/* 2. Hesap & Güvenlik */}
            <div className="sc" id="s-account">
              <div className="sc-hd">
                <div className="sc-ico" style={{ background: 'linear-gradient(135deg,#1b6b3a,#2d8f52)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" /></svg>
                </div>
                <div><div className="sc-title">Hesap & Güvenlik</div><div className="sc-sub">E-posta, şifre ve oturum bilgilerin</div></div>
              </div>
              <div className="sc-body">
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #dde0e8' }}>
                  <div className="section-sep">E-posta Adresi</div>
                  <div className="field"><div className="f-label">Mevcut E-posta</div><input className="f-inp" type="email" value={email} disabled /></div>
                  <div style={{ fontSize: '.74rem', color: '#8890aa' }}>E-posta değiştirmek için destek ekibiyle iletişime geç.</div>
                </div>
                <div>
                  <div className="section-sep">Şifre Değiştir</div>
                  <div className="field">
                    <div className="f-label">Mevcut Şifre</div>
                    <div className="pass-wrap">
                      <input className="f-inp" type={showCur ? 'text' : 'password'} value={curPass} onChange={e => setCurPass(e.target.value)} placeholder="••••••••" />
                      <button className="pass-eye" onClick={() => setShowCur(!showCur)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="field">
                    <div className="f-label">Yeni Şifre</div>
                    <div className="pass-wrap">
                      <input className="f-inp" type={showNew ? 'text' : 'password'} value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="En az 8 karakter" />
                      <button className="pass-eye" onClick={() => setShowNew(!showNew)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                      </button>
                    </div>
                    {newPass && (
                      <>
                        <div style={{ display: 'flex', gap: '.25rem', marginTop: '.5rem' }}>
                          {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= ps ? strengthColors[ps] : '#dde0e8', transition: 'background .3s' }} />)}
                        </div>
                        <div style={{ fontSize: '.72rem', color: strengthColors[ps] || '#8890aa', marginTop: '.3rem' }}>{strengthLabels[ps]}</div>
                      </>
                    )}
                  </div>
                  <div className="field">
                    <div className="f-label">Yeni Şifre (tekrar)</div>
                    <div className="pass-wrap">
                      <input className="f-inp" type={showConf ? 'text' : 'password'} value={confPass} onChange={e => setConfPass(e.target.value)} placeholder="••••••••" />
                      <button className="pass-eye" onClick={() => setShowConf(!showConf)}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                      </button>
                    </div>
                    {confPass && <div className={`f-info${newPass === confPass ? ' ok' : ' err'}`}>{newPass === confPass ? '✓ Şifreler eşleşiyor' : '✗ Şifreler eşleşmiyor'}</div>}
                  </div>
                  <button className="btn btn-primary" onClick={updatePassword}>Şifreyi Güncelle</button>
                </div>
              </div>
            </div>

            {/* 3. Bildirimler */}
            <div className="sc" id="s-notif">
              <div className="sc-hd">
                <div className="sc-ico" style={{ background: 'linear-gradient(135deg,#c47a0a,#e09020)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                </div>
                <div><div className="sc-title">Bildirim Tercihleri</div><div className="sc-sub">Hangi bildirimleri, nasıl alacağını seç</div></div>
              </div>
              <div className="sc-body">
                {([
                  { k: 'follower' as NotifKey, l: 'Yeni Takipçi', d: 'Biri seni takip ettiğinde bildirim al' },
                  { k: 'comment' as NotifKey, l: 'Yorum Bildirimleri', d: 'Kitaplarına veya yorumlarına yorum yapıldığında' },
                  { k: 'like' as NotifKey, l: 'Beğeni Bildirimleri', d: 'Yorumların beğenildiğinde bildirim al' },
                  { k: 'newChapter' as NotifKey, l: 'Yeni Bölüm Uyarısı', d: 'Kütüphanendeki kitaplara yeni bölüm eklendiğinde' },
                  { k: 'followedAuthor' as NotifKey, l: 'Takip Ettiğim Yazarlar', d: 'Takip ettiğin yazarlar yeni kitap yayınladığında' },
                  { k: 'email' as NotifKey, l: 'E-posta Bildirimleri', d: 'Önemli güncellemeleri e-posta ile de al' },
                  { k: 'newsletter' as NotifKey, l: 'Foliom Bülteni', d: 'Haftalık editöryal seçkiler ve platform haberleri' },
                ] as { k: NotifKey; l: string; d: string }[]).map(n => (
                  <div key={n.k} className="tgl-row">
                    <div><div className="tgl-lbl">{n.l}</div><div className="tgl-desc">{n.d}</div></div>
                    <label className="tgl">
                      <input type="checkbox" checked={notifs[n.k]} onChange={() => setNotifs(p => ({ ...p, [n.k]: !p[n.k] }))} />
                      <span className="tgl-sl" />
                    </label>
                  </div>
                ))}
                <div className="btn-row"><button className="btn btn-primary" onClick={() => showToast('Bildirim tercihlerin kaydedildi!')}>Kaydet</button></div>
              </div>
            </div>

            {/* 4. Gizlilik */}
            <div className="sc" id="s-privacy">
              <div className="sc-hd">
                <div className="sc-ico" style={{ background: 'linear-gradient(135deg,#4a2080,#6a30a8)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                </div>
                <div><div className="sc-title">Gizlilik Ayarları</div><div className="sc-sub">Profilinin ve içeriklerinin görünürlüğünü kontrol et</div></div>
              </div>
              <div className="sc-body">
                {[
                  { label: 'Profil Görünürlüğü', val: profileVisibility, set: setProfileVisibility, opts: ['Herkese Açık', 'Yalnızca Takipçiler', 'Gizli'], desc: 'Profilinin kimler tarafından görülebileceğini belirle' },
                  { label: 'Okuma Listesi Gizliliği', val: listVisibility, set: setListVisibility, opts: ['Herkese Açık', 'Yalnızca Takipçiler', 'Sadece Ben'], desc: 'Okuma listelerin kimin görebileceğini seç' },
                  { label: 'Aktivite Geçmişi', val: activityVisibility, set: setActivityVisibility, opts: ['Herkese Açık', 'Takipçilerim', 'Gizli'], desc: 'Yorum ve oy aktivitelerinin profilinde görünmesi' },
                ].map((po, i) => (
                  <div key={i} className="po-row">
                    <div><div className="po-lbl">{po.label}</div><div className="po-desc">{po.desc}</div></div>
                    <select className="po-sel" value={po.val} onChange={e => { po.set(e.target.value); showToast(`${po.label} güncellendi`) }}>
                      {po.opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                {([
                  { k: 'privateAccount' as PrivacyKey, l: 'Hesabı Gizli Yap', d: 'Açıldığında yalnızca onayladığın kişiler takip edebilir' },
                  { k: 'allowMessages' as PrivacyKey, l: 'Mesaj İzinleri', d: 'Herkesten mesaj alabilirsin (kapatınca yalnızca takipçilerden)' },
                  { k: 'searchIndexing' as PrivacyKey, l: 'Arama Motorlarında Gözük', d: 'Google gibi arama motorları profilini indeksleyebilir' },
                ] as { k: PrivacyKey; l: string; d: string }[]).map(p => (
                  <div key={p.k} className="tgl-row">
                    <div><div className="tgl-lbl">{p.l}</div><div className="tgl-desc">{p.d}</div></div>
                    <label className="tgl">
                      <input type="checkbox" checked={privacy[p.k]} onChange={() => setPrivacy(pr => ({ ...pr, [p.k]: !pr[p.k] }))} />
                      <span className="tgl-sl" />
                    </label>
                  </div>
                ))}
                <div className="btn-row"><button className="btn btn-primary" onClick={() => showToast('Gizlilik ayarların kaydedildi!')}>Kaydet</button></div>
              </div>
            </div>

            {/* 5. Görünüm */}
            <div className="sc" id="s-appear">
              <div className="sc-hd">
                <div className="sc-ico" style={{ background: 'linear-gradient(135deg,#1a5a5a,#2d8f8f)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                </div>
                <div><div className="sc-title">Görünüm</div><div className="sc-sub">Okuma deneyimini kişiselleştir</div></div>
              </div>
              <div className="sc-body">
                <div className="field">
                </div>
                <div className="tgl-row">
                  <div><div className="tgl-lbl">Karanlık Mod</div><div className="tgl-desc">Göz yormayan koyu tema — tercih localStorage'a kaydedilir</div></div>
                  <label className="tgl">
                    <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} />
                    <span className="tgl-sl" />
                  </label>
                </div>
                <div className="tgl-row">
                  <div><div className="tgl-lbl">Animasyonları Azalt</div><div className="tgl-desc">Sayfa geçiş efektlerini ve animasyonları devre dışı bırak</div></div>
                  <label className="tgl"><input type="checkbox" /><span className="tgl-sl" /></label>
                </div>
                <div className="btn-row"><button className="btn btn-primary" onClick={() => showToast('Görünüm tercihlerin kaydedildi!')}>Kaydet</button></div>
              </div>
            </div>

            {/* 6. Tehlikeli Alan */}
            <div className="dz" id="s-danger">
              <div className="dz-title">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                Tehlikeli Alan
              </div>
              <div className="dz-row">
                <div><div className="dz-lbl">Tüm Verileri İndir</div><div className="dz-desc">Kitaplarının, yorumlarının ve hesap verilerinin yedeğini al</div></div>
                <button className="btn btn-ghost" onClick={downloadData}>↓ İndir</button>
              </div>
              <div className="dz-row">
                <div><div className="dz-lbl">Hesabı Devre Dışı Bırak</div><div className="dz-desc">Profilin ve içeriklerin geçici olarak gizlenir.</div></div>
                <button className="btn btn-danger-ghost" onClick={() => setDeactivateModal(true)}>Devre Dışı Bırak</button>
              </div>
              <div className="dz-row">
                <div><div className="dz-lbl">Hesabı Kalıcı Olarak Sil</div><div className="dz-desc">Tüm kitapların, yorumların ve veriler kalıcı olarak silinir.</div></div>
                <button className="btn btn-danger" onClick={() => setDeleteModal(true)}>Hesabı Sil</button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Devre Dışı Modal */}
      {deactivateModal && (
        <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) setDeactivateModal(false) }}>
          <div className="modal">
            <div className="modal-hd"><div className="modal-title">Hesabı Devre Dışı Bırak</div></div>
            <div className="modal-body">
              Hesabını devre dışı bırakmak istediğine emin misin? Profilin ve içeriklerin diğer kullanıcılara görünmez olacak.
              <div className="modal-warn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                Hesabını tekrar aktifleştirmek için giriş yapman yeterli.
              </div>
            </div>
            <div className="modal-ft">
              <button className="btn btn-ghost" onClick={() => setDeactivateModal(false)}>İptal</button>
              <button className="btn btn-danger" onClick={deactivateAccount}>Devre Dışı Bırak</button>
            </div>
          </div>
        </div>
      )}

      {/* Sil Modal */}
      {deleteModal && (
        <div className="modal-back" onClick={e => { if (e.target === e.currentTarget) { setDeleteModal(false); setDeleteConfirm('') } }}>
          <div className="modal">
            <div className="modal-hd"><div className="modal-title">Hesabı Kalıcı Olarak Sil</div></div>
            <div className="modal-body">
              <strong>Bu işlem geri alınamaz.</strong> Tüm kitapların, okuma listelerin, yorumların kalıcı olarak silinecek.
              <div style={{ marginTop: '1rem' }}>
                <div className="f-label" style={{ marginBottom: '.4rem' }}>Onaylamak için &quot;HESABIMI SİL&quot; yaz</div>
                <input className="f-inp" type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="HESABIMI SİL" />
              </div>
              <div className="modal-warn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                Bu işlem geri alınamaz.
              </div>
            </div>
            <div className="modal-ft">
              <button className="btn btn-ghost" onClick={() => { setDeleteModal(false); setDeleteConfirm('') }}>İptal</button>
              <button className="btn btn-danger" onClick={deleteAccount}>Kalıcı Olarak Sil</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`st-toast ${toast.type}`}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14, flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d={toast.type === 'err' ? 'M6 18 18 6M6 6l12 12' : toast.type === 'warn' ? 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z' : 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z'} />
          </svg>
          {toast.msg}
        </div>
      )}
    </>
  )
}
