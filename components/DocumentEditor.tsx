'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase-provider'
import toast from 'react-hot-toast'
import axios from 'axios'

interface DocumentEditorProps {
  filename: string
  onClose: () => void
  onSave: () => void
}

export default function DocumentEditor({ filename, onClose, onSave }: DocumentEditorProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { supabase } = useSupabase()

  useEffect(() => {
    loadContent()
  }, [filename])

  const loadContent = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Vous devez être connecté')
        return
      }

      const response = await axios.get(
        `/api/rag/document-content?filename=${encodeURIComponent(filename)}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      setContent(response.data.content || '')
      setLoading(false)
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error)
      toast.error('Erreur lors du chargement du document')
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Vous devez être connecté')
        return
      }

      // 1. Sauvegarder le fichier via l'API RAG
      await axios.put(
        `/api/rag/document-content?filename=${encodeURIComponent(filename)}`,
        { content },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // 2. Mettre à jour le updated_at dans Supabase
      const { error: updateError } = await supabase
        .from('documents')
        .update({ updated_at: new Date().toISOString() })
        .eq('name', filename)

      if (updateError) {
        console.error('Erreur lors de la mise à jour du timestamp:', updateError)
        // On ne bloque pas, c'est un warning mineur
      }

      toast.success('Document mis à jour avec succès! L\'index sera reconstruit automatiquement.')
      onSave()
      onClose()
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde du document')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Éditer le document</h2>
            <p className="text-slate-600 text-sm mt-1">{filename}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center space-x-3 text-primary">
                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-lg">Chargement du document...</span>
              </div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full min-h-[500px] px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent resize-none font-mono text-sm"
              placeholder="Contenu du document..."
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
          <div className="text-sm text-slate-600">
            <span className="font-medium">{content.length}</span> caractères
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sauvegarde...</span>
                </>
              ) : (
                <span>Sauvegarder</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

