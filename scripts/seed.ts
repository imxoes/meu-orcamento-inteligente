const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Create default categories
  const categories = [
    { name: 'Alimentação', icon: '🍔', color: '#FF6B6B' },
    { name: 'Transporte', icon: '🚗', color: '#4ECDC4' },
    { name: 'Moradia', icon: '🏠', color: '#45B7D1' },
    { name: 'Saúde', icon: '🏥', color: '#96CEB4' },
    { name: 'Educação', icon: '📚', color: '#FFEAA7' },
    { name: 'Lazer', icon: '🎮', color: '#DDA0DD' },
    { name: 'Compras', icon: '🛒', color: '#FDA7DF' },
    { name: 'Serviços', icon: '⚙️', color: '#74B9FF' },
    { name: 'Outros', icon: '📦', color: '#A0A0A0' }
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    })
  }

  console.log('✅ Categories seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })