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
      const tokenMatch = cookies.match(/token=([^;]+)/)
      if (tokenMatch) {
        token = tokenMatch[1]
      }
    }

    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    console.log('Token found:', !!token)

    if (!token) {
      return NextResponse.json({
        error: 'Token não encontrado',
        cookies: cookies,
        headers: Object.fromEntries(request.headers.entries())
      })
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