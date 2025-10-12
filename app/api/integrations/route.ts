import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Vérifier l'authentification
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Obtenir le profil utilisateur pour récupérer l'ID de l'entreprise
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil utilisateur non trouvé' }, { status: 404 })
    }

    // Récupérer les intégrations de l'entreprise
    const { data: integrations, error: integrationsError } = await supabase
      .from('company_integrations')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })

    if (integrationsError) {
      console.error('Erreur lors de la récupération des intégrations:', integrationsError)
      return NextResponse.json({ error: 'Erreur lors de la récupération des intégrations' }, { status: 500 })
    }

    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })

    // Vérifier l'authentification
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('user_id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil utilisateur non trouvé' }, { status: 404 })
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Seuls les administrateurs peuvent gérer les intégrations' }, { status: 403 })
    }

    const body = await request.json()
    const { integration_type, app_token, page_token, verify_token, webhook_url, is_active } = body

    // Validation des données
    if (!integration_type) {
      return NextResponse.json({ error: 'Le type d\'intégration est requis' }, { status: 400 })
    }

    // Créer l'intégration
    const { data: integration, error: integrationError } = await supabase
      .from('company_integrations')
      .insert({
        company_id: profile.company_id,
        integration_type,
        app_token,
        page_token,
        verify_token,
        webhook_url,
        is_active: is_active !== undefined ? is_active : true
      })
      .select()
      .single()

    if (integrationError) {
      console.error('Erreur lors de la création de l\'intégration:', integrationError)
      return NextResponse.json({ error: 'Erreur lors de la création de l\'intégration' }, { status: 500 })
    }

    return NextResponse.json({ integration }, { status: 201 })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
