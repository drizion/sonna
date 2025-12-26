import type { ParsedMusicUrl } from '../types.js';
import { InvalidMusicUrlError } from '../types.js';
import type { MusicUrlParser } from './base-parser.js';

/**
 * Factory para gerenciar múltiplos parsers de URL de música
 * Permite registrar parsers específicos para cada provedor e fazer parsing automático
 */
export class MusicUrlParserFactory {
  private parsers: MusicUrlParser[] = [];

  /**
   * Registra um novo parser
   * @param parser Parser a ser registrado
   */
  register(parser: MusicUrlParser): void {
    // Evitar duplicatas
    const exists = this.parsers.some(p => p.provider === parser.provider);
    if (exists) {
      console.warn(`Parser for provider "${parser.provider}" is already registered`);
      return;
    }
    
    this.parsers.push(parser);
  }

  /**
   * Registra múltiplos parsers de uma vez
   * @param parsers Array de parsers a serem registrados
   */
  registerMany(parsers: MusicUrlParser[]): void {
    parsers.forEach(parser => this.register(parser));
  }

  /**
   * Faz o parsing de uma URL usando o parser apropriado
   * @param url URL a ser parseada
   * @returns Informações extraídas da URL
   * @throws InvalidMusicUrlError se nenhum parser puder processar a URL
   */
  parse(url: string): ParsedMusicUrl {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      throw new InvalidMusicUrlError(url, 'URL cannot be empty');
    }

    // Encontrar o parser que pode processar esta URL
    const parser = this.parsers.find(p => p.canParse(url));
    
    if (!parser) {
      throw new InvalidMusicUrlError(
        url,
        'No parser available for this URL. Supported providers: ' + 
        this.parsers.map(p => p.provider).join(', ')
      );
    }

    return parser.parse(url);
  }

  /**
   * Sanitiza uma URL usando o parser apropriado
   * @param url URL a ser sanitizada
   * @returns URL limpa
   * @throws InvalidMusicUrlError se nenhum parser puder processar a URL
   */
  sanitize(url: string): string {
    if (!url || typeof url !== 'string' || url.trim().length === 0) {
      throw new InvalidMusicUrlError(url, 'URL cannot be empty');
    }

    const parser = this.parsers.find(p => p.canParse(url));
    
    if (!parser) {
      throw new InvalidMusicUrlError(
        url,
        'No parser available for this URL'
      );
    }

    return parser.sanitize(url);
  }

  /**
   * Obtém todos os parsers registrados
   */
  getParsers(): MusicUrlParser[] {
    return [...this.parsers];
  }

  /**
   * Obtém um parser específico por provedor
   * @param provider Provedor do parser
   */
  getParser(provider: string): MusicUrlParser | undefined {
    return this.parsers.find(p => p.provider === provider);
  }

  /**
   * Remove todos os parsers registrados
   */
  clear(): void {
    this.parsers = [];
  }
}
