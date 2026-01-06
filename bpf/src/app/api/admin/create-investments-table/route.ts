import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth-utils'

/**
 * API route temporária para criar a tabela investments
 * Acesse: /api/admin/create-investments-table
 * Remove este arquivo após criar a tabela
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const token = request.cookies.get('token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    console.log('🔨 Criando tabela investments...')

    // Criar tabela
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

    // Adicionar foreign key
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "investments" 
        ADD CONSTRAINT "investments_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `)
      console.log('✅ Foreign key criada')
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.code === '42710') {
        console.log('ℹ️  Foreign key já existe')
      } else {
        throw error
      }
    }

    // Verificar se funcionou
    const count = await prisma.investment.count()
    console.log(`✅ Tabela investments está funcionando! Total de registros: ${count}`)

    return NextResponse.json({
      success: true,
      message: 'Tabela investments criada com sucesso!',
      recordsCount: count
    })

  } catch (error: any) {
    console.error('❌ Erro ao criar tabela:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao criar tabela', 
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Para criar a tabela investments, faça uma requisição POST para este endpoint',
    instructions: 'Use: fetch("/api/admin/create-investments-table", { method: "POST", credentials: "include" })'
  })
}

