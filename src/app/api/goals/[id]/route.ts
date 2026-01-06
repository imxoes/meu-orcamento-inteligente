import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get token from cookie
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId
    const params = await context.params
    const goalId = params.id

    // Verify goal belongs to user
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId
      }
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
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

    let newCurrentAmount = goal.currentAmount
    const amountToAdd = action === 'add' ? parseFloat(amount) : 0

    if (action === 'add') {
      newCurrentAmount = goal.currentAmount + parseFloat(amount)
    } else if (action === 'set') {
      newCurrentAmount = parseFloat(amount)
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "add" or "set"' },
        { status: 400 }
      )
    }

    // Check if goal is completed
    const isCompleted = newCurrentAmount >= goal.targetAmount
    const newStatus = isCompleted ? 'COMPLETED' : goal.status

    // Se estiver adicionando dinheiro (não apenas setando), criar transação de economia
    if (action === 'add' && amountToAdd > 0) {
      // Buscar ou criar categoria "Economia"
      let economyCategory = await prisma.category.findFirst({
        where: { name: 'Economia' }
      })

      if (!economyCategory) {
        economyCategory = await prisma.category.create({
          data: { name: 'Economia' }
        })
      }

      // Criar transação de economia (EXPENSE porque o dinheiro saiu do saldo disponível)
      await prisma.transaction.create({
        data: {
          userId,
          amount: amountToAdd,
          description: `Economia para meta: ${goal.title}`,
          type: 'EXPENSE',
          method: 'OTHER',
          categoryId: economyCategory.id,
          date: new Date()
        }
      })

      console.log(`✅ Transação de economia criada: R$ ${amountToAdd.toFixed(2)} para meta "${goal.title}"`)
    }

    // Update goal
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        currentAmount: newCurrentAmount,
        status: newStatus
      }
    })

    return NextResponse.json({
      success: true,
      goal: {
        id: updatedGoal.id,
        title: updatedGoal.title,
        description: updatedGoal.description,
        currentAmount: updatedGoal.currentAmount,
        targetAmount: updatedGoal.targetAmount,
        targetDate: updatedGoal.targetDate?.toISOString(),
        status: updatedGoal.status,
        createdAt: updatedGoal.createdAt.toISOString()
      }
    })

  } catch (error) {
    console.error('Goal update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Get token from cookie
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId
    const params = await context.params
    const goalId = params.id

    // Verify goal belongs to user
    const goal = await prisma.goal.findFirst({
      where: {
        id: goalId,
        userId
      }
    })

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      )
    }

    // Delete goal
    await prisma.goal.delete({
      where: { id: goalId }
    })

    return NextResponse.json({
      success: true,
      message: 'Goal deleted successfully'
    })

  } catch (error) {
    console.error('Goal deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

