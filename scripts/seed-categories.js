const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const defaultCategories = [
  { name: 'Alimentação', icon: '🍽️', color: '#10B981' },
  { name: 'Transporte', icon: '🚗', color: '#3B82F6' },
  { name: 'Moradia', icon: '🏠', color: '#8B5CF6' },
  { name: 'Saúde', icon: '⚕️', color: '#EF4444' },
  { name: 'Educação', icon: '📚', color: '#F59E0B' },
  { name: 'Entretenimento', icon: '🎬', color: '#EC4899' },
  { name: 'Compras', icon: '🛍️', color: '#6366F1' },
  { name: 'Trabalho', icon: '💼', color: '#059669' },
  { name: 'Investimentos', icon: '📈', color: '#DC2626' },
  { name: 'Outros', icon: '📋', color: '#6B7280' }
]

async function main() {
  console.log('Seeding default categories...')

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category
    })
    console.log(`Created/updated category: ${category.name}`)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })