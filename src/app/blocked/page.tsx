'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, AlertCircle, Mail, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function BlockedPage() {
  const [reason, setReason] = useState<string>('')
  const searchParams = useSearchParams()

  useEffect(() => {
    const blockReason = searchParams?.get('reason') || 'Sua conta foi temporariamente suspensa.'
    setReason(blockReason)
  }, [searchParams])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      window.location.href = '/'
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-black pointer-events-none"></div>

      <div className="relative z-10 max-w-2xl mx-auto p-8 text-center">
        {/* Ícone de bloqueio */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-red-500/20 rounded-full flex items-center justify-center border-2 border-red-500/40">
            <Shield className="w-12 h-12 text-red-400" />
          </div>
        </motion.div>

        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold mb-6"
        >
          <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Conta Suspensa
          </span>
        </motion.h1>

        {/* Mensagem de bloqueio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-8"
        >
          <AlertCircle className="w-8 h-8 text-red-400 mb-4 mx-auto" />
          <p className="text-lg text-red-300 mb-2 font-semibold">
            Acesso Negado
          </p>
          <p className="text-zinc-300">
            {reason}
          </p>
        </motion.div>

        {/* Opções de contato */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-8"
        >
          <h3 className="text-xl font-semibold text-white mb-4">
            Como resolver?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Opção 1: Upgrade se for trial expirado */}
            {reason.includes('Trial') && (
              <div className="bg-black/40 backdrop-blur-md border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Fazer Upgrade</h4>
                <p className="text-sm text-zinc-400 mb-3">
                  Escolha um plano pago para continuar usando
                </p>
                <Link
                  href="/dashboard/subscription"
                  className="inline-block w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-semibold transition-colors"
                >
                  Ver Planos
                </Link>
              </div>
            )}

            {/* Opção 2: Contato por email */}
            <div className="bg-black/40 backdrop-blur-md border border-green-500/20 rounded-lg p-4">
              <Mail className="w-6 h-6 text-green-400 mb-2 mx-auto" />
              <h4 className="font-semibold text-green-400 mb-2">Suporte por Email</h4>
              <p className="text-sm text-zinc-400 mb-3">
                Entre em contato para esclarecimentos
              </p>
              <a
                href="mailto:suporte@meuorcamentointeligente.com?subject=Conta Suspensa - Solicitação de Revisão"
                className="inline-block w-full py-2 px-4 bg-green-500 hover:bg-green-600 rounded-lg text-sm font-semibold transition-colors"
              >
                Enviar Email
              </a>
            </div>
          </div>
        </motion.div>

        {/* Informações importantes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 mb-8"
        >
          <h4 className="text-lg font-semibold text-white mb-3">
            Informações Importantes
          </h4>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>• Seus dados estão seguros e não foram perdidos</p>
            <p>• O acesso será restaurado após a resolução do problema</p>
            <p>• Para questões urgentes, utilize o suporte por email</p>
          </div>
        </motion.div>

        {/* Botão de logout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={handleLogout}
            className="text-zinc-400 hover:text-white transition-colors text-sm underline"
          >
            Sair da conta
          </button>
        </motion.div>
      </div>
    </div>
  )
}