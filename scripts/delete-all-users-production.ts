import { PrismaClient } from '@prisma/client'

// Usar DATABASE_URL do ambiente (pode ser produção ou local)
const prisma = new PrismaClient()

async function deleteAllUsers() {
  try {
    console.log('🔍 Buscando todos os usuários no banco de dados...')
    console.log('📍 Database URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'não configurada')
    console.log('')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    })

    if (users.length === 0) {
      console.log('ℹ️  Nenhum usuário encontrado no banco de dados')
      return
    }

    console.log(`\n📋 Encontrados ${users.length} usuário(s):\n`)
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`)
    })
    console.log('')

    // Confirmar antes de deletar
    console.log('⚠️  ATENÇÃO: Isso vai deletar TODOS os dados!')
    console.log('   Pressione Ctrl+C para cancelar ou aguarde 3 segundos...\n')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Deletar todas as transações
    const transactionsCount = await prisma.transaction.count()
    await prisma.transaction.deleteMany({})
    console.log(`🗑️  Deletadas ${transactionsCount} transações`)

    // Deletar todas as metas
    const goalsCount = await prisma.goal.count()
    await prisma.goal.deleteMany({})
    console.log(`🗑️  Deletadas ${goalsCount} metas`)

    // Deletar todos os investimentos
    try {
      const investmentsCount = await prisma.investment.count()
      await prisma.investment.deleteMany({})
      console.log(`🗑️  Deletados ${investmentsCount} investimentos`)
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('⚠️  Tabela de investimentos não existe, pulando...')
      } else {
        throw error
      }
    }

    // Deletar todas as sessões
    const sessionsCount = await prisma.session.count()
    await prisma.session.deleteMany({})
    console.log(`🗑️  Deletadas ${sessionsCount} sessões`)

    // Deletar todos os password resets
    const passwordResetsCount = await prisma.passwordReset.count()
    await prisma.passwordReset.deleteMany({})
    console.log(`🗑️  Deletados ${passwordResetsCount} tokens de reset de senha`)

    // Deletar todos os usuários
    await prisma.user.deleteMany({})
    console.log(`🗑️  Deletados ${users.length} usuário(s)`)

    console.log('\n✅ Todos os dados foram deletados com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao deletar dados:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteAllUsers()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

