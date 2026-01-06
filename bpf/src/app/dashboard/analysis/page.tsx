'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar } from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'

const monthlyData: any[] = []

const categoryTrends: any[] = []

const insights: any[] = []

export const dynamic = 'force-dynamic'

export default function AnalysisPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6months')
  const [viewType, setViewType] = useState('overview')

  const totalIncome = monthlyData.reduce((sum, month) => sum + (month?.income || 0), 0)
  const totalExpenses = monthlyData.reduce((sum, month) => sum + (month?.expenses || 0), 0)
  const totalSavings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0

  const lastMonthData = monthlyData[monthlyData.length - 1] || { income: 0, expenses: 0 }
  const previousMonthData = monthlyData[monthlyData.length - 2] || { income: 0, expenses: 0 }

  const incomeChange = previousMonthData.income > 0 ? ((lastMonthData.income - previousMonthData.income) / previousMonthData.income) * 100 : 0
  const expenseChange = previousMonthData.expenses > 0 ? ((lastMonthData.expenses - previousMonthData.expenses) / previousMonthData.expenses) * 100 : 0
  const savingsChange = (previousMonthData.savings || 0) > 0 ? (((lastMonthData.savings || 0) - (previousMonthData.savings || 0)) / (previousMonthData.savings || 1)) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Análise Financeira</h1>
          <p className="text-zinc-400">Insights detalhados sobre seus hábitos financeiros</p>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="3months">Últimos 3 meses</option>
            <option value="6months">Últimos 6 meses</option>
            <option value="12months">Último ano</option>
          </select>

          <div className="flex bg-white/10 rounded-xl p-1">
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
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-blue-400" />
            <div className="flex items-center gap-1">
              {incomeChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm ${incomeChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {incomeChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <h3 className="text-zinc-400 text-sm">Receita Mensal Média</h3>
          <p className="text-white text-2xl font-bold">R$ {(totalIncome / monthlyData.length).toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <TrendingDown className="w-8 h-8 text-purple-400" />
            <div className="flex items-center gap-1">
              {expenseChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-red-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-green-400" />
              )}
              <span className={`text-sm ${expenseChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                {expenseChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <h3 className="text-zinc-400 text-sm">Gasto Mensal Médio</h3>
          <p className="text-white text-2xl font-bold">R$ {(totalExpenses / monthlyData.length).toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-blue-400" />
            <div className="flex items-center gap-1">
              {savingsChange >= 0 ? (
                <ArrowUpRight className="w-4 h-4 text-green-400" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm ${savingsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {savingsChange.toFixed(1)}%
              </span>
            </div>
          </div>
          <h3 className="text-zinc-400 text-sm">Economia Mensal Média</h3>
          <p className="text-white text-2xl font-bold">R$ {(totalSavings / monthlyData.length).toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-purple-500/20 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-purple-400" />
            <div className="flex items-center gap-1">
              <span className="text-sm text-green-400">Saudável</span>
            </div>
          </div>
          <h3 className="text-zinc-400 text-sm">Taxa de Poupança</h3>
          <p className="text-white text-2xl font-bold">{savingsRate.toFixed(1)}%</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Trend Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-6">Evolução Financeira</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    color: '#fff'
                  }}
                  formatter={(value, name) => [`R$ ${value}`, name === 'income' ? 'Receita' : name === 'expenses' ? 'Gastos' : 'Economia']}
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
        </motion.div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-6">Insights Inteligentes</h3>
          <div className="space-y-4">
            {insights.map((insight, index) => {
              const Icon = insight.icon
              return (
                <div
                  key={index}
                  className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${insight.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="text-white font-medium">{insight.title}</h4>
                        <span className={`text-sm font-bold ${insight.type === 'positive' ? 'text-green-400' : insight.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>
                          {insight.value}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm">{insight.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Category Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-6">Análise por Categoria</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="text-left border-b border-white/10">
              <tr>
                <th className="pb-3 text-zinc-400 font-medium">Categoria</th>
                <th className="pb-3 text-zinc-400 font-medium">Jan</th>
                <th className="pb-3 text-zinc-400 font-medium">Fev</th>
                <th className="pb-3 text-zinc-400 font-medium">Mar</th>
                <th className="pb-3 text-zinc-400 font-medium">Abr</th>
                <th className="pb-3 text-zinc-400 font-medium">Mai</th>
                <th className="pb-3 text-zinc-400 font-medium">Jun</th>
                <th className="pb-3 text-zinc-400 font-medium">Tendência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categoryTrends.map((category, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 text-white font-medium">{category.category}</td>
                  <td className="py-3 text-zinc-300">R$ {category.jan}</td>
                  <td className="py-3 text-zinc-300">R$ {category.fev}</td>
                  <td className="py-3 text-zinc-300">R$ {category.mar}</td>
                  <td className="py-3 text-zinc-300">R$ {category.abr}</td>
                  <td className="py-3 text-zinc-300">R$ {category.mai}</td>
                  <td className="py-3 text-zinc-300">R$ {category.jun}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {category.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-red-400" />
                      ) : category.trend === 'down' ? (
                        <TrendingDown className="w-4 h-4 text-green-400" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-zinc-500" />
                      )}
                      <span className={`text-sm ${
                        category.trend === 'up' ? 'text-red-400' :
                        category.trend === 'down' ? 'text-green-400' : 'text-zinc-400'
                      }`}>
                        {category.trend === 'up' ? 'Subindo' :
                         category.trend === 'down' ? 'Descendo' : 'Estável'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}