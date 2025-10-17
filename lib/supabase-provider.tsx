'use client'

import { createContext, useContext, useEffect, useState, useRef, useMemo } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient, User } from '@supabase/auth-helpers-nextjs'

type SupabaseContext = {
  supabase: SupabaseClient
  user: User | null
  loading: boolean
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Utiliser useMemo pour ne créer le client qu'une seule fois
  const supabase = useMemo(() => createClientComponentClient(), [])
  const initialized = useRef(false)

  useEffect(() => {
    // Éviter les double-calls en mode développement (React Strict Mode)
    if (initialized.current) return

    initialized.current = true

    // Récupérer l'utilisateur actuel au chargement initial
    const initializeAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    initializeAuth()

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Context.Provider value={{ supabase, user, loading }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider')
  }
  return context
}

export { SupabaseProvider } 