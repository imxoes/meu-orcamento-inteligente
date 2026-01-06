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
  AlertTriangle,
  DollarSign,
  Target,
  Clock,
  Smartphone,
  Sparkles,
  BarChart3
} from 'lucide-react'

const botUsername = '@useOrbi_Bot'

export default function TelegramBotPage() {
  const [botStatus, setBotStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [telegramCode, setTelegramCode] = useState('')
  const [linkingTelegram, setLinkingTelegram] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [alertSettings, setAlertSettings] = useState<any>(null)
  const [savingAlerts, setSavingAlerts] = useState(false)

  // Buscar status do bot e dados do usuário
  useEffect(() => {
    fetchBotStatus()
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

  const fetchBotStatus = async () => {
    try {
      const response = await fetch('/api/telegram/setup')
      const data = await response.json()
      setBotStatus(data)
    } catch (error) {
      console.error('Error fetching bot status:', error)
    }
  }

  const fetchAlertSettings = async () => {
    try {
      const response = await fetch('/api/telegram/alerts', {
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

  const linkTelegramAccount = async () => {
    if (!telegramCode.trim()) {
      alert('Por favor, digite o código do Telegram')
      return
    }

    setLinkingTelegram(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ telegramId: telegramCode.trim() })
      })

      const data = await response.json()

      if (response.ok) {
        alert('✅ Conta do Telegram vinculada com sucesso!')
        setTelegramCode('')
        fetchUserData()
      } else {
        alert('❌ Erro ao vincular: ' + (data.message || 'Erro desconhecido'))
      }
    } catch (error) {
      alert('❌ Erro ao vincular conta do Telegram')
    } finally {
      setLinkingTelegram(false)
    }
  }

  const saveAlertSettings = async () => {
    if (!alertSettings) return

    setSavingAlerts(true)
    try {
      const response = await fetch('/api/telegram/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(alertSettings)
      })

      const data = await response.json()

      if (response.ok) {
        alert('✅ Configurações de alertas salvas!')
      } else {
        alert('❌ Erro ao salvar configurações')
      }
    } catch (error) {
      alert('❌ Erro ao salvar configurações')
    } finally {
      setSavingAlerts(false)
    }
  }

  const openTelegramBot = () => {
    // Detectar se é mobile ou desktop
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      // Abrir diretamente no app do Telegram
      window.location.href = `tg://resolve?domain=${botUsername.replace('@', '')}`
    } else {
      // Abrir no Telegram Web
      window.open(`https://t.me/${botUsername.replace('@', '')}`, '_blank')
    }
  }

  const downloadTelegram = () => {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    const isAndroid = /Android/i.test(navigator.userAgent)
    
    if (isIOS) {
      window.open('https://apps.apple.com/app/telegram/id686449807', '_blank')
    } else if (isAndroid) {
      window.open('https://play.google.com/store/apps/details?id=org.telegram.messenger', '_blank')
    } else {
      // Desktop - mostrar opções
      window.open('https://desktop.telegram.org/', '_blank')
    }
  }

  const botActive = botStatus?.bot_status === 'ativo'

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
            <Send className="w-8 h-8 text-blue-400" />
            Bot Telegram
          </h1>
          <p className="text-zinc-400">Controle suas finanças via Telegram de forma inteligente</p>
        </div>
      </motion.div>

      {/* Link Telegram Account */}
      {!user?.telegramId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            Vincular Conta do Telegram
          </h3>
          <p className="text-zinc-300 text-sm mb-4">
            Para usar o bot, você precisa vincular sua conta do Telegram. O bot enviou um código quando você digitou /start.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={telegramCode}
              onChange={(e) => setTelegramCode(e.target.value)}
              placeholder="Cole o código do Telegram aqui (ex: 755073684)"
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-green-500/50"
            />
            <button
              onClick={linkTelegramAccount}
              disabled={linkingTelegram || !telegramCode.trim()}
              className="px-6 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {linkingTelegram ? (
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
          <p className="text-zinc-400 text-xs mt-3">
            💡 Dica: O código foi enviado pelo bot quando você digitou /start no Telegram
          </p>
        </motion.div>
      )}

      {/* Bot Info - Simplificado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Informações do Bot</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Username:</span>
            <div className="flex items-center gap-2">
              <code className="bg-white/10 px-3 py-1 rounded text-blue-400 font-mono">{botUsername}</code>
              <button 
                onClick={openTelegramBot}
                className="text-zinc-400 hover:text-blue-400 transition-colors"
                title="Abrir no Telegram"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">Status:</span>
            <div className="flex items-center gap-2">
              {botActive ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Ativo</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400">Inativo</span>
                </>
              )}
            </div>
          </div>
          
          {user?.telegramId && (
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Conta Vinculada:</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400">ID: {user.telegramId}</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Como Configurar o Bot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-blue-400" />
          Como Configurar o Bot
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-semibold flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="text-white font-medium mb-1">Baixe o Telegram</p>
              <p className="text-zinc-400 text-sm">
                Se você ainda não tem o Telegram instalado, baixe agora mesmo.
              </p>
              <button
                onClick={downloadTelegram}
                className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
              >
                <Download className="w-4 h-4" />
                Baixar Telegram
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-semibold flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="text-white font-medium mb-1">Abra o bot no Telegram</p>
              <p className="text-zinc-400 text-sm mb-2">
                Clique no botão abaixo para abrir uma conversa com o OrbiBot.
              </p>
              <button
                onClick={openTelegramBot}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors text-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Abrir {botUsername}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-sm font-semibold flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <p className="text-white font-medium mb-1">Digite /start</p>
              <p className="text-zinc-400 text-sm">
                O bot enviará um código de vinculação. Cole esse código no campo acima para conectar sua conta.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Como Utilizar o Bot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Como Utilizar o Bot
        </h3>
        
        <p className="text-zinc-300 mb-4">
          O OrbiBot entende linguagem natural. Você não precisa decorar comandos complicados!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <h4 className="text-white font-medium">Registrar Receitas</h4>
            </div>
            <p className="text-zinc-400 text-sm mb-2">Exemplos:</p>
            <ul className="text-zinc-300 text-sm space-y-1">
              <li>• &quot;recebi 1200 de salário&quot;</li>
              <li>• &quot;ganhei 500 de freelance&quot;</li>
              <li>• &quot;recebi meu salario de 3000 reais&quot;</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <h4 className="text-white font-medium">Registrar Gastos</h4>
            </div>
            <p className="text-zinc-400 text-sm mb-2">Exemplos:</p>
            <ul className="text-zinc-300 text-sm space-y-1">
              <li>• &quot;50 uber&quot;</li>
              <li>• &quot;25.90 supermercado&quot;</li>
              <li>• &quot;gastei 100 em gasolina&quot;</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <h4 className="text-white font-medium">Consultas</h4>
            </div>
            <p className="text-zinc-400 text-sm mb-2">Exemplos:</p>
            <ul className="text-zinc-300 text-sm space-y-1">
              <li>• &quot;qual meu saldo?&quot;</li>
              <li>• &quot;gastos do mês&quot;</li>
              <li>• &quot;onde mais gasto?&quot;</li>
            </ul>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-400" />
              <h4 className="text-white font-medium">Metas e Insights</h4>
            </div>
            <p className="text-zinc-400 text-sm mb-2">Exemplos:</p>
            <ul className="text-zinc-300 text-sm space-y-1">
              <li>• &quot;como estão minhas metas?&quot;</li>
              <li>• &quot;me dê uma dica&quot;</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Configuração de Alertas */}
      {user?.telegramId && alertSettings && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-400" />
            Alertas Automáticos
          </h3>
          
          <p className="text-zinc-300 text-sm mb-6">
            Configure alertas inteligentes para ser notificado sobre seus gastos e metas.
          </p>

          <div className="space-y-6">
            {/* Alerta de Gasto Alto */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <h4 className="text-white font-medium">Alerta de Gasto Alto</h4>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertSettings.highSpendingEnabled}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      highSpendingEnabled: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                </label>
              </div>
              
              {alertSettings.highSpendingEnabled && (
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="text-zinc-400 text-sm mb-1 block">Valor limite (R$)</label>
                    <input
                      type="number"
                      value={alertSettings.highSpendingThreshold}
                      onChange={(e) => setAlertSettings({
                        ...alertSettings,
                        highSpendingThreshold: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 text-sm mb-1 block">Período</label>
                    <select
                      value={alertSettings.highSpendingPeriod}
                      onChange={(e) => setAlertSettings({
                        ...alertSettings,
                        highSpendingPeriod: e.target.value
                      })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500/50"
                    >
                      <option value="DAILY">Diário</option>
                      <option value="WEEKLY">Semanal</option>
                      <option value="MONTHLY">Mensal</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Resumo Diário */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <h4 className="text-white font-medium">Resumo Diário</h4>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertSettings.dailySummaryEnabled}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      dailySummaryEnabled: e.target.checked
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>
              
              {alertSettings.dailySummaryEnabled && (
                <div className="mt-3">
                  <label className="text-zinc-400 text-sm mb-1 block">Horário (HH:mm)</label>
                  <input
                    type="time"
                    value={alertSettings.dailySummaryTime || '20:00'}
                    onChange={(e) => setAlertSettings({
                      ...alertSettings,
                      dailySummaryTime: e.target.value
                    })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={saveAlertSettings}
            disabled={savingAlerts}
            className="mt-6 w-full px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingAlerts ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Salvar Configurações
              </>
            )}
          </button>
        </motion.div>
      )}
    </div>
  )
}
