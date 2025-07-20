import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import ChatInterface from '@/components/ChatInterface'

export default async function ChatPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Récupérer le profil utilisateur et l'entreprise
  const { data: profile } = await supabase
    .from('user_profiles')
    .select(`
      *,
      companies (
        id,
        name
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/auth/login')
  }

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="h-[calc(100vh-200px)]">
        <ChatInterface companyId={profile.company_id} />
      </div>
    </DashboardLayout>
  )
} 