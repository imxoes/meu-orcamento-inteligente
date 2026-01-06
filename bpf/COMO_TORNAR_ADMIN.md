# 🔐 Como Tornar sua Conta Administradora

## 🚀 Método Rápido (Script)

Execute no terminal:

```bash
cd /Users/imxoes/dev/MeuOrcamentoInteligente
npx tsx scripts/make-admin.ts seu-email@exemplo.com
```

**Exemplo:**
```bash
npx tsx scripts/make-admin.ts matheushilariolopes@gmail.com
```

## 📋 O que você pode fazer como Admin

### ✅ **Gerenciar Assinaturas:**
- Alterar plano de qualquer usuário (FREE → BASIC → PREMIUM)
- Alterar status de assinatura (TRIAL → ACTIVE → EXPIRED → CANCELLED)
- **Bypass do Stripe** - pode dar planos sem pagamento

### ✅ **Gerenciar Contas:**
- Suspender/bloquear contas (`isActive: false`)
- Ativar contas bloqueadas
- Tornar outros usuários admin
- Ver todos os dados dos usuários

### ✅ **Estatísticas:**
- Ver total de usuários
- Ver usuários por plano (Trial, Básico, Premium)
- Ver estatísticas de transações, metas, investimentos

### ✅ **Busca e Filtros:**
- Buscar usuários por nome ou email
- Filtrar por status (Ativo, Inativo, Trial, Básico, Premium, Admin)

## 🎯 Acessar o Painel Admin

1. **Torne-se admin** (use o script acima)
2. **Faça login** no site
3. **Acesse:** `/dashboard/admin`
4. Ou clique em **"Painel Admin"** no menu lateral (só aparece para admins)

## ⚠️ Segurança

- Apenas usuários com `role: 'ADMIN'` podem acessar
- Todas as APIs de admin verificam permissões
- Não compartilhe acesso admin com ninguém

## 🔧 Troubleshooting

Se o script não funcionar, você pode tornar admin manualmente via Prisma Studio:

1. Execute: `npx prisma studio`
2. Abra a tabela `users`
3. Encontre seu usuário pelo email
4. Altere o campo `role` de `USER` para `ADMIN`
5. Salve



