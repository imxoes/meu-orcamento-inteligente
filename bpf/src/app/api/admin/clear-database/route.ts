import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * ROTA TEMPORÁRIA PARA LIMPAR O BANCO DE DADOS
 * ⚠️ REMOVER DEPOIS DE USAR!
 * 
 * Acesse: POST /api/admin/clear-database
 * Body: { "confirm": true, "secret": "CLEAR_ALL_DATA_2024" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verificação de segurança simples
    if (body.confirm !== true || body.secret !== 'CLEAR_ALL_DATA_2024') {
      return NextResponse.json(
        { error: 'Confirmação inválida' },
        { status: 401 }
      )
    }

    console.log('🗑️  INICIANDO LIMPEZA COMPLETA DO BANCO DE DADOS...')

    // Deletar em ordem (respeitando foreign keys)
    const transactionsDeleted = await prisma.transaction.deleteMany({})
    console.log(`✅ ${transactionsDeleted.count} transações deletadas`)

    const goalsDeleted = await prisma.goal.deleteMany({})
    console.log(`✅ ${goalsDeleted.count} metas deletadas`)

    try {
      const investmentsDeleted = await prisma.investment.deleteMany({})
      console.log(`✅ ${investmentsDeleted.count} investimentos deletados`)
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('⚠️  Tabela de investimentos não existe')
      }
    }

    const sessionsDeleted = await prisma.session.deleteMany({})
    console.log(`✅ ${sessionsDeleted.count} sessões deletadas`)

    const passwordResetsDeleted = await prisma.passwordReset.deleteMany({})
    console.log(`✅ ${passwordResetsDeleted.count} tokens deletados`)

    const usersDeleted = await prisma.user.deleteMany({})
    console.log(`✅ ${usersDeleted.count} usuários deletados`)

    return NextResponse.json({
      success: true,
      message: 'Banco de dados limpo com sucesso!',
      deleted: {
        users: usersDeleted.count,
        transactions: transactionsDeleted.count,
        goals: goalsDeleted.count,
        sessions: sessionsDeleted.count,
        passwordResets: passwordResetsDeleted.count
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao limpar banco:', error)
    return NextResponse.json(
      { error: 'Erro ao limpar banco de dados', message: error.message },
      { status: 500 }
    )
  }
}

