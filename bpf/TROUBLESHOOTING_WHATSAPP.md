# 🔧 Troubleshooting - Bot WhatsApp

## Erro: "fetch failed" ao vincular conta

### O que significa?
O erro "fetch failed" indica que o sistema não conseguiu conectar com a API da EditaCódigo para enviar a mensagem de boas-vindas.

### Possíveis causas e soluções:

#### 1. ✅ Variáveis de Ambiente não configuradas

**Verificar:**
- Acesse: https://vercel.com/useorbi-6424s-projects/meu-orcamento-inteligente/settings/environment-variables
- Confirme se existem:
  - `EDITA_CODIGO_API_URL` = `https://api.editacodigo.com.br`
  - `EDITA_CODIGO_API_KEY` = sua chave da API

**Solução:**
1. Adicione as variáveis no Vercel
2. Faça um novo deploy ou aguarde o próximo deploy automático

#### 2. ✅ URL da API incorreta

**Verificar:**
- A URL padrão é: `https://api.editacodigo.com.br`
- Verifique na documentação da EditaCódigo se a URL está correta

**Solução:**
- Atualize `EDITA_CODIGO_API_URL` no Vercel com a URL correta

#### 3. ✅ Endpoint incorreto

**Verificar:**
- O código usa: `/send-message`
- Verifique na documentação da EditaCódigo qual é o endpoint correto

**Solução:**
- Pode ser necessário ajustar o endpoint em `src/lib/whatsapp-utils.ts`
- Endpoints comuns: `/send`, `/message`, `/send-message`, `/api/send`

#### 4. ✅ API Key inválida ou expirada

**Verificar:**
- Acesse o painel da EditaCódigo
- Confirme se a API Key está ativa e válida

**Solução:**
- Gere uma nova API Key se necessário
- Atualize `EDITA_CODIGO_API_KEY` no Vercel

#### 5. ✅ Formato da requisição incorreto

**Verificar:**
- A documentação da EditaCódigo pode exigir um formato diferente
- Verifique os logs do Vercel para ver a resposta da API

**Solução:**
- Ajuste o formato em `src/lib/whatsapp-utils.ts` conforme a documentação

#### 6. ✅ Plano gratuito com limitações

**Verificar:**
- O plano gratuito da EditaCódigo pode ter limitações
- Pode não permitir envio de mensagens ou ter rate limits

**Solução:**
- Verifique as limitações do seu plano
- Considere fazer upgrade se necessário

### Como verificar os logs detalhados:

1. Acesse: https://vercel.com/useorbi-6424s-projects/meu-orcamento-inteligente
2. Vá em **Deployments** → último deploy
3. Clique em **Functions** → `/api/whatsapp/link`
4. Veja os logs que mostram:
   - URL sendo chamada
   - Request body
   - Response status
   - Erros detalhados

### Teste manual da API:

Você pode testar a API diretamente usando curl:

```bash
curl -X POST https://api.editacodigo.com.br/send-message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SUA_API_KEY" \
  -H "X-API-Key: SUA_API_KEY" \
  -d '{
    "number": "16505044380",
    "message": "Teste",
    "text": "Teste",
    "type": "text",
    "phone": "16505044380"
  }'
```

### Importante:

A vinculação da conta **funciona mesmo sem enviar a mensagem**. O número é salvo no banco de dados e você pode:
- Receber mensagens do bot (via webhook)
- Enviar mensagens manualmente depois
- Configurar a API corretamente e tentar novamente

A mensagem de boas-vindas é apenas um bônus, não é obrigatória para o funcionamento do bot.



