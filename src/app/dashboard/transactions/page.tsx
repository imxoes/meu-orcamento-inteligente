'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Edit2,
  Trash2,
  X,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { useValuesVisibility, formatCurrency } from '@/contexts/ValuesVisibilityContext'
import SimpleBackground from '@/components/ui/simple-background'

type Transaction = {
  id: string
  description: string
  amount: number
  date: string
  category: {
    id: string
    name: string
  }
  type: 'INCOME' | 'EXPENSE'
  createdAt: string
}

type Category = {
  id: string
  name: string
  icon?: string
  color?: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const { showValues, currency } = useValuesVisibility()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showQueryModal, setShowQueryModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<string | null>(null)
  const [activeFilters, setActiveFilters] = useState<any>(null)
  const [isFiltering, setIsFiltering] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar transações
        const transactionsResponse = await fetch('/api/transactions', {
          credentials: 'include'
        })
        
        if (transactionsResponse.ok) {
          const transactionsData = await transactionsResponse.json()
          console.log('✅ Transactions fetched:', transactionsData.transactions?.length || 0, 'transactions')
          setTransactions(transactionsData.transactions || [])
        } else {
          const errorData = await transactionsResponse.json().catch(() => ({ error: 'Unknown error' }))
          console.error('❌ Failed to fetch transactions:', transactionsResponse.status, errorData)
        }

        // Buscar categorias
        const categoriesResponse = await fetch('/api/categories', {
          credentials: 'include'
        })
        
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories(categoriesData.categories || [])
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
  }

  const handleDelete = async (transactionId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta transação?')) {
      return
    }

    setDeletingTransaction(transactionId)
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        // Remover da lista
        setTransactions(transactions.filter(t => t.id !== transactionId))
        alert('✅ Transação deletada com sucesso!')
      } else {
        const errorData = await response.json()
        alert('❌ Erro ao deletar: ' + (errorData.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      alert('❌ Erro ao deletar transação')
    } finally {
      setDeletingTransaction(null)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTransaction) return

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const amount = parseFloat(formData.get('amount') as string)
    const description = formData.get('description') as string
    const type = formData.get('type') as 'INCOME' | 'EXPENSE'
    const categoryId = formData.get('categoryId') as string
    const date = formData.get('date') as string

    try {
      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount, description, type, categoryId, date })
      })

      if (response.ok) {
        const data = await response.json()
        // Atualizar na lista
        setTransactions(transactions.map(t => 
          t.id === editingTransaction.id ? data.transaction : t
        ))
        setEditingTransaction(null)
        alert('✅ Transação atualizada com sucesso!')
      } else {
        const errorData = await response.json()
        alert('❌ Erro ao atualizar: ' + (errorData.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
      alert('❌ Erro ao atualizar transação')
    }
  }

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsFiltering(true)
    
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const preset = formData.get('preset') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const categoryId = formData.get('categoryId') as string
    const type = formData.get('type') as string
    const minAmount = formData.get('minAmount') as string
    const maxAmount = formData.get('maxAmount') as string

    // Calcular datas para períodos pré-definidos
    let finalStartDate = startDate
    let finalEndDate = endDate

    if (preset) {
      const today = new Date()
      
      // Função helper para formatar data no formato YYYY-MM-DD (local, não UTC)
      const formatLocalDate = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      }

      const start = new Date(today)
      switch (preset) {
        case 'today':
          start.setHours(0, 0, 0, 0)
          finalStartDate = formatLocalDate(start)
          finalEndDate = formatLocalDate(today)
          break
        case 'week':
          start.setDate(today.getDate() - 7)
          start.setHours(0, 0, 0, 0)
          finalStartDate = formatLocalDate(start)
          finalEndDate = formatLocalDate(today)
          break
        case 'month':
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
          finalStartDate = formatLocalDate(start)
          finalEndDate = formatLocalDate(today)
          break
        case 'lastMonth':
          start.setMonth(today.getMonth() - 1)
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
          const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
          finalStartDate = formatLocalDate(start)
          finalEndDate = formatLocalDate(lastMonthEnd)
          break
        case 'quarter':
          const quarter = Math.floor(today.getMonth() / 3)
          start.setMonth(quarter * 3)
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
          finalStartDate = formatLocalDate(start)
          finalEndDate = formatLocalDate(today)
          break
        case 'year':
          start.setMonth(0)
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
          finalStartDate = formatLocalDate(start)
          finalEndDate = formatLocalDate(today)
          break
      }
    }

    // Construir query params
    const params = new URLSearchParams()
    if (finalStartDate) params.append('startDate', finalStartDate)
    if (finalEndDate) params.append('endDate', finalEndDate)
    if (categoryId && categoryId !== 'all') params.append('categoryId', categoryId)
    if (type && type !== 'all') params.append('type', type)
    if (minAmount) params.append('minAmount', minAmount)
    if (maxAmount) params.append('maxAmount', maxAmount)

    try {
      const response = await fetch(`/api/transactions?${params.toString()}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
        setActiveFilters({
          preset,
          startDate: finalStartDate,
          endDate: finalEndDate,
          categoryId: categoryId !== 'all' ? categoryId : null,
          type: type !== 'all' ? type : null,
          minAmount,
          maxAmount
        })
        setShowQueryModal(false)
        alert(`✅ ${data.transactions?.length || 0} transações encontradas`)
      } else {
        alert('❌ Erro ao buscar transações')
      }
    } catch (error) {
      console.error('Error querying transactions:', error)
      alert('❌ Erro ao buscar transações')
    } finally {
      setIsFiltering(false)
    }
  }

  const handleClearFilters = async () => {
    setActiveFilters(null)
    setIsFiltering(true)
    try {
      const response = await fetch('/api/transactions', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsFiltering(false)
    }
  }

  const handleExport = async () => {
    try {
      setIsFiltering(true)
      
      // Construir query params baseado nos filtros ativos ou todas as transações
      const params = new URLSearchParams()
      
      if (activeFilters) {
        if (activeFilters.startDate) params.append('startDate', activeFilters.startDate)
        if (activeFilters.endDate) params.append('endDate', activeFilters.endDate)
        if (activeFilters.categoryId) params.append('categoryId', activeFilters.categoryId)
        if (activeFilters.type) params.append('type', activeFilters.type)
        if (activeFilters.minAmount) params.append('minAmount', activeFilters.minAmount)
        if (activeFilters.maxAmount) params.append('maxAmount', activeFilters.maxAmount)
      }

      const response = await fetch(`/api/transactions/export?${params.toString()}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `transacoes-${new Date().toISOString().split('T')[0]}.pdf`
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
      setIsFiltering(false)
    }
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (selectedFilter === 'all') return matchesSearch
    if (selectedFilter === 'income') return matchesSearch && transaction.type === 'INCOME'
    if (selectedFilter === 'expense') return matchesSearch && transaction.type === 'EXPENSE'

    return matchesSearch
  })

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const balance = totalIncome - totalExpenses

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
          <div className="bg-black/25 backdrop-blur-md border border-blue-400/20 rounded-xl p-6 shadow-2xl ring-1 ring-blue-400/10 hover:ring-blue-400/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-bold drop-shadow-lg">Receitas</p>
                <p className="text-white text-2xl font-bold drop-shadow-lg mt-1">{formatCurrency(totalIncome, showValues, currency)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-black/25 backdrop-blur-md border border-blue-400/20 rounded-xl p-6 shadow-2xl ring-1 ring-blue-400/10 hover:ring-blue-400/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-bold drop-shadow-lg">Gastos</p>
                <p className="text-white text-2xl font-bold drop-shadow-lg mt-1">{formatCurrency(totalExpenses, showValues, currency)}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-black/25 backdrop-blur-md border border-blue-400/20 rounded-xl p-6 shadow-2xl ring-1 ring-blue-400/10 hover:ring-blue-400/20 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-bold drop-shadow-lg">Saldo</p>
                <p className={`text-2xl font-bold drop-shadow-lg mt-1 ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
                  {formatCurrency(balance, showValues, currency)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="pl-10 pr-8 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
                >
                  <option value="all">Todas</option>
                  <option value="income">Receitas</option>
                  <option value="expense">Gastos</option>
                  <option value="pending">Pendentes</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowQueryModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                Consulta Avançada
              </button>
              {activeFilters && (
                <button
                  onClick={handleClearFilters}
                  disabled={isFiltering}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isFiltering ? 'animate-spin' : ''}`} />
                  Limpar Filtros
                </button>
              )}
              <button
                onClick={handleExport}
                disabled={isFiltering}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-600/30 hover:bg-zinc-600/50 text-zinc-300 rounded-xl transition-colors disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${isFiltering ? 'animate-pulse' : ''}`} />
                {isFiltering ? 'Gerando PDF...' : 'Exportar PDF'}
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Transação
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-black/20 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/10 backdrop-blur-sm">
              <tr>
                <th className="text-left p-4 text-zinc-300 font-bold">Descrição</th>
                <th className="text-left p-4 text-zinc-300 font-bold">Categoria</th>
                <th className="text-left p-4 text-zinc-300 font-bold">Data</th>
                <th className="text-left p-4 text-zinc-300 font-bold">Valor</th>
                <th className="text-left p-4 text-zinc-300 font-bold">Status</th>
                <th className="text-left p-4 text-zinc-300 font-bold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredTransactions.map((transaction) => (
                <motion.tr
                  key={transaction.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'INCOME'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {transaction.type === 'INCOME' ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                      </div>
                      <span className="text-white font-medium">{transaction.description}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-300">{transaction.category.name}</td>
                  <td className="p-4 text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-zinc-400" />
                      {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`font-semibold ${
                      transaction.type === 'INCOME' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {showValues ? (
                        `${transaction.type === 'INCOME' ? '+' : '-'}${formatCurrency(transaction.amount, showValues, currency)}`
                      ) : (
                        'R$ ••••••'
                      )}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      Concluída
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(transaction)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-blue-400"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deletingTransaction === transaction.id}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-red-400 disabled:opacity-50"
                        title="Deletar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-400">Nenhuma transação encontrada</p>
          </div>
        )}
      </motion.div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Editar Transação</h3>
              <button
                onClick={() => setEditingTransaction(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Descrição</label>
                <input
                  type="text"
                  name="description"
                  defaultValue={editingTransaction.description}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Valor (R$)</label>
                <input
                  type="number"
                  name="amount"
                  step="0.01"
                  min="0"
                  defaultValue={editingTransaction.amount}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Tipo</label>
                <select
                  name="type"
                  defaultValue={editingTransaction.type}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="INCOME">Receita</option>
                  <option value="EXPENSE">Gasto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Categoria</label>
                <select
                  name="categoryId"
                  defaultValue={editingTransaction.category.id}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Data</label>
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date(editingTransaction.date).toISOString().split('T')[0]}
                  required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Query Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Consulta Avançada</h3>
              <button
                onClick={() => setShowQueryModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleQuery} className="space-y-6">
              {/* Períodos Pré-definidos */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Período Pré-definido</label>
                <select
                  name="preset"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                >
                  <option value="">Selecione um período</option>
                  <option value="today">Hoje</option>
                  <option value="week">Últimos 7 dias</option>
                  <option value="month">Este mês</option>
                  <option value="lastMonth">Mês passado</option>
                  <option value="quarter">Este trimestre</option>
                  <option value="year">Este ano</option>
                </select>
                <p className="text-xs text-zinc-400 mt-1">Ou defina um período personalizado abaixo</p>
              </div>

              {/* Período Personalizado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Data Início</label>
                  <input
                    type="date"
                    name="startDate"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Data Fim</label>
                  <input
                    type="date"
                    name="endDate"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              {/* Categoria e Tipo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Categoria</label>
                  <select
                    name="categoryId"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="all">Todas as categorias</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Tipo</label>
                  <select
                    name="type"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="INCOME">Receitas</option>
                    <option value="EXPENSE">Gastos</option>
                  </select>
                </div>
              </div>

              {/* Valor Mínimo e Máximo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Valor Mínimo (R$)</label>
                  <input
                    type="number"
                    name="minAmount"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Valor Máximo (R$)</label>
                  <input
                    type="number"
                    name="maxAmount"
                    step="0.01"
                    min="0"
                    placeholder="Sem limite"
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQueryModal(false)}
                  className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isFiltering}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isFiltering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4" />
                      Consultar
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Transaction Modal Placeholder */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Nova Transação</h3>
            <p className="text-zinc-400 mb-4">Formulário de transação será implementado aqui.</p>
            <button
              onClick={() => setShowAddForm(false)}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
      </div>
    </>
  )
}