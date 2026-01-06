import { NextRequest, NextResponse } from 'next/server'
import { createPasswordReset } from '@/lib/auth-utils'
import { sendPasswordResetEmail } from '@/lib/email-utils'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      )
    }

    // Normalizar email
    const normalizedEmail = email.toLowerCase().trim()

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    // Sempre retornar sucesso (por segurança, não revelar se o email existe)
    if (!user || !user.isActive) {
      return NextResponse.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.'
      })
    }

    // Criar token de reset
    const result = await createPasswordReset(normalizedEmail)

    if (!result.success || !result.token) {
      return NextResponse.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.'
      })
    }

    // Enviar email
    await sendPasswordResetEmail(normalizedEmail, result.token, user.name)

    return NextResponse.json({
      success: true,
      message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    )
  }
}

