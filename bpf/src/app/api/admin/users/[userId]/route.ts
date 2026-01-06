/**
 * API para gerenciar um usuário específico (apenas admin)
 * - Alterar plano de assinatura
 * - Suspender/ativar conta
 * - Tornar admin
 * - Alterar status de assinatura
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken } from '@/lib/auth-utils'
import { requireAdmin } from '@/lib/admin-utils'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const adminId = await getUserIdFromToken(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await requireAdmin(adminId)

    const params = await context.params
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      include: {
        subscription: true,
        _count: {
          select: {
            transactions: true,
            goals: true,
            investments: true,
            sessions: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    console.error('❌ Erro ao buscar usuário:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar usuário' },
      { status: error.message?.includes('Acesso negado') ? 403 : 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const adminId = await getUserIdFromToken(request)
    if (!adminId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await requireAdmin(adminId)

    const params = await context.params
    const body = await request.json()
    const {
      subscriptionPlan,
      subscriptionStatus,
      isActive,
      role,
      trialEndsAt
    } = body

    // Validar planos
    if (subscriptionPlan && !['FREE', 'BASIC', 'PREMIUM'].includes(subscriptionPlan)) {
      return NextResponse.json(
        { error: 'Plano inválido. Use: FREE, BASIC ou PREMIUM' },
        { status: 400 }
      )
    }

    // Validar status
    if (subscriptionStatus && !['TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED'].includes(subscriptionStatus)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: TRIAL, ACTIVE, EXPIRED ou CANCELLED' },
        { status: 400 }
      )
    }

    // Validar role
    if (role && !['USER', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Role inválido. Use: USER ou ADMIN' },
        { status: 400 }
      )
    }

    // Preparar dados para atualização
    const updateData: any = {}
    if (subscriptionPlan !== undefined) updateData.subscriptionPlan = subscriptionPlan
    if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus
    if (isActive !== undefined) updateData.isActive = isActive
    if (role !== undefined) updateData.role = role
    if (trialEndsAt !== undefined) {
      updateData.trialEndsAt = trialEndsAt ? new Date(trialEndsAt) : null
    }

    // Atualizar usuário
    const user = await prisma.user.update({
      where: { id: params.userId },
      data: updateData,
      include: {
        subscription: true
      }
    })

    // Se mudou o plano, atualizar também a subscription
    if (subscriptionPlan && user.subscription) {
      await prisma.subscription.update({
        where: { userId: params.userId },
        data: {
          plan: subscriptionPlan,
          status: subscriptionStatus || user.subscriptionStatus === 'ACTIVE' ? 'ACTIVE' : 'TRIAL'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      user
    })
  } catch (error: any) {
    console.error('❌ Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao atualizar usuário' },
      { status: error.message?.includes('Acesso negado') ? 403 : 500 }
    )
  }
}

