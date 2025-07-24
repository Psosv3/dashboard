import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    // Récupérer le body JSON (peut être vide)
    const body = await request.json().catch(() => ({}))

    // Faire la requête vers l'API RAG (HTTP)
    const ragResponse = await fetch('http://api-rag.onexus.tech:8000/build_index', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
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
    console.error('Proxy build_index error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
} 