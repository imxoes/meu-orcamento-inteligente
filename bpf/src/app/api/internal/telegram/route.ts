import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const ORBI_SECRET = 'orbi_telegram_secret_2024'
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

interface TelegramMessage {
  message_id: number
  from: {
    id: number
    first_name: string
    username?: string
  }
  chat: {
    id: number
    type: string
  }
  text: string
  date: number
}

interface TelegramUpdate {
  update_id: number
  message: TelegramMessage
}

async function sendMessage(chatId: number, text: string, replyToMessageId?: number) {
  console.log(`📤 Enviando para ${chatId}: ${text.substring(0, 50)}...`)

  const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_to_message_id: replyToMessageId,
      parse_mode: 'Markdown'
    })
  })

  const result = await response.json()
  console.log("📬 Telegram API:", result.ok ? 'Sucesso' : result)
  return result
}

function parseExpenseMessage(message: string): { amount: number; description: string; category: string } | null {
  const patterns = [
    /^(\d+(?:[.,]\d{2})?)\s+(.+)$/,
    /^(?:gasto|gastei)\s+(\d+(?:[.,]\d{2})?)\s+(?:em|no|na|com)?\s*(.+)$/i,
    /^(?:paguei|pago)\s+(\d+(?:[.,]\d{2})?)\s+(?:de|do|da|em|no|na)?\s*(.+)$/i,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'))
      const description = match[2].trim()
      const category = categorizeExpense(description)
      return { amount, description, category }
    }
  }

  return null
}

function categorizeExpense(description: string): string {
  const categories = {
    'Alimentação': ['mercado', 'supermercado', 'restaurante', 'lanche', 'pizza', 'comida', 'café', 'ifood', 'uber eats'],
    'Transporte': ['uber', 'taxi', '99', 'gasolina', 'combustível', 'ônibus', 'metro', 'estacionamento'],
    'Entretenimento': ['cinema', 'netflix', 'spotify', 'jogo', 'show', 'festa', 'bar', 'balada'],
    'Moradia': ['aluguel', 'condomínio', 'luz', 'água', 'gás', 'internet', 'telefone'],
    'Saúde': ['farmácia', 'médico', 'dentista', 'exame', 'consulta', 'remédio'],
    'Compras': ['roupa', 'sapato', 'shopping', 'amazon', 'mercado livre', 'presente'],
    'Educação': ['curso', 'livro', 'escola', 'faculdade', 'aula']
  }

  const lowerDescription = description.toLowerCase()

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerDescription.includes(keyword))) {
      return category
    }
  }

  return 'Outros'
}

function parseQueryMessage(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('saldo') || lowerMessage.includes('quanto tenho')) {
    return 'saldo'
  }
  if (lowerMessage.includes('gastos') && (lowerMessage.includes('mês') || lowerMessage.includes('mensal'))) {
    return 'gastos_mes'
  }
  if (lowerMessage.includes('categoria') || lowerMessage.includes('onde mais gasto')) {
    return 'categoria_mais_gasto'
  }
  if (lowerMessage.includes('meta') || lowerMessage.includes('objetivo')) {
    return 'metas'
  }
  if (lowerMessage.includes('dica') || lowerMessage.includes('conselho')) {
    return 'dicas'
  }

  return 'ajuda'
}

async function generateInsightResponse(queryType: string, userId: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: userId }
    })

    if (!user) {
      return `❌ Usuário não encontrado.`
    }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    switch (queryType) {
      case 'saldo':
        const [expenses, income] = await Promise.all([
          prisma.transaction.aggregate({
            where: { userId: user.id, type: 'EXPENSE', createdAt: { gte: startOfMonth } },
            _sum: { amount: true }
          }),
          prisma.transaction.aggregate({
            where: { userId: user.id, type: 'INCOME', createdAt: { gte: startOfMonth } },
            _sum: { amount: true }
          })
        ])

        const totalExpenses = expenses._sum.amount || 0
        const totalIncome = income._sum.amount || 0
        const balance = totalIncome - totalExpenses

        return `💰 *Resumo Financeiro*\n\n` +
               `Receitas: R$ ${totalIncome.toFixed(2)}\n` +
               `Gastos: R$ ${totalExpenses.toFixed(2)}\n` +
               `Saldo: R$ ${balance.toFixed(2)}\n\n` +
               `${balance >= 0 ? '📊 Você está no positivo!' : '⚠️ Atenção aos gastos!'}`

      case 'gastos_mes':
        const monthlyExpenses = await prisma.transaction.findMany({
          where: { userId: user.id, type: 'EXPENSE', createdAt: { gte: startOfMonth } },
          include: { category: true }
        })

        const totalMonth = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0)
        return `📊 *Gastos do Mês*\n\nTotal: R$ ${totalMonth.toFixed(2)}\n\n` +
               `Você fez ${monthlyExpenses.length} transações este mês.`

      default:
        return `🤖 *Como posso ajudar?*\n\n` +
               `📝 *Registrar gastos:*\n` +
               `• "50 uber"\n` +
               `• "25.90 supermercado"\n` +
               `• "gastei 100 em gasolina"\n\n` +
               `📊 *Consultas:*\n` +
               `• "qual meu saldo?"\n` +
               `• "gastos do mês"`
    }
  } catch (error) {
    console.error('Error:', error)
    return '❌ Erro ao buscar informações.'
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔥 INTERNAL API: Recebido do Worker")

    // Validate secret from Worker
    const secret = request.headers.get('x-orbi-secret')
    if (secret !== ORBI_SECRET) {
      console.log("❌ Secret inválido:", secret)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const update: TelegramUpdate = await request.json()
    console.log("📩 UPDATE:", JSON.stringify(update, null, 2))

    if (!update.message) {
      console.log("⚠️ Update sem message")
      return NextResponse.json({ ok: true })
    }

    const { message } = update
    const chatId = message.chat.id
    const text = message.text?.trim() || ''
    const userId = message.from.id.toString()

    console.log(`👤 Usuário ${userId} disse: "${text}"`)

    // Comando /start
    if (text === '/start') {
      const welcomeMessage =
        `🎉 *Bem-vindo ao Orbi - Seu Orçamento Inteligente!*\n\n` +
        `Registre gastos naturalmente:\n` +
        `• "50 uber"\n` +
        `• "25.90 supermercado"\n` +
        `• "gastei 100 em gasolina"\n\n` +
        `Consulte seus dados:\n` +
        `• "qual meu saldo?"\n` +
        `• "gastos do mês"\n\n` +
        `✨ Digite sua primeira mensagem!`

      await sendMessage(chatId, welcomeMessage, message.message_id)
      return NextResponse.json({ ok: true })
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { telegramId: userId }
    })

    if (!user) {
      await sendMessage(chatId, `❌ Usuário não encontrado. Tente /start primeiro.`, message.message_id)
      return NextResponse.json({ ok: true })
    }

    // Tentar interpretar como gasto
    const expenseData = parseExpenseMessage(text)

    if (expenseData) {
      console.log(`💸 Gasto detectado: R$ ${expenseData.amount} - ${expenseData.description}`)

      // Buscar categoria
      let category = await prisma.category.findFirst({
        where: { name: expenseData.category }
      })

      if (!category) {
        category = await prisma.category.findFirst({
          where: { name: 'Outros' }
        })
      }

      // Criar transação
      const transaction = await prisma.transaction.create({
        data: {
          amount: expenseData.amount,
          description: expenseData.description,
          type: 'EXPENSE',
          method: 'OTHER',
          userId: user.id,
          categoryId: category!.id
        }
      })

      console.log("✅ Transação salva:", transaction.id)

      const confirmMessage =
        `✅ *Gasto Registrado!*\n\n` +
        `💰 Valor: R$ ${expenseData.amount.toFixed(2)}\n` +
        `📝 Descrição: ${expenseData.description}\n` +
        `🏷️ Categoria: ${expenseData.category}`

      await sendMessage(chatId, confirmMessage, message.message_id)
      return NextResponse.json({ ok: true })
    }

    // Se não é gasto, tratar como consulta
    const queryType = parseQueryMessage(text)
    const response = await generateInsightResponse(queryType, userId)

    await sendMessage(chatId, response, message.message_id)
    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('🚨 INTERNAL ERROR:', error)
    return NextResponse.json({ ok: true, error: 'Internal error' })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Internal Telegram API ready',
    timestamp: new Date().toISOString()
  })
}