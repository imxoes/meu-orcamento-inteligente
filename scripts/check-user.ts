/**
 * Script para verificar dados do usuário
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        emailVerificationToken: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    if (!user) {
      console.log(`❌ Usuário com email ${email} não encontrado`)
      return
    }

    console.log('👤 Dados do usuário:')
    console.log(`   📧 Email: ${user.email}`)
    console.log(`   👤 Nome: ${user.name}`)
    console.log(`   🆔 ID: ${user.id}`)
    console.log(`   ✅ Verificado: ${user.emailVerified ? 'SIM' : 'NÃO'}`)
    console.log(`   🔑 Token verificação: ${user.emailVerificationToken ? 'PENDENTE' : 'USADO/VAZIO'}`)
    console.log(`   👑 Role: ${user.role}`)
    console.log(`   🟢 Ativo: ${user.isActive ? 'SIM' : 'NÃO'}`)
    console.log(`   📅 Criado: ${user.createdAt}`)
    console.log(`   🔐 Último login: ${user.lastLoginAt || 'NUNCA'}`)

    if (!user.emailVerified && user.emailVerificationToken) {
      console.log('\n🔧 Para verificar manualmente:')
      console.log(`   Token: ${user.emailVerificationToken}`)
      console.log(`   URL: http://localhost:3003/auth/verify?token=${user.emailVerificationToken}`)
    }

  } catch (error: any) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]

if (!email) {
  console.error('❌ Por favor, forneça o email do usuário:')
  console.error('   npx tsx scripts/check-user.ts email@exemplo.com')
  process.exit(1)
}

checkUser(email)