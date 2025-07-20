import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import FileManager from '@/components/FileManager'
import StatsCards from '@/components/StatsCards'

export default async function DashboardPage() {
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

  // Récupérer les statistiques
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('company_id', profile.company_id)

  const { data: chatSessions } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('company_id', profile.company_id)

  const stats = {
    totalDocuments: documents?.length || 0,
    processedDocuments: documents?.filter(doc => doc.processed).length || 0,
    totalChats: chatSessions?.length || 0,
    storageUsed: documents?.reduce((total, doc) => total + doc.file_size, 0) || 0
  }

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tableau de bord - {profile.companies?.name}
          </h1>
          <p className="text-gray-600">
            Gérez vos documents et votre chatbot IA
          </p>
        </div>

        <StatsCards stats={stats} />
        <FileManager companyId={profile.company_id} />
      </div>
    </DashboardLayout>
  )
} 