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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON public.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON public.documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_company_id ON public.chat_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);

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