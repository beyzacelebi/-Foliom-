'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { supabase } from '@/lib/supabase'
import './story.css'

interface Story {
    id: string
    title: string
    genre: string | null
    description: string | null
    cover_url: string | null
    view_count: number
    author_id: string
    is_published: boolean
    status: string | null
    created_at: string
    tags: string[] | null
}

interface Chapter {
    id: string
    story_id: string
    chapter_num: number
    title: string
    word_count: number
    is_published: boolean
    created_at: string
}

interface AuthorProfile {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
}

interface StoryCharacter {
    id: string
    name: string
    role: string
    age: string | null
    description: string | null
    color: string
}

interface Comment {
    id: string
    user_id: string
    content: string
    created_at: string
    profiles: { display_name: string | null; username: string | null } | null
}

function fmt(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return String(n)
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtWords(n: number) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K kelime'
    return n + ' kelime'
}

const GRAD_PAIRS = [
    ['#1a2e5a', '#3a0e20'], ['#0d2a1a', '#1a3a10'], ['#0d1e3a', '#0d3020'],
    ['#1a2a10', '#102010'], ['#1a1040', '#3a1060'], ['#2a1800', '#402808'],
]

export default function StoryDetailClient({ storyId }: { storyId: string }) {
    const router = useRouter()

    const [story, setStory] = useState<Story | null>(null)
    const [chapters, setChapters] = useState<Chapter[]>([])
    const [author, setAuthor] = useState<AuthorProfile | null>(null)
    const [characters, setCharacters] = useState<StoryCharacter[]>([])
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)

    const [activeTab, setActiveTab] = useState<'hakkinda' | 'bolumler' | 'yorumlar' | 'karakterler'>('hakkinda')
    const [saved, setSaved] = useState(false)
    const [following, setFollowing] = useState(false)
    const [descExpanded, setDescExpanded] = useState(false)
    const [userRating, setUserRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [avgRating, setAvgRating] = useState<number | null>(null)
    const [ratingCount, setRatingCount] = useState(0)
    const [commentText, setCommentText] = useState('')
    const [comments, setComments] = useState<Comment[]>([])
    const [commentSending, setCommentSending] = useState(false)
    const [toast, setToast] = useState<string | null>(null)

    const [showListModal, setShowListModal] = useState(false)
    const [readingLists, setReadingLists] = useState<{ id: string; name: string }[]>([])
    const [savingToList, setSavingToList] = useState<string | null>(null)

    function showToast(msg: string, type: 'success' | 'warn' = 'success') {
        setToast(msg)
        setTimeout(() => setToast(null), 2500)
    }

    useEffect(() => {
        if (!storyId) return
            ; (async () => {
                const { data: storyData, error: storyErr } = await supabase
                    .from('stories')
                    .select('*')
                    .eq('id', storyId)
                    .eq('is_published', true)
                    .single()

                if (storyErr || !storyData) { setNotFound(true); setLoading(false); return }
                setStory(storyData as Story)

                const { data: chapsData } = await supabase
                    .from('chapters')
                    .select('id,story_id,chapter_num,title,word_count,is_published,created_at')
                    .eq('story_id', storyId)
                    .eq('is_published', true)
                    .order('chapter_num', { ascending: true })
                setChapters(chapsData || [])

                try {
                    const { data: profileData, error: profileErr } = await supabase
                        .from('profiles')
                        .select('id,display_name,username,avatar_url')
                        .eq('id', storyData.author_id)
                        .single()
                    setAuthor(profileErr || !profileData
                        ? { id: storyData.author_id, display_name: null, username: storyData.author_id.slice(0, 8), avatar_url: null }
                        : profileData as AuthorProfile)
                } catch {
                    setAuthor({ id: storyData.author_id, display_name: null, username: null, avatar_url: null })
                }

                const { data: charsData } = await supabase
                    .from('story_characters')
                    .select('id,name,role,age,description,color')
                    .eq('story_id', storyId)
                    .order('created_at', { ascending: true })
                setCharacters(charsData || [])

                const { data: commentsData } = await supabase
                    .from('story_comments')
                    .select('id, user_id, content, created_at, profiles(display_name, username)')
                    .eq('story_id', storyId)
                    .order('created_at', { ascending: false })
                setComments((commentsData || []) as unknown as Comment[])

                const { data: ratingsData } = await supabase
                    .from('ratings').select('score').eq('story_id', storyId)
                if (ratingsData && ratingsData.length > 0) {
                    const sum = ratingsData.reduce((acc: number, r: any) => acc + r.score, 0)
                    setAvgRating(Math.round((sum / ratingsData.length) * 10) / 10)
                    setRatingCount(ratingsData.length)
                }

                const { data: { user: currentUser } } = await supabase.auth.getUser()
                if (currentUser) {
                    setCurrentUserId(currentUser.id)
                    const { data: favData } = await supabase
                        .from('favorites')
                        .select('user_id')
                        .eq('user_id', currentUser.id)
                        .eq('story_id', storyId)
                        .maybeSingle()
                    setSaved(!!favData)
                    if (storyData.author_id && currentUser.id !== storyData.author_id) {
                        const { data: followData } = await supabase
                            .from('follows')
                            .select('follower_id')
                            .eq('follower_id', currentUser.id)
                            .eq('following_id', storyData.author_id)
                            .maybeSingle()
                        setFollowing(!!followData)
                    }
                    const { data: ratingData } = await supabase
                        .from('ratings').select('score')
                        .eq('story_id', storyId).eq('user_id', currentUser.id).maybeSingle()
                    if (ratingData) setUserRating(ratingData.score)

                    const { data: lists } = await supabase
                        .from('reading_lists')
                        .select('id, name')
                        .eq('user_id', currentUser.id)
                        .order('created_at', { ascending: false })
                    if (lists) setReadingLists(lists)
                }

                await supabase
                    .from('stories')
                    .update({ view_count: (storyData.view_count || 0) + 1 })
                    .eq('id', storyId)

                setLoading(false)
            })()
    }, [storyId])

    async function toggleSave() {
        if (!currentUserId) { router.push('/auth'); return }
        if (saved) {
            const { error } = await supabase.from('favorites').delete().eq('story_id', storyId).eq('user_id', currentUserId)
            if (error) { showToast('Bir hata olustu, tekrar dene'); return }
            setSaved(false)
            showToast('Kitapliktan kaldirildi')
        } else {
            const { error } = await supabase.from('favorites').insert({ story_id: storyId, user_id: currentUserId })
            if (error) {
                if (error.code === '23505') { setSaved(true); showToast('Zaten kitapliginda') }
                else showToast('Bir hata olustu, tekrar dene')
                return
            }
            setSaved(true)
            showToast('Kitapligina eklendi')
        }
    }

    async function addToList(listId: string) {
        if (!currentUserId || !storyId) return
        setSavingToList(listId)
        const { error } = await supabase
            .from('reading_list_items')
            .insert({ list_id: listId, story_id: storyId })
        setSavingToList(null)

        if (error) {
            if (error.code === '23505') showToast('Kitap zaten bu listede', 'warn')
            else showToast('Listeye eklenirken bir hata olustu', 'warn')
        } else {
            showToast('Listeye Eklendi')
            setShowListModal(false)
        }
    }

    function handleShare() {
        if (navigator.share) {
            navigator.share({ title: story?.title || 'Foliom', url: location.href })
        } else {
            navigator.clipboard.writeText(location.href)
            showToast('Baglanti kopyalandi!')
        }
    }

    async function sendComment() {
        if (!commentText.trim()) return
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { showToast('Yorum yapmak icin giris yapmalisin'); return }
        setCommentSending(true)
        const { data: inserted, error } = await supabase
            .from('story_comments')
            .insert({ story_id: storyId, user_id: user.id, content: commentText.trim() })
            .select('id, user_id, content, created_at, profiles(display_name, username)')
            .single()
        if (error) { showToast('Yorum gonderilemedi'); setCommentSending(false); return }
        setComments(prev => [inserted as unknown as Comment, ...prev])
        setCommentText('')
        showToast('Yorum gonderildi!')
        setCommentSending(false)
        if (story && user.id !== story.author_id) {
            await supabase.from('notifications').insert({
                recipient_id: story.author_id, sender_id: user.id,
                type: 'comment', story_id: storyId,
            })
        }
    }

    const authorInitial = author?.display_name?.[0] || author?.username?.[0] || '?'
    const authorName = author?.display_name || author?.username || 'Bilinmiyor'
    const coverGrad = 'linear-gradient(135deg,' + GRAD_PAIRS[0][0] + ',' + GRAD_PAIRS[0][1] + ')'

    if (loading) {
        return (
            <>
                <NavBar />
                <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.2rem', color: '#8890aa' }}>
                        Yukleniyor
                    </span>
                </div>
            </>
        )
    }

    if (notFound || !story) {
        return (
            <>
                <NavBar />
                <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2rem', fontWeight: 700 }}>Kitap bulunamadi</span>
                    <button onClick={() => router.back()} style={{ padding: '.55rem 1.2rem', borderRadius: 8, background: '#2e4f91', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Geri Don</button>
                </div>
            </>
        )
    }

    return (
        <>
            <NavBar />

            <div className="book-hero">
                <div
                    className="book-hero-bg"
                    style={story.cover_url
                        ? { backgroundImage: 'url(' + story.cover_url + ')' }
                        : { background: coverGrad }
                    }
                />
                <div className="book-hero-overlay" />
                <div className="book-hero-inner">
                    <div className="book-cover-wrap">
                        <div className="book-cover">
                            {story.cover_url ? (
                                <img src={story.cover_url} alt={story.title} className="book-cover-img" />
                            ) : (
                                <div className="book-cover-inner" style={{ background: coverGrad }}>
                                    <div className="cover-t">{story.title}</div>
                                    {authorName !== 'Bilinmiyor' && <div className="cover-a">{authorName}</div>}
                                </div>
                            )}
                        </div>
                        {story.view_count > 5000 && (
                            <div className="book-cover-badge">TREND</div>
                        )}
                    </div>

                    <div className="book-info">
                        {story.genre && (
                            <div className="book-genre-tag">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                </svg>
                                {story.genre}
                            </div>
                        )}
                        <h1 className="book-title">{story.title}</h1>
                        <p className="book-author">
                            <span onClick={() => router.push('/profile/' + author?.id)}>@{author?.username || authorName}</span> tarafından
                        </p>
                        <div className="book-stats">
                            <div className="book-stat">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                                <strong>{fmt(story.view_count)}</strong> okuma
                            </div>
                            <div className="book-stat">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                </svg>
                                <strong>{chapters.length}</strong> bolum
                            </div>
                        </div>
                        <div className="book-actions">
                            {chapters.length > 0 && (
                                <button
                                    className="btn-read"
                                    onClick={() => router.push('/reader?chapter=' + chapters[0].id + '&story=' + storyId)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                    </svg>
                                    Okumaya Basla
                                </button>
                            )}
                            {currentUserId === story.author_id && (
                                <button className="btn-read" style={{ background: 'var(--surface)', color: 'var(--navy2)', border: '1.5px solid var(--navy-lt)' }} onClick={() => router.push('/write?story=' + story.id)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Yeni Bolum Ekle
                                </button>
                            )}
                            <button className={'btn-save' + (saved ? ' saved' : '')} onClick={toggleSave}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill={saved ? 'white' : 'none'} viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                </svg>
                                {saved ? 'Kitaplikta' : 'Kitapligima Ekle'}
                            </button>
                            <button className="btn-save" onClick={() => { if (!currentUserId) { router.push('/auth'); return } setShowListModal(true) }} title="Listeye Ekle">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                </svg>
                            </button>
                            <button className="btn-save" onClick={handleShare} title="Paylas">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="book-body">
                <div>
                    <div className="book-tabs">
                        {(['hakkinda', 'bolumler', 'yorumlar', 'karakterler'] as const).map(tab => (
                            <button
                                key={tab}
                                className={'book-tab' + (activeTab === tab ? ' active' : '')}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'hakkinda' && 'Hakkinda'}
                                {tab === 'bolumler' && 'Bolumler (' + chapters.length + ')'}
                                {tab === 'yorumlar' && 'Yorumlar'}
                                {tab === 'karakterler' && 'Karakterler (' + characters.length + ')'}
                            </button>
                        ))}
                    </div>

                    <div className={'tab-panel' + (activeTab === 'hakkinda' ? ' active' : '')}>
                        {story.description ? (
                            <>
                                <p className="book-desc">
                                    {descExpanded ? story.description : story.description.slice(0, 220) + (story.description.length > 220 ? '...' : '')}
                                </p>
                                {story.description.length > 220 && (
                                    <button className="btn-more" onClick={() => setDescExpanded(e => !e)}>
                                        {descExpanded ? 'Daha Az Goster' : 'Devamini Oku'}
                                    </button>
                                )}
                            </>
                        ) : (
                            <p className="book-desc" style={{ color: 'var(--ink4)', fontStyle: 'italic' }}>
                                Bu kitap icin henuz bir aciklama eklenmemis.
                            </p>
                        )}

                        {story.tags && story.tags.length > 0 && (
                            <div className="book-tags">
                                {story.tags.map(tag => (
                                    <span key={tag} className="book-tag">#{tag}</span>
                                ))}
                            </div>
                        )}

                        <div style={{ height: '1.5rem' }} />
                        <div style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--ink2)', marginBottom: '.8rem' }}>
                            Bu hikayeyi puanla
                        </div>
                        <div className="rating-wrap">
                            {[1, 2, 3, 4, 5].map(n => (
                                <button
                                    key={n}
                                    className={'star-btn' + ((hoverRating || userRating) >= n ? ' on' : '')}
                                    onMouseEnter={() => setHoverRating(n)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={async () => {
                                        if (!currentUserId) { showToast('Puan vermek icin giris yapmalisin'); return }
                                        setUserRating(n)
                                        const { error } = await supabase.from('ratings').upsert(
                                            { user_id: currentUserId, story_id: storyId, score: n },
                                            { onConflict: 'user_id,story_id' }
                                        )
                                        if (error) { showToast('Puan kaydedilemedi'); return }
                                        const { data: rd } = await supabase.from('ratings').select('score').eq('story_id', storyId)
                                        if (rd && rd.length > 0) {
                                            const sum = rd.reduce((a: number, r: any) => a + r.score, 0)
                                            setAvgRating(Math.round((sum / rd.length) * 10) / 10)
                                            setRatingCount(rd.length)
                                        }
                                        showToast(n + ' yildiz verildi!')
                                        if (story && currentUserId !== story.author_id) {
                                            await supabase.from('notifications').insert({
                                                recipient_id: story.author_id, sender_id: currentUserId,
                                                type: 'rating', story_id: storyId,
                                            })
                                        }
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill={(hoverRating || userRating) >= n ? '#e6a817' : 'none'} viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={'tab-panel' + (activeTab === 'bolumler' ? ' active' : '')}>
                        {chapters.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink4)', fontSize: '.88rem' }}>
                                Henuz yayinlanmis bolum yok.
                            </div>
                        ) : (
                            <div className="chapter-list">
                                {chapters.map(ch => (
                                    <div
                                        key={ch.id}
                                        className="chapter-item"
                                        onClick={() => router.push('/reader?chapter=' + ch.id + '&story=' + storyId)}
                                    >
                                        <div className="chapter-num">{ch.chapter_num}</div>
                                        <div className="chapter-meta">
                                            <div className="chapter-name">{ch.title}</div>
                                            <div className="chapter-date">{fmtDate(ch.created_at)}</div>
                                        </div>
                                        {ch.word_count > 0 && (
                                            <div className="chapter-words">{fmtWords(ch.word_count)}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={'tab-panel' + (activeTab === 'karakterler' ? ' active' : '')}>
                        {characters.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink4)', fontSize: '.88rem' }}>
                                Bu kitap icin henuz karakter eklenmemis.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem', paddingTop: '.5rem' }}>
                                {characters.map(ch => {
                                    const roleLabel: Record<string, string> = { main: 'Bas Karakter', side: 'Yardimci', villain: 'Antagonist', other: 'Diger' }
                                    const roleBg: Record<string, string> = { main: 'rgba(46,79,145,.1)', side: 'rgba(143,36,72,.09)', villain: 'rgba(90,15,15,.1)', other: '#e8eaf0' }
                                    const roleColor: Record<string, string> = { main: '#2e4f91', side: '#8f2448', villain: '#7a1a1a', other: '#8890aa' }
                                    return (
                                        <div key={ch.id} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14, padding: '1.1rem', display: 'flex', gap: '.85rem', alignItems: 'flex-start' }}>
                                            <div style={{ width: 52, height: 52, borderRadius: 12, background: ch.color || '#2e4f91', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                                                {ch.name[0]}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <span style={{ display: 'inline-block', fontSize: '.62rem', fontWeight: 800, letterSpacing: '.5px', textTransform: 'uppercase', padding: '.14rem .55rem', borderRadius: 20, marginBottom: '.35rem', background: roleBg[ch.role] || '#e8eaf0', color: roleColor[ch.role] || '#8890aa' }}>
                                                    {roleLabel[ch.role] || ch.role}
                                                </span>
                                                <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.2rem', color: 'var(--ink)' }}>{ch.name}</div>
                                                {ch.age && <div style={{ fontSize: '.73rem', color: 'var(--ink3)', marginBottom: '.3rem' }}>{ch.age} yas</div>}
                                                {ch.description && <div style={{ fontSize: '.78rem', color: 'var(--ink2)', lineHeight: 1.6 }}>{ch.description}</div>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div className={'tab-panel' + (activeTab === 'yorumlar' ? ' active' : '')}>
                        <div className="comment-form">
                            <textarea
                                className="comment-textarea"
                                placeholder="Bu hikaye hakkinda ne dusunuyorsun?"
                                value={commentText}
                                onChange={e => setCommentText(e.target.value)}
                            />
                            <div className="comment-form-row">
                                <button className="btn-comment" onClick={sendComment} disabled={commentSending || !commentText.trim()} style={{ opacity: commentSending || !commentText.trim() ? 0.6 : 1 }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                    </svg>
                                    {commentSending ? 'Gonderiliyor' : 'Yorum Yap'}
                                </button>
                            </div>
                        </div>
                        {comments.length === 0 ? (
                            <div className="comments-empty">Henuz yorum yapilmamis. Ilk yorumu sen yap!</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                                {comments.map(c => {
                                    const name = c.profiles?.display_name || c.profiles?.username || 'Anonim'
                                    const initial = name[0]?.toUpperCase() || '?'
                                    return (
                                        <div key={c.id} style={{ display: 'flex', gap: '.75rem', padding: '.9rem 1rem', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10 }}>
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--navy2),var(--crimson2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                                {initial}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--navy2)', marginBottom: '.25rem' }}>{name}</div>
                                                <div style={{ fontSize: '.85rem', color: 'var(--ink2)', lineHeight: 1.6 }}>{c.content}</div>
                                                <div style={{ fontSize: '.7rem', color: 'var(--ink4)', marginTop: '.3rem' }}>
                                                    {new Date(c.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <aside className="book-sidebar">
                    <div className="sidebar-card">
                        <div className="sidebar-title">Yazar</div>
                        <div className="author-card">
                            <div className="author-avatar">
                                {author?.avatar_url
                                    ? <img src={author.avatar_url} alt={authorName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>{authorInitial}</span>
                                }
                            </div>
                            <div>
                                <div className="author-name">{authorName}</div>
                                <div className="author-meta">
                                    {author?.username ? '@' + author.username : 'Yazar'}
                                </div>
                            </div>
                        </div>
                        {currentUserId && currentUserId !== story.author_id && (
                            <button
                                className={'btn-follow' + (following ? ' following' : '')}
                                onClick={async () => {
                                    if (following) {
                                        await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', story.author_id)
                                        setFollowing(false)
                                        showToast('Takipten cikaldi')
                                    } else {
                                        const { error } = await supabase.from('follows').insert({ follower_id: currentUserId, following_id: story.author_id })
                                        if (!error) {
                                            setFollowing(true); showToast('Takip edildi')
                                            await supabase.from('notifications').insert({
                                                recipient_id: story.author_id, sender_id: currentUserId,
                                                type: 'follow', story_id: null,
                                            })
                                        } else { showToast('Bir hata olustu') }
                                    }
                                }}
                            >
                                {following ? 'Takip Ediliyor' : 'Takip Et'}
                            </button>
                        )}
                    </div>

                    <div className="sidebar-card">
                        <div className="sidebar-title">Istatistikler</div>
                        <div className="stats-grid">
                            <div className="stat-box">
                                <div className="stat-box-val">{fmt(story.view_count)}</div>
                                <div className="stat-box-lbl">Okuma</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-box-val">{chapters.length}</div>
                                <div className="stat-box-lbl">Bolum</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-box-val" style={{ color: '#e6a817' }}>
                                    {avgRating !== null ? avgRating + ' yildiz' : '-'}
                                </div>
                                <div className="stat-box-lbl">{ratingCount > 0 ? ratingCount + ' Oy' : 'Puan'}</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-box-val">{story.status === 'completed' ? 'Tam' : 'Devam'}</div>
                                <div className="stat-box-lbl">Durum</div>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-card">
                        <div className="sidebar-title">Benzer Hikayeler</div>
                        <div style={{ fontSize: '.78rem', color: 'var(--ink4)', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
                            Benzer hikayeler yakinda burada gorunecek.
                        </div>
                    </div>
                </aside>
            </div>

            <footer style={{ textAlign: 'center', padding: '1.2rem', fontSize: '.75rem', color: 'var(--ink4)', borderTop: '1px solid var(--line)' }}>
                2026 Foliom. Tum haklari saklidir.
            </footer>

            <div className={'modal-back' + (showListModal ? ' open' : '')}>
                <div className="modal">
                    <div className="modal-hd">
                        <span className="modal-title">Okuma Listesine Ekle</span>
                        <button className="modal-close" onClick={() => setShowListModal(false)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="modal-body">
                        {readingLists.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--ink3)', fontSize: '.88rem', padding: '1rem 0' }}>
                                Henuz okuma listeniz bulunmuyor.
                                <span onClick={() => router.push('/profile')} style={{ color: 'var(--navy3)', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', marginTop: '.4rem', display: 'inline-block' }}>Profilinizden yeni bir liste olusturabilirsiniz.</span>
                            </div>
                        ) : (
                            readingLists.map(l => (
                                <div key={l.id} className="list-select-item" onClick={() => addToList(l.id)}>
                                    <span className="list-select-name">{l.name}</span>
                                    {savingToList === l.id ? (
                                        <span style={{ fontSize: '.75rem', color: 'var(--navy2)', fontWeight: 700 }}>Ekleniyor</span>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16, color: 'var(--ink3)' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {toast && (
                <div className="toast-bar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 15, height: 15, color: '#5de898' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    {toast}
                </div>
            )}
        </>
    )
}
