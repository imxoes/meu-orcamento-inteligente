'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Send,
  Bot,
  ExternalLink,
  CheckCircle,
  XCircle,
  Shield,
  Bell,
  RefreshCw,
  Settings,
  Download,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Target,
  Clock,
  Smartphone,
  Sparkles,
  BarChart3
} from 'lucide-react'

export default function WhatsAppBotPage() {
  const [loading, setLoading] = useState(false)
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [linkingWhatsApp, setLinkingWhatsApp] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [alertSettings, setAlertSettings] = useState<any>(null)
  const [savingAlerts, setSavingAlerts] = useState(false)

  // Buscar dados do usuário
  useEffect(() => {
    fetchUserData()
    fetchAlertSettings()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include'
      })
      const data = await response.json()
      if (response.ok && data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchAlertSettings = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        credentials: 'include'
      })
      const data = await response.json()
      if (response.ok && data.settings) {
        setAlertSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching alert settings:', error)
    }
  }

  const linkWhatsAppAccount = async () => {
    if (!whatsappNumber.trim()) {
      alert('Por favor, digite o número do WhatsApp')
      return
    }

    setLinkingWhatsApp(true)
    try {
      const response = await fetch('/api/whatsapp/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
              body: JSON.stringify({ phoneNumber: whatsappNumber.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        if (data.messageSent) {
          alert('✅ Conta WhatsApp vinculada com sucesso!\n\n📱 Mensagem de boas-vindas enviada!')
        } else if (data.messageError) {
          alert(`✅ Conta WhatsApp vinculada com sucesso!\n\n⚠️ Mas não foi possível enviar a mensagem de boas-vindas:\n${data.messageError}\n\nVerifique a configuração da API no Vercel.`)
        } else {
          alert('✅ Conta WhatsApp vinculada com sucesso!')
        }
        setWhatsappNumber('')
        fetchUserData()
      } else {
        alert(data.error || data.message || 'Erro ao vincular conta WhatsApp')
      }
    } catch (error) {
      console.error('Error linking WhatsApp:', error)
      alert('Erro ao vincular conta WhatsApp')
    } finally {
      setLinkingWhatsApp(false)
    }
  }

  const unlinkWhatsAppAccount = async () => {
    if (!confirm('Tem certeza que deseja desvincular sua conta WhatsApp?')) {
      return
    }

    try {
      const response = await fetch('/api/whatsapp/link', {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok) {
        alert('Conta WhatsApp desvinculada com sucesso!')
        fetchUserData()
      } else {
        alert(data.error || 'Erro ao desvincular conta WhatsApp')
      }
    } catch (error) {
      console.error('Error unlinking WhatsApp:', error)
      alert('Erro ao desvincular conta WhatsApp')
    }
  }

  const saveAlertSettings = async (updates: any) => {
    setSavingAlerts(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      })

      const data = await response.json()

      if (response.ok) {
        alert('Configurações de alertas salvas com sucesso!')
        fetchAlertSettings()
      } else {
        alert(data.error || 'Erro ao salvar configurações')
      }
    } catch (error) {
      console.error('Error saving alert settings:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setSavingAlerts(false)
    }
  }

  const whatsappLinked = user?.whatsappId

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-400" />
            Bot WhatsApp
          </h1>
          <p className="text-zinc-400">Gerencie suas finanças diretamente pelo WhatsApp</p>
        </div>
      </motion.div>

      {/* Link WhatsApp Account */}
      {!whatsappLinked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Vincular Conta WhatsApp</h2>
          </div>
          <p className="text-zinc-400 mb-4">
            Digite seu número do WhatsApp com código do país (ex: +16505044380 ou 16505044380 para EUA, 5511999999999 para Brasil).
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="+16505044380 ou 16505044380"
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={linkWhatsAppAccount}
              disabled={linkingWhatsApp}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {linkingWhatsApp ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Vinculando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Vincular
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* Bot Info */}
      {whatsappLinked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Informações do Bot</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Plataforma:</span>
              <span className="text-white font-semibold">WhatsApp</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Status:</span>
              <span className="flex items-center gap-2 text-green-400">
                <CheckCircle className="w-4 h-4" />
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Conta Vinculada:</span>
              <span className="text-white font-semibold">{user?.whatsappId}</span>
            </div>
            <button
              onClick={unlinkWhatsAppAccount}
              className="mt-4 w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Desvincular Conta
            </button>
          </div>
        </motion.div>
      )}

      {/* Como Configurar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Como Configurar o Bot</h2>
        </div>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">
              1
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Vincule sua conta</h3>
              <p className="text-zinc-400 text-sm">
                Digite seu número do WhatsApp com código do país (ex: +16505044380 para EUA, 5511999999999 para Brasil).
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">
              2
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Envie uma mensagem</h3>
              <p className="text-zinc-400 text-sm">
                Envie qualquer mensagem para o bot do WhatsApp para iniciar a conversa.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 font-bold">
              3
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Comece a usar</h3>
              <p className="text-zinc-400 text-sm">
                Agora você pode registrar receitas, despesas e consultar seu saldo diretamente pelo WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Como Utilizar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">Como Utilizar o Bot</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <DollarSign className="w-5 h-5 text-blue-400 mb-2" />
            <h3 className="text-white font-semibold mb-1">Registrar Receita</h3>
            <p className="text-zinc-400 text-sm mb-2">Ex: &quot;recebi 500 de salário&quot;</p>
            <code className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">recebi 500</code>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <TrendingDown className="w-5 h-5 text-purple-400 mb-2" />
            <h3 className="text-white font-semibold mb-1">Registrar Despesa</h3>
            <p className="text-zinc-400 text-sm mb-2">Ex: &quot;gastei 50 em comida&quot;</p>
            <code className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded">gastei 50</code>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <BarChart3 className="w-5 h-5 text-green-400 mb-2" />
            <h3 className="text-white font-semibold mb-1">Consultar Saldo</h3>
            <p className="text-zinc-400 text-sm mb-2">Ex: &quot;qual meu saldo?&quot;</p>
            <code className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">saldo</code>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <Target className="w-5 h-5 text-yellow-400 mb-2" />
            <h3 className="text-white font-semibold mb-1">Consultar Metas</h3>
            <p className="text-zinc-400 text-sm mb-2">Ex: &quot;minhas metas&quot;</p>
            <code className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">metas</code>
          </div>
        </div>
      </motion.div>

      {/* Alertas Automáticos */}
      {whatsappLinked && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Alertas Automáticos</h2>
          </div>
          <p className="text-zinc-400 mb-4">
            Configure os alertas que você deseja receber via WhatsApp.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <h3 className="text-white font-semibold">Alertas de Gastos</h3>
                <p className="text-zinc-400 text-sm">Receba notificações quando seus gastos ultrapassarem limites definidos</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertSettings?.spendingAlerts || false}
                  onChange={(e) => saveAlertSettings({ spendingAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <h3 className="text-white font-semibold">Alertas de Metas</h3>
                <p className="text-zinc-400 text-sm">Receba notificações sobre o progresso das suas metas financeiras</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertSettings?.goalAlerts || false}
                  onChange={(e) => saveAlertSettings({ goalAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
              <div>
                <h3 className="text-white font-semibold">Alertas de Saldo Baixo</h3>
                <p className="text-zinc-400 text-sm">Receba notificações quando seu saldo estiver abaixo de um valor definido</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={alertSettings?.lowBalanceAlerts || false}
                  onChange={(e) => saveAlertSettings({ lowBalanceAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
