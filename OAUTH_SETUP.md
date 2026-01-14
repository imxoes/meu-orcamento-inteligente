# 🔧 Configuração OAuth - Google & Facebook

## 📋 Checklist de Configuração

### 🟢 Google OAuth
1. [ ] Acesse: https://console.cloud.google.com/apis/credentials
2. [ ] Clique em "Criar Credenciais" > "OAuth 2.0 Client ID"
3. [ ] Configure:
   - **Tipo**: Web application
   - **Nome**: "Orbi - Meu Orçamento Inteligente"
   - **JavaScript origins**: `https://useorbi.app`
   - **Redirect URIs**: `https://useorbi.app/api/auth/callback/google`
4. [ ] Copie Client ID e Client Secret

### 🔵 Facebook OAuth
1. [ ] Acesse: https://developers.facebook.com/apps
2. [ ] Clique em "Criar App" > "Consumer"
3. [ ] Adicionar produto: "Facebook Login"
4. [ ] Configure:
   - **Valid OAuth Redirect URIs**: `https://useorbi.app/api/auth/callback/facebook`
   - **App Domains**: `useorbi.app`
   - **Site URL**: `https://useorbi.app`
5. [ ] Copie App ID e App Secret

### ⚙️ Variáveis de Ambiente

Adicione no Vercel (Dashboard > Settings > Environment Variables):

```bash
GOOGLE_CLIENT_ID=seu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_google_client_secret_aqui
FACEBOOK_CLIENT_ID=seu_facebook_app_id_aqui
FACEBOOK_CLIENT_SECRET=seu_facebook_app_secret_aqui
```

### 🚀 URLs de Redirect (Importante!)

- **Google**: `https://useorbi.app/api/auth/callback/google`
- **Facebook**: `https://useorbi.app/api/auth/callback/facebook`

### 🛡️ Segurança 2025

- **Google**: Client secrets só são visíveis uma vez na criação
- **Facebook**: Use apps separados para dev/produção
- **Ambos**: Sempre HTTPS em produção

## 📞 Suporte

Se encontrar problemas:
1. Verifique se as URLs de redirect estão EXATAMENTE como configuradas
2. Confirme que os domínios estão autorizados
3. Teste primeiro em desenvolvimento local

---

**Depois de configurar, execute:** `npm run build` e faça deploy