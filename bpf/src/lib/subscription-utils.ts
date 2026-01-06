/**
 * Utilitários para gerenciamento de assinaturas e controle de acesso
 */

export const TRIAL_DAYS = 7 // Período de teste gratuito

export type SubscriptionPlan = 'FREE' | 'BASIC' | 'PREMIUM'
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface UserWithSubscription {
  id: string
  trialEndsAt: Date | null
  subscriptionStatus: string
  subscriptionPlan: string | null
}

/**
 * Calcula a data de fim do período de trial (7 dias a partir de hoje)
 */
export function calculateTrialEndDate(): Date {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + TRIAL_DAYS)
  endDate.setHours(23, 59, 59, 999) // Fim do dia
  return endDate
}

/**
 * Verifica se o usuário está no período de trial ativo
 */
export function isTrialActive(user: UserWithSubscription): boolean {
  if (!user.trialEndsAt) return false
  const now = new Date()
  const trialEnd = new Date(user.trialEndsAt)
  return now < trialEnd
}

/**
 * Verifica se o usuário tem acesso básico (trial ativo OU assinatura básica/premium ativa)
 */
export function hasBasicAccess(user: UserWithSubscription): boolean {
  // Se está em trial, tem acesso básico
  if (isTrialActive(user)) return true
  
  // Se tem assinatura ativa (básica ou premium), tem acesso
  if (user.subscriptionStatus === 'ACTIVE') {
    return ['BASIC', 'PREMIUM'].includes(user.subscriptionPlan || '')
  }
  
  return false
}

/**
 * Verifica se o usuário tem acesso premium (apenas assinatura premium ativa)
 */
export function hasPremiumAccess(user: UserWithSubscription): boolean {
  return (
    user.subscriptionPlan === 'PREMIUM' &&
    user.subscriptionStatus === 'ACTIVE'
  )
}

/**
 * Retorna o status atual da assinatura do usuário
 */
export function getSubscriptionStatus(user: UserWithSubscription): SubscriptionStatus {
  if (isTrialActive(user)) return 'TRIAL'
  if (user.subscriptionStatus === 'ACTIVE') return 'ACTIVE'
  if (user.subscriptionStatus === 'CANCELLED') return 'CANCELLED'
  return 'EXPIRED'
}

/**
 * Retorna o plano atual do usuário
 */
export function getCurrentPlan(user: UserWithSubscription): SubscriptionPlan {
  if (isTrialActive(user)) return 'FREE'
  return (user.subscriptionPlan as SubscriptionPlan) || 'FREE'
}

/**
 * Retorna quantos dias restam do trial
 */
export function getTrialDaysRemaining(user: UserWithSubscription): number {
  if (!user.trialEndsAt) return 0
  if (!isTrialActive(user)) return 0
  
  const now = new Date()
  const trialEnd = new Date(user.trialEndsAt)
  const diffTime = trialEnd.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(0, diffDays)
}

/**
 * Verifica se o trial está próximo de expirar (3 dias ou menos)
 */
export function isTrialExpiringSoon(user: UserWithSubscription): boolean {
  const daysRemaining = getTrialDaysRemaining(user)
  return daysRemaining > 0 && daysRemaining <= 3
}

/**
 * Retorna uma mensagem descritiva do status da assinatura
 */
export function getSubscriptionMessage(user: UserWithSubscription): string {
  if (isTrialActive(user)) {
    const days = getTrialDaysRemaining(user)
    return `Teste grátis - ${days} ${days === 1 ? 'dia restante' : 'dias restantes'}`
  }
  
  if (user.subscriptionStatus === 'ACTIVE') {
    const plan = user.subscriptionPlan || 'FREE'
    if (plan === 'BASIC') return 'Plano Básico - R$ 4,99/mês'
    if (plan === 'PREMIUM') return 'Plano Premium - R$ 8,99/mês'
  }
  
  if (user.subscriptionStatus === 'EXPIRED') {
    return 'Assinatura expirada - Faça upgrade para continuar'
  }
  
  if (user.subscriptionStatus === 'CANCELLED') {
    return 'Assinatura cancelada'
  }
  
  return 'Sem assinatura ativa'
}



