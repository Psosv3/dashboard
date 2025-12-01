-- Enable RLS (Row Level Security)
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Créer les tables

-- Table des entreprises
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    chatbot_signature TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table des documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des sessions de chat
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages de chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant')) NOT NULL,
    user_feedback VARCHAR(10) CHECK (user_feedback IN ('like', 'dislike')) DEFAULT NULL,
    feedback_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les colonnes de feedback si elles n'existent pas
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS user_feedback VARCHAR(10) CHECK (user_feedback IN ('like', 'dislike')) DEFAULT NULL;

ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS feedback_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Table des sessions publiques (chatbot externe)
CREATE TABLE IF NOT EXISTS public.public_chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    external_user_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    manual_response BOOLEAN DEFAULT TRUE,
    messenger BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages des sessions publiques
CREATE TABLE IF NOT EXISTS public.public_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255) REFERENCES public.public_chat_sessions(session_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant')) NOT NULL,
    user_feedback VARCHAR(10) CHECK (user_feedback IN ('like', 'dislike')) DEFAULT NULL,
    feedback_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les colonnes de feedback si elles n'existent pas
ALTER TABLE public.public_chat_messages 
ADD COLUMN IF NOT EXISTS user_feedback VARCHAR(10) CHECK (user_feedback IN ('like', 'dislike')) DEFAULT NULL;

ALTER TABLE public.public_chat_messages 
ADD COLUMN IF NOT EXISTS feedback_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Ajouter les colonnes manual_response et messenger si elles n'existent pas
ALTER TABLE public.public_chat_sessions 
ADD COLUMN IF NOT EXISTS manual_response BOOLEAN DEFAULT TRUE;

ALTER TABLE public.public_chat_sessions 
ADD COLUMN IF NOT EXISTS messenger BOOLEAN DEFAULT FALSE;

-- Table des contacts pour le support des entreprises
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    description TEXT,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des intégrations des entreprises
CREATE TABLE IF NOT EXISTS public.company_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    integration_type VARCHAR(50) NOT NULL CHECK (integration_type IN ('facebook', 'whatsapp', 'instagram', 'other')),
    app_token TEXT,
    page_token TEXT,
    verify_token TEXT,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    background_color VARCHAR(20) DEFAULT '#4F46E5',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, integration_type)
);

-- Ajouter la colonne background_color si elle n'existe pas
ALTER TABLE public.company_integrations 
ADD COLUMN IF NOT EXISTS background_color VARCHAR(20) DEFAULT '#4F46E5';

-- Ajouter la colonne general_manual_response si elle n'existe pas
ALTER TABLE public.company_integrations 
ADD COLUMN IF NOT EXISTS general_manual_response BOOLEAN DEFAULT FALSE;

-- Ajouter la colonne extra_prompt si elle n'existe pas
ALTER TABLE public.company_integrations 
ADD COLUMN IF NOT EXISTS extra_prompt TEXT;

-- Ajouter la colonne chatbot_signature si elle n'existe pas
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS chatbot_signature TEXT;

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON public.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_company_id ON public.chat_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_public_chat_sessions_company_id ON public.public_chat_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_public_chat_sessions_external_user ON public.public_chat_sessions(external_user_id);
CREATE INDEX IF NOT EXISTS idx_public_chat_messages_session_id ON public.public_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_company_integrations_company_id ON public.company_integrations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_integrations_type ON public.company_integrations(integration_type);

-- Politiques RLS (Row Level Security)

-- Companies: Les utilisateurs ne peuvent voir que leur entreprise
CREATE POLICY "Users can only see their company" ON public.companies
    FOR ALL USING (
        id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- User profiles: Les utilisateurs ne peuvent voir que leur profil et ceux de leur entreprise
CREATE POLICY "Users can see profiles in their company" ON public.user_profiles
    FOR ALL USING (
        user_id = auth.uid() OR
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Documents: Les utilisateurs ne peuvent voir que les documents de leur entreprise
CREATE POLICY "Users can only access their company documents" ON public.documents
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert documents for their company" ON public.documents
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Chat sessions: Les utilisateurs ne peuvent voir que les sessions de leur entreprise
CREATE POLICY "Users can only access their company chat sessions" ON public.chat_sessions
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert chat sessions for their company" ON public.chat_sessions
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Chat messages: Les utilisateurs ne peuvent voir que les messages des sessions de leur entreprise
CREATE POLICY "Users can only access messages from their company sessions" ON public.chat_messages
    FOR ALL USING (
        session_id IN (
            SELECT cs.id FROM public.chat_sessions cs
            JOIN public.user_profiles up ON cs.company_id = up.company_id
            WHERE up.user_id = auth.uid()
        )
    );

-- Contacts: Les utilisateurs ne peuvent voir que les contacts de leur entreprise
CREATE POLICY "Users can only access their company contacts" ON public.contacts
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert contacts for their company" ON public.contacts
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Company integrations: Les utilisateurs ne peuvent voir que les intégrations de leur entreprise
CREATE POLICY "Users can only access their company integrations" ON public.company_integrations
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert integrations for their company" ON public.company_integrations
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_integrations_updated_at BEFORE UPDATE ON public.company_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS pour les tables
ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.company_integrations ENABLE ROW LEVEL SECURITY;

-- Table des notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    
    -- Liens optionnels vers session/message
    session_id VARCHAR(255) REFERENCES public.public_chat_sessions(session_id) ON DELETE CASCADE,
    message_id VARCHAR(255) REFERENCES public.public_chat_messages(message_id) ON DELETE CASCADE,
    
    -- Type de notification (extensible)
    type VARCHAR(50) NOT NULL,
    
    -- Titre court de la notification
    title VARCHAR(255) NOT NULL,
    
    -- Description détaillée
    content TEXT NOT NULL,
    
    -- Métadonnées JSON flexibles
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Gestion de l'état
    read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Action suggérée (optionnel)
    action_url TEXT,
    action_label VARCHAR(100),
    
    -- Horodatage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON public.notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_session_id ON public.notifications(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Notifications: Les utilisateurs ne peuvent voir que les notifications de leur entreprise
CREATE POLICY "Users can only access their company notifications" ON public.notifications
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Trigger pour mettre à jour updated_at sur notifications
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS pour notifications
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY; 