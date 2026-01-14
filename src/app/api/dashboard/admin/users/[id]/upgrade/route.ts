import { NextResponse } from 'next/server'
import { requireDashboardAdminAuth, logAdminAction } from '@/middleware/dashboard-admin'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireDashboardAdminAuth(request)
    const { plan, duration, durationType, customEndDate } = await request.json()

    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      )
    }

    if (!['FREE', 'BASIC', 'PREMIUM', 'TRIAL'].includes(plan)) {
      return NextResponse.json(
        { error: 'Plano deve ser FREE, TRIAL, BASIC ou PREMIUM' },
        { status: 400 }
      )
    }

    // Para planos FREE não precisamos de duração
    if (plan !== 'FREE') {
      if (customEndDate) {
        // Se tem data customizada, validar se é futura
        const endDate = new Date(customEndDate)
        if (endDate <= new Date()) {
          return NextResponse.json(
            { error: 'Data de expiração deve ser futura' },
            { status: 400 }
          )
        }
      } else if (!duration || duration < 1) {
        return NextResponse.json(
          { error: 'Duração deve ser pelo menos 1 dia' },
          { status: 400 }
        )
      }
    }

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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
    let currentPeriodEnd = new Date()

    if (plan === 'FREE') {
      // Para FREE, expirar imediatamente
      currentPeriodEnd = new Date()
    } else if (customEndDate) {
      // Usar data customizada
      currentPeriodEnd = new Date(customEndDate)
    } else {
      // Calcular baseado na duração e tipo
      const durationTypeMap = {
        'days': (d: number) => { currentPeriodEnd.setDate(currentPeriodEnd.getDate() + d) },
        'weeks': (d: number) => { currentPeriodEnd.setDate(currentPeriodEnd.getDate() + (d * 7)) },
        'months': (d: number) => { currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + d) },
        'years': (d: number) => { currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + d) }
      }

      const selectedDurationType = durationType || 'months'
      if (durationTypeMap[selectedDurationType as keyof typeof durationTypeMap]) {
        durationTypeMap[selectedDurationType as keyof typeof durationTypeMap](duration)
      } else {
        // Default: months
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + duration)
      }
    }

    // Determinar status baseado no plano
    const status = plan === 'FREE' ? 'EXPIRED' : 'ACTIVE'

    // Atualizar usuário
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: status
      }
    })

    // Criar ou atualizar subscription
    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        status,
        plan,
        currentPeriodStart: new Date(),
        currentPeriodEnd,
        gateway: 'ADMIN_UPGRADE'
      },
      update: {
        status,
        plan,
        currentPeriodStart: new Date(),
        currentPeriodEnd,
        gateway: 'ADMIN_UPGRADE'
      }
    })

    // Log da ação
    const durationText = customEndDate
      ? `até ${currentPeriodEnd.toLocaleDateString('pt-BR')}`
      : `por ${duration} ${durationType || 'meses'}`

    await logAdminAction(
      admin.id,
      plan === 'FREE' ? 'DOWNGRADE_USER' : 'UPGRADE_USER',
      `Usuário ${user.name} (${user.email}) foi atualizado para ${plan} ${plan !== 'FREE' ? durationText : ''}`,
      userId,
      {
        previousPlan: user.subscriptionPlan,
        newPlan: plan,
        duration,
        durationType,
        customEndDate,
        expiresAt: currentPeriodEnd
      },
      request
    )

    return NextResponse.json({
      success: true,
      message: `Usuário atualizado para ${plan} com sucesso`,
      data: {
        plan,
        status,
        expiresAt: currentPeriodEnd
      }
    })

  } catch (error: any) {
    console.error('Erro ao atualizar usuário para VIP:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Acesso negado: permissões de admin requeridas' ? 403 : 500 }
    )
  }
}

// Downgrade de usuário
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireDashboardAdminAuth(request)
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
      { status: error.message === 'Acesso negado: permissões de admin requeridas' ? 403 : 500 }
    )
  }
}