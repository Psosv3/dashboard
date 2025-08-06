'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface CodeBlockProps {
  code: string
  language?: string
}

export default function CodeBlock({ code, language = 'html' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('Code copié dans le presse-papiers!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Erreur lors de la copie')
    }
  }

  return (
    <div className="relative">
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
        <code>{code}</code>
      </div>
      <button 
        onClick={copyToClipboard}
        className={`absolute top-2 right-2 px-3 py-1 rounded text-xs transition-all duration-200 ${
          copied 
            ? 'bg-green-600 text-white' 
            : 'bg-gray-700 hover:bg-gray-600 text-white'
        }`}
        title="Copier le code"
      >
        {copied ? '✅ Copié!' : '📋 Copier'}
      </button>
    </div>
  )
}