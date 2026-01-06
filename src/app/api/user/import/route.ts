import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ message: 'Token inválido' }, { status: 401 })
    }

    const importData = await request.json()

    // Validar estrutura do arquivo
    if (!importData.version || !importData.transactions) {
      return NextResponse.json({ 
        message: 'Arquivo de backup inválido. Certifique-se de usar um arquivo exportado pelo Orbi.' 
      }, { status: 400 })
    }

    let importedTransactions = 0
    let importedGoals = 0
    let importedInvestments = 0
    let skippedTransactions = 0

    // Importar transações
    if (importData.transactions && Array.isArray(importData.transactions)) {
      for (const transaction of importData.transactions) {
        try {
          // Buscar ou criar categoria
          let category = await prisma.category.findFirst({
            where: { name: transaction.category || 'Outros' }
          })

          if (!category) {
            category = await prisma.category.create({
              data: { name: transaction.category || 'Outros' }
            })
          }

          // Verificar se transação já existe (mesma descrição, valor e data)
          const existingTransaction = await prisma.transaction.findFirst({
            where: {
              userId: decoded.userId,
              amount: transaction.amount,
              description: transaction.description,
              date: new Date(transaction.date)
            }
          })

          if (existingTransaction) {
            skippedTransactions++
            continue
          }

          await prisma.transaction.create({
            data: {
              amount: transaction.amount,
              description: transaction.description,
              type: transaction.type || 'EXPENSE',
              method: transaction.method || 'OTHER',
              date: new Date(transaction.date || transaction.createdAt),
              userId: decoded.userId,
              categoryId: category.id
            }
          })
          importedTransactions++
        } catch (e) {
          console.error('Error importing transaction:', e)
        }
      }
    }

    // Importar metas
    if (importData.goals && Array.isArray(importData.goals)) {
      for (const goal of importData.goals) {
        try {
          // Verificar se meta já existe
          const existingGoal = await prisma.goal.findFirst({
            where: {
              userId: decoded.userId,
              title: goal.title
            }
          })

          if (existingGoal) continue

          await prisma.goal.create({
            data: {
              title: goal.title,
              description: goal.description || null,
              targetAmount: goal.targetAmount,
              currentAmount: goal.currentAmount || 0,
              targetDate: goal.targetDate ? new Date(goal.targetDate) : null,
              status: goal.status || 'ACTIVE',
              userId: decoded.userId
            }
          })
          importedGoals++
        } catch (e) {
          console.error('Error importing goal:', e)
        }
      }
    }

    // Importar investimentos
    if (importData.investments && Array.isArray(importData.investments)) {
      for (const investment of importData.investments) {
        try {
          // Verificar se investimento já existe
          const existingInvestment = await prisma.investment.findFirst({
            where: {
              userId: decoded.userId,
              title: investment.title
            }
          })

          if (existingInvestment) continue

          await prisma.investment.create({
            data: {
              title: investment.title,
              description: investment.description || null,
              currentAmount: investment.currentAmount || 0,
              userId: decoded.userId
            }
          })
          importedInvestments++
        } catch (e) {
          console.error('Error importing investment:', e)
        }
      }
    }

    return NextResponse.json({ 
      message: 'Dados importados com sucesso!',
      summary: {
        transactions: importedTransactions,
        goals: importedGoals,
        investments: importedInvestments,
        skipped: skippedTransactions
      }
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ message: 'Erro ao importar dados' }, { status: 500 })
  }
}

