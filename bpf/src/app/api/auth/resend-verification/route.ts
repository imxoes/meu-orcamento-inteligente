import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createEmailVerification, validateEmail, rateLimiter } from '@/lib/auth-utils'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Muitas tentativas. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }

    const { email } = await request.json()

    // Validate email
    if (!email || !validateEmail(email)) {
      return NextResponse.json(
        { message: 'Email válido é obrigatório' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Email não encontrado' },
        { status: 404 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Email já está verificado' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const token = await createEmailVerification(user.id)

    // Send verification email
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://useorbi.app'
      : `http://localhost:${process.env.PORT || 3003}`

    try {
      await sendVerificationEmail(user.email, token)

      return NextResponse.json({
        message: 'Novo código de verificação enviado! Verifique sua caixa de entrada.'
      })
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      return NextResponse.json(
        { message: 'Erro ao enviar email. Tente novamente mais tarde.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}