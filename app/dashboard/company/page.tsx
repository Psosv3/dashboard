'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase-provider'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database.types'
import DashboardLayout from '@/components/DashboardLayout'
import { User } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  user_id: string
  company_id: string
  role: 'admin' | 'user'
  companies?: {
    id: string
    name: string
  }
}

interface Company {
  id: string
  name: string
  created_at: string
  updated_at: string
}

interface Contact {
  id: string
  name: string
  email: string
  role: string
  description: string | null
  company_id: string
  created_at: string
  updated_at: string
}

interface CompanyIntegration {
  id: string
  company_id: string
  integration_type: 'facebook' | 'whatsapp' | 'instagram' | 'other'
  app_token: string | null
  page_token: string | null
  verify_token: string | null
  webhook_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function CompanyPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [company, setCompany] = useState<Company | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [integrations, setIntegrations] = useState<CompanyIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCompany, setEditingCompany] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [showAddContact, setShowAddContact] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    role: '',
    description: ''
  })
  const [showAddIntegration, setShowAddIntegration] = useState(false)
  const [editingIntegration, setEditingIntegration] = useState<CompanyIntegration | null>(null)
  const [newIntegration, setNewIntegration] = useState({
    integration_type: 'facebook' as 'facebook' | 'whatsapp' | 'instagram' | 'other',
    app_token: '',
    page_token: '',
    verify_token: '',
    webhook_url: '',
    is_active: true
  })

  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    checkUser()
  }, [])

  // Génération automatique de l'URL du webhook pour l'ajout
  useEffect(() => {
    if (newIntegration.verify_token && newIntegration.app_token && newIntegration.page_token) {
      const webhookUrl = `https://chatbot.onexus.tech/api/messenger/webhook?verify_token=${encodeURIComponent(newIntegration.verify_token)}&app_secret=${encodeURIComponent(newIntegration.app_token)}&page_token=${encodeURIComponent(newIntegration.page_token)}`
      setNewIntegration(prev => ({...prev, webhook_url: webhookUrl}))
    }
  }, [newIntegration.verify_token, newIntegration.app_token, newIntegration.page_token])

  // Génération automatique de l'URL du webhook pour l'édition
  useEffect(() => {
    if (editingIntegration && editingIntegration.verify_token && editingIntegration.app_token && editingIntegration.page_token) {
      const webhookUrl = `https://chatbot.onexus.tech/api/messenger/webhook?verify_token=${encodeURIComponent(editingIntegration.verify_token)}&app_secret=${encodeURIComponent(editingIntegration.app_token)}&page_token=${encodeURIComponent(editingIntegration.page_token)}`
      setEditingIntegration(prev => prev ? {...prev, webhook_url: webhookUrl} : null)
    }
  }, [editingIntegration?.verify_token, editingIntegration?.app_token, editingIntegration?.page_token])

  const checkUser = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error || !session) {
        window.location.href = '/auth/login'
        return
      }

      setUser(session.user)

      // Obtenir le profil utilisateur avec les informations de l'entreprise
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          companies (
            id,
            name
          )
        `)
        .eq('user_id', session.user.id)
        .single()

      if (profileError || !profileData) {
        toast.error('Erreur lors du chargement du profil')
        return
      }

      setProfile(profileData)
      await loadCompanyData(profileData.company_id)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const loadCompanyData = async (companyId: string) => {
    try {
      // Charger les informations de l'entreprise
      const companyResponse = await fetch('/api/company')
      if (companyResponse.ok) {
        const companyData = await companyResponse.json()
        setCompany(companyData.company)
        setNewCompanyName(companyData.company.name)
      }

      // Charger les contacts
      const contactsResponse = await fetch('/api/contacts')
      console.log({contactsResponse})
      if (contactsResponse.ok) {
        const contactsData = await contactsResponse.json()
        setContacts(contactsData.contacts)
      }

      // Charger les intégrations
      const integrationsResponse = await fetch('/api/integrations')
      if (integrationsResponse.ok) {
        const integrationsData = await integrationsResponse.json()
        setIntegrations(integrationsData.integrations)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  }

  const handleUpdateCompany = async () => {
    try {
      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newCompanyName }),
      })

      if (response.ok) {
        const data = await response.json()
        setCompany(data.company)
        setEditingCompany(false)
        toast.success('Entreprise mise à jour avec succès')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const handleAddContact = async () => {
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContact),
      })

      console.log({response})
      if (response.ok) {
        const data = await response.json()
        setContacts([data.contact, ...contacts])
        setNewContact({ name: '', email: '', role: '', description: '' })
        setShowAddContact(false)
        toast.success('Contact ajouté avec succès')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du contact')
    }
  }

  const handleUpdateContact = async () => {
    if (!editingContact) return

    try {
      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingContact.name,
          email: editingContact.email,
          role: editingContact.role,
          description: editingContact.description
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setContacts(contacts.map(c => c.id === editingContact.id ? data.contact : c))
        setEditingContact(null)
        toast.success('Contact mis à jour avec succès')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du contact')
    }
  }

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) return

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setContacts(contacts.filter(c => c.id !== contactId))
        toast.success('Contact supprimé avec succès')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression du contact')
    }
  }

  const handleAddIntegration = async () => {
    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIntegration),
      })

      if (response.ok) {
        const data = await response.json()
        setIntegrations([data.integration, ...integrations])
        setNewIntegration({
          integration_type: 'facebook',
          app_token: '',
          page_token: '',
          verify_token: '',
          webhook_url: '',
          is_active: true
        })
        setShowAddIntegration(false)
        toast.success('Intégration ajoutée avec succès')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de l\'ajout')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de l\'intégration')
    }
  }

  const handleUpdateIntegration = async () => {
    if (!editingIntegration) return

    try {
      const response = await fetch(`/api/integrations/${editingIntegration.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          integration_type: editingIntegration.integration_type,
          app_token: editingIntegration.app_token,
          page_token: editingIntegration.page_token,
          verify_token: editingIntegration.verify_token,
          webhook_url: editingIntegration.webhook_url,
          is_active: editingIntegration.is_active
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setIntegrations(integrations.map(i => i.id === editingIntegration.id ? data.integration : i))
        setEditingIntegration(null)
        toast.success('Intégration mise à jour avec succès')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'intégration')
    }
  }

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette intégration ?')) return

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setIntegrations(integrations.filter(i => i.id !== integrationId))
        toast.success('Intégration supprimée avec succès')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression de l\'intégration')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const isAdmin = profile.role === 'admin'

  return (
    <DashboardLayout user={user} profile={profile}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mon Entreprise</h1>
            <p className="text-slate-600 mt-1">Gérez les informations de votre entreprise et vos contacts de support</p>
          </div>
        </div>

        {/* Informations de l'entreprise */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-900">Informations de l'entreprise</h2>
            {isAdmin && (
              <button
                onClick={() => setEditingCompany(!editingCompany)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingCompany ? 'Annuler' : 'Modifier'}
              </button>
            )}
          </div>

          {editingCompany ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nom de l'entreprise"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleUpdateCompany}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Enregistrer
                </button>
                <button
                  onClick={() => {
                    setEditingCompany(false)
                    setNewCompanyName(company?.name || '')
                  }}
                  className="px-6 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom de l'entreprise
                </label>
                <p className="text-lg text-slate-900">{company?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Date de création
                </label>
                <p className="text-slate-600">
                  {company?.created_at ? new Date(company.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Contacts de support */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Contacts de support</h2>
              <p className="text-slate-600 text-sm mt-1">Gérez les contacts à contacter pour le support de l'entreprise</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddContact(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Ajouter un contact</span>
              </button>
            )}
          </div>

          {/* Modal d'ajout de contact */}
          {showAddContact && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Ajouter un contact</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nom du contact"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="email@exemple.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rôle</label>
                    <input
                      type="text"
                      value={newContact.role}
                      onChange={(e) => setNewContact({...newContact, role: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: Support technique, Manager, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description (optionnel)</label>
                    <textarea
                      value={newContact.description}
                      onChange={(e) => setNewContact({...newContact, description: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Description du contact"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleAddContact}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setShowAddContact(false)
                      setNewContact({ name: '', email: '', role: '', description: '' })
                    }}
                    className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal d'édition de contact */}
          {editingContact && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Modifier le contact</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Nom</label>
                    <input
                      type="text"
                      value={editingContact.name}
                      onChange={(e) => setEditingContact({...editingContact, name: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editingContact.email}
                      onChange={(e) => setEditingContact({...editingContact, email: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Rôle</label>
                    <input
                      type="text"
                      value={editingContact.role}
                      onChange={(e) => setEditingContact({...editingContact, role: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      value={editingContact.description || ''}
                      onChange={(e) => setEditingContact({...editingContact, description: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleUpdateContact}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingContact(null)}
                    className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Liste des contacts */}
          {contacts.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-slate-500">Aucun contact de support configuré</p>
              {isAdmin && (
                <p className="text-slate-400 text-sm mt-1">Cliquez sur "Ajouter un contact" pour commencer</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => (
                <div key={contact.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{contact.name}</h3>
                          <p className="text-sm text-slate-600">{contact.role}</p>
                        </div>
                      </div>
                      <div className="ml-13 space-y-1">
                        <p className="text-sm text-slate-700">
                          <span className="font-medium">Email:</span> 
                          <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-800 ml-1">
                            {contact.email}
                          </a>
                        </p>
                        {contact.description && (
                          <p className="text-sm text-slate-600">
                            <span className="font-medium">Description:</span> {contact.description}
                          </p>
                        )}
                        <p className="text-xs text-slate-400">
                          Ajouté le {new Date(contact.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setEditingContact(contact)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isAdmin && contacts.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Seuls les administrateurs peuvent gérer les contacts de support.
              </p>
            </div>
          )}
        </div>

        {/* Intégrations Facebook */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Intégrations Facebook</h2>
              <p className="text-slate-600 text-sm mt-1">Gérez les tokens et configurations Facebook Developer pour votre entreprise</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddIntegration(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Ajouter une intégration</span>
              </button>
            )}
          </div>

          {/* Modal d'ajout d'intégration */}
          {showAddIntegration && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Ajouter une intégration Facebook</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type d'intégration</label>
                    <select
                      value={newIntegration.integration_type}
                      onChange={(e) => setNewIntegration({...newIntegration, integration_type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="instagram">Instagram</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">App Token</label>
                    <input
                      type="text"
                      value={newIntegration.app_token}
                      onChange={(e) => setNewIntegration({...newIntegration, app_token: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Token de l'application Facebook"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Page Token</label>
                    <input
                      type="text"
                      value={newIntegration.page_token}
                      onChange={(e) => setNewIntegration({...newIntegration, page_token: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Token de la page Facebook"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Verify Token</label>
                    <input
                      type="text"
                      value={newIntegration.verify_token}
                      onChange={(e) => setNewIntegration({...newIntegration, verify_token: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Token de vérification"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Webhook URL (généré automatiquement)</label>
                    <input
                      type="url"
                      value={newIntegration.webhook_url}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                      placeholder="L'URL sera générée automatiquement..."
                      readOnly
                    />
                    <p className="text-xs text-slate-500 mt-1">
                       L'URL se génère automatiquement dès que vous remplissez les 3 tokens
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={newIntegration.is_active}
                      onChange={(e) => setNewIntegration({...newIntegration, is_active: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-slate-700">
                      Intégration active
                    </label>
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleAddIntegration}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setShowAddIntegration(false)
                      setNewIntegration({
                        integration_type: 'facebook',
                        app_token: '',
                        page_token: '',
                        verify_token: '',
                        webhook_url: '',
                        is_active: true
                      })
                    }}
                    className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal d'édition d'intégration */}
          {editingIntegration && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Modifier l'intégration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Type d'intégration</label>
                    <select
                      value={editingIntegration.integration_type}
                      onChange={(e) => setEditingIntegration({...editingIntegration, integration_type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="facebook">Facebook</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="instagram">Instagram</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">App Token</label>
                    <input
                      type="text"
                      value={editingIntegration.app_token || ''}
                      onChange={(e) => setEditingIntegration({...editingIntegration, app_token: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Page Token</label>
                    <input
                      type="text"
                      value={editingIntegration.page_token || ''}
                      onChange={(e) => setEditingIntegration({...editingIntegration, page_token: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Verify Token</label>
                    <input
                      type="text"
                      value={editingIntegration.verify_token || ''}
                      onChange={(e) => setEditingIntegration({...editingIntegration, verify_token: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Webhook URL (généré automatiquement)</label>
                    <input
                      type="url"
                      value={editingIntegration.webhook_url || ''}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                      placeholder="L'URL sera générée automatiquement..."
                      readOnly
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      ✨ L'URL se génère automatiquement dès que vous remplissez les 3 tokens
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="edit_is_active"
                      checked={editingIntegration.is_active}
                      onChange={(e) => setEditingIntegration({...editingIntegration, is_active: e.target.checked})}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="edit_is_active" className="ml-2 block text-sm text-slate-700">
                      Intégration active
                    </label>
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleUpdateIntegration}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={() => setEditingIntegration(null)}
                    className="flex-1 px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Liste des intégrations */}
          {integrations.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-slate-500">Aucune intégration configurée</p>
              {isAdmin && (
                <p className="text-slate-400 text-sm mt-1">Cliquez sur "Ajouter une intégration" pour commencer</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {integrations.map((integration) => (
                <div key={integration.id} className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          integration.integration_type === 'facebook' ? 'bg-blue-600' :
                          integration.integration_type === 'whatsapp' ? 'bg-green-600' :
                          integration.integration_type === 'instagram' ? 'bg-pink-600' :
                          'bg-slate-600'
                        }`}>
                          <span className="text-white text-sm font-semibold">
                            {integration.integration_type.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 capitalize">{integration.integration_type}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              integration.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {integration.is_active ? 'Actif' : 'Inactif'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-13 space-y-2">
                        {integration.app_token && (
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">App Token:</span> 
                            <span className="ml-1 font-mono text-xs bg-slate-200 px-2 py-1 rounded">
                              {integration.app_token.substring(0, 20)}...
                            </span>
                          </p>
                        )}
                        {integration.page_token && (
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">Page Token:</span> 
                            <span className="ml-1 font-mono text-xs bg-slate-200 px-2 py-1 rounded">
                              {integration.page_token.substring(0, 20)}...
                            </span>
                          </p>
                        )}
                        {integration.verify_token && (
                          <p className="text-sm text-slate-700">
                            <span className="font-medium">Verify Token:</span> 
                            <span className="ml-1 font-mono text-xs bg-slate-200 px-2 py-1 rounded">
                              {integration.verify_token.substring(0, 20)}...
                            </span>
                          </p>
                        )}
                        {integration.webhook_url && (
                          <div className="text-sm text-slate-700">
                            <span className="font-medium">Webhook:</span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded flex-1 truncate">
                                {integration.webhook_url.length > 60 
                                  ? `${integration.webhook_url.substring(0, 60)}...` 
                                  : integration.webhook_url
                                }
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(integration.webhook_url || '')
                                  toast.success('URL du webhook copiée !')
                                }}
                                className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                                title="Copier l'URL du webhook"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                              <a 
                                href={integration.webhook_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                                title="Ouvrir l'URL du webhook"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-slate-400">
                          Créé le {new Date(integration.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setEditingIntegration(integration)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteIntegration(integration.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isAdmin && integrations.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Seuls les administrateurs peuvent gérer les intégrations.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
