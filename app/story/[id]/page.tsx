import { supabase } from '@/lib/supabase'
import StoryDetailClient from './StoryDetailClient'

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('stories')
      .select('id')
      .eq('is_published', true)
    return (data || []).map((row: any) => ({
      id: row.id,
    }))
  } catch {
    return []
  }
}

export default function StoryPage({ params }: { params: { id: string } }) {
  return <StoryDetailClient storyId={params.id} />
}
