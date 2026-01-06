import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'
import { sendWhatsAppMessage } from '@/lib/whatsapp-utils'

/**
 * POST - Vincular número WhatsApp à conta do usuário
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 })
    }

    const body = await request.json()
    // Aceitar tanto phoneNumber quanto whatsappId (compatibilidade)
    const phoneNumber = body.phoneNumber || body.whatsappId

    if (!phoneNumber) {
      return NextResponse.json({ message: 'Número de telefone é obrigatório' }, { status: 400 })
    }

    // Limpar número (remover caracteres não numéricos, incluindo +)
    let cleanedNumber = phoneNumber.replace(/\D/g, '')

    // Validar formato internacional (E.164: 7-15 dígitos com código do país)
    // Números devem ter código do país incluído
    if (cleanedNumber.length < 7 || cleanedNumber.length > 15) {
      return NextResponse.json({ 
        message: 'Número de telefone inválido. Use o formato internacional com código do país (ex: +16505044380 ou 16505044380)' 
      }, { status: 400 })
    }

    // Verificar se o número já está vinculado a outra conta
    const existingUser = await prisma.user.findUnique({
      where: { whatsappId: cleanedNumber }
    })

    if (existingUser && existingUser.id !== decoded.userId) {
      return NextResponse.json({ 
        message: 'Este número já está vinculado a outra conta' 
      }, { status: 400 })
    }

    // Atualizar usuário com WhatsApp ID
    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: { whatsappId: cleanedNumber }
    })

    // Enviar mensagem de boas-vindas via WhatsApp
    const welcomeMessage = 
      `🎉 *Conta vinculada com sucesso!*\n\n` +
      `Olá ${user.name}! Seu WhatsApp foi vinculado ao Orbi.\n\n` +
      `Agora você pode:\n` +
      `• Registrar receitas: "recebi 1200 de salário"\n` +
      `• Registrar gastos: "gastei 50 em uber"\n` +
      `• Consultar saldo: "qual meu saldo?"\n` +
      `• E muito mais!\n\n` +
      `Digite "ajuda" para ver todos os comandos.`

    let messageStatus = { sent: false, error: null as string | null }
    try {
      console.log(`📤 Tentando enviar mensagem de boas-vindas para ${cleanedNumber}`)
      const result = await sendWhatsAppMessage(cleanedNumber, welcomeMessage)
      
      if (result.success) {
        messageStatus.sent = true
        console.log(`✅ Mensagem de boas-vindas enviada com sucesso para ${cleanedNumber}`)
      } else {
        messageStatus.error = result.error || 'Erro desconhecido ao enviar mensagem'
        console.error(`❌ Erro ao enviar mensagem de boas-vindas:`, messageStatus.error)
      }
    } catch (error: any) {
      messageStatus.error = error.message || 'Erro ao enviar mensagem'
      console.error('❌ Exceção ao enviar mensagem de boas-vindas:', error)
    }

    return NextResponse.json({ 
      message: 'WhatsApp vinculado com sucesso!',
      whatsappId: cleanedNumber,
      messageSent: messageStatus.sent,
      messageError: messageStatus.error
    })
  } catch (error: any) {
    console.error('Erro ao vincular WhatsApp:', error)
    return NextResponse.json({ 
      message: 'Erro ao vincular WhatsApp',
      error: error.message 
    }, { status: 500 })
  }
}

/**
 * DELETE - Desvincular WhatsApp da conta
 */
export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { whatsappId: null }
    })

    return NextResponse.json({ message: 'WhatsApp desvinculado com sucesso' })
  } catch (error: any) {
    console.error('Erro ao desvincular WhatsApp:', error)
    return NextResponse.json({ 
      message: 'Erro ao desvincular WhatsApp',
      error: error.message 
    }, { status: 500 })
  }
}



