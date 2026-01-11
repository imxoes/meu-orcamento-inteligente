'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  UserCheck,
  UserX,
  Crown,
  CreditCard,
  TrendingUp,
  Shield,
  Search,
  Filter,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react'
import SimpleBackground from '@/components/ui/simple-background'

interface User {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
  subscriptionStatus: string
  subscriptionPlan: string | null
  trialEndsAt: string | null
  createdAt: string
  lastLoginAt: string | null
  emailVerified: string | null
  _count: {
    transactions: number
    goals: number
    investments: number
  }
}

interface Stats {
  users: {
    total: number
    active: number
    trial: number
    basic: number
    premium: number
  }
  content: {
    transactions: number
    goals: number
    investments: number
  }
  recentUsers: User[]
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<User>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/stats')
      ])

      if (!usersRes.ok) {
        const errorData = await usersRes.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('Erro ao carregar usuários:', errorData)
        if (usersRes.status === 401 || usersRes.status === 403) {
          alert('❌ Você não tem permissão para acessar esta página. Apenas administradores podem acessar.')
          window.location.href = '/dashboard'
          return
        }
      } else {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (!statsRes.ok) {
        const errorData = await statsRes.json().catch(() => ({ error: 'Erro desconhecido' }))
        console.error('Erro ao carregar estatísticas:', errorData)
        if (statsRes.status === 401 || statsRes.status === 403) {
          return // Já tratado acima
        }
      } else {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      alert('❌ Erro ao carregar dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user.id)
    setEditData({
      subscriptionPlan: user.subscriptionPlan || 'FREE',
      subscriptionStatus: user.subscriptionStatus,
      isActive: user.isActive,
      role: user.role,
      trialEndsAt: user.trialEndsAt
    })
  }

  const handleSave = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        await fetchData()
        setEditingUser(null)
        setEditData({})
        alert('✅ Usuário atualizado com sucesso!')
      } else {
        const data = await response.json()
        alert(`❌ Erro: ${data.error}`)
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      alert('❌ Erro ao atualizar usuário')
    }
  }

  const handleCancel = () => {
    setEditingUser(null)
    setEditData({})
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.isActive) ||
      (filterStatus === 'inactive' && !user.isActive) ||
      (filterStatus === 'trial' && user.subscriptionStatus === 'TRIAL') ||
      (filterStatus === 'basic' && user.subscriptionPlan === 'BASIC') ||
      (filterStatus === 'premium' && user.subscriptionPlan === 'PREMIUM') ||
      (filterStatus === 'admin' && user.role === 'ADMIN')

    return matchesSearch && matchesFilter
  })

  const getPlanBadge = (plan: string | null) => {
    const colors = {
      FREE: 'bg-zinc-500/20 text-zinc-300 font-medium',
      BASIC: 'bg-blue-500/20 text-blue-400',
      PREMIUM: 'bg-purple-500/20 text-purple-400'
    }
    return colors[plan as keyof typeof colors] || colors.FREE
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      TRIAL: 'bg-yellow-500/20 text-yellow-400',
      ACTIVE: 'bg-green-500/20 text-green-400',
      EXPIRED: 'bg-red-500/20 text-red-400',
      CANCELLED: 'bg-zinc-500/20 text-zinc-300 font-medium'
    }
    return colors[status as keyof typeof colors] || colors.TRIAL
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-300 font-medium">Carregando...</div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: -1 }}>
        <SimpleBackground />
      </div>
      <div className="min-h-screen relative p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold drop-shadow-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Painel Administrativo
          </h1>
          <p className="text-zinc-300 font-medium mt-1">Controle total sobre usuários e assinaturas</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <Shield className="h-5 w-5 text-red-400" />
          <span className="text-sm font-semibold text-red-400">Modo Admin</span>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Total de Usuários</p>
                <p className="text-3xl font-bold drop-shadow-lg text-white mt-2">{stats.users.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Usuários Ativos</p>
                <p className="text-3xl font-bold drop-shadow-lg text-green-400 mt-2">{stats.users.active}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Plano Básico</p>
                <p className="text-3xl font-bold drop-shadow-lg text-blue-400 mt-2">{stats.users.basic}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Plano Premium</p>
                <p className="text-3xl font-bold drop-shadow-lg text-purple-400 mt-2">{stats.users.premium}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-400" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-300 font-medium" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-zinc-300 font-medium" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-black/30 backdrop-blur-md border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
              <option value="trial">Trial</option>
              <option value="basic">Básico</option>
              <option value="premium">Premium</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-300 font-medium uppercase">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-300 font-medium uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-300 font-medium uppercase">Plano</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-300 font-medium uppercase">Dados</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-zinc-300 font-medium uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white">{user.name}</p>
                        {user.role === 'ADMIN' && (
                          <Shield className="h-4 w-4 text-purple-400" />
                        )}
                      </div>
                      <p className="text-sm text-zinc-300 font-medium">{user.email}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Cadastrado em {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <div className="space-y-2">
                        <select
                          value={editData.subscriptionStatus || 'TRIAL'}
                          onChange={(e) => setEditData({ ...editData, subscriptionStatus: e.target.value })}
                          className="w-full px-3 py-1 bg-black/30 backdrop-blur-md border border-white/10 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="TRIAL">TRIAL</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="EXPIRED">EXPIRED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editData.isActive !== undefined ? editData.isActive : user.isActive}
                            onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-xs text-zinc-300 font-medium">Conta Ativa</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getStatusBadge(user.subscriptionStatus)}`}>
                          {user.subscriptionStatus}
                        </span>
                        <div className="flex items-center gap-2">
                          {user.isActive ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-red-400">
                              <X className="h-3 w-3" />
                              Bloqueado
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <div className="space-y-2">
                        <select
                          value={editData.subscriptionPlan || 'FREE'}
                          onChange={(e) => setEditData({ ...editData, subscriptionPlan: e.target.value })}
                          className="w-full px-3 py-1 bg-black/30 backdrop-blur-md border border-white/10 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="FREE">FREE</option>
                          <option value="BASIC">BASIC</option>
                          <option value="PREMIUM">PREMIUM</option>
                        </select>
                        {user.role !== 'ADMIN' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={editData.role === 'ADMIN'}
                              onChange={(e) => setEditData({ ...editData, role: e.target.checked ? 'ADMIN' : 'USER' })}
                              className="rounded"
                            />
                            <span className="text-xs text-zinc-300 font-medium">Tornar Admin</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${getPlanBadge(user.subscriptionPlan)}`}>
                        {user.subscriptionPlan || 'FREE'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-zinc-300 font-medium space-y-1">
                      <p>💰 {user._count.transactions} transações</p>
                      <p>🎯 {user._count.goals} metas</p>
                      <p>📈 {user._count.investments} investimentos</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUser === user.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSave(user.id)}
                          className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors"
                          title="Salvar"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                        title="Editar usuário"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 text-zinc-300 font-medium">
          Nenhum usuário encontrado
        </div>
      )}
      </div>
    </>
  )
}
