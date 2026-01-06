import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load .env file
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
} else {
  console.log('⚠️  Arquivo .env não encontrado')
}

console.log('\n🔍 Verificando configuração do .env\n')
console.log('=' .repeat(50))

// Variáveis obrigatórias
const requiredVars = {
  'DATABASE_URL': 'URL do banco de dados PostgreSQL',
  'NEXTAUTH_SECRET': 'Chave secreta para NextAuth',
  'JWT_SECRET': 'Chave secreta para JWT',
}

// Variáveis do Brevo
const brevoVars = {
  'BREVO_API_KEY': 'Chave API do Brevo (obrigatória para emails)',
  'BREVO_SENDER_EMAIL': 'Email remetente verificado no Brevo (opcional, padrão: noreply@useorbi.app)',
}

// Variáveis opcionais mas importantes
const optionalVars = {
  'NEXTAUTH_URL': 'URL base da aplicação',
  'TELEGRAM_BOT_TOKEN': 'Token do bot do Telegram',
  'OPENAI_API_KEY': 'Chave API do OpenAI (opcional)',
}

let hasErrors = false
let hasWarnings = false

// Verificar variáveis obrigatórias
console.log('\n📋 Variáveis Obrigatórias:\n')
for (const [key, description] of Object.entries(requiredVars)) {
  const value = process.env[key]
  if (value) {
    const masked = key.includes('SECRET') || key.includes('PASSWORD') || key.includes('KEY')
      ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
      : value.substring(0, 30) + (value.length > 30 ? '...' : '')
    console.log(`  ✅ ${key}`)
    console.log(`     ${description}`)
    console.log(`     Valor: ${masked}\n`)
  } else {
    console.log(`  ❌ ${key} - FALTANDO`)
    console.log(`     ${description}\n`)
    hasErrors = true
  }
}

// Verificar variáveis do Brevo
console.log('\n📧 Configuração do Brevo (Email):\n')
for (const [key, description] of Object.entries(brevoVars)) {
  const value = process.env[key]
  if (value) {
    const masked = key === 'BREVO_API_KEY'
      ? value.substring(0, 12) + '...' + value.substring(value.length - 4)
      : value
    console.log(`  ✅ ${key}`)
    console.log(`     ${description}`)
    console.log(`     Valor: ${masked}\n`)
  } else {
    if (key === 'BREVO_API_KEY') {
      console.log(`  ❌ ${key} - FALTANDO (obrigatória para emails)`)
      console.log(`     ${description}\n`)
      hasErrors = true
    } else {
      console.log(`  ⚠️  ${key} - Não configurada (opcional)`)
      console.log(`     ${description}`)
      console.log(`     Usará padrão: noreply@useorbi.app\n`)
      hasWarnings = true
    }
  }
}

// Verificar variáveis opcionais
console.log('\n🔧 Variáveis Opcionais:\n')
for (const [key, description] of Object.entries(optionalVars)) {
  const value = process.env[key]
  if (value) {
    const masked = key.includes('TOKEN') || key.includes('KEY')
      ? value.substring(0, 12) + '...' + value.substring(value.length - 4)
      : value
    console.log(`  ✅ ${key}`)
    console.log(`     ${description}`)
    console.log(`     Valor: ${masked}\n`)
  } else {
    console.log(`  ⚠️  ${key} - Não configurada`)
    console.log(`     ${description}\n`)
    hasWarnings = true
  }
}

// Resumo
console.log('=' .repeat(50))
console.log('\n📊 Resumo:\n')

if (!hasErrors && !hasWarnings) {
  console.log('  ✅ Todas as variáveis estão configuradas corretamente!')
} else if (!hasErrors) {
  console.log('  ✅ Variáveis obrigatórias configuradas')
  console.log('  ⚠️  Algumas variáveis opcionais estão faltando (mas não é crítico)')
} else {
  console.log('  ❌ Algumas variáveis obrigatórias estão faltando!')
  console.log('  ⚠️  Corrija antes de fazer deploy')
}

console.log('\n💡 Dica:')
console.log('   - BREVO_API_KEY: Obtenha em https://www.brevo.com/ → Settings → SMTP & API → API Keys')
console.log('   - BREVO_SENDER_EMAIL: Email verificado em Senders & IP no Brevo')
console.log('   - NEXTAUTH_URL: URL da aplicação (ex: https://useorbi.app ou http://localhost:7007)')
console.log('\n')

