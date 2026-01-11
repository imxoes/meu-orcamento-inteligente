# DEPLOY.md - Procedimentos de Deploy

## Scripts do package.json

### Desenvolvimento
```bash
npm run dev              # Desenvolvimento local (porta 3003)
npm run db:studio        # Interface Prisma Studio
npm run db:list-users    # Listar usuários no banco
npm run db:check         # Verificar conexão com banco de produção
```

### Build e Deploy
```bash
npm run build           # Build de produção (prisma generate + next build)
npm start               # Start servidor de produção
npm run postinstall     # Auto-executado: prisma generate
npm run prebuild        # Auto-executado antes do build: prisma generate
```

### Database
```bash
npm run db:migrate      # Aplicar mudanças: prisma db push
npm run db:seed         # Popular banco com dados iniciais
```

---

## Deploy no Vercel

### Configuração Atual
- **URL:** https://useorbi.app
- **Framework:** Next.js com Vercel Functions
- **Build Command:** `prisma generate && next build`
- **Install Command:** `npm install`
- **Max Duration:** 30s para APIs

### Deploy Automático
1. **Push para main branch** → Deploy automático
2. **Vercel detecta mudanças** → Executa build
3. **Build process:**
   ```
   npm install
   → prisma generate (postinstall)
   → prisma generate (prebuild)
   → next build
   → deploy
   ```

---

## Checklist Pré-Deploy

### 🔧 Código
- [ ] Build local executado com sucesso (`npm run build`)
- [ ] TypeScript sem erros críticos
- [ ] Testes manuais das principais funcionalidades
- [ ] Logs de debug removidos/minimizados

### 🗄️ Banco de Dados
- [ ] Prisma schema atualizado
- [ ] Migrations aplicadas (`npm run db:migrate`)
- [ ] Conexão com Neon testada (`npm run db:check`)
- [ ] Backup do banco (se mudanças críticas)

### 🔐 Variáveis de Ambiente
- [ ] Todas as variáveis configuradas no Vercel:
  - DATABASE_URL (Neon)
  - JWT_SECRET
  - TELEGRAM_BOT_TOKEN
  - WHATSAPP_* (EditaCódigo)
  - STRIPE_* (pagamentos)
  - OPENAI_API_KEY
  - BREVO_API_KEY / RESEND_API_KEY
- [ ] URLs de webhook atualizadas para produção

### 🌐 Integrações Externas
- [ ] Telegram webhook configurado: `https://useorbi.app/api/telegram/webhook`
- [ ] WhatsApp webhook configurado (EditaCódigo)
- [ ] Stripe webhook endpoint ativo
- [ ] OpenAI API key válida
- [ ] Emails de teste enviados (Brevo/Resend)

---

## Procedimento de Deploy

### 1. Preparação
```bash
# 1. Garantir que está na branch main
git checkout main
git pull origin main

# 2. Build e teste local
npm run build
npm run db:check

# 3. Testar endpoints críticos localmente
npm run dev
# Testar: /api/health, /api/auth/login, etc.
```

### 2. Deploy
```bash
# Método 1: Via Git (Recomendado)
git add .
git commit -m "Deploy: descrição das mudanças"
git push origin main

# Método 2: Via Vercel CLI (se necessário)
npx vercel --prod
```

### 3. Verificação Automática
- Vercel executará o build
- Logs disponíveis em: https://vercel.com/dashboard
- Build típico: 2-3 minutos

---

## Checklist Pós-Deploy

### 🌍 Funcionalidades Básicas
- [ ] **Site carregando:** https://useorbi.app
- [ ] **Login funcional:** https://useorbi.app/auth/login
- [ ] **Dashboard acessível:** https://useorbi.app/dashboard
- [ ] **APIs respondendo:** https://useorbi.app/api/health

### 🤖 Bots
- [ ] **Bot Telegram:** Enviar mensagem de teste
  - Verificar parser: "50 uber"
  - Verificar insights: "qual meu saldo?"
- [ ] **Bot WhatsApp:** Enviar mensagem de teste (se ativo)

### 💳 Integrações Críticas
- [ ] **Stripe:** Testar checkout de assinatura
- [ ] **OpenAI:** Testar geração de insights (usuário Premium)
- [ ] **Email:** Testar reset de senha
- [ ] **Banco:** Executar transação de teste

### 📊 Monitoramento
- [ ] Verificar logs do Vercel (sem erros críticos)
- [ ] Testar performance das principais páginas
- [ ] Verificar métricas de uptime

---

## Smoke Tests

### Fluxo Completo de Usuário Novo
1. **Cadastro:** https://useorbi.app/auth/signup
2. **Verificação email:** Receber e clicar no link
3. **Login:** Acessar dashboard
4. **Vincular Telegram:** Configurações → Bot Telegram
5. **Testar bot:** Enviar "50 uber" no Telegram
6. **Verificar dashboard:** Transação apareceu?

### Fluxo de Pagamento (Stripe)
1. **Ir para assinaturas:** https://useorbi.app/dashboard/subscription
2. **Selecionar plano Premium**
3. **Checkout Stripe:** Usar cartão de teste
4. **Verificar upgrade:** Funcionalidades Premium liberadas?

---

## Rollback Procedure

### Se Deploy Falhar
1. **Verificar logs:** Vercel Dashboard → Function Logs
2. **Rollback automático:** Vercel manterá versão anterior ativa
3. **Rollback manual (se necessário):**
   ```bash
   # Via Vercel CLI
   vercel rollback [deployment-url]

   # Via Dashboard
   # Vercel → Project → Deployments → Promote to Production
   ```

### Se Database Corrompido
1. **Rollback migrations:**
   ```bash
   # Reverter última migração (cuidado!)
   npx prisma migrate reset
   npx prisma migrate deploy
   ```
2. **Restore backup:** Usar backup do Neon

### Se Integrações Falharem
1. **Telegram:** Reconfigurar webhook via Bot API
2. **WhatsApp:** Reconfigurar na EditaCódigo
3. **Stripe:** Verificar webhook endpoints no dashboard

---

## Como Configurar Webhooks

### Telegram
```bash
# Configurar webhook (executar uma vez)
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://useorbi.app/api/telegram/webhook"

# Verificar webhook
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

### WhatsApp (EditaCódigo)
- Acessar painel da EditaCódigo
- Configurar webhook: `https://useorbi.app/api/whatsapp/webhook`
- Token de verificação: valor de `EDITA_CODIGO_VERIFY_TOKEN`

### Stripe
- Dashboard Stripe → Webhooks
- Endpoint: `https://useorbi.app/api/subscription/webhook`
- Eventos: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_*`

---

## Logs e Debug

### Vercel Function Logs
- **Acesso:** Vercel Dashboard → Project → Functions
- **Real-time:** `npx vercel logs --follow`

### Database Logs
- **Neon Dashboard:** Logs de conexão e queries
- **Prisma:** Logs automáticos em development

### Monitoramento de APIs
```bash
# Testar endpoints principais
curl https://useorbi.app/api/health
curl https://useorbi.app/api/auth/login -X POST
```