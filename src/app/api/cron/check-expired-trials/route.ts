import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando trials expirados...')

    const now = new Date()

    // Buscar usuários cujo trial expirou
    const expiredTrialUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'TRIAL',
        trialEndsAt: {
          lte: now // Data de fim do trial é menor ou igual a agora
        },
        isBlocked: false // Ainda não foram bloqueados
      },
      select: {
        id: true,
        name: true,
        email: true,
        trialEndsAt: true,
        subscriptionPlan: true
      }
    })

    console.log(`📊 Encontrados ${expiredTrialUsers.length} usuários com trial expirado`)

    if (expiredTrialUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum trial expirado encontrado',
        processed: 0
      })
    }

    const userIds = expiredTrialUsers.map(user => user.id)

    // Bloquear usuários cujo trial expirou
    const updateResult = await prisma.user.updateMany({
      where: {
        id: {
          in: userIds
        }
      },
      data: {
        isBlocked: true,
        blockedAt: now,
        blockedReason: 'Trial de 7 dias expirado. Faça upgrade para um plano pago para continuar usando.',
        subscriptionStatus: 'EXPIRED'
      }
    })

    console.log(`✅ ${updateResult.count} usuários bloqueados por trial expirado`)

    // Log das ações para cada usuário
    for (const user of expiredTrialUsers) {
      console.log(`🚫 Usuário bloqueado: ${user.name} (${user.email}) - Trial expirou em ${user.trialEndsAt}`)
    }

    return NextResponse.json({
      success: true,
      message: `${updateResult.count} usuários bloqueados por trial expirado`,
      processed: updateResult.count,
      users: expiredTrialUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        trialEndsAt: user.trialEndsAt
      }))
    })

  } catch (error: any) {
    console.error('❌ Erro ao verificar trials expirados:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error?.message
      },
      { status: 500 }
    )
  }
}

// Permitir POST também para compatibilidade com cron services
export async function POST(request: NextRequest) {
  return GET(request)
}