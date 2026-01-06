/**
 * API para criar sessão de checkout no Stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStripe, STRIPE_PRICE_IDS, getStripeUrls } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { getUserIdFromToken } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    
    // Verificar autenticação
    const userId = await getUserIdFromToken(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { plan } = body // 'BASIC' ou 'PREMIUM'

    if (!plan || !['BASIC', 'PREMIUM'].includes(plan)) {
      return NextResponse.json(
        { success: false, error: 'Plano inválido. Use BASIC ou PREMIUM' },
        { status: 400 }
      )
    }

    const priceId = STRIPE_PRICE_IDS[plan]
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: `Price ID não configurado para o plano ${plan}` },
        { status: 500 }
      )
    }

    // Criar ou buscar customer no Stripe
    let stripeCustomerId = user.subscriptionId // Pode ser o customer ID ou subscription ID

    // Se não tem customer ID, criar um novo
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user.id,
        },
      })
      stripeCustomerId = customer.id

      // Atualizar usuário com customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionId: customer.id }
      })
    }

    // URLs de retorno
    const { successUrl, cancelUrl } = getStripeUrls()

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
        plan: plan,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          plan: plan,
        },
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    })

  } catch (error: any) {
    console.error('❌ Erro ao criar checkout:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar sessão de checkout',
        debug: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

