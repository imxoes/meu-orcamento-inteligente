import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
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

    try {
      const investments = await prisma.investment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        investments: investments.map(inv => ({
          id: inv.id,
          title: inv.title,
          description: inv.description,
          currentAmount: inv.currentAmount,
          createdAt: inv.createdAt.toISOString()
        }))
      })
    } catch (dbError: any) {
      // Se a tabela não existe, retornar array vazio em vez de erro
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        console.warn('Tabela investments não existe ainda. Retornando array vazio.')
        return NextResponse.json({
          investments: []
        })
      }
      throw dbError
    }

  } catch (error: any) {
    console.error('Investments fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const body = await request.json().catch(() => null)

    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { title, description } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    try {
      // Criar investimento
      const investment = await prisma.investment.create({
        data: {
          userId,
          title: title.trim(),
          description: description?.trim() || null,
          currentAmount: 0
        }
      })

      return NextResponse.json({
        success: true,
        investment: {
          id: investment.id,
          title: investment.title,
          description: investment.description,
          currentAmount: investment.currentAmount,
          createdAt: investment.createdAt.toISOString()
        }
      }, { status: 201 })
    } catch (dbError: any) {
      // Se a tabela não existe, retornar erro específico
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        console.error('Tabela investments não existe no banco de dados')
        return NextResponse.json(
          { 
            error: 'Database table not found', 
            message: 'A tabela de investimentos ainda não foi criada. Execute o script SQL fornecido no arquivo FIX_INVESTMENTS_TABLE.md' 
          },
          { status: 503 }
        )
      }
      throw dbError
    }

  } catch (error: any) {
    console.error('Investment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

