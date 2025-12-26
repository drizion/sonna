# Music Downloader - DJ Edition

Web application for downloading and organizing music from SoundCloud with support for public and private playlists.

## Features

- 🎵 Download tracks and playlists from SoundCloud
- 🔒 Support for private playlists with access tokens
- 💾 Offline storage using IndexedDB
- 🎨 Organize music with custom playlists and categories
- 📦 Export multiple tracks as ZIP in various formats
- 🎧 Built-in audio player for previewing tracks
- 🔄 Format conversion (WAV, FLAC, MP3, AAC, etc.)

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- IndexedDB (idb library)
- TanStack Query for state management
- Tailwind CSS for styling

### Backend
- Node.js + Express
- TypeScript
- FFmpeg for audio conversion
- SoundCloud API integration

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- FFmpeg installed (for audio conversion)

### Installation

```bash
# Install dependencies
npm install

# Start development servers (client + server)
npm run dev
```

The client will be available at `http://localhost:5173` and the server at `http://localhost:3001`.

### Development

```bash
# Run client only
npm run dev:client

# Run server only
npm run dev:server

# Build for production
npm run build
```

## Project Structure

```
music-downloader/
├── client/          # React frontend
├── server/          # Node.js backend
├── shared/          # Shared TypeScript types
├── .github/         # CI/CD workflows
├── scripts/         # Deployment scripts
└── package.json     # Root workspace configuration
```

## Docker

### Development

```bash
# Build and run with Docker Compose
docker compose up -d

# View logs
docker compose logs -f

# Stop containers
docker compose down
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

### Production Deployment

**Configurar CI/CD automático:**

1. Leia o guia completo: [.github/workflows/README.md](.github/workflows/README.md)

2. Configure os secrets no GitHub:
   - `SERVER_HOST` - IP ou domínio do servidor
   - `SERVER_USER` - Usuário SSH
   - `SERVER_SSH_KEY` - Chave privada SSH
   - `DEPLOY_PATH` - Caminho no servidor (opcional)

3. No servidor, execute uma vez:
   ```bash
   bash <(curl -s https://raw.githubusercontent.com/drizion/sonna/main/scripts/setup-server.sh)
   ```

4. Faça push na branch `main` - deploy automático! 🚀

## License

Private - For personal use only
