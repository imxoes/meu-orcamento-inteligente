'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  BarChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart as PieChartIcon,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Activity,
  CreditCard,
  ShoppingBag,
  Home,
  Car,
  Coffee,
  Heart,
  Zap
} from 'lucide-react'
import SimpleBackground from '@/components/ui/simple-background'
import { useValuesVisibility, formatCurrency } from '@/contexts/ValuesVisibilityContext'

export const dynamic = 'force-dynamic'

export default function AnalysisPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [viewType, setViewType] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [insights, setInsights] = useState<any[]>([])
  const { showValues, currency } = useValuesVisibility()

  useEffect(() => {
    fetchAnalysisData()
  }, [selectedPeriod])

  const fetchAnalysisData = async () => {
    try {
      setLoading(true)

      // Fetch all transactions
      const transResponse = await fetch('/api/transactions?limit=1000', {
        credentials: 'include'
      })
      const transData = await transResponse.json()
      const allTransactions = transData.transactions || []
      setTransactions(allTransactions)

      // Process monthly data
      const monthsToAnalyze = selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12
      const processedMonthlyData = processMonthlyData(allTransactions, monthsToAnalyze)
      setMonthlyData(processedMonthlyData)

      // Process category data
      const processedCategoryData = processCategoryData(allTransactions)
      setCategoryData(processedCategoryData)

      // Generate insights
      const generatedInsights = generateInsights(allTransactions, processedMonthlyData, processedCategoryData)
      setInsights(generatedInsights)

    } catch (error) {
      console.error('Error fetching analysis data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processMonthlyData = (transactions: any[], months: number) => {
    const now = new Date()
    const data = []

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.createdAt)
        return tDate >= monthDate && tDate <= monthEnd
      })

      const income = monthTransactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = monthTransactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0)

      data.push({
        month: monthDate.toLocaleDateString('pt-BR', { month: 'short' }),
        income: income,
        expenses: expenses,
        savings: income - expenses,
        transactionCount: monthTransactions.length
      })
    }

    return data
  }

  const processCategoryData = (transactions: any[]) => {
    const categoryTotals: Record<string, number> = {}
    const categoryCount: Record<string, number> = {}

    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        const categoryName = t.category?.name || 'Outros'
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + t.amount
        categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1
      })

    return Object.entries(categoryTotals)
      .map(([name, total]) => ({
        name,
        value: total,
        count: categoryCount[name],
        percentage: 0 // Will be calculated later
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8) // Top 8 categories
  }

  const generateInsights = (transactions: any[], monthlyData: any[], categoryData: any[]) => {
    const insights = []

    // Calculate trends
    if (monthlyData.length >= 2) {
      const lastMonth = monthlyData[monthlyData.length - 1]
      const previousMonth = monthlyData[monthlyData.length - 2]

      // Income trend
      if (lastMonth.income > previousMonth.income * 1.1) {
        insights.push({
          icon: TrendingUp,
          title: 'Receita em Alta',
          value: `+${((lastMonth.income - previousMonth.income) / previousMonth.income * 100).toFixed(0)}%`,
          description: 'Sua receita aumentou significativamente este mês',
          type: 'positive',
          color: 'bg-green-500/20 text-green-400'
        })
      }

      // Expense trend
      if (lastMonth.expenses > previousMonth.expenses * 1.2) {
        insights.push({
          icon: AlertTriangle,
          title: 'Gastos Elevados',
          value: `+${((lastMonth.expenses - previousMonth.expenses) / previousMonth.expenses * 100).toFixed(0)}%`,
          description: 'Seus gastos aumentaram mais de 20% este mês',
          type: 'warning',
          color: 'bg-yellow-500/20 text-yellow-400'
        })
      }

      // Savings improvement
      if (lastMonth.savings > 0 && lastMonth.savings > previousMonth.savings) {
        insights.push({
          icon: CheckCircle,
          title: 'Economia Melhorou',
          value: formatCurrency(lastMonth.savings, showValues, currency),
          description: 'Você economizou mais este mês comparado ao anterior',
          type: 'positive',
          color: 'bg-blue-500/20 text-blue-400'
        })
      }
    }

    // Category insights
    if (categoryData.length > 0) {
      const topCategory = categoryData[0]
      insights.push({
        icon: Info,
        title: 'Maior Gasto',
        value: topCategory.name,
        description: `${topCategory.name} representa sua maior categoria de gastos`,
        type: 'info',
        color: 'bg-purple-500/20 text-purple-400'
      })
    }

    // Transaction frequency
    const avgTransactionsPerMonth = monthlyData.reduce((sum, m) => sum + m.transactionCount, 0) / monthlyData.length
    insights.push({
      icon: Activity,
      title: 'Frequência de Transações',
      value: `${Math.round(avgTransactionsPerMonth)}/mês`,
      description: 'Média de transações por mês',
      type: 'info',
      color: 'bg-cyan-500/20 text-cyan-400'
    })

    return insights
  }

  // Calculate KPIs
  const totalIncome = monthlyData.reduce((sum, month) => sum + (month?.income || 0), 0)
  const totalExpenses = monthlyData.reduce((sum, month) => sum + (month?.expenses || 0), 0)
  const totalSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0

  const lastMonthData = monthlyData[monthlyData.length - 1] || { income: 0, expenses: 0, savings: 0 }
  const previousMonthData = monthlyData[monthlyData.length - 2] || { income: 0, expenses: 0, savings: 0 }

  const incomeChange = previousMonthData.income > 0 ? ((lastMonthData.income - previousMonthData.income) / previousMonthData.income) * 100 : 0
  const expenseChange = previousMonthData.expenses > 0 ? ((lastMonthData.expenses - previousMonthData.expenses) / previousMonthData.expenses) * 100 : 0
  const savingsChange = previousMonthData.savings !== 0 ? ((lastMonthData.savings - previousMonthData.savings) / Math.abs(previousMonthData.savings)) * 100 : 0

  // Colors for pie chart
  const COLORS = ['#3b82f6', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  // Prepare data for radar chart
  const radarData = categoryData.slice(0, 6).map(cat => ({
    category: cat.name.length > 10 ? cat.name.substring(0, 10) + '...' : cat.name,
    value: cat.value,
    fullMark: Math.max(...categoryData.map(c => c.value))
  }))

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Carregando análises...</div>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: -1 }}>
        <SimpleBackground />
      </div>
      <div className="min-h-screen relative space-y-6 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">Análise Financeira</h1>
            <p className="text-zinc-300">Insights detalhados sobre seus hábitos financeiros</p>
          </div>

          <div className="flex gap-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-black/20 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
            >
              <option value="3months">Últimos 3 meses</option>
              <option value="6months">Últimos 6 meses</option>
              <option value="12months">Último ano</option>
            </select>

            <div className="flex bg-black/20 backdrop-blur-sm rounded-lg p-1">
              <button
                onClick={() => setViewType('overview')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  viewType === 'overview'
                    ? 'bg-blue-500 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Visão Geral
              </button>
              <button
                onClick={() => setViewType('detailed')}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  viewType === 'detailed'
                    ? 'bg-blue-500 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Detalhado
              </button>
            </div>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-blue-400" />
              <div className="flex items-center gap-1">
                {incomeChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${incomeChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {Math.abs(incomeChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <h3 className="text-zinc-300 text-sm font-medium">Receita Média</h3>
            <p className="text-white text-2xl font-bold mt-1">
              {formatCurrency(monthlyData.length > 0 ? totalIncome / monthlyData.length : 0, showValues, currency)}
            </p>
            <p className="text-zinc-400 text-xs mt-2">Por mês</p>
          </div>

          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <TrendingDown className="w-8 h-8 text-purple-400" />
              <div className="flex items-center gap-1">
                {expenseChange <= 0 ? (
                  <ArrowDownRight className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowUpRight className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${expenseChange <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {Math.abs(expenseChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <h3 className="text-zinc-300 text-sm font-medium">Gasto Médio</h3>
            <p className="text-white text-2xl font-bold mt-1">
              {formatCurrency(monthlyData.length > 0 ? totalExpenses / monthlyData.length : 0, showValues, currency)}
            </p>
            <p className="text-zinc-400 text-xs mt-2">Por mês</p>
          </div>

          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-green-400" />
              <div className="flex items-center gap-1">
                {savingsChange >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-sm font-medium ${savingsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {Math.abs(savingsChange).toFixed(1)}%
                </span>
              </div>
            </div>
            <h3 className="text-zinc-300 text-sm font-medium">Economia Média</h3>
            <p className="text-white text-2xl font-bold mt-1">
              {formatCurrency(monthlyData.length > 0 ? totalSavings / monthlyData.length : 0, showValues, currency)}
            </p>
            <p className="text-zinc-400 text-xs mt-2">Por mês</p>
          </div>

          <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-cyan-400" />
              <div className="flex items-center gap-1">
                <span className={`text-sm font-medium ${savingsRate >= 20 ? 'text-green-400' : savingsRate >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {savingsRate >= 20 ? 'Ótimo' : savingsRate >= 10 ? 'Bom' : 'Melhorar'}
                </span>
              </div>
            </div>
            <h3 className="text-zinc-300 text-sm font-medium">Taxa de Poupança</h3>
            <p className="text-white text-2xl font-bold mt-1">{savingsRate.toFixed(1)}%</p>
            <p className="text-zinc-400 text-xs mt-2">Da receita total</p>
          </div>
        </motion.div>

        {viewType === 'overview' ? (
          <>
            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Trend Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-6">Evolução Financeira</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tickFormatter={(value) => showValues ? `${(value/1000).toFixed(1)}k` : ''} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: any) => formatCurrency(value, showValues, currency)}
                      />
                      <Area
                        type="monotone"
                        dataKey="savings"
                        fill="url(#savingsGradient)"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                      <Bar dataKey="expenses" fill="#ef4444" opacity={0.7} />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                      <defs>
                        <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-around mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-zinc-400 text-sm">Receitas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-zinc-400 text-sm">Gastos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-zinc-400 text-sm">Economia</span>
                  </div>
                </div>
              </motion.div>

              {/* Category Distribution */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-6">Distribuição por Categoria</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: any) => formatCurrency(value, showValues, currency)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {categoryData.slice(0, 4).map((cat, index) => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-xs text-zinc-300 truncate">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Insights Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-6">Insights Inteligentes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {insights.map((insight, index) => {
                  const Icon = insight.icon
                  return (
                    <div
                      key={index}
                      className="bg-black/10 backdrop-blur-sm rounded-lg p-4 border border-white/5 hover:bg-black/20 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${insight.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-white font-semibold text-sm">{insight.title}</h4>
                            {insight.value && (
                              <span className={`text-sm font-bold ${
                                insight.type === 'positive' ? 'text-green-400' :
                                insight.type === 'warning' ? 'text-yellow-400' :
                                'text-blue-400'
                              }`}>
                                {insight.value}
                              </span>
                            )}
                          </div>
                          <p className="text-zinc-400 text-xs">{insight.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </>
        ) : (
          <>
            {/* Detailed View */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Radar Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-6">Perfil de Gastos</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                      <PolarAngleAxis dataKey="category" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                      <Radar name="Gastos" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Bar Chart - Monthly Comparison */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="lg:col-span-2 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl"
              >
                <h3 className="text-xl font-bold text-white mb-6">Comparação Mensal</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="month" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tickFormatter={(value) => showValues ? `${(value/1000).toFixed(1)}k` : ''} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0, 0, 0, 0.9)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                        formatter={(value: any) => formatCurrency(value, showValues, currency)}
                      />
                      <Bar dataKey="income" fill="#3b82f6" />
                      <Bar dataKey="expenses" fill="#ef4444" />
                      <Bar dataKey="savings" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Category Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl overflow-x-auto"
            >
              <h3 className="text-xl font-bold text-white mb-6">Análise Detalhada por Categoria</h3>
              <table className="w-full">
                <thead className="text-left border-b border-white/10">
                  <tr>
                    <th className="pb-3 text-zinc-400 font-medium">Categoria</th>
                    <th className="pb-3 text-zinc-400 font-medium text-right">Total Gasto</th>
                    <th className="pb-3 text-zinc-400 font-medium text-right">Transações</th>
                    <th className="pb-3 text-zinc-400 font-medium text-right">Média/Transação</th>
                    <th className="pb-3 text-zinc-400 font-medium text-right">% do Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {categoryData.map((category, index) => {
                    const percentage = totalExpenses > 0 ? (category.value / totalExpenses) * 100 : 0
                    return (
                      <tr key={index} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 text-white font-medium flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          {category.name}
                        </td>
                        <td className="py-3 text-zinc-300 text-right">{formatCurrency(category.value, showValues, currency)}</td>
                        <td className="py-3 text-zinc-300 text-right">{category.count}</td>
                        <td className="py-3 text-zinc-300 text-right">{formatCurrency(category.value / category.count, showValues, currency)}</td>
                        <td className="py-3 text-right">
                          <span className="text-purple-400 font-medium">{percentage.toFixed(1)}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </motion.div>
          </>
        )}
      </div>
    </>
  )
}