/**
 * Script para limpar rate limits de teste
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { clearAllRateLimits } from '../src/lib/auth-utils'

console.log('🧹 Limpando todos os rate limits...')
clearAllRateLimits()
console.log('✅ Rate limits limpos!')