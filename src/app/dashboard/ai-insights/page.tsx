'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Calendar,
  PieChart,
  BarChart3,
  RefreshCw,
  Download,
  Share,
  Star
} from 'lucide-react'
import SimpleBackground from '@/components/ui/simple-background'

export default function AIInsightsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiInsights, setAiInsights] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)

  const filteredInsights = selectedCategory === 'all'
    ? aiInsights
    : aiInsights.filter(insight => insight.category.toLowerCase() === selectedCategory.toLowerCase())

  // Carregar insights ao montar o componente
  useEffect(() => {
    if (!hasLoaded && !isGenerating) {
      handleGenerateInsights()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400 bg-red-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      case 'low': return 'text-green-400 bg-green-500/20'
      default: return 'text-zinc-300 font-medium bg-zinc-500/20'
    }
  }

  const handleGenerateInsights = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.insights && Array.isArray(data.insights)) {
          setAiInsights(data.insights)
        }
        if (data.predictions && Array.isArray(data.predictions)) {
          setPredictions(data.predictions)
        }
        setHasLoaded(true)
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
        if (response.status === 503) {
          alert('OpenAI não está configurada. Configure OPENAI_API_KEY no Vercel.')
        } else {
          alert('Erro ao gerar insights: ' + (errorData.message || 'Erro desconhecido'))
        }
      }
    } catch (error) {
      console.error('Error generating insights:', error)
      alert('Erro de conexão ao gerar insights.')
    } finally {
      setIsGenerating(false)
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
            <Brain className="w-8 h-8 text-purple-400" />
            AI Insights
          </h1>
          <p className="text-zinc-300 font-medium">Análises inteligentes sobre seus hábitos financeiros</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleGenerateInsights}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Analisando...' : 'Gerar Insights'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </motion.div>

      {/* Predictions Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {predictions.map((prediction, index) => (
          <div key={index} className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold drop-shadow-lg">{prediction.title}</h3>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-zinc-300 font-medium">{prediction.confidence}% confiança</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-300 font-medium text-sm">Atual</span>
                <span className="text-white font-bold drop-shadow-lg">
                  {prediction.unit === '%' ? `${prediction.current.toFixed(1)}%` : `R$ ${prediction.current.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-300 font-medium text-sm">Previsão</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold drop-shadow-lg">
                    {prediction.unit === '%' ? `${prediction.predicted.toFixed(1)}%` : `R$ ${prediction.predicted.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </span>
                  {prediction.trend === 'positive' ? (
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6"
      >
        <div className="flex flex-wrap gap-3">
          {['all', 'comportamento', 'otimização', 'metas', 'receita', 'risco'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-white/10 text-zinc-300 font-medium hover:text-white hover:bg-white/20'
              }`}
            >
              {category === 'all' ? 'Todos' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Insights List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="space-y-4"
      >
        {filteredInsights.map((insight) => {
          const Icon = Brain // Usar Brain como padrão
          const isSelected = selectedInsight === insight.id

          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6 hover:border-white/20 transition-all duration-300 cursor-pointer ${
                isSelected ? 'ring-2 ring-purple-500/50' : ''
              }`}
              onClick={() => setSelectedInsight(isSelected ? null : insight.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${insight.color || 'from-purple-500 to-blue-500'} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-bold drop-shadow-lg text-lg mb-1">{insight.title}</h3>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(insight.impact)}`}>
                          {insight.impact === 'high' ? 'Alto Impacto' :
                           insight.impact === 'medium' ? 'Médio Impacto' : 'Baixo Impacto'}
                        </span>
                        <span className="text-xs text-zinc-300 font-medium flex items-center gap-1">
                          <Brain className="w-3 h-3" />
                          {insight.confidence}% de confiança
                        </span>
                        <span className="text-xs text-zinc-300 font-medium">{insight.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-300 font-medium hover:text-yellow-400">
                        <Star className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-300 font-medium hover:text-blue-400">
                        <Share className="w-4 h-4" />
                      </button>
                      <span className="text-xs text-zinc-500">
                        {insight.date ? new Date(insight.date).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <p className="text-zinc-300 mb-4 leading-relaxed">{insight.description}</p>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white/5 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-white font-bold drop-shadow-lg mb-1">Sugestão da IA</h4>
                          <p className="text-zinc-300 text-sm">{insight.suggestion}</p>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-3">
                        <button className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm">
                          Aplicar Sugestão
                        </button>
                        <button className="px-4 py-2 bg-zinc-600/20 hover:bg-zinc-600/30 text-zinc-300 font-medium rounded-lg transition-colors text-sm">
                          Ignorar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {filteredInsights.length === 0 && (
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-zinc-300 font-medium mx-auto mb-4" />
          <p className="text-zinc-300 font-medium text-lg">Nenhum insight encontrado</p>
          <p className="text-zinc-500 text-sm">A IA está analisando seus dados para gerar novos insights.</p>
        </div>
      )}
      </div>
    </>
  )
}