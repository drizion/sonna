#!/bin/bash

# Script para preparar o servidor para receber deploys
# Execute este script no seu servidor uma única vez

set -e

echo "🚀 Configurando servidor para deploy..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    echo "✅ Docker instalado"
else
    echo "✅ Docker já instalado"
fi

# Verificar se Docker Compose está instalado
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale manualmente:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
else
    echo "✅ Docker Compose já instalado"
fi

# Criar diretório do projeto
DEPLOY_PATH="${DEPLOY_PATH:-$HOME/music-downloader}"
echo "📁 Criando diretório: $DEPLOY_PATH"
mkdir -p "$DEPLOY_PATH"
cd "$DEPLOY_PATH"

# Configurar permissões do Docker (opcional, se não for root)
if [ "$EUID" -ne 0 ]; then
    if ! groups | grep -q docker; then
        echo "⚠️  Adicionando usuário ao grupo docker..."
        sudo usermod -aG docker $USER
        echo "⚠️  IMPORTANTE: Faça logout e login novamente para aplicar as permissões!"
    fi
fi

echo ""
echo "✅ Servidor configurado!"
echo ""
echo "📝 Próximos passos:"
echo ""
echo "1. Configure os secrets no GitHub:"
echo "   - SERVER_HOST: $(curl -s ifconfig.me 2>/dev/null || echo 'SEU_IP_AQUI')"
echo "   - SERVER_USER: $USER"
echo "   - SERVER_SSH_KEY: (sua chave privada SSH)"
echo "   - DEPLOY_PATH: $DEPLOY_PATH"
echo ""
echo "2. Para gerar uma chave SSH (se ainda não tiver):"
echo "   ssh-keygen -t ed25519 -C 'github-actions'"
echo ""
echo "3. Faça login no GitHub Container Registry:"
echo "   echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin"
echo ""
echo "4. Teste o deploy fazendo push na branch main!"
