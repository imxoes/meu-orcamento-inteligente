/**
 * Script para criar usuário de teste verificado
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    const email = 'test@example.com'
    const password = 'Password123!'
    const name = 'Test User'

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('❌ Usuário já existe, atualizando...')

      // Update user to be verified and active
      const hashedPassword = await bcrypt.hash(password, 12)

      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          emailVerified: new Date(),
          emailVerificationToken: null,
          isActive: true
        }
      })

      console.log('✅ Usuário atualizado:')
      console.log(`   📧 Email: ${updatedUser.email}`)
      console.log(`   👤 Nome: ${updatedUser.name}`)
      console.log(`   ✅ Verificado: SIM`)
      console.log(`   🟢 Ativo: SIM`)
      console.log(`   🔑 Senha: ${password}`)

      return
    }

    // Create new verified user
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        emailVerified: new Date(),
        emailVerificationToken: null,
        isActive: true
      }
    })

    console.log('✅ Usuário de teste criado:')
    console.log(`   📧 Email: ${user.email}`)
    console.log(`   👤 Nome: ${user.name}`)
    console.log(`   🆔 ID: ${user.id}`)
    console.log(`   ✅ Verificado: SIM`)
    console.log(`   🟢 Ativo: SIM`)
    console.log(`   🔑 Senha: ${password}`)

  } catch (error: any) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()