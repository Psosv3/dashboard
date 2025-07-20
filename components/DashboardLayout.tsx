'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase-provider'
import { User } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'

interface Profile {
  id: string
  user_id: string
  company_id: string
  role: 'admin' | 'user'
  companies?: {
    id: string
    name: string
  }
}

interface DashboardLayoutProps {
  children: React.ReactNode
  user: User
  profile: Profile
}

export default function DashboardLayout({ children, user, profile }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { supabase } = useSupabase()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Déconnexion réussie')
    router.push('/')
  }

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: '📊' },
    { name: 'Documents', href: '/dashboard/documents', icon: '📄' },
    { name: 'Chatbot', href: '/dashboard/chat', icon: '🤖' },
    { name: 'Paramètres', href: '/dashboard/settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Fermer sidebar</span>
                <span className="text-white text-xl">×</span>
              </button>
            </div>
            <SidebarContent navigation={navigation} profile={profile} />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <SidebarContent navigation={navigation} profile={profile} />
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-50">
          <button
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Ouvrir sidebar</span>
            <span className="text-xl">☰</span>
          </button>
        </div>

        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div></div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="btn-outline"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ navigation, profile }: { navigation: any[], profile: Profile }) {
  return (
    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
      <div className="flex items-center flex-shrink-0 px-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {profile.companies?.name}
        </h2>
      </div>
      <nav className="mt-5 flex-1 px-2 space-y-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            {item.name}
          </Link>
        ))}
      </nav>
    </div>
  )
} 