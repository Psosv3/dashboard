import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Récupérer les paramètres de l'entreprise
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le profil utilisateur et company_id
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
    }

    // Récupérer les informations de l'entreprise
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', profile.company_id)
      .single();

    if (companyError) {
      return NextResponse.json({ error: 'Entreprise non trouvée' }, { status: 404 });
    }

    // Récupérer les intégrations de l'entreprise
    const { data: integrations, error: integrationsError } = await supabase
      .from('company_integrations')
      .select('*')
      .eq('company_id', profile.company_id);

    if (integrationsError) {
      console.error('Erreur lors de la récupération des intégrations:', integrationsError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des intégrations' }, { status: 500 });
    }

    return NextResponse.json({
      company,
      integrations: integrations || [],
      background_color: integrations && integrations.length > 0 ? integrations[0].background_color : '#4F46E5'
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour les paramètres de l'entreprise
export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le profil utilisateur et company_id
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('company_id')
      .eq('user_id', session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profil non trouvé' }, { status: 404 });
    }

    const body = await request.json();
    const { background_color } = body;

    if (!background_color) {
      return NextResponse.json({ error: 'Couleur manquante' }, { status: 400 });
    }

    // Vérifier si une intégration existe déjà
    const { data: existingIntegrations } = await supabase
      .from('company_integrations')
      .select('*')
      .eq('company_id', profile.company_id)
      .limit(1);

    let result;

    if (existingIntegrations && existingIntegrations.length > 0) {
      // Mettre à jour toutes les intégrations existantes
      const { data, error } = await supabase
        .from('company_integrations')
        .update({ background_color })
        .eq('company_id', profile.company_id)
        .select();

      if (error) {
        console.error('Erreur lors de la mise à jour de la couleur:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
      }
      result = data;
    } else {
      // Créer une nouvelle intégration par défaut
      const { data, error } = await supabase
        .from('company_integrations')
        .insert({
          company_id: profile.company_id,
          integration_type: 'other',
          background_color,
          is_active: true
        })
        .select();

      if (error) {
        console.error('Erreur lors de la création de l\'intégration:', error);
        return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({
      success: true,
      background_color,
      integrations: result
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

