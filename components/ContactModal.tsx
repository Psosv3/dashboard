'use client'

import { useState, useEffect } from 'react'

interface Contact {
  id?: string
  name: string
  email: string
  role: string
  description: string | null
}

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (contact: Contact) => Promise<void>
  contact?: Contact | null
  title: string
}

export default function ContactModal({ isOpen, onClose, onSave, contact, title }: ContactModalProps) {
  const [formData, setFormData] = useState<Contact>({
    name: '',
    email: '',
    role: '',
    description: ''
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (contact) {
      setFormData(contact)
    } else {
      setFormData({
        name: '',
        email: '',
        role: '',
        description: ''
      })
    }
    setErrors({})
  }, [contact, isOpen])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Adresse email invalide'
      }
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Le rôle est requis'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role.trim(),
        description: formData.description?.trim() || null
      })
      onClose()
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Nom du contact"
              disabled={isSaving}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="email@exemple.com"
              disabled={isSaving}
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Rôle <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.role ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              placeholder="Ex: Support technique, Manager, etc."
              disabled={isSaving}
            />
            {errors.role && (
              <p className="text-red-600 text-sm mt-1">{errors.role}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description (optionnel)
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Description du contact ou de ses responsabilités"
              rows={3}
              disabled={isSaving}
            />
          </div>

          <div className="flex space-x-3 mt-8">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>{contact ? 'Mettre à jour' : 'Ajouter'}</span>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
