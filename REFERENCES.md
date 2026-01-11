# REFERENCES.md - Índice Completo de Documentação

## 📚 Arquivos de Documentação Principais

### 🎯 Core Documentation (Orb Enterprise Docs)
- **[CONTEXT.md](./CONTEXT.md)** - Visão geral completa, stack tecnológica, arquitetura, integrações e variáveis de ambiente
- **[PROGRESS.md](./PROGRESS.md)** - Status atual detalhado, features completas/pendentes, bugs conhecidos, débito técnico e próximos passos *(arquivo mais crítico)*
- **[DEPLOY.md](./DEPLOY.md)** - Procedimentos completos de deploy, checklists, smoke tests, rollback e configuração de webhooks
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Estrutura de pastas, fluxos de dados, schema do banco, APIs, componentes React e performance
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Problemas conhecidos, soluções, debugging, monitoramento e procedures de emergência
- **[REFERENCES.md](./REFERENCES.md)** - Este arquivo - índice completo de documentação

---

## 🛠️ Documentação Específica por Funcionalidade

### Configuração de Integrações
- **[CONFIGURAR_STRIPE.md](./CONFIGURAR_STRIPE.md)** - Setup completo do Stripe para pagamentos
- **[BREVO_SETUP.md](./BREVO_SETUP.md)** - Configuração do Brevo para emails
- **[OPENAI_SETUP.md](./OPENAI_SETUP.md)** - Setup da OpenAI para insights Premium
- **[WHATSAPP_BOT_SETUP.md](./WHATSAPP_BOT_SETUP.md)** - Configuração do bot WhatsApp

### Troubleshooting Específico
- **[TROUBLESHOOTING_WHATSAPP.md](./TROUBLESHOOTING_WHATSAPP.md)** - Problemas específicos do WhatsApp bot

### Gestão de Usuários e Banco
- **[COMO_TORNAR_ADMIN.md](./COMO_TORNAR_ADMIN.md)** - Como promover usuários a admin
- **[GUIA_BANCO_DADOS.md](./GUIA_BANCO_DADOS.md)** - Guia completo do banco PostgreSQL + Prisma
- **[DASHBOARD_DB_GUIA.md](./DASHBOARD_DB_GUIA.md)** - Conexão e uso do banco no dashboard

### Planos e Roadmap
- **[ROADMAP_ASSINATURAS.md](./ROADMAP_ASSINATURAS.md)** - Roadmap detalhado do sistema de assinaturas
- **[AUDITORIA_PROJETO.md](./AUDITORIA_PROJETO.md)** - Auditoria técnica do projeto

### Setup Geral
- **[README.md](./README.md)** - Visão geral e instruções básicas de instalação

---

## 🗂️ Estrutura do Código

### Configurações Principais
```
/
├── package.json           # Dependencies & scripts
├── next.config.ts        # Next.js configuration (ignoreBuildErrors: true)
├── vercel.json           # Vercel deployment config
├── tsconfig.json         # TypeScript configuration
├── prisma/schema.prisma  # Database schema (PostgreSQL)
└── .env.local           # Environment variables
```

### Source Code
```
src/
├── app/                  # Next.js App Router
│   ├── api/              # 46 API endpoints
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Protected dashboard pages
│   └── page.tsx         # Landing page
├── lib/                  # Utilities & configurations
├── components/ui/        # Reusable React components
├── middleware.ts         # Security & auth middleware
└── types/               # TypeScript definitions
```

### Utility Scripts
```
scripts/
├── check-*.ts           # Database verification scripts
├── create-*.ts          # User/data creation scripts
├── delete-*.ts          # Cleanup scripts
├── test-*.ts           # Testing utilities
└── list-users.ts       # User management
```

---

## 🔗 Links de Referência Rápida

### Aplicação em Produção
- **Site Principal:** https://useorbi.app
- **Dashboard:** https://useorbi.app/dashboard
- **Login:** https://useorbi.app/auth/login
- **Admin Panel:** https://useorbi.app/dashboard/admin

### APIs Principais
- **Health Check:** https://useorbi.app/api/health
- **Webhook Telegram:** https://useorbi.app/api/telegram/webhook
- **Webhook WhatsApp:** https://useorbi.app/api/whatsapp/webhook
- **Stripe Webhook:** https://useorbi.app/api/subscription/webhook

---

## 🎛️ Comandos Úteis de Referência Rápida

### Desenvolvimento
```bash
npm run dev              # Desenvolvimento local (porta 3003)
npm run build           # Build de produção
npm run start           # Servidor de produção
npm run lint            # Linting
```

### Database
```bash
npm run db:studio       # Prisma Studio
npm run db:migrate      # Apply migrations (prisma db push)
npm run db:check        # Verificar conexão com produção
npm run db:list-users   # Listar usuários
```

### Debugging
```bash
npx vercel logs --follow              # Logs em tempo real
npx tsx scripts/create-test-user.ts   # Criar usuário de teste
npx tsx scripts/clear-rate-limit.ts   # Limpar rate limits
JWT_SECRET='...' npx tsx scripts/test-jwt.ts  # Testar JWT
```

### Deploy
```bash
git push origin main    # Deploy automático
npx vercel --prod      # Deploy manual
vercel rollback [url]  # Rollback
```

---

## 📋 Checklists de Referência

### Pre-Deploy Checklist
- [ ] `npm run build` executado com sucesso
- [ ] `npm run db:check` conectando ao banco
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Webhooks testados (Telegram, WhatsApp, Stripe)

### Post-Deploy Checklist
- [ ] https://useorbi.app carregando
- [ ] Login funcionando
- [ ] Bots respondendo mensagens
- [ ] Stripe checkout funcionando
- [ ] OpenAI insights gerando (Premium)

### Emergency Checklist
- [ ] Verificar https://vercel-status.com
- [ ] Verificar https://neon.tech/status
- [ ] Logs do Vercel para erros
- [ ] Rollback se necessário

---

## 🔧 Ferramentas e Dashboards

### Desenvolvimento
- **Prisma Studio:** `npm run db:studio`
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Neon Console:** https://console.neon.tech

### Monitoramento
- **Vercel Functions:** Logs e performance
- **Stripe Dashboard:** Payments e webhooks
- **Telegram BotFather:** Bot configuration
- **OpenAI Dashboard:** Usage tracking

### External Services
- **Brevo:** Email marketing
- **Resend:** Transactional emails
- **EditaCódigo:** WhatsApp API

---

## 📖 Documentações Externas

### APIs Principais
- **Next.js 15:** https://nextjs.org/docs
- **Prisma ORM:** https://www.prisma.io/docs
- **Telegram Bot API:** https://core.telegram.org/bots/api
- **Stripe API:** https://stripe.com/docs/api
- **OpenAI API:** https://platform.openai.com/docs

### Deployment & Hosting
- **Vercel:** https://vercel.com/docs
- **Neon PostgreSQL:** https://neon.tech/docs

### Authentication & Security
- **JWT.io:** https://jwt.io/
- **bcryptjs:** https://www.npmjs.com/package/bcryptjs

---

## 🎯 Como Encontrar Informações Específicas

### "Preciso configurar uma integração"
→ Consulte os arquivos `*_SETUP.md` na raiz

### "Tenho um problema/erro"
→ Consulte **TROUBLESHOOTING.md** primeiro

### "Preciso fazer deploy"
→ Siga os procedimentos em **DEPLOY.md**

### "Quero entender como o sistema funciona"
→ Leia **CONTEXT.md** e **ARCHITECTURE.md**

### "Preciso saber o status do projeto"
→ Consulte **PROGRESS.md** (sempre atualizado)

### "Quero adicionar uma nova funcionalidade"
→ 1. **CONTEXT.md** para entender arquitetura
→ 2. **ARCHITECTURE.md** para padrões de código
→ 3. **PROGRESS.md** para registrar mudanças

### "Sistema não está funcionando em produção"
→ 1. **TROUBLESHOOTING.md** → Seção Emergency Procedures
→ 2. **DEPLOY.md** → Rollback Procedures

---

## 🔄 Atualizações da Documentação

### Protocolo de Atualização
1. **PROGRESS.md:** Sempre atualizar quando fizer mudanças significativas
2. **TROUBLESHOOTING.md:** Adicionar novos problemas encontrados
3. **DEPLOY.md:** Atualizar procedures se mudarem
4. **ARCHITECTURE.md:** Atualizar se arquitetura mudar
5. **Este arquivo (REFERENCES.md):** Adicionar novos documentos criados

### Responsabilidades
- **Claude:** Manter PROGRESS.md atualizado após cada task significativa
- **Desenvolvedor:** Revisar documentação após deploys importantes
- **Team:** Adicionar troubleshooting quando encontrar problemas novos