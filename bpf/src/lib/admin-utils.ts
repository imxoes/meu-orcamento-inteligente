/**
 * Utilitários para verificação de permissões de administrador
 */

import { prisma } from '@/lib/prisma'

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    if (!user) return false
    // Check if role exists, default to 'USER' if not
    const role = (user as any).role || 'USER'
    return role === 'ADMIN'
  } catch {
    return false
  }
}

export async function requireAdmin(userId: string): Promise<void> {
  const admin = await isAdmin(userId)
  if (!admin) {
    throw new Error('Acesso negado. Apenas administradores podem acessar esta funcionalidade.')
  }
}

