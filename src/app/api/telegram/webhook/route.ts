import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

interface TelegramMessage {
  message_id: number
  from: {
    id: number
    first_name: string
    username?: string
  }
  chat: {
    id: number
    type: string
  }
  text: string
  date: number
}

interface TelegramUpdate {
  update_id: number
  message: TelegramMessage
}

// Função para enviar mensagem de volta
async function sendMessage(chatId: number, text: string, replyToMessageId?: number) {
  // 🚨 VALIDAÇÃO OBRIGATÓRIA DO TOKEN
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN NÃO DEFINIDO!")
    return { ok: false, error: "Token não configurado" }
  }

  console.log(`📤 ENVIANDO MENSAGEM para chat ${chatId}:`, text.substring(0, 100) + '...')

  const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_to_message_id: replyToMessageId
    })
  })

  const result = await response.json()
  console.log("📬 RESPOSTA TELEGRAM API:", result)

  if (!result.ok) {
    console.error("❌ FALHA AO ENVIAR MENSAGEM:", result)
  }

  return result
}

// Função para processar receita natural
function parseIncomeMessage(message: string): { amount: number; description: string; category: string } | null {
  const lowerMessage = message.toLowerCase()
  
  // Verificar se contém palavras-chave de receita
  const incomeKeywords = ['recebi', 'ganhei', 'entrada', 'salário', 'salario', 'renda', 'pagamento recebido', 'depositei']
  const hasIncomeKeyword = incomeKeywords.some(keyword => lowerMessage.includes(keyword))
  
  if (!hasIncomeKeyword) {
    return null
  }

  // Função auxiliar para normalizar números (lidar com pontos como separadores de milhar)
  const normalizeNumber = (numStr: string): number => {
    // Remove espaços
    numStr = numStr.trim().replace(/\s/g, '')
    
    // Se tem vírgula, assume formato brasileiro: 30.000,50 = 30000.50
    if (numStr.includes(',')) {
      // Remove pontos (separadores de milhar) e substitui vírgula por ponto
      return parseFloat(numStr.replace(/\./g, '').replace(',', '.'))
    }
    
    // Se tem ponto mas não vírgula, pode ser:
    // - 30.000 (separador de milhar) = 30000
    // - 30.50 (decimal) = 30.50
    if (numStr.includes('.')) {
      const parts = numStr.split('.')
      // Se a última parte tem 3 dígitos, provavelmente é separador de milhar
      if (parts.length === 2 && parts[1].length === 3 && !parts[1].includes(',')) {
        // É separador de milhar: 30.000
        return parseFloat(parts.join(''))
      } else {
        // É decimal: 30.50
        return parseFloat(numStr)
      }
    }
    
    // Apenas números
    return parseFloat(numStr)
  }

  // Padrões melhorados para capturar receitas
  const patterns = [
    // "recebi 30000 de salário", "ganhei 30.000 de salario"
    /(?:recebi|ganhei|entrada|depositei)\s+(\d+(?:[.,]\d+)?)\s*(?:reais?)?\s*(?:de|do|da)?\s*(.+)?/i,
    // "recebi salário de 30000", "recebi meu salario de 30.000 reais"
    /(?:recebi|ganhei|entrada|depositei)\s+(?:meu|minha|o|a)?\s*(.+?)\s*(?:de|do|da)?\s*(\d+(?:[.,]\d+)?)\s*(?:reais?)?/i,
    // "30000 de salário recebi", "30.000 ganhei"
    /(\d+(?:[.,]\d+)?)\s*(?:reais?)?\s*(?:de|do|da)?\s*(.+)?\s*(?:recebi|ganhei|entrada)/i,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      let amount: number | null = null
      let description: string = 'Receita'

      // Tentar extrair o valor dos grupos de captura
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          const normalized = normalizeNumber(match[i])
          if (!isNaN(normalized) && normalized > 0) {
            amount = normalized
            // A descrição é o próximo grupo que não é número
            if (i + 1 < match.length && match[i + 1] && isNaN(parseFloat(match[i + 1]))) {
              description = match[i + 1].trim()
            } else if (i > 1 && match[i - 1] && isNaN(parseFloat(match[i - 1]))) {
              description = match[i - 1].trim()
            }
            break
          }
        }
      }

      if (amount && amount > 0) {
        // Descrição: usar a descrição do cliente ou "Receita" se não houver
        const finalDescription = description && description.trim() !== '' ? description.trim() : 'Receita'
        
        // Categorização: Salário se mencionar salário, senão "Outras Receitas"
        const category = categorizeIncome(finalDescription || lowerMessage)
        
        console.log(`✅ Receita detectada: R$ ${amount.toFixed(2)} - ${finalDescription} - ${category}`)
        return { amount, description: finalDescription, category }
      }
    }
  }

  // Fallback: tentar extrair qualquer número grande na mensagem
  const numberMatches = message.match(/(\d+(?:[.,]\d+)?)/g)
  if (numberMatches && hasIncomeKeyword) {
    // Pegar o maior número encontrado (provavelmente é o valor)
    const amounts = numberMatches.map(n => normalizeNumber(n)).filter(n => !isNaN(n) && n > 0)
    if (amounts.length > 0) {
      const amount = Math.max(...amounts)
      // Tentar extrair descrição do resto da mensagem
      const description = message.replace(/(\d+(?:[.,]\d+)?)/g, '').trim() || 'Receita'
      const category = categorizeIncome(description || lowerMessage)
      console.log(`✅ Receita detectada (fallback): R$ ${amount.toFixed(2)} - ${description} - ${category}`)
      return { amount, description: description || 'Receita', category }
    }
  }

  return null
}

// Função auxiliar para normalizar números (mesma da parseIncomeMessage)
function normalizeNumber(numStr: string): number {
  numStr = numStr.trim().replace(/\s/g, '')
  
  // Se tem vírgula, assume formato brasileiro: 30.000,50 = 30000.50
  if (numStr.includes(',')) {
    return parseFloat(numStr.replace(/\./g, '').replace(',', '.'))
  }
  
  // Se tem ponto mas não vírgula
  if (numStr.includes('.')) {
    const parts = numStr.split('.')
    // Se a última parte tem 3 dígitos, provavelmente é separador de milhar
    if (parts.length === 2 && parts[1].length === 3 && !parts[1].includes(',')) {
      return parseFloat(parts.join(''))
    } else {
      return parseFloat(numStr)
    }
  }
  
  return parseFloat(numStr)
}

// Função para processar gasto natural
async function parseExpenseMessage(message: string): Promise<{ amount: number; description: string; category: string } | null> {
  const lowerMessage = message.toLowerCase()
  
  // Verificar se contém palavras-chave de gasto (mais abrangente)
  const expenseKeywords = ['gastei', 'gasto', 'paguei', 'pago', 'comprei', 'compra', 'gastar', 'pagar', 'comprar']
  const hasExpenseKeyword = expenseKeywords.some(keyword => lowerMessage.includes(keyword))
  
  // Padrões melhorados para capturar gastos (mais flexíveis)
  const patterns = [
    // "50 uber", "25.90 supermercado", "100 gasolina", "25000 carro"
    /^(\d+(?:[.,]\d+)?)\s+(.+)$/,
    // "gastei 50 em uber", "gastei 25.90 no supermercado", "gastei 25000"
    /(?:gastei|gasto|paguei|pago)\s+(\d+(?:[.,]\d+)?)\s*(?:em|no|na|com|de|do|da)?\s*(.+)?$/i,
    // "paguei 50 de uber", "paguei 25.90 supermercado"
    /(?:paguei|pago)\s+(\d+(?:[.,]\d+)?)\s*(?:de|do|da|em|no|na)?\s*(.+)?$/i,
    // "comprei carro 25000", "comprei 25000 carro", "comprei carro por 25000"
    /(?:comprei|compra)\s+(?:um|uma|o|a)?\s*(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:reais?)?$/i,
    /(?:comprei|compra)\s+(\d+(?:[.,]\d+)?)\s*(?:reais?)?\s*(?:em|de|do|da|por)?\s*(.+)?$/i,
    /(?:comprei|compra)\s+(?:um|uma|o|a)?\s*(.+?)\s+(?:por|de)\s+(\d+(?:[.,]\d+)?)\s*(?:reais?)?$/i,
    // "carro 25000", "uber 50" (sem verbo, só objeto + valor)
    /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*(?:reais?)?$/,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      let amount: number | null = null
      let description: string = 'Gasto'

      // Tentar extrair valor e descrição dos grupos
      for (let i = 1; i < match.length; i++) {
        if (match[i]) {
          const normalized = normalizeNumber(match[i])
          if (!isNaN(normalized) && normalized > 0) {
            amount = normalized
            // A descrição é o outro grupo que não é número
            if (i + 1 < match.length && match[i + 1] && isNaN(normalizeNumber(match[i + 1]))) {
              description = match[i + 1].trim()
            } else if (i > 1 && match[i - 1] && isNaN(normalizeNumber(match[i - 1]))) {
              description = match[i - 1].trim()
            }
            break
          }
        }
      }

      // Se encontrou valor mas não descrição, tentar extrair do resto da mensagem
      if (amount && amount > 0 && (!description || description === 'Gasto')) {
        // Remover o valor da mensagem e pegar o resto como descrição
        const withoutAmount = message.replace(new RegExp(`\\d+(?:[.,]\\d+)?`, 'g'), '').trim()
        const withoutVerbs = withoutAmount.replace(/\b(?:gastei|gasto|paguei|pago|comprei|compra|em|no|na|com|de|do|da|por|reais?|real)\b/gi, '').trim()
        if (withoutVerbs.length > 0) {
          description = withoutVerbs
        }
      }

      // Limpar descrição: remover "reais", "real", "reas" e variações que podem ter ficado
      if (description) {
        description = description
          .replace(/\b(?:reais?|real|reas)\b/gi, '') // Remove reais, real, reas
          .replace(/^\s+|\s+$/g, '') // Remove espaços no início e fim
          .replace(/\s+/g, ' ') // Normaliza múltiplos espaços em um só
          .trim()
        
        // Se após limpar ficou vazio ou só espaços, usar "Gasto"
        if (!description || description.length < 2) {
          description = 'Gasto'
        }
      }

      if (amount && amount > 0) {
        // Categorização automática (tenta palavras-chave primeiro, depois OpenAI)
        const category = await categorizeExpense(description || lowerMessage, amount)
        console.log(`✅ Gasto detectado: R$ ${amount.toFixed(2)} - ${description} - ${category}`)
        return { amount, description: description || 'Gasto', category }
      }
    }
  }

  // Fallback: se tem palavra de gasto, tentar extrair qualquer número grande
  if (hasExpenseKeyword) {
    const numberMatches = message.match(/(\d+(?:[.,]\d+)?)/g)
    if (numberMatches) {
      const amounts = numberMatches.map(n => normalizeNumber(n)).filter(n => !isNaN(n) && n > 0)
      if (amounts.length > 0) {
        const amount = Math.max(...amounts)
        // Tentar extrair descrição removendo números e verbos comuns
        let description = message
          .replace(/\d+(?:[.,]\d+)?/g, '')
          .replace(/\b(?:gastei|gasto|paguei|pago|comprei|compra|em|no|na|com|de|do|da|por|reais?|real|reas)\b/gi, '')
          .trim()
        
        // Limpar descrição: remover "reais", "real", "reas" e variações que podem ter ficado
        if (description) {
          description = description
            .replace(/\b(?:reais?|real|reas)\b/gi, '') // Remove reais, real, reas
            .replace(/^\s+|\s+$/g, '') // Remove espaços no início e fim
            .replace(/\s+/g, ' ') // Normaliza múltiplos espaços em um só
            .trim()
        }
        
        if (!description || description.length < 2) {
          description = 'Gasto'
        }
        
        const category = await categorizeExpense(description, amount)
        console.log(`✅ Gasto detectado (fallback): R$ ${amount.toFixed(2)} - ${description} - ${category}`)
        return { amount, description, category }
      }
    }
  }

  return null
}

// Função para categorizar receitas automaticamente
function categorizeIncome(description: string): string {
  const lowerDescription = description.toLowerCase()
  
  // Se mencionar salário, sempre categorizar como Salário
  const salaryKeywords = ['salário', 'salario', 'sal', 'renda fixa', 'pagamento mensal']
  if (salaryKeywords.some(keyword => lowerDescription.includes(keyword))) {
    return 'Salário'
  }

  // Caso contrário, sempre "Outras Receitas"
  return 'Outras Receitas'
}

// Função para categorizar gastos automaticamente com categorias mais específicas
async function categorizeExpense(description: string, amount?: number): Promise<string> {
  const lowerDescription = description.toLowerCase().trim()

  // PRIMEIRO: Verificar palavras-chave (mais confiável para palavras conhecidas)
  // Fallback: categorização por palavras-chave - EXPANDIDO E MELHORADO
  const specificCategories = {
    // TRANSPORTE (prioridade alta - gasolina, uber, etc)
    'Transporte': [
      'gasolina', 'combustível', 'combustivel', 'álcool', 'alcool', 'diesel', 'etanol',
      'uber', 'taxi', '99', 'cabify', 'in drive', 'uber x', 'uber black', 'uber comfort',
      'ônibus', 'onibus', 'bus', 'metro', 'metrô', 'trem', 'subway', 'transporte público',
      'estacionamento', 'parking', 'pedágio', 'pedagio', 'ipva', 'licenciamento',
      'manutenção carro', 'manutencao carro', 'oficina', 'pneu', 'pneus', 'revisão', 'revisao'
    ],
    
    // REFEIÇÃO (comida, restaurante, delivery, padaria, supermercado)
    'Refeição': [
      // Delivery/Apps
      'ifood', 'uber eats', 'rappi', 'i food', 'ifood.com', 'delivery', 'delivery de comida',
      // Supermercado/Mercado
      'supermercado', 'mercado', 'atacadão', 'atacado', 'extra', 'carrefour', 'walmart', 
      'big', 'pao de acucar', 'pao de açúcar', 'assai', 'atacadao', 'hipermercado',
      // Padaria
      'padaria', 'padaria e confeitaria', 'pão', 'pao', 'salgado', 'salgados', 'pão doce', 
      'confeitaria', 'coxinha', 'pastel', 'pão de queijo', 'pao de queijo', 'croissant',
      // Restaurante/Lanches
      'restaurante', 'lanchonete', 'lanche', 'fast food', 'mcdonalds', 'burger king', 
      'subway', 'habibs', 'bobs', 'giraffas', 'outback', 'applebees',
      // Comida específica
      'pizza', 'hambúrguer', 'hamburger', 'sanduíche', 'sanduiche', 'sanduiche', 'x-burger',
      'prato feito', 'prato', 'marmita', 'comida caseira', 'self service',
      // Café
      'café', 'cafe', 'cafeteria', 'starbucks', 'café da manhã', 'cafe da manha', 
      'café da tarde', 'cafe da tarde', 'cappuccino', 'expresso',
      // Alimentação genérica
      'comida', 'almoço', 'almoco', 'jantar', 'café da manhã', 'refeição', 'refeicao',
      'açúcar', 'acucar', 'açucar', 'açucar', 'açucar', 'açucar'
    ],
    
    // BENS (compras de bens duráveis - casa, carro, eletrônicos, etc)
    'Bens': [
      'casa', 'apartamento', 'apto', 'imóvel', 'imovel', 'terreno', 'lote',
      'carro', 'automóvel', 'automovel', 'veículo', 'veiculo', 'moto', 'motocicleta',
      'bicicleta', 'bike', 'patinete', 'patinete elétrico',
      'geladeira', 'fogão', 'fogao', 'microondas', 'máquina de lavar', 'maquina de lavar',
      'tv', 'televisão', 'televisao', 'notebook', 'computador', 'celular', 'smartphone',
      'tablet', 'iphone', 'samsung', 'xiaomi', 'motorola',
      'móvel', 'movel', 'mobília', 'mobilia', 'sofá', 'sofa', 'cama', 'mesa', 'cadeira',
      'frigobar', 'freezer', 'ar condicionado', 'ventilador', 'aspirador',
      'ferramenta', 'ferramentas', 'equipamento', 'equipamentos'
    ],
    
    // MORADIA (contas e serviços da casa)
    'Moradia': [
      'aluguel', 'aluguel casa', 'aluguel apartamento', 'condomínio', 'condominio',
      'luz', 'energia', 'energia elétrica', 'energia eletrica', 'conta de luz',
      'água', 'agua', 'conta de água', 'conta de agua', 'saneamento',
      'gás', 'gas', 'gás natural', 'gas natural', 'botijão', 'botijao',
      'internet', 'wi-fi', 'wifi', 'fibra ótica', 'fibra optica',
      'telefone', 'telefonia', 'celular', 'plano celular',
      'iptu', 'iptu', 'taxa de lixo', 'coleta de lixo'
    ],
    
    // SAÚDE
    'Saúde': [
      'farmácia', 'farmacia', 'drogaria', 'farmácia popular', 'farmacia popular',
      'médico', 'medico', 'doutor', 'doutora', 'clínico geral', 'clinico geral',
      'dentista', 'odontologista', 'ortodontista',
      'exame', 'exames', 'consulta', 'consultas', 'check-up', 'checkup',
      'remédio', 'remedio', 'medicamento', 'medicamentos', 'remédios', 'remedios',
      'plano de saúde', 'plano de saude', 'convênio', 'convenio', 'unimed', 'amil',
      'hospital', 'clínica', 'clinica', 'laboratório', 'laboratorio', 'vacina', 'vacinas',
      'fisioterapia', 'psicólogo', 'psicologo', 'nutricionista', 'psiquiatra',
      'fralda', 'fraldas', 'leite', 'leite em pó', 'leite em po', 'fórmula', 'formula',
      // Academia e exercícios
      'academia', 'personal trainer', 'ginásio', 'ginasio', 'yoga', 'pilates', 'crossfit',
      'natação', 'natacao', 'musculação', 'musculacao', 'treino', 'treinos',
      'roupa de academia', 'equipamento de academia',
      // Suplementos
      'suplemento', 'suplementos', 'whey protein', 'whey', 'creatina',
      'pré-treino', 'pre-treino', 'pós-treino', 'pos-treino', 'bcaa', 'vitamina', 'vitaminas',
      'proteína', 'proteina', 'multivitamínico', 'multivitaminico',
      // Terapia
      'terapia', 'terapias', 'psicoterapia', 'terapeuta', 'terapeutas'
    ],
    
    // EDUCAÇÃO
    'Educação': [
      'curso', 'cursos', 'livro', 'livros', 'escola', 'faculdade', 'universidade',
      'aula', 'aulas', 'material escolar', 'mensalidade', 'mensalidade escola',
      'mensalidade faculdade', 'matrícula', 'matricula', 'uniforme', 'material didático'
    ],
    
    // ENTRETENIMENTO
    'Entretenimento': [
      'cinema', 'netflix', 'spotify', 'disney+', 'prime video', 'hbo', 'hbo max',
      'streaming', 'jogo', 'jogos', 'playstation', 'xbox', 'nintendo',
      'show', 'shows', 'concerto', 'festa', 'festas', 'bar', 'balada', 'boate',
      'ingresso', 'ingressos', 'evento', 'eventos', 'festival'
    ],
    
    // COMPRAS (roupas, acessórios, presentes)
    'Compras': [
      'roupa', 'roupas', 'vestido', 'camisa', 'calça', 'calca', 'sapato', 'sapatos',
      'tênis', 'tenis', 'bolsa', 'bolsas', 'mochila', 'acessório', 'acessorios',
      'shopping', 'amazon', 'mercado livre', 'magazine luiza', 'casas bahia',
      'americanas', 'submarino', 'kabum', 'presente', 'presentes', 'loja', 'lojas',
      'eletrônicos', 'eletronicos', 'perfume', 'perfumes', 'cosméticos', 'cosmeticos'
    ],
    
    // SERVIÇOS
    'Serviços': [
      'serviço', 'servico', 'serviços', 'servicos', 'prestação de serviço',
      'pintura', 'pintor', 'eletricista', 'encanador', 'pedreiro', 'marceneiro',
      'limpeza', 'faxina', 'diarista', 'manutenção', 'manutencao', 'reparo', 'reparos',
      'instalação', 'instalacao', 'montagem', 'conserto', 'consertos'
    ],
    
    // PESSOAL
    'Pessoal': [
      'cabelo', 'cabeleireiro', 'cabeleireira', 'barbearia', 'barbeiro', 'corte de cabelo',
      'unha', 'unhas', 'manicure', 'pedicure', 'estética', 'estetica', 'spa'
    ],
    
    // OUTROS (fallback)
    'Outros': [
      'cigarro', 'cigarrilha', 'cigarrilhas', 'cigarros', 'tabaco', 'charuto', 'charutos',
      'narguilé', 'narguile', 'vape', 'pod', 'cigarro eletrônico', 'cigarro eletronico'
    ]
  }

  // Verificar categorias específicas primeiro (ordem importa - mais específicas primeiro)
  // Ordem de prioridade: Transporte > Refeição > Bens > Moradia > Saúde > Educação > Entretenimento > Compras > Serviços > Pessoal
  const categoryOrder = ['Transporte', 'Refeição', 'Bens', 'Moradia', 'Saúde', 'Educação', 'Entretenimento', 'Compras', 'Serviços', 'Pessoal', 'Outros']
  
  for (const category of categoryOrder) {
    const keywords = specificCategories[category as keyof typeof specificCategories]
    if (keywords && keywords.some(keyword => lowerDescription.includes(keyword))) {
      console.log(`✅ Categoria encontrada por palavras-chave: ${category} (palavra: "${description}")`)
      return category
    }
  }

  // Se não encontrou por palavras-chave, tentar usar IA (se disponível)
  try {
    const { categorizeExpenseWithAI } = await import('@/lib/openai-utils')
    const aiResult = await categorizeExpenseWithAI(description, amount)
    if (aiResult && aiResult.category && aiResult.category !== 'Outros') {
      // Normalizar categoria retornada pela IA
      let normalizedCategory = aiResult.category
      
      // Mapear categorias da IA para nossas categorias
      const categoryMapping: Record<string, string> = {
        'Delivery': 'Refeição',
        'Supermercado': 'Refeição',
        'Padaria': 'Refeição',
        'Restaurante': 'Refeição',
        'Café': 'Refeição',
        'Alimentação': 'Refeição',
        'Comida': 'Refeição'
      }
      
      if (categoryMapping[normalizedCategory]) {
        normalizedCategory = categoryMapping[normalizedCategory]
      }
      
      console.log(`🤖 Categoria sugerida pela IA: ${aiResult.category} -> ${normalizedCategory}`)
      return normalizedCategory
    }
  } catch (error) {
    console.log('OpenAI não disponível ou retornou "Outros"')
  }

  return 'Outros'
}

// Função para processar consultas de insights
function parseQueryMessage(message: string): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes('saldo') || lowerMessage.includes('quanto tenho')) {
    return 'saldo'
  }

  if (lowerMessage.includes('gastos') && (lowerMessage.includes('mês') || lowerMessage.includes('mensal'))) {
    return 'gastos_mes'
  }

  if (lowerMessage.includes('gastos') && lowerMessage.includes('semana')) {
    return 'gastos_semana'
  }

  if (lowerMessage.includes('categoria') || lowerMessage.includes('onde mais gasto')) {
    return 'categoria_mais_gasto'
  }

  if (lowerMessage.includes('meta') || lowerMessage.includes('objetivo')) {
    return 'metas'
  }

  if (lowerMessage.includes('relatório') || lowerMessage.includes('resumo')) {
    return 'relatorio'
  }

  if (lowerMessage.includes('dica') || lowerMessage.includes('conselho')) {
    return 'dicas'
  }

  return 'ajuda'
}

// Função para gerar respostas baseadas em dados reais
async function generateInsightResponse(queryType: string, userId: string): Promise<string> {
  try {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { telegramId: userId }
    })

    if (!user) {
      return `❌ Usuário não encontrado. Digite /start para começar.`
    }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    switch (queryType) {
      case 'saldo':
        const [expenses, income] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId: user.id,
              type: 'EXPENSE',
              createdAt: { gte: startOfMonth }
            },
            _sum: { amount: true }
          }),
          prisma.transaction.aggregate({
            where: {
              userId: user.id,
              type: 'INCOME',
              createdAt: { gte: startOfMonth }
            },
            _sum: { amount: true }
          })
        ])

        const totalExpenses = expenses._sum.amount || 0
        const totalIncome = income._sum.amount || 0
        const balance = totalIncome - totalExpenses

        return `💰 Seu Resumo Financeiro\n\n` +
               `Receitas este mês: R$ ${totalIncome.toFixed(2)}\n` +
               `Gastos este mês: R$ ${totalExpenses.toFixed(2)}\n` +
               `Saldo: R$ ${balance.toFixed(2)}\n\n` +
               `${balance >= 0 ? '📊 Você está no positivo!' : '⚠️ Atenção aos gastos!'}`

      case 'gastos_mes':
        const monthlyExpenses = await prisma.transaction.findMany({
          where: {
            userId: user.id,
            type: 'EXPENSE',
            createdAt: { gte: startOfMonth }
          },
          include: { category: true }
        })

        const totalMonth = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0)

        // Agrupar por categoria
        const categoryTotals = monthlyExpenses.reduce((acc, transaction) => {
          const categoryName = transaction.category.name
          acc[categoryName] = (acc[categoryName] || 0) + transaction.amount
          return acc
        }, {} as Record<string, number>)

        // Top 3 categorias
        const topCategories = Object.entries(categoryTotals)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)

        let categoriesText = ''
        if (topCategories.length > 0) {
          categoriesText = '\n🏆 Maiores categorias:\n' +
            topCategories.map(([cat, amount]) => `• ${cat}: R$ ${amount.toFixed(2)}`).join('\n')
        }

        return `📊 Gastos do Mês\n\n` +
               `Total: R$ ${totalMonth.toFixed(2)}\n` +
               categoriesText

      case 'categoria_mais_gasto':
        const categoryExpenses = await prisma.transaction.findMany({
          where: {
            userId: user.id,
            type: 'EXPENSE',
            createdAt: { gte: startOfMonth }
          },
          include: { category: true }
        })

        if (categoryExpenses.length === 0) {
          return `📊 Análise por Categoria\n\n` +
                 `Ainda não há gastos registrados este mês.\n` +
                 `Comece registrando seus gastos para ver análises detalhadas!`
        }

        // Agrupar por categoria
        const categoryBreakdown = categoryExpenses.reduce((acc, transaction) => {
          const categoryName = transaction.category.name
          acc[categoryName] = (acc[categoryName] || 0) + transaction.amount
          return acc
        }, {} as Record<string, number>)

        const totalCategoryAmount = Object.values(categoryBreakdown).reduce((sum, amount) => sum + amount, 0)

        // Top 3 categorias
        const topCats = Object.entries(categoryBreakdown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([cat, amount], index) => {
            const percentage = ((amount / totalCategoryAmount) * 100).toFixed(1)
            const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'
            return `${emoji} ${cat}: R$ ${amount.toFixed(2)} (${percentage}%)`
          })

        return `🎯 Análise por Categoria\n\n` +
               topCats.join('\n') +
               `\n\n💡 Dica: Monitore suas maiores categorias de gastos!`

      case 'metas':
        const goals = await prisma.goal.findMany({
          where: { userId: user.id, status: 'ACTIVE' }
        })

        if (goals.length === 0) {
          return `🎯 Suas Metas\n\n` +
                 `Você ainda não tem metas definidas.\n` +
                 `Acesse o dashboard web para criar suas primeiras metas!`
        }

        const goalsText = goals.map(goal => {
          const progress = ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1)
          return `• ${goal.title}: ${progress}% (R$ ${goal.currentAmount.toFixed(2)}/${goal.targetAmount.toFixed(2)})`
        }).join('\n')

        return `🎯 Suas Metas\n\n${goalsText}\n\n🚀 Continue assim! Você está no caminho certo.`

      case 'dicas':
        // Dicas baseadas nos dados reais do usuário
        const recentTransactions = await prisma.transaction.findMany({
          where: {
            userId: user.id,
            type: 'EXPENSE',
            createdAt: { gte: startOfMonth }
          },
          include: { category: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        })

        if (recentTransactions.length === 0) {
          return `💡 Dica Inteligente\n\n` +
                 `🎯 Comece definindo um orçamento mensal\n\n` +
                 `Registre seus gastos diariamente para receber dicas personalizadas baseadas no seu perfil de consumo!`
        }

        // Análise simples para gerar dicas
        const alimentacaoGastos = recentTransactions.filter(t => t.category.name === 'Alimentação')

        if (alimentacaoGastos.length >= 3) {
          return `💡 Dica Inteligente\n\n` +
                 `🍽️ Você tem registrado muitos gastos com alimentação\n\n` +
                 `💡 Considere:\n` +
                 `• Cozinhar mais em casa\n` +
                 `• Fazer um planejamento semanal de refeições\n` +
                 `• Evitar pedidos por delivery\n\n` +
                 `Economia potencial: até 30% nos gastos com comida!`
        }

        return `💡 Dica Inteligente\n\n` +
               `📊 Continue registrando seus gastos!\n\n` +
               `Quanto mais você usar o sistema, melhores dicas personalizadas você receberá baseadas no seu perfil de consumo.`

      case 'relatorio':
        const [expensesAggregate, incomeAggregate] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId: user.id,
              type: 'EXPENSE',
              createdAt: { gte: startOfMonth }
            },
            _sum: { amount: true }
          }),
          prisma.transaction.aggregate({
            where: {
              userId: user.id,
              type: 'INCOME',
              createdAt: { gte: startOfMonth }
            },
            _sum: { amount: true }
          })
        ])

        const monthExpenses = expensesAggregate._sum.amount || 0
        const monthIncome = incomeAggregate._sum.amount || 0
        const savings = monthIncome - monthExpenses
        const savingsRate = monthIncome > 0 ? ((savings / monthIncome) * 100).toFixed(1) : '0'

        return `📈 Resumo Financeiro\n\n` +
               `🗓️ ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}\n\n` +
               `💰 Receitas: R$ ${monthIncome.toFixed(2)}\n` +
               `💸 Gastos: R$ ${monthExpenses.toFixed(2)}\n` +
               `💵 Saldo: R$ ${savings.toFixed(2)}\n\n` +
               `📊 Taxa de poupança: ${savingsRate}%\n\n` +
               `${parseFloat(savingsRate) >= 20 ? '🎉 Parabéns! Excelente controle financeiro.' : '💪 Continue se esforçando para economizar mais!'}`

      default:
        return `🤖 Como posso ajudar?\n\n` +
               `💰 Para registrar receitas:\n` +
               `• "recebi 1200 de salário"\n` +
               `• "ganhei 500 de freelance"\n` +
               `• "recebi meu salario de 1200 reais"\n\n` +
               `📝 Para registrar gastos:\n` +
               `• "50 uber"\n` +
               `• "25.90 supermercado"\n` +
               `• "gastei 100 em gasolina"\n\n` +
               `📊 Para consultas:\n` +
               `• "qual meu saldo?"\n` +
               `• "gastos do mês"\n` +
               `• "onde mais gasto?"\n` +
               `• "como estão minhas metas?"\n` +
               `• "me dê uma dica"`
    }
  } catch (error) {
    console.error('Error generating insight:', error)
    return '❌ Ops! Erro ao buscar informações. Tente novamente em alguns minutos.'
  }
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json()

    // 🚨 LOG FORÇADO DE UPDATE - OBRIGATÓRIO PARA DEBUG
    console.log("RAW UPDATE:", JSON.stringify(update, null, 2))
    console.log("BOT TOKEN PRESENT:", !!process.env.TELEGRAM_BOT_TOKEN)
    console.log("TELEGRAM_BOT_TOKEN length:", process.env.TELEGRAM_BOT_TOKEN?.length || 0)

    // ❌ REMOVIDO EARLY RETURN SILENCIOSO - ESTAVA DESCARTANDO MENSAGENS
    // if (!update.message) {
    //   return NextResponse.json({ ok: true })
    // }

    // Se não há message, ainda logamos e tentamos responder
    if (!update.message) {
      console.log("⚠️ UPDATE SEM MESSAGE - mas continuando processamento...")
      return NextResponse.json({ ok: true, debug: "no_message_but_logged" })
    }

    const { message } = update
    const chatId = message.chat.id
    const text = message.text?.trim() || ''
    const userId = message.from.id.toString()

    console.log(`Received message from ${userId}: "${text}"`)

    // Comando /start
    if (text === '/start') {
      // Verificar se usuário tem conta vinculada
      const linkedUser = await prisma.user.findFirst({
        where: {
          telegramId: userId,
          email: { not: { startsWith: 'telegram_' } },
          emailVerified: { not: null }
        }
      })

      if (!linkedUser) {
        const linkMessage =
          `🎉 Bem-vindo ao Orbi - Seu Orçamento Inteligente!\n\n` +
          `🔗 Para começar, você precisa vincular sua conta:\n\n` +
          `1️⃣ Acesse: https://useorbi.app/auth/login\n` +
          `2️⃣ Faça login ou cadastre-se\n` +
          `3️⃣ Vá em Configurações → Bot Telegram\n` +
          `4️⃣ Cole este código: ${userId}\n\n` +
          `🔒 Seus dados ficam seguros e privados\n\n` +
          `Após vincular, volte aqui e digite /start novamente!`

        await sendMessage(chatId, linkMessage, message.message_id)
        return NextResponse.json({ ok: true })
      }

      const welcomeMessage =
        `🎉 Bem-vindo ao Orbi - Seu Orçamento Inteligente!\n\n` +
        `Sou seu assistente financeiro pessoal. Posso ajudar você a:\n\n` +
        `💰 Registrar receitas:\n` +
        `• "recebi 1200 de salário"\n` +
        `• "ganhei 500 de freelance"\n\n` +
        `📝 Registrar gastos facilmente:\n` +
        `• "50 uber"\n` +
        `• "25.90 supermercado"\n` +
        `• "gastei 100 em gasolina"\n\n` +
        `📊 Obter insights instantâneos:\n` +
        `• "qual meu saldo?"\n` +
        `• "gastos do mês"\n` +
        `• "onde mais gasto?"\n` +
        `• "como estão minhas metas?"\n\n` +
        `✨ Digite sua primeira mensagem para começar!`

      await sendMessage(chatId, welcomeMessage, message.message_id)
      return NextResponse.json({ ok: true })
    }

    // Verificar se usuário tem conta vinculada antes de qualquer operação
    const linkedUser = await prisma.user.findFirst({
      where: {
        telegramId: userId,
        email: { not: { startsWith: 'telegram_' } },
        emailVerified: { not: null }
      }
    })

    if (!linkedUser) {
      const linkMessage =
        `🔗 Conta não vinculada\n\n` +
        `Para usar o bot, você precisa vincular sua conta do site:\n\n` +
        `1️⃣ Acesse: https://useorbi.app/auth/login\n` +
        `2️⃣ Faça login ou cadastre-se\n` +
        `3️⃣ Vá em Configurações → Bot Telegram\n` +
        `4️⃣ Cole este código: ${userId}\n\n` +
        `Após vincular, digite /start para começar!`

      await sendMessage(chatId, linkMessage, message.message_id)
      return NextResponse.json({ ok: true })
    }

    // Tentar interpretar como receita primeiro
    const incomeData = parseIncomeMessage(text)

    if (incomeData) {
      // Registrar receita no banco
      try {
        const user = linkedUser

        // Buscar ou criar categoria de receita
        let category = await prisma.category.findFirst({
          where: { name: incomeData.category }
        })

        if (!category) {
          // Criar categoria se não existir
          try {
            category = await prisma.category.create({
              data: { name: incomeData.category }
            })
          } catch (error: any) {
            console.error('Error creating category:', error)
            // Se falhar, usar "Outros"
            category = await prisma.category.findFirst({
              where: { name: 'Outros' }
            })
            if (!category) {
              category = await prisma.category.create({
                data: { name: 'Outros' }
              })
            }
          }
        }

        // Criar transação de receita
        const transaction = await prisma.transaction.create({
          data: {
            amount: incomeData.amount,
            description: incomeData.description,
            type: 'INCOME',
            method: 'OTHER',
            userId: user.id,
            categoryId: category.id
          }
        })

        // Calcular receitas do mês
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const monthlyIncome = await prisma.transaction.aggregate({
          where: {
            userId: user.id,
            type: 'INCOME',
            createdAt: { gte: startOfMonth }
          },
          _sum: { amount: true }
        })

        const confirmMessage =
          `✅ Receita Registrada!\n\n` +
          `💰 Valor: R$ ${incomeData.amount.toFixed(2)}\n` +
          `📝 Descrição: ${incomeData.description}\n` +
          `🏷️ Categoria: ${incomeData.category}\n\n` +
          `📈 Receitas do mês: R$ ${(monthlyIncome._sum.amount || 0).toFixed(2)}`

        await sendMessage(chatId, confirmMessage, message.message_id)
      } catch (error: any) {
        console.error('Error saving income:', error)
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          stack: error?.stack
        })
        await sendMessage(chatId,
          `❌ Erro ao registrar receita. Tente novamente em alguns minutos.`,
          message.message_id
        )
      }

      return NextResponse.json({ ok: true })
    }

    // Tentar interpretar como gasto
    const expenseData = await parseExpenseMessage(text)

    if (expenseData) {
      // Registrar gasto no banco
      try {
        const user = linkedUser

        // Buscar ou criar categoria
        let category = await prisma.category.findFirst({
          where: { name: expenseData.category }
        })

        if (!category) {
          // Se a categoria não existir, criar ela (não usar "Outros" como fallback)
          console.log(`📝 Criando categoria: ${expenseData.category}`)
          try {
            category = await prisma.category.create({
              data: { name: expenseData.category }
            })
            console.log(`✅ Categoria criada: ${category.name} (ID: ${category.id})`)
          } catch (error: any) {
            // Se der erro (ex: categoria já existe), buscar novamente
            console.log(`⚠️ Erro ao criar categoria, tentando buscar novamente: ${error.message}`)
            category = await prisma.category.findFirst({
              where: { name: expenseData.category }
            })
            
            // Se ainda não encontrou, usar "Outros" como último recurso
            if (!category) {
              category = await prisma.category.findFirst({
                where: { name: 'Outros' }
              })
              
              if (!category) {
                category = await prisma.category.create({
                  data: { name: 'Outros' }
                })
              }
            }
          }
        }

        // Criar transação
        const transaction = await prisma.transaction.create({
          data: {
            amount: expenseData.amount,
            description: expenseData.description,
            type: 'EXPENSE',
            method: 'OTHER',
            userId: user.id,
            categoryId: category.id
          }
        })

        // Calcular gastos do dia e do mês
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        const [dailyExpenses, monthlyExpenses] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId: user.id,
              type: 'EXPENSE',
              createdAt: { gte: today }
            },
            _sum: { amount: true }
          }),
          prisma.transaction.aggregate({
            where: {
              userId: user.id,
              type: 'EXPENSE',
              createdAt: { gte: startOfMonth }
            },
            _sum: { amount: true }
          })
        ])

        const confirmMessage =
          `✅ Gasto Registrado!\n\n` +
          `💰 Valor: R$ ${expenseData.amount.toFixed(2)}\n` +
          `📝 Descrição: ${expenseData.description}\n` +
          `🏷️ Categoria: ${expenseData.category}\n\n` +
          `📊 Seus gastos hoje: R$ ${(dailyExpenses._sum.amount || 0).toFixed(2)}`

        await sendMessage(chatId, confirmMessage, message.message_id)

        // ✅ Gasto registrado com sucesso! Processar alertas em background (não bloqueia resposta)
        // Processar alertas de forma assíncrona sem afetar a resposta principal
        Promise.resolve().then(async () => {
          try {
            // Buscar configurações de alerta do usuário
            const alertSettings = await (prisma as any).telegramAlertSettings?.findUnique({
              where: { userId: user.id }
            })

            // Verificar se passou de algum limite e alertar (se configurado)
            if (alertSettings?.highSpendingEnabled) {
              let shouldAlert = false
              let totalToCheck = 0
              let periodText = ''

              if (alertSettings.highSpendingPeriod === 'DAILY') {
                totalToCheck = dailyExpenses._sum.amount || 0
                periodText = 'hoje'
              } else if (alertSettings.highSpendingPeriod === 'WEEKLY') {
                const startOfWeek = new Date(today)
                startOfWeek.setDate(today.getDate() - today.getDay())
                const weeklyExpenses = await prisma.transaction.aggregate({
                  where: {
                    userId: user.id,
                    type: 'EXPENSE',
                    createdAt: { gte: startOfWeek }
                  },
                  _sum: { amount: true }
                })
                totalToCheck = weeklyExpenses._sum.amount || 0
                periodText = 'esta semana'
              } else if (alertSettings.highSpendingPeriod === 'MONTHLY') {
                totalToCheck = monthlyExpenses._sum.amount || 0
                periodText = 'este mês'
              }

              if (totalToCheck >= alertSettings.highSpendingThreshold) {
                shouldAlert = true
              }

              if (shouldAlert) {
                setTimeout(async () => {
                  try {
                    await sendMessage(chatId,
                      `⚠️ Alerta de Gasto Alto\n\n` +
                      `Você gastou mais de R$ ${alertSettings.highSpendingThreshold.toFixed(2)} ${periodText}.\n` +
                      `Total ${periodText}: R$ ${totalToCheck.toFixed(2)}\n\n` +
                      `Quer que eu te mostre algumas dicas de economia?`
                    )
                  } catch (alertError) {
                    console.error('Error sending alert:', alertError)
                    // Não fazer nada - o alerta é opcional
                  }
                }, 2000)
              }
            }
          } catch (alertError: any) {
            // Erro ao processar alertas não deve afetar a resposta principal
            console.error('Error processing alerts (non-critical):', alertError)
            // Não enviar mensagem de erro - o gasto já foi registrado com sucesso
          }
        }).catch(() => {
          // Ignorar erros no processamento de alertas
        })

        // Retornar sucesso imediatamente - o gasto foi registrado com sucesso
        return NextResponse.json({ ok: true })

      } catch (error: any) {
        console.error('Error saving expense:', error)
        console.error('Error details:', {
          message: error?.message,
          code: error?.code,
          stack: error?.stack
        })
        await sendMessage(chatId,
          `❌ Erro ao registrar gasto. Tente novamente em alguns minutos.`,
          message.message_id
        )
        return NextResponse.json({ ok: true })
      }
    }

    // Se não é um gasto, tratar como consulta
    const queryType = parseQueryMessage(text)
    const response = await generateInsightResponse(queryType, userId)

    await sendMessage(chatId, response, message.message_id)

    // 🚨 RESPOSTA MÍNIMA GARANTIDA NO FINAL - SEM FILTROS
    console.log("📤 RETORNANDO SUCESSO FINAL...")
    return NextResponse.json({ ok: true, debug: "final_return" })

  } catch (error) {
    console.error('🚨 TELEGRAM WEBHOOK ERROR:', error)

    // 🚨 MESMO COM ERRO, GARANTIR RESPOSTA OK PARA TELEGRAM
    return NextResponse.json({ ok: true, error: error instanceof Error ? error.message : 'Unknown error', debug: "error_but_ok" })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Telegram Bot Webhook is running',
    timestamp: new Date().toISOString()
  })
}