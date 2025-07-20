'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSupabase } from '@/lib/supabase-provider'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [loading, setLoading] = useState(false)
  const { supabase } = useSupabase()
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Créer le compte utilisateur
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) {
        toast.error(authError.message)
        return
      }

      if (authData.user) {
        // Créer l'entreprise
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .insert({ name: companyName })
          .select()
          .single()

        if (companyError) {
          toast.error('Erreur lors de la création de l\'entreprise')
          return
        }

        // Créer le profil utilisateur
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            company_id: companyData.id,
            role: 'admin'
          })

        if (profileError) {
          toast.error('Erreur lors de la création du profil')
          return
        }

        toast.success('Compte créé avec succès! Vérifiez votre email.')
        router.push('/auth/login')
      }
    } catch (error) {
      toast.error('Erreur lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Créez votre compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ou{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
              connectez-vous à votre compte existant
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                Nom de l'entreprise
              </label>
              <input
                id="company"
                name="company"
                type="text"
                required
                className="input mt-1"
                placeholder="Nom de votre entreprise"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input mt-1"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="input mt-1"
                placeholder="Mot de passe (min. 6 caractères)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              ← Retour à l'accueil
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 