# CONTEXT.md - Orb - Orçamento Inteligente

## Visão Geral do Projeto

**Nome:** Orb - Orçamento Inteligente
**URL de Produção:** https://useorbi.app
**Status:** 🟢 EM PRODUÇÃO (Main Net)
**Público-alvo:** Classe média e classe média baixa brasileira
**Proposta:** Controle financeiro via WhatsApp/Telegram + Dashboard web com insights de IA

## Stack Tecnológica

### Frontend & Backend
- **Framework:** Next.js 15.1.0 (React 19.2.0)
- **Linguagem:** TypeScript 5.x
- **Runtime:** Node.js (Vercel Serverless Functions)
- **Estilo:** Tailwind CSS 4.x
- **Componentes:** Lucide React (ícones), Framer Motion (animações)

### Banco de Dados
- **ORM:** Prisma 5.19.1
- **Database:** PostgreSQL (Neon)
- **Connection:** Pooled + Non-pooled connections disponíveis
- **Migrations:** Prisma migrate

### Autenticação
- **Sistema:** JWT próprio (biblioteca: jose 6.1.3, jsonwebtoken 9.0.3)
- **Hash de senhas:** bcryptjs 3.0.3
- **Sessões:** Armazenadas no banco com expiração
- **Middleware:** Proteção de rotas com verificação JWT edge-compatible

## Arquitetura

### Frontend (Next.js App Router)
- Dashboard web responsivo com métricas financeiras
- Sistema de planos (Free, Basic, Premium)
- Integração com APIs próprias
- Middleware de segurança com CSP headers
- Páginas de autenticação (login, signup, reset password)

### Backend/Bots
- **✅ Bot Telegram:** 100% funcional em produção
  - Webhook: `/api/telegram/webhook`
  - Parser de linguagem natural ("50 uber", "recebi 1200 salário")
  - Sistema de alertas configurável
- **⚠️ Bot WhatsApp:** código integrado, aguardando teste em produção
  - API: EditaCódigo WhatsApp Business
  - Webhook: `/api/whatsapp/webhook`
  - Reutiliza parsers do Telegram

### APIs e Endpoints

**Total de endpoints:** 46 rotas API

**Principais grupos:**
- `/api/auth/*` - Autenticação (login, signup, reset, verify)
- `/api/telegram/*` - Bot Telegram (webhook, setup, alertas)
- `/api/whatsapp/*` - Bot WhatsApp (webhook, setup, status)
- `/api/transactions/*` - CRUD transações, export
- `/api/goals/*` - CRUD metas financeiras
- `/api/investments/*` - CRUD investimentos
- `/api/ai/*` - Insights IA (Premium), relatórios, dicas
- `/api/subscription/*` - Stripe checkout, status, webhook
- `/api/user/*` - Perfil, configurações, import/export
- `/api/admin/*` - Painel administrativo

## Integrações Externas

### Pagamentos
- **Stripe:** Sistema completo de assinaturas
  - Planos: Basic (R$ 4,99/mês), Premium (R$ 8,99/mês)
  - Webhook para eventos de pagamento
  - Checkout sessions com metadata

### Inteligência Artificial
- **OpenAI GPT:** Insights financeiros (Premium only)
  - Análise de padrões de gasto
  - Previsões e recomendações
  - Categorização automática inteligente

### Comunicação
- **Telegram Bot API:** Bot oficial em produção
- **WhatsApp Business API:** Via EditaCódigo (integrado)
- **Email:**
  - **Brevo:** Marketing e transacionais
  - **Resend:** Emails de desenvolvimento

### Dados e Analytics
- **Neon PostgreSQL:** Database principal
- **Vercel Analytics:** Implícito no deploy

## Variáveis de Ambiente

### Database
```
DATABASE_URL=postgresql://...
POSTGRES_URL=postgresql://...
POSTGRES_URL_NON_POOLING=postgresql://...
```

### Autenticação
```
JWT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://useorbi.app
```

### Integrações
```
# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_URL=https://useorbi.app/api/telegram/webhook

# WhatsApp (EditaCódigo)
WHATSAPP_SERVIDOR=localhost
WHATSAPP_PORTA=5000
WHATSAPP_TOKEN=...
EDITA_CODIGO_API_KEY=...
EDITA_CODIGO_API_URL=...
EDITA_CODIGO_VERIFY_TOKEN=...

# OpenAI
OPENAI_API_KEY=...

# Stripe
STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_BASIC_PRICE_ID=...
STRIPE_PREMIUM_PRICE_ID=...

# Email
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
RESEND_API_KEY=...
```

## Fluxo de Autenticação

1. **Cadastro/Login:** Usuário cria conta no dashboard web
2. **Verificação email:** Sistema envia email via Brevo/Resend
3. **JWT Generation:** Token JWT assinado com secret
4. **Session Creation:** Sessão armazenada no banco com expiração
5. **Bot Linking:** Usuário vincula Telegram ID ou WhatsApp no dashboard
6. **Middleware Protection:** Rotas `/dashboard/*` protegidas por middleware

## Sistema de Planos

### FREE (Trial 7 dias)
- Transações ilimitadas
- Categorização básica
- Bots funcionais

### BASIC (R$ 4,99/mês)
- Tudo do Free
- Alertas personalizados
- Relatórios básicos

### PREMIUM (R$ 8,99/mês)
- Tudo do Basic
- **Insights de IA** (OpenAI)
- Análises avançadas
- Previsões financeiras

## Banco de Dados Schema

### Entidades Principais
- **Users:** Sistema de usuários com planos e configurações
- **Transactions:** Receitas e despesas com categorização
- **Categories:** Categorias de transações (dinâmicas)
- **Goals:** Metas financeiras dos usuários
- **Investments:** Carteira de investimentos
- **Subscriptions:** Controle de planos Stripe
- **Payments:** Histórico de pagamentos
- **Sessions:** Sessões JWT ativas
- **UserSettings:** Preferências e configurações de alerta

### Relacionamentos
- User 1:N Transactions, Goals, Investments
- User 1:1 UserSettings, TelegramAlertSettings, Subscription
- Category 1:N Transactions
- Subscription 1:N Payments