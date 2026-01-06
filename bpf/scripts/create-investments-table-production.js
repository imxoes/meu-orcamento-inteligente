/**
 * Script para criar a tabela investments no banco de produção
 * Execute: node scripts/create-investments-table-production.js
 */

const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Verificando conexão com banco de dados...')
    
    // Testar conexão
    await prisma.$connect()
    console.log('✅ Conectado ao banco de dados')
    
    // Tentar criar a tabela usando SQL raw
    console.log('🔨 Criando tabela investments...')
    
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "investments" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "currentAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "userId" TEXT NOT NULL,
        CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
      );
    `)
    
    console.log('✅ Tabela investments criada')
    
    // Criar índice
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "investments_userId_idx" ON "investments"("userId");
    `)
    
    console.log('✅ Índice criado')
    
    // Adicionar foreign key (pode falhar se já existir, mas não é problema)
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "investments" 
        ADD CONSTRAINT "investments_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `)
      console.log('✅ Foreign key criada')
    } catch (error) {
      if (error.message?.includes('already exists') || error.code === '42710') {
        console.log('ℹ️  Foreign key já existe, continuando...')
      } else {
        throw error
      }
    }
    
    // Verificar se funcionou
    const count = await prisma.investment.count()
    console.log(`✅ Tabela investments está funcionando! Total de registros: ${count}`)
    
    console.log('\n🎉 Tabela investments criada com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.error('\n💡 Dica: Certifique-se de que a DATABASE_URL está configurada corretamente')
    console.error('   Para produção, execute: npx vercel env pull .env.production')
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

