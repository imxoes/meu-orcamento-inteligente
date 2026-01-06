/**
 * Configuração do Stripe
 */

import Stripe from 'stripe'

// IDs dos planos (serão configurados após criar os produtos no Stripe)
// Compatível com nomes das variáveis no Vercel: STRIPE_BASIC_PRICE_ID e STRIPE_PREMIUM_PRICE_ID
export const STRIPE_PRICE_IDS = {
  BASIC: process.env.STRIPE_BASIC_PRICE_ID || process.env.STRIPE_PRICE_BASIC_ID || '', // R$ 4,99/mês
  PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID || process.env.STRIPE_PRICE_PREMIUM_ID || '', // R$ 8,99/mês
} as const

// URLs do sistema
export const getStripeUrls = () => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000'
  
  return {
    successUrl: `${baseUrl}/dashboard/subscription?success=true`,
    cancelUrl: `${baseUrl}/dashboard/subscription?canceled=true`,
  }
}

// Função para obter instância do Stripe (lazy initialization)
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY não está definida nas variáveis de ambiente')
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  }
  return stripeInstance
}
