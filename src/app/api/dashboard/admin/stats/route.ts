import { NextResponse } from 'next/server'
import { requireDashboardAdminAuth } from '@/middleware/dashboard-admin'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    await requireDashboardAdminAuth(request)

    // Datas de referência
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)

    // Estatísticas gerais de usuários
    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      usersToday,
      usersThisWeek,
      usersThisMonth,
      freeUsers,
      basicUsers,
      premiumUsers
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'USER', isActive: true, isBlocked: false } }),
      prisma.user.count({ where: { role: 'USER', isBlocked: true } }),
      prisma.user.count({ where: { role: 'USER', createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { role: 'USER', createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { role: 'USER', createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { role: 'USER', subscriptionPlan: 'FREE' } }),
      prisma.user.count({ where: { role: 'USER', subscriptionPlan: 'BASIC' } }),
      prisma.user.count({ where: { role: 'USER', subscriptionPlan: 'PREMIUM' } })
    ])

    // Estatísticas financeiras
    const [
      totalTransactions,
      transactionsToday,
      transactionsThisWeek,
      transactionsThisMonth,
      totalRevenue,
      revenueThisMonth
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.transaction.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.transaction.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: { status: 'PAID', paidAt: { gte: thirtyDaysAgo } },
        _sum: { amount: true }
      })
    ])

    // Gráfico de registros por dia (últimos 30 dias)
    const registrationsByDay = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        role: 'USER',
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: true
    })

    // Processar dados por dia
    const chartData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const count = registrationsByDay.filter(reg => {
        const regDate = new Date(reg.createdAt)
        return regDate >= date && regDate < nextDate
      }).length

      chartData.push({
        date: date.toISOString().split('T')[0],
        users: count
      })
    }

    // Distribuição de planos
    const planDistribution = [
      { name: 'Free', value: freeUsers, color: '#6b7280' },
      { name: 'Basic', value: basicUsers, color: '#3b82f6' },
      { name: 'Premium', value: premiumUsers, color: '#10b981' }
    ]

    // Top categorias mais usadas
    const topCategories = await prisma.category.findMany({
      select: {
        name: true,
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        transactions: {
          _count: 'desc'
        }
      },
      take: 5
    })

    // Últimas atividades (últimos logs admin)
    const recentActivities = await prisma.adminLog.findMany({
      select: {
        id: true,
        action: true,
        description: true,
        createdAt: true,
        admin: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          blocked: blockedUsers,
          today: usersToday,
          thisWeek: usersThisWeek,
          thisMonth: usersThisMonth
        },
        plans: {
          free: freeUsers,
          basic: basicUsers,
          premium: premiumUsers,
          distribution: planDistribution
        },
        transactions: {
          total: totalTransactions,
          today: transactionsToday,
          thisWeek: transactionsThisWeek,
          thisMonth: transactionsThisMonth
        },
        revenue: {
          total: totalRevenue._sum.amount || 0,
          thisMonth: revenueThisMonth._sum.amount || 0
        },
        charts: {
          registrations: chartData
        },
        topCategories: topCategories.map(cat => ({
          name: cat.name,
          transactions: cat._count.transactions
        })),
        recentActivities: recentActivities.map(activity => ({
          id: activity.id,
          action: activity.action,
          description: activity.description,
          admin: activity.admin.name,
          createdAt: activity.createdAt
        }))
      }
    })

  } catch (error: any) {
    console.error('Erro ao buscar estatísticas admin do dashboard:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: error.message === 'Acesso negado: permissões de admin requeridas' ? 403 : 500 }
    )
  }
}