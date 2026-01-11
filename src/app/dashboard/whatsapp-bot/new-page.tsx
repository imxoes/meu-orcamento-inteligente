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
  BarChart3,
  QrCode,
  Play,
  Square,
  Image,
  FileText,
  Video,
  Music,
  Zap
} from 'lucide-react'
import SimpleBackground from '@/components/ui/simple-background'

interface WhatsAppStatus {
  connected: boolean
  status: string
  qrCode?: string
}

export default function WhatsAppBotNewPage() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<WhatsAppStatus>({ connected: false, status: 'disconnected' })
  const [qrCode, setQrCode] = useState('')
  const [user, setUser] = useState<any>(null)
  const [alertSettings, setAlertSettings] = useState<any>(null)
  const [savingAlerts, setSavingAlerts] = useState(false)

  // Estados para envio de mensagem de teste
  const [testMessage, setTestMessage] = useState({
    telefone: '',
    mensagem: '',
    tipo: 'texto' as 'texto' | 'image' | 'video' | 'document' | 'audio' | 'enquete',
    url: '',
    enquete: {
      pergunta: '',
      opcoes: ['', '']
    }
  })
  const [sendingTest, setSendingTest] = useState(false)

  useEffect(() => {
    fetchUserData()
    fetchAlertSettings()
    checkStatus()
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
      console.error('Erro ao buscar dados do usuário:', error)
    }
  }

  const fetchAlertSettings = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        credentials: 'include'
      })
      const data = await response.json()
      if (response.ok) {
        setAlertSettings(data.settings)
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
    }
  }

  const checkStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whatsapp/status', {
        credentials: 'include'
      })
      const data = await response.json()
      setStatus({
        connected: data.connected || false,
        status: data.status || 'disconnected'
      })
    } catch (error) {
      console.error('Erro ao verificar status:', error)
    } finally {
      setLoading(false)
    }
  }

  const startInstance = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whatsapp/setup', {
        method: 'POST',
        credentials: 'include'
      })
      const data = await response.json()
      if (response.ok) {
        await generateQrCode()
      }
    } catch (error) {
      console.error('Erro ao iniciar instância:', error)
    } finally {
      setLoading(false)
    }
  }

  const stopInstance = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/whatsapp/setup', {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        setStatus({ connected: false, status: 'disconnected' })
        setQrCode('')
      }
    } catch (error) {
      console.error('Erro ao parar instância:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateQrCode = async () => {
    try {
      const response = await fetch('/api/whatsapp/setup', {
        credentials: 'include'
      })
      const data = await response.json()
      if (response.ok && data.qrCode) {
        setQrCode(data.qrCode)
      }
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error)
    }
  }

  const sendTestMessage = async () => {
    if (!testMessage.telefone || !testMessage.mensagem) {
      alert('Preencha o telefone e a mensagem')
      return
    }

    try {
      setSendingTest(true)
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(testMessage)
      })
      const data = await response.json()
      if (response.ok) {
        alert('Mensagem enviada com sucesso!')
        setTestMessage(prev => ({ ...prev, mensagem: '' }))
      } else {
        alert('Erro ao enviar mensagem: ' + data.message)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem')
    } finally {
      setSendingTest(false)
    }
  }

  const saveAlertSettings = async () => {
    try {
      setSavingAlerts(true)
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ whatsappAlerts: alertSettings })
      })
      if (response.ok) {
        alert('Configurações salvas com sucesso!')
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
    } finally {
      setSavingAlerts(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: -1 }}>
        <SimpleBackground />
      </div>

      <div className="min-h-screen relative space-y-8 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl">
              <Smartphone className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg">Bot WhatsApp</h1>
              <p className="text-zinc-400">Configure e gerencie seu bot do WhatsApp via EditaCódigo</p>
            </div>
          </div>
        </motion.div>

        {/* Status da Conexão */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white drop-shadow-lg">Status da Instância</h2>
            <button
              onClick={checkStatus}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {status.connected ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
                <span className="text-lg font-medium text-white">
                  {status.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>

              <div className="flex gap-3">
                {!status.connected ? (
                  <button
                    onClick={startInstance}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    {loading ? 'Iniciando...' : 'Iniciar Instância'}
                  </button>
                ) : (
                  <button
                    onClick={stopInstance}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors"
                  >
                    <Square className="w-4 h-4" />
                    {loading ? 'Parando...' : 'Parar Instância'}
                  </button>
                )}

                {!status.connected && (
                  <button
                    onClick={generateQrCode}
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors"
                  >
                    <QrCode className="w-4 h-4" />
                    Gerar QR Code
                  </button>
                )}
              </div>
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="flex flex-col items-center gap-4">
                <h3 className="text-lg font-medium text-white">Escaneie com seu WhatsApp</h3>
                <div className="p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="QR Code WhatsApp" className="w-48 h-48" />
                </div>
                <p className="text-sm text-zinc-400 text-center">
                  Abra o WhatsApp no seu celular e escaneie este código
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Teste de Mensagem */}
        {status.connected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl"
          >
            <h2 className="text-xl font-semibold text-white drop-shadow-lg mb-6">Enviar Mensagem de Teste</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Número (com código do país)
                  </label>
                  <input
                    type="text"
                    placeholder="5511999999999"
                    value={testMessage.telefone}
                    onChange={(e) => setTestMessage(prev => ({ ...prev, telefone: e.target.value }))}
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Tipo de Mensagem
                  </label>
                  <select
                    value={testMessage.tipo}
                    onChange={(e) => setTestMessage(prev => ({ ...prev, tipo: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white focus:border-blue-500 outline-none transition-colors"
                  >
                    <option value="texto">Texto</option>
                    <option value="image">Imagem</option>
                    <option value="video">Vídeo</option>
                    <option value="document">Documento</option>
                    <option value="audio">Áudio</option>
                    <option value="enquete">Enquete</option>
                  </select>
                </div>

                {testMessage.tipo !== 'texto' && testMessage.tipo !== 'enquete' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      URL do Arquivo
                    </label>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/arquivo.jpg"
                      value={testMessage.url}
                      onChange={(e) => setTestMessage(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    {testMessage.tipo === 'enquete' ? 'Pergunta da Enquete' : 'Mensagem'}
                  </label>
                  <textarea
                    placeholder={testMessage.tipo === 'enquete' ? 'Qual é a sua cor favorita?' : 'Digite sua mensagem...'}
                    value={testMessage.mensagem}
                    onChange={(e) => setTestMessage(prev => ({ ...prev, mensagem: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 bg-black/20 border border-white/20 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 outline-none transition-colors resize-none"
                  />
                </div>

                {testMessage.tipo === 'enquete' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Opções da Enquete
                    </label>
                    {testMessage.enquete.opcoes.map((opcao, index) => (
                      <input
                        key={index}
                        type="text"
                        placeholder={`Opção ${index + 1}`}
                        value={opcao}
                        onChange={(e) => {
                          const novasOpcoes = [...testMessage.enquete.opcoes]
                          novasOpcoes[index] = e.target.value
                          setTestMessage(prev => ({ ...prev, enquete: { ...prev.enquete, opcoes: novasOpcoes } }))
                        }}
                        className="w-full px-4 py-2 mb-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 outline-none transition-colors"
                      />
                    ))}
                    <button
                      onClick={() => setTestMessage(prev => ({
                        ...prev,
                        enquete: { ...prev.enquete, opcoes: [...prev.enquete.opcoes, ''] }
                      }))}
                      className="text-blue-400 text-sm hover:text-blue-300"
                    >
                      + Adicionar Opção
                    </button>
                  </div>
                )}

                <button
                  onClick={sendTestMessage}
                  disabled={sendingTest}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg transition-colors"
                >
                  <Send className={`w-4 h-4 ${sendingTest ? 'animate-pulse' : ''}`} />
                  {sendingTest ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Configurações de Alertas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-6 shadow-2xl"
        >
          <h2 className="text-xl font-semibold text-white drop-shadow-lg mb-6">Configurações de Alertas</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span className="text-white">Receitas</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                  <span className="text-white">Gastos</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Metas</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span className="text-white">Relatórios</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 After:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={saveAlertSettings}
              disabled={savingAlerts}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors"
            >
              <Settings className={`w-4 h-4 ${savingAlerts ? 'animate-spin' : ''}`} />
              {savingAlerts ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </motion.div>
      </div>
    </>
  )
}