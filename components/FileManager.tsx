'use client'

import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useSupabase } from '@/lib/supabase-provider'
import toast from 'react-hot-toast'
import axios from 'axios'
import DocumentEditor from './DocumentEditor'
import PDFViewer from './PDFViewer'

interface Document {
  id: string
  name: string
  file_path: string
  file_size: number
  mime_type: string
  processed: boolean
  created_at: string
}

interface FileManagerProps {
  companyId: string
}

export default function FileManager({ companyId }: FileManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [editingDocument, setEditingDocument] = useState<string | null>(null)
  const [viewingDocument, setViewingDocument] = useState<string | null>(null)
  const { supabase } = useSupabase()

  const loadDocuments = async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Erreur lors du chargement des documents')
    } else {
      setDocuments(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDocuments()
  }, [companyId])

  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true)

    for (const file of acceptedFiles) {
      try {
        // Récupérer le token JWT Supabase
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          toast.error('Vous devez être connecté pour uploader des fichiers')
          continue
        }

        // Upload vers le backend RAG avec authentification
        const formData = new FormData()
        formData.append('file', file)

        const response = await axios.post(
          '/api/rag/upload',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          }
        )

        if (response.data.message) {
          // Enregistrer dans la base de données
          const { error } = await supabase.from('documents').insert({
            name: file.name,
            file_path: response.data.file_path || file.name,
            file_size: file.size,
            mime_type: file.type,
            company_id: companyId,
            uploaded_by: (await supabase.auth.getUser()).data.user?.id,
            processed: false
          })

          if (error) {
            toast.error(`Erreur lors de l'enregistrement de ${file.name}`)
          } else {
            toast.success(`${file.name} uploadé avec succès`)
          }
        }
      } catch (error: any) {
        if (error.response?.status === 403) {
          toast.error(`Accès refusé pour ${file.name}. Vérifiez vos permissions.`)
        } else if (error.response?.status === 401) {
          toast.error(`Authentification requise pour ${file.name}`)
        } else {
          toast.error(`Erreur lors de l'upload de ${file.name}`)
        }
        console.error('Upload error:', error)
      }
    }

    setUploading(false)
    loadDocuments()
  }

  const buildIndex = async () => {
    setProcessing(true)
    try {
      // Récupérer le token JWT Supabase
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Vous devez être connecté pour construire l\'index')
        setProcessing(false)
        return
      }

      const response = await axios.post(
        '/api/rag/build_index',
        {}, // Le backend récupère automatiquement le company_id depuis le token
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data.message) {
        // Marquer tous les documents comme traités
        const { error } = await supabase
          .from('documents')
          .update({ processed: true })
          .eq('company_id', companyId)

        if (error) {
          toast.error('Erreur lors de la mise à jour du statut')
        } else {
          toast.success('Index construit avec succès!')
          loadDocuments()
        }
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Accès refusé. Vérifiez vos permissions.')
      } else if (error.response?.status === 401) {
        toast.error('Authentification requise')
      } else {
        toast.error('Erreur lors de la construction de l\'index')
      }
      console.error('Build index error:', error)
    }
    setProcessing(false)
  }

  const downloadDocument = async (filename: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Vous devez être connecté')
        return
      }

      toast.loading('Téléchargement en cours...', { id: 'download' })

      const response = await fetch(
        `/api/rag/document-download?filename=${encodeURIComponent(filename)}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement')
      }

      // Créer un blob et déclencher le téléchargement
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Document téléchargé avec succès', { id: 'download' })
    } catch (error: any) {
      console.error('Erreur lors du téléchargement:', error)
      toast.error('Erreur lors du téléchargement', { id: 'download' })
    }
  }

  const deleteDocument = async (docId: string, filePath: string) => {
    try {
      // D'abord, récupérer le nom du fichier depuis le chemin
      const document = documents.find(doc => doc.id === docId)
      if (!document) {
        toast.error('Document non trouvé')
        return
      }

      const filename = document.name

      // 1. Supprimer le fichier physique du serveur RAG
      const { data: session } = await supabase.auth.getSession()
      if (!session.session) {
        toast.error('Session expirée')
        return
      }

      try {
        const ragResponse = await axios.delete(
          `/api/rag/delete?filename=${encodeURIComponent(filename)}`,
          {
            headers: {
              'Authorization': `Bearer ${session.session.access_token}`
            }
          }
        )

        if (ragResponse.status !== 200) {
          throw new Error('Erreur lors de la suppression du fichier physique')
        }

        toast.success('Fichier physique supprimé du serveur')
      } catch (ragError: any) {
        console.error('Erreur RAG:', ragError)
        if (ragError.response?.status === 404) {
          // Le fichier n'existe pas côté RAG, on continue quand même
          toast('Fichier déjà absent du serveur RAG', { 
            icon: '⚠️',
            style: { background: '#FFA500', color: 'white' }
          })
        } else {
          toast.error('Erreur lors de la suppression du fichier physique')
          // On continue quand même pour supprimer de la DB
        }
      }

      // 2. Supprimer de la base de données
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)

      if (error) {
        toast.error('Erreur lors de la suppression de la base de données')
      } else {
        toast.success('Document supprimé complètement')
        loadDocuments()
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3 text-slate-600">
          <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg">Chargement des documents...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Gestion des documents
          </h2>
          <p className="text-slate-600 mt-1">
            Uploadez et gérez vos fichiers PDF et DOCX
          </p>
        </div>
        <button
          onClick={buildIndex}
          disabled={processing || documents.length === 0}
          className="inline-flex items-center px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {processing ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Construction...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                <path d="M12 16v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Mettre à jour l'IA
            </>
          )}
        </button>
      </div>

      {/* Zone de drop */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              isDragActive ? 'bg-primary/10 scale-110' : 'bg-slate-100'
            }`}>
              <svg className={`w-8 h-8 transition-colors duration-300 ${
                isDragActive ? 'text-primary' : 'text-slate-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-xl font-semibold text-slate-900">
              {isDragActive
                ? 'Déposez vos fichiers ici...'
                : 'Glissez-déposez vos fichiers ici'}
            </div>
            <div className="text-slate-500">
              ou cliquez pour sélectionner (PDF, DOCX - max 10MB)
            </div>
          </div>
        </div>
      </div>

      {uploading && (
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center space-x-3 text-primary">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-medium">Upload en cours...</span>
          </div>
        </div>
      )}

      {/* Liste des documents */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Documents ({documents.length})
            </h3>
            {documents.length > 0 && (
              <div className="text-sm text-slate-500">
                {documents.filter(doc => doc.processed).length} traités sur {documents.length}
              </div>
            )}
          </div>
        </div>
        
        {documents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-500 text-lg">Aucun document uploadé</p>
            <p className="text-slate-400 text-sm mt-1">Commencez par glisser-déposer vos premiers fichiers</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/50">
            {documents.map((doc) => (
              <div key={doc.id} className="p-6 hover:bg-slate-50/50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      doc.mime_type.includes('pdf') ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      {doc.mime_type.includes('pdf') ? (
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{doc.name}</div>
                      <div className="text-sm text-slate-500 flex items-center space-x-4 mt-1">
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>{formatFileSize(doc.file_size)}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(doc.created_at).toLocaleDateString('fr-FR')}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      doc.processed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.processed ? (
                        <span className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Traité</span>
                        </span>
                      ) : (
                        <span className="flex items-center space-x-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>En attente</span>
                        </span>
                      )}
                    </span>
                    
                    {/* Bouton Modifier pour DOCX */}
                    {doc.mime_type.includes('word') && (
                      <button
                        onClick={() => setEditingDocument(doc.name)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="Modifier le document"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Bouton Visualiser pour PDF */}
                    {doc.mime_type.includes('pdf') && (
                      <button
                        onClick={() => setViewingDocument(doc.name)}
                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                        title="Visualiser le document"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}
                    
                    {/* Bouton Télécharger pour tous les fichiers */}
                    <button
                      onClick={() => downloadDocument(doc.name)}
                      className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                      title="Télécharger le document"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    
                    {/* Bouton Supprimer */}
                    <button
                      onClick={() => deleteDocument(doc.id, doc.file_path)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Supprimer le document"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {editingDocument && (
        <DocumentEditor
          filename={editingDocument}
          onClose={() => setEditingDocument(null)}
          onSave={() => loadDocuments()}
        />
      )}

      {viewingDocument && (
        <PDFViewer
          filename={viewingDocument}
          onClose={() => setViewingDocument(null)}
        />
      )}
    </div>
  )
} 