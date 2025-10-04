import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const RAG_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('[document-content] Non authentifié')
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le filename depuis les query params
    const searchParams = request.nextUrl.searchParams
    const filename = searchParams.get('filename')

    if (!filename) {
      console.log('[document-content] Filename manquant')
      return NextResponse.json({ error: 'Filename manquant' }, { status: 400 })
    }

    console.log(`[document-content] GET request pour: ${filename}`)
    console.log(`[document-content] RAG_API_URL: ${RAG_API_URL}`)

    // Appel au backend RAG
    const url = `${RAG_API_URL}/documents/${encodeURIComponent(filename)}/content`
    console.log(`[document-content] URL appelée: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    console.log(`[document-content] Réponse backend: status ${response.status}`)

    if (!response.ok) {
      const error = await response.json()
      console.error('[document-content] Erreur backend:', error)
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    console.log(`[document-content] Succès - Contenu récupéré (${data.content?.length || 0} caractères)`)
    return NextResponse.json(data)

  } catch (error: any) {
    console.error('[document-content] Exception:', error)
    console.error('[document-content] Stack:', error?.stack)
    return NextResponse.json(
      { error: 'Erreur serveur', detail: error?.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le filename et le contenu
    const searchParams = request.nextUrl.searchParams
    const filename = searchParams.get('filename')
    const body = await request.json()

    if (!filename) {
      return NextResponse.json({ error: 'Filename manquant' }, { status: 400 })
    }

    if (!body.content) {
      return NextResponse.json({ error: 'Contenu manquant' }, { status: 400 })
    }

    // Appel au backend RAG
    const response = await fetch(
      `${RAG_API_URL}/documents/${encodeURIComponent(filename)}/content`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: body.content }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Erreur lors de la mise à jour du contenu:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

