# Deployment Documentation

## 📦 Arquivos Criados

### 1. `.github/workflows/deploy.yml`
Workflow do GitHub Actions que:
- Faz build das imagens Docker (backend + frontend)
- Publica no GitHub Container Registry (ghcr.io)
- Conecta no servidor via SSH
- Atualiza os containers automaticamente

### 2. `.github/workflows/README.md`
Guia completo de configuração do CI/CD com:
- Como configurar secrets no GitHub
- Como gerar chaves SSH
- Como funciona o fluxo de deploy
- Comandos úteis para gerenciar no servidor

### 3. `scripts/setup-server.sh`
Script para preparar o servidor (executar uma única vez):
- Instala Docker se necessário
- Cria diretórios
- Configura permissões
- Mostra próximos passos

### 4. `docker-compose.prod.example.yml`
Exemplo do arquivo usado em produção

## 🚀 Setup Rápido

### Passo 1: No seu servidor

```bash
# Copie e execute este comando no servidor
curl -fsSL https://raw.githubusercontent.com/drizion/sonna/main/scripts/setup-server.sh | bash
```

Ou manualmente:
```bash
# Criar diretório
mkdir -p ~/music-downloader
cd ~/music-downloader

# Instalar Docker (se necessário)
curl -fsSL https://get.docker.com | sh

# Fazer login no GitHub Container Registry
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u drizion --password-stdin
```

### Passo 2: Gerar chave SSH (no seu computador local)

```bash
# Gerar chave
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/music_deploy

# Copiar chave pública para o servidor
ssh-copy-id -i ~/.ssh/music_deploy.pub user@seu-servidor

# Ver a chave privada (para copiar pro GitHub)
cat ~/.ssh/music_deploy
```

### Passo 3: Configurar Secrets no GitHub

Vá em: **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret | Descrição | Exemplo |
|--------|-----------|---------|
| `SERVER_HOST` | IP ou domínio do servidor | `192.168.1.100` |
| `SERVER_USER` | Usuário SSH | `deploy` ou `root` |
| `SERVER_SSH_KEY` | Chave privada SSH completa | Conteúdo de `~/.ssh/music_deploy` |
| `SERVER_PORT` | Porta SSH (opcional) | `22` |
| `DEPLOY_PATH` | Caminho no servidor (opcional) | `~/music-downloader` |

### Passo 4: Fazer Deploy!

```bash
# Commit e push
git add .
git commit -m "Setup CI/CD"
git push origin main
```

O deploy acontecerá automaticamente! 🎉

## 📊 Monitorar Deploy

### No GitHub
- Vá em **Actions** para ver o progresso
- Cada push na `main` dispara um deploy
- Pode executar manualmente em **Actions** → **Build and Deploy** → **Run workflow**

### No Servidor

```bash
# Ver status dos containers
docker compose -f docker-compose.prod.yml ps

# Ver logs em tempo real
docker compose -f docker-compose.prod.yml logs -f

# Ver logs só do backend
docker compose -f docker-compose.prod.yml logs -f backend

# Ver logs só do frontend
docker compose -f docker-compose.prod.yml logs -f frontend
```

## 🔧 Gerenciamento

### Reiniciar serviços

```bash
# Reiniciar tudo
docker compose -f docker-compose.prod.yml restart

# Reiniciar só o backend
docker compose -f docker-compose.prod.yml restart backend
```

### Atualizar manualmente

```bash
cd ~/music-downloader
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

### Ver recursos utilizados

```bash
docker stats
```

### Limpar espaço

```bash
# Remover imagens não utilizadas
docker image prune -a -f

# Remover tudo que não está em uso
docker system prune -a -f
```

## 🔒 Segurança

✅ Imagens privadas no GitHub Container Registry
✅ Autenticação SSH com chave (não senha)
✅ Secrets armazenados de forma segura no GitHub
✅ Health checks configurados
✅ Auto-restart em caso de falha

## 🌐 URLs de Produção

Após o deploy, seu app estará disponível em:
- Frontend: `http://SEU_SERVIDOR:5173`
- Backend API: `http://SEU_SERVIDOR:3001`

### Usar com domínio (opcional)

Configure um reverse proxy (Nginx/Caddy) no servidor:

```nginx
# Exemplo Nginx
server {
    listen 80;
    server_name music.seudominio.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

## 🐛 Troubleshooting

### Deploy falhou no GitHub Actions
- Verifique os logs em **Actions**
- Confirme que os secrets estão corretos
- Teste conexão SSH manualmente: `ssh -i ~/.ssh/music_deploy user@servidor`

### Containers não sobem no servidor
```bash
# Ver logs detalhados
docker compose -f docker-compose.prod.yml logs

# Verificar se as imagens foram baixadas
docker images | grep sonna

# Tentar pull manual
docker compose -f docker-compose.prod.yml pull
```

### Erro de permissão no Docker
```bash
# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Fazer logout e login novamente
```

### Porta já em uso
```bash
# Ver o que está usando a porta
sudo lsof -i :5173
sudo lsof -i :3001

# Parar o processo ou mudar a porta no docker-compose
```
