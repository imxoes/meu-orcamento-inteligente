import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/middleware/admin'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    await requireAdminAuth(request)

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') || 'all' // all, active, blocked, vip
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {
      role: 'USER' // Não mostrar outros admins
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status === 'active') {
      where.isActive = true
      where.isBlocked = false
    } else if (status === 'blocked') {
      where.isBlocked = true
    } else if (status === 'vip') {
      where.subscriptionPlan = { in: ['BASIC', 'PREMIUM'] }
    }

    // Buscar usuários
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          isBlocked: true,
          blockedAt: true,
          blockedBy: true,
          blockedReason: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          lastLoginAt: true,
          createdAt: true,
          provider: true,
          _count: {
            select: {
              transactions: true,
              goals: true,
              investments: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    // Calcular estatísticas
    const stats = await prisma.user.aggregate({
      where: { role: 'USER' },
      _count: {
        id: true
      }
    })

    const activeUsers = await prisma.user.count({
      where: {
        role: 'USER',
        isActive: true,
        isBlocked: false
      }
    })

    const blockedUsers = await prisma.user.count({
      where: {
        role: 'USER',
        isBlocked: true
      }
    })

    const vipUsers = await prisma.user.count({
      where: {
        role: 'USER',
        subscriptionPlan: { in: ['BASIC', 'PREMIUM'] }
      }
    })

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: {
        total: stats._count.id,
        active: activeUsers,
        blocked: blockedUsers,
        vip: vipUsers
      }
    })

  } catch (error: any) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Acesso negado: autenticação de admin requerida' ? 401 : 500 }
    )
  }
}