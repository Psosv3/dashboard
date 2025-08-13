'use client'

import React from 'react'

interface ExportData {
  sessions: any[]
  statsData: any
  companyName: string
}

interface ExportButtonProps {
  data: ExportData
  disabled?: boolean
}

export default function ExportButton({ data, disabled = false }: ExportButtonProps) {
  const handleExportCSV = () => {
    if (!data.sessions || data.sessions.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    // Préparer les données pour l'export CSV
    const csvData = []
    
    // En-têtes
    csvData.push([
      'ID Session',
      'Titre',
      'Date Création',
      'Utilisateur ID',
      'Nombre Messages',
      'Messages Utilisateur',
      'Messages Assistant'
    ])

    // Données
    data.sessions.forEach(session => {
      const userMessages = session.chat_messages.filter((msg: any) => msg.role === 'user').length
      const assistantMessages = session.chat_messages.filter((msg: any) => msg.role === 'assistant').length
      
      csvData.push([
        session.id,
        session.title,
        new Date(session.created_at).toLocaleDateString('fr-FR'),
        session.user_id,
        session.chat_messages.length,
        userMessages,
        assistantMessages
      ])
    })

    // Convertir en CSV
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n')

    // Télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `stats_chat_${data.companyName}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportJSON = () => {
    if (!data.sessions || data.sessions.length === 0) {
      alert('Aucune donnée à exporter')
      return
    }

    // Préparer les données complètes
    const exportData = {
      company: data.companyName,
      exportDate: new Date().toISOString(),
      statistics: data.statsData,
      sessions: data.sessions.map(session => ({
        id: session.id,
        title: session.title,
        created_at: session.created_at,
        user_id: session.user_id,
        messages: session.chat_messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          created_at: msg.created_at
        }))
      }))
    }

    // Télécharger le fichier JSON
    const jsonContent = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `stats_chat_complete_${data.companyName}_${new Date().toISOString().split('T')[0]}.json`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleExportCSV}
        disabled={disabled}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        📊 Export CSV
      </button>
      
      <button
        onClick={handleExportJSON}
        disabled={disabled}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        📄 Export JSON
      </button>
    </div>
  )
}
