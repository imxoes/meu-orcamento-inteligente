import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

// Função para verificar se o usuário é admin usando o token normal do sistema
export async function verifyDashboardAdminAuth(request: Request): Promise<AdminUser | null> {
  try {
    // Extrair token do cookie normal do sistema
    const cookies = request.headers.get('cookie')
    let token: string | null = null

    if (cookies) {
      // Tentar token normal primeiro
      const tokenMatch = cookies.match(/token=([^;]+)/)
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

    // Buscar usuário no banco e verificar se é admin
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        role: 'ADMIN', // Verificar se é admin
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
    console.error('Erro na verificação de auth admin no dashboard:', error)
    return null
  }
}

export async function requireDashboardAdminAuth(request: Request): Promise<AdminUser> {
  const user = await verifyDashboardAdminAuth(request)

  if (!user) {
    throw new Error('Acesso negado: permissões de admin requeridas')
  }

  return user
}

// Função para verificar se um usuário é admin pelo ID (para uso nas páginas)
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        role: 'ADMIN',
        isActive: true,
        isBlocked: false
      },
      select: {
        id: true
      }
    })

    return !!user
  } catch (error) {
    console.error('Erro ao verificar se usuário é admin:', error)
    return false
  }
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