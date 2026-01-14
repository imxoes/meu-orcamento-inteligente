'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Crown, DollarSign, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface UserData {
  name?: string
  email?: string
  trialEndsAt?: string
  daysRemaining?: number
}

export default function UpgradeRequiredPage() {
  const [userData, setUserData] = useState<UserData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserData(data.user)
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-black pointer-events-none"></div>

      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Ícone de alerta */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-8"
          >
            <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/40">
              <AlertCircle className="w-12 h-12 text-red-400" />
            </div>
          </motion.div>

          {/* Título */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Trial Expirado
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-zinc-300 mb-8 max-w-2xl mx-auto"
          >
            Olá {userData.name || 'usuário'}! Seu período de teste gratuito de 7 dias chegou ao fim.
            Para continuar usando o <strong>Meu Orçamento Inteligente</strong>, escolha um de nossos planos.
          </motion.p>

          {/* Planos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
            {/* Plano Básico */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/40 backdrop-blur-md border border-blue-500/20 rounded-lg p-8 hover:border-blue-500/40 transition-colors"
            >
              <div className="mb-6">
                <DollarSign className="w-12 h-12 text-blue-400 mb-4 mx-auto" />
                <h3 className="text-2xl font-bold text-blue-400 mb-2">Plano Básico</h3>
                <div className="text-3xl font-bold text-white mb-2">
                  R$ 4,99
                  <span className="text-sm font-normal text-zinc-400">/mês</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-zinc-300">Controle completo de gastos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-zinc-300">Metas financeiras</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-zinc-300">Relatórios mensais</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-zinc-300">Suporte por email</span>
                </li>
              </ul>

              <Link
                href="/dashboard/subscription"
                className="block w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
              >
                Escolher Básico
              </Link>
            </motion.div>

            {/* Plano Premium */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/40 backdrop-blur-md border border-purple-500/20 rounded-lg p-8 hover:border-purple-500/40 transition-colors relative overflow-hidden"
            >
              {/* Badge de Popular */}
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold py-1 px-4 rounded-full rotate-12">
                POPULAR
              </div>

              <div className="mb-6">
                <Crown className="w-12 h-12 text-purple-400 mb-4 mx-auto" />
                <h3 className="text-2xl font-bold text-purple-400 mb-2">Plano Premium</h3>
                <div className="text-3xl font-bold text-white mb-2">
                  R$ 8,99
                  <span className="text-sm font-normal text-zinc-400">/mês</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-zinc-300">Tudo do plano Básico</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-zinc-300">IA para análises financeiras</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-zinc-300">Bot Telegram/WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-zinc-300">Relatórios avançados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-zinc-300">Suporte prioritário</span>
                </li>
              </ul>

              <Link
                href="/dashboard/subscription"
                className="block w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg font-semibold transition-all"
              >
                Escolher Premium
              </Link>
            </motion.div>
          </div>

          {/* Informações adicionais */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 max-w-2xl mx-auto"
          >
            <Clock className="w-8 h-8 text-orange-400 mb-4 mx-auto" />
            <h4 className="text-lg font-semibold text-white mb-2">Não perca seus dados!</h4>
            <p className="text-zinc-400 mb-4">
              Todos os seus dados estão salvos e serão restaurados assim que você escolher um plano.
            </p>
            <p className="text-sm text-zinc-500">
              ✅ Garantia de 7 dias • ❌ Cancele quando quiser • 🔒 Dados seguros
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <p className="text-zinc-500 text-sm">
              Precisa de ajuda? Entre em contato conosco: suporte@meuorcamentointeligente.com
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}