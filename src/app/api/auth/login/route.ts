import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { createToken, rateLimiter } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  console.log('🔐 Login attempt started')
  
  try {
    // Rate limiting
    console.log('📊 Checking rate limit...')
    const rateLimitResult = await rateLimiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Muitas tentativas. Tente novamente em 1 minuto.' },
        { status: 429 }
      )
    }

    console.log('📨 Parsing request body...')
    const { email, password } = await request.json()
    console.log('📧 Email received:', email)

    // Validation
    if (!email || !password) {
      return NextResponse.json({ message: 'Email e senha são obrigatórios' }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json({ message: 'Email ou senha incorretos' }, { status: 401 })
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json({
        message: 'Email não verificado. Verifique sua caixa de entrada.'
      }, { status: 401 })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return NextResponse.json({ message: 'Email ou senha incorretos' }, { status: 401 })
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Create token
    const token = await createToken({ userId: user.id })

    // Create response with redirect
    const response = NextResponse.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      redirect: '/dashboard'
    })

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (error: any) {
    console.error('❌ Login error:', error)
    console.error('❌ Error name:', error?.name)
    console.error('❌ Error message:', error?.message)
    console.error('❌ Error stack:', error?.stack)
    return NextResponse.json({ 
      message: 'Erro interno do servidor',
      debug: process.env.NODE_ENV === 'development' ? error?.message : undefined
    }, { status: 500 })
  }
}