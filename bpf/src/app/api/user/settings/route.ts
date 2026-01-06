import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

// GET - Buscar configurações do usuário
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      )
    }

    // Buscar ou criar configurações
    let settings = await prisma.userSettings.findUnique({
      where: { userId: decoded.userId }
    })

    if (!settings) {
      // Criar configurações padrão
      settings = await prisma.userSettings.create({
        data: {
          userId: decoded.userId
        }
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { message: 'Erro ao buscar configurações' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar configurações do usuário
export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { message: 'Token inválido' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Campos permitidos para atualização
    const allowedFields = [
      'spendingAlertsEnabled',
      'spendingAlertLimit',
      'spendingAlertPeriod',
      'goalAlertsEnabled',
      'goalAlertThreshold',
      'lowBalanceAlertEnabled',
      'lowBalanceThreshold',
      'alertDeliveryMethod',
      'emailFrequency',
      'emailTime',
      'weeklyReportEnabled',
      'weeklyReportDay',
      'weeklyReportContent',
      'monthlyReportEnabled',
      'monthlyReportDay',
      'monthlyReportContent',
      'reportDeliveryMethod'
    ]

    // Filtrar apenas campos permitidos
    const updateData: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Upsert - criar se não existir, atualizar se existir
    const settings = await prisma.userSettings.upsert({
      where: { userId: decoded.userId },
      update: updateData,
      create: {
        userId: decoded.userId,
        ...updateData
      }
    })

    return NextResponse.json({ 
      message: 'Configurações atualizadas com sucesso',
      settings 
    })
  } catch (error) {
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { message: 'Erro ao atualizar configurações' },
      { status: 500 }
    )
  }
}

