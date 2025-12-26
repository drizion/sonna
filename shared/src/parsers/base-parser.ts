import type { MusicProvider, ParsedMusicUrl } from '../types.js';

/**
 * Interface base para parsers de URL de música
 */
export interface MusicUrlParser {
  /** Identificador do provedor */
  provider: MusicProvider;
  
  /**
   * Verifica se este parser pode processar a URL fornecida
   * @param url URL a ser verificada
   * @returns true se o parser pode processar a URL
   */
  canParse(url: string): boolean;
  
  /**
   * Faz o parsing completo da URL
   * @param url URL a ser parseada
   * @returns Informações extraídas da URL
   * @throws InvalidMusicUrlError se a URL for inválida
   */
  parse(url: string): ParsedMusicUrl | Promise<ParsedMusicUrl>;
  
  /**
   * Sanitiza a URL removendo query params desnecessários
   * @param url URL a ser sanitizada
   * @returns URL limpa
   */
  sanitize(url: string): string;
}
