# Configuração do Sistema de Trial de 7 Dias

## 📋 Resumo do Sistema Implementado

✅ **Sistema de trial de 7 dias completo implementado!**

### 🎯 Funcionalidades

1. **Trial Automático**: Novos usuários recebem 7 dias de trial grátis automaticamente
2. **Banner de Contagem**: Interface mostra dias restantes com alerta visual
3. **Bloqueio Automático**: Usuários são bloqueados quando trial expira
4. **Páginas Especiais**: Páginas de upgrade e bloqueio com design profissional
5. **Sistema de Verificação**: API para verificar e bloquear trials expirados

### 🔧 Componentes Implementados

- ✅ `calculateTrialEndDate()` - Calcula fim do trial (7 dias)
- ✅ `TrialBanner` - Banner visual com contador de dias
- ✅ `/api/cron/check-expired-trials` - API para verificar trials expirados
- ✅ `/upgrade-required` - Página para trials expirados
- ✅ `/blocked` - Página para contas bloqueadas
- ✅ Middleware de verificação de trial

## 🚀 Como Configurar Cron Job

### Opção 1: Cron Job Local (Desenvolvimento)

```bash
# Editar crontab
crontab -e

# Adicionar linha para executar a cada hora:
0 * * * * curl -X GET http://localhost:3003/api/cron/check-expired-trials

# Ou a cada 6 horas:
0 */6 * * * curl -X GET http://localhost:3003/api/cron/check-expired-trials
```

### Opção 2: Vercel Cron (Produção)

Adicionar no `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-expired-trials",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Opção 3: Serviços de Cron Externos

- **Cron-job.org**: Gratuito, configurar para chamar a URL
- **EasyCron**: Configurar para GET `https://seudominio.com/api/cron/check-expired-trials`
- **GitHub Actions**: Workflow que roda periodicamente

## 🧪 Testando o Sistema

### Testar Localmente

```bash
# 1. Verificar trials ativos
DATABASE_URL='your_database_url' npx tsx scripts/test-trial-system.ts

# 2. Testar API manualmente
curl http://localhost:3003/api/cron/check-expired-trials

# 3. Criar usuário teste com trial expirado (para teste)
# No admin dashboard, criar usuário e definir trial com data passada
```

### Verificar Funcionamento

1. **Registro**: Novos usuários devem ter `trialEndsAt` 7 dias no futuro
2. **Banner**: Dashboard deve mostrar dias restantes
3. **Bloqueio**: Usuários com trial expirado são redirecionados
4. **Admin**: Admins podem gerenciar trials no painel

## 📊 Monitoramento

### Logs Importantes

- ✅ Registros de usuário com trial
- ⚠️ Verificações de trial expirado
- 🚫 Usuários bloqueados automaticamente

### Estatísticas

```sql
-- Usuários em trial
SELECT COUNT(*) FROM users WHERE "subscriptionStatus" = 'TRIAL';

-- Trials expirando hoje
SELECT COUNT(*) FROM users
WHERE "subscriptionStatus" = 'TRIAL'
AND "trialEndsAt"::date = CURRENT_DATE;

-- Usuários bloqueados por trial
SELECT COUNT(*) FROM users
WHERE "isBlocked" = true
AND "blockedReason" LIKE '%Trial%';
```

## 🎨 Interface do Usuário

### Banner de Trial
- **Verde/Azul**: Trial normal (4-7 dias restantes)
- **Laranja/Vermelho**: Trial expirando (1-3 dias restantes)
- **Barra de progresso**: Visual dos dias restantes
- **Botão CTA**: Link direto para upgrade

### Páginas Especiais
- **`/upgrade-required`**: Design atrativo com planos
- **`/blocked`**: Informações claras sobre bloqueio
- **Responsivo**: Funciona em mobile e desktop

## 💡 Próximos Passos

1. **Configurar cron job** na sua plataforma de escolha
2. **Testar com usuários reais** em desenvolvimento
3. **Monitorar logs** após deploy em produção
4. **Ajustar timings** se necessário (ex: avisos em 5 dias)
5. **Email notifications** (opcional): avisar sobre expiração

## 🔒 Segurança

- ✅ Apenas admins podem modificar trials
- ✅ Verificação de autenticação em todas as APIs
- ✅ Logs de todas as ações administrativas
- ✅ Usuários bloqueados não têm acesso ao dashboard
- ✅ Middleware protege rotas sensíveis

---

**🎉 Sistema completo e pronto para produção!**