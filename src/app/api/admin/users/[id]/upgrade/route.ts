import { NextResponse } from 'next/server'
import { requireAdminAuth, logAdminAction } from '@/middleware/admin'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminAuth(request)
    const { plan, duration } = await request.json()

    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    if (!['BASIC', 'PREMIUM'].includes(plan)) {
      return NextResponse.json(
        { error: 'Plano deve ser BASIC ou PREMIUM' },
        { status: 400 }
      )
    }

    if (!duration || duration < 1) {
      return NextResponse.json(
        { error: 'Duração deve ser pelo menos 1 mês' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId, role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Calcular data de expiração
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + duration)

    // Atualizar usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: 'ACTIVE'
      }
    })

    // Criar ou atualizar subscription
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        status: 'ACTIVE',
        plan,
        currentPeriodStart: new Date(),
        currentPeriodEnd,
        gateway: 'ADMIN_UPGRADE'
      },
      update: {
        status: 'ACTIVE',
        plan,
        currentPeriodStart: new Date(),
        currentPeriodEnd,
        gateway: 'ADMIN_UPGRADE'
      }
    })

    // Log da ação
    await logAdminAction(
      admin.id,
      'UPGRADE_USER',
      `Usuário ${user.name} (${user.email}) foi atualizado para ${plan} por ${duration} meses`,
      userId,
      {
        previousPlan: user.subscriptionPlan,
        newPlan: plan,
        duration,
        expiresAt: currentPeriodEnd
      },
      request
    )

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado para VIP com sucesso',
      data: {
        plan,
        expiresAt: currentPeriodEnd
      }
    })

  } catch (error: any) {
    console.error('Erro ao atualizar usuário para VIP:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Acesso negado: autenticação de admin requerida' ? 401 : 500 }
    )
  }
}

// Downgrade de usuário
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdminAuth(request)
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId, role: 'USER' },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    if (user.subscriptionPlan === 'FREE') {
      return NextResponse.json(
        { error: 'Usuário já está no plano FREE' },
        { status: 400 }
      )
    }

    // Fazer downgrade para FREE
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: 'FREE',
        subscriptionStatus: 'EXPIRED'
      }
    })

    // Atualizar subscription
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        status: 'EXPIRED',
        plan: 'FREE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(),
        gateway: 'ADMIN_DOWNGRADE'
      },
      update: {
        status: 'EXPIRED',
        plan: 'FREE',
        currentPeriodEnd: new Date(),
        cancelAtPeriodEnd: true
      }
    })

    // Log da ação
    await logAdminAction(
      admin.id,
      'DOWNGRADE_USER',
      `Usuário ${user.name} (${user.email}) foi rebaixado para FREE`,
      userId,
      {
        previousPlan: user.subscriptionPlan,
        newPlan: 'FREE'
      },
      request
    )

    return NextResponse.json({
      success: true,
      message: 'Usuário rebaixado para FREE com sucesso'
    })

  } catch (error: any) {
    console.error('Erro ao rebaixar usuário:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Acesso negado: autenticação de admin requerida' ? 401 : 500 }
    )
  }
}