import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
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

    // Get current month start and end
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Get all transactions for calculations
    const allTransactions = await prisma.transaction.findMany({
      where: { userId },
      select: {
        amount: true,
        type: true
      }
    })

    // Get monthly transactions
    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: monthStart,
          lte: monthEnd
        }
      },
      select: {
        amount: true,
        type: true
      }
    })

    // Calculate stats
    const totalBalance = allTransactions.reduce((sum, transaction) => {
      return sum + (transaction.type === 'INCOME' ? transaction.amount : -transaction.amount)
    }, 0)

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    // Calcular economia proposital: valores depositados em metas e investimentos no mês
    // Buscar transações de economia (categoria "Economia") e investimentos (categoria "Investimentos")
    // Primeiro, buscar os IDs das categorias
    const economyCategories = await prisma.category.findMany({
      where: {
        name: {
          in: ['Economia', 'Investimentos']
        }
      },
      select: {
        id: true
      }
    })

    const economyCategoryIds = economyCategories.map(c => c.id)

    let monthlySavings = 0
    if (economyCategoryIds.length > 0) {
      const economyTransactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: monthStart,
            lte: monthEnd
          },
          type: 'EXPENSE',
          categoryId: {
            in: economyCategoryIds
          }
        },
        select: {
          amount: true
        }
      })

      monthlySavings = economyTransactions.reduce((sum, t) => sum + t.amount, 0)
    }

    return NextResponse.json({
      totalBalance,
      monthlyIncome,
      monthlyExpenses: -monthlyExpenses, // Return as negative for display
      monthlySavings
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}