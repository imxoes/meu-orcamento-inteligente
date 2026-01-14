import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/middleware/auth'
import { prisma } from '@/lib/prisma'
import { isTrialActive, hasBasicAccess } from '@/lib/subscription-utils'

/**
 * Middleware para verificar se o usuário tem acesso baseado no trial/assinatura
 */
export async function checkTrialAccess(request: NextRequest) {
  try {
    // Verificar autenticação primeiro
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Buscar usuário com dados de assinatura
    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        blockedReason: true,
        trialEndsAt: true,
        subscriptionStatus: true,
        subscriptionPlan: true
      }
    })

    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Se for admin, sempre permitir acesso
    if (user.role === 'ADMIN') {
      return NextResponse.next()
    }

    // Se usuário está bloqueado, redirecionar para página de bloqueio
    if (user.isBlocked) {
      const blockUrl = new URL('/blocked', request.url)
      blockUrl.searchParams.set('reason', user.blockedReason || 'Conta bloqueada')
      return NextResponse.redirect(blockUrl)
    }

    // Verificar se trial expirou e bloquear automaticamente
    if (user.subscriptionStatus === 'TRIAL' && user.trialEndsAt) {
      const now = new Date()
      const trialEnd = new Date(user.trialEndsAt)

      if (now > trialEnd) {
        // Trial expirou - bloquear usuário
        await prisma.user.update({
          where: { id: user.id },
          data: {
            isBlocked: true,
            blockedAt: now,
            blockedReason: 'Trial de 7 dias expirado. Faça upgrade para um plano pago para continuar usando.',
            subscriptionStatus: 'EXPIRED'
          }
        })

        // Redirecionar para página de upgrade
        return NextResponse.redirect(new URL('/upgrade-required', request.url))
      }
    }

    // Verificar se tem acesso básico
    if (!hasBasicAccess(user)) {
      return NextResponse.redirect(new URL('/upgrade-required', request.url))
    }

    // Usuário tem acesso - prosseguir
    return NextResponse.next()

  } catch (error) {
    console.error('Erro ao verificar acesso do trial:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

/**
 * Middleware mais simples que apenas verifica se o usuário está bloqueado
 */
export async function checkUserBlocked(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.authenticated || !authResult.userId) {
      return NextResponse.next() // Deixa o middleware de auth lidar com isso
    }

    const user = await prisma.user.findUnique({
      where: { id: authResult.userId },
      select: {
        id: true,
        isBlocked: true,
        blockedReason: true,
        role: true
      }
    })

    // Se for admin, sempre permitir
    if (user?.role === 'ADMIN') {
      return NextResponse.next()
    }

    // Se usuário está bloqueado, redirecionar
    if (user?.isBlocked) {
      const blockUrl = new URL('/blocked', request.url)
      blockUrl.searchParams.set('reason', user.blockedReason || 'Conta bloqueada')
      return NextResponse.redirect(blockUrl)
    }

    return NextResponse.next()

  } catch (error) {
    console.error('Erro ao verificar se usuário está bloqueado:', error)
    return NextResponse.next()
  }
}