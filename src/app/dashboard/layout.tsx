'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  CreditCard,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Brain,
  MessageCircle,
  Zap,
  FileText,
  Settings,
  Menu,
  X,
  User,
  Eye,
  EyeOff,
  LogOut,
  Shield
} from 'lucide-react'
import { ValuesVisibilityProvider, useValuesVisibility } from '@/contexts/ValuesVisibilityContext'

const navigationSections = [
  {
    title: 'Principal',
    items: [
      { name: 'Visão Geral', href: '/dashboard', icon: Home },
      { name: 'Transações', href: '/dashboard/transactions', icon: CreditCard },
      { name: 'Metas', href: '/dashboard/goals', icon: Target },
      { name: 'Investimentos', href: '/dashboard/investments', icon: TrendingUp },
      { name: 'Gastos', href: '/dashboard/expenses', icon: TrendingDown },
      { name: 'Análises', href: '/dashboard/analysis', icon: BarChart3 },
    ]
  },
  {
    title: 'Inteligência',
    items: [
      { name: 'IA Insights', href: '/dashboard/ai-insights', icon: Brain },
      { name: 'Dicas Inteligentes', href: '/dashboard/smart-tips', icon: Zap },
      { name: 'Relatórios IA', href: '/dashboard/ai-reports', icon: FileText },
    ]
  },
  {
    title: 'Bots',
    items: [
      { name: 'Bot Telegram', href: '/dashboard/telegram-bot', icon: MessageCircle },
      { name: 'Bot WhatsApp', href: '/dashboard/whatsapp-bot', icon: MessageCircle },
    ]
  },
  {
    title: 'Sistema',
    items: [
      { name: 'Assinatura', href: '/dashboard/subscription', icon: CreditCard },
      { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
    ]
  },
  {
    title: 'Administração',
    items: [
      { name: 'Painel Admin', href: '/dashboard/admin', icon: Shield, adminOnly: true },
    ]
  }
]

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const pathname = usePathname()
  const { showValues, toggleValues } = useValuesVisibility()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      if (response.ok) {
        setUser(data.user)
      } else if (response.status === 401) {
        console.log('User not authenticated, redirecting to login')
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/10 to-black pointer-events-none"></div>

      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-black/80 backdrop-blur-xl border-r border-purple-500/20 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Meu Orçamento Inteligente
            </h1>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              {navigationSections.map((section) => {
                // Filtrar itens admin se usuário não for admin
                const filteredItems = section.items.filter(item => {
                  if (item.adminOnly && user?.role !== 'ADMIN') {
                    return false
                  }
                  return true
                })

                // Não mostrar seção se não tiver itens
                if (filteredItems.length === 0) return null

                return (
                  <li key={section.title}>
                    <div className="text-xs font-semibold leading-6 text-zinc-500 uppercase tracking-wider mb-2">
                      {section.title}
                    </div>
                    <ul role="list" className="-mx-2 space-y-1">
                      {filteredItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold transition-colors ${
                                isActive
                                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-purple-500/30'
                                  : 'text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10'
                              }`}
                            >
                              <item.icon className="h-6 w-6 shrink-0" />
                              {item.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User area */}
          <div className="border-t border-white/10 pt-4">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-x-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-xl">
                {user?.emoji || '😊'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full mt-2 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sair da conta
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        className="relative z-50 lg:hidden"
      >
        <motion.div
          initial={false}
          animate={{ opacity: sidebarOpen ? 1 : 0 }}
          className="fixed inset-0 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />

        <div className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto bg-black/95 backdrop-blur-xl border-r border-purple-500/20 px-6 pb-4">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Meu Orçamento
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="mt-5">
            <ul role="list" className="space-y-6">
              {navigationSections.map((section) => {
                const filteredItems = section.items.filter(item => {
                  if (item.adminOnly && user?.role !== 'ADMIN') {
                    return false
                  }
                  return true
                })

                if (filteredItems.length === 0) return null

                return (
                  <li key={section.title}>
                    <div className="text-xs font-semibold leading-6 text-zinc-500 uppercase tracking-wider mb-2">
                      {section.title}
                    </div>
                    <ul role="list" className="space-y-1">
                      {filteredItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold transition-colors ${
                                isActive
                                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-purple-500/30'
                                  : 'text-zinc-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10'
                              }`}
                            >
                              <item.icon className="h-6 w-6 shrink-0" />
                              {item.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Mobile logout button */}
          <div className="px-6 py-3 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-purple-500/20 bg-black/80 backdrop-blur-xl px-4 shadow-sm lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-400 hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center justify-center flex-1">
              <h1 className="text-xl font-semibold text-white">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Orbi</span>
                <span className="text-white"> - Dashboard</span>
              </h1>
            </div>
          </div>
          <button
            onClick={toggleValues}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
          >
            {showValues ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
        </div>

        {/* Desktop header */}
        <div className="hidden lg:flex sticky top-0 z-40 h-16 shrink-0 items-center gap-x-4 border-b border-purple-500/20 bg-black/80 backdrop-blur-xl px-8 shadow-sm">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex items-center justify-center flex-1">
              <h1 className="text-xl font-semibold text-white">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Orbi</span>
                <span className="text-white"> - Dashboard</span>
              </h1>
            </div>
          </div>
          <button
            onClick={toggleValues}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
          >
            {showValues ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
        </div>

        {/* Page content */}
        <main className="py-6 px-4 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ValuesVisibilityProvider>
      <DashboardLayoutContent>
        {children}
      </DashboardLayoutContent>
    </ValuesVisibilityProvider>
  )
}