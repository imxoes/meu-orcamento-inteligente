/**
 * Utilitários para integração com WhatsApp via EditaCódigo API
 */

const EDITA_CODIGO_API_URL = process.env.EDITA_CODIGO_API_URL || 'https://api.editacodigo.com.br'
const EDITA_CODIGO_API_KEY = process.env.EDITA_CODIGO_API_KEY

/**
 * Envia uma mensagem de texto via WhatsApp
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!EDITA_CODIGO_API_KEY) {
    console.error('❌ EDITA_CODIGO_API_KEY não configurado!')
    console.error('💡 Configure a variável de ambiente EDITA_CODIGO_API_KEY no Vercel')
    return { success: false, error: 'API Key não configurada. Configure EDITA_CODIGO_API_KEY no Vercel.' }
  }

  try {
    // Formatar número (remover caracteres especiais, adicionar código do país se necessário)
    const formattedNumber = formatPhoneNumber(phoneNumber)

    console.log(`📤 Enviando mensagem WhatsApp para ${formattedNumber}`)
    console.log(`📡 URL da API: ${EDITA_CODIGO_API_URL}/send-message`)
    console.log(`📝 Mensagem (primeiros 100 chars):`, message.substring(0, 100))

    // Chamada para API da EditaCódigo
    // Nota: A estrutura exata da API pode variar, ajustar conforme documentação
    // Tentando múltiplos formatos possíveis
    const requestBody = {
      number: formattedNumber,
      message: message,
      text: message,
      type: 'text',
      phone: formattedNumber
    }

    console.log(`📦 Request body:`, JSON.stringify(requestBody, null, 2))

    // Criar AbortController para timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos

    let response: Response
    try {
      response = await fetch(`${EDITA_CODIGO_API_URL}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EDITA_CODIGO_API_KEY}`,
          'X-API-Key': EDITA_CODIGO_API_KEY,
          'apikey': EDITA_CODIGO_API_KEY
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ Timeout ao conectar com a API (30s)')
        return { 
          success: false, 
          error: 'Timeout ao conectar com a API da EditaCódigo. Verifique se a URL está correta e se a API está acessível.' 
        }
      }
      
      if (fetchError.code === 'ENOTFOUND' || fetchError.code === 'ECONNREFUSED') {
        console.error('❌ Não foi possível conectar com a API:', fetchError.message)
        return { 
          success: false, 
          error: `Não foi possível conectar com a API: ${EDITA_CODIGO_API_URL}. Verifique se a URL está correta e se a API está online.` 
        }
      }
      
      throw fetchError // Re-throw para ser capturado pelo catch externo
    }

    console.log(`📥 Response status: ${response.status} ${response.statusText}`)

    let result: any
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      result = await response.json()
    } else {
      const text = await response.text()
      console.log(`📥 Response text:`, text)
      result = { message: text, status: response.status }
    }

    console.log(`📥 Response body:`, JSON.stringify(result, null, 2))

    if (!response.ok) {
      console.error('❌ Erro ao enviar mensagem WhatsApp:')
      console.error('   Status:', response.status)
      console.error('   Response:', result)
      return { 
        success: false, 
        error: result.message || result.error || `Erro HTTP ${response.status}: ${JSON.stringify(result)}` 
      }
    }

    console.log('✅ Mensagem WhatsApp enviada com sucesso')
    return { success: true }
  } catch (error: any) {
    console.error('❌ Exceção ao enviar mensagem WhatsApp:', error)
    console.error('   Tipo:', error.name)
    console.error('   Código:', error.code)
    console.error('   Mensagem:', error.message)
    console.error('   Stack:', error.stack)
    
    let errorMessage = 'Erro desconhecido ao conectar com a API'
    
    if (error.message?.includes('fetch failed')) {
      errorMessage = `Erro de conexão: Não foi possível conectar com ${EDITA_CODIGO_API_URL}. Verifique:\n1. Se a URL está correta\n2. Se a API está online\n3. Se há problemas de rede/firewall`
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return { success: false, error: errorMessage }
  }
}

/**
 * Formata número de telefone para o formato esperado pela API
 * Remove caracteres especiais e mantém formato internacional (E.164)
 * Aceita números de qualquer país do mundo
 */
function formatPhoneNumber(phone: string): string {
  // Remove todos os caracteres não numéricos (incluindo +)
  let cleaned = phone.replace(/\D/g, '')

  // Validação básica: números devem ter código do país
  // E.164 permite 7-15 dígitos (incluindo código do país)
  if (cleaned.length < 7 || cleaned.length > 15) {
    throw new Error('Número de telefone inválido. Use formato internacional com código do país.')
  }

  // Retorna o número limpo (já deve incluir código do país)
  // Exemplos válidos:
  // - Brasil: 5511999999999 (55 + 11 + 999999999)
  // - EUA: 16505044380 (1 + 650 + 5044380)
  // - Reino Unido: 447911123456 (44 + 7911 + 123456)
  return cleaned
}

/**
 * Valida se um número de telefone é válido (formato internacional E.164)
 * Aceita números de qualquer país do mundo
 */
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  // E.164: números devem ter 7-15 dígitos (incluindo código do país)
  // Exemplos:
  // - EUA: 16505044380 (11 dígitos)
  // - Brasil: 5511999999999 (13 dígitos)
  // - Reino Unido: 447911123456 (12 dígitos)
  return cleaned.length >= 7 && cleaned.length <= 15
}

