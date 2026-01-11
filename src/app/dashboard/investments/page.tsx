'use client'

import { useState, useEffect, FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Plus,
  DollarSign,
  Edit2,
  Trash2,
  X,
  RefreshCw
} from 'lucide-react'
import { useValuesVisibility, formatCurrency } from '@/contexts/ValuesVisibilityContext'
import SimpleBackground from '@/components/ui/simple-background'

type Investment = {
  id: string
  title: string
  description: string | null
  currentAmount: number
  createdAt: string
}

export default function InvestmentsPage() {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showValues } = useValuesVisibility()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newInvestmentTitle, setNewInvestmentTitle] = useState('')
  const [newInvestmentDescription, setNewInvestmentDescription] = useState('')
  const [addFormLoading, setAddFormLoading] = useState(false)
  const [addFormError, setAddFormError] = useState<string | null>(null)

  // Add money to investment state
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null)
  const [addAmount, setAddAmount] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    fetchInvestments()
  }, [])

  const fetchInvestments = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/investments', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setInvestments(data.investments || [])
      } else if (response.status === 503) {
        // Tabela não existe - mostrar botão para criar
        setError('A tabela de investimentos ainda não foi criada. Clique no botão abaixo para criar automaticamente.')
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        setError(errorData.message || 'Erro ao carregar investimentos.')
      }
    } catch (err: any) {
      console.error('Error fetching investments:', err)
      setError('Erro de conexão ao carregar investimentos.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTable = async () => {
    setLoading(true)
    setError(null)
    setAddFormError(null)
    try {
      const response = await fetch('/api/admin/create-investments-table', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        alert('✅ Tabela criada com sucesso! Agora você pode criar investimentos.')
        // Recarregar investimentos
        await fetchInvestments()
        // Se estava no modal, manter aberto para tentar criar novamente
        if (showAddForm) {
          setAddFormError(null)
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
        const errorMsg = errorData.message || 'Erro ao criar tabela.'
        setError(String(errorMsg))
        if (showAddForm) {
          setAddFormError(String(errorMsg))
        }
      }
    } catch (err) {
      console.error('Error creating table:', err)
      const errorMsg = 'Erro de conexão ao criar tabela.'
      setError(errorMsg)
      if (showAddForm) {
        setAddFormError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAddInvestment = async (e: FormEvent) => {
    e.preventDefault()
    setAddFormLoading(true)
    setAddFormError(null)

    if (!newInvestmentTitle.trim()) {
      setAddFormError('Título é obrigatório.')
      setAddFormLoading(false)
      return
    }

    try {
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: newInvestmentTitle,
          description: newInvestmentDescription,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Investimento criado com sucesso!')
        setShowAddForm(false)
        setNewInvestmentTitle('')
        setNewInvestmentDescription('')
        setAddFormError(null)
        fetchInvestments()
      } else if (response.status === 503) {
        // Tabela não existe - mostrar botão para criar
        setAddFormError('A tabela de investimentos ainda não foi criada. Feche este modal e clique no botão "Criar Tabela Automaticamente" na página.')
        // Também tentar criar automaticamente
        handleCreateTable()
      } else {
        const errorMessage = data?.message || data?.error || 'Erro ao criar investimento.'
        setAddFormError(String(errorMessage))
      }
    } catch (err) {
      console.error('Error creating investment:', err)
      setAddFormError('Erro de conexão ao criar investimento.')
    } finally {
      setAddFormLoading(false)
    }
  }

  const handleDeleteInvestment = async (investmentId: string) => {
    if (!confirm('Tem certeza que deseja excluir este investimento?')) {
      return
    }

    try {
      const response = await fetch(`/api/investments/${investmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        alert('Investimento excluído com sucesso!')
        fetchInvestments()
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        alert('Erro ao excluir investimento: ' + (errorData.message || 'Erro desconhecido'))
      }
    } catch (err) {
      console.error('Error deleting investment:', err)
      alert('Erro de conexão ao excluir investimento.')
    }
  }

  const handleAddMoney = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedInvestment) return

    setAddError('')
    setAddLoading(true)

    if (!addAmount || parseFloat(addAmount) <= 0) {
      setAddError('Digite um valor válido')
      setAddLoading(false)
      return
    }

    try {
      const response = await fetch(`/api/investments/${selectedInvestment.id}`, {
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
        setInvestments(investments.map(inv => inv.id === selectedInvestment.id ? data.investment : inv))
        setSelectedInvestment(null)
        setAddAmount('')
        fetchInvestments()
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

  const totalInvested = investments.reduce((sum, inv) => sum + inv.currentAmount, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-400">Carregando investimentos...</p>
      </div>
    )
  }

  if (error && error.includes('tabela')) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Erro: {error}</p>
        <button
          onClick={handleCreateTable}
          disabled={loading}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Criando tabela...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Criar Tabela Automaticamente
            </>
          )}
        </button>
        <p className="text-zinc-500 text-sm mt-4">Ou consulte o arquivo CRIAR_TABELA_INVESTMENTS.md para instruções manuais.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400">Erro: {error}</p>
        <p className="text-zinc-500 text-sm mt-2">Por favor, tente recarregar a página ou fazer login novamente.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-black/25 backdrop-blur-md border border-blue-400/20 rounded-xl shadow-2xl ring-1 ring-blue-400/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Total Investido</p>
                <p className="text-white text-2xl font-bold drop-shadow-lg mt-1">{formatCurrency(totalInvested, showValues)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-black/25 backdrop-blur-md border border-blue-400/20 rounded-xl shadow-2xl ring-1 ring-blue-400/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-300 font-medium text-sm">Investimentos</p>
                <p className="text-white text-2xl font-bold drop-shadow-lg mt-1">{investments.length}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-6">
          <div className="flex justify-end">
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo Investimento
            </button>
          </div>
        </div>
      </motion.div>

      {/* Investments Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {investments.length === 0 ? (
          <div className="text-center py-12 lg:col-span-2">
            <TrendingUp className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">Nenhum investimento encontrado</p>
            <p className="text-zinc-500 text-sm">Crie seu primeiro investimento para começar!</p>
          </div>
        ) : (
          investments.map((investment) => {
            return (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-white font-bold drop-shadow-lg text-lg mb-2">{String(investment.title || '')}</h3>
                    {investment.description && (
                      <p className="text-zinc-300 font-medium text-sm line-clamp-2">{String(investment.description)}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteInvestment(investment.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Amount */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-300 font-medium">Valor Investido</span>
                    <span className="text-white text-2xl font-bold">{formatCurrency(investment.currentAmount, showValues)}</span>
                  </div>
                </div>

                {/* Footer */}
                <button
                  onClick={() => setSelectedInvestment(investment)}
                  className="w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Dinheiro
                </button>
              </motion.div>
            )
          })
        )}
      </motion.div>

      {/* Add Investment Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Novo Investimento</h3>
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setNewInvestmentTitle('')
                  setNewInvestmentDescription('')
                  setAddFormError('')
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddInvestment} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-zinc-300 mb-1">Título do Investimento</label>
                <input
                  type="text"
                  id="title"
                  value={newInvestmentTitle}
                  onChange={(e) => setNewInvestmentTitle(e.target.value)}
                  placeholder="Ex: Reserva de Emergência"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-1">Descrição (Opcional)</label>
                <textarea
                  id="description"
                  value={newInvestmentDescription}
                  onChange={(e) => setNewInvestmentDescription(e.target.value)}
                  placeholder="Detalhes sobre o investimento..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
                ></textarea>
              </div>

              {addFormError && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <p className="text-red-400 text-sm text-center">{String(addFormError)}</p>
                  {addFormError.includes('tabela') && (
                    <button
                      onClick={handleCreateTable}
                      disabled={loading}
                      className="mt-3 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Criando tabela...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Criar Tabela Agora
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={addFormLoading}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {addFormLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                Criar Investimento
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Money Modal */}
      {selectedInvestment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Adicionar Dinheiro</h3>
                <p className="text-zinc-400 text-sm mt-1">Investimento: {String(selectedInvestment.title || '')}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedInvestment(null)
                  setAddAmount('')
                  setAddError('')
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-4 bg-white/5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Valor Atual</span>
                <span className="text-white font-semibold">{formatCurrency(selectedInvestment.currentAmount, showValues)}</span>
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
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-green-500/50"
                  required
                  autoFocus
                />
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
                    setSelectedInvestment(null)
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
