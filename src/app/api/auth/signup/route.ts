import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validateEmail, validatePassword, sanitizeName, checkRateLimit, createEmailVerification } from '@/lib/auth-utils'
import { sendVerificationEmail } from '@/lib/email-utils'
import { calculateTrialEndDate } from '@/lib/subscription-utils'

export async function POST(request: NextRequest) {
  try {
    // Get client IP - try multiple headers for better detection
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('remote-addr')
    const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || remoteAddr || 'unknown'

    // Rate limiting - reduced to 3 minutes for better UX
    const rateLimit = checkRateLimit(`signup:${clientIp}`, 5, 3 * 60 * 1000) // 5 attempts per 3 minutes
    if (!rateLimit.allowed) {
      const minutesUntilReset = Math.ceil((rateLimit.resetTime - Date.now()) / (60 * 1000))
      return NextResponse.json(
        {
          success: false,
          error: `Muitas tentativas de cadastro. Tente novamente em ${minutesUntilReset} minuto${minutesUntilReset > 1 ? 's' : ''}.`,
          resetTime: rateLimit.resetTime,
          minutesUntilReset
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, password, name } = body

    // Validate inputs
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.errors[0] },
        { status: 400 }
      )
    }

    const sanitizedName = sanitizeName(name)
    if (sanitizedName.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Nome deve ter pelo menos 2 caracteres' },
        { status: 400 }
      )
    }

    // Check if user already exists (normalize email to lowercase)
    const normalizedEmail = email.toLowerCase().trim()
    
    console.log('🔍 Verificando se email já existe:', normalizedEmail)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (existingUser) {
      console.log('❌ Email já cadastrado:', {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        isActive: existingUser.isActive
      })
      return NextResponse.json(
        { success: false, error: 'Este email já está cadastrado' },
        { status: 409 }
      )
    }
    
    console.log('✅ Email não encontrado, prosseguindo com cadastro')

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Calculate trial end date (7 days from now)
    const trialEndsAt = calculateTrialEndDate()

    // Create user (use normalized email)
    // Note: role, subscriptionStatus, and subscriptionPlan have defaults in schema
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: sanitizedName,
        password: hashedPassword,
        isActive: false, // User starts inactive until email verification
        // Configurar trial de 7 dias
        trialEndsAt: trialEndsAt,
        subscriptionStatus: 'TRIAL',
        subscriptionPlan: 'FREE',
        role: 'USER' // Explicitly set role (has default but being explicit)
      }
    })

    // Create email verification token
    const verificationToken = await createEmailVerification(user.id)

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken, sanitizedName)

    if (!emailResult.success) {
      // If email failed, we should still return success but inform about email issue
      console.error('Failed to send verification email for user:', user.id, emailResult.error)
    }

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso! Verifique seu email para ativar a conta.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })

  } catch (error: any) {
    console.error('❌ Signup error:', error)
    console.error('❌ Error name:', error?.name)
    console.error('❌ Error message:', error?.message)
    console.error('❌ Error code:', error?.code)
    console.error('❌ Error meta:', error?.meta)
    console.error('❌ Error stack:', error?.stack)
    
    // Se for erro do Prisma, retornar mensagem mais específica
    if (error?.code === 'P2002') {
      const field = error?.meta?.target?.[0] || 'campo'
      return NextResponse.json(
        { 
          success: false, 
          error: `Este ${field} já está em uso. Tente outro.`
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        debug: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}