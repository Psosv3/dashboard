import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    // Récupérer le FormData
    const formData = await request.formData()
    
    // Créer un nouveau FormData pour l'API RAG
    const ragFormData = new FormData()
    const file = formData.get('file') as File
    if (file) {
      ragFormData.append('file', file)
    }

    // Faire la requête vers l'API RAG (HTTP)
    const ragResponse = await fetch('http://api-rag.onexus.tech:8000/upload/', {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: ragFormData
    })

    if (!ragResponse.ok) {
      const errorText = await ragResponse.text()
      return NextResponse.json(
        { error: `RAG API Error: ${errorText}` }, 
        { status: ragResponse.status }
      )
    }

    const result = await ragResponse.json()
    return NextResponse.json(result)

  } catch (error) {
    console.error('Proxy upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 