'use client'

import React, { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database.types'

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

interface ConversationModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  sessionType: 'internal' | 'public'
  companyId: string
  highlightedMessageId?: string
  allFeedbackMessages?: Array<{
    id: string
    sessionId: string
    sessionType: 'internal' | 'public'
  }>
  currentMessageIndex?: number
  onNavigateToMessage?: (messageId: string, sessionId: string, sessionType: 'internal' | 'public') => void
}

export default function ConversationModal({
  isOpen,
  onClose,
  sessionId,
  sessionType,
  companyId,
  highlightedMessageId,
  allFeedbackMessages = [],
  currentMessageIndex = 0,
  onNavigateToMessage
}: ConversationModalProps) {
  const [session, setSession] = useState<ChatSession | PublicChatSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchConversation()
    }
  }, [isOpen, sessionId, sessionType])

  const fetchConversation = async () => {
    try {
      setLoading(true)
      setError(null)

      if (sessionType === 'internal') {
        const { data, error } = await supabase
          .from('chat_sessions')
          .select(`
            *,
            chat_messages (*)
          `)
          .eq('id', sessionId)
          .eq('company_id', companyId)
          .single()

        if (error) {
          setError('Erreur lors du chargement de la conversation interne')
          return
        }

        setSession(data as ChatSession)
      } else {
        const { data, error } = await supabase
          .from('public_chat_sessions')
          .select(`
            *,
            public_chat_messages (*)
          `)
          .eq('id', sessionId)
          .eq('company_id', companyId)
          .single()

        if (error) {
          setError('Erreur lors du chargement de la conversation publique')
          return
        }

        setSession(data as PublicChatSession)
      }
    } catch (err) {
      setError('Erreur lors du chargement de la conversation')
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

  const getMessages = () => {
    if (!session) return []
    return sessionType === 'internal' 
      ? (session as ChatSession).chat_messages 
      : (session as PublicChatSession).public_chat_messages
  }

  const handlePreviousMessage = () => {
    if (currentMessageIndex > 0 && onNavigateToMessage) {
      const prevMessage = allFeedbackMessages[currentMessageIndex - 1]
      onNavigateToMessage(prevMessage.id, prevMessage.sessionId, prevMessage.sessionType)
    }
  }

  const handleNextMessage = () => {
    if (currentMessageIndex < allFeedbackMessages.length - 1 && onNavigateToMessage) {
      const nextMessage = allFeedbackMessages[currentMessageIndex + 1]
      onNavigateToMessage(nextMessage.id, nextMessage.sessionId, nextMessage.sessionType)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    sessionType === 'internal' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {sessionType === 'internal' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {session?.title || 'Chargement...'}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {sessionType === 'internal' ? 'Dashboard Interne' : 'Chatbot Externe'} • 
                      {session?.created_at && formatDate(session.created_at)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {/* Boutons de navigation */}
                  {allFeedbackMessages.length > 1 && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={handlePreviousMessage}
                        disabled={currentMessageIndex === 0}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          currentMessageIndex === 0
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="Message précédent"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <span className="text-sm text-slate-500 px-2">
                        {currentMessageIndex + 1} / {allFeedbackMessages.length}
                      </span>
                      
                      <button
                        onClick={handleNextMessage}
                        disabled={currentMessageIndex === allFeedbackMessages.length - 1}
                        className={`p-2 rounded-lg transition-colors duration-200 ${
                          currentMessageIndex === allFeedbackMessages.length - 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        title="Message suivant"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
          </div>

          {/* Content */}
          <div className="bg-white">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3 text-slate-600">
                  <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Chargement de la conversation...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="text-red-500 mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-600 font-medium">{error}</p>
                  <button
                    onClick={fetchConversation}
                    className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="p-6 space-y-4">
                  {getMessages().map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          message.role === 'user'
                            ? sessionType === 'internal'
                              ? 'bg-blue-600 text-white'
                              : 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        } ${
                          highlightedMessageId === message.id 
                            ? 'ring-2 ring-yellow-400 ring-opacity-50' 
                            : ''
                        }`}
                      >
                        <div className="text-xs opacity-75 mb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1">
                              {message.role === 'user' ? (
                                <span className="flex items-center space-x-1">
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  <span>{sessionType === 'internal' ? 'Utilisateur' : 'Visiteur'}</span>
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

          {/* Footer */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {getMessages().length} message{getMessages().length > 1 ? 's' : ''} dans cette conversation
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
