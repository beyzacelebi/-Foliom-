'use client'
import NavBar from '@/components/NavBar'
import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Character { name: string; role: string; age: string; desc: string; color: string; photo: string | null }
const COLORS = ['#2e4f91', '#8f2448', '#1b6b3a', '#7a4a0e', '#4a2080', '#1a5a5a', '#7a2020']
const ROL: { [k: string]: string } = { main: 'Baş Karakter', side: 'Yardımcı', villain: 'Antagonist', other: 'Diğer' }

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
.wr-shell{display:flex;flex-direction:column;height:100vh;padding-top:64px;font-family:'Nunito Sans',sans-serif;background:#f2f3f7}
.wr-top{flex-shrink:0;height:58px;background:#fff;border-bottom:1px solid #dde0e8;display:flex;align-items:center;gap:.75rem;padding:0 1.25rem;box-shadow:0 1px 12px rgba(24,28,44,.07);z-index:200}
.wr-story{flex:1;min-width:0}
.wr-sname{font-size:.85rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px}
.wr-ssub{font-size:.67rem;color:#8890aa;margin-top:.05rem}
.wr-save{display:flex;align-items:center;gap:.35rem;font-size:.71rem;font-weight:700;padding:.3rem .7rem;border-radius:20px;border:1px solid transparent;transition:all .25s;white-space:nowrap;flex-shrink:0}
.wr-save svg{width:13px;height:13px}
.wr-save.saved{color:#1b6b3a;background:#e6f7ed;border-color:rgba(27,107,58,.15)}
.wr-save.saving{color:#2e4f91;background:#edf2fc;border-color:#d6e2f7}
.wr-save.unsaved{color:#c47a0a;background:#fef3dc;border-color:rgba(196,122,10,.2)}
.wr-tbtn{display:inline-flex;align-items:center;gap:.38rem;padding:.42rem .95rem;border-radius:8px;font-size:.79rem;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .2s;font-family:inherit}
.wr-ghost{color:#434961;border:1.5px solid #dde0e8;background:none}
.wr-ghost:hover{border-color:#4169af;color:#2e4f91;background:#edf2fc}
.wr-pub{color:#fff;border:none;background:linear-gradient(135deg,#2e4f91,#8f2448);box-shadow:0 2px 10px rgba(30,58,110,.28)}
.wr-pub:hover{opacity:.88}
.wr-tabs{flex-shrink:0;background:#fff;border-bottom:1px solid #dde0e8;display:flex;align-items:flex-end;padding:0 1.25rem}
.wr-tab{display:inline-flex;align-items:center;gap:.42rem;padding:.7rem 1.1rem;font-size:.81rem;font-weight:700;color:#8890aa;border-bottom:2.5px solid transparent;cursor:pointer;background:none;border-left:none;border-right:none;border-top:none;font-family:inherit;transition:color .2s,border-color .2s;margin-bottom:-1px}
.wr-tab.on{color:#2e4f91;border-bottom-color:#2e4f91}
.wr-tab svg{width:15px;height:15px}
.wr-workspace{flex:1;display:flex;overflow:hidden;min-height:0}
.wr-ecol{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0}
.wr-fbar{flex-shrink:0;background:#fff;border-bottom:1px solid #dde0e8;padding:.42rem 1rem;display:flex;align-items:center;gap:.1rem;flex-wrap:wrap}
.wr-fbsep{width:1px;height:22px;background:#dde0e8;margin:0 .35rem;flex-shrink:0}
.wr-fsel{height:28px;padding:0 .6rem;border-radius:6px;border:1.5px solid #dde0e8;background:#fff;font-size:.75rem;color:#434961;outline:none;cursor:pointer;font-family:inherit}
.wr-fbtn{width:30px;height:28px;border-radius:5px;display:flex;align-items:center;justify-content:center;color:#434961;cursor:pointer;background:none;border:none;transition:background .2s,color .2s}
.wr-fbtn:hover{background:#e8eaf0;color:#2e4f91}
.wr-fbtn.on{background:#edf2fc;color:#2e4f91}
.wr-fbtn svg{width:15px;height:15px;pointer-events:none}
.wr-ebody{flex:1;overflow-y:auto;background:#f2f3f7}
.wr-sheet{max-width:740px;margin:0 auto;padding:2rem 2.5rem 4rem}
.wr-chtitle{width:100%;background:transparent;border:none;outline:none;resize:none;font-family:'Cormorant Garamond',Georgia,serif;font-size:2.1rem;font-weight:900;color:#181c2c;line-height:1.2;padding:0;overflow:hidden}
.wr-chtitle::placeholder{color:#b4bacf}
.wr-div{height:1.5px;background:#dde0e8;margin:1rem 0 1.5rem;border-radius:1px}
.wr-editor{min-height:480px;outline:none;font-family:'Spectral',Georgia,serif;font-size:17.5px;line-height:1.9;color:#181c2c;word-break:break-word}
.wr-editor:empty::before{content:attr(data-placeholder);color:#b4bacf;pointer-events:none}
.wr-editor p{margin-bottom:1.2em}
.wr-editor h1{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.8em;font-weight:900;line-height:1.15;margin:1.3em 0 .5em}
.wr-editor h2{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.35em;font-weight:700;margin:1.1em 0 .4em}
.wr-editor blockquote{border-left:3px solid #b83360;padding-left:1.2rem;margin:1.5em 0;font-style:italic;color:#434961;opacity:.9}
.wr-cstrip{flex-shrink:0;height:32px;background:#fff;border-top:1px solid #dde0e8;display:flex;align-items:center;padding:0 1.25rem;gap:1.5rem;font-size:.69rem;color:#8890aa}
.wr-sidebar{width:252px;flex-shrink:0;background:#fff;border-left:1px solid #dde0e8;overflow-y:auto;display:flex;flex-direction:column}
.wr-sb-sec{padding:.95rem 1rem;border-bottom:1px solid #dde0e8}
.wr-sb-lbl{font-size:.64rem;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#8890aa;margin-bottom:.8rem;display:block}
.wr-sb-inp{width:100%;background:#e8eaf0;border:1.5px solid #dde0e8;border-radius:8px;padding:.46rem .75rem;font-size:.79rem;color:#181c2c;outline:none;transition:border-color .2s;margin-bottom:.55rem;font-family:inherit}
.wr-sb-inp:focus{border-color:#4169af}
.wr-sb-sel{width:100%;background:#e8eaf0;border:1.5px solid #dde0e8;border-radius:8px;padding:.46rem .75rem;font-size:.79rem;color:#181c2c;outline:none;cursor:pointer;margin-bottom:.55rem;font-family:inherit}
.wr-sb-ta{width:100%;background:#e8eaf0;border:1.5px solid #dde0e8;border-radius:8px;padding:.46rem .75rem;font-size:.78rem;color:#181c2c;resize:none;min-height:72px;outline:none;font-family:inherit}
.wr-stgrid{display:grid;grid-template-columns:1fr 1fr;gap:.4rem}
.wr-stbox{background:#e8eaf0;border-radius:8px;padding:.55rem .6rem;text-align:center}
.wr-stnum{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.1rem;font-weight:900;color:#2e4f91}
.wr-stlbl{font-size:.61rem;color:#8890aa;margin-top:.04rem}
.wr-tgl-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:.55rem}
.wr-tgl-lbl{font-size:.78rem;font-weight:600;color:#434961}
.wr-tgl{position:relative;width:38px;height:21px}
.wr-tgl input{opacity:0;width:0;height:0}
.wr-tgl-sl{position:absolute;inset:0;background:#dde0e8;border-radius:21px;cursor:pointer;transition:background .2s}
.wr-tgl-sl::before{content:'';position:absolute;width:15px;height:15px;left:3px;top:3px;background:#fff;border-radius:50%;transition:transform .2s}
.wr-tgl input:checked+.wr-tgl-sl{background:#2e4f91}
.wr-tgl input:checked+.wr-tgl-sl::before{transform:translateX(17px)}
.wr-cpanel{flex:1;overflow-y:auto;padding:1.75rem;display:none}
.wr-cpanel.on{display:block}
.wr-cpanelhd{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem}
.wr-cptitle{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.5rem;font-weight:900}
.wr-cpadd{display:inline-flex;align-items:center;gap:.4rem;padding:.52rem 1.1rem;border-radius:9px;font-size:.8rem;font-weight:700;background:linear-gradient(135deg,#2e4f91,#8f2448);color:#fff;box-shadow:0 2px 10px rgba(30,58,110,.22);cursor:pointer;border:none;font-family:inherit}
.wr-cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:1rem}
.wr-ccard{background:#fff;border:1px solid #dde0e8;border-radius:14px;padding:1.15rem;display:flex;gap:.95rem;position:relative;transition:box-shadow .2s}
.wr-ccard:hover{box-shadow:0 6px 24px rgba(24,28,44,.13)}
.wr-cava{width:60px;height:60px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-family:'Cormorant Garamond',Georgia,serif;font-size:1.55rem;font-weight:900;color:#fff}
.wr-cbadge{display:inline-block;font-size:.62rem;font-weight:800;letter-spacing:.5px;text-transform:uppercase;padding:.14rem .55rem;border-radius:20px;margin-bottom:.45rem}
.badge-main{background:rgba(46,79,145,.1);color:#2e4f91}
.badge-side{background:rgba(143,36,72,.09);color:#8f2448}
.badge-villain{background:rgba(90,15,15,.1);color:#7a1a1a}
.badge-other{background:#e8eaf0;color:#8890aa}
.wr-cacts{position:absolute;top:.75rem;right:.75rem;display:flex;gap:.25rem;opacity:0;transition:opacity .2s}
.wr-ccard:hover .wr-cacts{opacity:1}
.wr-cact{width:27px;height:27px;border-radius:6px;display:flex;align-items:center;justify-content:center;background:#e8eaf0;color:#8890aa;cursor:pointer;border:none;transition:all .2s}
.wr-cact:hover{background:#edf2fc;color:#2e4f91}
.wr-cact.del:hover{background:#f0d6de;color:#8f2448}
.wr-cact svg{width:13px;height:13px}
.wr-empty{text-align:center;padding:5rem 2rem;display:flex;flex-direction:column;align-items:center;gap:.6rem}
.wr-empty-ico{width:68px;height:68px;border-radius:18px;background:#e8eaf0;display:flex;align-items:center;justify-content:center;margin-bottom:.4rem}
.wr-empty-ico svg{width:30px;height:30px;color:#b4bacf}
.wr-modal{position:fixed;inset:0;background:rgba(0,0,0,.48);z-index:500;display:flex;align-items:center;justify-content:center;padding:1.5rem}
.wr-mbox{background:#fff;border-radius:18px;width:100%;max-width:500px;box-shadow:0 24px 64px rgba(0,0,0,.3);overflow:hidden;animation:mPop .22s ease}
@keyframes mPop{from{opacity:0;transform:translateY(-12px) scale(.97)}to{opacity:1;transform:none}}
.wr-mhd{padding:1.25rem 1.5rem;border-bottom:1px solid #dde0e8;display:flex;align-items:center;justify-content:space-between}
.wr-mtitle{font-family:'Cormorant Garamond',Georgia,serif;font-size:1.3rem;font-weight:900}
.wr-mx{width:30px;height:30px;border-radius:7px;background:#e8eaf0;display:flex;align-items:center;justify-content:center;color:#8890aa;cursor:pointer;border:none;transition:all .2s}
.wr-mx:hover{background:#dde0e8;color:#181c2c}
.wr-mx svg{width:15px;height:15px}
.wr-mbody{padding:1.5rem;display:grid;grid-template-columns:90px 1fr;gap:1.25rem}
.wr-mft{padding:1rem 1.5rem;border-top:1px solid #dde0e8;display:flex;justify-content:flex-end;gap:.6rem}
.wr-mbtn{display:inline-flex;align-items:center;gap:.4rem;padding:.52rem 1.15rem;border-radius:9px;font-size:.82rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s}
.wr-mbtn-gh{border:1.5px solid #dde0e8;color:#434961;background:none}
.wr-mbtn-gh:hover{border-color:#4169af;color:#2e4f91}
.wr-mbtn-pr{background:linear-gradient(135deg,#2e4f91,#8f2448);color:#fff;border:none}
.wr-mbtn-pr:hover{opacity:.87}
.wr-minp{width:100%;background:#e8eaf0;border:1.5px solid #dde0e8;border-radius:9px;padding:.54rem .85rem;font-size:.85rem;color:#181c2c;outline:none;transition:border-color .2s;font-family:inherit}
.wr-minp:focus{border-color:#4169af}
.wr-msel{width:100%;background:#e8eaf0;border:1.5px solid #dde0e8;border-radius:9px;padding:.54rem .85rem;font-size:.85rem;color:#181c2c;outline:none;cursor:pointer;font-family:inherit}
.wr-mta{width:100%;background:#e8eaf0;border:1.5px solid #dde0e8;border-radius:9px;padding:.54rem .85rem;font-size:.85rem;color:#181c2c;resize:none;min-height:84px;outline:none;font-family:inherit}
.wr-mta:focus{border-color:#4169af}
.wr-mlbl{display:block;font-size:.73rem;font-weight:700;color:#434961;margin-bottom:.3rem}
.wr-mfields{display:flex;flex-direction:column;gap:.75rem}
.wr-ava-up{width:90px;height:90px;border-radius:14px;background:#e8eaf0;border:2px dashed #dde0e8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.3rem;font-size:.67rem;font-weight:700;color:#8890aa;cursor:pointer;position:relative;overflow:hidden;transition:all .2s;font-family:inherit;flex-shrink:0}
.wr-ava-up:hover{border-color:#4169af;color:#2e4f91}
.wr-ava-up svg{width:20px;height:20px}
.wr-cover-up{width:100%;aspect-ratio:2/3;background:#e8eaf0;border:2px dashed #dde0e8;border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.35rem;font-size:.71rem;font-weight:700;color:#8890aa;cursor:pointer;position:relative;overflow:hidden;transition:border-color .2s,color .2s;font-family:inherit;margin-top:.55rem}
.wr-cover-up:hover{border-color:#4169af;color:#2e4f91}
.wr-cover-up svg{width:22px;height:22px}
.wr-toast{position:fixed;bottom:1.75rem;left:50%;transform:translateX(-50%);background:rgba(24,28,44,.96);color:#fff;padding:.55rem 1.15rem;border-radius:10px;font-size:.79rem;font-weight:600;display:flex;align-items:center;gap:.45rem;box-shadow:0 6px 24px rgba(0,0,0,.28);z-index:700;white-space:nowrap}
.wr-toast svg{width:14px;height:14px;color:#5de898}
@media(max-width:900px){.wr-sidebar{display:none}}
@media(max-width:680px){.wr-sheet{padding:1.5rem 1.25rem 4rem}}
`

function WritePageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initStoryId = searchParams.get('story')
    const edRef = useRef<HTMLDivElement>(null)
    const titleRef = useRef<HTMLTextAreaElement>(null)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const storyIdRef = useRef<string | null>(null)
    const chapterIdRef = useRef<string | null>(null)
    const [tab, setTab] = useState<'editor' | 'chars'>('editor')
    const [bookTitle, setBookTitle] = useState('')
    const [chapTitle, setChapTitle] = useState('')
    const [chapNo, setChapNo] = useState(1)
    const [genre, setGenre] = useState('Roman')
    const [status, setStatus] = useState('Taslak')
    const [saveState, setSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved')
    const [words, setWords] = useState(0)
    const [chars2, setChars2] = useState(0)
    const [paras, setParas] = useState(0)
    const [readMin, setReadMin] = useState(0)
    const [chars, setChars] = useState<Character[]>([])
    const [charModal, setCharModal] = useState(false)
    const [pubModal, setPubModal] = useState(false)
    const [editIdx, setEditIdx] = useState(-1)
    const [mName, setMName] = useState('')
    const [mRole, setMRole] = useState('main')
    const [mAge, setMAge] = useState('')
    const [mDesc, setMDesc] = useState('')
    const [mPhoto, setMPhoto] = useState<string | null>(null)
    const [coverUrl, setCoverUrl] = useState<string | null>(null)
    const [coverUploading, setCoverUploading] = useState(false)
    const [toast, setToast] = useState<string | null>(null)
    const toastTmr = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [bold, setBold] = useState(false)
    const [italic, setItalic] = useState(false)
    const [underline, setUnderline] = useState(false)
    const [commentOpen, setCommentOpen] = useState(true)
    const [scheduledPub, setScheduledPub] = useState(false)
    const [pubNote, setPubNote] = useState('')

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => { if (!session) router.replace('/auth') })
    }, [router])

    useEffect(() => {
        if (!initStoryId) return;

        async function loadStory() {
            setSaveState('saving')
            try {
                const { data: storyData } = await supabase.from('stories').select('*').eq('id', initStoryId).single()
                if (storyData) {
                    storyIdRef.current = storyData.id
                    setBookTitle(storyData.title)
                    setGenre(storyData.genre || 'Roman')
                    if (storyData.cover_url) setCoverUrl(storyData.cover_url)

                    const { data: chaptersData } = await supabase.from('chapters').select('chapter_num').eq('story_id', storyData.id).order('chapter_num', { ascending: false }).limit(1)
                    if (chaptersData && chaptersData.length > 0) {
                        setChapNo(chaptersData[0].chapter_num + 1)
                    } else {
                        setChapNo(1)
                    }

                    const { data: charsData } = await supabase.from('story_characters').select('*').eq('story_id', storyData.id)
                    if (charsData) {
                        setChars(charsData.map((c: any) => ({
                            name: c.name,
                            role: c.role,
                            age: c.age || '',
                            desc: c.description || '',
                            color: c.color || COLORS[0],
                            photo: c.photo || null
                        })))
                    }
                }
            } catch (err) {
                showToast('Kitap bilgileri alınamadı')
            } finally {
                setSaveState('saved')
            }
        }
        loadStory();
    }, [initStoryId])

    function showToast(msg: string) {
        setToast(msg)
        if (toastTmr.current) clearTimeout(toastTmr.current)
        toastTmr.current = setTimeout(() => setToast(null), 2500)
    }

    async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setCoverUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { showToast('Oturum açman gerekiyor'); return }
            const ext = file.name.split('.').pop() || 'jpg'
            const path = `${user.id}/${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('covers').upload(path, file, { upsert: true })
            if (upErr) { showToast('Yükleme başarısız: ' + upErr.message); return }
            const { data: urlData } = supabase.storage.from('covers').getPublicUrl(path)
            setCoverUrl(urlData.publicUrl)
            showToast('Kapak yüklendi!')
            if (storyIdRef.current) {
                await supabase.from('stories').update({ cover_url: urlData.publicUrl }).eq('id', storyIdRef.current)
            }
        } finally {
            setCoverUploading(false)
            e.target.value = ''
        }
    }

    function dirty() {
        setSaveState('unsaved')
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(autoSave, 2800)
    }

    async function autoSave() {
        setSaveState('saving')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setSaveState('unsaved'); return }
            const content = edRef.current?.innerHTML || ''
            const wordCount = edRef.current?.innerText?.trim().split(/\s+/).filter(Boolean).length || 0

            // Story: insert once, then update
            let sId = storyIdRef.current
            if (!sId) {
                const { data: sData, error: sErr } = await supabase
                    .from('stories')
                    .insert({ author_id: user.id, title: bookTitle || 'İsimsiz Kitap', genre, cover_url: coverUrl || null, is_published: false })
                    .select('id')
                    .single()
                if (sErr || !sData) { setSaveState('unsaved'); return }
                sId = sData.id
                storyIdRef.current = sId
            } else {
                await supabase.from('stories').update({ title: bookTitle || 'İsimsiz Kitap', genre, cover_url: coverUrl || null, updated_at: new Date().toISOString() }).eq('id', sId)
            }

            // Chapter: insert once, then update
            const cId = chapterIdRef.current
            if (!cId) {
                const { data: cData } = await supabase
                    .from('chapters')
                    .insert({ story_id: sId, title: chapTitle || 'İsimsiz Bölüm', content, chapter_num: chapNo, word_count: wordCount, is_published: false })
                    .select('id')
                    .single()
                if (cData) chapterIdRef.current = cData.id
            } else {
                await supabase.from('chapters').update({ title: chapTitle || 'İsimsiz Bölüm', content, chapter_num: chapNo, word_count: wordCount, updated_at: new Date().toISOString() }).eq('id', cId)
            }

            setSaveState('saved')
        } catch {
            setSaveState('unsaved')
        }
    }

    function updateCounts() {
        const txt = edRef.current?.innerText?.trim() || ''
        const w = txt ? txt.split(/\s+/).filter(Boolean).length : 0
        const c = txt.length
        const p = edRef.current?.querySelectorAll('p,h1,h2,blockquote,li').length || 0
        const m = Math.max(1, Math.ceil(w / 200))
        setWords(w); setChars2(c); setParas(p); setReadMin(m)
    }

    function fmt(cmd: string) {
        document.execCommand(cmd, false, undefined)
        edRef.current?.focus()
        syncToolbar()
    }

    function fmtBlock(val: string) {
        document.execCommand('formatBlock', false, '<' + val + '>')
        edRef.current?.focus()
    }

    function syncToolbar() {
        setBold(document.queryCommandState('bold'))
        setItalic(document.queryCommandState('italic'))
        setUnderline(document.queryCommandState('underline'))
    }

    function onKey(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            const tag = document.queryCommandValue('formatBlock').toLowerCase().replace(/[<>]/g, '')
            if (['h1', 'h2', 'blockquote'].includes(tag)) { e.preventDefault(); document.execCommand('formatBlock', false, '<p>') }
        }
        syncToolbar()
        dirty()
    }

    function titleGrow(el: HTMLTextAreaElement) {
        el.style.height = 'auto'
        el.style.height = el.scrollHeight + 'px'
    }

    function saveToLibrary() {
        setSaveState('unsaved')
        autoSave()
        showToast('Taslak kaydedildi ✓')
    }

    async function publish() {
        if (!bookTitle.trim()) { showToast('Lütfen kitap başlığı gir'); return }
        if (!chapTitle.trim()) { showToast('Lütfen bölüm başlığı gir'); return }
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { showToast('Oturum açman gerekiyor'); return }
            const content = edRef.current?.innerHTML || ''
            const wordCount = edRef.current?.innerText?.trim().split(/\s+/).filter(Boolean).length || 0

            // Story: insert or update
            let sId = storyIdRef.current
            if (!sId) {
                const { data: sData, error: sErr } = await supabase
                    .from('stories')
                    .insert({ author_id: user.id, title: bookTitle.trim(), genre, cover_url: coverUrl || null, is_published: true, status: 'published' })
                    .select('id')
                    .single()
                if (sErr || !sData) { showToast('Kitap kaydedilemedi'); return }
                sId = sData.id
                storyIdRef.current = sId
            } else {
                await supabase.from('stories').update({ title: bookTitle.trim(), genre, cover_url: coverUrl || null, is_published: true, status: 'published', updated_at: new Date().toISOString() }).eq('id', sId)
            }

            // Chapter: insert or update
            const cId = chapterIdRef.current
            if (!cId) {
                const { data: cData, error: cErr } = await supabase
                    .from('chapters')
                    .insert({ story_id: sId, title: chapTitle.trim(), content, chapter_num: chapNo, word_count: wordCount, is_published: true })
                    .select('id')
                    .single()
                if (cErr || !cData) { showToast('Bölüm kaydedilemedi'); return }
                chapterIdRef.current = cData.id
            } else {
                const { error: cErr } = await supabase.from('chapters').update({ title: chapTitle.trim(), content, chapter_num: chapNo, word_count: wordCount, is_published: true, updated_at: new Date().toISOString() }).eq('id', cId)
                if (cErr) { showToast('Bölüm kaydedilemedi'); return }
            }

            // Karakterleri story_characters tablosuna kaydet
            if (chars.length > 0 && sId) {
                await supabase.from('story_characters').delete().eq('story_id', sId)
                await supabase.from('story_characters').insert(
                    chars.map(c => ({
                        story_id: sId,
                        name: c.name,
                        role: c.role,
                        age: c.age || null,
                        description: c.desc || null,
                        color: c.color,
                    }))
                )
            }



            setPubModal(false)
            setStatus('Yayında')
            setSaveState('saved')
            showToast('Bölüm başarıyla yayınlandı!')
        } catch {
            showToast('Bir hata oluştu, tekrar dene')
        }
    }

    function openCharModal(idx?: number) {
        const i = idx ?? -1; setEditIdx(i)
        if (i === -1) { setMName(''); setMRole('main'); setMAge(''); setMDesc(''); setMPhoto(null) }
        else { const c = chars[i]; setMName(c.name); setMRole(c.role); setMAge(c.age); setMDesc(c.desc); setMPhoto(c.photo) }
        setCharModal(true)
    }

    function saveChar() {
        if (!mName.trim()) { showToast('Lütfen karakter adı gir'); return }
        const obj: Character = { name: mName.trim(), role: mRole, age: mAge.trim(), desc: mDesc.trim(), color: editIdx === -1 ? COLORS[chars.length % COLORS.length] : chars[editIdx].color, photo: mPhoto }
        if (editIdx === -1) setChars(p => [...p, obj])
        else setChars(p => p.map((c, i) => i === editIdx ? obj : c))
        showToast(editIdx === -1 ? 'Karakter eklendi!' : 'Karakter güncellendi!')
        setCharModal(false)
    }

    function delChar(i: number) {
        if (!confirm(`"${chars[i].name}" silinsin mi?`)) return
        setChars(p => p.filter((_, j) => j !== i))
        showToast('Karakter silindi')
    }

    return (
        <>
            <style>{CSS}</style>
            <div className="wr-shell">
                {/* Top Bar */}
                <NavBar />
                <div className="wr-top">
                    <div className="wr-story">
                        <input value={bookTitle} onChange={e => { setBookTitle(e.target.value); dirty() }}
                            placeholder="Kitap başlığını gir…"
                            style={{ background: 'none', border: 'none', outline: 'none', fontWeight: 700, fontSize: '.85rem', color: '#181c2c', width: '100%', fontFamily: 'inherit' }} />
                        <div className="wr-ssub">Bölüm {chapNo} {status !== 'Taslak' ? '— ' + status : '— Düzenleniyor'}</div>
                    </div>
                    <div className={`wr-save ${saveState}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={saveState === 'saved' ? 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z' : saveState === 'saving' ? 'M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99' : 'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z'} />
                        </svg>
                        {saveState === 'saved' ? 'Kaydedildi' : saveState === 'saving' ? 'Kaydediliyor…' : 'Kaydedilmedi'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.45rem', flexShrink: 0 }}>
                        <button className="wr-tbtn wr-ghost" onClick={saveToLibrary}>Taslak Kaydet</button>
                        <button className="wr-tbtn wr-ghost" onClick={() => showToast('Önizleme yakında!')}>Önizle</button>
                        <button className="wr-tbtn wr-pub" onClick={() => setPubModal(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor" style={{ width: 14, height: 14 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                            </svg>
                            Yayınla
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="wr-tabs">
                    <button className={`wr-tab${tab === 'editor' ? ' on' : ''}`} onClick={() => setTab('editor')}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                        Editör
                    </button>
                    <button className={`wr-tab${tab === 'chars' ? ' on' : ''}`} onClick={() => setTab('chars')}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                        Karakterler
                        <span style={{ fontSize: '.62rem', fontWeight: 800, padding: '.05rem .45rem', borderRadius: 20, background: '#d6e2f7', color: '#2e4f91' }}>{chars.length}</span>
                    </button>
                </div>

                {/* Workspace */}
                <div className="wr-workspace">
                    {/* Editor */}
                    {tab === 'editor' && (
                        <div className="wr-ecol">
                            {/* Format bar */}
                            <div className="wr-fbar">
                                <select className="wr-fsel" style={{ width: 118 }} onChange={e => fmtBlock(e.target.value)}>
                                    <option value="p">Normal Metin</option>
                                    <option value="h1">Başlık 1</option>
                                    <option value="h2">Başlık 2</option>
                                    <option value="blockquote">Alıntı</option>
                                </select>
                                <select className="wr-fsel" style={{ width: 115 }} onChange={e => document.execCommand('fontName', false, e.target.value)}>
                                    <option value="'Spectral',Georgia,serif">Spectral</option>
                                    <option value="'Lora',Georgia,serif">Lora</option>
                                    <option value="'Merriweather',Georgia,serif">Merriweather</option>
                                    <option value="'Cormorant Garamond',Georgia,serif">Cormorant</option>
                                    <option value="'Nunito Sans',sans-serif">Nunito Sans</option>
                                </select>
                                <div className="wr-fbsep" />
                                {[
                                    { id: 'bold', svg: <path d="M13.5 15.5H10V12.5H13.5C14.33 12.5 15 13.17 15 14C15 14.83 14.33 15.5 13.5 15.5ZM10 6.5H13C13.83 6.5 14.5 7.17 14.5 8C14.5 8.83 13.83 9.5 13 9.5H10V6.5ZM15.6 10.79C16.57 10.11 17.25 9 17.25 8C17.25 5.74 15.5 4 13.25 4H7V18H14.04C16.14 18 17.75 16.3 17.75 14.21C17.75 12.69 16.89 11.39 15.6 10.79Z" />, fill: true, on: bold },
                                    { id: 'italic', svg: <path d="M10 4V7H12.21L8.79 15H6V18H14V15H11.79L15.21 7H18V4H10Z" />, fill: true, on: italic },
                                    { id: 'underline', svg: <path d="M12 17C14.76 17 17 14.76 17 12V3H14.5V12C14.5 13.38 13.38 14.5 12 14.5C10.62 14.5 9.5 13.38 9.5 12V3H7V12C7 14.76 9.24 17 12 17ZM5 19V21H19V19H5Z" />, fill: true, on: underline },
                                ].map(b => (
                                    <button key={b.id} className={`wr-fbtn${b.on ? ' on' : ''}`} onClick={() => fmt(b.id)}>
                                        <svg viewBox="0 0 24 24" fill="currentColor">{b.svg}</svg>
                                    </button>
                                ))}
                                <div className="wr-fbsep" />
                                {[
                                    { cmd: 'justifyLeft', path: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12' },
                                    { cmd: 'justifyCenter', path: 'M3.75 6.75h16.5M3.75 12h16.5M11.25 17.25h1.5' },
                                    { cmd: 'justifyRight', path: 'M3.75 6.75h16.5M3.75 12h16.5M12 17.25h8.25' },
                                ].map(b => (
                                    <button key={b.cmd} className="wr-fbtn" onClick={() => fmt(b.cmd)}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={b.path} /></svg>
                                    </button>
                                ))}
                                <div className="wr-fbsep" />
                                <button className="wr-fbtn" onClick={() => fmt('insertUnorderedList')} title="Liste">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                                </button>
                                <button className="wr-fbtn" onClick={() => fmt('insertOrderedList')} title="Numaralı">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.242 5.992h12m-12 6.003H20.24m-12 5.999h12M4.117 7.495v-3.75H2.99m1.125 3.75H2.99m1.125 0H5.24m-1.92 2.577a1.125 1.125 0 0 1 1.919.54c.01.322-.055.643-.269.927l-1.765 2.174h2.152m-2.071 4.5h2.1" /></svg>
                                </button>
                                <button className="wr-fbtn" onClick={() => fmt('undo')} title="Geri Al">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
                                </button>
                                <button className="wr-fbtn" onClick={() => fmt('redo')} title="İleri Al">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" /></svg>
                                </button>
                            </div>

                            {/* Editor body */}
                            <div className="wr-ebody">
                                <div className="wr-sheet">
                                    <textarea ref={titleRef} className="wr-chtitle" rows={1}
                                        placeholder="Bölüm başlığını yaz…"
                                        value={chapTitle}
                                        onChange={e => { setChapTitle(e.target.value); titleGrow(e.target); dirty() }} />
                                    <div className="wr-div" />
                                    <div ref={edRef} className="wr-editor" contentEditable
                                        data-placeholder="Yazmaya başla…"
                                        onInput={() => { updateCounts(); dirty() }}
                                        onKeyDown={onKey}
                                        onSelect={syncToolbar}
                                        suppressContentEditableWarning />
                                </div>
                            </div>

                            {/* Count strip */}
                            <div className="wr-cstrip">
                                <span>{words} kelime</span>
                                <span>{chars2} karakter</span>
                                <span>~{readMin} dk okuma</span>
                                <span>{paras} paragraf</span>
                            </div>
                        </div>
                    )}

                    {/* Characters panel */}
                    {tab === 'chars' && (
                        <div className="wr-cpanel on">
                            <div className="wr-cpanelhd">
                                <h2 className="wr-cptitle">Karakter Listesi</h2>
                                <button className="wr-cpadd" onClick={() => openCharModal()}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    Yeni Karakter
                                </button>
                            </div>
                            {chars.length === 0 ? (
                                <div className="wr-empty">
                                    <div className="wr-empty-ico">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                                    </div>
                                    <h3 style={{ fontFamily: 'Cormorant Garamond,Georgia,serif', fontSize: '1.25rem', fontWeight: 700, color: '#434961' }}>Henüz karakter yok</h3>
                                    <p style={{ fontSize: '.83rem', color: '#8890aa', maxWidth: 320, lineHeight: 1.6 }}>Hikayen için karakterleri ekleyebilir, fotoğraf, rol ve açıklama girebilirsin.</p>
                                </div>
                            ) : (
                                <div className="wr-cgrid">
                                    {chars.map((c, i) => (
                                        <div key={i} className="wr-ccard">
                                            <div className="wr-cava" style={{ background: c.color }}>
                                                {c.photo
                                                    ? <img src={c.photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
                                                    : <span>{c.name[0]?.toUpperCase()}</span>}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '.92rem', fontWeight: 700, marginBottom: '.22rem' }}>{c.name}</div>
                                                <span className={`wr-cbadge badge-${c.role}`}>{ROL[c.role]}</span>
                                                {c.age && <div style={{ fontSize: '.65rem', fontWeight: 700, padding: '.14rem .5rem', borderRadius: 6, background: '#e8eaf0', color: '#8890aa', display: 'inline-block', marginLeft: 4 }}>{c.age}</div>}
                                                <div style={{ fontSize: '.78rem', color: '#8890aa', lineHeight: 1.55, marginTop: '.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.desc}</div>
                                            </div>
                                            <div className="wr-cacts">
                                                <button className="wr-cact" onClick={() => openCharModal(i)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>
                                                </button>
                                                <button className="wr-cact del" onClick={() => delChar(i)}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sidebar */}
                    {tab === 'editor' && (
                        <div className="wr-sidebar">
                            <div className="wr-sb-sec">
                                <span className="wr-sb-lbl">Kitap Bilgileri</span>
                                <input className="wr-sb-inp" type="text" placeholder="Kitap başlığı" value={bookTitle} onChange={e => setBookTitle(e.target.value)} />
                                <select className="wr-sb-sel" value={genre} onChange={e => setGenre(e.target.value)}>
                                    {['Roman', 'Gençlik', 'Fantastik', 'Bilim Kurgu', 'Psikolojik', 'Tarihsel', 'Romantik', 'Gizem', 'Korku', 'Drama', 'Şiir'].map(g => <option key={g}>{g}</option>)}
                                </select>
                                {/* Kitap Kapağı */}
                                <label className="wr-cover-up" htmlFor="cover-file-input" title="Kapak yükle">
                                    {coverUploading
                                        ? <span style={{ fontSize: '.72rem', color: '#8890aa' }}>Yükleniyor…</span>
                                        : coverUrl
                                            ? <img src={coverUrl} alt="Kitap kapağı" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : <>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" /></svg>
                                                <span>Kapak Yükle</span>
                                                <span style={{ fontSize: '.62rem', fontWeight: 400, color: '#b4bacf' }}>256×400 px önerilir</span>
                                            </>
                                    }
                                </label>
                                <input id="cover-file-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} disabled={coverUploading} />
                                {coverUrl && !coverUploading && (
                                    <button
                                        onClick={() => setCoverUrl(null)}
                                        style={{ width: '100%', marginTop: '.35rem', padding: '.3rem', borderRadius: 7, border: '1px solid #dde0e8', background: 'none', fontSize: '.71rem', color: '#8890aa', cursor: 'pointer', fontFamily: 'inherit', transition: 'color .2s' }}
                                        onMouseOver={e => (e.currentTarget.style.color = '#c0392b')}
                                        onMouseOut={e => (e.currentTarget.style.color = '#8890aa')}
                                    >
                                        Kapağı Kaldır
                                    </button>
                                )}
                            </div>
                            <div className="wr-sb-sec">
                                <span className="wr-sb-lbl">Bölüm Bilgileri</span>
                                <input className="wr-sb-inp" type="number" placeholder="Bölüm No" value={chapNo} min={1} onChange={e => setChapNo(Number(e.target.value))} />
                                <input className="wr-sb-inp" type="text" placeholder="Bölüm başlığı" value={chapTitle} onChange={e => setChapTitle(e.target.value)} />
                                <select className="wr-sb-sel" value={status} onChange={e => setStatus(e.target.value)}>
                                    <option>Taslak</option><option>İncelemede</option><option>Yayında</option>
                                </select>
                            </div>
                            <div className="wr-sb-sec">
                                <span className="wr-sb-lbl">Yayın Ayarları</span>
                                <div className="wr-tgl-row">
                                    <span className="wr-tgl-lbl">Yorum Açık</span>
                                    <label className="wr-tgl"><input type="checkbox" checked={commentOpen} onChange={() => setCommentOpen(p => !p)} /><span className="wr-tgl-sl" /></label>
                                </div>
                                <div className="wr-tgl-row">
                                    <span className="wr-tgl-lbl">Zamanlanmış Yayın</span>
                                    <label className="wr-tgl"><input type="checkbox" checked={scheduledPub} onChange={() => setScheduledPub(p => !p)} /><span className="wr-tgl-sl" /></label>
                                </div>
                                {scheduledPub && <input className="wr-sb-inp" type="datetime-local" />}
                            </div>
                            <div className="wr-sb-sec">
                                <span className="wr-sb-lbl">Bu Bölüm</span>
                                <div className="wr-stgrid">
                                    <div className="wr-stbox"><div className="wr-stnum">{words}</div><div className="wr-stlbl">Kelime</div></div>
                                    <div className="wr-stbox"><div className="wr-stnum">{chars2}</div><div className="wr-stlbl">Karakter</div></div>
                                    <div className="wr-stbox"><div className="wr-stnum">{paras}</div><div className="wr-stlbl">Paragraf</div></div>
                                    <div className="wr-stbox"><div className="wr-stnum">{readMin}</div><div className="wr-stlbl">dk Okuma</div></div>
                                </div>
                            </div>
                            <div className="wr-sb-sec">
                                <span className="wr-sb-lbl">Yazarlık Notu</span>
                                <textarea className="wr-sb-ta" placeholder="Okuyucuya gösterilmeyecek kişisel notlar…" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Karakter Modal */}
            {charModal && (
                <div className="wr-modal" onClick={e => { if (e.target === e.currentTarget) setCharModal(false) }}>
                    <div className="wr-mbox">
                        <div className="wr-mhd">
                            <span className="wr-mtitle">{editIdx === -1 ? 'Yeni Karakter' : 'Karakteri Düzenle'}</span>
                            <button className="wr-mx" onClick={() => setCharModal(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="wr-mbody">
                            <label className="wr-ava-up">
                                {mPhoto
                                    ? <img src={mPhoto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" /></svg><span>Fotoğraf</span></>}
                                <input type="file" accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 2 }}
                                    onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setMPhoto(ev.target?.result as string); r.readAsDataURL(f) }} />
                            </label>
                            <div className="wr-mfields">
                                <div><label className="wr-mlbl">İsim *</label><input className="wr-minp" value={mName} onChange={e => setMName(e.target.value)} placeholder="Karakterin adı" /></div>
                                <div><label className="wr-mlbl">Rol</label><select className="wr-msel" value={mRole} onChange={e => setMRole(e.target.value)}><option value="main">Baş Karakter</option><option value="side">Yardımcı Karakter</option><option value="villain">Antagonist</option><option value="other">Diğer</option></select></div>
                                <div><label className="wr-mlbl">Yaş / Konum</label><input className="wr-minp" value={mAge} onChange={e => setMAge(e.target.value)} placeholder="örn. 28 yaş · İstanbul" /></div>
                                <div><label className="wr-mlbl">Kısa Açıklama</label><textarea className="wr-mta" value={mDesc} onChange={e => setMDesc(e.target.value)} placeholder="Kim? Ne ister? Ne korkuyor?" /></div>
                            </div>
                        </div>
                        <div className="wr-mft">
                            <button className="wr-mbtn wr-mbtn-gh" onClick={() => setCharModal(false)}>İptal</button>
                            <button className="wr-mbtn wr-mbtn-pr" onClick={saveChar}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Yayınla Modal */}
            {pubModal && (
                <div className="wr-modal" onClick={e => { if (e.target === e.currentTarget) setPubModal(false) }}>
                    <div className="wr-mbox">
                        <div className="wr-mhd">
                            <span className="wr-mtitle">Bölümü Yayınla</span>
                            <button className="wr-mx" onClick={() => setPubModal(false)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                            <div><label className="wr-mlbl">Kitap Başlığı *</label><input className="wr-minp" value={bookTitle} onChange={e => setBookTitle(e.target.value)} placeholder="Kitabının adı" /></div>
                            <div><label className="wr-mlbl">Bölüm Başlığı *</label><input className="wr-minp" value={chapTitle} onChange={e => setChapTitle(e.target.value)} placeholder="Bu bölümün başlığı" /></div>
                            <div><label className="wr-mlbl">Okuyuculara Not <span style={{ color: '#8890aa', fontWeight: 400 }}>(isteğe bağlı)</span></label><textarea className="wr-mta" value={pubNote} onChange={e => setPubNote(e.target.value)} placeholder="Bu bölüm hakkında bir şey paylaşmak ister misin?" /></div>
                            <div style={{ background: '#e8eaf0', borderRadius: 10, padding: '.9rem 1rem', fontSize: '.79rem', color: '#434961', lineHeight: 1.75 }}>
                                <strong style={{ display: 'block', fontSize: '.77rem', color: '#8890aa', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: '.4rem' }}>Yayınlamadan önce kontrol et</strong>
                                <ul style={{ marginLeft: '1.1rem' }}>
                                    <li>Yazım ve noktalama hataları</li>
                                    <li>Bölüm akışı ve tutarlılık</li>
                                    <li>Karakter adlarının tutarlılığı</li>
                                </ul>
                            </div>
                        </div>
                        <div className="wr-mft">
                            <button className="wr-mbtn wr-mbtn-gh" onClick={() => setPubModal(false)}>İptal</button>
                            <button className="wr-mbtn wr-mbtn-pr" onClick={publish}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" style={{ width: 14, height: 14 }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
                                Yayınla
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <div className="wr-toast">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    {toast}
                </div>
            )}
        </>
    )
}

export default function WritePage() {
    return (
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', fontFamily: "'Nunito Sans',sans-serif" }}>Yükleniyor...</div>}>
            <WritePageContent />
        </Suspense>
    )
}
