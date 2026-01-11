'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import {
  Calendar,
  TrendingDown,
  Filter,
  Download,
  ShoppingCart,
  Car,
  Home,
  Utensils,
  Gamepad2,
  Heart,
  GraduationCap,
  CreditCard
} from 'lucide-react'
import { useValuesVisibility, formatCurrency } from '@/contexts/ValuesVisibilityContext'
import SimpleBackground from '@/components/ui/simple-background'

const categoryIcons: Record<string, any> = {
  'Alimentação': Utensils,
  'Transporte': Car,
  'Moradia': Home,
  'Entretenimento': Gamepad2,
  'Saúde': Heart,
  'Educação': GraduationCap,
  'Compras': ShoppingCart,
  'Outros': CreditCard
}

const categoryColors: Record<string, string> = {
  'Alimentação': '#ef4444',
  'Transporte': '#3b82f6',
  'Moradia': '#10b981',
  'Entretenimento': '#f59e0b',
  'Saúde': '#ec4899',
  'Educação': '#8b5cf6',
  'Compras': '#06b6d4',
  'Outros': '#6b7280'
}

export default function ExpensesPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const { showValues } = useValuesVisibility()

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await fetch('/api/transactions?limit=1000', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setTransactions(data.transactions || [])
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  // Filter only expenses
  const expenses = transactions.filter(t => t.type === 'EXPENSE')

  // Calculate current month expenses
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  const currentMonthExpenses = expenses
    .filter(t => {
      const date = new Date(t.createdAt)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, t) => sum + t.amount, 0)

  // Calculate previous month expenses
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
  
  const previousMonthExpenses = expenses
    .filter(t => {
      const date = new Date(t.createdAt)
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyChange = previousMonthExpenses > 0 
    ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 
    : 0

  // Group by category
  const categoryTotals: Record<string, number> = {}
  expenses.forEach(expense => {
    const categoryName = expense.category.name
    categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + expense.amount
  })

  const categoryExpenses = Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value,
      color: categoryColors[name] || '#6b7280',
      icon: categoryIcons[name] || CreditCard
    }))
    .sort((a, b) => b.value - a.value)

  const totalExpenses = categoryExpenses.reduce((sum, cat) => sum + cat.value, 0)

  // Monthly expenses for chart (last 12 months)
  const monthlyExpensesData: { month: string; value: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentYear, currentMonth - i, 1)
    const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
    const monthExpenses = expenses
      .filter(t => {
        const tDate = new Date(t.createdAt)
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear()
      })
      .reduce((sum, t) => sum + t.amount, 0)
    monthlyExpensesData.push({ month: monthName, value: monthExpenses })
  }

  const getChartData = () => {
    return monthlyExpensesData
  }

  const filteredCategories = selectedCategory === 'all'
    ? categoryExpenses
    : categoryExpenses.filter(cat => cat.name.toLowerCase() === selectedCategory.toLowerCase())

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Construir query params baseado nos filtros
      const params = new URLSearchParams()
      
      // Sempre filtrar apenas despesas
      params.append('type', 'EXPENSE')
      
      // Adicionar filtro de categoria se selecionado
      if (selectedCategory !== 'all') {
        const category = categoryExpenses.find(cat => cat.name.toLowerCase() === selectedCategory.toLowerCase())
        if (category) {
          // Precisamos buscar o ID da categoria
          const categoryResponse = await fetch('/api/categories', {
            credentials: 'include'
          })
          if (categoryResponse.ok) {
            const categoriesData = await categoryResponse.json()
            const foundCategory = categoriesData.categories?.find((c: any) => c.name === category.name)
            if (foundCategory) {
              params.append('categoryId', foundCategory.id)
            }
          }
        }
      }
      
      // Adicionar filtro de período
      if (selectedPeriod === 'monthly') {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        params.append('startDate', startOfMonth.toISOString().split('T')[0])
        params.append('endDate', endOfMonth.toISOString().split('T')[0])
      }

      const response = await fetch(`/api/transactions/export?${params.toString()}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `gastos-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        alert('✅ PDF gerado com sucesso!')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        alert('❌ Erro ao gerar PDF: ' + (errorData.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('❌ Erro ao gerar PDF')
    } finally {
      setIsExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-400">Carregando dados...</p>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-12 text-center">
          <TrendingDown className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum gasto registrado</h3>
          <p className="text-zinc-400 mb-6">
            Comece registrando seus gastos para ver análises detalhadas aqui.
          </p>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/25 backdrop-blur-md border border-blue-400/20 shadow-2xl ring-1 ring-blue-400/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Gastos do Mês</p>
                <p className="text-white text-2xl font-bold drop-shadow-lg mt-1">{formatCurrency(currentMonthExpenses, showValues)}</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className={`w-4 h-4 ${monthlyChange > 0 ? 'text-purple-400' : 'text-blue-400'}`} />
                  <span className={`text-sm font-medium ml-1 ${monthlyChange > 0 ? 'text-purple-400' : 'text-blue-400'}`}>
                    {showValues ? `${monthlyChange > 0 ? '+' : ''}${monthlyChange.toFixed(1)}%` : '••••%'}
                  </span>
                </div>
              </div>
              <TrendingDown className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-black/25 backdrop-blur-md border border-blue-400/20 shadow-2xl ring-1 ring-blue-400/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Média Mensal</p>
                <p className="text-white text-2xl font-bold drop-shadow-lg mt-1">
                  {formatCurrency(monthlyExpensesData.reduce((sum, m) => sum + m.value, 0) / Math.max(monthlyExpensesData.length, 1), showValues)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-black/25 backdrop-blur-md border border-blue-400/20 shadow-2xl ring-1 ring-blue-400/10 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Total do Ano</p>
                <p className="text-white text-2xl font-bold drop-shadow-lg mt-1">
                  {formatCurrency(monthlyExpensesData.reduce((sum, m) => sum + m.value, 0), showValues)}
                </p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Period Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    selectedPeriod === 'monthly'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-white/10 text-zinc-400 hover:text-white hover:bg-white/20'
                  }`}
                >
                  Mensal
                </button>
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="all">Todas as Categorias</option>
                  {categoryExpenses.map((category) => (
                    <option key={category.name} value={category.name.toLowerCase()}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-600/30 hover:bg-zinc-600/50 text-zinc-300 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Gerando PDF...' : 'Exportar Relatório'}
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-6"
        >
          <h3 className="text-xl font-bold drop-shadow-lg text-white mb-6">
            Gastos Mensais
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(value) => [`R$ ${value}`, 'Gastos']}
                />
                <Bar
                  dataKey="value"
                  fill="url(#colorGradient)"
                  radius={[8, 8, 0, 0]}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Distribution */}
        {categoryExpenses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-6"
          >
            <h3 className="text-xl font-bold drop-shadow-lg text-white mb-6">Distribuição por Categoria</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryExpenses}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryExpenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '12px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`R$ ${value}`, 'Gasto']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>

      {/* Category Details */}
      {categoryExpenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-6"
        >
          <h3 className="text-xl font-bold drop-shadow-lg text-white mb-6">Detalhes por Categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCategories.map((category) => {
              const Icon = category.icon
              const percentage = totalExpenses > 0 ? (category.value / totalExpenses) * 100 : 0

              return (
                <div
                  key={category.name}
                  className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold drop-shadow-lg">{category.name}</h4>
                      <p className="text-zinc-300 font-medium text-sm">{showValues ? `${percentage.toFixed(1)}% do total` : '••••% do total'}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-300 font-medium">Valor</span>
                      <span className="text-white font-semibold">{formatCurrency(category.value, showValues)}</span>
                    </div>

                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: category.color
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      )}
      </div>
    </>
  )
}
