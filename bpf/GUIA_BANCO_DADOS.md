# 📊 Guia do Banco de Dados - Meu Orçamento Inteligente

## 🗄️ Tipo de Banco de Dados

**PostgreSQL** hospedado no **Neon** (serviço de banco de dados serverless)

- ✅ Banco de dados em nuvem
- ✅ Backup automático
- ✅ Escalável
- ✅ Acesso via Prisma ORM

---

## 📋 Estrutura das Tabelas

### 1. **users** (Clientes/Usuários)
Armazena informações dos clientes:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único do usuário |
| `email` | String | Email (único, usado para login) |
| `name` | String | Nome completo |
| `password` | String | Senha criptografada (bcrypt) |
| `emailVerified` | DateTime | Data de verificação do email |
| `telegramId` | String | ID do Telegram (se vinculado) |
| `isActive` | Boolean | Se a conta está ativa |
| `lastLoginAt` | DateTime | Último login |
| `createdAt` | DateTime | Data de cadastro |
| `updatedAt` | DateTime | Última atualização |

### 2. **transactions** (Transações)
Todas as receitas e gastos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único |
| `amount` | Float | Valor da transação |
| `description` | String | Descrição (ex: "Salário", "Uber") |
| `type` | String | "INCOME" ou "EXPENSE" |
| `date` | DateTime | Data da transação |
| `userId` | String | ID do usuário |
| `categoryId` | String | ID da categoria |

### 3. **goals** (Metas Financeiras)
Metas criadas pelos clientes:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único |
| `title` | String | Título da meta |
| `targetAmount` | Float | Valor objetivo |
| `currentAmount` | Float | Valor atual |
| `status` | String | "ACTIVE", "COMPLETED", "PAUSED" |
| `userId` | String | ID do usuário |

### 4. **investments** (Investimentos)
Investimentos dos clientes:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único |
| `title` | String | Título do investimento |
| `currentAmount` | Float | Valor investido |
| `userId` | String | ID do usuário |

### 5. **categories** (Categorias)
Categorias de transações (ex: "Alimentação", "Transporte"):

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID único |
| `name` | String | Nome da categoria |
| `icon` | String | Ícone (opcional) |
| `color` | String | Cor (opcional) |

### 6. **sessions** (Sessões)
Sessões de login ativas:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | String | ID da sessão |
| `userId` | String | ID do usuário |
| `token` | String | Token JWT |
| `expiresAt` | DateTime | Data de expiração |
| `ipAddress` | String | IP do login |
| `userAgent` | String | Navegador usado |

---

## 🔍 Como Acessar os Dados

### **Opção 1: Prisma Studio (Interface Visual) - RECOMENDADO**

A forma mais fácil e visual de ver todos os dados:

```bash
npx prisma studio
```

Isso abre uma interface web em `http://localhost:5555` onde você pode:
- ✅ Ver todas as tabelas
- ✅ Ver todos os clientes e seus dados
- ✅ Editar informações
- ✅ Filtrar e buscar
- ✅ Ver relacionamentos (ex: transações de um cliente)

### **Opção 2: Scripts Prontos**

Já temos scripts criados para você:

```bash
# Listar todos os usuários
npx tsx scripts/list-users.ts

# Verificar banco de produção
npx tsx scripts/check-production-db.ts

# Deletar usuário específico por email
npx tsx scripts/delete-user-by-email.ts email@exemplo.com

# Deletar TODOS os usuários (cuidado!)
npx tsx scripts/force-delete-all.ts
```

### **Opção 3: Dashboard do Neon**

1. Acesse: https://console.neon.tech/
2. Faça login com sua conta
3. Selecione seu projeto
4. Vá em **SQL Editor**
5. Execute queries SQL diretamente:

```sql
-- Ver todos os clientes
SELECT id, name, email, "isActive", "createdAt" FROM users;

-- Ver transações de um cliente
SELECT * FROM transactions WHERE "userId" = 'id-do-cliente';

-- Ver estatísticas
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN "isActive" = true THEN 1 END) as usuarios_ativos
FROM users;
```

### **Opção 4: API Routes (Via Código)**

Você pode criar rotas de API para acessar dados:

```typescript
// Exemplo: /api/admin/users
import { prisma } from '@/lib/prisma'

const users = await prisma.user.findMany({
  include: {
    transactions: true,
    goals: true,
    investments: true
  }
})
```

---

## 📊 Informações Disponíveis sobre Cada Cliente

Para cada cliente, você tem acesso a:

1. **Dados Pessoais:**
   - Nome completo
   - Email
   - Data de cadastro
   - Status da conta (ativa/inativa)
   - Último login

2. **Dados Financeiros:**
   - Todas as transações (receitas e gastos)
   - Metas financeiras criadas
   - Investimentos realizados
   - Histórico completo de movimentações

3. **Dados de Uso:**
   - Sessões ativas
   - Se vinculou Telegram
   - Categorias mais usadas

4. **Segurança:**
   - Senha (criptografada, não pode ver)
   - Tokens de verificação de email
   - Tokens de reset de senha

---

## 🛠️ Comandos Úteis

```bash
# Abrir Prisma Studio (interface visual)
npx prisma studio

# Ver estrutura do banco
npx prisma db pull

# Aplicar mudanças no schema
npx prisma db push

# Gerar cliente Prisma
npx prisma generate

# Ver logs de queries
npx prisma studio --browser none
```

---

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- Senhas são criptografadas (não podem ser visualizadas)
- Tokens são seguros e expiram automaticamente
- Sessões são validadas a cada requisição
- Dados sensíveis não são expostos nas APIs públicas

---

## 📍 Onde Está o Banco?

- **Produção:** Neon PostgreSQL (usado pelo site em produção)
- **Local:** Mesmo banco (via `DATABASE_URL` no `.env`)

O banco é o mesmo para desenvolvimento e produção, então cuidado ao deletar dados!

---

## 💡 Dica

Use **Prisma Studio** para explorar os dados de forma visual e segura:
```bash
npx prisma studio
```

