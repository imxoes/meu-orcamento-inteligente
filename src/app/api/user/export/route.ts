import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 })
    }

    // Buscar todos os dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        emoji: true,
        accountType: true,
        createdAt: true,
        transactions: {
          select: {
            id: true,
            amount: true,
            description: true,
            type: true,
            method: true,
            date: true,
            createdAt: true,
            category: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        goals: {
          select: {
            id: true,
            title: true,
            description: true,
            targetAmount: true,
            currentAmount: true,
            targetDate: true,
            status: true,
            createdAt: true
          }
        },
        investments: {
          select: {
            id: true,
            title: true,
            description: true,
            currentAmount: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 })
    }

    // Formatar dados para exportação
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      user: {
        email: user.email,
        name: user.name,
        emoji: user.emoji,
        accountType: user.accountType,
        memberSince: user.createdAt
      },
      transactions: user.transactions.map(t => ({
        amount: t.amount,
        description: t.description,
        type: t.type,
        method: t.method,
        category: t.category?.name || 'Outros',
        date: t.date,
        createdAt: t.createdAt
      })),
      goals: user.goals.map(g => ({
        title: g.title,
        description: g.description,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate,
        status: g.status,
        createdAt: g.createdAt
      })),
      investments: user.investments.map(i => ({
        title: i.title,
        description: i.description,
        currentAmount: i.currentAmount,
        createdAt: i.createdAt
      })),
      summary: {
        totalTransactions: user.transactions.length,
        totalGoals: user.goals.length,
        totalInvestments: user.investments.length,
        totalIncome: user.transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: user.transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0)
      }
    }

    // Retornar como JSON com headers para download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="orbi-backup-${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ message: 'Erro ao exportar dados' }, { status: 500 })
  }
}

