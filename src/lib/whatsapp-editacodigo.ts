/**
 * WhatsApp API EditaCódigo Integration
 * Modern TypeScript implementation for WhatsApp automation
 */

interface WhatsAppConfig {
  servidor: string
  porta: number
  token: string
}

interface WhatsAppMessage {
  telefone: string
  msg: string
  id_msg: string
}

interface WhatsAppMediaMessage extends WhatsAppMessage {
  url: string
  tipo: 'image' | 'video' | 'document' | 'audio'
}

interface WhatsAppEnquete {
  telefone: string
  enquete: {
    pergunta: string
    opcoes: string[]
  }
  id_msg: string
}

interface APIResponse {
  status: 'success' | 'error'
  message: string
  data?: any
}

class WhatsAppEditaCodigo {
  private config: WhatsAppConfig

  constructor(config: WhatsAppConfig) {
    this.config = config
  }

  private async makeRequest(action: string, data: any = {}): Promise<APIResponse> {
    const url = `http://${this.config.servidor}:${this.config.porta}/`

    const payload = {
      action,
      token: this.config.token,
      ...data
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('WhatsApp API Error:', error)
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Abre uma instância do WhatsApp (modo visual)
   */
  async abrirInstancia(userId: string): Promise<APIResponse> {
    return this.makeRequest('AbrirInstancia', { usuario: userId })
  }

  /**
   * Abre uma instância do WhatsApp em modo headless (terminal)
   */
  async abrirInstanciaTerminal(userId: string): Promise<APIResponse> {
    return this.makeRequest('AbrirInstanciaTerminal', { usuario: userId })
  }

  /**
   * Fecha a instância do WhatsApp
   */
  async fecharInstancia(userId: string): Promise<APIResponse> {
    return this.makeRequest('FecharInstancia', { usuario: userId })
  }

  /**
   * Gera QR Code para conexão do WhatsApp
   */
  async gerarQrCode(userId: string): Promise<APIResponse> {
    return this.makeRequest('GerarQrcode', { usuario: userId })
  }

  /**
   * Envia mensagem de texto simples
   */
  async enviarMensagem(userId: string, message: WhatsAppMessage): Promise<APIResponse> {
    return this.makeRequest('EnviarMsg', {
      usuario: userId,
      message
    })
  }

  /**
   * Envia mensagem com mídia (imagem, vídeo, documento, áudio)
   */
  async enviarMensagemMidia(userId: string, message: WhatsAppMediaMessage): Promise<APIResponse> {
    return this.makeRequest('EnviarMsgMidia', {
      usuario: userId,
      message
    })
  }

  /**
   * Cria e envia uma enquete
   */
  async criarEnquete(userId: string, enquete: WhatsAppEnquete): Promise<APIResponse> {
    return this.makeRequest('EscreverEnquete', {
      usuario: userId,
      message: enquete
    })
  }

  /**
   * Atualiza as classes globais do sistema
   */
  async atualizarClasses(userId: string = 'todos'): Promise<APIResponse> {
    return this.makeRequest('AtualizarClasses', { usuario: userId })
  }

  /**
   * Obtém status da instância
   */
  async obterStatus(userId: string): Promise<APIResponse> {
    return this.makeRequest('ObterStatus', { usuario: userId })
  }
}

// Singleton instance
let whatsappInstance: WhatsAppEditaCodigo | null = null

export function getWhatsAppInstance(): WhatsAppEditaCodigo {
  if (!whatsappInstance) {
    whatsappInstance = new WhatsAppEditaCodigo({
      servidor: process.env.WHATSAPP_SERVIDOR || 'localhost',
      porta: parseInt(process.env.WHATSAPP_PORTA || '5000'),
      token: process.env.WHATSAPP_TOKEN || 'ed9461ab4f865bebc28244e1a432b541'
    })
  }
  return whatsappInstance
}

export { WhatsAppEditaCodigo }
export type { WhatsAppConfig, WhatsAppMessage, WhatsAppMediaMessage, WhatsAppEnquete, APIResponse }