import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'
import { generateSmartTips, isOpenAIConfigured } from '@/lib/openai-utils'
import { requirePremiumAccess } from '@/lib/subscription-middleware'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Token not found' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token', message: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    // Verificar acesso premium
    try {
      await requirePremiumAccess(decoded.userId)
    } catch (error: any) {
      return NextResponse.json(
        { 
          error: 'Premium required', 
          message: error.message || 'Esta funcionalidade requer assinatura Premium. Faça upgrade para R$ 8,99/mês.',
          requiresUpgrade: true
        },
        { status: 403 }
      )
    }

    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'OpenAI not configured', message: 'OpenAI API não está configurada. Configure OPENAI_API_KEY no Vercel.' },
        { status: 503 }
      )
    }

    const userId = decoded.userId

    // Buscar transações do usuário
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      include: {
        category: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 500
    })

    // Buscar metas do usuário
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    // Buscar investimentos do usuário
    const investments = await prisma.investment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    }).catch(() => [])

    // Gerar dicas usando OpenAI
    const tips = await generateSmartTips(transactions, goals, investments)

    if (!tips) {
      return NextResponse.json(
        { error: 'Failed to generate tips', message: 'Erro ao gerar dicas. Tente novamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tips,
      generatedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('AI Tips error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

