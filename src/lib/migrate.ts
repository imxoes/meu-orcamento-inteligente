import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function ensureDatabase() {
  try {
    // Check if database exists by running a simple query
    await prisma.user.findFirst()
    console.log('✅ Database tables exist')
  } catch (error) {
    console.log('🔧 Creating database tables...')

    // If tables don't exist, create them
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "users" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT NOT NULL UNIQUE,
          "name" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "telegramId" TEXT UNIQUE,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "categories" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL UNIQUE,
          "icon" TEXT,
          "color" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "transactions" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "amount" DOUBLE PRECISION NOT NULL,
          "description" TEXT NOT NULL,
          "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "type" TEXT NOT NULL DEFAULT 'EXPENSE',
          "method" TEXT NOT NULL DEFAULT 'CASH',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "userId" TEXT NOT NULL,
          "categoryId" TEXT NOT NULL,
          CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "goals" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "targetAmount" DOUBLE PRECISION NOT NULL,
          "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "targetDate" TIMESTAMP(3),
          "status" TEXT NOT NULL DEFAULT 'ACTIVE',
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "userId" TEXT NOT NULL,
          CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `

      console.log('✅ Database tables created successfully')

      // Seed default categories
      await seedCategories()

    } catch (createError) {
      console.error('❌ Error creating tables:', createError)
    }
  }
}

async function seedCategories() {
  const categories = [
    { id: 'cat_alimentacao', name: 'Alimentação', icon: '🍔', color: '#FF6B6B' },
    { id: 'cat_transporte', name: 'Transporte', icon: '🚗', color: '#4ECDC4' },
    { id: 'cat_moradia', name: 'Moradia', icon: '🏠', color: '#45B7D1' },
    { id: 'cat_saude', name: 'Saúde', icon: '🏥', color: '#96CEB4' },
    { id: 'cat_educacao', name: 'Educação', icon: '📚', color: '#FFEAA7' },
    { id: 'cat_lazer', name: 'Lazer', icon: '🎮', color: '#DDA0DD' },
    { id: 'cat_compras', name: 'Compras', icon: '🛒', color: '#FDA7DF' },
    { id: 'cat_servicos', name: 'Serviços', icon: '⚙️', color: '#74B9FF' },
    { id: 'cat_outros', name: 'Outros', icon: '📦', color: '#A0A0A0' }
  ]

  for (const category of categories) {
    await prisma.$executeRaw`
      INSERT INTO "categories" ("id", "name", "icon", "color", "createdAt", "updatedAt")
      VALUES (${category.id}, ${category.name}, ${category.icon}, ${category.color}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("name") DO NOTHING
    `
  }

  console.log('✅ Default categories seeded')
}