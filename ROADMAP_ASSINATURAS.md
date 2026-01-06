# 💰 Roadmap: Sistema de Assinaturas e Monetização

## 🎯 Objetivo
Implementar sistema de assinatura com 3 níveis:
- **TESTE GRÁTIS** (7 dias): Sem acesso a funcionalidades premium
- **BÁSICO** (R$ 4,99/mês): Acesso a funcionalidades básicas
- **PREMIUM** (R$ 8,99/mês): Acesso completo incluindo IA e funcionalidades avançadas

---

## 📋 FASE 1: Estrutura de Dados (Backend)

### 1.1 Atualizar Schema do Banco de Dados
**Arquivo:** `prisma/schema.prisma`

**Mudanças necessárias:**
- Adicionar modelo `Subscription` para gerenciar assinaturas
- Adicionar modelo `Payment` para histórico de pagamentos
- Atualizar modelo `User` com campos de assinatura
- Adicionar campos: `trialEndsAt`, `subscriptionStatus`, `subscriptionPlan`

**Campos a adicionar:**
```prisma
model User {
  // ... campos existentes
  trialEndsAt          DateTime?  // Data de fim do período de teste
  subscriptionStatus   String     @default("TRIAL") // TRIAL, ACTIVE, EXPIRED, CANCELLED
  subscriptionPlan     String?    @default("FREE") // FREE, BASIC, PREMIUM
  subscriptionId       String?    @unique // ID da assinatura no gateway
  subscription         Subscription?
  payments            Payment[]
}

model Subscription {
  id                  String    @id @default(cuid())
  userId              String    @unique
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  status              String    @default("TRIAL") // TRIAL, ACTIVE, EXPIRED, CANCELLED
  plan                String    @default("FREE") // FREE, BASIC, PREMIUM
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
  cancelAtPeriodEnd   Boolean   @default(false)
  gateway             String    @default("STRIPE") // STRIPE
  gatewaySubscriptionId String? @unique
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@map("subscriptions")
}

model Payment {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptionId      String?
  subscription        Subscription? @relation(fields: [subscriptionId], references: [id])
  amount              Float     // Valor em R$
  currency            String    @default("BRL")
  status              String    // PENDING, PAID, FAILED, REFUNDED
  gateway             String    // STRIPE, MERCADO_PAGO
  gatewayPaymentId    String?   @unique
  method              String?   // CREDIT_CARD, PIX, BOLETO
  description         String?
  paidAt              DateTime?
  createdAt           DateTime  @default(now())
  
  @@map("payments")
}
```

**Comandos:**
```bash
npx prisma format
npx prisma db push
# ou
npx prisma migrate dev --name add_subscriptions
```

---

## 📋 FASE 2: Escolher Gateway de Pagamento

### 2.1 Opções Disponíveis

#### Opção A: Stripe (Recomendado)
**Prós:**
- ✅ Internacional, aceita cartões de qualquer país
- ✅ Excelente documentação
- ✅ Webhooks confiáveis
- ✅ Suporte a assinaturas recorrentes
- ✅ Dashboard completo

**Contras:**
- ❌ Taxa: 3.9% + R$ 0,40 por transação
- ❌ Requer conta empresarial no Brasil

**Custo:** R$ 4,99 → R$ 4,39 líquido (aprox.)

#### Opção B: Mercado Pago
**Prós:**
- ✅ Brasileiro, fácil de configurar
- ✅ Aceita PIX, boleto, cartão
- ✅ Taxa competitiva: 3.99% + R$ 0,40
- ✅ Não precisa de conta empresarial

**Contras:**
- ❌ Webhooks menos confiáveis
- ❌ Documentação menos completa
- ❌ Foco no Brasil

**Custo:** R$ 4,99 → R$ 4,39 líquido (aprox.)

#### Opção C: Asaas (Brasil)
**Prós:**
- ✅ Brasileiro
- ✅ Taxa: 2.99% + R$ 0,40 (mais barato)
- ✅ Suporte a PIX e boleto

**Contras:**
- ❌ Menos conhecido
- ❌ Documentação limitada

**Custo:** R$ 4,99 → R$ 4,55 líquido (aprox.)

### 2.2 Recomendação
**Stripe** para começar (melhor documentação e suporte), depois considerar **Mercado Pago** se quiser reduzir custos.

---

## 📋 FASE 3: Implementar Período de Teste

### 3.1 Lógica de Teste Gratuito
**Arquivo:** `src/lib/subscription-utils.ts` (criar)

**Funcionalidades:**
- Calcular data de fim do trial (ex: 7 ou 14 dias)
- Verificar se usuário está em trial
- Verificar se trial expirou
- Atualizar status automaticamente

**Código base:**
```typescript
export const TRIAL_DAYS = 7 // Definido: 7 dias

export function calculateTrialEndDate(): Date {
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + TRIAL_DAYS)
  return endDate
}

export function isTrialActive(user: User): boolean {
  if (!user.trialEndsAt) return false
  return new Date() < new Date(user.trialEndsAt)
}

export function getSubscriptionStatus(user: User): string {
  if (isTrialActive(user)) return 'TRIAL'
  if (user.subscriptionStatus === 'ACTIVE') return 'ACTIVE'
  return 'EXPIRED'
}

export function hasPremiumAccess(user: User): boolean {
  return user.subscriptionPlan === 'PREMIUM' && user.subscriptionStatus === 'ACTIVE'
}

export function hasBasicAccess(user: User): boolean {
  const isTrial = isTrialActive(user)
  const isBasic = user.subscriptionPlan === 'BASIC' && user.subscriptionStatus === 'ACTIVE'
  const isPremium = user.subscriptionPlan === 'PREMIUM' && user.subscriptionStatus === 'ACTIVE'
  
  return isTrial || isBasic || isPremium
}
```

### 3.2 Atualizar Cadastro
**Arquivo:** `src/app/api/auth/signup/route.ts`

**Mudanças:**
- Ao criar usuário, definir `trialEndsAt` = hoje + 7 dias
- Definir `subscriptionStatus` = "TRIAL"

---

## 📋 FASE 4: Integração com Gateway (Stripe)

### 4.1 Instalar Dependências
```bash
npm install stripe
npm install @types/stripe --save-dev
```

### 4.2 Configurar Variáveis de Ambiente
**No Vercel:**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC_ID=price_... (ID do produto BÁSICO R$ 4,99/mês)
STRIPE_PRICE_PREMIUM_ID=price_... (ID do produto PREMIUM R$ 8,99/mês)
```

### 4.3 Criar API de Checkout
**Arquivo:** `src/app/api/subscription/checkout/route.ts`

**Funcionalidade:**
- Criar sessão de checkout no Stripe
- Redirecionar usuário para pagamento
- Retornar URL de checkout

### 4.4 Criar Webhook do Stripe
**Arquivo:** `src/app/api/subscription/webhook/route.ts`

**Eventos a tratar:**
- `checkout.session.completed` → Ativar assinatura
- `customer.subscription.updated` → Atualizar status
- `customer.subscription.deleted` → Cancelar assinatura
- `invoice.payment_succeeded` → Registrar pagamento
- `invoice.payment_failed` → Notificar falha

### 4.5 Criar API de Gerenciamento
**Arquivos:**
- `src/app/api/subscription/status/route.ts` - Ver status
- `src/app/api/subscription/cancel/route.ts` - Cancelar
- `src/app/api/subscription/reactivate/route.ts` - Reativar

---

## 📋 FASE 5: Controle de Acesso (Middleware)

### 5.1 Criar Middleware de Assinatura
**Arquivo:** `src/lib/subscription-middleware.ts`

**Funcionalidade:**
- Verificar se usuário tem acesso (trial ativo ou assinatura ativa)
- Bloquear funcionalidades premium se expirado
- Redirecionar para página de upgrade

### 5.2 Aplicar em Rotas Premium
**Arquivos a proteger (PREMIUM):**
- `/api/ai/insights` - IA Insights
- `/api/ai/reports` - Relatórios IA
- `/api/ai/tips` - Dicas Inteligentes
- `/dashboard/ai-insights`
- `/dashboard/ai-reports`
- `/dashboard/smart-tips`

**Arquivos a proteger (BÁSICO ou PREMIUM):**
- Funcionalidades básicas já estão acessíveis no trial
- Apenas bloquear se não tiver trial ativo E não tiver assinatura ativa

**Código exemplo:**
```typescript
// Verificar acesso básico (trial, básico ou premium)
export async function requireBasicAccess(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) throw new Error('Usuário não encontrado')
  
  const isTrial = isTrialActive(user)
  const isActive = user.subscriptionStatus === 'ACTIVE'
  const hasPlan = ['BASIC', 'PREMIUM'].includes(user.subscriptionPlan || '')
  
  if (!isTrial && (!isActive || !hasPlan)) {
    throw new Error('Assinatura expirada. Faça upgrade para continuar.')
  }
  
  return true
}

// Verificar acesso premium (apenas premium ativo)
export async function requirePremiumAccess(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  
  if (!user) throw new Error('Usuário não encontrado')
  
  const isPremium = user.subscriptionPlan === 'PREMIUM' && user.subscriptionStatus === 'ACTIVE'
  
  if (!isPremium) {
    throw new Error('Funcionalidade Premium. Faça upgrade para R$ 8,99/mês.')
  }
  
  return true
}
```

---

## 📋 FASE 6: Interface do Usuário (Frontend)

### 6.1 Página de Assinatura/Upgrade
**Arquivo:** `src/app/dashboard/subscription/page.tsx`

**Componentes:**
- Banner de trial (se em trial) - "7 dias grátis restantes"
- Banner de expiração (se expirando)
- Card de plano atual (FREE, BASIC, PREMIUM)
- Botões de upgrade:
  - "Assinar Básico" (R$ 4,99/mês) - se em trial ou sem plano
  - "Upgrade para Premium" (R$ 8,99/mês) - se básico
- Comparação de planos
- Histórico de pagamentos
- Opção de cancelar assinatura

### 6.2 Atualizar Dashboard
**Arquivo:** `src/app/dashboard/page.tsx`

**Mudanças:**
- Mostrar dias restantes de trial
- Banner de upgrade se próximo de expirar
- Bloquear funcionalidades premium com modal de upgrade

### 6.3 Componente de Bloqueio Premium
**Arquivo:** `src/components/PremiumGate.tsx`

**Funcionalidade:**
- Mostrar modal quando usuário tenta acessar feature premium
- Botão para fazer upgrade
- Contador de dias de trial

---

## 📋 FASE 7: Notificações e Alertas

### 7.1 Notificações de Expiração
**Arquivo:** `src/app/api/subscription/notifications/route.ts`

**Notificações:**
- 3 dias antes do trial expirar
- 1 dia antes do trial expirar
- No dia da expiração
- Após expiração (lembrete de upgrade)

**Canais:**
- Email (via Brevo)
- Telegram (se vinculado)
- WhatsApp (se vinculado)

### 7.2 Job de Verificação Diária
**Arquivo:** `src/app/api/cron/check-subscriptions/route.ts`

**Funcionalidade:**
- Verificar assinaturas expiradas
- Enviar notificações
- Atualizar status no banco

**Configurar no Vercel:**
- Cron job diário às 00:00 UTC
- Ou usar serviço externo (Cron-job.org)

---

## 📋 FASE 8: Página de Preços/Planos

### 8.1 Landing Page de Preços
**Arquivo:** `src/app/pricing/page.tsx`

**Conteúdo:**
- Comparação de planos (FREE vs BÁSICO vs PREMIUM)
- Tabela de funcionalidades por plano
- Benefícios de cada plano
- Preços destacados (R$ 4,99 e R$ 8,99)
- FAQ
- Depoimentos (futuro)
- Botão CTA "Começar Teste Grátis de 7 dias"

### 8.2 Atualizar Homepage
**Arquivo:** `src/app/page.tsx`

**Mudanças:**
- Adicionar seção de preços
- Link para página de pricing
- CTA para teste gratuito

---

## 📋 FASE 9: Analytics e Métricas

### 9.1 Dashboard de Métricas (Admin)
**Arquivo:** `src/app/admin/subscriptions/page.tsx`

**Métricas:**
- Total de trials ativos
- Total de assinantes BÁSICO
- Total de assinantes PREMIUM
- Taxa de conversão (trial → básico)
- Taxa de conversão (trial → premium)
- Taxa de upgrade (básico → premium)
- Churn rate (cancelamentos)
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Distribuição de planos

### 9.2 Tracking de Eventos
**Eventos a rastrear:**
- Trial iniciado
- Checkout Básico iniciado
- Checkout Premium iniciado
- Pagamento Básico concluído
- Pagamento Premium concluído
- Upgrade (Básico → Premium)
- Assinatura cancelada
- Downgrade (Premium → Básico)

---

## 📋 FASE 10: Testes e Validação

### 10.1 Testes de Integração
- Testar fluxo completo: cadastro → trial → checkout → pagamento → ativação
- Testar webhooks do Stripe
- Testar cancelamento
- Testar renovação automática

### 10.2 Testes de Controle de Acesso
- Verificar bloqueio de features premium
- Verificar redirecionamento para upgrade
- Verificar notificações de expiração

---

## 🎯 Ordem de Implementação Recomendada

### Sprint 1 (Semana 1)
1. ✅ FASE 1: Atualizar schema do banco
2. ✅ FASE 3: Implementar lógica de trial
3. ✅ FASE 5: Criar middleware de controle de acesso

### Sprint 2 (Semana 2)
4. ✅ FASE 2: Escolher e configurar Stripe
5. ✅ FASE 4: Integrar checkout e webhooks
6. ✅ FASE 6: Criar página de assinatura

### Sprint 3 (Semana 3)
7. ✅ FASE 6: Atualizar UI com banners e bloqueios
8. ✅ FASE 7: Implementar notificações
9. ✅ FASE 8: Criar página de preços

### Sprint 4 (Semana 4)
10. ✅ FASE 9: Dashboard de métricas
11. ✅ FASE 10: Testes completos
12. ✅ Ajustes finais e deploy

---

## 💡 Considerações Importantes

### Período de Trial
- **Definido:** 7 dias grátis
- Sem acesso a funcionalidades premium durante o trial
- Permitir cancelar a qualquer momento
- Não pedir cartão durante o trial

### Preços Definidos
- **TESTE GRÁTIS:** 7 dias (sem funcionalidades premium)
- **BÁSICO:** R$ 4,99/mês (funcionalidades básicas)
- **PREMIUM:** R$ 8,99/mês (acesso completo + IA)
- Considerar plano anual com desconto (futuro)

### Funcionalidades por Plano

**TESTE GRÁTIS (7 dias):**
- ✅ Transações básicas (adicionar receitas/gastos)
- ✅ Metas básicas
- ✅ Dashboard simples
- ✅ Bot Telegram/WhatsApp básico
- ❌ IA Insights
- ❌ Relatórios IA
- ❌ Dicas Inteligentes

**BÁSICO (R$ 4,99/mês):**
- ✅ Tudo do Teste Grátis
- ✅ Histórico completo de transações
- ✅ Análises básicas
- ✅ Exportação de dados
- ❌ IA Insights
- ❌ Relatórios IA
- ❌ Dicas Inteligentes

**PREMIUM (R$ 8,99/mês):**
- ✅ Tudo do Básico
- ✅ IA Insights (análise inteligente de gastos)
- ✅ Relatórios IA (relatórios gerados por IA)
- ✅ Dicas Inteligentes (sugestões personalizadas)
- ✅ Categorização automática com IA
- ✅ Alertas avançados
- ✅ Suporte prioritário

### LGPD e Termos
- Criar página de Termos de Uso
- Criar página de Política de Privacidade
- Adicionar checkbox de aceite no cadastro
- Implementar cancelamento fácil (LGPD)

---

## 📊 Estimativa de Receita

**Cenário Conservador:**
- 100 usuários no trial
- Conversão: 5% Básico (5) + 2% Premium (2)
- R$ 4,99 × 5 + R$ 8,99 × 2 = **R$ 42,93/mês**

**Cenário Otimista:**
- 1.000 usuários no trial
- Conversão: 8% Básico (80) + 5% Premium (50)
- R$ 4,99 × 80 + R$ 8,99 × 50 = **R$ 899,70/mês**

**Cenário Ideal (6 meses):**
- 10.000 usuários no trial
- Conversão: 6% Básico (600) + 4% Premium (400)
- R$ 4,99 × 600 + R$ 8,99 × 400 = **R$ 6.590/mês**

---

## 🚀 Próximos Passos Imediatos

1. ✅ **Período de trial:** 7 dias (DEFINIDO)
2. ✅ **Gateway:** Stripe (DEFINIDO)
3. ✅ **Funcionalidades premium:** IA Insights, Relatórios IA, Dicas Inteligentes (DEFINIDO)
4. ✅ **Planos:** FREE (trial), BÁSICO (R$ 4,99), PREMIUM (R$ 8,99) (DEFINIDO)
5. **Começar FASE 1:** Atualizar schema do banco

---

## 📝 Notas Técnicas

- Usar Stripe Test Mode para desenvolvimento
- Implementar idempotência nos webhooks
- Criar backup antes de migrações
- Documentar todas as APIs criadas
- Implementar rate limiting nas APIs de pagamento

---

**Status:** 🟡 Aguardando início
**Prioridade:** 🔴 Alta
**Estimativa Total:** 4 semanas (1 desenvolvedor)

