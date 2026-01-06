/**
 * Webhook do Stripe para processar eventos de assinatura
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Desabilitar body parsing padrão do Next.js para webhooks
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET não configurado')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('❌ Erro ao verificar webhook:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    const stripe = getStripe()
    
    // Processar eventos
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          const userId = session.metadata?.userId || subscription.metadata?.userId
          const plan = session.metadata?.plan || subscription.metadata?.plan || 'BASIC'
          
          if (userId) {
            await handleSubscriptionCreated(userId, subscription, plan)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        
        if (userId) {
          await handleSubscriptionUpdated(userId, subscription)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        
        if (userId) {
          await handleSubscriptionDeleted(userId)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        
        if (subscriptionId) {
          const stripe = getStripe()
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.userId
          
          if (userId && invoice.amount_paid) {
            await handlePaymentSucceeded(userId, invoice, subscription)
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = invoice.subscription as string
        
        if (subscriptionId) {
          const stripe = getStripe()
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          const userId = subscription.metadata?.userId
          
          if (userId) {
            await handlePaymentFailed(userId, invoice)
          }
        }
        break
      }

      default:
        console.log(`⚠️ Evento não tratado: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Handlers de eventos

async function handleSubscriptionCreated(
  userId: string,
  subscription: Stripe.Subscription,
  plan: string
) {
  const planUpper = plan.toUpperCase() as 'BASIC' | 'PREMIUM'
  
  // Criar ou atualizar subscription no banco
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      status: subscription.status === 'active' ? 'ACTIVE' : 'TRIAL',
      plan: planUpper,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      gatewaySubscriptionId: subscription.id,
      gateway: 'STRIPE',
    },
    update: {
      status: subscription.status === 'active' ? 'ACTIVE' : 'TRIAL',
      plan: planUpper,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      gatewaySubscriptionId: subscription.id,
    },
  })

  // Atualizar usuário
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'ACTIVE',
      subscriptionPlan: planUpper,
      subscriptionId: subscription.customer as string,
    },
  })

  console.log(`✅ Assinatura criada para usuário ${userId}: ${planUpper}`)
}

async function handleSubscriptionUpdated(
  userId: string,
  subscription: Stripe.Subscription
) {
  const plan = (subscription.metadata?.plan || 'BASIC').toUpperCase() as 'BASIC' | 'PREMIUM'
  
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: subscription.status === 'active' ? 'ACTIVE' : 'EXPIRED',
      plan,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  })

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' : 'EXPIRED',
      subscriptionPlan: plan,
    },
  })

  console.log(`✅ Assinatura atualizada para usuário ${userId}`)
}

async function handleSubscriptionDeleted(userId: string) {
  await prisma.subscription.update({
    where: { userId },
    data: {
      status: 'CANCELLED',
      cancelAtPeriodEnd: false,
    },
  })

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'CANCELLED',
    },
  })

  console.log(`✅ Assinatura cancelada para usuário ${userId}`)
}

async function handlePaymentSucceeded(
  userId: string,
  invoice: Stripe.Invoice,
  subscription: Stripe.Subscription
) {
  const subscriptionRecord = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (subscriptionRecord && invoice.amount_paid) {
    // Converter de centavos para reais
    const amount = invoice.amount_paid / 100

    await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscriptionRecord.id,
        amount,
        currency: invoice.currency.toUpperCase(),
        status: 'PAID',
        gateway: 'STRIPE',
        gatewayPaymentId: invoice.id,
        method: invoice.payment_method_types?.[0]?.toUpperCase() || 'CREDIT_CARD',
        description: `Pagamento ${subscription.metadata?.plan || 'BASIC'}`,
        paidAt: new Date(invoice.created * 1000),
      },
    })

    console.log(`✅ Pagamento registrado para usuário ${userId}: R$ ${amount}`)
  }
}

async function handlePaymentFailed(userId: string, invoice: Stripe.Invoice) {
  console.log(`⚠️ Pagamento falhou para usuário ${userId}, invoice: ${invoice.id}`)
  
  // Aqui você pode enviar notificação por email/bot
  // TODO: Implementar notificação de falha de pagamento
}

