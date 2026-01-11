import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-utils'
import { getWhatsAppInstance } from '@/lib/whatsapp-editacodigo'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const whatsapp = getWhatsAppInstance()
    const userId = user.id

    // Abrir instância do WhatsApp (modo terminal/headless)
    const result = await whatsapp.abrirInstanciaTerminal(userId)

    if (result.status === 'error') {
      return NextResponse.json({
        message: 'Erro ao abrir instância do WhatsApp',
        error: result.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Instância do WhatsApp iniciada com sucesso',
      data: result.data
    })
  } catch (error) {
    console.error('WhatsApp setup error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const whatsapp = getWhatsAppInstance()
    const userId = user.id

    // Fechar instância do WhatsApp
    const result = await whatsapp.fecharInstancia(userId)

    if (result.status === 'error') {
      return NextResponse.json({
        message: 'Erro ao fechar instância do WhatsApp',
        error: result.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Instância do WhatsApp fechada com sucesso',
      data: result.data
    })
  } catch (error) {
    console.error('WhatsApp close error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const whatsapp = getWhatsAppInstance()
    const userId = user.id

    // Gerar QR Code para conectar
    const result = await whatsapp.gerarQrCode(userId)

    if (result.status === 'error') {
      return NextResponse.json({
        message: 'Erro ao gerar QR Code',
        error: result.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'QR Code gerado com sucesso',
      qrCode: result.data
    })
  } catch (error) {
    console.error('WhatsApp QR Code error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}