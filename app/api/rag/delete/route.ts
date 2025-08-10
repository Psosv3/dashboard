import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function DELETE(request: NextRequest) {
  try {
    // Obtenir le nom du fichier depuis les paramètres de requête
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')

    if (!filename) {
      return NextResponse.json(
        { error: 'Le nom du fichier est requis' },
        { status: 400 }
      )
    }

    // Vérifier l'authentification
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      )
    }

    // Faire la requête vers l'API RAG (HTTP)
    const ragResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/documents/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!ragResponse.ok) {
      const errorData = await ragResponse.json().catch(() => null)
      return NextResponse.json(
        { error: errorData?.detail || 'Erreur lors de la suppression du fichier' },
        { status: ragResponse.status }
      )
    }

    const result = await ragResponse.json()
    
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Erreur lors de la suppression:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}