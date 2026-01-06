/**
 * Script para garantir que a tabela investments existe no banco de dados
 * Execute: node scripts/fix-investments-table.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Verificando tabela investments...')
    
    // Tentar buscar investimentos
    const count = await prisma.investment.count()
    console.log(`✅ Tabela investments existe! Total de registros: ${count}`)
    
  } catch (error) {
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      console.log('❌ Tabela investments não existe. Execute: npx prisma db push')
      process.exit(1)
    } else {
      console.error('❌ Erro:', error)
      process.exit(1)
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()

