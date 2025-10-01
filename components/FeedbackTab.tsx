'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database.types'
import ConversationModal from './ConversationModal'

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

type ChatSession = Database['public']['Tables']['chat_sessions']['Row'] & {
  chat_messages: ChatMessage[]
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

interface FeedbackTabProps {
  companyId: string
}

export default function FeedbackTab({ companyId }: FeedbackTabProps) {
  const [internalSessions, setInternalSessions] = useState<ChatSession[]>([])
  const [publicSessions, setPublicSessions] = useState<PublicChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'like' | 'dislike'>('all')
  const [sessionFilter, setSessionFilter] = useState<'all' | 'internal' | 'public'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<{
    sessionId: string
    sessionType: 'internal' | 'public'
    messageId: string
  } | null>(null)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    fetchFeedbackData()
  }, [companyId])

  const fetchFeedbackData = async () => {
    try {
      setLoading(true)

      // Récupérer les sessions internes avec feedbacks
      const { data: internalData, error: internalError } = await supabase
        .from('chat_sessions')
        .select(`
          *,
          chat_messages (*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      // Récupérer les sessions publiques avec feedbacks
      const { data: publicData, error: publicError } = await supabase
        .from('public_chat_sessions')
        .select(`
          *,
          public_chat_messages (*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (internalError) {
        console.error('Erreur sessions internes:', internalError)
      } else {
        setInternalSessions(internalData as ChatSession[] || [])
      }

      if (publicError) {
        console.error('Erreur sessions publiques:', publicError)
      } else {
        setPublicSessions(publicData as PublicChatSession[] || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des feedbacks:', error)
    } finally {
      setLoading(false)
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

  const handleMessageClick = (message: {
    id: string
    content: string
    role: string
    feedback: 'like' | 'dislike'
    feedbackTimestamp: string | null
    sessionTitle: string
    sessionType: 'internal' | 'public'
    sessionId: string
    createdAt: string
  }) => {
    const allMessages = getAllFeedbackMessages()
    const messageIndex = allMessages.findIndex(m => m.id === message.id)
    
    setSelectedMessage({
      sessionId: message.sessionId,
      sessionType: message.sessionType,
      messageId: message.id
    })
    setCurrentMessageIndex(messageIndex)
    setModalOpen(true)
  }

  const handleNavigateToMessage = (messageId: string, sessionId: string, sessionType: 'internal' | 'public') => {
    const allMessages = getAllFeedbackMessages()
    const messageIndex = allMessages.findIndex(m => m.id === messageId)
    
    setSelectedMessage({
      sessionId,
      sessionType,
      messageId
    })
    setCurrentMessageIndex(messageIndex)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedMessage(null)
  }

  // Collecter tous les messages avec feedback
  const getAllFeedbackMessages = () => {
    const allMessages: Array<{
      id: string
      content: string
      role: string
      feedback: 'like' | 'dislike'
      feedbackTimestamp: string | null
      sessionTitle: string
      sessionType: 'internal' | 'public'
      sessionId: string
      createdAt: string
    }> = []

    // Messages internes avec feedback
    internalSessions.forEach(session => {
      session.chat_messages.forEach(msg => {
        if ((msg as any).user_feedback) {
          allMessages.push({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            feedback: (msg as any).user_feedback,
            feedbackTimestamp: (msg as any).feedback_timestamp,
            sessionTitle: session.title,
            sessionType: 'internal',
            sessionId: session.id,
            createdAt: msg.created_at
          })
        }
      })
    })

    // Messages publics avec feedback
    publicSessions.forEach(session => {
      session.public_chat_messages.forEach(msg => {
        if ((msg as any).user_feedback) {
          allMessages.push({
            id: msg.id,
            content: msg.content,
            role: msg.role,
            feedback: (msg as any).user_feedback,
            feedbackTimestamp: (msg as any).feedback_timestamp,
            sessionTitle: session.title,
            sessionType: 'public',
            sessionId: session.id,
            createdAt: msg.created_at
          })
        }
      })
    })

    return allMessages
  }

  const filteredMessages = getAllFeedbackMessages().filter(msg => {
    // Filtre par type de feedback
    if (feedbackFilter !== 'all' && msg.feedback !== feedbackFilter) {
      return false
    }

    // Filtre par type de session
    if (sessionFilter !== 'all' && msg.sessionType !== sessionFilter) {
      return false
    }

    // Filtre par terme de recherche
    if (searchTerm && !msg.content.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !msg.sessionTitle.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Filtre par date
    if (dateFilter) {
      const messageDate = new Date(msg.createdAt).toISOString().split('T')[0]
      if (messageDate !== dateFilter) {
        return false
      }
    }

    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-4 text-slate-600">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg font-medium">Chargement des feedbacks...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Analyse des Feedbacks</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Total Likes</p>
                <p className="text-2xl font-bold text-green-700">
                  {getAllFeedbackMessages().filter(m => m.feedback === 'like').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 0110.737 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Total Dislikes</p>
                <p className="text-2xl font-bold text-red-700">
                  {getAllFeedbackMessages().filter(m => m.feedback === 'dislike').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Sessions Internes</p>
                <p className="text-2xl font-bold text-blue-700">
                  {getAllFeedbackMessages().filter(m => m.sessionType === 'internal').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Sessions Publiques</p>
                <p className="text-2xl font-bold text-purple-700">
                  {getAllFeedbackMessages().filter(m => m.sessionType === 'public').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/20">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher dans les messages ou sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={feedbackFilter}
              onChange={(e) => setFeedbackFilter(e.target.value as 'all' | 'like' | 'dislike')}
              className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            >
              <option value="all">Tous les feedbacks</option>
              <option value="like">Likes uniquement</option>
              <option value="dislike">Dislikes uniquement</option>
            </select>

            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value as 'all' | 'internal' | 'public')}
              className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            >
              <option value="all">Toutes les sessions</option>
              <option value="internal">Dashboard Interne</option>
              <option value="public">Chatbot Externe</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
            />
          </div>
        </div>
      </div>

      {/* Liste des messages avec feedback */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20">
        <div className="px-6 py-6 border-b border-slate-200/50">
          <h3 className="text-lg font-semibold text-slate-900">
            Messages avec Feedback ({filteredMessages.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredMessages.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              Aucun message avec feedback trouvé pour les critères sélectionnés.
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div 
                key={message.id} 
                className="p-6 hover:bg-slate-50 transition-colors duration-200 cursor-pointer border-l-4 border-transparent hover:border-primary/30"
                onClick={() => handleMessageClick(message)}
              >
                <div className="flex items-start space-x-4">
                  {/* Indicateur de feedback */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    message.feedback === 'like' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {message.feedback === 'like' ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 0110.737 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          message.sessionType === 'internal'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {message.sessionType === 'internal' ? 'Dashboard' : 'Externe'}
                        </span>
                        <span className="text-sm text-slate-500">
                          {formatDate(message.createdAt)}
                        </span>
                        {message.feedbackTimestamp && (
                          <span className="text-xs text-slate-400">
                            Feedback: {formatDate(message.feedbackTimestamp)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-slate-900">
                          Session: {message.sessionTitle}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Cliquer pour voir la conversation</span>
                        </div>
                      </div>
                      <div className={`inline-block px-3 py-1 rounded-lg text-sm ${
                        message.role === 'user'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {message.content.length > 200 
                          ? `${message.content.substring(0, 200)}...` 
                          : message.content
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de conversation */}
      {selectedMessage && (
        <ConversationModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          sessionId={selectedMessage.sessionId}
          sessionType={selectedMessage.sessionType}
          companyId={companyId}
          highlightedMessageId={selectedMessage.messageId}
          allFeedbackMessages={getAllFeedbackMessages().map(m => ({
            id: m.id,
            sessionId: m.sessionId,
            sessionType: m.sessionType
          }))}
          currentMessageIndex={currentMessageIndex}
          onNavigateToMessage={handleNavigateToMessage}
        />
      )}
    </div>
  )
}
