/**
 * OpenAI Utilities
 * Funções para integração com OpenAI API
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

interface CategorizationResult {
  category: string
  confidence: number
  reasoning?: string
}

/**
 * Categoriza uma descrição de gasto usando OpenAI
 * Retorna a categoria mais apropriada com base no contexto
 */
export async function categorizeExpenseWithAI(
  description: string,
  amount?: number
): Promise<CategorizationResult | null> {
  if (!OPENAI_API_KEY) {
    return null // OpenAI não configurado
  }

  try {
    const prompt = `Você é um assistente financeiro especializado em categorização de gastos.

Analise a seguinte descrição de gasto e categorize-a em UMA das seguintes categorias:
- Refeição (comida, delivery, restaurante, padaria, supermercado, lanches, salgados, coxinha, pizza, hambúrguer)
- Transporte (uber, taxi, gasolina, ônibus, metro)
- Entretenimento (cinema, streaming, jogos, shows)
- Moradia (aluguel, contas de luz/água, internet)
- Saúde (farmácia, médico, dentista, academia, suplementos, terapia)
- Compras (roupas, eletrônicos, presentes)
- Educação (cursos, livros, mensalidades)
- Bens (casa, carro, eletrônicos duráveis)
- Serviços (pintura, manutenção, reparos)
- Pessoal (cabelo, unha, estética)
- Outros (não se encaixa nas anteriores)

Descrição: "${description}"
${amount ? `Valor: R$ ${amount.toFixed(2)}` : ''}

Responda APENAS com o nome da categoria (ex: "Delivery", "Supermercado", etc). Não inclua explicações.`

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente financeiro. Responda apenas com o nome da categoria.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      })
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const category = data.choices?.[0]?.message?.content?.trim()

    if (!category) {
      return null
    }

    // Normalizar categoria
    const normalizedCategory = category
      .replace(/["'`]/g, '')
      .trim()
      .split('\n')[0] // Pegar primeira linha se houver quebra

    return {
      category: normalizedCategory,
      confidence: 0.9,
      reasoning: `Categorizado por IA: ${normalizedCategory}`
    }

  } catch (error) {
    console.error('Error calling OpenAI:', error)
    return null
  }
}

export interface FinancialInsight {
  id: string
  title: string
  description: string
  category: 'comportamento' | 'otimização' | 'metas' | 'receita' | 'risco'
  impact: 'high' | 'medium' | 'low'
  confidence: number
  suggestion: string
  date: string
  icon?: string
  color?: string
}

export interface Prediction {
  title: string
  current: number
  predicted: number
  confidence: number
  trend: 'positive' | 'negative' | 'neutral'
  unit?: string
}

/**
 * Gera insights financeiros estruturados usando OpenAI
 */
export async function generateFinancialInsights(
  transactions: any[],
  goals: any[],
  investments?: any[],
  userContext?: string
): Promise<{ insights: FinancialInsight[], predictions: Prediction[] } | null> {
  if (!OPENAI_API_KEY) {
    return null
  }

  try {
    // Preparar contexto dos dados
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.createdAt)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpenses

    const monthExpenses = monthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const monthIncome = monthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    // Agrupar por categoria
    const categoryBreakdown: Record<string, number> = {}
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        const catName = t.category?.name || 'Outros'
        categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + t.amount
      })

    const topCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => `${name}: R$ ${amount.toFixed(2)}`)

    const activeGoals = goals.filter(g => {
      const progress = (g.currentAmount / g.targetAmount) * 100
      return progress < 100
    })

    const totalInvestments = investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0

    const prompt = `Você é um consultor financeiro pessoal especializado. Analise os dados financeiros abaixo e gere insights estruturados.

DADOS DO USUÁRIO:
- Receitas totais (histórico): R$ ${totalIncome.toFixed(2)}
- Gastos totais (histórico): R$ ${totalExpenses.toFixed(2)}
- Saldo atual: R$ ${balance.toFixed(2)}
- Receitas do mês atual: R$ ${monthIncome.toFixed(2)}
- Gastos do mês atual: R$ ${monthExpenses.toFixed(2)}
- Top 5 categorias de gasto: ${topCategories.join(', ')}
- Número de metas ativas: ${activeGoals.length}
- Total investido: R$ ${totalInvestments.toFixed(2)}
${userContext ? `- Contexto adicional: ${userContext}` : ''}

INSTRUÇÕES:
Gere uma resposta JSON com exatamente este formato:
{
  "insights": [
    {
      "title": "Título do insight (máximo 60 caracteres)",
      "description": "Descrição detalhada do insight (2-3 frases)",
      "category": "comportamento|otimização|metas|receita|risco",
      "impact": "high|medium|low",
      "confidence": 85,
      "suggestion": "Sugestão prática e acionável (1-2 frases)"
    }
  ],
  "predictions": [
    {
      "title": "Saldo em 3 meses",
      "current": ${balance},
      "predicted": [calcule baseado em tendências],
      "confidence": 75,
      "trend": "positive|negative|neutral"
    },
    {
      "title": "Gastos mensais (próximos 3 meses)",
      "current": ${monthExpenses},
      "predicted": [calcule baseado em média],
      "confidence": 70,
      "trend": "positive|negative|neutral"
    }
  ]
}

Gere 4-6 insights relevantes e 2-3 previsões. Seja específico e baseado nos dados reais. Use português brasileiro.`

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um consultor financeiro. Retorne APENAS JSON válido, sem markdown, sem explicações.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      return null
    }

    try {
      const parsed = JSON.parse(content)
      
      // Adicionar IDs e timestamps aos insights
      const insights: FinancialInsight[] = (parsed.insights || []).map((insight: any, index: number) => ({
        id: `insight-${Date.now()}-${index}`,
        title: insight.title || 'Insight',
        description: insight.description || '',
        category: insight.category || 'comportamento',
        impact: insight.impact || 'medium',
        confidence: insight.confidence || 75,
        suggestion: insight.suggestion || '',
        date: new Date().toISOString(),
        icon: 'Brain',
        color: 'from-purple-500 to-blue-500'
      }))

      // Processar previsões
      const predictions: Prediction[] = (parsed.predictions || []).map((pred: any) => ({
        title: pred.title || 'Previsão',
        current: pred.current || 0,
        predicted: pred.predicted || 0,
        confidence: pred.confidence || 70,
        trend: pred.trend || 'neutral',
        unit: pred.unit
      }))

      return { insights, predictions }

    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      return null
    }

  } catch (error) {
    console.error('Error generating insights with OpenAI:', error)
    return null
  }
}

export interface SmartTip {
  id: string
  title: string
  description: string
  category: 'planejamento' | 'economia' | 'poupança' | 'segurança' | 'automação'
  difficulty: 'muito fácil' | 'fácil' | 'médio' | 'difícil'
  timeToImplement: string
  potentialSavings: string
  rating: number
  steps: string[]
  tags: string[]
  icon?: string
  color?: string
}

/**
 * Gera dicas inteligentes personalizadas baseadas nos dados do cliente
 */
export async function generateSmartTips(
  transactions: any[],
  goals: any[],
  investments?: any[]
): Promise<SmartTip[] | null> {
  if (!OPENAI_API_KEY) {
    return null
  }

  try {
    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpenses

    const categoryBreakdown: Record<string, number> = {}
    transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        const catName = t.category?.name || 'Outros'
        categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + t.amount
      })

    const topCategories = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0

    const prompt = `Você é um consultor financeiro especializado em educação financeira. Analise os dados e gere dicas práticas e personalizadas.

DADOS:
- Receitas: R$ ${totalIncome.toFixed(2)}
- Gastos: R$ ${totalExpenses.toFixed(2)}
- Saldo: R$ ${balance.toFixed(2)}
- Taxa de poupança: ${savingsRate.toFixed(1)}%
- Top categorias: ${topCategories.map(([name, amount]) => `${name} (R$ ${amount.toFixed(2)})`).join(', ')}
- Metas ativas: ${goals.length}

Gere uma resposta JSON com este formato:
{
  "tips": [
    {
      "title": "Título da dica (máximo 50 caracteres)",
      "description": "Descrição detalhada (2-3 frases explicando a dica)",
      "category": "planejamento|economia|poupança|segurança|automação",
      "difficulty": "muito fácil|fácil|médio|difícil",
      "timeToImplement": "5 minutos|1 hora|1 dia|1 semana",
      "potentialSavings": "R$ 50/mês|R$ 200/mês|R$ 500/mês|R$ 1000+/mês",
      "rating": 4.5,
      "steps": ["Passo 1", "Passo 2", "Passo 3"],
      "tags": ["tag1", "tag2"]
    }
  ]
}

Gere 6-8 dicas relevantes e específicas baseadas nos dados. Seja prático e acionável. Use português brasileiro.`

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um consultor financeiro. Retorne APENAS JSON válido, sem markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      return null
    }

    try {
      const parsed = JSON.parse(content)
      
      const tips: SmartTip[] = (parsed.tips || []).map((tip: any, index: number) => ({
        id: `tip-${Date.now()}-${index}`,
        title: tip.title || 'Dica',
        description: tip.description || '',
        category: tip.category || 'economia',
        difficulty: tip.difficulty || 'fácil',
        timeToImplement: tip.timeToImplement || '1 hora',
        potentialSavings: tip.potentialSavings || 'R$ 50/mês',
        rating: tip.rating || 4.0,
        steps: tip.steps || [],
        tags: tip.tags || [],
        icon: 'Lightbulb',
        color: 'from-blue-500 to-purple-500'
      }))

      return tips

    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      return null
    }

  } catch (error) {
    console.error('Error generating smart tips with OpenAI:', error)
    return null
  }
}

export interface AIReport {
  id: string
  title: string
  description: string
  type: 'monthly' | 'goals' | 'income' | 'behavior' | 'forecast'
  status: 'completed' | 'generating' | 'scheduled' | 'error'
  generatedAt: string
  fileSize?: string
  insights?: number
  categories: string[]
  summary?: {
    totalExpenses?: number
    compared?: number
    topCategory?: string
    goalsOnTrack?: number
    goalsDelayed?: number
    totalProgress?: number
    spendingTriggers?: string[]
    bestDays?: string[]
    worstDays?: string[]
    recommendation?: string
  }
}

/**
 * Gera relatórios AI completos com análises detalhadas
 */
export async function generateAIReport(
  transactions: any[],
  goals: any[],
  investments?: any[],
  reportType: 'monthly' | 'goals' | 'income' | 'behavior' | 'forecast' = 'monthly'
): Promise<AIReport | null> {
  if (!OPENAI_API_KEY) {
    return null
  }

  try {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.createdAt)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    const prevMonthTransactions = transactions.filter(t => {
      const date = new Date(t.createdAt)
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear
    })

    const monthExpenses = monthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const prevMonthExpenses = prevMonthTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const monthIncome = monthTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const categoryBreakdown: Record<string, number> = {}
    monthTransactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        const catName = t.category?.name || 'Outros'
        categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + t.amount
      })

    const topCategory = Object.entries(categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'

    const activeGoals = goals.filter(g => {
      const progress = (g.currentAmount / g.targetAmount) * 100
      return progress < 100
    })

    const goalsOnTrack = activeGoals.filter(g => {
      const progress = (g.currentAmount / g.targetAmount) * 100
      const daysSinceStart = Math.floor((Date.now() - new Date(g.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      const expectedProgress = (daysSinceStart / (g.deadline ? Math.floor((new Date(g.deadline).getTime() - new Date(g.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 365)) * 100
      return progress >= expectedProgress * 0.9
    }).length

    const totalProgress = activeGoals.length > 0
      ? activeGoals.reduce((sum, g) => sum + (g.currentAmount / g.targetAmount) * 100, 0) / activeGoals.length
      : 0

    const comparison = prevMonthExpenses > 0
      ? ((monthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100
      : 0

    const prompt = `Você é um analista financeiro especializado. Gere um relatório completo e profissional.

DADOS DO MÊS ATUAL:
- Receitas: R$ ${monthIncome.toFixed(2)}
- Gastos: R$ ${monthExpenses.toFixed(2)}
- Comparado ao mês anterior: ${comparison > 0 ? '+' : ''}${comparison.toFixed(1)}%
- Categoria principal: ${topCategory}
- Metas ativas: ${activeGoals.length}
- Metas no prazo: ${goalsOnTrack}
- Progresso médio das metas: ${totalProgress.toFixed(1)}%

Gere uma resposta JSON com este formato:
{
  "title": "Título do relatório (ex: 'Relatório Financeiro Mensal - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}')",
  "description": "Descrição executiva do relatório (2-3 frases)",
  "summary": {
    "totalExpenses": ${monthExpenses},
    "compared": ${comparison.toFixed(1)},
    "topCategory": "${topCategory}",
    "goalsOnTrack": ${goalsOnTrack},
    "goalsDelayed": ${activeGoals.length - goalsOnTrack},
    "totalProgress": ${totalProgress.toFixed(1)},
    "spendingTriggers": ["Gatilho 1", "Gatilho 2"],
    "bestDays": ["Segunda-feira", "Terça-feira"],
    "worstDays": ["Sexta-feira", "Sábado"],
    "recommendation": "Recomendação principal da IA baseada nos dados (2-3 frases)"
  }
}

Seja específico e baseado nos dados reais. Use português brasileiro.`

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um analista financeiro. Retorne APENAS JSON válido, sem markdown.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    
    if (!content) {
      return null
    }

    try {
      const parsed = JSON.parse(content)
      
      const report: AIReport = {
        id: `report-${Date.now()}`,
        title: parsed.title || 'Relatório Financeiro',
        description: parsed.description || '',
        type: reportType,
        status: 'completed',
        generatedAt: new Date().toISOString(),
        fileSize: '2.5 MB',
        insights: 5,
        categories: [topCategory, ...Object.keys(categoryBreakdown).slice(1, 3)],
        summary: parsed.summary || {}
      }

      return report

    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError)
      return null
    }

  } catch (error) {
    console.error('Error generating AI report with OpenAI:', error)
    return null
  }
}

/**
 * Verifica se OpenAI está configurado
 */
export function isOpenAIConfigured(): boolean {
  return !!OPENAI_API_KEY
}

