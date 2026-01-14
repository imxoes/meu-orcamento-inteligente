# 🔧 Configuração OAuth - Google

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

### ⚙️ Variáveis de Ambiente

Adicione no Vercel (Dashboard > Settings > Environment Variables):

```bash
GOOGLE_CLIENT_ID=seu_google_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_google_client_secret_aqui
```

### 🚀 URL de Redirect (Importante!)

- **Google**: `https://useorbi.app/api/auth/callback/google`

### 🛡️ Segurança 2025

- **Google**: Client secrets só são visíveis uma vez na criação
- **HTTPS**: Sempre obrigatório em produção

## 📞 Suporte

Se encontrar problemas:
1. Verifique se as URLs de redirect estão EXATAMENTE como configuradas
2. Confirme que os domínios estão autorizados
3. Teste primeiro em desenvolvimento local

---

**Depois de configurar, execute:** `npm run build` e faça deploy