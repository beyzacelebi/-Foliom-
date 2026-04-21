import { supabase } from '@/lib/supabase'
import StoryDetailClient from './StoryDetailClient'

export async function generateStaticParams() {
  const { data } = await supabase
    .from('stories')
    .select('id')
    .eq('is_published', true)

  return (data || []).map((row) => ({
    id: row.id,
  }))
}

export default function StoryPage({ params }: { params: { id: string } }) {
  return <StoryDetailClient storyId={params.id} />
}
