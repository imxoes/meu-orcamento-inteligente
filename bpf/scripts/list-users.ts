import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        emailVerified: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`\n📋 Total de usuários: ${users.length}\n`)
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Criado em: ${user.createdAt.toLocaleString('pt-BR')}`)
      console.log(`   Email verificado: ${user.emailVerified ? 'Sim' : 'Não'}`)
      console.log('')
    })
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listUsers()

