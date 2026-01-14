'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Users,
  UserCheck,
  UserX,
  Crown,
  DollarSign,
  TrendingUp,
  Activity,
  Shield,
  Search,
  Filter,
  MoreHorizontal,
  Ban,
  CheckCircle,
  Upload,
  Calendar,
  BarChart3,
  LogOut
} from 'lucide-react'
import SimpleBackground from '@/components/ui/simple-background'
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts'

interface Stats {
  users: {
    total: number
    active: number
    blocked: number
    today: number
    thisWeek: number
    thisMonth: number
  }
  plans: {
    free: number
    basic: number
    premium: number
    distribution: Array<{ name: string; value: number; color: string }>
  }
  transactions: {
    total: number
    today: number
    thisWeek: number
    thisMonth: number
  }
  revenue: {
    total: number
    thisMonth: number
  }
  charts: {
    registrations: Array<{ date: string; users: number }>
  }
  topCategories: Array<{ name: string; transactions: number }>
  recentActivities: Array<{
    id: string
    action: string
    description: string
    admin: string
    createdAt: string
  }>
}

interface User {
  id: string
  name: string
  email: string
  isActive: boolean
  isBlocked: boolean
  blockedReason?: string
  subscriptionPlan: string
  subscriptionStatus: string
  lastLoginAt?: string
  createdAt: string
  provider?: string
  _count: {
    transactions: number
    goals: number
    investments: number
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Buscar estatísticas
      const statsResponse = await fetch('/api/admin/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      // Buscar usuários
      const usersResponse = await fetch('/api/admin/users?limit=50')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
      }
    } catch (error) {
      console.error('Erro ao carregar dados admin:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
      router.push('/admin/login')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  const handleBlockUser = async (userId: string, reason?: string) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason || 'Bloqueado pelo admin' })
      })

      if (response.ok) {
        fetchData() // Recarregar dados
        setShowUserModal(false)
      }
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnblockUser = async (userId: string) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/admin/users/${userId}/block`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchData() // Recarregar dados
        setShowUserModal(false)
      }
    } catch (error) {
      console.error('Erro ao desbloquear usuário:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpgradeUser = async (userId: string, plan: string, duration: number) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/admin/users/${userId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, duration })
      })

      if (response.ok) {
        fetchData() // Recarregar dados
        setShowUserModal(false)
      }
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())

    if (statusFilter === 'active') return matchesSearch && user.isActive && !user.isBlocked
    if (statusFilter === 'blocked') return matchesSearch && user.isBlocked
    if (statusFilter === 'vip') return matchesSearch && ['BASIC', 'PREMIUM'].includes(user.subscriptionPlan)

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <SimpleBackground />
        <div className="text-white text-xl">Carregando dashboard admin...</div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: -1 }}>
        <SimpleBackground />
      </div>

      <div className="min-h-screen relative p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-500" />
              Painel Administrativo
            </h1>
            <p className="text-zinc-400">Gerencie usuários e monitore o sistema</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 text-red-400 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Total de Usuários</p>
                  <p className="text-white text-2xl font-bold">{stats.users.total}</p>
                  <p className="text-blue-400 text-xs">+{stats.users.thisMonth} este mês</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Usuários Ativos</p>
                  <p className="text-white text-2xl font-bold">{stats.users.active}</p>
                  <p className="text-green-400 text-xs">+{stats.users.thisWeek} esta semana</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Usuários VIP</p>
                  <p className="text-white text-2xl font-bold">{stats.plans.basic + stats.plans.premium}</p>
                  <p className="text-purple-400 text-xs">{stats.plans.basic} Basic + {stats.plans.premium} Premium</p>
                </div>
                <Crown className="w-8 h-8 text-purple-500" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm">Receita Total</p>
                  <p className="text-white text-2xl font-bold">R$ {stats.revenue.total.toFixed(2)}</p>
                  <p className="text-yellow-400 text-xs">R$ {stats.revenue.thisMonth.toFixed(2)} este mês</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-500" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Charts Section */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Registrations Chart */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Registros por Dia (30 dias)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.charts.registrations}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  />
                  <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Plans Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Distribuição de Planos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.plans.distribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.plans.distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* Users Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Gerenciar Usuários</h3>

            <div className="flex gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
              </div>

              {/* Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="blocked">Bloqueados</option>
                <option value="vip">VIP</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-zinc-300 font-medium">Usuário</th>
                  <th className="text-left py-3 px-4 text-zinc-300 font-medium">Plano</th>
                  <th className="text-left py-3 px-4 text-zinc-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-zinc-300 font-medium">Último Login</th>
                  <th className="text-left py-3 px-4 text-zinc-300 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.slice(0, 10).map((user) => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">{user.name}</p>
                        <p className="text-zinc-400 text-sm">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.subscriptionPlan === 'PREMIUM' ? 'bg-purple-500/20 text-purple-400' :
                        user.subscriptionPlan === 'BASIC' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {user.subscriptionPlan}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {user.isBlocked ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                          Bloqueado
                        </span>
                      ) : user.isActive ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 text-sm">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          setSelectedUser(user)
                          setShowUserModal(true)
                        }}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* User Action Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUserModal(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-4">Ações para {selectedUser.name}</h3>

              <div className="space-y-3">
                {selectedUser.isBlocked ? (
                  <button
                    onClick={() => handleUnblockUser(selectedUser.id)}
                    disabled={actionLoading === selectedUser.id}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/20 text-green-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Desbloquear Usuário
                  </button>
                ) : (
                  <button
                    onClick={() => handleBlockUser(selectedUser.id)}
                    disabled={actionLoading === selectedUser.id}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" />
                    Bloquear Usuário
                  </button>
                )}

                {selectedUser.subscriptionPlan === 'FREE' && (
                  <>
                    <button
                      onClick={() => handleUpgradeUser(selectedUser.id, 'BASIC', 1)}
                      disabled={actionLoading === selectedUser.id}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/20 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      Upgrade para BASIC (1 mês)
                    </button>

                    <button
                      onClick={() => handleUpgradeUser(selectedUser.id, 'PREMIUM', 1)}
                      disabled={actionLoading === selectedUser.id}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/20 text-purple-400 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Crown className="w-4 h-4" />
                      Upgrade para PREMIUM (1 mês)
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setShowUserModal(false)}
                className="w-full mt-4 p-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </>
  )
}