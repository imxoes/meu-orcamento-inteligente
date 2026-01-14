import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    const adminEmail = 'admin@useorbi.app'
    const adminPassword = 'Admin@2024!'
    const adminName = 'Administrador'

    // Verificar se o admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (existingAdmin) {
      console.log('❌ Admin já existe:', adminEmail)
      return
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: 'ADMIN',
        emailVerified: new Date(),
        isActive: true,
        subscriptionPlan: 'PREMIUM',
        subscriptionStatus: 'ACTIVE'
      }
    })

    console.log('✅ Admin criado com sucesso!')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Senha:', adminPassword)
    console.log('🆔 ID:', admin.id)
    console.log('')
    console.log('🌐 Acesse: http://localhost:3003/admin/login')
    console.log('')
    console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!')

  } catch (error) {
    console.error('❌ Erro ao criar admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()