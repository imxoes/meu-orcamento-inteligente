'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Lightbulb,
  TrendingUp,
  DollarSign,
  Target,
  Calendar,
  Heart,
  Star,
  BookOpen,
  Shield,
  Zap,
  CheckCircle,
  X,
  ThumbsUp,
  ThumbsDown,
  Bookmark
} from 'lucide-react'
import SimpleBackground from '@/components/ui/simple-background'

export default function SmartTipsPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedTip, setSelectedTip] = useState<string | null>(null)
  const [implementedTips, setImplementedTips] = useState<string[]>([])
  const [bookmarkedTips, setBookmarkedTips] = useState<string[]>([])
  const [smartTips, setSmartTips] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const categories = ['all', 'planejamento', 'economia', 'poupança', 'segurança', 'automação']

  const filteredTips = selectedCategory === 'all'
    ? smartTips
    : smartTips.filter(tip => tip.category.toLowerCase() === selectedCategory)

  // Carregar dicas ao montar o componente
  useEffect(() => {
    if (!hasLoaded && !isGenerating) {
      handleGenerateTips()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerateTips = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/tips', {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.tips && Array.isArray(data.tips)) {
          setSmartTips(data.tips)
        }
        setHasLoaded(true)
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }))
        if (response.status === 503) {
          alert('OpenAI não está configurada. Configure OPENAI_API_KEY no Vercel.')
        } else {
          alert('Erro ao gerar dicas: ' + (errorData.message || 'Erro desconhecido'))
        }
      }
    } catch (error) {
      console.error('Error generating tips:', error)
      alert('Erro de conexão ao gerar dicas.')
    } finally {
      setIsGenerating(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'muito fácil': return 'text-green-400 bg-green-500/20'
      case 'fácil': return 'text-blue-400 bg-blue-500/20'
      case 'médio': return 'text-yellow-400 bg-yellow-500/20'
      case 'difícil': return 'text-red-400 bg-red-500/20'
      default: return 'text-zinc-300 font-medium bg-zinc-500/20'
    }
  }

  const handleImplement = (tipId: string) => {
    setImplementedTips(prev => 
      prev.includes(tipId) 
        ? prev.filter(id => id !== tipId)
        : [...prev, tipId]
    )
  }

  const handleBookmark = (tipId: string) => {
    setBookmarkedTips(prev =>
      prev.includes(tipId)
        ? prev.filter(id => id !== tipId)
        : [...prev, tipId]
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-blue-400" />
            Dicas Inteligentes
          </h1>
          <p className="text-zinc-300 font-medium">Estratégias práticas para melhorar sua saúde financeira</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
            <CheckCircle className="w-4 h-4 text-green-400" />
            {implementedTips.length} implementadas
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
            <Bookmark className="w-4 h-4 text-blue-400" />
            {bookmarkedTips.length} salvas
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-6"
      >
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-xl transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-white/10 text-zinc-300 font-medium hover:text-white hover:bg-white/20'
              }`}
            >
              {category === 'all' ? 'Todas' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Tips Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {filteredTips.map((tip) => {
          const Icon = tip.icon
          const isImplemented = implementedTips.includes(tip.id)
          const isBookmarked = bookmarkedTips.includes(tip.id)
          const isExpanded = selectedTip === tip.id

          return (
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-xl p-6 hover:border-purple-500/30 transition-all duration-300 ${
                isImplemented ? 'ring-2 ring-green-500/50' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${tip.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold drop-shadow-lg text-lg mb-2">{tip.title}</h3>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tip.difficulty)}`}>
                        {tip.difficulty}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium text-zinc-300 font-medium bg-zinc-500/20">
                        {tip.timeToImplement}
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="text-xs text-zinc-300 font-medium">{tip.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleBookmark(tip.id)}
                    className={`p-2 hover:bg-white/10 rounded-lg transition-colors ${
                      isBookmarked ? 'text-blue-400' : 'text-zinc-300 font-medium hover:text-blue-400'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-4">
                <p className="text-zinc-300 leading-relaxed">{tip.description}</p>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-zinc-300 font-medium">Economia potencial: </span>
                    <span className="text-green-400 font-semibold">{tip.potentialSavings}</span>
                  </div>
                  
                  <button
                    onClick={() => setSelectedTip(isExpanded ? null : tip.id)}
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    {isExpanded ? 'Ver menos' : 'Ver passos'}
                  </button>
                </div>

                {/* Expanded Steps */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/5 rounded-xl p-4 space-y-3"
                  >
                    <h4 className="text-white font-bold drop-shadow-lg mb-3 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      Passos para implementar:
                    </h4>
                    
                    <div className="space-y-2">
                      {tip.steps.map((step: any, index: number) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-400 text-xs font-medium">{index + 1}</span>
                          </div>
                          <p className="text-zinc-300 text-sm">{step}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-3">
                      <span className="text-zinc-300 font-medium text-sm">Tags:</span>
                      {tip.tags.map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-white/10 rounded-lg text-xs text-zinc-300 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => handleImplement(tip.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                      isImplemented
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                    }`}
                  >
                    {isImplemented ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Implementado
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4" />
                        Implementar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {filteredTips.length === 0 && (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 text-zinc-300 font-medium mx-auto mb-4" />
          <p className="text-zinc-300 font-medium text-lg">Nenhuma dica encontrada</p>
          <p className="text-zinc-500 text-sm">Tente selecionar uma categoria diferente.</p>
        </div>
      )}
      </div>
    </>
  )
}