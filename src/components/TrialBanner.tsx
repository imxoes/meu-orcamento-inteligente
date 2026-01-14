'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Crown, X, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { isTrialActive, getTrialDaysRemaining, isTrialExpiringSoon } from '@/lib/subscription-utils'

interface UserWithTrial {
  trialEndsAt: string | null
  subscriptionStatus: string
  subscriptionPlan: string | null
}

interface TrialBannerProps {
  user: UserWithTrial
}

export default function TrialBanner({ user }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [isExpiringSoon, setIsExpiringSoon] = useState(false)

  useEffect(() => {
    if (user.trialEndsAt) {
      const userWithTrial = {
        id: '',
        trialEndsAt: new Date(user.trialEndsAt),
        subscriptionStatus: user.subscriptionStatus,
        subscriptionPlan: user.subscriptionPlan
      }

      const remaining = getTrialDaysRemaining(userWithTrial)
      const expiringSoon = isTrialExpiringSoon(userWithTrial)

      setDaysRemaining(remaining)
      setIsExpiringSoon(expiringSoon)
    }
  }, [user])

  // Não mostrar se não está em trial ou se foi dispensado
  if (user.subscriptionStatus !== 'TRIAL' || !user.trialEndsAt || dismissed) {
    return null
  }

  // Não mostrar se trial já expirou
  if (daysRemaining <= 0) {
    return null
  }

  const bannerColor = isExpiringSoon
    ? 'from-red-500/20 to-orange-500/20 border-red-500/30'
    : 'from-blue-500/20 to-purple-500/20 border-blue-500/30'

  const iconColor = isExpiringSoon ? 'text-red-400' : 'text-blue-400'
  const textColor = isExpiringSoon ? 'text-red-300' : 'text-blue-300'

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -50, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -50, height: 0 }}
          transition={{ duration: 0.3 }}
          className={`bg-gradient-to-r ${bannerColor} border rounded-lg mb-6 overflow-hidden`}
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Ícone */}
              <div className={`p-2 rounded-full bg-black/20`}>
                {isExpiringSoon ? (
                  <AlertTriangle className={`w-6 h-6 ${iconColor}`} />
                ) : (
                  <Clock className={`w-6 h-6 ${iconColor}`} />
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1">
                <h3 className={`font-semibold ${textColor} mb-1`}>
                  {isExpiringSoon ? 'Trial Expirando!' : 'Trial Ativo'}
                </h3>
                <p className="text-white text-sm">
                  {daysRemaining === 1
                    ? 'Último dia do seu trial gratuito'
                    : `${daysRemaining} dias restantes no seu trial gratuito`
                  }
                  {isExpiringSoon && ' - Faça upgrade agora para não perder acesso!'}
                </p>
              </div>

              {/* Botão de ação */}
              <div className="flex items-center gap-3">
                <Link
                  href="/dashboard/subscription"
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    isExpiringSoon
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <Crown className="w-4 h-4 inline mr-2" />
                  {isExpiringSoon ? 'Fazer Upgrade Agora' : 'Ver Planos'}
                </Link>

                {/* Botão de fechar (apenas se não está expirando) */}
                {!isExpiringSoon && (
                  <button
                    onClick={() => setDismissed(true)}
                    className="p-2 text-zinc-400 hover:text-white transition-colors"
                    title="Dispensar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="h-1 bg-black/20">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: `${(daysRemaining / 7) * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full ${
                isExpiringSoon
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}