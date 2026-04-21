import { supabase } from '@/lib/supabase'
import ReadingListClient from './ReadingListClient'

export async function generateStaticParams() {
  const { data } = await supabase
    .from('reading_lists')
    .select('id')

  return (data || []).map((row: any) => ({
    id: row.id,
  }))
}

export default function ListPage({ params }: { params: { id: string } }) {
  return <ReadingListClient listId={params.id} />
}
