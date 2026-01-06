const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function verifyUser(email) {
  try {
    console.log(`Procurando usuário com email: ${email}`)

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      console.log('❌ Usuário não encontrado')
      return
    }

    console.log('✅ Usuário encontrado:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Nome: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Email Verificado: ${user.emailVerified ? 'SIM' : 'NÃO'}`)
    console.log(`   Ativo: ${user.isActive ? 'SIM' : 'NÃO'}`)

    if (user.emailVerified) {
      console.log('✅ Email já está verificado!')
      return
    }

    // Verify the email
    console.log('📧 Verificando email...')
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        emailVerificationToken: null,
        isActive: true
      }
    })

    console.log('🎉 Email verificado com sucesso! Usuário agora pode fazer login.')

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line argument
const email = process.argv[2]
if (!email) {
  console.log('❌ Por favor, forneça um email como argumento')
  console.log('Uso: node verify-user.js email@exemplo.com')
  process.exit(1)
}

verifyUser(email)