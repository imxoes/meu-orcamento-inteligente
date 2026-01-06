import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId
    const params = await context.params
    const investmentId = params.id

    const investment = await prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId
      }
    })

    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found' },
        { status: 404 }
      )
    }

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { amount, action } = body

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      )
    }

    let newCurrentAmount = investment.currentAmount

    if (action === 'add') {
      newCurrentAmount = investment.currentAmount + parseFloat(amount)
    } else if (action === 'set') {
      newCurrentAmount = parseFloat(amount)
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "add" or "set"' },
        { status: 400 }
      )
    }

    // Se estiver adicionando dinheiro, criar transação de investimento
    if (action === 'add' && parseFloat(amount) > 0) {
      // Buscar ou criar categoria "Investimentos"
      let investmentCategory = await prisma.category.findFirst({
        where: { name: 'Investimentos' }
      })

      if (!investmentCategory) {
        investmentCategory = await prisma.category.create({
          data: { name: 'Investimentos' }
        })
      }

      // Criar transação de investimento (EXPENSE porque o dinheiro saiu do saldo disponível)
      await prisma.transaction.create({
        data: {
          userId,
          amount: parseFloat(amount),
          description: `Investimento: ${investment.title}`,
          type: 'EXPENSE',
          method: 'OTHER',
          categoryId: investmentCategory.id,
          date: new Date()
        }
      })

      console.log(`✅ Transação de investimento criada: R$ ${parseFloat(amount).toFixed(2)} para "${investment.title}"`)
    }

    // Update investment
    const updatedInvestment = await prisma.investment.update({
      where: { id: investmentId },
      data: {
        currentAmount: newCurrentAmount
      }
    })

    return NextResponse.json({
      success: true,
      investment: {
        id: updatedInvestment.id,
        title: updatedInvestment.title,
        description: updatedInvestment.description,
        currentAmount: updatedInvestment.currentAmount,
        createdAt: updatedInvestment.createdAt.toISOString()
      }
    })

  } catch (error: any) {
    console.error('Investment update error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId
    const params = await context.params
    const investmentId = params.id

    const investment = await prisma.investment.findFirst({
      where: {
        id: investmentId,
        userId
      }
    })

    if (!investment) {
      return NextResponse.json(
        { error: 'Investment not found' },
        { status: 404 }
      )
    }

    await prisma.investment.delete({
      where: { id: investmentId }
    })

    return NextResponse.json({
      success: true,
      message: 'Investment deleted successfully'
    })

  } catch (error: any) {
    console.error('Investment deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

