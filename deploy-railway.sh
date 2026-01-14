#!/bin/bash

# Script de Deploy para Railway
echo "🚀 Iniciando deploy do Meu Orçamento Inteligente..."

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Erro: Railway CLI não encontrado"
    echo "📦 Instale com: npm install -g @railway/cli"
    exit 1
fi

# Verificar se está logado no Railway
if ! railway whoami &> /dev/null; then
    echo "🔑 Fazendo login no Railway..."
    railway login
fi

# Verificar status do projeto
echo "📊 Verificando projeto Railway..."
railway status

# Fazer commit das mudanças (se houver)
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Fazendo commit das mudanças pendentes..."
    git add .
    git commit -m "chore: deploy $(date '+%Y-%m-%d %H:%M')"
fi

# Fazer push do código
echo "📤 Fazendo push do código..."
git push origin master

# Fazer deploy no Railway
echo "🚀 Fazendo deploy no Railway..."

# Se não há serviço linkado, criar um novo
if ! railway service &> /dev/null; then
    echo "🆕 Criando novo serviço..."
    # Aqui você precisará linkar manualmente ou criar via web
    echo "❗ Acesse https://railway.app e crie um novo serviço"
    echo "❗ Depois execute: railway service link"
    exit 1
fi

# Configurar variáveis de ambiente necessárias
echo "⚙️ Configurando variáveis de ambiente..."

# Verificar se DATABASE_URL está configurada
if ! railway variables | grep -q "DATABASE_URL"; then
    echo "❗ IMPORTANTE: Configure a variável DATABASE_URL no Railway"
    echo "   Valor: postgresql://neondb_owner:npg_qCaX1OnyR6YQ@ep-plain-morning-acq2dmtb-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
fi

# Verificar outras variáveis importantes
railway variables | grep -E "(DATABASE_URL|NEXTAUTH_SECRET|NEXTAUTH_URL|JWT_SECRET|BREVO_API_KEY)" || echo "❗ Verifique se todas as variáveis estão configuradas"

# Fazer deploy
echo "🚀 Executando deploy..."
railway up

# Verificar status após deploy
echo "✅ Deploy concluído!"
echo "📊 Status do serviço:"
railway status

# Mostrar logs recentes
echo "📋 Logs recentes:"
railway logs --tail 20

echo ""
echo "🎉 Deploy finalizado!"
echo "🌐 Acesse seu projeto em: $(railway domain 2>/dev/null || echo 'Configure um domínio no Railway')"
echo ""
echo "📋 Próximos passos:"
echo "1. ✅ Verificar se o site está funcionando"
echo "2. ✅ Testar login e funcionalidades"
echo "3. ✅ Configurar domínio personalizado (opcional)"
echo "4. ✅ Configurar cron job para trials: https://seudominio.com/api/cron/check-expired-trials"