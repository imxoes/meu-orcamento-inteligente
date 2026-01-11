/**
 * Script para testar JWT generation e verification
 */

import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { generateJWT } from '../src/lib/auth-utils'
import { verifyJWTEdge } from '../src/lib/jwt-edge'

async function testJWT() {
  try {
    const userId = 'test-user-id'
    const sessionId = 'test-session-id'

    console.log('🔑 Gerando JWT...')
    const token = await generateJWT(userId, sessionId)
    console.log('✅ JWT gerado:', token.substring(0, 50) + '...')

    console.log('\n🔍 Verificando JWT com verifyJWTEdge...')
    const decoded = await verifyJWTEdge(token)
    console.log('✅ JWT verificado:', decoded)

    if (decoded?.userId === userId && decoded?.sessionId === sessionId) {
      console.log('\n✅ JWT funciona perfeitamente!')
    } else {
      console.log('\n❌ Problema com JWT!')
      console.log('Esperado:', { userId, sessionId })
      console.log('Recebido:', decoded)
    }

  } catch (error: any) {
    console.error('❌ Erro:', error.message)
  }
}

testJWT()