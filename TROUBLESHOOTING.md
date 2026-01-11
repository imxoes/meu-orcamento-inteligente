# TROUBLESHOOTING.md - Problemas e Soluções

## 🚨 Problemas Conhecidos

### 1. Build/TypeScript Issues

#### `ignoreBuildErrors: true` no next.config.ts
- **Sintoma:** Build mascarando erros TypeScript
- **Causa:** Configuração temporária para evitar erros do Prisma Client
- **Solução:**
  ```bash
  # Verificar se Prisma está atualizado
  npm run db:migrate
  npx prisma generate

  # Se funcionando, remover do next.config.ts:
  typescript: {
    ignoreBuildErrors: false
  }
  ```

#### Erros de Prisma Client
- **Sintoma:** `PrismaClient is not configured correctly`
- **Solução:**
  ```bash
  npx prisma generate
  npm run build
  ```

### 2. Bot WhatsApp Não Responde

#### Webhook Não Configurado
- **Sintoma:** Bot não recebe mensagens
- **Verificação:**
  ```bash
  curl https://useorbi.app/api/whatsapp/webhook
  # Deve retornar status 200
  ```
- **Solução:** Configurar webhook na EditaCódigo com URL: `https://useorbi.app/api/whatsapp/webhook`

#### Usuário Não Vinculado
- **Sintoma:** Bot responde com mensagem de vinculação
- **Verificação:** No banco, verificar se `User.whatsappId` está preenchido
- **Solução:**
  1. Ir em `/dashboard/whatsapp-bot`
  2. Inserir número do telefone
  3. Salvar vinculação

#### API EditaCódigo Não Responde
- **Sintoma:** Erro `Failed to send WhatsApp message`
- **Verificação:** Testar variáveis de ambiente:
  ```bash
  echo $WHATSAPP_SERVIDOR
  echo $WHATSAPP_PORTA
  echo $WHATSAPP_TOKEN
  ```
- **Solução:** Verificar se servidor EditaCódigo está online

### 3. Bot Telegram Issues

#### Webhook Não Ativo
- **Verificação:**
  ```bash
  curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
  ```
- **Solução:**
  ```bash
  curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
    -d "url=https://useorbi.app/api/telegram/webhook"
  ```

#### Parse Não Funciona
- **Sintoma:** Bot não reconhece "50 uber"
- **Debug:** Verificar logs no Vercel
- **Solução:** Testar regex patterns em `src/app/api/telegram/webhook/route.ts:194`

### 4. Problemas de Autenticação

#### JWT Token Inválido
- **Sintoma:** Redirecionamento infinito para `/auth/login`
- **Verificação:** Verificar cookie `token` no navegador
- **Solução:**
  ```bash
  # Limpar cookies
  # Fazer login novamente
  # Verificar JWT_SECRET no .env
  ```

#### Email Não Chegando
- **Sintomas:** Usuário não recebe email de verificação
- **Verificação:** Logs do Brevo/Resend
- **Soluções:**
  - Verificar `BREVO_API_KEY` válida
  - Verificar `BREVO_SENDER_EMAIL` configurado
  - Verificar se email não foi para spam

#### Middleware Bloqueando
- **Sintoma:** 401 em rotas que deveriam funcionar
- **Debug:** Verificar `src/middleware.ts:49`
- **Solução:** Verificar se token JWT é válido

---

## 🔍 Como Debugar Cada Sistema

### Database (Prisma + Neon)

#### Conexão
```bash
# Testar conexão
npm run db:check

# Ver estrutura
npm run db:studio

# Ver usuários
npm run db:list-users
```

#### Queries Lentas
```sql
-- No Neon dashboard, verificar slow queries
-- Adicionar índices se necessário
```

#### Dados Inconsistentes
```bash
# Reset completo (CUIDADO!)
npx prisma migrate reset
npx prisma db push
```

### APIs (Vercel Functions)

#### Logs em Tempo Real
```bash
npx vercel logs --follow
```

#### Testar Endpoints
```bash
# Saúde geral
curl https://useorbi.app/api/health

# Auth
curl -X POST https://useorbi.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'

# Transações (com token)
curl https://useorbi.app/api/transactions \
  -H "Authorization: Bearer <token>"
```

#### Timeouts (30s limit)
- **Sintoma:** Function timeout após 30s
- **Solução:** Otimizar queries Prisma, reduzir processamento

### Stripe Integration

#### Webhook Não Funciona
- **Verificação:** Stripe Dashboard → Webhooks → Logs
- **Sintomas:** Payments não aparecem no sistema
- **Solução:**
  ```bash
  # Verificar webhook secret
  echo $STRIPE_WEBHOOK_SECRET

  # Testar endpoint
  curl -X POST https://useorbi.app/api/subscription/webhook
  ```

#### Checkout Não Funciona
- **Sintoma:** Erro ao criar checkout session
- **Debug:** Verificar `STRIPE_SECRET_KEY` válida
- **Solução:** Verificar preços `STRIPE_BASIC_PRICE_ID`, `STRIPE_PREMIUM_PRICE_ID`

### OpenAI Integration

#### API Key Inválida
- **Sintoma:** 401 Unauthorized em `/api/ai/insights`
- **Solução:**
  ```bash
  # Verificar key
  echo $OPENAI_API_KEY

  # Testar key
  curl https://api.openai.com/v1/models \
    -H "Authorization: Bearer $OPENAI_API_KEY"
  ```

#### Rate Limit
- **Sintoma:** 429 Too Many Requests
- **Solução:** Implementar retry logic ou upgradar plano OpenAI

#### Premium Access
- **Sintoma:** 403 Premium required
- **Verificação:** Verificar se usuário tem `subscriptionPlan: "PREMIUM"`

---

## ⚙️ Scripts de Debug

### Verificar Estado do Sistema
```bash
# Database
npm run db:check

# Build
npm run build

# Usuários
npm run db:list-users
```

### Criar Usuários de Teste
```bash
# Usuário simples
npx tsx scripts/create-simple-user.ts

# Usuário Premium
npx tsx scripts/create-test-user.ts
```

### Limpar Rate Limits
```bash
npx tsx scripts/clear-rate-limit.ts
```

### Testar JWT
```bash
JWT_SECRET='3XL15DaQ3r8HORr6mk9sQbN8T1MEdOHapqaNJuThC6I=' npx tsx scripts/test-jwt.ts
```

---

## 📊 Monitoramento

### Métricas Importantes
- **Response Time:** APIs < 2s
- **Error Rate:** < 5%
- **Database Connections:** < 80% do pool
- **Memory Usage:** Vercel functions < 512MB

### Logs a Monitorar
- **401/403 errors:** Problemas de auth
- **500 errors:** Bugs de código
- **Database timeout:** Queries lentas
- **Webhook failures:** Integrações externas

### Alertas Sugeridos
- **High Error Rate:** > 10% em 5 minutos
- **Database Down:** Conexão falhando
- **Bot Down:** Webhooks falhando por > 10 minutos

---

## 🆘 Emergency Procedures

### Site Completamente Fora do Ar
1. **Verificar Status Vercel:** https://vercel-status.com
2. **Verificar Neon:** https://neon.tech/status
3. **Rollback último deploy:**
   ```bash
   vercel rollback [deployment-url]
   ```

### Banco de Dados Corrompido
1. **Backup via Neon Dashboard**
2. **Rollback migrations:**
   ```bash
   npx prisma migrate reset
   ```
3. **Restore backup**

### Bots Não Funcionando
1. **Verificar webhooks:**
   - Telegram: `getWebhookInfo`
   - WhatsApp: Painel EditaCódigo
2. **Reconfigurar se necessário**
3. **Verificar variáveis de ambiente**

### Payments Falhando
1. **Stripe Status:** https://status.stripe.com
2. **Verificar webhook configuration**
3. **Testar com cartão de teste**

---

## 🔧 Ferramentas de Debug

### Database
- **Prisma Studio:** `npm run db:studio`
- **Neon Console:** https://console.neon.tech
- **pgAdmin:** Se necessário acesso avançado

### APIs
- **Vercel Dashboard:** Logs em tempo real
- **Postman/Insomnia:** Testes de API
- **curl:** Testes rápidos

### Monitoring
- **Vercel Analytics:** Performance metrics
- **Stripe Dashboard:** Payment monitoring
- **OpenAI Usage:** API usage tracking

---

## 📚 Documentações de Referência

### APIs Externas
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **EditaCódigo WhatsApp:** [Documentação fornecida]
- **Stripe API:** https://stripe.com/docs/api
- **OpenAI API:** https://platform.openai.com/docs

### Ferramentas
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Vercel:** https://vercel.com/docs