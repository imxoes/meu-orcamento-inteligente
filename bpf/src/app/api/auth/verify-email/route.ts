import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyEmailToken, checkRateLimit } from '@/lib/auth-utils'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Rate limiting
    const rateLimit = checkRateLimit(`verify-email:${clientIp}`, 10, 15 * 60 * 1000) // 10 attempts per 15 minutes
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Muitas tentativas de verificação. Tente novamente em alguns minutos.',
          resetTime: rateLimit.resetTime
        },
        { status: 429 }
      )
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de verificação não fornecido' },
        { status: 400 }
      )
    }

    // Verify email token
    const result = await verifyEmailToken(token)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    // Get user to send welcome email
    const user = await prisma.user.findUnique({
      where: { id: result.userId! }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Activate user account
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true }
    })

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name)

    return NextResponse.json({
      success: true,
      message: 'Email verificado com sucesso! Sua conta foi ativada.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'

    // Rate limiting
    const rateLimit = checkRateLimit(`verify-email:${clientIp}`, 10, 15 * 60 * 1000) // 10 attempts per 15 minutes
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Muitas tentativas de verificação. Tente novamente em alguns minutos.',
          resetTime: rateLimit.resetTime
        },
        { status: 429 }
      )
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token de verificação não fornecido' },
        { status: 400 }
      )
    }

    // Verify email token
    const result = await verifyEmailToken(token)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 400 }
      )
    }

    // Get user to send welcome email
    const user = await prisma.user.findUnique({
      where: { id: result.userId! }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Activate user account
    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: true }
    })

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name)

    return NextResponse.json({
      success: true,
      message: 'Email verificado com sucesso! Sua conta foi ativada.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}