import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function forceDeleteAll() {
  try {
    console.log('🗑️  FORÇANDO LIMPEZA COMPLETA DO BANCO DE DADOS\n')
    console.log('⚠️  Isso vai deletar TUDO: usuários, transações, metas, investimentos, sessões...\n')
    
    // Deletar em ordem (respeitando foreign keys)
    console.log('1️⃣ Deletando transações...')
    const transactionsDeleted = await prisma.transaction.deleteMany({})
    console.log(`   ✅ ${transactionsDeleted.count} transações deletadas`)

    console.log('2️⃣ Deletando metas...')
    const goalsDeleted = await prisma.goal.deleteMany({})
    console.log(`   ✅ ${goalsDeleted.count} metas deletadas`)

    console.log('3️⃣ Deletando investimentos...')
    try {
      const investmentsDeleted = await prisma.investment.deleteMany({})
      console.log(`   ✅ ${investmentsDeleted.count} investimentos deletados`)
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('   ⚠️  Tabela de investimentos não existe')
      } else {
        throw error
      }
    }

    console.log('4️⃣ Deletando sessões...')
    const sessionsDeleted = await prisma.session.deleteMany({})
    console.log(`   ✅ ${sessionsDeleted.count} sessões deletadas`)

    console.log('5️⃣ Deletando password resets...')
    const passwordResetsDeleted = await prisma.passwordReset.deleteMany({})
    console.log(`   ✅ ${passwordResetsDeleted.count} tokens deletados`)

    console.log('6️⃣ Deletando usuários...')
    const usersDeleted = await prisma.user.deleteMany({})
    console.log(`   ✅ ${usersDeleted.count} usuários deletados`)

    console.log('\n✅ BANCO DE DADOS COMPLETAMENTE LIMPO!')
    console.log('   Agora você pode criar uma nova conta sem problemas.\n')
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

forceDeleteAll()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

