import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-utils'
import { getWhatsAppInstance } from '@/lib/whatsapp-editacodigo'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const whatsapp = getWhatsAppInstance()
    const userId = user.id

    // Obter status da instância
    const result = await whatsapp.obterStatus(userId)

    if (result.status === 'error') {
      return NextResponse.json({
        message: 'Erro ao obter status da instância',
        error: result.message,
        connected: false
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Status obtido com sucesso',
      connected: result.data?.connected || false,
      status: result.data?.status || 'disconnected',
      data: result.data
    })
  } catch (error) {
    console.error('WhatsApp status error:', error)
    return NextResponse.json({
      message: 'Internal server error',
      connected: false
    }, { status: 500 })
  }
}