import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    // Vérifier que le contact appartient à l'entreprise
    const { data: existingContact, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single()

    if (contactError || !existingContact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 })
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

    // Mettre à jour le contact
    const { data: contact, error: updateError } = await supabase
      .from('contacts')
      .update({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role.trim(),
        description: description?.trim() || null
      })
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors de la mise à jour du contact' }, { status: 500 })
    }

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Erreur dans PUT /api/contacts/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
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

    // Vérifier les permissions (seuls les admins peuvent supprimer)
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 })
    }

    // Vérifier que le contact appartient à l'entreprise et le supprimer
    const { error: deleteError } = await supabase
      .from('contacts')
      .delete()
      .eq('id', params.id)
      .eq('company_id', profile.company_id)

    if (deleteError) {
      return NextResponse.json({ error: 'Erreur lors de la suppression du contact' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur dans DELETE /api/contacts/[id]:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
