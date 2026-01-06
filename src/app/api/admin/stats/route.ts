/**
 * API para estatísticas gerais do sistema (apenas admin)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken } from '@/lib/auth-utils'
import { requireAdmin } from '@/lib/admin-utils'

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await requireAdmin(userId)

    const [
      totalUsers,
      activeUsers,
      trialUsers,
      basicUsers,
      premiumUsers,
      totalTransactions,
      totalGoals,
      totalInvestments,
      recentUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { subscriptionStatus: 'TRIAL' } }),
      prisma.user.count({ where: { subscriptionPlan: 'BASIC' } }),
      prisma.user.count({ where: { subscriptionPlan: 'PREMIUM' } }),
      prisma.transaction.count(),
      prisma.goal.count(),
      prisma.investment.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          subscriptionPlan: true
        }
      })
    ])

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          trial: trialUsers,
          basic: basicUsers,
          premium: premiumUsers
        },
        content: {
          transactions: totalTransactions,
          goals: totalGoals,
          investments: totalInvestments
        },
        recentUsers
      }
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar estatísticas' },
      { status: error.message?.includes('Acesso negado') ? 403 : 500 }
    )
  }
}



