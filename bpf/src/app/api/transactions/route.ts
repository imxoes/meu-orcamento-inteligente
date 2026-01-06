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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '1000')
    
    // Filtros opcionais
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const categoryId = searchParams.get('categoryId')
    const type = searchParams.get('type')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')

    console.log('📊 Fetching transactions for user:', userId, 'filters:', { startDate, endDate, categoryId, type, minAmount, maxAmount })

    // Construir filtros
    const where: any = { userId }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        // Criar data no início do dia (00:00:00) no timezone local
        // Usar UTC para evitar problemas de timezone
        const [year, month, day] = startDate.split('-').map(Number)
        const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
        where.date.gte = start
      }
      if (endDate) {
        // Criar data no final do dia (23:59:59.999) no timezone local
        // Usar UTC para evitar problemas de timezone
        const [year, month, day] = endDate.split('-').map(Number)
        const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999))
        where.date.lte = end
      }
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (type && (type === 'INCOME' || type === 'EXPENSE')) {
      where.type = type
    }

    if (minAmount || maxAmount) {
      where.amount = {}
      if (minAmount) {
        where.amount.gte = parseFloat(minAmount)
      }
      if (maxAmount) {
        where.amount.lte = parseFloat(maxAmount)
      }
    }

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })

    console.log('✅ Found', transactions.length, 'transactions for user:', userId)

    return NextResponse.json({
      transactions: transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        description: t.description,
        date: t.date.toISOString(),
        createdAt: t.createdAt.toISOString(),
        type: t.type,
        category: { 
          id: t.category.id,
          name: t.category.name 
        }
      }))
    })

  } catch (error) {
    console.error('Transactions fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { amount, description, type, categoryId, date } = body

    // Validate required fields
    if (!amount || !description || !type || !categoryId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate type
    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return NextResponse.json(
        { error: 'Invalid transaction type' },
        { status: 400 }
      )
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        userId,
        amount: Math.abs(parseFloat(amount)),
        description: description.trim(),
        type,
        categoryId,
        date: date ? new Date(date) : new Date()
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
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date.toISOString(),
        type: transaction.type,
        category: { name: transaction.category.name }
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Transaction creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}