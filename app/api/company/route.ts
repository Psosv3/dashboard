import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Vérifier l'authentification
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Obtenir le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil utilisateur non trouvé' }, { status: 404 })
    }

    // Obtenir les informations de l'entreprise
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single()

    if (companyError) {
      return NextResponse.json({ error: 'Erreur lors de la récupération de l\'entreprise' }, { status: 500 })
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Erreur dans GET /api/company:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Vérifier l'authentification
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Obtenir le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id, role')
      .eq('user_id', session.user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil utilisateur non trouvé' }, { status: 404 })
    }

    // Vérifier les permissions (seuls les admins peuvent modifier)
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { name } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Le nom de l\'entreprise est requis' }, { status: 400 })
    }

    // Mettre à jour l'entreprise
    const { data: company, error: updateError } = await supabase
      .from('companies')
      .update({ name: name.trim() })
      .eq('id', profile.company_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour de l\'entreprise' }, { status: 500 })
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error('Erreur dans PUT /api/company:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
