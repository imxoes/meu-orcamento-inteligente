const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Cleaning all user data...')

  // Delete all transactions
  await prisma.transaction.deleteMany()
  console.log('Deleted all transactions')

  // Delete all goals
  await prisma.goal.deleteMany()
  console.log('Deleted all goals')

  // Delete all sessions
  await prisma.session.deleteMany()
  console.log('Deleted all sessions')

  // Delete all password resets
  await prisma.passwordReset.deleteMany()
  console.log('Deleted all password resets')

  // Delete all users
  await prisma.user.deleteMany()
  console.log('Deleted all users')

  console.log('Data cleanup completed! Starting with fresh database.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })