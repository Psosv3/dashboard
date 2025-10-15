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

    // Obtenir tous les contacts de l'entreprise
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })

    if (contactsError) {
      return NextResponse.json({ error: 'Erreur lors de la récupération des contacts' }, { status: 500 })
    }

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Erreur dans GET /api/contacts:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
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

    // Vérifier les permissions (seuls les admins peuvent ajouter des contacts)
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    const { name, email, role, description } = await request.json()

    // Validation des données
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Le nom, l\'email et le rôle sont requis' }, { status: 400 })
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
    }

    // Créer le contact
    const { data: contact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role.trim(),
        description: description?.trim() || null,
        company_id: profile.company_id
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Erreur lors de la création du contact' }, { status: 500 })
    }

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    console.error('Erreur dans POST /api/contacts:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
