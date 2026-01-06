# Configuração do Brevo (Sendinblue)

## Passo a Passo

### 1. Criar conta no Brevo
1. Acesse: https://www.brevo.com/
2. Clique em "Sign up free"
3. Crie sua conta (é gratuito)

### 2. Obter API Key
1. Faça login no Brevo
2. Vá em **Settings** → **SMTP & API**
3. Clique em **API Keys**
4. Clique em **Generate a new API key**
5. Dê um nome (ex: "Meu Orçamento Inteligente")
6. Copie a chave gerada (ela só aparece uma vez!)

### 3. Configurar Email Remetente
1. No Brevo, vá em **Senders & IP**
2. Clique em **Add a sender**
3. Adicione o email que você quer usar (ex: noreply@useorbi.app)
4. Verifique o email (eles enviam um código)

### 4. Adicionar Variáveis de Ambiente

**No Vercel:**
1. Vá em Settings → Environment Variables
2. Adicione:
   - `BREVO_API_KEY` = sua chave API do Brevo
   - `BREVO_SENDER_EMAIL` = email verificado no Brevo (ex: noreply@useorbi.app)

**Local (.env):**
```env
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxx
BREVO_SENDER_EMAIL=noreply@useorbi.app
```

### 5. Pronto!
Não precisa configurar DNS! O Brevo funciona imediatamente após adicionar a API key.

## Vantagens do Brevo
- ✅ **300 emails/dia grátis**
- ✅ **Não precisa configurar DNS** (funciona imediatamente)
- ✅ **Muito fácil de configurar**
- ✅ **Confiável e rápido**
- ✅ **Interface simples**

## Teste
Após configurar, teste criando uma nova conta. O email de verificação deve chegar imediatamente!

