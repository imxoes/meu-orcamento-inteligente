'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Target,
  Plus,
  ArrowRight,
  BarChart3,
  Settings,
  PieChart
} from 'lucide-react'
import { useValuesVisibility, formatCurrency } from '@/contexts/ValuesVisibilityContext'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
}

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function Dashboard() {
  const [currentDate] = useState(new Date())
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [investments, setInvestments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { showValues } = useValuesVisibility()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch('/api/user/profile', {
          credentials: 'include'
        })
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData.user)
        }

        // Fetch stats
        const statsResponse = await fetch('/api/dashboard/stats', {
          credentials: 'include'
        })
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        // Fetch recent transactions (need more for category calculation)
        const transactionsResponse = await fetch('/api/transactions?limit=100', {
          credentials: 'include'
        })
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json()
          setTransactions(transactionsData.transactions || [])
        }

        // Fetch goals
        const goalsResponse = await fetch('/api/goals', {
          credentials: 'include'
        })
        if (goalsResponse.ok) {
          const goalsData = await goalsResponse.json()
          setGoals(goalsData.goals || [])
        }

        // Fetch investments
        const investmentsResponse = await fetch('/api/investments', {
          credentials: 'include'
        })
        if (investmentsResponse.ok) {
          const investmentsData = await investmentsResponse.json()
          setInvestments(investmentsData.investments || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white">Olá, {user?.name ? String(user.name) : 'Usuário'}!</h1>
            <p className="text-zinc-500 text-lg">
              {formatDate(currentDate).toLowerCase()}
            </p>
          </div>

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border border-purple-500/20 text-zinc-400 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Configurações
          </Link>
        </div>

        {/* Mini Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm">Saldo Total</p>
                <p className="text-white text-xl font-semibold">{formatCurrency(stats?.totalBalance || 0, showValues)}</p>
              </div>
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm">Receitas do Mês</p>
                <p className="text-white text-xl font-semibold">{formatCurrency(stats?.monthlyIncome || 0, showValues)}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm">Gastos do Mês</p>
                <p className="text-white text-xl font-semibold">{formatCurrency(Math.abs(stats?.monthlyExpenses || 0), showValues)}</p>
              </div>
              <TrendingDown className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm">Economia do Mês</p>
                <p className="text-white text-xl font-semibold">{formatCurrency(stats?.monthlySavings || 0, showValues)}</p>
              </div>
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm">Total Investimentos</p>
                <p className="text-white text-xl font-semibold">
                  {formatCurrency(
                    investments.reduce((sum, inv) => sum + (inv.currentAmount || 0), 0),
                    showValues
                  )}
                </p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-blue-500/5 border border-purple-500/20 rounded-lg backdrop-blur-sm"
        >
          <div className="p-6 border-b border-purple-500/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Transações Recentes</h2>
              <Link
                href="/dashboard/transactions"
                className="text-sm text-zinc-400 hover:text-blue-400 transition-colors"
              >
                Ver todas
              </Link>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-zinc-500">Carregando...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500">Nenhuma transação registrada</p>
                <Link
                  href="/dashboard/transactions"
                  className="text-sm text-blue-400 hover:text-purple-400 transition-colors"
                >
                  Adicionar primeira transação
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'INCOME' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {transaction.type === 'INCOME' ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{transaction.description}</p>
                        <p className="text-zinc-400 text-sm">{transaction.category.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount, showValues)}
                      </p>
                      <p className="text-zinc-500 text-xs">
                        {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Top 5 Categories Widget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="bg-gradient-to-br from-white/5 to-purple-500/5 border border-purple-500/20 rounded-lg backdrop-blur-sm"
        >
          <div className="p-6 border-b border-purple-500/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Top 5 Categorias</h2>
              <Link
                href="/dashboard/expenses"
                className="text-sm text-zinc-400 hover:text-blue-400 transition-colors"
              >
                Ver detalhes
              </Link>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-zinc-500">Carregando...</p>
              </div>
            ) : (() => {
              // Calcular top 5 categorias do mês
              const now = new Date()
              const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
              monthStart.setHours(0, 0, 0, 0)
              
              const monthlyExpenses = transactions
                .filter(t => 
                  t.type === 'EXPENSE' && 
                  new Date(t.createdAt) >= monthStart
                )
              
              const categoryTotals: Record<string, number> = {}
              monthlyExpenses.forEach(expense => {
                const categoryName = expense.category?.name || 'Outros'
                categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + expense.amount
              })
              
              const topCategories = Object.entries(categoryTotals)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
              
              if (topCategories.length === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-zinc-500">Nenhum gasto este mês</p>
                    <Link
                      href="/dashboard/transactions"
                      className="text-sm text-blue-400 hover:text-purple-400 transition-colors"
                    >
                      Adicionar primeiro gasto
                    </Link>
                  </div>
                )
              }
              
              const totalExpenses = topCategories.reduce((sum, [, amount]) => sum + amount, 0)
              
              return (
                <div className="space-y-3">
                  {topCategories.map(([category, amount], index) => {
                    const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-zinc-400 text-sm font-medium w-6">{index + 1}.</span>
                            <span className="text-white text-sm truncate">{category}</span>
                          </div>
                          <span className="text-purple-400 text-sm font-medium ml-2">
                            {showValues ? formatCurrency(amount, true) : 'R$ •••'}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </motion.div>

        {/* Financial Goals */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-br from-white/5 to-purple-500/5 border border-purple-500/20 rounded-lg backdrop-blur-sm"
        >
          <div className="p-6 border-b border-purple-500/10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Metas Financeiras</h2>
              <Link
                href="/dashboard/goals"
                className="text-sm text-zinc-400 hover:text-blue-400 transition-colors"
              >
                Ver todas
              </Link>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-zinc-500">Carregando...</p>
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-500">Nenhuma meta criada</p>
                <Link
                  href="/dashboard/goals"
                  className="text-sm text-blue-400 hover:text-purple-400 transition-colors"
                >
                  Criar primeira meta
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal) => {
                  const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
                  return (
                    <div key={goal.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-medium text-sm">{goal.title}</h3>
                        <span className="text-xs text-zinc-400">{progress.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            goal.status === 'COMPLETED'
                              ? 'bg-gradient-to-r from-green-500 to-green-400'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-green-400">{formatCurrency(goal.currentAmount, showValues)}</span>
                        <span className="text-zinc-400">{formatCurrency(goal.targetAmount, showValues)}</span>
                      </div>
                    </div>
                  )
                })}
                {goals.length > 3 && (
                  <Link
                    href="/dashboard/goals"
                    className="block text-center text-sm text-blue-400 hover:text-purple-400 transition-colors pt-2"
                  >
                    Ver mais {goals.length - 3} meta{goals.length - 3 > 1 ? 's' : ''}
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-purple-500/20 rounded-lg p-6 backdrop-blur-sm"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 hover:from-blue-500/10 hover:to-purple-500/10 border border-purple-500/20 rounded-lg transition-colors group"
          >
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-zinc-300 group-hover:text-white transition-colors">Adicionar Receita</span>
          </Link>

          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 hover:from-blue-500/10 hover:to-purple-500/10 border border-purple-500/20 rounded-lg transition-colors group"
          >
            <TrendingDown className="w-5 h-5 text-purple-400" />
            <span className="text-zinc-300 group-hover:text-white transition-colors">Registrar Gasto</span>
          </Link>

          <Link
            href="/dashboard/goals"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 hover:from-blue-500/10 hover:to-purple-500/10 border border-purple-500/20 rounded-lg transition-colors group"
          >
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-zinc-300 group-hover:text-white transition-colors">Criar Meta</span>
          </Link>

          <Link
            href="/dashboard/analysis"
            className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/5 to-purple-500/5 hover:from-blue-500/10 hover:to-purple-500/10 border border-purple-500/20 rounded-lg transition-colors group"
          >
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <span className="text-zinc-300 group-hover:text-white transition-colors">Ver Relatório</span>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}