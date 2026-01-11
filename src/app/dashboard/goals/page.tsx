'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit2,
  Trash2,
  CheckCircle,
  PlayCircle,
  PauseCircle,
  Award,
  PiggyBank,
  X
} from 'lucide-react'
import { useValuesVisibility, formatCurrency } from '@/contexts/ValuesVisibilityContext'
import SimpleBackground from '@/components/ui/simple-background'

type Goal = {
  id: string
  title: string
  description: string | null
  currentAmount: number
  targetAmount: number
  targetDate: string | null
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED'
  createdAt: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const { showValues } = useValuesVisibility()

  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState('all')
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    targetDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  
  // Add money to goal state
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [addAmount, setAddAmount] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/goals', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)

    if (!formData.title.trim() || !formData.targetAmount) {
      setFormError('Título e valor são obrigatórios')
      setFormLoading(false)
      return
    }

    if (parseFloat(formData.targetAmount) <= 0) {
      setFormError('O valor deve ser maior que zero')
      setFormLoading(false)
      return
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          targetAmount: parseFloat(formData.targetAmount),
          targetDate: formData.targetDate || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGoals([data.goal, ...goals])
        setShowAddForm(false)
        setFormData({
          title: '',
          description: '',
          targetAmount: '',
          targetDate: '',
          priority: 'medium'
        })
        fetchGoals() // Refresh list
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao criar meta' }))
        setFormError(errorData.error || 'Erro ao criar meta')
      }
    } catch (error) {
      setFormError('Erro de conexão. Tente novamente.')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (goalId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        setGoals(goals.filter(g => g.id !== goalId))
      }
    } catch (error) {
      console.error('Error deleting goal:', error)
    }
  }

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedGoal) return

    setAddError('')
    setAddLoading(true)

    if (!addAmount || parseFloat(addAmount) <= 0) {
      setAddError('Digite um valor válido')
      setAddLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/goals/${selectedGoal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(addAmount),
          action: 'add'
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Update goal in list
        setGoals(goals.map(g => g.id === selectedGoal.id ? data.goal : g))
        setSelectedGoal(null)
        setAddAmount('')
        fetchGoals() // Refresh to get updated stats
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao adicionar valor' }))
        setAddError(errorData.error || 'Erro ao adicionar valor')
      }
    } catch (error) {
      setAddError('Erro de conexão. Tente novamente.')
    } finally {
      setAddLoading(false)
    }
  }

  const filteredGoals = goals.filter(goal => {
    if (selectedFilter === 'all') return true
    if (selectedFilter === 'active') return goal.status === 'ACTIVE'
    if (selectedFilter === 'completed') return goal.status === 'COMPLETED'
    if (selectedFilter === 'paused') return goal.status === 'PAUSED'
    return true
  })

  const activeGoals = goals.filter(goal => goal.status === 'ACTIVE')
  const completedGoals = goals.filter(goal => goal.status === 'COMPLETED')
  const totalSaved = goals.reduce((sum, goal) => sum + goal.currentAmount, 0)
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'ACTIVE': return <PlayCircle className="w-5 h-5 text-blue-400" />
      case 'PAUSED': return <PauseCircle className="w-5 h-5 text-yellow-400" />
      default: return <Target className="w-5 h-5 text-zinc-400" />
    }
  }

  const getDaysUntilDeadline = (deadline: string | null) => {
    if (!deadline) return null
    const today = new Date()
    const targetDate = new Date(deadline)
    const diffTime = targetDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-400">Carregando metas...</p>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: -1 }}>
        <SimpleBackground />
      </div>
      <div className="min-h-screen relative space-y-6 p-6">
      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/25 backdrop-blur-md border border-blue-400/20 rounded-xl shadow-2xl ring-1 ring-blue-400/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Metas Ativas</p>
                <p className="text-white text-2xl font-bold drop-shadow-lg mt-1">{activeGoals.length}</p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-black/25 backdrop-blur-md border border-blue-400/20 rounded-xl shadow-2xl ring-1 ring-blue-400/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Concluídas</p>
                <p className="text-white text-2xl font-bold drop-shadow-lg mt-1">{completedGoals.length}</p>
              </div>
              <Award className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-black/25 backdrop-blur-md border border-blue-400/20 rounded-xl shadow-2xl ring-1 ring-blue-400/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Total Economizado</p>
                <p className="text-white text-2xl font-bold drop-shadow-lg mt-1">{formatCurrency(totalSaved, showValues)}</p>
              </div>
              <PiggyBank className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-black/25 backdrop-blur-md border border-blue-400/20 rounded-xl shadow-2xl ring-1 ring-blue-400/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Meta Total</p>
                <p className="text-white text-2xl font-bold drop-shadow-lg mt-1">{formatCurrency(totalTarget, showValues)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex gap-4">
              {['all', 'active', 'completed', 'paused'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    selectedFilter === filter
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20'
                  }`}
                >
                  {filter === 'all' && 'Todas'}
                  {filter === 'active' && 'Ativas'}
                  {filter === 'completed' && 'Concluídas'}
                  {filter === 'paused' && 'Pausadas'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nova Meta
            </button>
          </div>
        </div>
      </motion.div>

      {/* Goals Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {filteredGoals.map((goal) => {
          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
          const daysLeft = getDaysUntilDeadline(goal.targetDate)
          const isOverdue = daysLeft !== null && daysLeft < 0 && goal.status !== 'COMPLETED'

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(goal.status)}
                    <h3 className="text-white font-bold drop-shadow-lg text-lg">{goal.title}</h3>
                  </div>
                  {goal.description && (
                    <p className="text-zinc-300 font-medium text-sm line-clamp-2">{goal.description}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(goal.id)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Progress */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300 font-medium">Progresso</span>
                  <span className="text-sm font-medium text-white">{progress.toFixed(1)}%</span>
                </div>

                <div className="w-full bg-white/10 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      goal.status === 'COMPLETED'
                        ? 'bg-gradient-to-r from-green-500 to-green-400'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-400">{formatCurrency(goal.currentAmount, showValues)}</span>
                  <span className="text-zinc-300 font-medium">{formatCurrency(goal.targetAmount, showValues)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-300 font-medium">
                      {goal.status === 'ACTIVE' && 'Ativa'}
                      {goal.status === 'COMPLETED' && 'Concluída'}
                      {goal.status === 'PAUSED' && 'Pausada'}
                    </span>
                  </div>

                  {goal.targetDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-zinc-300" />
                      <span className={`${isOverdue ? 'text-red-400' : 'text-zinc-300 font-medium'}`}>
                        {goal.status === 'COMPLETED'
                          ? 'Concluída'
                          : isOverdue
                            ? `${Math.abs(daysLeft!)} dias em atraso`
                            : daysLeft === 0
                              ? 'Hoje'
                              : daysLeft === 1
                                ? '1 dia'
                                : `${daysLeft} dias`
                        }
                      </span>
                    </div>
                  )}
                </div>

                {goal.status !== 'COMPLETED' && (
                  <button
                    onClick={() => setSelectedGoal(goal)}
                    className="w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Dinheiro
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {filteredGoals.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg">Nenhuma meta encontrada</p>
          <p className="text-zinc-500 text-sm">Crie sua primeira meta financeira para começar!</p>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Nova Meta</h3>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setFormError('')
                  setFormData({
                    title: '',
                    description: '',
                    targetAmount: '',
                    targetDate: '',
                    priority: 'medium'
                  })
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Título da Meta *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Viagem para Europa"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva sua meta..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Valor da Meta (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Data Limite (opcional)
                </label>
                <input
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {formError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setFormError('')
                    setFormData({
                      title: '',
                      description: '',
                      targetAmount: '',
                      targetDate: '',
                      priority: 'medium'
                    })
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-700/50 hover:bg-zinc-700/70 text-zinc-300 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? 'Criando...' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Money Modal */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Adicionar Dinheiro</h3>
                <p className="text-zinc-400 text-sm mt-1">Meta: {selectedGoal.title}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedGoal(null)
                  setAddAmount('')
                  setAddError('')
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">Valor Atual</span>
                <span className="text-white font-semibold">{formatCurrency(selectedGoal.currentAmount, showValues)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Meta</span>
                <span className="text-zinc-300">{formatCurrency(selectedGoal.targetAmount, showValues)}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-sm">Faltam</span>
                  <span className="text-green-400 font-semibold">
                    {formatCurrency(selectedGoal.targetAmount - selectedGoal.currentAmount, showValues)}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleAddMoney} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Valor a Adicionar (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedGoal.targetAmount - selectedGoal.currentAmount}
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-green-500/50"
                  required
                  autoFocus
                />
                <p className="text-zinc-500 text-xs mt-1">
                  Máximo: {formatCurrency(selectedGoal.targetAmount - selectedGoal.currentAmount, showValues)}
                </p>
              </div>

              {addError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {addError}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGoal(null)
                    setAddAmount('')
                    setAddError('')
                  }}
                  className="flex-1 px-4 py-2 bg-zinc-700/50 hover:bg-zinc-700/70 text-zinc-300 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addLoading || !addAmount || parseFloat(addAmount) <= 0}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addLoading ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </div>
    </>
  )
}
