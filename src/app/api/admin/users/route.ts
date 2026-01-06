/**
 * API para listar todos os usuários (apenas admin)
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        trialEndsAt: true,
        createdAt: true,
        lastLoginAt: true,
        emailVerified: true,
        _count: {
          select: {
            transactions: true,
            goals: true,
            investments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Add role field if it exists, otherwise default to 'USER'
    const usersWithRole = users.map(user => ({
      ...user,
      role: (user as any).role || 'USER'
    }))

    return NextResponse.json({ success: true, users: usersWithRole })
  } catch (error: any) {
    console.error('❌ Erro ao listar usuários:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao listar usuários' },
      { status: error.message?.includes('Acesso negado') ? 403 : 500 }
    )
  }
}

