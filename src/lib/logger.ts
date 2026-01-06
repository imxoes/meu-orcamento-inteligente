/**
 * Logger estruturado com sanitização de dados sensíveis
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogData {
  message: string
  level: LogLevel
  timestamp: string
  userId?: string
  endpoint?: string
  method?: string
  statusCode?: number
  duration?: number
  error?: string
  stack?: string
  metadata?: Record<string, any>
}

// Lista de campos sensíveis que devem ser mascarados
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'jwt',
  'email',
  'phone',
  'cpf',
  'cnpj',
  'telegramId',
  'whatsappId'
]

/**
 * Sanitiza objeto removendo/mascarando dados sensíveis
 */
function sanitizeData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item))
  }

  const sanitized: any = {}

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()

    // Mascarar campos sensíveis
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '***'
      continue
    }

    // Mascarar valores que parecem tokens/passwords
    if (typeof value === 'string') {
      // JWT tokens (começam com eyJ)
      if (value.startsWith('eyJ')) {
        sanitized[key] = 'jwt_***'
        continue
      }

      // Senhas hasheadas (bcrypt)
      if (value.startsWith('$2b$') || value.startsWith('$2a$')) {
        sanitized[key] = 'hash_***'
        continue
      }

      // Tokens longos (>32 caracteres alfanuméricos)
      if (value.length > 32 && /^[a-zA-Z0-9+/=_-]+$/.test(value)) {
        sanitized[key] = 'token_***'
        continue
      }
    }

    // Recursão para objetos aninhados
    sanitized[key] = sanitizeData(value)
  }

  return sanitized
}

/**
 * Logger principal
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private formatLog(data: LogData): string {
    if (this.isDevelopment) {
      // Log simples para desenvolvimento
      return `[${data.level.toUpperCase()}] ${data.message} ${data.metadata ? JSON.stringify(sanitizeData(data.metadata)) : ''}`
    }

    // Log estruturado para produção
    return JSON.stringify({
      ...data,
      metadata: data.metadata ? sanitizeData(data.metadata) : undefined
    })
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const logData: LogData = {
      message,
      level,
      timestamp: new Date().toISOString(),
      metadata: metadata ? sanitizeData(metadata) : undefined
    }

    const formattedLog = this.formatLog(logData)

    switch (level) {
      case 'error':
        console.error(formattedLog)
        break
      case 'warn':
        console.warn(formattedLog)
        break
      case 'info':
        console.info(formattedLog)
        break
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedLog)
        }
        break
    }
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, any>): void {
    const errorData = {
      ...metadata,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error && this.isDevelopment ? error.stack : undefined
    }

    this.log('error', message, errorData)
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata)
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata)
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata)
  }

  /**
   * Logger para requisições HTTP
   */
  http(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.log('info', `HTTP ${method} ${endpoint}`, {
      method,
      endpoint,
      statusCode,
      duration,
      userId,
      ...metadata
    })
  }
}

export const logger = new Logger()

/**
 * Middleware helper para capturar logs de requisição
 */
export function createRequestLogger() {
  return (req: any, startTime: number = Date.now()) => {
    return {
      end: (statusCode: number, userId?: string, metadata?: Record<string, any>) => {
        const duration = Date.now() - startTime
        logger.http(
          req.method || 'UNKNOWN',
          req.url || req.nextUrl?.pathname || '/unknown',
          statusCode,
          duration,
          userId,
          metadata
        )
      }
    }
  }
}