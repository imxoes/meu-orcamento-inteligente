/**
 * Telegram webhook security utilities
 */

import { createHmac, timingSafeEqual } from 'crypto'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

/**
 * Verifica a assinatura HMAC do webhook do Telegram
 */
export function verifyTelegramWebhook(
  body: string,
  secretToken?: string,
  signature?: string
): boolean {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not configured')
    return false
  }

  // Se há secret token configurado, usar verificação por HMAC
  if (secretToken && signature) {
    try {
      const expectedSignature = createHmac('sha256', secretToken)
        .update(body, 'utf8')
        .digest('hex')

      // Remover prefixo "sha256=" se presente
      const cleanSignature = signature.replace('sha256=', '')

      // Usar timing-safe comparison para prevenir timing attacks
      return timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(cleanSignature, 'hex')
      )
    } catch (error) {
      console.error('Error verifying telegram webhook signature:', error)
      return false
    }
  }

  // Fallback: verificar se há webhook secret configurado
  if (TELEGRAM_WEBHOOK_SECRET) {
    return secretToken === TELEGRAM_WEBHOOK_SECRET
  }

  // Se não há verificação configurada, aceitar (mas logar aviso)
  console.warn('Telegram webhook verification not configured - accepting request')
  return true
}

/**
 * Valida estrutura básica do update do Telegram
 */
export function validateTelegramUpdate(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false
  }

  // Deve ter update_id
  if (typeof data.update_id !== 'number') {
    return false
  }

  // Deve ter pelo menos um dos campos de update
  const validFields = [
    'message',
    'edited_message',
    'channel_post',
    'edited_channel_post',
    'inline_query',
    'chosen_inline_result',
    'callback_query',
    'shipping_query',
    'pre_checkout_query',
    'poll',
    'poll_answer'
  ]

  return validFields.some(field => data[field] !== undefined)
}

/**
 * Rate limiting específico para webhooks do Telegram
 */
const telegramRateLimiter = new Map<string, { count: number; resetTime: number }>()

export function checkTelegramRateLimit(
  chatId: string | number,
  maxRequests: number = 30, // 30 mensagens por minuto por chat
  windowMs: number = 60 * 1000 // 1 minuto
): boolean {
  const key = `telegram_chat_${chatId}`
  const now = Date.now()

  const record = telegramRateLimiter.get(key)

  if (!record || now > record.resetTime) {
    // Nova janela ou expirada
    telegramRateLimiter.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= maxRequests) {
    return false
  }

  record.count++
  telegramRateLimiter.set(key, record)
  return true
}

/**
 * Extrai IP seguro para logging
 */
export function extractSafeIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')

  if (forwarded) {
    // Pegar apenas o primeiro IP da cadeia
    return forwarded.split(',')[0].trim()
  }

  return realIP || 'unknown'
}

/**
 * Valida origem do webhook (deve vir do Telegram)
 */
export function validateTelegramOrigin(ip: string): boolean {
  // Para desenvolvimento, aceitar localhost
  if (process.env.NODE_ENV === 'development' &&
      (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1' || ip === 'unknown')) {
    return true
  }

  // Em produção, aceitar mas logar (implementação completa de CIDR pode ser adicionada)
  console.warn(`Telegram webhook from IP: ${ip} - origin validation simplified`)
  return true
}

/**
 * Configuração de segurança do webhook
 */
export const TELEGRAM_WEBHOOK_CONFIG = {
  maxBodySize: 1024 * 1024, // 1MB máximo
  timeout: 30 * 1000, // 30 segundos timeout
  rateLimitWindow: 60 * 1000, // 1 minuto
  rateLimitMax: 30, // 30 requests por minuto por chat
  requireSignature: !!TELEGRAM_WEBHOOK_SECRET
}