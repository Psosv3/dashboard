import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/crypto'

type MessageToDecrypt = {
  id: string
  content: string
  role?: string
  [key: string]: any
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Récupérer les messages à décrypter
    const { messages } = await request.json() as { messages: MessageToDecrypt[] }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Format de requête invalide. "messages" doit être un tableau.' },
        { status: 400 }
      )
    }

    // Décrypter chaque message
    const decryptedMessages = messages.map(message => {
      try {
        // Décrypter uniquement le champ content
        const decryptedContent = decrypt(message.content)
        return {
          ...message,
          content: decryptedContent
        }
      } catch (error) {
        console.error(`Erreur lors du décryptage du message ${message.id}:`, error)
        // En cas d'erreur, retourner le message original
        return message
      }
    })

    return NextResponse.json({
      success: true,
      messages: decryptedMessages
    })

  } catch (error) {
    console.error('Erreur dans l\'API de décryptage:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors du décryptage' },
      { status: 500 }
    )
  }
}

