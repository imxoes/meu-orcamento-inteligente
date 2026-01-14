'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserCheck,
  UserX,
  User,
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
  BarChart3
} from 'lucide-react'
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
  role: string
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [upgradeForm, setUpgradeForm] = useState({
    plan: 'BASIC',
    duration: 1,
    durationType: 'months',
    customEndDate: ''
  })
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Buscar estatísticas
      const statsResponse = await fetch('/api/dashboard/admin/stats')
      if (statsResponse.status === 403) {
        setAccessDenied(true)
        return
      }
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
      }

      // Buscar usuários
      const usersResponse = await fetch('/api/dashboard/admin/users?limit=50')
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

  const handleBlockUser = async (userId: string, reason?: string) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/dashboard/admin/users/${userId}/block`, {
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
      const response = await fetch(`/api/dashboard/admin/users/${userId}/block`, {
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

  const handleUpgradeUser = async () => {
    if (!selectedUser) return

    try {
      setActionLoading(selectedUser.id)

      const body: any = {
        plan: upgradeForm.plan,
        duration: upgradeForm.duration,
        durationType: upgradeForm.durationType
      }

      if (upgradeForm.customEndDate) {
        body.customEndDate = upgradeForm.customEndDate
      }

      const response = await fetch(`/api/dashboard/admin/users/${selectedUser.id}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        fetchData() // Recarregar dados
        setShowUserModal(false)
        setUpgradeForm({ plan: 'BASIC', duration: 1, durationType: 'months', customEndDate: '' })
      }
    } catch (error) {
      console.error('Erro ao fazer upgrade:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handlePromoteToAdmin = async (userId: string) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/dashboard/admin/users/${userId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        fetchData() // Recarregar dados
        setShowUserModal(false)
      }
    } catch (error) {
      console.error('Erro ao promover para admin:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDemoteFromAdmin = async (userId: string) => {
    try {
      setActionLoading(userId)
      const response = await fetch(`/api/dashboard/admin/users/${userId}/promote`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        fetchData() // Recarregar dados
        setShowUserModal(false)
      }
    } catch (error) {
      console.error('Erro ao rebaixar admin:', error)
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

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
        <p className="text-zinc-400">Você não tem permissões de administrador para acessar esta área.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white text-xl">Carregando painel admin...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-8 h-8 text-red-500" />
        <div>
          <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
          <p className="text-zinc-400">Gerencie usuários e monitore o sistema</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      className="flex items-center gap-2 px-3 py-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                      Gerenciar
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
            className="bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Gerenciar: {selectedUser.name}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedUser.role === 'ADMIN'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'
              }`}>
                {selectedUser.role}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações do usuário */}
              <div className="space-y-3">
                <h4 className="font-medium text-white border-b border-white/10 pb-2">Informações</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-zinc-400">Email: <span className="text-white">{selectedUser.email}</span></p>
                  <p className="text-zinc-400">Plano: <span className="text-white">{selectedUser.subscriptionPlan}</span></p>
                  <p className="text-zinc-400">Status: <span className={selectedUser.isBlocked ? 'text-red-400' : 'text-green-400'}>
                    {selectedUser.isBlocked ? 'Bloqueado' : 'Ativo'}
                  </span></p>
                  <p className="text-zinc-400">Último Login: <span className="text-white">
                    {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleDateString('pt-BR') : 'Nunca'}
                  </span></p>
                </div>
              </div>

              {/* Ações de administração */}
              <div className="space-y-3">
                <h4 className="font-medium text-white border-b border-white/10 pb-2">Ações de Admin</h4>

                {/* Controle de bloqueio */}
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

                {/* Controle de admin */}
                {selectedUser.role === 'ADMIN' ? (
                  <button
                    onClick={() => handleDemoteFromAdmin(selectedUser.id)}
                    disabled={actionLoading === selectedUser.id}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/20 text-orange-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <User className="w-4 h-4" />
                    Rebaixar de Admin
                  </button>
                ) : (
                  <button
                    onClick={() => handlePromoteToAdmin(selectedUser.id)}
                    disabled={actionLoading === selectedUser.id}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/20 text-yellow-400 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Crown className="w-4 h-4" />
                    Promover para Admin
                  </button>
                )}
              </div>
            </div>

            {/* Seção de controle de planos */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h4 className="font-medium text-white mb-4">Gerenciar Plano de Assinatura</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Seletor de plano */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Plano</label>
                  <select
                    value={upgradeForm.plan}
                    onChange={(e) => setUpgradeForm({...upgradeForm, plan: e.target.value})}
                    className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="FREE">FREE</option>
                    <option value="TRIAL">TRIAL (Teste)</option>
                    <option value="BASIC">BASIC</option>
                    <option value="PREMIUM">PREMIUM</option>
                  </select>
                </div>

                {/* Tipo de duração */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Tipo de Duração</label>
                  <select
                    value={upgradeForm.durationType}
                    onChange={(e) => setUpgradeForm({...upgradeForm, durationType: e.target.value})}
                    disabled={upgradeForm.plan === 'FREE'}
                    className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="days">Dias</option>
                    <option value="weeks">Semanas</option>
                    <option value="months">Meses</option>
                    <option value="years">Anos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Duração */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Duração</label>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={upgradeForm.duration}
                    onChange={(e) => setUpgradeForm({...upgradeForm, duration: parseInt(e.target.value) || 1})}
                    disabled={upgradeForm.plan === 'FREE'}
                    className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    placeholder="Ex: 7, 30, 6..."
                  />
                </div>

                {/* Data específica (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Ou Data Específica</label>
                  <input
                    type="date"
                    value={upgradeForm.customEndDate}
                    onChange={(e) => setUpgradeForm({...upgradeForm, customEndDate: e.target.value})}
                    disabled={upgradeForm.plan === 'FREE'}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Botão de aplicar mudanças */}
              <button
                onClick={handleUpgradeUser}
                disabled={actionLoading === selectedUser.id}
                className="w-full flex items-center justify-center gap-2 p-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/20 text-blue-400 rounded-lg transition-colors disabled:opacity-50 font-medium"
              >
                <Upload className="w-4 h-4" />
                {actionLoading === selectedUser.id ? 'Aplicando...' : `Aplicar Plano ${upgradeForm.plan}`}
              </button>
            </div>

            {/* Botões de controle */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setUpgradeForm({ plan: 'BASIC', duration: 1, durationType: 'months', customEndDate: '' })
                }}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}