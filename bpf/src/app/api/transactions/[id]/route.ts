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
    const transactionId = params.id

    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { amount, description, type, categoryId, date } = body

    // Verificar se a transação existe e pertence ao usuário
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Validar campos
    if (!amount || !description || !type || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      )
    }

    // Atualizar transação
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        amount: Math.abs(parseFloat(amount)),
        description: description.trim(),
        type,
        categoryId,
        date: date ? new Date(date) : transaction.date
      },
      include: {
        category: {
          select: { name: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      transaction: {
        id: updatedTransaction.id,
        amount: updatedTransaction.amount,
        description: updatedTransaction.description,
        date: updatedTransaction.date.toISOString(),
        createdAt: updatedTransaction.createdAt.toISOString(),
        type: updatedTransaction.type,
        category: { name: updatedTransaction.category.name }
      }
    })

  } catch (error: any) {
    console.error('Transaction update error:', error)
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
    const transactionId = params.id

    // Verificar se a transação existe e pertence ao usuário
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        userId
      }
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Deletar transação
    await prisma.transaction.delete({
      where: { id: transactionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Transaction deleted successfully'
    })

  } catch (error: any) {
    console.error('Transaction deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

