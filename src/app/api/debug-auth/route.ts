import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    // Extrair token do cookie
    const cookies = request.headers.get('cookie')
    let token: string | null = null

    console.log('Cookies:', cookies)

    if (cookies) {
      // Procurar diferentes tipos de cookie
      const tokenMatch = cookies.match(/token=([^;]+)/)
      const nextAuthMatch = cookies.match(/next-auth\.session-token=([^;]+)/)
      const sessionMatch = cookies.match(/__Secure-next-auth\.session-token=([^;]+)/)

      if (tokenMatch) {
        token = tokenMatch[1]
        console.log('Found token cookie')
      } else if (nextAuthMatch) {
        token = nextAuthMatch[1]
        console.log('Found next-auth session token')
      } else if (sessionMatch) {
        token = sessionMatch[1]
        console.log('Found secure next-auth session token')
      }
    }

    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    console.log('Token found:', !!token)
    console.log('Token value:', token)

    if (!token) {
      return NextResponse.json({
        error: 'Token não encontrado',
        cookies: cookies,
        headers: Object.fromEntries(request.headers.entries())
      })
    }

    // Tentar decodificar sem verificar primeiro para debug
    let decodedWithoutVerify: any = null
    try {
      decodedWithoutVerify = jwt.decode(token)
      console.log('Decoded without verify:', decodedWithoutVerify)
    } catch (e) {
      console.log('Failed to decode token:', e)
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    console.log('Decoded token:', decoded)

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true, isActive: true, isBlocked: true }
    })

    console.log('User from DB:', user)

    return NextResponse.json({
      success: true,
      token: !!token,
      decoded,
      user,
      isAdmin: user?.role === 'ADMIN'
    })

  } catch (error: any) {
    console.error('Debug auth error:', error)
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    })
  }
}