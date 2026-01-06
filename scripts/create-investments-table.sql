-- Script SQL para criar a tabela investments no banco de dados de produção
-- Execute este script no banco de dados PostgreSQL de produção

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

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS "investments_userId_idx" ON "investments"("userId");

-- Adicionar foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'investments_userId_fkey'
    ) THEN
        ALTER TABLE "investments" 
        ADD CONSTRAINT "investments_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

