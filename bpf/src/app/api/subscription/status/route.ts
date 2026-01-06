/**
 * API para verificar status da assinatura do usuário
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken } from '@/lib/auth-utils'
import { getSubscriptionStatus, getCurrentPlan, getTrialDaysRemaining, getSubscriptionMessage } from '@/lib/subscription-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          include: {
            payments: {
              orderBy: { createdAt: 'desc' },
              take: 5, // Últimos 5 pagamentos
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const status = getSubscriptionStatus(user)
    const plan = getCurrentPlan(user)
    const daysRemaining = getTrialDaysRemaining(user)
    const message = getSubscriptionMessage(user)

    return NextResponse.json({
      success: true,
      subscription: {
        status,
        plan,
        daysRemaining,
        message,
        trialEndsAt: user.trialEndsAt,
        currentPeriodEnd: user.subscription?.currentPeriodEnd,
        cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
        recentPayments: user.subscription?.payments || [],
      },
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar status da assinatura',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

