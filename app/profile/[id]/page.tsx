import { supabase } from '@/lib/supabase'
import UserProfileClient from './UserProfileClient'

export async function generateStaticParams() {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('id')
    return (data || []).map((row: any) => ({
      id: row.id,
    }))
  } catch {
    return []
  }
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  return <UserProfileClient profileId={params.id} />
}
