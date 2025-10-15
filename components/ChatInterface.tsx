'use client'

import { useState, useEffect, useRef } from 'react'
import { useSupabase } from '@/lib/supabase-provider'
import toast from 'react-hot-toast'
// axios n'est plus utilisé, on passe en fetch + SSE

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
}

interface ChatSession {
  id: string
  title: string
  created_at: string
}

interface ChatInterfaceProps {
  companyId: string
}

export default function ChatInterface({ companyId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSessions, setLoadingSessions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { supabase, user } = useSupabase()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erreur lors du chargement des sessions')
    } else {
      setSessions(data || [])
      if (data && data.length > 0 && !currentSession) {
        setCurrentSession(data[0].id)
      }
    }
    setLoadingSessions(false)
  }

  const loadMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      toast.error('Erreur lors du chargement des messages')
    } else {
      setMessages(data || [])
    }
  }

  useEffect(() => {
    loadSessions()
  }, [companyId])

  useEffect(() => {
    if (currentSession) {
      loadMessages(currentSession)
    }
  }, [currentSession])

  const createNewSession = async () => {
    if (!user) return

    const sessionTitle = `Conversation ${new Date().toLocaleDateString('fr-FR')}`
    
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert({
        company_id: companyId,
        user_id: user.id,
        title: sessionTitle
      })
      .select()
      .single()

    if (error) {
      toast.error('Erreur lors de la création de la session')
    } else {
      setSessions(prev => [data, ...prev])
      setCurrentSession(data.id)
      setMessages([])
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentSession || !user) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    // Ajouter le message utilisateur
    const { error: userError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: currentSession,
        content: userMessage,
        role: 'user'
      })

    if (userError) {
      toast.error('Erreur lors de l\'envoi du message')
      setLoading(false)
      return
    }

    // Mettre à jour l'interface
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: userMessage,
      role: 'user',
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, newUserMessage])

    try {
      // Ajouter un message assistant temporaire pour le streaming
      const assistantTempId = `assistant-${Date.now().toString()}`
      const tempAssistant: Message = {
        id: assistantTempId,
        content: '',
        role: 'assistant',
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, tempAssistant])

      // Appel SSE vers notre proxy ask_public, en envoyant company_id
      const response = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: userMessage,
          company_id: companyId
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const contentType = response.headers.get('content-type') || ''
      let assistantText = ''

      if (contentType.includes('text/event-stream') && response.body) {
        // Parsing SSE
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          // Découper par évènements SSE (séparés par \n\n)
          const events = buffer.split('\n\n')
          buffer = events.pop() || ''

          for (const evt of events) {
            const lines = evt.split('\n')
            for (const line of lines) {
              if (line.startsWith('data:')) {
                const raw = line.slice(5).trim()
                if (raw === '[DONE]') {
                  continue
                }
                let parsedAnswer: string | null = null
                try {
                  const payload = JSON.parse(raw)
                  if (payload && typeof payload === 'object' && typeof payload.answer === 'string') {
                    parsedAnswer = payload.answer
                  }
                } catch {
                  // non-JSON chunk, fallback to raw append
                }
                if (parsedAnswer !== null) {
                  assistantText = parsedAnswer
                } else {
                  assistantText += raw
                }
                // Mise à jour incrémentale du message assistant
                setMessages(prev => prev.map(m => m.id === assistantTempId ? { ...m, content: assistantText } : m))
              }
            }
          }
        }
      } else {
        // Réponse JSON classique
        const json = await response.json().catch(() => null)
        const text = json && typeof json.answer === 'string' ? json.answer : ''
        assistantText = text
        setMessages(prev => prev.map(m => m.id === assistantTempId ? { ...m, content: assistantText || 'Désolé, je n\'ai pas pu traiter votre demande.' } : m))
      }

      // Sauvegarder la réponse finale dans Supabase
      if (assistantText.trim().length > 0) {
        const { error: assistantError } = await supabase
          .from('chat_messages')
          .insert({
            session_id: currentSession,
            content: assistantText,
            role: 'assistant'
          })
        if (assistantError) {
          toast.error('Erreur lors de la sauvegarde de la réponse')
        }
      } else {
        // Si pas de texte reçu, indiquer une erreur à l'utilisateur
        setMessages(prev => prev.map(m => m.id === assistantTempId ? { ...m, content: 'Désolé, je n\'ai pas pu traiter votre demande.' } : m))
      }

    } catch (error: any) {
      console.error('Chat error:', error)
      
      let errorMessage = 'Désolé, une erreur est survenue.'
      
      if (error.response?.status === 403) {
        errorMessage = 'Accès refusé. Vérifiez vos permissions.'
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentification requise. Veuillez vous reconnecter.'
      } else if (error.response?.status === 404) {
        errorMessage = 'Service non disponible. Vérifiez que votre backend RAG est en cours d\'exécution.'
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage = 'Impossible de joindre le backend RAG. Vérifiez qu\'il est démarré sur le port 8000.'
      }
      
      toast.error(errorMessage)
      
      // Ajouter un message d'erreur pour l'utilisateur
      const errorMessageObj: Message = {
        id: (Date.now() + 1).toString(),
        content: errorMessage,
        role: 'assistant',
        created_at: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessageObj])
    }

    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loadingSessions) {
    return <div className="text-center py-8">Chargement...</div>
  }

  return (
    <div className="flex h-full bg-white rounded-lg shadow">
      {/* Sidebar des sessions */}
      <div className="w-64 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewSession}
            className="btn-primary w-full"
          >
            + Nouvelle conversation
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => setCurrentSession(session.id)}
              className={`w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 ${
                currentSession === session.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
              }`}
            >
              <div className="font-medium text-sm text-gray-900 truncate">
                {session.title}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(session.created_at).toLocaleDateString('fr-FR')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col">
        {currentSession ? (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <div className="text-4xl mb-4">🤖</div>
                  <p className="text-lg">Posez-moi une question sur vos documents !</p>
                  <p className="text-sm">Je peux vous aider à trouver des informations spécifiques.</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="text-sm">Assistant réfléchit...</div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex space-x-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tapez votre message..."
                  className="input flex-1 resize-none"
                  rows={1}
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !inputMessage.trim()}
                  className="btn-primary px-6"
                >
                  {loading ? '...' : 'Envoyer'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <p>Sélectionnez ou créez une conversation pour commencer</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 