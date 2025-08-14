'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase-provider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database.types'
import DashboardLayout from '@/components/DashboardLayout'
import StatsChart from '@/components/StatsChart'
import ExportButton from '@/components/ExportButton'
import { redirect } from 'next/navigation'
import toast from 'react-hot-toast'

type ChatSession = Database['public']['Tables']['chat_sessions']['Row'] & {
  chat_messages: Database['public']['Tables']['chat_messages']['Row'][]
}

type PublicChatSession = {
  id: string
  session_id: string
  company_id: string
  external_user_id: string | null
  title: string
  created_at: string
  updated_at: string
  public_chat_messages: PublicChatMessage[]
}

type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
type PublicChatMessage = {
  id: string
  message_id: string
  session_id: string
  content: string
  role: string
  created_at: string
}

interface StatsData {
  // Stats internes (dashboard)
  internal: {
    totalSessions: number
    totalMessages: number
    totalUserMessages: number
    totalAssistantMessages: number
    averageMessagesPerSession: number
    sessionsToday: number
    sessionsThisWeek: number
    sessionsThisMonth: number
    mostActiveUsers: Array<{
      user_id: string
      session_count: number
      message_count: number
    }>
    dailyActivity: Array<{
      date: string
      sessions: number
      messages: number
    }>
  }
  // Stats publiques (chatbot externe)
  public: {
    totalSessions: number
    totalMessages: number
    totalUserMessages: number
    totalAssistantMessages: number
    averageMessagesPerSession: number
    sessionsToday: number
    sessionsThisWeek: number
    sessionsThisMonth: number
    mostActiveExternalUsers: Array<{
      external_user_id: string
      session_count: number
      message_count: number
    }>
    dailyActivity: Array<{
      date: string
      sessions: number
      messages: number
    }>
  }
}

export default function StatsPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statsData, setStatsData] = useState<StatsData | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [publicChatSessions, setPublicChatSessions] = useState<PublicChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [selectedPublicSession, setSelectedPublicSession] = useState<PublicChatSession | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'internal' | 'public'>('internal')
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (profile?.company_id) {
      fetchStatsData()
      fetchChatSessions()
      fetchPublicChatSessions()
    }
  }, [profile])

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        redirect('/auth/login')
        return
      }

      const { data: profileData, error: profileError } = await supabase
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

      if (profileError || !profileData) {
        toast.error('Erreur lors du chargement du profil')
        redirect('/auth/login')
        return
      }

      setUser(user)
      setProfile(profileData)
    } catch (error) {
      console.error('Erreur d\'authentification:', error)
      redirect('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatsData = async () => {
    try {
      if (!profile?.company_id) return

      // Récupérer les sessions internes (dashboard)
      const { data: internalSessions, error: internalError } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          chat_messages (*)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

      // Récupérer les sessions publiques (chatbot externe)
      const { data: publicSessions, error: publicError } = await supabase
        .from('public_chat_sessions')
        .select(`
          *,
          public_chat_messages (*)
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

      if (internalError) {
        console.error('Erreur sessions internes:', internalError)
        return
      }

      if (publicError) {
        console.error('Erreur sessions publiques:', publicError)
        return
      }

      // Calculer les statistiques internes
      const internalStats = calculateInternalStats(internalSessions || [])
      
      // Calculer les statistiques publiques
      const publicStats = calculatePublicStats(publicSessions || [])

      setStatsData({
        internal: internalStats,
        public: publicStats
      })

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
      toast.error('Erreur lors du chargement des statistiques')
    }
  }

  const calculateInternalStats = (sessions: ChatSession[]) => {
    const totalSessions = sessions.length
    const totalMessages = sessions.reduce((sum, session) => sum + session.chat_messages.length, 0)
    const totalUserMessages = sessions.reduce((sum, session) => 
      sum + session.chat_messages.filter((msg) => msg.role === 'user').length, 0)
    const totalAssistantMessages = sessions.reduce((sum, session) => 
      sum + session.chat_messages.filter((msg) => msg.role === 'assistant').length, 0)
    
    const averageMessagesPerSession = totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0

    // Statistiques par période
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const sessionsToday = sessions.filter(s => new Date(s.created_at) >= today).length
    const sessionsThisWeek = sessions.filter(s => new Date(s.created_at) >= thisWeek).length
    const sessionsThisMonth = sessions.filter(s => new Date(s.created_at) >= thisMonth).length

    // Utilisateurs les plus actifs
    const userActivity: { [key: string]: { sessions: number, messages: number } } = {}
    sessions.forEach(session => {
      const userId = session.user_id
      if (!userActivity[userId]) {
        userActivity[userId] = { sessions: 0, messages: 0 }
      }
      userActivity[userId].sessions++
      userActivity[userId].messages += session.chat_messages.length
    })

    const mostActiveUsers = Object.entries(userActivity)
      .map(([user_id, activity]) => ({
        user_id,
        session_count: activity.sessions,
        message_count: activity.messages
      }))
      .sort((a, b) => b.session_count - a.session_count)
      .slice(0, 5)

    // Activité quotidienne des 30 derniers jours
    const dailyActivity: { [key: string]: { sessions: number, messages: number } } = {}
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      dailyActivity[dateStr] = { sessions: 0, messages: 0 }
    }

    sessions.forEach(session => {
      const dateStr = session.created_at.split('T')[0]
      if (dailyActivity[dateStr]) {
        dailyActivity[dateStr].sessions++
        dailyActivity[dateStr].messages += session.chat_messages.length
      }
    })

    const dailyActivityArray = Object.entries(dailyActivity).map(([date, activity]) => ({
      date,
      sessions: activity.sessions,
      messages: activity.messages
    }))

    return {
      totalSessions,
      totalMessages,
      totalUserMessages,
      totalAssistantMessages,
      averageMessagesPerSession,
      sessionsToday,
      sessionsThisWeek,
      sessionsThisMonth,
      mostActiveUsers,
      dailyActivity: dailyActivityArray
    }
  }

  const calculatePublicStats = (sessions: PublicChatSession[]) => {
    const totalSessions = sessions.length
    const totalMessages = sessions.reduce((sum, session) => sum + session.public_chat_messages.length, 0)
    const totalUserMessages = sessions.reduce((sum, session) => 
      sum + session.public_chat_messages.filter((msg) => msg.role === 'user').length, 0)
    const totalAssistantMessages = sessions.reduce((sum, session) => 
      sum + session.public_chat_messages.filter((msg) => msg.role === 'assistant').length, 0)
    
    const averageMessagesPerSession = totalSessions > 0 ? Math.round(totalMessages / totalSessions) : 0

    // Statistiques par période
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const sessionsToday = sessions.filter(s => new Date(s.created_at) >= today).length
    const sessionsThisWeek = sessions.filter(s => new Date(s.created_at) >= thisWeek).length
    const sessionsThisMonth = sessions.filter(s => new Date(s.created_at) >= thisMonth).length

    // Utilisateurs externes les plus actifs
    const userActivity: { [key: string]: { sessions: number, messages: number } } = {}
    sessions.forEach(session => {
      const userId = session.external_user_id || 'Anonyme'
      if (!userActivity[userId]) {
        userActivity[userId] = { sessions: 0, messages: 0 }
      }
      userActivity[userId].sessions++
      userActivity[userId].messages += session.public_chat_messages.length
    })

    const mostActiveExternalUsers = Object.entries(userActivity)
      .map(([external_user_id, activity]) => ({
        external_user_id,
        session_count: activity.sessions,
        message_count: activity.messages
      }))
      .sort((a, b) => b.session_count - a.session_count)
      .slice(0, 5)

    // Activité quotidienne des 30 derniers jours
    const dailyActivity: { [key: string]: { sessions: number, messages: number } } = {}
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      dailyActivity[dateStr] = { sessions: 0, messages: 0 }
    }

    sessions.forEach(session => {
      const dateStr = session.created_at.split('T')[0]
      if (dailyActivity[dateStr]) {
        dailyActivity[dateStr].sessions++
        dailyActivity[dateStr].messages += session.public_chat_messages.length
      }
    })

    const dailyActivityArray = Object.entries(dailyActivity).map(([date, activity]) => ({
      date,
      sessions: activity.sessions,
      messages: activity.messages
    }))

    return {
      totalSessions,
      totalMessages,
      totalUserMessages,
      totalAssistantMessages,
      averageMessagesPerSession,
      sessionsToday,
      sessionsThisWeek,
      sessionsThisMonth,
      mostActiveExternalUsers,
      dailyActivity: dailyActivityArray
    }
  }

  const fetchChatSessions = async () => {
    try {
      if (!profile?.company_id) return

      let query = supabase
        .from('chat_sessions')
        .select(`
          *,
          chat_messages (*)
        `)
        .eq('company_id', profile.company_id)

      if (dateFilter) {
        const startDate = new Date(dateFilter)
        const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
        query = query
          .gte('created_at', startDate.toISOString())
          .lt('created_at', endDate.toISOString())
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur sessions internes:', error)
        return
      }

      setChatSessions(data as ChatSession[] || [])
    } catch (error) {
      console.error('Erreur lors du chargement des sessions internes:', error)
    }
  }

  const fetchPublicChatSessions = async () => {
    try {
      if (!profile?.company_id) return

      let query = supabase
        .from('public_chat_sessions')
        .select(`
          *,
          public_chat_messages (*)
        `)
        .eq('company_id', profile.company_id)

      if (dateFilter) {
        const startDate = new Date(dateFilter)
        const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
        query = query
          .gte('created_at', startDate.toISOString())
          .lt('created_at', endDate.toISOString())
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur sessions publiques:', error)
        return
      }

      setPublicChatSessions(data as PublicChatSession[] || [])
    } catch (error) {
      console.error('Erreur lors du chargement des sessions publiques:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              📈 Statistiques et Historique des Chats
            </h1>
            <p className="text-gray-600 mt-1">
              Analyse des conversations internes et externes pour {profile.companies?.name}
            </p>
          </div>
          <div>
            <ExportButton
              data={{
                sessions: activeTab === 'internal' ? chatSessions : publicChatSessions,
                statsData: statsData,
                companyName: profile.companies?.name || 'entreprise'
              }}
              disabled={!chatSessions || chatSessions.length === 0}
            />
          </div>
        </div>

        {/* Onglets */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'internal'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🏢 Dashboard Interne
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'public'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🌐 Chatbot Externe
          </button>
        </div>

        {/* Cartes de statistiques */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">💬</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Sessions {activeTab === 'internal' ? '(Internes)' : '(Externes)'}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statsData[activeTab].totalSessions}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">📝</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Messages
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statsData[activeTab].totalMessages}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">👥</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Messages Utilisateurs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statsData[activeTab].totalUserMessages}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-2xl">🤖</div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Réponses IA
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {statsData[activeTab].totalAssistantMessages}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques par période */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">📅 Activité par Période</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Aujourd'hui:</span>
                  <span className="font-medium">{statsData[activeTab].sessionsToday} sessions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cette semaine:</span>
                  <span className="font-medium">{statsData[activeTab].sessionsThisWeek} sessions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ce mois:</span>
                  <span className="font-medium">{statsData[activeTab].sessionsThisMonth} sessions</span>
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="text-gray-600">Moyenne messages/session:</span>
                  <span className="font-medium">{statsData[activeTab].averageMessagesPerSession}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                👥 {activeTab === 'internal' ? 'Utilisateurs' : 'Utilisateurs Externes'} les Plus Actifs
              </h3>
              <div className="space-y-3">
                {(activeTab === 'internal' 
                  ? statsData.internal.mostActiveUsers 
                  : statsData.public.mostActiveExternalUsers
                ).map((user: any, index: number) => (
                  <div key={user.user_id || user.external_user_id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm bg-gray-100 rounded-full px-2 py-1 mr-3">
                        #{index + 1}
                      </span>
                      <span className="text-gray-600 text-sm">
                        {activeTab === 'internal' 
                          ? (user.user_id ? user.user_id.substring(0, 8) + '...' : 'Inconnu')
                          : (user.external_user_id || 'Anonyme')
                        }
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{user.session_count} sessions</div>
                      <div className="text-xs text-gray-500">{user.message_count} messages</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Graphiques d'activité */}
        {statsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatsChart
              data={statsData[activeTab].dailyActivity}
              title={`📊 Sessions quotidiennes ${activeTab === 'internal' ? '(Internes)' : '(Externes)'}`}
              type="sessions"
            />
            <StatsChart
              data={statsData[activeTab].dailyActivity}
              title={`💬 Messages quotidiens ${activeTab === 'internal' ? '(Internes)' : '(Externes)'}`}
              type="messages"
            />
          </div>
        )}

        {/* Historique des conversations */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              📋 Historique des Conversations {activeTab === 'internal' ? '(Dashboard Interne)' : '(Chatbot Externe)'}
            </h3>
            
            {/* Filtres */}
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher par titre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => {
                  if (activeTab === 'internal') {
                    fetchChatSessions()
                  } else {
                    fetchPublicChatSessions()
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Filtrer
              </button>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setDateFilter('')
                  if (activeTab === 'internal') {
                    fetchChatSessions()
                  } else {
                    fetchPublicChatSessions()
                  }
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Réinitialiser
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {/* Sessions internes */}
            {activeTab === 'internal' && chatSessions.map((session) => (
              <div key={session.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{session.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(session.created_at)} • {session.chat_messages.length} messages
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        🏢 Dashboard
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
                    className="ml-4 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    {selectedSession?.id === session.id ? 'Masquer' : 'Voir détails'}
                  </button>
                </div>

                {/* Détails de la conversation interne */}
                {selectedSession?.id === session.id && (
                  <div className="mt-4 border-t pt-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {session.chat_messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="text-xs opacity-75 mb-1">
                              {message.role === 'user' ? '👤 Utilisateur' : '🤖 Assistant'} • 
                              {formatDate(message.created_at)}
                            </div>
                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Sessions publiques */}
            {activeTab === 'public' && publicChatSessions.map((session) => (
              <div key={session.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{session.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(session.created_at)} • {session.public_chat_messages.length} messages
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        🌐 Externe
                      </span>
                      {session.external_user_id && (
                        <span className="ml-2 text-xs text-gray-400">
                          User: {session.external_user_id}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPublicSession(selectedPublicSession?.id === session.id ? null : session)}
                    className="ml-4 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                  >
                    {selectedPublicSession?.id === session.id ? 'Masquer' : 'Voir détails'}
                  </button>
                </div>

                {/* Détails de la conversation publique */}
                {selectedPublicSession?.id === session.id && (
                  <div className="mt-4 border-t pt-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {session.public_chat_messages.map((message: PublicChatMessage) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <div className="text-xs opacity-75 mb-1">
                              {message.role === 'user' ? '👤 Visiteur' : '🤖 Assistant'} • 
                              {formatDate(message.created_at)}
                            </div>
                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {((activeTab === 'internal' && chatSessions.length === 0) || (activeTab === 'public' && publicChatSessions.length === 0)) && (
            <div className="p-6 text-center text-gray-500">
              Aucune conversation {activeTab === 'internal' ? 'interne' : 'externe'} trouvée pour les critères sélectionnés.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
