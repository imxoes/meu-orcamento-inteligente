import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteUserData() {
  const email = 'matheushilariolopes@gmail.com'

  try {
    console.log(`🔍 Buscando usuário com email: ${email}`)
    
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('❌ Usuário não encontrado')
      return
    }

    console.log(`✅ Usuário encontrado: ${user.name} (ID: ${user.id})`)

    // Deletar transações
    const transactionsCount = await prisma.transaction.count({
      where: { userId: user.id }
    })
    await prisma.transaction.deleteMany({
      where: { userId: user.id }
    })
    console.log(`🗑️  Deletadas ${transactionsCount} transações`)

    // Deletar metas
    const goalsCount = await prisma.goal.count({
      where: { userId: user.id }
    })
    await prisma.goal.deleteMany({
      where: { userId: user.id }
    })
    console.log(`🗑️  Deletadas ${goalsCount} metas`)

    // Deletar investimentos
    try {
      const investmentsCount = await prisma.investment.count({
        where: { userId: user.id }
      })
      await prisma.investment.deleteMany({
        where: { userId: user.id }
      })
      console.log(`🗑️  Deletados ${investmentsCount} investimentos`)
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.log('⚠️  Tabela de investimentos não existe, pulando...')
      } else {
        throw error
      }
    }

    // Deletar sessões
    const sessionsCount = await prisma.session.count({
      where: { userId: user.id }
    })
    await prisma.session.deleteMany({
      where: { userId: user.id }
    })
    console.log(`🗑️  Deletadas ${sessionsCount} sessões`)

    // Deletar o usuário
    await prisma.user.delete({
      where: { id: user.id }
    })
    console.log(`🗑️  Usuário deletado`)

    console.log('✅ Todos os dados foram deletados com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao deletar dados:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

deleteUserData()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

