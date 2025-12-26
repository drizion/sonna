import type { ContentType, MusicProvider, ParsedMusicUrl } from '../types.js';
import { InvalidMusicUrlError } from '../types.js';
import type { MusicUrlParser } from './base-parser.js';

/**
 * Parser para URLs do SoundCloud
 * Suporta tracks e playlists, públicas e privadas
 */
export class SoundCloudParser implements MusicUrlParser {
  readonly provider: MusicProvider = 'soundcloud';

  // Regex patterns para diferentes tipos de URL
  private readonly patterns = {
    // Track público: soundcloud.com/artist/track
    trackPublic: /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/([^\/]+)\/([^\/\?]+)(?:\?.*)?$/i,
    
    // Track privado: soundcloud.com/artist/track/s-token
    trackPrivate: /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/([^\/]+)\/([^\/]+)\/(s-[A-Za-z0-9]+)(?:\?.*)?$/i,
    
    // Playlist pública: soundcloud.com/artist/sets/playlist
    playlistPublic: /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/([^\/]+)\/sets\/([^\/\?]+)(?:\?.*)?$/i,
    
    // Playlist privada: soundcloud.com/artist/sets/playlist/s-token
    playlistPrivate: /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/([^\/]+)\/sets\/([^\/]+)\/(s-[A-Za-z0-9]+)(?:\?.*)?$/i,
  };

  canParse(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }
    
    const normalized = this.normalizeUrl(url);
    return normalized.includes('soundcloud.com');
  }

  parse(url: string): ParsedMusicUrl {
    if (!this.canParse(url)) {
      throw new InvalidMusicUrlError(url, 'Not a SoundCloud URL');
    }

    const normalized = this.normalizeUrl(url);
    
    // Tentar match com cada pattern
    let match: RegExpMatchArray | null = null;
    let contentType: ContentType | null = null;
    let isPrivate = false;
    let artistSlug: string | undefined;
    let trackSlug: string | undefined;
    let playlistSlug: string | undefined;
    let secretToken: string | undefined;

    // Checar playlist privada primeiro (mais específico)
    match = normalized.match(this.patterns.playlistPrivate);
    if (match) {
      contentType = 'playlist';
      isPrivate = true;
      artistSlug = match[1];
      playlistSlug = match[2];
      secretToken = match[3];
    }

    // Checar playlist pública
    if (!match) {
      match = normalized.match(this.patterns.playlistPublic);
      if (match) {
        contentType = 'playlist';
        isPrivate = false;
        artistSlug = match[1];
        playlistSlug = match[2];
      }
    }

    // Checar track privado
    if (!match) {
      match = normalized.match(this.patterns.trackPrivate);
      if (match) {
        contentType = 'track';
        isPrivate = true;
        artistSlug = match[1];
        trackSlug = match[2];
        secretToken = match[3];
      }
    }

    // Checar track público
    if (!match) {
      match = normalized.match(this.patterns.trackPublic);
      if (match) {
        contentType = 'track';
        isPrivate = false;
        artistSlug = match[1];
        trackSlug = match[2];
        
        // Verificar se tem query param ?in= indicando que veio de uma playlist
        // Neste caso, ainda é uma track, apenas ignoramos a playlist
        const hasPlaylistContext = normalized.includes('?in=') || normalized.includes('&in=');
        if (hasPlaylistContext) {
          // Continua sendo track, só sanitizamos a URL
        }
      }
    }

    if (!match || !contentType) {
      throw new InvalidMusicUrlError(url, 'Invalid SoundCloud URL format');
    }

    // Validar que os slugs não estão vazios
    if (contentType === 'track' && (!artistSlug || !trackSlug)) {
      throw new InvalidMusicUrlError(url, 'Missing artist or track slug');
    }
    
    if (contentType === 'playlist' && (!artistSlug || !playlistSlug)) {
      throw new InvalidMusicUrlError(url, 'Missing artist or playlist slug');
    }

    const sanitizedUrl = this.sanitize(normalized);

    return {
      provider: 'soundcloud',
      contentType,
      isPrivate,
      sanitizedUrl,
      metadata: {
        artistSlug,
        trackSlug,
        playlistSlug,
        secretToken,
      },
      originalUrl: url,
    };
  }

  sanitize(url: string): string {
    const normalized = this.normalizeUrl(url);
    
    // Remover todos os query params
    const urlWithoutQuery = normalized.split('?')[0];
    
    // Garantir que começa com https://
    if (!urlWithoutQuery.startsWith('http')) {
      return `https://${urlWithoutQuery}`;
    }
    
    return urlWithoutQuery;
  }

  /**
   * Normaliza a URL para facilitar o parsing
   */
  private normalizeUrl(url: string): string {
    let normalized = url.trim();
    
    // Adicionar https:// se não tiver protocolo
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    
    return normalized;
  }
}
