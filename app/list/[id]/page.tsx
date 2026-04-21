import { supabase } from '@/lib/supabase'
import ReadingListClient from './ReadingListClient'

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('reading_lists')
      .select('id')
    return (data || []).map((row: any) => ({
      id: row.id,
    }))
  } catch {
    return []
  }
}

export default function ListPage({ params }: { params: { id: string } }) {
  return <ReadingListClient listId={params.id} />
}
