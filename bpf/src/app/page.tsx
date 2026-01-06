'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Brain,
  TrendingUp,
  Shield,
  Smartphone,
  DollarSign,
  Target,
  BarChart3,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Check,
  Wallet,
  PieChart,
  LineChart
} from 'lucide-react'
import AnimatedShaderBackground from '@/components/ui/animated-shader-background'

export default function Home() {
  const [email, setEmail] = useState('')

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const features = [
    {
      icon: Brain,
      title: "IA Financeira",
      description: "Análises inteligentes dos seus gastos com insights personalizados"
    },
    {
      icon: MessageCircle,
      title: "Bots Telegram & WhatsApp",
      description: "Lance seus gastos conversando naturalmente no Telegram ou WhatsApp"
    },
    {
      icon: Shield,
      title: "100% Privado",
      description: "Seus dados financeiros ficam apenas no seu dispositivo"
    },
    {
      icon: BarChart3,
      title: "Relatórios Visuais",
      description: "Dashboards elegantes para entender seus padrões de consumo"
    },
    {
      icon: Target,
      title: "Metas Inteligentes",
      description: "Defina objetivos e receba dicas para alcançá-los"
    },
    {
      icon: Sparkles,
      title: "Dicas Personalizadas",
      description: "Sugestões baseadas no seu comportamento financeiro"
    }
  ]

  const benefits = [
    "Controle total sobre suas finanças",
    "Insights de IA para otimizar gastos",
    "Interface moderna e intuitiva",
    "Bots Telegram e WhatsApp para facilitar lançamentos",
    "Dados seguros e privados",
    "Relatórios detalhados e visuais"
  ]

  return (
    <div className="min-h-screen text-white relative" style={{ backgroundColor: '#000000' }}>
      <AnimatedShaderBackground />
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ zIndex: 1 }}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20">
          <motion.div
            className="text-center"
            initial="initial"
            animate="animate"
            variants={staggerChildren}
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
              Inteligência Artificial Financeira
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
                Orbi
              </span>
              <br />
              <span className="text-white">Meu Orçamento Inteligente</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="max-w-3xl mx-auto text-xl sm:text-2xl text-zinc-400 mb-12 leading-relaxed"
            >
              Transforme sua relação com o dinheiro. Lance gastos pelo Telegram ou WhatsApp,
              receba insights de IA e tome decisões financeiras mais inteligentes.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Link href="/auth/signup" className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105">
                <DollarSign className="w-5 h-5" />
                Teste Grátis por 7 dias
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/auth/login" className="inline-flex items-center gap-2 border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300">
                <MessageCircle className="w-5 h-5" />
                Entrar na Plataforma
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">
              Recursos que fazem a diferença
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Tecnologia de ponta para revolucionar como você gerencia suas finanças pessoais
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group p-8 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mb-6">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-5xl font-bold mb-8">
                Por que escolher o
                <span className="block bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                  Orbi?
                </span>
              </h2>
              <p className="text-xl text-zinc-400 mb-8 leading-relaxed">
                Uma solução completa que combina simplicidade, segurança e inteligência
                artificial para transformar sua vida financeira.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span className="text-zinc-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-green-500/20 rounded-3xl p-8 backdrop-blur-sm border border-white/10">
                <div className="w-full h-full bg-zinc-800/50 rounded-2xl flex flex-col items-center justify-center p-6">
                  <div className="grid grid-cols-3 gap-3 mb-6 w-full max-w-xs">
                    <div className="bg-blue-500/20 rounded-lg p-3 flex flex-col items-center">
                      <Wallet className="w-6 h-6 text-blue-400 mb-2" />
                      <div className="h-2 w-full bg-blue-500/30 rounded"></div>
                    </div>
                    <div className="bg-purple-500/20 rounded-lg p-3 flex flex-col items-center">
                      <PieChart className="w-6 h-6 text-purple-400 mb-2" />
                      <div className="h-2 w-full bg-purple-500/30 rounded"></div>
                    </div>
                    <div className="bg-green-500/20 rounded-lg p-3 flex flex-col items-center">
                      <LineChart className="w-6 h-6 text-green-400 mb-2" />
                      <div className="h-2 w-full bg-green-500/30 rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2 w-full max-w-xs">
                    <div className="h-3 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded"></div>
                    <div className="h-3 bg-gradient-to-r from-purple-500/30 to-green-500/30 rounded w-4/5"></div>
                    <div className="h-3 bg-gradient-to-r from-green-500/30 to-blue-500/30 rounded w-3/5"></div>
                  </div>
                  <div className="mt-6 text-center">
                    <h3 className="text-xl font-semibold mb-1 text-white">Dashboard Orbi</h3>
                    <p className="text-zinc-400 text-sm">Interface elegante e intuitiva</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">
              Comece sua jornada financeira inteligente com o <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Orbi</span>
            </h2>
            <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto">
              Junte-se aos milhares de usuários que já transformaram suas finanças
              com nossa plataforma inovadora.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu melhor email"
                className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-400 transition-colors"
              />
              <Link href="/auth/signup" className="w-full sm:w-auto whitespace-nowrap inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105">
                Começar Agora
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-sm text-zinc-500">
              Grátis para sempre. Sem cartão de crédito necessário.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Orbi</span>
              <span className="text-white"> - Meu Orçamento Inteligente</span>
            </h3>
            <p className="text-zinc-400 mb-6">
              Transformando vidas através da inteligência financeira
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
              <span>© 2024 Orbi - Meu Orçamento Inteligente</span>
              <span>•</span>
              <span>Privacidade</span>
              <span>•</span>
              <span>Termos</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
