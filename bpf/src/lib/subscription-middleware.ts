/**
 * Middleware para controle de acesso baseado em assinatura
 */

import { prisma } from '@/lib/prisma'
import { hasBasicAccess, hasPremiumAccess, isTrialActive } from './subscription-utils'

/**
 * Verifica se o usuário tem acesso básico (trial ou assinatura básica/premium)
 * Lança erro se não tiver acesso
 */
export async function requireBasicAccess(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      trialEndsAt: true,
      subscriptionStatus: true,
      subscriptionPlan: true
    }
  })

  if (!user) {
    throw new Error('Usuário não encontrado')
  }

  if (!hasBasicAccess(user)) {
    throw new Error('Assinatura expirada. Faça upgrade para continuar usando o serviço.')
  }
}

/**
 * Verifica se o usuário tem acesso premium
 * Lança erro se não tiver acesso premium
 */
export async function requirePremiumAccess(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      trialEndsAt: true,
      subscriptionStatus: true,
      subscriptionPlan: true
    }
  })

  if (!user) {
    throw new Error('Usuário não encontrado')
  }

  if (!hasPremiumAccess(user)) {
    // Verificar se está em trial para mensagem diferente
    if (isTrialActive(user)) {
      throw new Error('Funcionalidade Premium. Faça upgrade para R$ 8,99/mês para acessar.')
    }
    
    // Verificar se tem plano básico
    if (user.subscriptionPlan === 'BASIC' && user.subscriptionStatus === 'ACTIVE') {
      throw new Error('Funcionalidade Premium. Faça upgrade de R$ 4,99 para R$ 8,99/mês para acessar.')
    }
    
    throw new Error('Funcionalidade Premium. Faça upgrade para R$ 8,99/mês para acessar.')
  }
}

/**
 * Retorna informações sobre o acesso do usuário
 */
export async function getUserAccessInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      trialEndsAt: true,
      subscriptionStatus: true,
      subscriptionPlan: true
    }
  })

  if (!user) {
    return null
  }

  return {
    hasBasicAccess: hasBasicAccess(user),
    hasPremiumAccess: hasPremiumAccess(user),
    isTrial: isTrialActive(user),
    plan: user.subscriptionPlan || 'FREE',
    status: user.subscriptionStatus
  }
}



