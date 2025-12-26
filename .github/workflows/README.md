# CI/CD Setup Guide

Este guia explica como configurar o deploy automático para seu servidor.

## 📋 Pré-requisitos

No seu servidor, você precisa ter:
- Docker instalado
- Docker Compose instalado
- Acesso SSH configurado

## 🔐 Configurar Secrets no GitHub

Vá em: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

Adicione os seguintes secrets:

### 1. SERVER_HOST
O IP ou domínio do seu servidor
```
Exemplo: 192.168.1.100 ou meuservidor.com
```

### 2. SERVER_USER
O usuário SSH para conectar no servidor
```
Exemplo: root ou deploy
```

### 3. SERVER_SSH_KEY
A chave privada SSH para autenticação

**Como gerar:**
```bash
# No seu computador local
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/deploy_key

# Copiar a chave pública para o servidor
ssh-copy-id -i ~/.ssh/deploy_key.pub user@seu-servidor

# Copiar a chave PRIVADA para adicionar no GitHub
cat ~/.ssh/deploy_key
```

Cole todo o conteúdo (incluindo BEGIN e END) no secret.

### 4. SERVER_PORT (opcional)
Porta SSH do servidor (padrão: 22)
```
Exemplo: 22
```

### 5. DEPLOY_PATH (opcional)
Caminho no servidor onde o projeto será deployado (padrão: ~/music-downloader)
```
Exemplo: /var/www/music-downloader
```

## 🚀 Como funciona

### Trigger automático
O deploy acontece automaticamente quando você:
- Faz push na branch `main`
- Ou executa manualmente em `Actions` → `Build and Deploy` → `Run workflow`

### Fluxo do deploy

1. **Build**: GitHub Actions constrói as imagens Docker do backend e frontend
2. **Push**: Envia as imagens para GitHub Container Registry (ghcr.io)
3. **Deploy**: Conecta no servidor via SSH e:
   - Faz login no registry
   - Atualiza o docker-compose.prod.yml
   - Faz pull das novas imagens
   - Reinicia os containers
   - Limpa imagens antigas

### Primeira vez no servidor

Prepare o servidor executando:

```bash
# Criar diretório do projeto
mkdir -p ~/music-downloader
cd ~/music-downloader

# Fazer login no GitHub Container Registry
# (você precisará de um Personal Access Token com permissão read:packages)
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

## 🔍 Verificar deploy

Após o deploy, verifique os logs:

```bash
# No servidor
cd ~/music-downloader
docker compose -f docker-compose.prod.yml logs -f
```

## 🛠️ Comandos úteis no servidor

```bash
# Ver status dos containers
docker compose -f docker-compose.prod.yml ps

# Ver logs
docker compose -f docker-compose.prod.yml logs -f

# Reiniciar manualmente
docker compose -f docker-compose.prod.yml restart

# Parar tudo
docker compose -f docker-compose.prod.yml down

# Atualizar manualmente
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## 🔒 Segurança

- As imagens são privadas no GitHub Container Registry
- Apenas pessoas com acesso ao repositório podem fazer pull
- A chave SSH deve ser mantida em segredo
- Use um usuário específico para deploy (não root se possível)

## 🌐 Variáveis de Ambiente

Se precisar adicionar variáveis de ambiente sensíveis (API keys, etc):

1. Adicione como secret no GitHub
2. Passe no workflow:
```yaml
environment:
  - MY_SECRET=${{ secrets.MY_SECRET }}
```

Ou crie um arquivo `.env` no servidor:
```bash
# No servidor
cd ~/music-downloader
nano .env
```

E modifique o docker-compose.prod.yml para usar:
```yaml
env_file:
  - .env
```
