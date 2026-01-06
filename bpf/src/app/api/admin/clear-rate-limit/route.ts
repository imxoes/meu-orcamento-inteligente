/**
 * API para limpar rate limits (apenas admin ou para desenvolvimento)
 */

import { NextRequest, NextResponse } from 'next/server'
import { clearRateLimit, clearAllRateLimits } from '@/lib/auth-utils'
import { getUserIdFromToken } from '@/lib/auth-utils'
import { requireAdmin } from '@/lib/admin-utils'

export async function POST(request: NextRequest) {
  try {
    // Em desenvolvimento, permitir sem autenticação
    if (process.env.NODE_ENV === 'development') {
      const body = await request.json()
      const { ip, all } = body

      if (all) {
        clearAllRateLimits()
        return NextResponse.json({ 
          success: true, 
          message: 'Todos os rate limits foram limpos' 
        })
      }

      if (ip) {
        clearRateLimit(`signup:${ip}`)
        clearRateLimit(`login:${ip}`)
        return NextResponse.json({ 
          success: true, 
          message: `Rate limits para IP ${ip} foram limpos` 
        })
      }

      return NextResponse.json({ 
        success: false, 
        error: 'Forneça "ip" ou "all" no body' 
      }, { status: 400 })
    }

    // Em produção, requerer autenticação admin
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await requireAdmin(userId)

    const body = await request.json()
    const { ip, all } = body

    if (all) {
      clearAllRateLimits()
      return NextResponse.json({ 
        success: true, 
        message: 'Todos os rate limits foram limpos' 
      })
    }

    if (ip) {
      clearRateLimit(`signup:${ip}`)
      clearRateLimit(`login:${ip}`)
      return NextResponse.json({ 
        success: true, 
        message: `Rate limits para IP ${ip} foram limpos` 
      })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Forneça "ip" ou "all" no body' 
    }, { status: 400 })

  } catch (error: any) {
    console.error('❌ Erro ao limpar rate limit:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao limpar rate limit' },
      { status: 500 }
    )
  }
}



