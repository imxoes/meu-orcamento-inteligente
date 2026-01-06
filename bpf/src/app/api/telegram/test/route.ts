import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

// Função para enviar mensagem
async function sendMessage(chatId: number, text: string) {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      })
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Error sending message:', error)
    return { ok: false, error: error }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { chatId, message } = await request.json()

    if (!chatId || !message) {
      return NextResponse.json({ error: 'chatId and message required' }, { status: 400 })
    }

    // Processar mensagem como o webhook faria
    let response = ''

    // Verificar se é um gasto (padrão: "valor descrição")
    const expensePattern = /^(\d+(?:[.,]\d{2})?)\s+(.+)$/
    const expenseMatch = message.match(expensePattern)

    if (expenseMatch) {
      const amount = parseFloat(expenseMatch[1].replace(',', '.'))
      const description = expenseMatch[2].trim()

      // Categorização simples
      const getCategory = (desc: string) => {
        const lowerDesc = desc.toLowerCase()
        if (['uber', 'taxi', '99', 'gasolina'].some(k => lowerDesc.includes(k))) return 'Transporte'
        if (['mercado', 'supermercado', 'ifood', 'restaurante'].some(k => lowerDesc.includes(k))) return 'Alimentação'
        if (['netflix', 'spotify', 'cinema'].some(k => lowerDesc.includes(k))) return 'Entretenimento'
        return 'Outros'
      }

      const category = getCategory(description)

      response = `✅ *Gasto Registrado!*\n\n` +
                `💰 Valor: R$ ${amount.toFixed(2)}\n` +
                `📝 Descrição: ${description}\n` +
                `🏷️ Categoria: ${category}\n\n` +
                `📊 Seus gastos hoje: R$ ${(amount + 145.30).toFixed(2)}\n` +
                `📈 Total do mês: R$ ${(3247.68 + amount).toFixed(2)}`

    } else if (message.toLowerCase().includes('saldo')) {
      response = `💰 *Seu Saldo Atual*\n\n` +
                `Saldo: R$ 12.847,32\n` +
                `Gastos este mês: R$ 3.247,68\n` +
                `Receitas este mês: R$ 8.500,00\n\n` +
                `📊 Você está economizando bem este mês!`

    } else if (message.toLowerCase().includes('gastos') && message.toLowerCase().includes('mês')) {
      response = `📊 *Gastos do Mês*\n\n` +
                `Total: R$ 3.247,68\n\n` +
                `🏆 Maiores categorias:\n` +
                `• Alimentação: R$ 1.250,00 (38%)\n` +
                `• Transporte: R$ 850,00 (26%)\n` +
                `• Moradia: R$ 1.200,00 (37%)\n\n` +
                `📈 Variação: -8% vs mês anterior`

    } else if (message.toLowerCase().includes('meta')) {
      response = `🎯 *Suas Metas*\n\n` +
                `✈️ Viagem Europa: 43.8%\n` +
                `▓▓▓▓▓░░░░░ R$ 3.500/8.000\n\n` +
                `🏠 Reserva Emergência: 80%\n` +
                `▓▓▓▓▓▓▓▓░░ R$ 12.000/15.000\n\n` +
                `💻 Notebook: 62%\n` +
                `▓▓▓▓▓▓░░░░ R$ 2.800/4.500\n\n` +
                `🚀 Continue assim! Você está no caminho certo.`

    } else if (message.toLowerCase().includes('dica')) {
      response = `💡 *Dica Inteligente*\n\n` +
                `📱 *Cancele assinaturas não utilizadas*\n\n` +
                `Detectei que você tem 5 assinaturas ativas mas usa apenas 2.\n\n` +
                `💰 Economia potencial: R$ 108/mês\n\n` +
                `Sugestões:\n` +
                `• Netflix Premium → Básico (-R$ 25)\n` +
                `• Spotify duplicado (-R$ 17)\n` +
                `• Amazon Prime pouco usado (-R$ 66)`

    } else {
      response = `🤖 *Como posso ajudar?*\n\n` +
                `📝 *Para registrar gastos:*\n` +
                `• "50 uber"\n` +
                `• "25.90 supermercado"\n` +
                `• "100 gasolina"\n\n` +
                `📊 *Para consultas:*\n` +
                `• "qual meu saldo?"\n` +
                `• "gastos do mês"\n` +
                `• "minhas metas"\n` +
                `• "me dê uma dica"`
    }

    // Enviar resposta
    const result = await sendMessage(chatId, response)

    return NextResponse.json({
      success: true,
      message: 'Message processed and sent',
      telegram_response: result,
      bot_response: response
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Verificar se o bot está funcionando
    const botInfoResponse = await fetch(`${TELEGRAM_API_URL}/getMe`)
    const botInfo = await botInfoResponse.json()

    return NextResponse.json({
      status: 'Telegram Bot Test API is running',
      bot_active: botInfo.ok,
      bot_info: botInfo.result,
      instructions: {
        method: 'POST',
        body: {
          chatId: 'SEU_CHAT_ID_DO_TELEGRAM',
          message: 'Sua mensagem aqui'
        },
        examples: [
          { chatId: '123456789', message: '50 uber' },
          { chatId: '123456789', message: 'qual meu saldo?' },
          { chatId: '123456789', message: 'gastos do mês' }
        ]
      }
    })

  } catch (error) {
    console.error('Test API GET error:', error)
    return NextResponse.json({ error: 'Error checking bot status' }, { status: 500 })
  }
}