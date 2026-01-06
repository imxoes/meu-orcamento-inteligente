import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserFromRequest } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    let settings = await prisma.telegramAlertSettings.findUnique({
      where: { userId: user.id }
    })

    // Se não existe, criar com valores padrão
    if (!settings) {
      settings = await prisma.telegramAlertSettings.create({
        data: {
          userId: user.id,
          highSpendingEnabled: true,
          highSpendingThreshold: 100.0,
          highSpendingPeriod: 'DAILY',
          goalProgressEnabled: true,
          goalProgressThreshold: 50.0,
          dailySummaryEnabled: false,
          dailySummaryTime: '20:00'
        }
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching alert settings:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      highSpendingEnabled,
      highSpendingThreshold,
      highSpendingPeriod,
      goalProgressEnabled,
      goalProgressThreshold,
      dailySummaryEnabled,
      dailySummaryTime
    } = body

    // Verificar se já existe
    let settings = await prisma.telegramAlertSettings.findUnique({
      where: { userId: user.id }
    })

    if (settings) {
      // Atualizar
      settings = await prisma.telegramAlertSettings.update({
        where: { userId: user.id },
        data: {
          highSpendingEnabled: highSpendingEnabled ?? settings.highSpendingEnabled,
          highSpendingThreshold: highSpendingThreshold ?? settings.highSpendingThreshold,
          highSpendingPeriod: highSpendingPeriod ?? settings.highSpendingPeriod,
          goalProgressEnabled: goalProgressEnabled ?? settings.goalProgressEnabled,
          goalProgressThreshold: goalProgressThreshold ?? settings.goalProgressThreshold,
          dailySummaryEnabled: dailySummaryEnabled ?? settings.dailySummaryEnabled,
          dailySummaryTime: dailySummaryTime ?? settings.dailySummaryTime
        }
      })
    } else {
      // Criar
      settings = await prisma.telegramAlertSettings.create({
        data: {
          userId: user.id,
          highSpendingEnabled: highSpendingEnabled ?? true,
          highSpendingThreshold: highSpendingThreshold ?? 100.0,
          highSpendingPeriod: highSpendingPeriod ?? 'DAILY',
          goalProgressEnabled: goalProgressEnabled ?? true,
          goalProgressThreshold: goalProgressThreshold ?? 50.0,
          dailySummaryEnabled: dailySummaryEnabled ?? false,
          dailySummaryTime: dailySummaryTime ?? '20:00'
        }
      })
    }

    return NextResponse.json({ settings, success: true })
  } catch (error) {
    console.error('Error updating alert settings:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}

