'use client'

import { useState } from 'react'

interface Contact {
  id: string
  name: string
  email: string
  role: string
  description: string | null
  created_at: string
}

interface ContactCardProps {
  contact: Contact
  isAdmin: boolean
  onEdit: (contact: Contact) => void
  onDelete: (contactId: string) => void
}

export default function ContactCard({ contact, isAdmin, onEdit, onDelete }: ContactCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) return
    
    setIsDeleting(true)
    try {
      await onDelete(contact.id)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-semibold">
                {contact.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{contact.name}</h3>
              <p className="text-sm text-blue-600 font-medium">{contact.role}</p>
            </div>
          </div>
          
          <div className="ml-13 space-y-2">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              <a 
                href={`mailto:${contact.email}`} 
                className="text-sm text-slate-700 hover:text-blue-600 transition-colors"
              >
                {contact.email}
              </a>
            </div>
            
            {contact.description && (
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-slate-600">{contact.description}</p>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-6 0h6m-6 0a1 1 0 01-1 1v6m10-7a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h14a1 1 0 011 1z" />
              </svg>
              <p className="text-xs text-slate-400">
                Ajouté le {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex space-x-1 ml-4">
            <button
              onClick={() => onEdit(contact)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors group"
              title="Modifier le contact"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors group disabled:opacity-50"
              title="Supprimer le contact"
            >
              {isDeleting ? (
                <div className="w-4 h-4 animate-spin border-2 border-red-600 border-t-transparent rounded-full"></div>
              ) : (
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
