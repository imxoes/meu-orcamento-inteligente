/**
 * Script para tornar um usuário administrador
 * 
 * Uso:
 * npx tsx scripts/make-admin.ts email@exemplo.com
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (!user) {
      console.error(`❌ Usuário com email ${email} não encontrado`)
      process.exit(1)
    }

    if (user.role === 'ADMIN') {
      console.log(`✅ Usuário ${email} já é administrador`)
      process.exit(0)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' }
    })

    console.log(`✅ Usuário ${email} agora é ADMINISTRADOR!`)
    console.log(`   Nome: ${user.name}`)
    console.log(`   ID: ${user.id}`)
  } catch (error: any) {
    console.error('❌ Erro:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

const email = process.argv[2]

if (!email) {
  console.error('❌ Por favor, forneça o email do usuário:')
  console.error('   npx tsx scripts/make-admin.ts email@exemplo.com')
  process.exit(1)
}

makeAdmin(email)



