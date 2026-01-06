import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkProductionDB() {
  try {
    console.log('🔍 Verificando banco de dados de produção...\n')
    console.log('📍 Database URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'não configurada')
    console.log('')

    // Listar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📋 Total de usuários encontrados: ${users.length}\n`)

    if (users.length > 0) {
      console.log('Usuários no banco:\n')
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Ativo: ${user.isActive ? 'Sim' : 'Não'}`)
        console.log(`   Email verificado: ${user.emailVerified ? 'Sim' : 'Não'}`)
        console.log(`   Criado em: ${user.createdAt.toLocaleString('pt-BR')}`)
        console.log('')
      })

      // Contar dados relacionados
      const transactionsCount = await prisma.transaction.count()
      const goalsCount = await prisma.goal.count()
      const sessionsCount = await prisma.session.count()

      console.log('📊 Dados relacionados:')
      console.log(`   Transações: ${transactionsCount}`)
      console.log(`   Metas: ${goalsCount}`)
      console.log(`   Sessões: ${sessionsCount}`)
      console.log('')

      // Perguntar se quer deletar
      console.log('💡 Para deletar todos os usuários, execute:')
      console.log('   npx tsx scripts/force-delete-all.ts\n')
    } else {
      console.log('✅ Banco de dados está vazio!\n')
    }

  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkProductionDB()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

