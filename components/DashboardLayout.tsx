'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase-provider'
import { User } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'
import Image from 'next/image'

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
    { 
      name: 'Tableau de bord', 
      href: '/dashboard', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4m4-4v4m4-4v4M8 13v4m4-4v4m4-4v4" />
        </svg>
      )
    },
    { 
      name: 'Documentation', 
      href: '/dashboard/documents', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      name: 'Chatbot', 
      href: '/dashboard/chat', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a8.841 8.841 0 01-4.255-.949L3 20l1.338-3.123C2.493 12.767 2 11.434 2 10c0-4.418 4.03-8 9-8s9 3.134 9 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" />
        </svg>
      )
    },
    { 
      name: 'Statistiques', 
      href: '/dashboard/stats', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      name: 'Mon Entreprise', 
      href: '/dashboard/company', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      name: 'Paramètres', 
      href: '/dashboard/settings', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white/95 backdrop-blur-md shadow-2xl">
            <div className="absolute top-4 right-4">
              <button
                className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent navigation={navigation} profile={profile} />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white/80 backdrop-blur-md border-r border-white/20 shadow-xl">
          <SidebarContent navigation={navigation} profile={profile} />
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-72 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="sticky top-0 z-30 md:hidden bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-slate-700 font-medium hidden sm:block">
                  {user.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop header */}
        <header className="hidden md:block bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-6">
            <div className="flex justify-between items-center">
              <div></div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{profile.companies?.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200 border border-slate-200 hover:border-slate-300"
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
    <div className="flex-1 flex flex-col">
      {/* Logo and company name */}
      <div className="flex items-center px-6 py-8 border-b border-white/20">
        <div className="flex items-center space-x-3">
          {/* <Image 
            src="/images/logo.webp" 
            alt="Onexus" 
            width={40} 
            height={40}
            className="rounded-lg"
          /> */}
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {profile.companies?.name}
            </h2>
            <p className="text-xs text-slate-500">Julia - Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="group flex items-center px-4 py-3 text-sm font-medium rounded-xl text-slate-600 hover:bg-white/60 hover:text-slate-900 transition-all duration-200 hover:shadow-sm"
          >
            <span className="mr-3 text-slate-500 group-hover:text-slate-700 group-hover:scale-110 transition-all duration-200">
              {item.icon}
            </span>
            {item.name}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-6 border-t border-white/20">
        <div className="text-center">
          <p className="text-xs text-slate-500">
            © 2025 Onexus
          </p>
        </div>
      </div>
    </div>
  )
} 