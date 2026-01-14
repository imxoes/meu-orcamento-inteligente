import { prisma } from '../src/lib/prisma'

async function testTrialSystem() {
  console.log('🔍 Testando sistema de trial...')

  try {
    // 1. Verificar usuários com trial ativo
    const activeTrialUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'TRIAL',
        trialEndsAt: {
          gt: new Date() // Data de fim do trial é maior que agora
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        trialEndsAt: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        isBlocked: true,
        createdAt: true
      }
    })

    console.log(`📊 Usuários com trial ativo: ${activeTrialUsers.length}`)

    activeTrialUsers.forEach(user => {
      const daysRemaining = Math.ceil((new Date(user.trialEndsAt!).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      console.log(`  - ${user.name} (${user.email}): ${daysRemaining} dias restantes`)
    })

    // 2. Verificar usuários com trial expirado
    const expiredTrialUsers = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'TRIAL',
        trialEndsAt: {
          lte: new Date() // Data de fim do trial é menor ou igual a agora
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        trialEndsAt: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        isBlocked: true,
        createdAt: true
      }
    })

    console.log(`⚠️ Usuários com trial expirado: ${expiredTrialUsers.length}`)

    expiredTrialUsers.forEach(user => {
      const daysExpired = Math.ceil((Date.now() - new Date(user.trialEndsAt!).getTime()) / (1000 * 60 * 60 * 24))
      console.log(`  - ${user.name} (${user.email}): expirou há ${daysExpired} dias (Bloqueado: ${user.isBlocked ? 'Sim' : 'Não'})`)
    })

    // 3. Verificar usuários bloqueados por trial expirado
    const blockedUsers = await prisma.user.findMany({
      where: {
        isBlocked: true,
        blockedReason: {
          contains: 'Trial'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        blockedAt: true,
        blockedReason: true,
        subscriptionStatus: true
      }
    })

    console.log(`🚫 Usuários bloqueados por trial: ${blockedUsers.length}`)

    blockedUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email}): bloqueado em ${user.blockedAt?.toLocaleDateString('pt-BR')}`)
    })

    // 4. Estatísticas gerais
    const totalUsers = await prisma.user.count()
    const trialUsers = await prisma.user.count({
      where: { subscriptionStatus: 'TRIAL' }
    })
    const paidUsers = await prisma.user.count({
      where: {
        subscriptionStatus: 'ACTIVE',
        subscriptionPlan: { in: ['BASIC', 'PREMIUM'] }
      }
    })
    const blockedTotal = await prisma.user.count({
      where: { isBlocked: true }
    })

    console.log('\n📈 Estatísticas:')
    console.log(`  Total de usuários: ${totalUsers}`)
    console.log(`  Em trial: ${trialUsers}`)
    console.log(`  Com plano pago: ${paidUsers}`)
    console.log(`  Bloqueados: ${blockedTotal}`)

    // 5. Testar função de expiração (simular)
    if (expiredTrialUsers.length > 0) {
      console.log('\n🔧 Testando bloqueio automático...')

      const response = await fetch('http://localhost:3003/api/cron/check-expired-trials')
      const result = await response.json()

      console.log(`✅ Resultado: ${result.message}`)
      console.log(`📊 Processados: ${result.processed || 0}`)
    }

  } catch (error) {
    console.error('❌ Erro ao testar sistema de trial:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Executar teste
testTrialSystem().catch(console.error)