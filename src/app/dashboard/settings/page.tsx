'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Save,
  Globe,
  Mail,
  Lock,
  FileText,
  AlertTriangle,
  Target,
  Wallet,
  Clock,
  Calendar,
  CheckCircle,
  X
} from 'lucide-react'
import SimpleBackground from '@/components/ui/simple-background'

// Emojis disponíveis para seleção
const AVAILABLE_EMOJIS = [
  '😊', '😎', '🤩', '😇', '🥳', '🤑', '💪', '🚀',
  '💰', '📊', '🎯', '⭐', '🔥', '💎', '🌟', '✨',
  '🦊', '🐱', '🐶', '🦁', '🐼', '🦄', '🐸', '🦋',
  '🌈', '🌸', '🍀', '🌻', '🌺', '🎨', '🎭', '🎪'
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState<any>(null)
  const [profileData, setProfileData] = useState({ name: '', telegramId: '', emoji: '😊', currency: 'BRL' })
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  
  // Estados para a aba Dados
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletePassword, setDeletePassword] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Configurações de notificações e relatórios
  const [userSettings, setUserSettings] = useState({
    // Alertas de gastos
    spendingAlertsEnabled: false,
    spendingAlertLimit: 500,
    spendingAlertPeriod: 'DAILY',
    // Alertas de metas
    goalAlertsEnabled: true,
    goalAlertThreshold: 80,
    // Alertas de saldo baixo
    lowBalanceAlertEnabled: false,
    lowBalanceThreshold: 100,
    // Canal de entrega dos alertas
    alertDeliveryMethod: 'TELEGRAM',
    // Configurações de email
    emailFrequency: 'INSTANT',
    emailTime: '09:00',
    // Relatórios semanais
    weeklyReportEnabled: false,
    weeklyReportDay: 'MONDAY',
    weeklyReportContent: 'FULL',
    // Relatórios mensais
    monthlyReportEnabled: false,
    monthlyReportDay: 1,
    monthlyReportContent: 'FULL',
    // Canal de entrega dos relatórios
    reportDeliveryMethod: 'EMAIL'
  })

  const sections = [
    { id: 'profile', name: 'Perfil', icon: User },
    { id: 'notifications', name: 'Notificações', icon: Bell },
    { id: 'reports', name: 'Relatórios', icon: FileText },
    { id: 'security', name: 'Segurança', icon: Shield },
    { id: 'appearance', name: 'Aparência', icon: Palette },
    { id: 'data', name: 'Dados', icon: Database }
  ]

  useEffect(() => {
    fetchUserData()
    fetchUserSettings()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setProfileData({
          name: data.user.name || '',
          telegramId: data.user.telegramId || '',
          emoji: data.user.emoji || '😊',
          currency: data.user.currency || 'BRL'
        })
      } else {
        setError(data.message || 'Erro ao carregar dados do usuário')
      }
    } catch (error) {
      setError('Erro de conexão ao carregar dados')
    }
  }

  const fetchUserSettings = async () => {
    try {
      setLoadingSettings(true)
      const response = await fetch('/api/user/settings')
      const data = await response.json()

      if (response.ok && data.settings) {
        setUserSettings(prev => ({
          ...prev,
          ...data.settings
        }))
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoadingSettings(false)
    }
  }

  const handleProfileSave = async () => {
    if (!profileData.name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setSuccess('Perfil atualizado com sucesso!')
        setShowEmojiPicker(false)
      } else {
        setError(data.message || 'Erro ao atualizar perfil')
      }
    } catch (error) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handleSettingsSave = async () => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userSettings)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Configurações salvas com sucesso!')
      } else {
        setError(data.message || 'Erro ao salvar configurações')
      }
    } catch (error) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('Todos os campos de senha são obrigatórios')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Nova senha e confirmação não coincidem')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('Nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Senha alterada com sucesso!')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setError(data.message || 'Erro ao alterar senha')
      }
    } catch (error) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const renderProfileSection = () => (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Seleção de Emoji */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-4xl hover:scale-105 transition-transform cursor-pointer"
          >
            {profileData.emoji}
          </button>
          
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute top-24 left-0 z-50 p-4 bg-zinc-900 border border-white/20 rounded-2xl shadow-2xl min-w-[320px]">
              <p className="text-zinc-300 font-medium text-sm mb-3">Escolha um emoji:</p>
              <div className="grid grid-cols-8 gap-1" style={{ gridTemplateColumns: 'repeat(8, 36px)' }}>
                {AVAILABLE_EMOJIS.map((emoji, index) => (
                  <button
                    key={`emoji-${index}`}
                    type="button"
                    onClick={() => {
                      setProfileData({ ...profileData, emoji })
                      setShowEmojiPicker(false)
                    }}
                    className={`w-9 h-9 text-xl rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center ${
                      profileData.emoji === emoji ? 'bg-blue-500/30 ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <span role="img" aria-label={`emoji-${index}`}>{emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold drop-shadow-lg text-white mb-2">Avatar do Perfil</h3>
          <p className="text-zinc-300 font-medium text-sm">Clique no emoji para trocar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Nome Completo</label>
          <input
            type="text"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
            placeholder="Digite seu nome"
          />
        </div>

        <div>
          <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-zinc-300 font-medium cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Telegram ID</label>
          <input
            type="text"
            value={profileData.telegramId}
            onChange={(e) => setProfileData({ ...profileData, telegramId: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
            placeholder="Seu ID do Telegram"
          />
        </div>

        <div>
          <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Moeda Padrão</label>
          <select
            value={profileData.currency}
            onChange={(e) => setProfileData({ ...profileData, currency: e.target.value })}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="BRL">Real (R$)</option>
            <option value="USD">Dólar (US$)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleProfileSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  )

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Alertas de Gastos */}
      <div className="bg-white/5 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-bold drop-shadow-lg text-white">Alertas de Gastos</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold drop-shadow-lg">Ativar alertas de gastos</p>
              <p className="text-zinc-300 font-medium text-sm">Receba avisos quando exceder o limite</p>
            </div>
            <button
              onClick={() => setUserSettings(prev => ({ ...prev, spendingAlertsEnabled: !prev.spendingAlertsEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                userSettings.spendingAlertsEnabled ? 'bg-green-500' : 'bg-zinc-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                userSettings.spendingAlertsEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {userSettings.spendingAlertsEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Limite de gasto (R$)</label>
                <input
                  type="number"
                  value={userSettings.spendingAlertLimit}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, spendingAlertLimit: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  placeholder="500"
                />
              </div>
              <div>
                <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Período de análise</label>
                <select
                  value={userSettings.spendingAlertPeriod}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, spendingAlertPeriod: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="DAILY">Diário</option>
                  <option value="WEEKLY">Semanal</option>
                  <option value="MONTHLY">Mensal</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Alertas de Metas */}
      <div className="bg-white/5 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold drop-shadow-lg text-white">Alertas de Metas</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold drop-shadow-lg">Notificar progresso de metas</p>
              <p className="text-zinc-300 font-medium text-sm">Receba avisos sobre suas metas financeiras</p>
            </div>
            <button
              onClick={() => setUserSettings(prev => ({ ...prev, goalAlertsEnabled: !prev.goalAlertsEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                userSettings.goalAlertsEnabled ? 'bg-green-500' : 'bg-zinc-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                userSettings.goalAlertsEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {userSettings.goalAlertsEnabled && (
            <div className="pt-4 border-t border-white/10">
              <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">
                Notificar quando atingir (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={userSettings.goalAlertThreshold}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, goalAlertThreshold: Number(e.target.value) }))}
                  className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <span className="text-white font-bold drop-shadow-lg w-16 text-right">{userSettings.goalAlertThreshold}%</span>
              </div>
              <p className="text-zinc-500 text-xs mt-2">
                Você será notificado quando suas metas atingirem {userSettings.goalAlertThreshold}% do valor total
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Alertas de Saldo Baixo */}
      <div className="bg-white/5 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-bold drop-shadow-lg text-white">Alerta de Saldo Baixo</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold drop-shadow-lg">Ativar alerta de saldo baixo</p>
              <p className="text-zinc-300 font-medium text-sm">Receba avisos quando seu saldo estiver baixo</p>
            </div>
            <button
              onClick={() => setUserSettings(prev => ({ ...prev, lowBalanceAlertEnabled: !prev.lowBalanceAlertEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                userSettings.lowBalanceAlertEnabled ? 'bg-green-500' : 'bg-zinc-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                userSettings.lowBalanceAlertEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {userSettings.lowBalanceAlertEnabled && (
            <div className="pt-4 border-t border-white/10">
              <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Saldo mínimo (R$)</label>
              <input
                type="number"
                value={userSettings.lowBalanceThreshold}
                onChange={(e) => setUserSettings(prev => ({ ...prev, lowBalanceThreshold: Number(e.target.value) }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                placeholder="100"
              />
            </div>
          )}
        </div>
      </div>

      {/* Como Receber Alertas */}
      <div className="bg-white/5 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold drop-shadow-lg text-white">Como Receber os Alertas</h3>
        </div>
        
        <div className="space-y-3">
          {[
            { value: 'TELEGRAM', label: '📱 Via Telegram', desc: 'Receba alertas instantâneos pelo bot' },
            { value: 'EMAIL', label: '📧 Por Email', desc: 'Receba alertas no seu email' },
            { value: 'BOTH', label: '📱📧 Telegram e Email', desc: 'Receba em ambos os canais' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setUserSettings(prev => ({ ...prev, alertDeliveryMethod: option.value }))}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                userSettings.alertDeliveryMethod === option.value
                  ? 'bg-purple-500/20 border border-purple-500/30'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="text-left">
                <p className="text-white font-bold drop-shadow-lg">{option.label}</p>
                <p className="text-zinc-300 font-medium text-sm">{option.desc}</p>
              </div>
              {userSettings.alertDeliveryMethod === option.value && (
                <CheckCircle className="w-5 h-5 text-purple-400" />
              )}
            </button>
          ))}
        </div>

        {(userSettings.alertDeliveryMethod === 'EMAIL' || userSettings.alertDeliveryMethod === 'BOTH') && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
            <div>
              <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Frequência de email</label>
              <select
                value={userSettings.emailFrequency}
                onChange={(e) => setUserSettings(prev => ({ ...prev, emailFrequency: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="INSTANT">Instantâneo (a cada evento)</option>
                <option value="DAILY_DIGEST">Resumo diário</option>
                <option value="WEEKLY_DIGEST">Resumo semanal</option>
              </select>
            </div>

            {userSettings.emailFrequency !== 'INSTANT' && (
              <div>
                <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Horário de envio</label>
                <input
                  type="time"
                  value={userSettings.emailTime}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, emailTime: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                />
              </div>
            )}
          </div>
        )}

        {userSettings.alertDeliveryMethod === 'TELEGRAM' && !user?.telegramId && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-yellow-400 text-sm">
              ⚠️ Você precisa vincular seu Telegram para receber alertas. 
              Vá em <strong>Bot Telegram</strong> no menu para configurar.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSettingsSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )

  const renderReportsSection = () => (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Relatório Semanal */}
      <div className="bg-white/5 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold drop-shadow-lg text-white">Relatório Semanal</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold drop-shadow-lg">Receber relatório semanal</p>
              <p className="text-zinc-300 font-medium text-sm">Resumo das suas finanças da semana</p>
            </div>
            <button
              onClick={() => setUserSettings(prev => ({ ...prev, weeklyReportEnabled: !prev.weeklyReportEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                userSettings.weeklyReportEnabled ? 'bg-green-500' : 'bg-zinc-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                userSettings.weeklyReportEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {userSettings.weeklyReportEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Dia de envio</label>
                <select
                  value={userSettings.weeklyReportDay}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, weeklyReportDay: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="MONDAY">Segunda-feira</option>
                  <option value="TUESDAY">Terça-feira</option>
                  <option value="WEDNESDAY">Quarta-feira</option>
                  <option value="THURSDAY">Quinta-feira</option>
                  <option value="FRIDAY">Sexta-feira</option>
                  <option value="SATURDAY">Sábado</option>
                  <option value="SUNDAY">Domingo</option>
                </select>
              </div>
              <div>
                <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Conteúdo do relatório</label>
                <select
                  value={userSettings.weeklyReportContent}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, weeklyReportContent: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="FULL">Completo (receitas, gastos e metas)</option>
                  <option value="SUMMARY">Resumido (apenas saldos)</option>
                  <option value="EXPENSES_ONLY">Apenas gastos</option>
                  <option value="INCOME_ONLY">Apenas receitas</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Relatório Mensal */}
      <div className="bg-white/5 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold drop-shadow-lg text-white">Relatório Mensal</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold drop-shadow-lg">Receber relatório mensal</p>
              <p className="text-zinc-300 font-medium text-sm">Análise completa do mês</p>
            </div>
            <button
              onClick={() => setUserSettings(prev => ({ ...prev, monthlyReportEnabled: !prev.monthlyReportEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                userSettings.monthlyReportEnabled ? 'bg-green-500' : 'bg-zinc-600'
              }`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                userSettings.monthlyReportEnabled ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {userSettings.monthlyReportEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <div>
                <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Dia do mês para envio</label>
                <select
                  value={userSettings.monthlyReportDay}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, monthlyReportDay: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                >
                  {[1, 5, 10, 15, 20, 25, 28].map(day => (
                    <option key={day} value={day}>Dia {day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Conteúdo do relatório</label>
                <select
                  value={userSettings.monthlyReportContent}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, monthlyReportContent: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="FULL">Completo (tudo detalhado)</option>
                  <option value="SUMMARY">Resumido</option>
                  <option value="COMPARISON">Comparativo com mês anterior</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Canal de Entrega */}
      <div className="bg-white/5 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-bold drop-shadow-lg text-white">Como Receber os Relatórios</h3>
        </div>
        
        <div className="space-y-3">
          {[
            { value: 'EMAIL', label: 'Por Email', desc: 'Receba no seu email cadastrado' },
            { value: 'TELEGRAM', label: 'Via Telegram', desc: 'Receba pelo bot do Telegram' },
            { value: 'BOTH', label: 'Email e Telegram', desc: 'Receba nos dois canais' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setUserSettings(prev => ({ ...prev, reportDeliveryMethod: option.value }))}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-colors ${
                userSettings.reportDeliveryMethod === option.value
                  ? 'bg-blue-500/20 border border-blue-500/30'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="text-left">
                <p className="text-white font-bold drop-shadow-lg">{option.label}</p>
                <p className="text-zinc-300 font-medium text-sm">{option.desc}</p>
              </div>
              {userSettings.reportDeliveryMethod === option.value && (
                <CheckCircle className="w-5 h-5 text-blue-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSettingsSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  )

  const renderSecuritySection = () => (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold drop-shadow-lg text-white mb-4">Alterar Senha</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Senha Atual</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
                placeholder="Digite sua senha atual"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-300 font-medium hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Nova Senha</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
              placeholder="Digite sua nova senha"
            />
          </div>

          <div>
            <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">Confirmar Nova Senha</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500/50"
              placeholder="Confirme sua nova senha"
            />
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {loading ? 'Alterando...' : 'Alterar Senha'}
          </button>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold drop-shadow-lg text-white mb-4">Sessões Ativas</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <p className="text-white font-bold drop-shadow-lg">Sessão Atual</p>
              <p className="text-zinc-300 font-medium text-sm">Este dispositivo • Agora</p>
            </div>
            <span className="text-green-400 text-sm">Ativa</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderAppearanceSection = () => (
    <div className="space-y-6">
      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold drop-shadow-lg text-white mb-4">Idioma</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-white font-bold drop-shadow-lg">Português (Brasil)</p>
              <p className="text-zinc-300 font-medium text-sm">Idioma da interface</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold drop-shadow-lg text-white mb-4">Formato de Data</h3>
        <select className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-500/50">
          <option value="dd/mm/yyyy">DD/MM/AAAA</option>
          <option value="mm/dd/yyyy">MM/DD/AAAA</option>
          <option value="yyyy-mm-dd">AAAA-MM-DD</option>
        </select>
      </div>
    </div>
  )

  const handleExportData = async () => {
    setIsExporting(true)
    setError('')
    try {
      const response = await fetch('/api/user/export')
      if (!response.ok) {
        throw new Error('Erro ao exportar dados')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orbi-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setSuccess('Dados exportados com sucesso!')
    } catch (err) {
      setError('Erro ao exportar dados. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setError('')
    setSuccess('')

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const response = await fetch('/api/user/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao importar dados')
      }

      setSuccess(`Importação concluída! ${result.summary.transactions} transações, ${result.summary.goals} metas, ${result.summary.investments} investimentos importados.`)
    } catch (err: any) {
      setError(err.message || 'Erro ao importar dados. Verifique se o arquivo é válido.')
    } finally {
      setIsImporting(false)
      // Reset input
      event.target.value = ''
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'EXCLUIR MINHA CONTA') {
      setError('Digite "EXCLUIR MINHA CONTA" para confirmar')
      return
    }

    if (!deletePassword) {
      setError('Digite sua senha para confirmar')
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const response = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deletePassword,
          confirmation: deleteConfirmation
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Erro ao excluir conta')
      }

      // Redirecionar para a página inicial
      window.location.href = '/'
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir conta')
    } finally {
      setIsDeleting(false)
    }
  }

  const renderDataSection = () => (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      <div className="bg-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold drop-shadow-lg text-white mb-4">Backup e Restauração</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold drop-shadow-lg">Exportar Dados</p>
              <p className="text-zinc-300 font-medium text-sm">Baixe todos os seus dados em formato JSON</p>
            </div>
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isExporting ? 'Exportando...' : 'Exportar'}
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold drop-shadow-lg">Importar Dados</p>
              <p className="text-zinc-300 font-medium text-sm">Restaure dados de um backup anterior</p>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors cursor-pointer">
              {isImporting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isImporting ? 'Importando...' : 'Importar'}
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                disabled={isImporting}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-400 mb-4">Zona de Perigo</h3>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold drop-shadow-lg">Excluir Conta</p>
            <p className="text-zinc-300 font-medium text-sm">Remove permanentemente todos os seus dados</p>
          </div>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir Conta
          </button>
        </div>
      </div>

      {/* Modal de Exclusão de Conta */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-red-400">⚠️ Excluir Conta</h3>
              <button 
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmation('')
                  setDeletePassword('')
                  setError('')
                }}
                className="text-zinc-300 font-medium hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-300 text-sm">
                  <strong>Atenção!</strong> Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos, incluindo:
                </p>
                <ul className="mt-2 text-red-300/80 text-sm list-disc list-inside">
                  <li>Todas as transações</li>
                  <li>Todas as metas</li>
                  <li>Todos os investimentos</li>
                  <li>Configurações e preferências</li>
                </ul>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">
                  Digite <span className="text-red-400 font-bold">EXCLUIR MINHA CONTA</span> para confirmar:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-red-500/50"
                  placeholder="EXCLUIR MINHA CONTA"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium text-sm font-medium mb-2">
                  Digite sua senha:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-zinc-400 focus:outline-none focus:border-red-500/50"
                  placeholder="Sua senha"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false)
                    setDeleteConfirmation('')
                    setDeletePassword('')
                    setError('')
                  }}
                  className="flex-1 px-4 py-3 bg-zinc-700 text-white rounded-xl hover:bg-zinc-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmation !== 'EXCLUIR MINHA CONTA' || !deletePassword}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Excluindo...' : 'Excluir Permanentemente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return renderProfileSection()
      case 'notifications': return renderNotificationsSection()
      case 'reports': return renderReportsSection()
      case 'security': return renderSecuritySection()
      case 'appearance': return renderAppearanceSection()
      case 'data': return renderDataSection()
      default: return renderProfileSection()
    }
  }

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: -1 }}>
        <SimpleBackground />
      </div>
      <div className="min-h-screen relative space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-zinc-300 font-medium" />
          Configurações
        </h1>
        <p className="text-zinc-300 font-medium">Gerencie suas preferências e configurações da conta</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-4">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id)
                      setError('')
                      setSuccess('')
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                      activeSection === section.id
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'text-zinc-300 font-medium hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {section.name}
                  </button>
                )
              })}
            </nav>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-3"
        >
          <div className="bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl p-6">
            <h2 className="text-xl font-bold drop-shadow-lg text-white mb-6">
              {sections.find(s => s.id === activeSection)?.name}
            </h2>
            {loadingSettings ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </motion.div>
      </div>
    </div>
    </>
  )
}
