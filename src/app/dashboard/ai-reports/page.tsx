'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Brain,
  Eye,
  Share,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react'
import SimpleBackground from '@/components/ui/simple-background'

const reportTypes = [
  { id: 'all', name: 'Todos', icon: FileText },
  { id: 'monthly', name: 'Mensais', icon: Calendar },
  { id: 'goals', name: 'Metas', icon: TrendingUp },
  { id: 'income', name: 'Receitas', icon: DollarSign },
  { id: 'behavior', name: 'Comportamentais', icon: Brain },
  { id: 'forecast', name: 'Previsões', icon: BarChart3 }
]

export default function AIReportsPage() {
  const [selectedType, setSelectedType] = useState('all')
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [reports, setReports] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const filteredReports = selectedType === 'all'
    ? reports
    : reports.filter(report => report.type === selectedType)

  // Carregar relatórios ao montar o componente
  useEffect(() => {
    if (!hasLoaded && !isGenerating) {
      handleGenerateReport('monthly')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerateReport = async (type: string = 'monthly') => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ type })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.report) {
          setReports(prev => [data.report, ...prev])
        }
        setHasLoaded(true)
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
        if (response.status === 503) {
          alert('OpenAI não está configurada. Configure OPENAI_API_KEY no Vercel.')
        } else {
          alert('Erro ao gerar relatório: ' + (errorData.message || 'Erro desconhecido'))
        }
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Erro de conexão ao gerar relatório.')
    } finally {
      setIsGenerating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'generating': return <Clock className="w-4 h-4 text-yellow-400 animate-spin" />
      case 'scheduled': return <Calendar className="w-4 h-4 text-blue-400" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />
      default: return <FileText className="w-4 h-4 text-zinc-300 font-medium" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-500/20'
      case 'generating': return 'text-yellow-400 bg-yellow-500/20'
      case 'scheduled': return 'text-blue-400 bg-blue-500/20'
      case 'error': return 'text-red-400 bg-red-500/20'
      default: return 'text-zinc-300 font-medium bg-zinc-500/20'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído'
      case 'generating': return 'Gerando...'
      case 'scheduled': return 'Agendado'
      case 'error': return 'Erro'
      default: return 'Desconhecido'
    }
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            Relatórios IA
          </h1>
          <p className="text-zinc-300 font-medium">Relatórios inteligentes gerados automaticamente pela IA</p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => handleGenerateReport('monthly')}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            {isGenerating ? 'Gerando...' : 'Novo Relatório'}
          </button>
        </div>
      </motion.div>

      {/* Report Type Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6"
      >
        <div className="flex flex-wrap gap-3">
          {reportTypes.map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  selectedType === type.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-white/10 text-zinc-300 font-medium hover:text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                {type.name}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Reports List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-4"
      >
        {filteredReports.map((report) => {
          const isExpanded = selectedReport === report.id

          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 hover:border-white/20 transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-white font-bold drop-shadow-lg text-lg mb-2">{report.title}</h3>
                      
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(report.status)}`}>
                          {getStatusIcon(report.status)}
                          {getStatusText(report.status)}
                        </span>
                        
                        {report.insights && (
                          <span className="text-xs text-zinc-300 font-medium flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            {report.insights} insights
                          </span>
                        )}
                        
                        {report.generatedAt && (
                          <span className="text-xs text-zinc-300 font-medium">
                            {new Date(report.generatedAt).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        
                        {report.fileSize && (
                          <span className="text-xs text-zinc-300 font-medium">{report.fileSize}</span>
                        )}
                      </div>

                      <p className="text-zinc-300 text-sm leading-relaxed mb-3">{report.description}</p>

                      <div className="flex flex-wrap items-center gap-2">
                        {report.categories.map((category: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-white/10 rounded-lg text-xs text-zinc-300 font-medium">
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary for completed reports */}
                  {report.status === 'completed' && report.summary && (
                    <div className="bg-white/5 rounded-xl p-4 mb-4">
                      <h4 className="text-white font-bold drop-shadow-lg mb-3">Resumo Executivo</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(report.summary).map(([key, value], index) => {
                          if (key === 'recommendation') return null
                          return (
                            <div key={index} className="text-center">
                              <p className="text-zinc-300 font-medium text-xs mb-1">
                                {key === 'totalExpenses' && 'Total de Gastos'}
                                {key === 'compared' && 'Variação'}
                                {key === 'topCategory' && 'Categoria Principal'}
                                {key === 'goalsOnTrack' && 'Metas no Prazo'}
                                {key === 'goalsDelayed' && 'Metas Atrasadas'}
                                {key === 'totalProgress' && 'Progresso Total'}
                                {key === 'spendingTriggers' && 'Gatilhos de Gasto'}
                                {key === 'bestDays' && 'Melhores Dias'}
                                {key === 'worstDays' && 'Piores Dias'}
                              </p>
                              <p className="text-white font-bold drop-shadow-lg">
                                {typeof value === 'number' && key.includes('total') ? `R$ ${value.toLocaleString()}` :
                                 typeof value === 'number' && key.includes('Progress') ? `${value}%` :
                                 typeof value === 'number' && key.includes('compared') ? `${value > 0 ? '+' : ''}${value}%` :
                                 Array.isArray(value) ? value.join(', ') : String(value)}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                      
                      {report.summary.recommendation && (
                        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Brain className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <h5 className="text-blue-400 font-medium text-sm mb-1">Recomendação da IA</h5>
                              <p className="text-zinc-300 text-sm">{report.summary.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {report.status === 'completed' && (
                    <>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-300 font-medium hover:text-blue-400">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-300 font-medium hover:text-green-400">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-300 font-medium hover:text-purple-400">
                        <Share className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {report.status === 'generating' && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 rounded-lg">
                      <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
                      <span className="text-yellow-400 text-sm">Processando...</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-zinc-300 font-medium mx-auto mb-4" />
          <p className="text-zinc-300 font-medium text-lg">Nenhum relatório encontrado</p>
          <p className="text-zinc-500 text-sm">Crie seu primeiro relatório automático.</p>
        </div>
      )}
      </div>
    </>
  )
}