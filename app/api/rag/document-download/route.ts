import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const RAG_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('[document-download] Non authentifié')
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Récupérer le filename depuis les query params
    const searchParams = request.nextUrl.searchParams
    const filename = searchParams.get('filename')

    if (!filename) {
      console.log('[document-download] Filename manquant')
      return NextResponse.json({ error: 'Filename manquant' }, { status: 400 })
    }

    console.log(`[document-download] GET request pour: ${filename}`)

    // Appel au backend RAG pour télécharger le fichier
    const url = `${RAG_API_URL}/documents/${encodeURIComponent(filename)}/download`
    console.log(`[document-download] URL appelée: ${url}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    console.log(`[document-download] Réponse backend: status ${response.status}`)

    if (!response.ok) {
      const error = await response.json()
      console.error('[document-download] Erreur backend:', error)
      return NextResponse.json(error, { status: response.status })
    }

    // Streamer le fichier en réponse
    const blob = await response.blob()
    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error: any) {
    console.error('[document-download] Exception:', error)
    console.error('[document-download] Stack:', error?.stack)
    return NextResponse.json(
      { error: 'Erreur serveur', detail: error?.message },
      { status: 500 }
    )
  }
}



