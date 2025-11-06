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
      background_color: integrations && integrations.length > 0 ? integrations[0].background_color : '#4F46E5',
      general_manual_response: integrations && integrations.length > 0 ? integrations[0].general_manual_response : false,
      extra_prompt: integrations && integrations.length > 0 ? integrations[0].extra_prompt : ''
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
    const { background_color, chatbot_signature, general_manual_response, extra_prompt } = body;

    if (!background_color) {
      return NextResponse.json({ error: 'Couleur manquante' }, { status: 400 });
    }

    // Mettre à jour la signature du chatbot dans la table companies
    if (chatbot_signature !== undefined) {
      const { error: companyUpdateError } = await supabase
        .from('companies')
        .update({ chatbot_signature })
        .eq('id', profile.company_id);

      if (companyUpdateError) {
        console.error('Erreur lors de la mise à jour de la signature:', companyUpdateError);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour de la signature' }, { status: 500 });
      }
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
      const updateData: any = { background_color };
      if (general_manual_response !== undefined) {
        updateData.general_manual_response = general_manual_response;
      }
      if (extra_prompt !== undefined) {
        updateData.extra_prompt = extra_prompt;
      }

      const { data, error } = await supabase
        .from('company_integrations')
        .update(updateData)
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
          general_manual_response: general_manual_response !== undefined ? general_manual_response : false,
          extra_prompt: extra_prompt || '',
          is_active: true
        })
        .select();

      if (error) {
        console.error('Erreur lors de la création de l\'intégration:', error);
        return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
      }
      result = data;
    }

    // Rafraîchir le cache du backend Python
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/refresh_companies/`, {
        method: 'GET',
      });
    } catch (error) {
      console.log('Impossible de rafraîchir le cache du backend:', error);
      // Ne pas bloquer la réponse si le rafraîchissement échoue
    }

    return NextResponse.json({
      success: true,
      background_color,
      chatbot_signature,
      general_manual_response: general_manual_response !== undefined ? general_manual_response : false,
      extra_prompt: extra_prompt || '',
      integrations: result
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

