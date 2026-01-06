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

    // Get goals
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      goals: goals.map(goal => ({
        id: goal.id,
        title: goal.title,
        description: goal.description,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate?.toISOString(),
        status: goal.status,
        createdAt: goal.createdAt.toISOString()
      }))
    })

  } catch (error) {
    console.error('Goals fetch error:', error)
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

    const { title, description, targetAmount, targetDate } = body

    // Validate required fields
    if (!title || !targetAmount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (targetAmount <= 0) {
      return NextResponse.json(
        { error: 'Target amount must be positive' },
        { status: 400 }
      )
    }

    // Create goal
    const goal = await prisma.goal.create({
      data: {
        userId,
        title: title.trim(),
        description: description?.trim(),
        targetAmount: parseFloat(targetAmount),
        targetDate: targetDate ? new Date(targetDate) : null,
        status: 'ACTIVE'
      }
    })

    return NextResponse.json({
      success: true,
      goal: {
        id: goal.id,
        title: goal.title,
        description: goal.description,
        currentAmount: goal.currentAmount,
        targetAmount: goal.targetAmount,
        targetDate: goal.targetDate?.toISOString(),
        status: goal.status,
        createdAt: goal.createdAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Goal creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}