# Music URL Parser System

Sistema extensível para parsing e validação de URLs de múltiplos provedores de música (SoundCloud, Spotify, YouTube, etc.).

## 📁 Estrutura

```
shared/src/
├── parsers/
│   ├── index.ts                  # Exporta todos os parsers
│   ├── base-parser.ts            # Interface base
│   ├── factory.ts                # Factory pattern
│   ├── soundcloud-parser.ts      # Parser do SoundCloud
│   └── spotify-parser.ts         # Parser do Spotify (futuro)
├── types.ts                      # Tipos compartilhados
└── parser-examples.ts            # Exemplos de uso
```

## 🎯 Funcionalidades

### SoundCloud Parser

O parser do SoundCloud suporta:

- ✅ **Tracks públicas**: `soundcloud.com/artist/track`
- ✅ **Tracks privadas**: `soundcloud.com/artist/track/s-SecretToken`
- ✅ **Playlists públicas**: `soundcloud.com/artist/sets/playlist`
- ✅ **Playlists privadas**: `soundcloud.com/artist/sets/playlist/s-SecretToken`
- ✅ **Detecção automática** de tipo (track vs playlist)
- ✅ **Detecção de privacidade** (secret tokens)
- ✅ **Sanitização de URLs** (remove query params desnecessários)
- ✅ **Suporte a múltiplos formatos** (http, https, sem protocolo)

### Regras de Sanitização

O parser **remove** automaticamente query params como:
- `?si=` (share identifier)
- `?utm_source=`, `?utm_medium=`, `?utm_campaign=` (UTM params)
- Qualquer outro query param não essencial

O parser **mantém** apenas:
- Secret tokens no path (`/s-{token}`)

### Casos Especiais

#### Track com `?in=` de Playlist

Quando uma URL de track contém `?in=artist/sets/playlist`:

```
https://soundcloud.com/artist/track?in=artist/sets/playlist
```

O parser detecta como **track** (não playlist) e remove o query param, pois o link veio de uma playlist mas o usuário quer baixar apenas a música.

## 🚀 Uso

### Cliente (Browser)

```typescript
import { MusicUrlParserFactory, SoundCloudParser } from '@music-downloader/shared';

// Configurar
const parser = new MusicUrlParserFactory();
parser.register(new SoundCloudParser());

// Parsear URL
const result = parser.parse('https://soundcloud.com/artist/track?si=abc&utm_source=test');

console.log(result.provider);       // 'soundcloud'
console.log(result.contentType);    // 'track'
console.log(result.isPrivate);      // false
console.log(result.sanitizedUrl);   // 'https://soundcloud.com/artist/track'
console.log(result.metadata);       // { artistSlug: 'artist', trackSlug: 'track' }
```

### Servidor (Node.js)

```typescript
import { MusicUrlParserFactory, SoundCloudParser } from '@music-downloader/shared';

const parser = new MusicUrlParserFactory();
parser.register(new SoundCloudParser());

router.post('/resolve', async (req, res) => {
  const { url } = req.body;
  
  // Parse e valida
  const parsed = parser.parse(url);
  
  // Usa URL sanitizada
  const info = await getSoundCloudInfo(parsed.sanitizedUrl);
  
  res.json({
    provider: parsed.provider,
    type: parsed.contentType,
    isPrivate: parsed.isPrivate,
    sanitizedUrl: parsed.sanitizedUrl,
    data: info
  });
});
```

## 📦 Tipos

### `ParsedMusicUrl`

```typescript
interface ParsedMusicUrl {
  provider: MusicProvider;           // 'soundcloud' | 'spotify' | ...
  contentType: ContentType;          // 'track' | 'playlist' | 'album' | 'artist'
  isPrivate: boolean;                // true se tem secret token
  sanitizedUrl: string;              // URL limpa
  metadata: {
    artistSlug?: string;
    trackSlug?: string;
    playlistSlug?: string;
    secretToken?: string;
  };
  originalUrl: string;               // URL original fornecida
}
```

### `MusicUrlParser` Interface

```typescript
interface MusicUrlParser {
  provider: MusicProvider;
  canParse(url: string): boolean;
  parse(url: string): ParsedMusicUrl;
  sanitize(url: string): string;
}
```

## 🧪 Exemplos

### Track Público

```typescript
parser.parse('https://soundcloud.com/artist/track')
// {
//   provider: 'soundcloud',
//   contentType: 'track',
//   isPrivate: false,
//   sanitizedUrl: 'https://soundcloud.com/artist/track',
//   metadata: { artistSlug: 'artist', trackSlug: 'track' }
// }
```

### Track Privado

```typescript
parser.parse('https://soundcloud.com/artist/track/s-ABC123')
// {
//   provider: 'soundcloud',
//   contentType: 'track',
//   isPrivate: true,
//   sanitizedUrl: 'https://soundcloud.com/artist/track/s-ABC123',
//   metadata: {
//     artistSlug: 'artist',
//     trackSlug: 'track',
//     secretToken: 's-ABC123'
//   }
// }
```

### Playlist Privada (Exemplo Real)

```typescript
parser.parse('https://soundcloud.com/drizion/sets/playlist/s-Token?si=abc&utm_source=clipboard')
// {
//   provider: 'soundcloud',
//   contentType: 'playlist',
//   isPrivate: true,
//   sanitizedUrl: 'https://soundcloud.com/drizion/sets/playlist/s-Token',
//   metadata: {
//     artistSlug: 'drizion',
//     playlistSlug: 'playlist',
//     secretToken: 's-Token'
//   }
// }
```

### Apenas Sanitizar

```typescript
parser.sanitize('soundcloud.com/artist/track?si=test&utm_source=share')
// 'https://soundcloud.com/artist/track'
```

## ⚠️ Tratamento de Erros

```typescript
import { InvalidMusicUrlError } from '@music-downloader/shared';

try {
  parser.parse('https://invalid-url.com/test');
} catch (error) {
  if (error instanceof InvalidMusicUrlError) {
    console.log('URL inválida:', error.message);
    console.log('URL original:', error.url);
    console.log('Motivo:', error.reason);
  }
}
```

## 🔧 Extensibilidade

### Adicionar Novo Provider

```typescript
// 1. Criar parser específico
class SpotifyParser implements MusicUrlParser {
  provider = 'spotify';
  
  canParse(url: string): boolean {
    return url.includes('spotify.com');
  }
  
  parse(url: string): ParsedMusicUrl {
    // Implementar lógica específica do Spotify
  }
  
  sanitize(url: string): string {
    // Implementar sanitização
  }
}

// 2. Registrar
parser.register(new SpotifyParser());

// 3. Usar normalmente
const result = parser.parse('https://spotify.com/track/abc123');
```

## 📊 Casos de Teste Cobertos

### SoundCloud
- ✅ Track público (https, http, sem protocolo)
- ✅ Track com query params desnecessários
- ✅ Track privado com secret token
- ✅ Track privado com secret token + query params
- ✅ Track com `?in=` de playlist
- ✅ Playlist pública
- ✅ Playlist privada com secret token
- ✅ Playlist privada com query params complexos

### Erros
- ✅ URL vazia
- ✅ URL de provider não suportado
- ✅ URL com formato inválido
- ✅ URL sem slugs necessários

## 🎨 Padrões de URL

### SoundCloud

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Track público | `soundcloud.com/{artist}/{track}` | `soundcloud.com/artist/track` |
| Track privado | `soundcloud.com/{artist}/{track}/s-{token}` | `soundcloud.com/artist/track/s-ABC` |
| Playlist pública | `soundcloud.com/{artist}/sets/{playlist}` | `soundcloud.com/artist/sets/playlist` |
| Playlist privada | `soundcloud.com/{artist}/sets/{playlist}/s-{token}` | `soundcloud.com/artist/sets/playlist/s-ABC` |

### Spotify (Futuro)

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Track | `spotify.com/track/{id}` | `spotify.com/track/abc123` |
| Playlist | `spotify.com/playlist/{id}` | `spotify.com/playlist/abc123` |
| Album | `spotify.com/album/{id}` | `spotify.com/album/abc123` |
| Artist | `spotify.com/artist/{id}` | `spotify.com/artist/abc123` |

## 🔍 Debug

Para rodar os exemplos:

```bash
cd shared
npm run build
node dist/parser-examples.js
```

## 📝 Notas de Implementação

1. **Ordem dos Patterns**: Os patterns mais específicos (privados) são testados primeiro
2. **Query Params**: Todos removidos por padrão, exceto secret tokens que são parte do path
3. **Normalização**: URLs são normalizadas para lowercase e com https://
4. **Validação**: Slugs vazios causam erro
5. **Extensibilidade**: Fácil adicionar novos providers sem modificar código existente

---

Desenvolvido para o projeto music-downloader 🎵
