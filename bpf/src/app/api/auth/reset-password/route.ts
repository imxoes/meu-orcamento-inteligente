import { NextRequest, NextResponse } from 'next/server'
import { resetPassword } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = body

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    const result = await resetPassword(token, newPassword)

    if (!result.success) {
      return NextResponse.json(
        { error: result.errors?.[0] || 'Erro ao redefinir senha' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso!'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}

