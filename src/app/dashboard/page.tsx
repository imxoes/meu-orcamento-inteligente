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
  PieChart as PieChartIcon
} from 'lucide-react'
import { useValuesVisibility, formatCurrency } from '@/contexts/ValuesVisibilityContext'
import SimpleBackground from '@/components/ui/simple-background'
import TrialBanner from '@/components/TrialBanner'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'

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
  const { showValues, currency } = useValuesVisibility()

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
    <>
      <div className="fixed inset-0" style={{ zIndex: -1 }}>
        <SimpleBackground />
      </div>
      <div className="min-h-screen relative space-y-8 p-6">
      {/* Trial Banner */}
      {user && (
        <TrialBanner user={user} />
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">Olá, {user?.name ? String(user.name) : 'Usuário'}!</h1>
            <p className="text-zinc-300 text-lg drop-shadow-md">
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

        {/* KPI Cards - Visual destaque */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 text-sm font-medium">Saldo Total</p>
                <p className="text-white text-xl font-bold drop-shadow-lg">{formatCurrency(stats?.totalBalance || 0, showValues, currency)}</p>
              </div>
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 text-sm font-medium">Receitas do Mês</p>
                <p className="text-white text-xl font-semibold">{formatCurrency(stats?.monthlyIncome || 0, showValues, currency)}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 text-sm font-medium">Gastos do Mês</p>
                <p className="text-white text-xl font-semibold">{formatCurrency(Math.abs(stats?.monthlyExpenses || 0), showValues, currency)}</p>
              </div>
              <TrendingDown className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 text-sm font-medium">Economia do Mês</p>
                <p className="text-white text-xl font-semibold">{formatCurrency(stats?.monthlySavings || 0, showValues, currency)}</p>
              </div>
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 text-sm font-medium">Total Investimentos</p>
                <p className="text-white text-xl font-semibold">
                  {formatCurrency(
                    investments.reduce((sum, inv) => sum + (inv.currentAmount || 0), 0),
                    showValues,
                    currency
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
          className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl h-[500px] flex flex-col"
        >
          <div className="p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white drop-shadow-lg">Transações Recentes</h2>
              <Link
                href="/dashboard/transactions"
                className="text-sm text-zinc-400 hover:text-blue-400 transition-colors"
              >
                Ver todas
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-zinc-300">Carregando...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-zinc-300 font-medium">Nenhuma transação registrada</p>
                <Link
                  href="/dashboard/transactions"
                  className="text-sm text-blue-400 hover:text-purple-400 transition-colors"
                >
                  Adicionar primeira transação
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-black/10 backdrop-blur-sm rounded-lg border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'INCOME' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {transaction.type === 'INCOME' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate">{transaction.description}</p>
                        <p className="text-zinc-400 text-xs">{transaction.category.name}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`font-semibold text-sm ${
                        transaction.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}{formatCurrency(transaction.amount, showValues, currency)}
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
          className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl h-[500px] flex flex-col"
        >
          <div className="p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white drop-shadow-lg">Top 5 Categorias</h2>
              <Link
                href="/dashboard/expenses"
                className="text-sm text-zinc-400 hover:text-blue-400 transition-colors"
              >
                Ver detalhes
              </Link>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-zinc-300">Carregando...</p>
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
                    <p className="text-zinc-300 font-medium">Nenhum gasto este mês</p>
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
                <div className="space-y-3 overflow-y-auto h-full pr-2 custom-scrollbar">
                  {topCategories.map(([category, amount], index) => {
                    const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                    const colors = [
                      'bg-blue-500/20 text-blue-400',
                      'bg-purple-500/20 text-purple-400',
                      'bg-cyan-500/20 text-cyan-400',
                      'bg-emerald-500/20 text-emerald-400',
                      'bg-amber-500/20 text-amber-400'
                    ]
                    return (
                      <div key={category} className="flex items-center justify-between p-3 bg-black/10 backdrop-blur-sm rounded-lg border border-white/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${colors[index]}`}>
                            <span className="font-bold text-sm">{index + 1}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium text-sm truncate">{category}</p>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-white/10 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-zinc-400 text-xs">{percentage.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-purple-400 font-semibold text-sm">
                            {formatCurrency(amount, showValues, currency)}
                          </p>
                          <p className="text-zinc-500 text-xs">
                            do mês
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </motion.div>

        {/* Daily Expenses Chart - Last 7 Days */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl h-[500px] flex flex-col"
        >
          <div className="p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white drop-shadow-lg">Evolução de Gastos</h2>
              <span className="text-sm text-zinc-400">Últimos 7 dias</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-zinc-300">Carregando...</p>
              </div>
            ) : (() => {
              // Preparar dados dos últimos 7 dias
              const now = new Date()
              const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

              // Criar array com os últimos 7 dias
              const days = []
              for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
                days.push({
                  date: date,
                  dateStr: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
                  dayName: date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
                  expenses: 0,
                  income: 0
                })
              }

              // Calcular totais por dia
              transactions.forEach(transaction => {
                const transDate = new Date(transaction.createdAt)
                const dayIndex = days.findIndex(day =>
                  day.date.toDateString() === transDate.toDateString()
                )

                if (dayIndex !== -1) {
                  if (transaction.type === 'EXPENSE') {
                    days[dayIndex].expenses += transaction.amount
                  } else {
                    days[dayIndex].income += transaction.amount
                  }
                }
              })

              const chartData = days.map(day => ({
                day: day.dayName,
                gastos: parseFloat(day.expenses.toFixed(2)),
                receitas: parseFloat(day.income.toFixed(2))
              }))

              const totalExpenses = days.reduce((sum, day) => sum + day.expenses, 0)
              const totalIncome = days.reduce((sum, day) => sum + day.income, 0)
              const maxValue = Math.max(...days.map(d => Math.max(d.expenses, d.income)))

              if (totalExpenses === 0 && totalIncome === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-zinc-300 font-medium">Nenhuma movimentação nos últimos 7 dias</p>
                    <Link
                      href="/dashboard/transactions"
                      className="text-sm text-blue-400 hover:text-purple-400 transition-colors"
                    >
                      Registrar primeira transação
                    </Link>
                  </div>
                )
              }

              const CustomTooltip = ({ active, payload, label }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-black/90 backdrop-blur-sm p-3 rounded-lg border border-white/20">
                      <p className="text-white font-medium text-sm mb-2">{label}</p>
                      {payload.map((entry: any, index: number) => (
                        <p key={index} className={`text-sm ${entry.name === 'gastos' ? 'text-red-400' : 'text-green-400'}`}>
                          {entry.name === 'gastos' ? 'Gastos' : 'Receitas'}: {formatCurrency(entry.value, showValues, currency)}
                        </p>
                      ))}
                    </div>
                  )
                }
                return null
              }

              const formatYAxis = (value: number) => {
                if (!showValues) return ''
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(1)}k`
                }
                return value.toFixed(0)
              }

              return (
                <div className="h-full flex flex-col">
                  <div className="flex-1" style={{ minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis
                          dataKey="day"
                          stroke="rgba(255, 255, 255, 0.5)"
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                        />
                        <YAxis
                          stroke="rgba(255, 255, 255, 0.5)"
                          tick={{ fill: '#9ca3af', fontSize: 12 }}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          tickFormatter={formatYAxis}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="gastos"
                          stroke="#ef4444"
                          strokeWidth={2}
                          dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                          name="gastos"
                        />
                        <Line
                          type="monotone"
                          dataKey="receitas"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                          name="receitas"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between p-3 bg-black/10 backdrop-blur-sm rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-zinc-300 text-sm">Total de Gastos</span>
                      </div>
                      <span className="text-red-400 font-semibold">
                        {formatCurrency(totalExpenses, showValues, currency)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-black/10 backdrop-blur-sm rounded-lg border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-zinc-300 text-sm">Total de Receitas</span>
                      </div>
                      <span className="text-green-400 font-semibold">
                        {formatCurrency(totalIncome, showValues, currency)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-300 text-sm font-medium">Saldo do Período</span>
                        <span className={`font-bold text-lg ${totalIncome - totalExpenses >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                          {formatCurrency(totalIncome - totalExpenses, showValues, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl"
      >
        <h2 className="text-lg font-bold text-white drop-shadow-lg mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-3 p-4 bg-black/10 hover:bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-300 group shadow-lg hover:shadow-xl"
          >
            <TrendingUp className="w-5 h-5 text-blue-400" />
            <span className="text-zinc-200 group-hover:text-white font-medium transition-colors">Adicionar Receita</span>
          </Link>

          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-3 p-4 bg-black/10 hover:bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-300 group shadow-lg hover:shadow-xl"
          >
            <TrendingDown className="w-5 h-5 text-purple-400" />
            <span className="text-zinc-200 group-hover:text-white font-medium transition-colors">Registrar Gasto</span>
          </Link>

          <Link
            href="/dashboard/goals"
            className="flex items-center gap-3 p-4 bg-black/10 hover:bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-300 group shadow-lg hover:shadow-xl"
          >
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-zinc-200 group-hover:text-white font-medium transition-colors">Criar Meta</span>
          </Link>

          <Link
            href="/dashboard/analysis"
            className="flex items-center gap-3 p-4 bg-black/10 hover:bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg transition-all duration-300 group shadow-lg hover:shadow-xl"
          >
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <span className="text-zinc-200 group-hover:text-white font-medium transition-colors">Ver Relatório</span>
          </Link>
        </div>
      </motion.div>
      </div>
    </>
  )
}