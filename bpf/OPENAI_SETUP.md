# Configuração da OpenAI API

## Como adicionar sua chave da OpenAI

### 1. No Vercel Dashboard

1. Acesse: https://vercel.com/useorbi-6424s-projects/meu-orcamento-inteligente/settings/environment-variables
2. Clique em "Add New"
3. Configure:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Cole sua chave da OpenAI (começa com `sk-...`)
   - **Environment**: Selecione "Production", "Preview" e "Development"
4. Clique em "Save"

### 2. Para desenvolvimento local

Adicione no arquivo `.env` (na raiz do projeto):

```
OPENAI_API_KEY=sk-sua-chave-aqui
```

### 3. Após adicionar a chave

1. Faça um novo deploy no Vercel (ou aguarde o próximo deploy automático)
2. A categorização de gastos no bot do Telegram usará IA quando disponível
3. A página de AI Insights começará a gerar insights reais

## Funcionalidades habilitadas com OpenAI

✅ **Categorização Inteligente de Gastos**
- O bot do Telegram usa IA para categorizar gastos automaticamente
- Funciona mesmo com descrições incomuns ou ambíguas
- Fallback automático para categorização por palavras-chave se IA não estiver disponível

✅ **Geração de Insights Financeiros**
- Análise inteligente dos seus padrões de gasto
- Recomendações personalizadas baseadas nos seus dados
- Insights acionáveis para melhorar suas finanças

## Testando

1. Envie uma mensagem ao bot do Telegram com um gasto: `50 padaria da esquina`
2. A IA categorizará automaticamente como "Padaria"
3. Acesse a página "AI Insights" no dashboard para ver insights gerados

## Nota

A chave da OpenAI é usada apenas no servidor e nunca exposta ao cliente.
