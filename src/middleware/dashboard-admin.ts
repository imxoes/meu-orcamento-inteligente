import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: string
}

// Função para verificar se o usuário é admin usando NextAuth
export async function verifyDashboardAdminAuth(request: Request): Promise<AdminUser | null> {
  try {
    // Usar NextAuth para verificar o token
    const token = await getToken({
      req: request as any,
      secret: process.env.NEXTAUTH_SECRET
    })

    if (!token?.id) {
      return null
    }

    // Buscar usuário no banco e verificar se é admin
    const user = await prisma.user.findUnique({
      where: {
        id: token.id as string,
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