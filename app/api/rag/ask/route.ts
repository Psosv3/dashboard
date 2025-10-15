import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { question, company_id, session_id, external_user_id, langue } = await request.json()

    if (!question) {
      return NextResponse.json({ error: 'Question manquante' }, { status: 400 })
    }

    const requestBody = {
      question,
      company_id,
      session_id,
      external_user_id,
      langue: langue || 'français'
    }

    // Appeler le backend Python en streaming (ask_public)
    const ragResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ask_public/`, {
    // const ragResponse = await fetch('http://localhost:8000/ask_public/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(requestBody)
    })

    if (!ragResponse.ok) {
      const errorText = await ragResponse.text()
      return NextResponse.json(
        { error: 'Erreur du backend', status: ragResponse.status, details: errorText },
        { status: ragResponse.status }
      )
    }

    // Proxy SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const reader = ragResponse.body?.getReader()
        const decoder = new TextDecoder()

        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader!.read()
              if (done) {
                controller.close()
                break
              }
              const chunk = decoder.decode(value, { stream: true })
              controller.enqueue(new TextEncoder().encode(chunk))
            }
          } catch (err) {
            console.error('Erreur lors du streaming:', err)
            controller.error(err)
          }
        }

        pump()
      }
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('Proxy ask_public error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}