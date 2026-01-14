import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeUserAdmin() {
  try {
    // Buscar o usuário pelo email (substitua pelo seu email)
    const userEmail = 'matheushilariolopes@gmail.com' // Seu email atual

    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      console.log('❌ Usuário não encontrado:', userEmail)
      return
    }

    // Atualizar para admin
    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: {
        role: 'ADMIN',
        subscriptionPlan: 'PREMIUM', // Garantir que tenha acesso premium
        subscriptionStatus: 'ACTIVE'
      }
    })

    console.log('✅ Usuário transformado em admin com sucesso!')
    console.log('📧 Email:', updatedUser.email)
    console.log('👤 Nome:', updatedUser.name)
    console.log('🔑 Role:', updatedUser.role)
    console.log('🆔 ID:', updatedUser.id)
    console.log('')
    console.log('🎉 Agora você pode acessar o painel admin através do seu dashboard normal!')

  } catch (error) {
    console.error('❌ Erro ao transformar usuário em admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

makeUserAdmin()