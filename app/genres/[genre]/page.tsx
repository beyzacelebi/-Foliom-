import { supabase } from '@/lib/supabase'
import GenrePageClient from './GenrePageClient'

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('stories')
      .select('genre')
      .eq('is_published', true)
    const genres = [...new Set(
      (data || [])
        .map((s: any) => s.genre)
        .filter(Boolean)
    )]
    return genres.map((genre) => ({
      genre: encodeURIComponent(genre),
    }))
  } catch {
    return []
  }
}

export default function GenrePage({ params }: { params: { genre: string } }) {
  return <GenrePageClient genre={decodeURIComponent(params.genre)} />
}
