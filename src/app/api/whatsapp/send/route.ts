import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-utils'
import { getWhatsAppInstance } from '@/lib/whatsapp-editacodigo'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { telefone, mensagem, tipo, url, enquete } = await request.json()

    if (!telefone || !mensagem) {
      return NextResponse.json({
        message: 'Telefone e mensagem são obrigatórios'
      }, { status: 400 })
    }

    const whatsapp = getWhatsAppInstance()
    const userId = user.id
    const idMsg = `msg_${Date.now()}`

    let result

    if (tipo === 'enquete' && enquete) {
      // Enviar enquete
      result = await whatsapp.criarEnquete(userId, {
        telefone,
        enquete: {
          pergunta: mensagem,
          opcoes: enquete.opcoes || []
        },
        id_msg: idMsg
      })
    } else if (url && tipo) {
      // Enviar mídia
      result = await whatsapp.enviarMensagemMidia(userId, {
        telefone,
        msg: mensagem,
        url,
        tipo: tipo as 'image' | 'video' | 'document' | 'audio',
        id_msg: idMsg
      })
    } else {
      // Enviar mensagem simples
      result = await whatsapp.enviarMensagem(userId, {
        telefone,
        msg: mensagem,
        id_msg: idMsg
      })
    }

    if (result.status === 'error') {
      return NextResponse.json({
        message: 'Erro ao enviar mensagem',
        error: result.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Mensagem enviada com sucesso',
      data: result.data,
      messageId: idMsg
    })
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}