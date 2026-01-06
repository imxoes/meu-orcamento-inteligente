'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  X,
  Crown,
  Zap,
  Sparkles,
  ArrowRight,
  Calendar,
  CreditCard,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

interface SubscriptionData {
  status: string
  plan: string
  daysRemaining: number
  message: string
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  recentPayments: any[]
}

const plans = [
  {
    id: 'BASIC',
    name: 'Básico',
    price: '4,99',
    period: 'mês',
    description: 'Funcionalidades essenciais para gerenciar suas finanças',
    features: [
      'Transações ilimitadas',
      'Metas e objetivos',
      'Dashboard completo',
      'Análises básicas',
      'Exportação de dados',
      'Bot Telegram/WhatsApp',
      'Histórico completo'
    ],
    notIncluded: [
      'IA Insights',
      'Relatórios IA',
      'Dicas Inteligentes'
    ],
    color: 'blue',
    icon: Zap
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    price: '8,99',
    period: 'mês',
    description: 'Acesso completo com inteligência artificial',
    features: [
      'Tudo do plano Básico',
      'IA Insights avançados',
      'Relatórios gerados por IA',
      'Dicas Inteligentes personalizadas',
      'Categorização automática com IA',
      'Alertas avançados',
      'Suporte prioritário'
    ],
    notIncluded: [],
    color: 'purple',
    icon: Crown,
    popular: true
  }
]

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status')
      const data = await response.json()
      if (response.ok) {
        setSubscription(data.subscription)
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async (plan: 'BASIC' | 'PREMIUM') => {
    setProcessing(plan)
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })
      const data = await response.json()
      
      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Erro ao criar checkout')
        setProcessing(null)
      }
    } catch (error) {
      console.error('Erro ao criar checkout:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  const currentPlan = subscription?.plan || 'FREE'
  const isTrial = subscription?.status === 'TRIAL'
  const isActive = subscription?.status === 'ACTIVE'

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Assinatura
          </h1>
          <p className="text-zinc-400">
            Escolha o plano ideal para suas necessidades
          </p>
        </motion.div>

        {/* Status Card */}
        {subscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Status Atual
                </h3>
                <p className="text-zinc-300">{subscription.message}</p>
                {isTrial && subscription.daysRemaining > 0 && (
                  <p className="text-sm text-zinc-400 mt-1">
                    {subscription.daysRemaining} {subscription.daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
                  </p>
                )}
              </div>
              {isActive && subscription.currentPeriodEnd && (
                <div className="text-right">
                  <p className="text-sm text-zinc-400">Próxima cobrança</p>
                  <p className="text-white font-semibold">
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = currentPlan === plan.id && isActive
            const isUpgrade = currentPlan === 'FREE' || (currentPlan === 'BASIC' && plan.id === 'PREMIUM')
            const isDowngrade = currentPlan === 'PREMIUM' && plan.id === 'BASIC'
            const showButton = isUpgrade || isDowngrade

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: plan.id === 'BASIC' ? 0.1 : 0.2 }}
                className={`relative p-8 bg-zinc-800/50 border-2 rounded-xl ${
                  plan.popular
                    ? 'border-purple-500/50 shadow-lg shadow-purple-500/20'
                    : 'border-zinc-700/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-semibold rounded-full">
                    Mais Popular
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-green-500/20 border border-green-500/50 text-green-400 text-sm font-semibold rounded-full flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Plano Atual
                  </div>
                )}

                <div className="mb-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r from-${plan.color}-500/20 to-${plan.color}-600/20 flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 text-${plan.color}-400`} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-zinc-400 mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">R$ {plan.price}</span>
                    <span className="text-zinc-400">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                  {plan.notIncluded.length > 0 && (
                    <>
                      {plan.notIncluded.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <X className="w-5 h-5 text-zinc-600 flex-shrink-0 mt-0.5" />
                          <span className="text-zinc-500 line-through">{feature}</span>
                        </li>
                      ))}
                    </>
                  )}
                </ul>

                {showButton && (
                  <button
                    onClick={() => handleCheckout(plan.id as 'BASIC' | 'PREMIUM')}
                    disabled={processing === plan.id}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
                        : 'bg-zinc-700 hover:bg-zinc-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                  >
                    {processing === plan.id ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        {isUpgrade ? 'Assinar Agora' : 'Fazer Downgrade'}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}

                {isCurrentPlan && (
                  <div className="mt-4 p-4 bg-zinc-700/30 rounded-lg">
                    <p className="text-sm text-zinc-400 text-center">
                      Você está usando este plano
                    </p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Trial Info */}
        {isTrial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl mb-8"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Período de Teste Grátis
                </h3>
                <p className="text-zinc-300 mb-2">
                  Você está aproveitando {subscription.daysRemaining} {subscription.daysRemaining === 1 ? 'dia' : 'dias'} restantes do seu período de teste.
                  Durante o trial, você tem acesso às funcionalidades básicas.
                </p>
                <p className="text-zinc-400 text-sm">
                  Para acessar funcionalidades Premium (IA Insights, Relatórios IA, Dicas Inteligentes), faça upgrade para o plano Premium.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payment History */}
        {subscription?.recentPayments && subscription.recentPayments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-zinc-800/50 border border-zinc-700/50 rounded-xl"
          >
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Histórico de Pagamentos
            </h3>
            <div className="space-y-3">
              {subscription.recentPayments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-zinc-700/30 rounded-lg"
                >
                  <div>
                    <p className="text-white font-semibold">
                      {payment.description || 'Pagamento de assinatura'}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {payment.paidAt
                        ? new Date(payment.paidAt).toLocaleDateString('pt-BR')
                        : new Date(payment.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">
                      R$ {payment.amount.toFixed(2).replace('.', ',')}
                    </p>
                    <p className={`text-sm ${
                      payment.status === 'PAID' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {payment.status === 'PAID' ? 'Pago' : payment.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}



