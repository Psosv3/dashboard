import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Vérifier que l'intégration appartient à l'entreprise de l'utilisateur
    const { data: existingIntegration, error: fetchError } = await supabase
      .from('company_integrations')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (fetchError || !existingIntegration) {
      return NextResponse.json({ error: 'Intégration non trouvée' }, { status: 404 })
    }

    // Mettre à jour l'intégration
    const { data: integration, error: updateError } = await supabase
      .from('company_integrations')
      .update({
        integration_type,
        app_token,
        page_token,
        verify_token,
        webhook_url,
        is_active
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      console.error('Erreur lors de la mise à jour de l\'intégration:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'intégration' }, { status: 500 })
    }

    return NextResponse.json({ integration })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Vérifier que l'intégration appartient à l'entreprise de l'utilisateur
    const { data: existingIntegration, error: fetchError } = await supabase
      .from('company_integrations')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (fetchError || !existingIntegration) {
      return NextResponse.json({ error: 'Intégration non trouvée' }, { status: 404 })
    }

    // Supprimer l'intégration
    const { error: deleteError } = await supabase
      .from('company_integrations')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Erreur lors de la suppression de l\'intégration:', deleteError)
      return NextResponse.json({ error: 'Erreur lors de la suppression de l\'intégration' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Intégration supprimée avec succès' })
  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
