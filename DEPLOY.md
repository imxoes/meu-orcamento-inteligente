# Deploy para Produção - Meu Orçamento Inteligente

## 🚀 Deploy na Vercel

### 1. Fazer login na Vercel
```bash
npx vercel login
```

### 2. Deploy inicial
```bash
npx vercel
```

### 3. Configurar banco de dados PostgreSQL

Na dashboard da Vercel:
1. Acesse **Storage** → **Create Database** → **PostgreSQL**
2. Copie a `DATABASE_URL` gerada

### 4. Configurar variáveis de ambiente

Na dashboard da Vercel → **Settings** → **Environment Variables**:

```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=https://seu-dominio.vercel.app
JWT_SECRET=your-jwt-secret-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-gmail
EMAIL_FROM_NAME=Meu Orçamento Inteligente
```

### 5. Executar migrações do banco

```bash
npx vercel env pull .env.local
npx prisma generate
npx prisma db push
```

### 6. Deploy final
```bash
npx vercel --prod
```

## 🔧 Configuração do Gmail

1. Ative a verificação em 2 etapas na sua conta Google
2. Vá em **Configurações** → **Segurança** → **Senhas de app**
3. Crie uma senha de app para "Mail"
4. Use essa senha no `SMTP_PASS`

## 🌐 Configurar domínio customizado

Na dashboard da Vercel → **Settings** → **Domains**:
1. Adicione seu domínio
2. Configure os DNS conforme instruído
3. Atualize `NEXTAUTH_URL` para seu domínio

## ✅ Verificar funcionamento

Após deploy, teste:
- ✅ Homepage: `https://seu-dominio.com`
- ✅ Cadastro: `https://seu-dominio.com/auth/signup`
- ✅ Dashboard: `https://seu-dominio.com/dashboard`
- ✅ API: `https://seu-dominio.com/api/auth/signup`

## 🔐 Segurança

- [ ] Configure CORS se necessário
- [ ] Configure rate limiting para produção
- [ ] Configure monitoramento de logs
- [ ] Configure backup automático do banco

## 📧 Email em produção

Com SMTP configurado, o sistema enviará:
1. **Email de verificação** → Após cadastro
2. **Email de boas-vindas** → Após confirmação
3. **Notificações** → Conforme necessário

## 🛠️ Comandos úteis

```bash
# Ver logs
npx vercel logs

# Redeploy
npx vercel --prod

# Ver status
npx vercel ls

# Ver builds
npx vercel inspect
```