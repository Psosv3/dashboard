'use client'

import { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { useSupabase } from '@/lib/supabase-provider'
import toast from 'react-hot-toast'
import axios from 'axios'

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
        // Upload vers le backend RAG
        const formData = new FormData()
        formData.append('file', file)
        formData.append('company_id', companyId)

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_RAG_BACKEND_URL || 'http://localhost:8000'}/upload/`,
          formData
        )

        if (response.data.success) {
          // Enregistrer dans la base de données
          const { error } = await supabase.from('documents').insert({
            name: file.name,
            file_path: response.data.file_path,
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
      } catch (error) {
        toast.error(`Erreur lors de l'upload de ${file.name}`)
      }
    }

    setUploading(false)
    loadDocuments()
  }

  const buildIndex = async () => {
    setProcessing(true)
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_RAG_BACKEND_URL || 'http://localhost:8000'}/build_index`,
        { company_id: companyId }
      )

      if (response.data.success) {
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
    } catch (error) {
      toast.error('Erreur lors de la construction de l\'index')
    }
    setProcessing(false)
  }

  const deleteDocument = async (docId: string, filePath: string) => {
    try {
      // Supprimer de la base de données
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId)

      if (error) {
        toast.error('Erreur lors de la suppression')
      } else {
        toast.success('Document supprimé')
        loadDocuments()
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression')
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFileSize: 10 * 1024 * 1024 // 10MB
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Gestion des documents
        </h2>
        <button
          onClick={buildIndex}
          disabled={processing || documents.length === 0}
          className="btn-primary"
        >
          {processing ? 'Construction...' : 'Construire l\'index'}
        </button>
      </div>

      {/* Zone de drop */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <div className="text-3xl">📄</div>
          <div className="text-lg font-medium text-gray-900">
            {isDragActive
              ? 'Déposez les fichiers ici...'
              : 'Glissez-déposez vos fichiers ici'}
          </div>
          <div className="text-gray-500">
            ou cliquez pour sélectionner (PDF, DOCX - max 10MB)
          </div>
        </div>
      </div>

      {uploading && (
        <div className="text-center py-4">
          <div className="text-primary">Upload en cours...</div>
        </div>
      )}

      {/* Liste des documents */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Documents ({documents.length})
          </h3>
        </div>
        
        {documents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Aucun document uploadé
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div key={doc.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">
                    {doc.mime_type.includes('pdf') ? '📄' : '📝'}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{doc.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatFileSize(doc.file_size)} • {' '}
                      {new Date(doc.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    doc.processed
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {doc.processed ? 'Traité' : 'En attente'}
                  </span>
                  <button
                    onClick={() => deleteDocument(doc.id, doc.file_path)}
                    className="text-red-600 hover:text-red-800"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 