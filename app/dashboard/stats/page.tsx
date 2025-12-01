'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase-provider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database.types'
import DashboardLayout from '@/components/DashboardLayout'
import StatsChart from '@/components/StatsChart'
import FeedbackChart from '@/components/FeedbackChart'
import FeedbackTab from '@/components/FeedbackTab'
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
  manual_response: boolean | null
  messenger: boolean
  created_at: string
  updated_at: string
  public_chat_messages: PublicChatMessage[]
}

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'] & {
  user_feedback?: 'like' | 'dislike' | null
  feedback_timestamp?: string | null
}
type PublicChatMessage = {
  id: string
  message_id: string
  session_id: string
  content: string
  role: string
  user_feedback?: 'like' | 'dislike' | null
  feedback_timestamp?: string | null
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
    // Statistiques de feedback
    feedback: {
      totalLikes: number
      totalDislikes: number
      totalFeedback: number
      feedbackRate: number
      likeRate: number
      dislikeRate: number
      feedbackTrend: Array<{
        date: string
        likes: number
        dislikes: number
      }>
    }
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
    // Statistiques de feedback
    feedback: {
      totalLikes: number
      totalDislikes: number
      totalFeedback: number
      feedbackRate: number
      likeRate: number
      dislikeRate: number
      feedbackTrend: Array<{
        date: string
        likes: number
        dislikes: number
      }>
    }
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
  const [activeTab, setActiveTab] = useState<'internal' | 'public' | 'feedback'>('internal')
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

  const decryptMessages = async (messages: any[]): Promise<any[]> => {
    try {
      const response = await fetch('/api/decrypt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      })

      if (!response.ok) {
        console.error('Erreur lors du décryptage:', response.statusText)
        return messages // Retourner les messages originaux en cas d'erreur
      }

      const data = await response.json()
      return data.messages || messages
    } catch (error) {
      console.error('Erreur lors du décryptage des messages:', error)
      return messages // Retourner les messages originaux en cas d'erreur
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

    // Calculer les statistiques de feedback
    const totalLikes = sessions.reduce((sum, session) => 
      sum + session.chat_messages.filter((msg) => (msg as any).user_feedback === 'like').length, 0)
    const totalDislikes = sessions.reduce((sum, session) => 
      sum + session.chat_messages.filter((msg) => (msg as any).user_feedback === 'dislike').length, 0)
    const totalFeedback = totalLikes + totalDislikes
    const feedbackRate = totalAssistantMessages > 0 ? Math.round((totalFeedback / totalAssistantMessages) * 100) : 0
    const likeRate = totalFeedback > 0 ? Math.round((totalLikes / totalFeedback) * 100) : 0
    const dislikeRate = totalFeedback > 0 ? Math.round((totalDislikes / totalFeedback) * 100) : 0

    // Tendance des feedbacks par jour
    const feedbackTrend: { [key: string]: { likes: number, dislikes: number } } = {}
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      feedbackTrend[dateStr] = { likes: 0, dislikes: 0 }
    }

    sessions.forEach(session => {
      const dateStr = session.created_at.split('T')[0]
      if (feedbackTrend[dateStr]) {
        session.chat_messages.forEach(msg => {
          if ((msg as any).user_feedback === 'like') {
            feedbackTrend[dateStr].likes++
          } else if ((msg as any).user_feedback === 'dislike') {
            feedbackTrend[dateStr].dislikes++
          }
        })
      }
    })

    const feedbackTrendArray = Object.entries(feedbackTrend).map(([date, feedback]) => ({
      date,
      likes: feedback.likes,
      dislikes: feedback.dislikes
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
      dailyActivity: dailyActivityArray,
      feedback: {
        totalLikes,
        totalDislikes,
        totalFeedback,
        feedbackRate,
        likeRate,
        dislikeRate,
        feedbackTrend: feedbackTrendArray
      }
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

    // Calculer les statistiques de feedback pour les sessions publiques
    const totalLikes = sessions.reduce((sum, session) => 
      sum + session.public_chat_messages.filter((msg) => (msg as any).user_feedback === 'like').length, 0)
    const totalDislikes = sessions.reduce((sum, session) => 
      sum + session.public_chat_messages.filter((msg) => (msg as any).user_feedback === 'dislike').length, 0)
    const totalFeedback = totalLikes + totalDislikes
    const feedbackRate = totalAssistantMessages > 0 ? Math.round((totalFeedback / totalAssistantMessages) * 100) : 0
    const likeRate = totalFeedback > 0 ? Math.round((totalLikes / totalFeedback) * 100) : 0
    const dislikeRate = totalFeedback > 0 ? Math.round((totalDislikes / totalFeedback) * 100) : 0

    // Tendance des feedbacks par jour pour les sessions publiques
    const feedbackTrend: { [key: string]: { likes: number, dislikes: number } } = {}
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      feedbackTrend[dateStr] = { likes: 0, dislikes: 0 }
    }

    sessions.forEach(session => {
      const dateStr = session.created_at.split('T')[0]
      if (feedbackTrend[dateStr]) {
        session.public_chat_messages.forEach(msg => {
          if ((msg as any).user_feedback === 'like') {
            feedbackTrend[dateStr].likes++
          } else if ((msg as any).user_feedback === 'dislike') {
            feedbackTrend[dateStr].dislikes++
          }
        })
      }
    })

    const feedbackTrendArray = Object.entries(feedbackTrend).map(([date, feedback]) => ({
      date,
      likes: feedback.likes,
      dislikes: feedback.dislikes
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
      dailyActivity: dailyActivityArray,
      feedback: {
        totalLikes,
        totalDislikes,
        totalFeedback,
        feedbackRate,
        likeRate,
        dislikeRate,
        feedbackTrend: feedbackTrendArray
      }
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

      // Décrypter les messages
      if (data && data.length > 0) {
        const sessionsWithDecryptedMessages = await Promise.all(
          data.map(async (session: any) => {
            if (session.chat_messages && session.chat_messages.length > 0) {
              const decryptedMessages = await decryptMessages(session.chat_messages)
              return {
                ...session,
                chat_messages: decryptedMessages
              }
            }
            return session
          })
        )
        setChatSessions(sessionsWithDecryptedMessages as ChatSession[])
      } else {
        setChatSessions(data as ChatSession[] || [])
      }
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
        query = query.or(`title.ilike.%${searchTerm}%,session_id.ilike.%${searchTerm}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Erreur sessions publiques:', error)
        return
      }

      // Décrypter les messages
      if (data && data.length > 0) {
        const sessionsWithDecryptedMessages = await Promise.all(
          data.map(async (session: any) => {
            if (session.public_chat_messages && session.public_chat_messages.length > 0) {
              const decryptedMessages = await decryptMessages(session.public_chat_messages)
              return {
                ...session,
                public_chat_messages: decryptedMessages
              }
            }
            return session
          })
        )
        setPublicChatSessions(sessionsWithDecryptedMessages as PublicChatSession[])
      } else {
        setPublicChatSessions(data as PublicChatSession[] || [])
      }
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

  const toggleManualResponse = async (sessionId: string, currentValue: boolean | null) => {
    try {
      // Si manual_response est null ou false, on passe à true (désactiver l'auto IA)
      // Si manual_response est true, on passe à false (activer l'auto IA)
      const newValue = currentValue === true ? false : true

      const { error } = await supabase
        .from('public_chat_sessions')
        .update({ manual_response: newValue })
        .eq('id', sessionId)

      if (error) {
        console.error('Erreur lors de la mise à jour:', error)
        toast.error('Erreur lors de la mise à jour du statut')
        return
      }

      // Mettre à jour l'état local
      setPublicChatSessions(prev => 
        prev.map(session => 
          session.id === sessionId 
            ? { ...session, manual_response: newValue }
            : session
        )
      )

      toast.success(`Réponse automatique ${newValue === false ? 'activée' : 'désactivée'}`)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-4 text-slate-600">
          <svg className="animate-spin h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xl font-medium">Chargement des statistiques...</span>
        </div>
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Statistiques et Historique des Chats
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
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
        <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'internal'
                ? 'bg-white text-primary shadow-lg'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Dashboard Interne</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'public'
                ? 'bg-white text-primary shadow-lg'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              <span>Chatbot Externe</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'feedback'
                ? 'bg-white text-primary shadow-lg'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>Feedbacks</span>
            </span>
          </button>
        </div>

        {/* Contenu conditionnel selon l'onglet actif */}
        {activeTab === 'feedback' ? (
          <FeedbackTab companyId={profile.company_id} />
        ) : (
          <>
            {/* Cartes de statistiques */}
            {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a8.841 8.841 0 01-4.255-.949L3 20l1.338-3.123C2.493 12.767 2 11.434 2 10c0-4.418 4.03-8 9-8s9 3.134 9 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-slate-600 truncate">
                    Total Sessions {activeTab === 'internal' ? '(Internes)' : '(Externes)'}
                  </dt>
                  <dd className="text-2xl font-bold text-slate-900 mt-1">
                    {statsData[activeTab].totalSessions}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-slate-600 truncate">
                    Total Messages
                  </dt>
                  <dd className="text-2xl font-bold text-slate-900 mt-1">
                    {statsData[activeTab].totalMessages}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-slate-600 truncate">
                    Messages Utilisateurs
                  </dt>
                  <dd className="text-2xl font-bold text-slate-900 mt-1">
                    {statsData[activeTab].totalUserMessages}
                  </dd>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <dt className="text-sm font-medium text-slate-600 truncate">
                    Réponses IA
                  </dt>
                  <dd className="text-2xl font-bold text-slate-900 mt-1">
                    {statsData[activeTab].totalAssistantMessages}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Statistiques par période */}
        {statsData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Activité par Période</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 font-medium">Aujourd'hui:</span>
                  <span className="text-lg font-bold text-slate-900">{statsData[activeTab].sessionsToday} sessions</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 font-medium">Cette semaine:</span>
                  <span className="text-lg font-bold text-slate-900">{statsData[activeTab].sessionsThisWeek} sessions</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600 font-medium">Ce mois:</span>
                  <span className="text-lg font-bold text-slate-900">{statsData[activeTab].sessionsThisMonth} sessions</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-xl border border-primary/20">
                  <span className="text-slate-700 font-medium">Moyenne messages/session:</span>
                  <span className="text-lg font-bold text-primary">{statsData[activeTab].averageMessagesPerSession}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20 md:col-span-3">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {activeTab === 'internal' ? 'Utilisateurs' : 'Utilisateurs Externes'} les Plus Actifs
                </h3>
              </div>
              <div className="space-y-4">
                {(activeTab === 'internal' 
                  ? statsData.internal.mostActiveUsers 
                  : statsData.public.mostActiveExternalUsers
                ).map((user: any, index: number) => (
                  <div key={user.user_id || user.external_user_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white' :
                        index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        #{index + 1}
                      </span>
                      <div>
                        <span className="text-slate-900 font-medium">
                          {activeTab === 'internal' 
                            ? (user.user_id ? user.user_id.substring(0, 8) + '...' : 'Inconnu')
                            : (user.external_user_id || 'Anonyme')
                          }
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900">{user.session_count} sessions</div>
                      <div className="text-xs text-slate-500">{user.message_count} messages</div>
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
              title={`Sessions quotidiennes ${activeTab === 'internal' ? '(Internes)' : '(Externes)'}`}
              type="sessions"
            />
            <StatsChart
              data={statsData[activeTab].dailyActivity}
              title={`Messages quotidiens ${activeTab === 'internal' ? '(Internes)' : '(Externes)'}`}
              type="messages"
            />
          </div>
        )}


        {/* Historique des conversations */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
          <div className="px-6 py-6 border-b border-slate-200/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-slate-500 to-slate-600 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Historique des Conversations {activeTab === 'internal' ? '(Dashboard Interne)' : '(Chatbot Externe)'}
              </h3>
            </div>
            
            {/* Filtres */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher par titre ou session_id..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  if (activeTab === 'internal') {
                    fetchChatSessions()
                  } else {
                    fetchPublicChatSessions()
                  }
                }}
                className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L6.293 13.293A1 1 0 016 12.586V6z" />
                  </svg>
                  <span>Filtrer</span>
                </span>
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
                className="px-6 py-3 bg-slate-600 text-white font-semibold rounded-xl hover:bg-slate-700 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Réinitialiser</span>
                </span>
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
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Dashboard
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
                      {session.chat_messages
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((message) => (
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
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                  {message.role === 'user' ? (
                                    <span className="flex items-center space-x-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span>Utilisateur</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center space-x-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                      </svg>
                                      <span>Assistant</span>
                                    </span>
                                  )}
                                  <span>•</span>
                                  <span>{formatDate(message.created_at)}</span>
                                </div>
                                
                                {/* Indicateur de feedback pour les messages d'assistant */}
                                {message.role === 'assistant' && (message as any).user_feedback && (
                                  <div className="flex items-center space-x-1">
                                    {(message as any).user_feedback === 'like' ? (
                                      <div className="flex items-center space-x-1 text-green-600">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                        </svg>
                                        <span className="text-xs font-medium">Liked</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1 text-red-600">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 0110.737 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                        </svg>
                                        <span className="text-xs font-medium">Disliked</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
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
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">{session.title}</h4>
                      {/* Indicateur Messenger */}
                      {session.messenger && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V9h2v4zm4 4h-2v-2h2v2zm0-4h-2V9h2v4z"/>
                          </svg>
                          Messenger
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(session.created_at)} • {session.public_chat_messages.length} messages
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Externe
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        ID: {session.session_id}
                      </span>
                      {session.external_user_id && (
                        <span className="ml-2 text-xs text-gray-400">
                          User: {session.external_user_id}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* Toggle On/Off pour manual_response */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 font-medium">Auto IA:</span>
                      <button
                        onClick={() => toggleManualResponse(session.id, session.manual_response)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          session.manual_response === true 
                            ? 'bg-gray-200' 
                            : 'bg-primary'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            session.manual_response === true ? 'translate-x-1' : 'translate-x-6'
                          }`}
                        />
                      </button>
                      <span className={`text-xs font-medium ${
                        session.manual_response === true ? 'text-gray-500' : 'text-primary'
                      }`}>
                        {session.manual_response === true ? 'OFF' : 'ON'}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedPublicSession(selectedPublicSession?.id === session.id ? null : session)}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                    >
                      {selectedPublicSession?.id === session.id ? 'Masquer' : 'Voir détails'}
                    </button>
                  </div>
                </div>

                {/* Détails de la conversation publique */}
                {selectedPublicSession?.id === session.id && (
                  <div className="mt-4 border-t pt-4">
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {session.public_chat_messages
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                        .map((message: PublicChatMessage) => (
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
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                  {message.role === 'user' ? (
                                    <span className="flex items-center space-x-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                      <span>Visiteur</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center space-x-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                      </svg>
                                      <span>Assistant</span>
                                    </span>
                                  )}
                                  <span>•</span>
                                  <span>{formatDate(message.created_at)}</span>
                                </div>
                                
                                {/* Indicateur de feedback pour les messages d'assistant */}
                                {message.role === 'assistant' && (message as any).user_feedback && (
                                  <div className="flex items-center space-x-1">
                                    {(message as any).user_feedback === 'like' ? (
                                      <div className="flex items-center space-x-1 text-green-600">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                        </svg>
                                        <span className="text-xs font-medium">Liked</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center space-x-1 text-red-600">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 0110.737 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                        </svg>
                                        <span className="text-xs font-medium">Disliked</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
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
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
