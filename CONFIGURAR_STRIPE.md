# 🔧 Configurar Stripe - Passo a Passo

## ✅ O que já foi feito

1. ✅ Stripe SDK instalado
2. ✅ APIs criadas:
   - `/api/subscription/checkout` - Criar sessão de checkout
   - `/api/subscription/webhook` - Receber eventos do Stripe
   - `/api/subscription/status` - Verificar status da assinatura
3. ✅ Configuração do Stripe (`src/lib/stripe.ts`)

## 📋 Próximos Passos

### 1. Criar Produtos/Planos no Stripe Dashboard

1. Acesse: https://dashboard.stripe.com/test/products
2. Clique em **"Add product"**
3. Crie o produto **"BÁSICO"**:
   - **Name:** `Orbi Básico`
   - **Description:** `Plano básico - R$ 4,99/mês`
   - **Pricing model:** `Recurring`
   - **Price:** `R$ 4,99`
   - **Billing period:** `Monthly`
   - Clique em **"Save product"**
   - **Copie o Price ID** (começa com `price_...`)

4. Crie o produto **"PREMIUM"**:
   - **Name:** `Orbi Premium`
   - **Description:** `Plano premium - R$ 8,99/mês`
   - **Pricing model:** `Recurring`
   - **Price:** `R$ 8,99`
   - **Billing period:** `Monthly`
   - Clique em **"Save product"**
   - **Copie o Price ID** (começa com `price_...`)

### 2. Configurar Webhook no Stripe

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em **"Add endpoint"**
3. Configure:
   - **Endpoint URL:** `https://useorbi.app/api/subscription/webhook`
   - **Events to send:** Selecione:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. Clique em **"Add endpoint"**
5. **Copie o Signing secret** (começa com `whsec_...`)

### 3. Configurar Variáveis de Ambiente

#### No Vercel:

1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Adicione as seguintes variáveis:

```env
# Stripe Keys (você já tem)
STRIPE_SECRET_KEY=sk_test_... (sua secret key)
STRIPE_PUBLISHABLE_KEY=pk_test_... (sua publishable key)

# Stripe Webhook Secret (obtido no passo 2)
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (obtidos no passo 1)
STRIPE_PRICE_BASIC_ID=price_... (Price ID do plano BÁSICO)
STRIPE_PRICE_PREMIUM_ID=price_... (Price ID do plano PREMIUM)

# URL da aplicação (opcional, mas recomendado)
NEXT_PUBLIC_APP_URL=https://useorbi.app
```

#### Localmente (.env.local):

Crie/edite o arquivo `.env.local` na raiz do projeto:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BASIC_ID=price_...
STRIPE_PRICE_PREMIUM_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Testar Localmente (Opcional)

Para testar webhooks localmente, use o Stripe CLI:

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks para localhost
stripe listen --forward-to localhost:3000/api/subscription/webhook
```

Isso vai gerar um `whsec_...` temporário para usar no `.env.local`.

### 5. Fazer Redeploy no Vercel

Após configurar as variáveis de ambiente no Vercel, faça um redeploy para aplicar as mudanças.

## ✅ Checklist

- [ ] Produto BÁSICO criado no Stripe (R$ 4,99/mês)
- [ ] Produto PREMIUM criado no Stripe (R$ 8,99/mês)
- [ ] Price IDs copiados
- [ ] Webhook configurado no Stripe
- [ ] Webhook secret copiado
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Variáveis de ambiente configuradas localmente (se necessário)
- [ ] Redeploy feito no Vercel

## 🧪 Testar

Após configurar tudo, você pode testar:

1. Criar um checkout:
   ```bash
   curl -X POST https://useorbi.app/api/subscription/checkout \
     -H "Cookie: session=..." \
     -H "Content-Type: application/json" \
     -d '{"plan": "BASIC"}'
   ```

2. Verificar status:
   ```bash
   curl https://useorbi.app/api/subscription/status \
     -H "Cookie: session=..."
   ```

## 📝 Notas

- Use **test mode** no Stripe para testes (chaves começam com `sk_test_` e `pk_test_`)
- Para produção, use **live mode** (chaves começam com `sk_live_` e `pk_live_`)
- O webhook precisa estar acessível publicamente (não funciona em localhost sem Stripe CLI)



