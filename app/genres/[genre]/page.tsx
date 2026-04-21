import { supabase } from '@/lib/supabase'
import GenrePageClient from './GenrePageClient'

export async function generateStaticParams() {
  const { data } = await supabase
    .from('stories')
    .select('genre')
    .eq('is_published', true)

  // Tüm genre değerlerini al, tekrarları temizle
  const genres = [...new Set(
    (data || [])
      .map(s => s.genre)
      .filter(Boolean)
  )]

  return genres.map((genre) => ({
    genre: encodeURIComponent(genre),
  }))
}

export default function GenrePage({ params }: { params: { genre: string } }) {
  return <GenrePageClient genre={decodeURIComponent(params.genre)} />
}
