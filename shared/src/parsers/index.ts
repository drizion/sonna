/**
 * Music URL Parsers
 * Sistema para parsing e validação de URLs de múltiplos provedores de música
 */

export * from './base-parser.js';
export * from './factory.js';
export * from './soundcloud-parser.js';

// Re-exportar tipos do módulo principal
export type { MusicProvider, ContentType, ParsedMusicUrl } from '../types.js';
export { InvalidMusicUrlError } from '../types.js';
