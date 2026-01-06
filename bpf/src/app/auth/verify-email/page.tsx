'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Mail, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams?.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Token de verificação não encontrado na URL')
        return
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
        })

        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage(data.message)
          setUserEmail(data.user?.email || '')
        } else {
          setStatus('error')
          setMessage(data.error || 'Erro ao verificar email')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('Erro interno do servidor')
      }
    }

    verifyEmail()
  }, [token])

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-blue-400 animate-spin" />
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-400" />
      case 'error':
        return <XCircle className="h-16 w-16 text-red-400" />
      default:
        return <Mail className="h-16 w-16 text-zinc-400" />
    }
  }

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verificando email...'
      case 'success':
        return 'Email verificado com sucesso!'
      case 'error':
        return 'Erro na verificação'
      default:
        return 'Verificação de email'
    }
  }

  const getDescription = () => {
    switch (status) {
      case 'loading':
        return 'Por favor, aguarde enquanto verificamos seu email.'
      case 'success':
        return 'Sua conta foi ativada com sucesso. Agora você pode fazer login e começar a usar o Meu Orçamento Inteligente.'
      case 'error':
        return 'Não foi possível verificar seu email. O link pode ter expirado ou ser inválido.'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/10 to-black pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md w-full"
      >
        <div className="bg-gradient-to-br from-zinc-900/80 to-black/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8 shadow-2xl text-center">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Meu Orçamento Inteligente
            </h1>
            <p className="text-zinc-400">Verificação de Email</p>
          </div>

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex justify-center mb-6"
          >
            {getIcon()}
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8"
          >
            <h2 className={`text-2xl font-bold mb-4 ${
              status === 'success' ? 'text-green-400' :
              status === 'error' ? 'text-red-400' : 'text-blue-400'
            }`}>
              {getTitle()}
            </h2>

            <p className="text-zinc-300 mb-4">
              {getDescription()}
            </p>

            {message && (
              <div className={`p-4 rounded-lg mb-4 ${
                status === 'success'
                  ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                  : status === 'error'
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
              }`}>
                <p className="text-sm">{message}</p>
              </div>
            )}

            {userEmail && status === 'success' && (
              <div className="bg-zinc-800/50 rounded-lg p-4 mb-4">
                <p className="text-sm text-zinc-400">
                  Conta verificada para:
                </p>
                <p className="text-blue-400 font-medium">{userEmail}</p>
              </div>
            )}
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="space-y-4"
          >
            {status === 'success' && (
              <Link
                href="/auth/login"
                className="block w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Fazer Login
              </Link>
            )}

            {status === 'error' && (
              <div className="space-y-3">
                <Link
                  href="/auth/signup"
                  className="block w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Criar Nova Conta
                </Link>
                <Link
                  href="/auth/login"
                  className="block w-full py-3 px-4 border border-zinc-700 hover:border-purple-500 text-zinc-300 hover:text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Tentar Fazer Login
                </Link>
              </div>
            )}

            <Link
              href="/"
              className="block w-full py-3 px-4 text-zinc-400 hover:text-white font-medium rounded-lg transition-all duration-200"
            >
              Voltar ao Início
            </Link>
          </motion.div>

          {/* Additional Info */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
            >
              <p className="text-yellow-400 text-sm">
                <strong>Dica:</strong> Links de verificação expiram em 24 horas.
                Se o link expirou, crie uma nova conta ou entre em contato conosco.
              </p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-6 text-center"
            >
              <p className="text-zinc-500 text-sm">
                Em breve você receberá um email de boas-vindas com dicas para começar.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}