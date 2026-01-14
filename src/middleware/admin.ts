import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

export async function verifyAdminAuth(request: Request): Promise<AdminUser | null> {
  try {
    // Extrair token do cookie ou header
    const cookies = request.headers.get('cookie')
    let token: string | null = null

    if (cookies) {
      const tokenMatch = cookies.match(/admin-token=([^;]+)/)
      if (tokenMatch) {
        token = tokenMatch[1]
      }
    }

    // Tentar extrair do header Authorization como fallback
    if (!token) {
      const authHeader = request.headers.get('authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return null
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any

    if (decoded.role !== 'ADMIN' || decoded.type !== 'admin') {
      return null
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        role: 'ADMIN',
        isActive: true,
        isBlocked: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    })

    return user

  } catch (error) {
    console.error('Erro na verificação de auth admin:', error)
    return null
  }
}

export async function requireAdminAuth(request: Request): Promise<AdminUser> {
  const user = await verifyAdminAuth(request)

  if (!user) {
    throw new Error('Acesso negado: autenticação de admin requerida')
  }

  return user
}

export async function logAdminAction(
  adminId: string,
  action: string,
  description: string,
  userId?: string,
  metadata?: any,
  request?: Request
) {
  try {
    await prisma.adminLog.create({
      data: {
        adminId,
        userId,
        action,
        description,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        ipAddress: request ? (
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          ''
        ) : null,
        userAgent: request ? request.headers.get('user-agent') || '' : null
      }
    })
  } catch (error) {
    console.error('Erro ao criar log admin:', error)
  }
}