import { NextRequest, NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const WEBHOOK_URL = process.env.TELEGRAM_WEBHOOK_URL || 'https://your-domain.com/api/telegram/webhook'
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

export async function POST(request: NextRequest) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not configured' }, { status: 400 })
    }

    const body = await request.json()
    const action = body.action

    switch (action) {
      case 'setWebhook':
        const webhookResponse = await fetch(`${TELEGRAM_API_URL}/setWebhook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: WEBHOOK_URL,
            allowed_updates: ['message']
          })
        })

        const webhookResult = await webhookResponse.json()

        if (webhookResult.ok) {
          return NextResponse.json({
            success: true,
            message: 'Webhook configurado com sucesso',
            webhook_url: WEBHOOK_URL,
            result: webhookResult
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Falha ao configurar webhook',
            result: webhookResult
          }, { status: 400 })
        }

      case 'getWebhookInfo':
        const infoResponse = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`)
        const infoResult = await infoResponse.json()

        return NextResponse.json({
          success: true,
          webhook_info: infoResult.result
        })

      case 'deleteWebhook':
        const deleteResponse = await fetch(`${TELEGRAM_API_URL}/deleteWebhook`, {
          method: 'POST'
        })
        const deleteResult = await deleteResponse.json()

        return NextResponse.json({
          success: deleteResult.ok,
          message: deleteResult.ok ? 'Webhook removido' : 'Erro ao remover webhook',
          result: deleteResult
        })

      case 'getBotInfo':
        const botResponse = await fetch(`${TELEGRAM_API_URL}/getMe`)
        const botResult = await botResponse.json()

        return NextResponse.json({
          success: botResult.ok,
          bot_info: botResult.result
        })

      case 'setCommands':
        const commands = [
          {
            command: 'start',
            description: 'Iniciar conversa com o bot'
          },
          {
            command: 'saldo',
            description: 'Ver saldo atual'
          },
          {
            command: 'gastos',
            description: 'Ver gastos do mês'
          },
          {
            command: 'metas',
            description: 'Verificar progresso das metas'
          },
          {
            command: 'relatorio',
            description: 'Gerar relatório mensal'
          },
          {
            command: 'dicas',
            description: 'Receber dicas de economia'
          },
          {
            command: 'ajuda',
            description: 'Ver todos os comandos disponíveis'
          }
        ]

        const commandsResponse = await fetch(`${TELEGRAM_API_URL}/setMyCommands`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ commands })
        })

        const commandsResult = await commandsResponse.json()

        return NextResponse.json({
          success: commandsResult.ok,
          message: commandsResult.ok ? 'Comandos configurados' : 'Erro ao configurar comandos',
          commands: commands,
          result: commandsResult
        })

      default:
        return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
    }

  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET() {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({
        error: 'TELEGRAM_BOT_TOKEN não configurado',
        instructions: 'Configure TELEGRAM_BOT_TOKEN no arquivo .env'
      }, { status: 400 })
    }

    // Verificar status do bot
    const botResponse = await fetch(`${TELEGRAM_API_URL}/getMe`)
    const botResult = await botResponse.json()

    // Verificar webhook
    const webhookResponse = await fetch(`${TELEGRAM_API_URL}/getWebhookInfo`)
    const webhookResult = await webhookResponse.json()

    return NextResponse.json({
      success: true,
      bot_status: botResult.ok ? 'ativo' : 'erro',
      bot_info: botResult.result,
      webhook_info: webhookResult.result,
      configured_webhook_url: WEBHOOK_URL,
      available_actions: [
        'POST /api/telegram/setup com { "action": "setWebhook" }',
        'POST /api/telegram/setup com { "action": "getWebhookInfo" }',
        'POST /api/telegram/setup com { "action": "deleteWebhook" }',
        'POST /api/telegram/setup com { "action": "getBotInfo" }',
        'POST /api/telegram/setup com { "action": "setCommands" }'
      ]
    })

  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({ error: 'Erro ao verificar status' }, { status: 500 })
  }
}