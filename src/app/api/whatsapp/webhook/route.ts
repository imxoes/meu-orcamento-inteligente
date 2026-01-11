import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp-utils'

// Reutilizar funções de parse do Telegram
import {
  parseIncomeMessage,
  parseExpenseMessage
} from '@/lib/telegram-parser'

// Evolution API message interfaces
interface EvolutionMessage {
  key: {
    remoteJid: string // Número com @s.whatsapp.net
    fromMe: boolean
    id: string
  }
  message?: {
    conversation?: string
    extendedTextMessage?: {
      text: string
    }
  }
  messageTimestamp: number
  pushName?: string
  status?: string
}

interface EvolutionWebhook {
  event: string // 'messages.upsert', 'connection.update', etc
  instance: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    message?: {
      conversation?: string
      extendedTextMessage?: {
        text: string
      }
    }
    messageTimestamp: number
    pushName?: string
  }
}

// Legacy interface para compatibilidade com EditaCódigo
interface WhatsAppMessage {
  from: string // Número do remetente
  body: string // Texto da mensagem
  timestamp: number
}

interface WhatsAppWebhook {
  event: string // 'message', 'status', etc
  data: WhatsAppMessage
}

/**
 * GET - Verificação do webhook (se necessário pela API)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const verifyToken = searchParams.get('verify_token')
  const challenge = searchParams.get('challenge')

  // Verificar token (ajustar conforme documentação da EditaCódigo)
  if (verifyToken === process.env.EDITA_CODIGO_VERIFY_TOKEN) {
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
}

/**
 * POST - Receber mensagens do WhatsApp (Evolution API e EditaCódigo)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📩 Webhook WhatsApp recebido:', JSON.stringify(body, null, 2))

    let phoneNumber: string = ''
    let text: string = ''
    let timestamp: number = Date.now()

    // Detectar formato da mensagem (Evolution API vs EditaCódigo)
    if (isEvolutionAPIWebhook(body)) {
      // Evolution API format
      const evolutionData = body as EvolutionWebhook

      // Ignorar mensagens enviadas por nós
      if (evolutionData.data.key.fromMe) {
        return NextResponse.json({ ok: true })
      }

      // Extrair dados da Evolution API
      const remoteJid = evolutionData.data.key.remoteJid
      phoneNumber = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '')

      // Extrair texto da mensagem
      text = evolutionData.data.message?.conversation ||
             evolutionData.data.message?.extendedTextMessage?.text || ''

      timestamp = evolutionData.data.messageTimestamp * 1000 // Evolution usa segundos, convertemos para ms

      console.log(`📱 Evolution API - Usuário ${phoneNumber} disse: "${text}"`)

    } else {
      // EditaCódigo format (legacy)
      phoneNumber = (body.from || body.number || body.phone || '').replace(/\D/g, '')
      text = body.body || body.text || body.message || ''
      timestamp = body.timestamp || Date.now()

      console.log(`📱 EditaCódigo - Usuário ${phoneNumber} disse: "${text}"`)
    }

    // Validar dados extraídos
    if (!phoneNumber || !text.trim()) {
      console.log('⚠️ Mensagem inválida - campos ausentes:', { phoneNumber, text })
      return NextResponse.json({ ok: true })
    }

    text = text.trim()

    // Buscar usuário pelo WhatsApp ID
    const user = await prisma.user.findUnique({
      where: { whatsappId: phoneNumber }
    })

    if (!user) {
      // Usuário não vinculado - enviar mensagem de boas-vindas e instruções
      const welcomeMessage =
        `🎉 *Bem-vindo ao Orbi - Seu Orçamento Inteligente!*\n\n` +
        `Para começar, você precisa vincular sua conta WhatsApp ao seu perfil no site.\n\n` +
        `Acesse: https://useorbi.app/dashboard/whatsapp-bot\n\n` +
        `Depois de vincular, você poderá:\n` +
        `• Registrar receitas: "recebi 1200 de salário"\n` +
        `• Registrar gastos: "gastei 50 em uber"\n` +
        `• Consultar saldo: "qual meu saldo?"\n` +
        `• E muito mais!`

      await sendWhatsAppMessage(phoneNumber, welcomeMessage)
      return NextResponse.json({ ok: true })
    }

    // Processar mensagem (reutilizar lógica do Telegram)
    await processMessage(user.id, phoneNumber, text)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('❌ Erro no webhook WhatsApp:', error)
    return NextResponse.json({ ok: true }) // Sempre retornar ok para não bloquear webhook
  }
}

/**
 * Detecta se o webhook é da Evolution API
 */
function isEvolutionAPIWebhook(body: any): boolean {
  return body.event && body.instance && body.data && body.data.key && body.data.key.remoteJid
}

/**
 * Processa a mensagem do usuário
 */
async function processMessage(userId: string, phoneNumber: string, text: string) {
  const lowerText = text.toLowerCase().trim()

  // Comando /start ou /ajuda
  if (lowerText === '/start' || lowerText === '/ajuda' || lowerText === 'ajuda' || lowerText === 'help') {
    const helpMessage = 
      `🤖 *Orbi - Comandos Disponíveis*\n\n` +
      `💰 *Registrar Receitas:*\n` +
      `• "recebi 1200 de salário"\n` +
      `• "ganhei 500 de freelance"\n` +
      `• "recebi meu salario de 1200 reais"\n\n` +
      `📝 *Registrar Gastos:*\n` +
      `• "50 uber"\n` +
      `• "25.90 supermercado"\n` +
      `• "gastei 100 em gasolina"\n` +
      `• "comprei carro 25000"\n\n` +
      `📊 *Consultas:*\n` +
      `• "qual meu saldo?"\n` +
      `• "gastos do mês"\n` +
      `• "onde mais gasto?"\n` +
      `• "como estão minhas metas?"\n` +
      `• "me dê uma dica"`

    await sendWhatsAppMessage(phoneNumber, helpMessage)
    return
  }

  // Tentar processar como receita
  const incomeData = parseIncomeMessage(text)
  if (incomeData) {
    await handleIncome(userId, phoneNumber, incomeData)
    return
  }

  // Tentar processar como despesa
  const expenseData = await parseExpenseMessage(text)
  if (expenseData) {
    await handleExpense(userId, phoneNumber, expenseData)
    return
  }

  // Consultas
  if (lowerText.includes('saldo') || lowerText.includes('quanto tenho')) {
    await handleBalanceQuery(userId, phoneNumber)
    return
  }

  if (lowerText.includes('gastos') && (lowerText.includes('mês') || lowerText.includes('mes'))) {
    await handleMonthlyExpensesQuery(userId, phoneNumber)
    return
  }

  if (lowerText.includes('onde') && lowerText.includes('gasto')) {
    await handleTopExpensesQuery(userId, phoneNumber)
    return
  }

  if (lowerText.includes('metas') || lowerText.includes('meta')) {
    await handleGoalsQuery(userId, phoneNumber)
    return
  }

  if (lowerText.includes('dica') || lowerText.includes('dicas')) {
    await handleTipQuery(userId, phoneNumber)
    return
  }

  // Mensagem não reconhecida
  const unknownMessage = 
    `🤖 *Como posso ajudar?*\n\n` +
    `💰 Para registrar receitas:\n` +
    `• "recebi 1200 de salário"\n` +
    `• "ganhei 500 de freelance"\n\n` +
    `📝 Para registrar gastos:\n` +
    `• "50 uber"\n` +
    `• "25.90 supermercado"\n` +
    `• "gastei 100 em gasolina"\n\n` +
    `📊 Para consultas:\n` +
    `• "qual meu saldo?"\n` +
    `• "gastos do mês"\n` +
    `• "onde mais gasto?"\n` +
    `• "como estão minhas metas?"\n` +
    `• "me dê uma dica"`

  await sendWhatsAppMessage(phoneNumber, unknownMessage)
}

/**
 * Processa registro de receita
 */
async function handleIncome(userId: string, phoneNumber: string, incomeData: { amount: number; description: string; category: string }) {
  try {
    // Buscar ou criar categoria
    let category = await prisma.category.findFirst({
      where: { name: incomeData.category }
    })

    if (!category) {
      category = await prisma.category.create({
        data: { name: incomeData.category }
      })
    }

    // Criar transação
    const transaction = await prisma.transaction.create({
      data: {
        amount: incomeData.amount,
        description: incomeData.description || 'Receita',
        type: 'INCOME',
        method: 'OTHER',
        userId: userId,
        categoryId: category.id,
        date: new Date()
      }
    })

    const successMessage = 
      `✅ *Receita registrada!*\n\n` +
      `💰 Valor: R$ ${incomeData.amount.toFixed(2)}\n` +
      `📝 Descrição: ${incomeData.description || 'Receita'}\n` +
      `🏷️ Categoria: ${incomeData.category}`

    await sendWhatsAppMessage(phoneNumber, successMessage)
  } catch (error: any) {
    console.error('Erro ao registrar receita:', error)
    await sendWhatsAppMessage(phoneNumber, '❌ Erro ao registrar receita. Tente novamente em alguns minutos.')
  }
}

/**
 * Processa registro de despesa
 */
async function handleExpense(userId: string, phoneNumber: string, expenseData: { amount: number; description: string; category: string }) {
  try {
    // Buscar ou criar categoria
    let category = await prisma.category.findFirst({
      where: { name: expenseData.category }
    })

    if (!category) {
      category = await prisma.category.create({
        data: { name: expenseData.category }
      })
    }

    // Criar transação
    const transaction = await prisma.transaction.create({
      data: {
        amount: expenseData.amount,
        description: expenseData.description || 'Gasto',
        type: 'EXPENSE',
        method: 'OTHER',
        userId: userId,
        categoryId: category.id,
        date: new Date()
      }
    })

    const successMessage = 
      `✅ *Gasto registrado!*\n\n` +
      `💰 Valor: R$ ${expenseData.amount.toFixed(2)}\n` +
      `📝 Descrição: ${expenseData.description || 'Gasto'}\n` +
      `🏷️ Categoria: ${expenseData.category}`

    await sendWhatsAppMessage(phoneNumber, successMessage)
  } catch (error: any) {
    console.error('Erro ao registrar gasto:', error)
    await sendWhatsAppMessage(phoneNumber, '❌ Erro ao registrar gasto. Tente novamente em alguns minutos.')
  }
}

/**
 * Consulta de saldo
 */
async function handleBalanceQuery(userId: string, phoneNumber: string) {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId }
    })

    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const balance = totalIncome - totalExpenses

    const message = 
      `💰 *Seu Saldo*\n\n` +
      `💵 Total de Receitas: R$ ${totalIncome.toFixed(2)}\n` +
      `💸 Total de Gastos: R$ ${totalExpenses.toFixed(2)}\n` +
      `\n💳 *Saldo Atual: R$ ${balance.toFixed(2)}*`

    await sendWhatsAppMessage(phoneNumber, message)
  } catch (error: any) {
    console.error('Erro ao consultar saldo:', error)
    await sendWhatsAppMessage(phoneNumber, '❌ Erro ao consultar saldo.')
  }
}

/**
 * Consulta de gastos do mês
 */
async function handleMonthlyExpensesQuery(userId: string, phoneNumber: string) {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: startOfMonth }
      }
    })

    const total = expenses.reduce((sum, t) => sum + t.amount, 0)

    const message = 
      `📊 *Gastos do Mês*\n\n` +
      `💸 Total: R$ ${total.toFixed(2)}\n` +
      `📝 Transações: ${expenses.length}`

    await sendWhatsAppMessage(phoneNumber, message)
  } catch (error: any) {
    console.error('Erro ao consultar gastos:', error)
    await sendWhatsAppMessage(phoneNumber, '❌ Erro ao consultar gastos.')
  }
}

/**
 * Consulta de top gastos
 */
async function handleTopExpensesQuery(userId: string, phoneNumber: string) {
  try {
    const expenses = await prisma.transaction.findMany({
      where: { userId, type: 'EXPENSE' },
      include: { category: true },
      take: 5,
      orderBy: { amount: 'desc' }
    })

    if (expenses.length === 0) {
      await sendWhatsAppMessage(phoneNumber, '📊 Você ainda não tem gastos registrados.')
      return
    }

    let message = `📊 *Top 5 Gastos*\n\n`
    expenses.forEach((expense, index) => {
      message += `${index + 1}. ${expense.description}: R$ ${expense.amount.toFixed(2)}\n`
    })

    await sendWhatsAppMessage(phoneNumber, message)
  } catch (error: any) {
    console.error('Erro ao consultar top gastos:', error)
    await sendWhatsAppMessage(phoneNumber, '❌ Erro ao consultar gastos.')
  }
}

/**
 * Consulta de metas
 */
async function handleGoalsQuery(userId: string, phoneNumber: string) {
  try {
    const goals = await prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' }
    })

    if (goals.length === 0) {
      await sendWhatsAppMessage(phoneNumber, '🎯 Você ainda não tem metas cadastradas.')
      return
    }

    let message = `🎯 *Suas Metas*\n\n`
    goals.forEach(goal => {
      const progress = (goal.currentAmount / goal.targetAmount) * 100
      message += `• ${goal.title}: R$ ${goal.currentAmount.toFixed(2)} / R$ ${goal.targetAmount.toFixed(2)} (${progress.toFixed(0)}%)\n`
    })

    await sendWhatsAppMessage(phoneNumber, message)
  } catch (error: any) {
    console.error('Erro ao consultar metas:', error)
    await sendWhatsAppMessage(phoneNumber, '❌ Erro ao consultar metas.')
  }
}

/**
 * Dica de economia
 */
async function handleTipQuery(userId: string, phoneNumber: string) {
  const tips = [
    '💡 Dica: Revise suas assinaturas mensais e cancele as que não usa.',
    '💡 Dica: Compare preços antes de comprar, especialmente em itens grandes.',
    '💡 Dica: Crie uma meta de economia e separe uma porcentagem do seu salário.',
    '💡 Dica: Evite compras por impulso. Espere 24 horas antes de comprar.',
    '💡 Dica: Use o transporte público ou carona quando possível.'
  ]

  const randomTip = tips[Math.floor(Math.random() * tips.length)]
  await sendWhatsAppMessage(phoneNumber, randomTip)
}

