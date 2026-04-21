import { supabase } from '@/lib/supabase'
import UserProfileClient from './UserProfileClient'

export async function generateStaticParams() {
  const { data } = await supabase
    .from('profiles')
    .select('id')

  return (data || []).map((row) => ({
    id: row.id,
  }))
}

export default function ProfilePage({ params }: { params: { id: string } }) {
  return <UserProfileClient profileId={params.id} />
}
