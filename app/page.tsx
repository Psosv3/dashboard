import { createServerSupabaseClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen home-page">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-6">
            Dashboard Chatbot RAG
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Gérez votre chatbot IA personnalisé avec vos propres documents
          </p>
          <p className="text-lg mb-12 opacity-80">
            Créez des expériences conversationnelles sur mesure pour votre entreprise
          </p>
          
          <div className="flex justify-center gap-4">
            <Link 
              href="/auth/login"
              className="btn-primary text-lg px-8 py-3"
            >
              Se connecter
            </Link>
            <Link 
              href="/auth/register"
              className="btn-outline text-lg px-8 py-3 border-white text-white hover:bg-white hover:text-purple-600"
            >
              Créer un compte
            </Link>
          </div>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 text-white">
          <div className="text-center">
            <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Gérez vos documents</h3>
            <p className="opacity-80">Uploadez et organisez vos fichiers PDF et DOCX par entreprise</p>
          </div>

          <div className="text-center">
            <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Chatbot intelligent</h3>
            <p className="opacity-80">IA conversationnelle entraînée sur vos données spécifiques</p>
          </div>

          <div className="text-center">
            <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-entreprise</h3>
            <p className="opacity-80">Isolation complète des données par organisation</p>
          </div>
        </div>
      </div>
    </div>
  )
} 