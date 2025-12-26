/**
 * Exemplos de uso do Music URL Parser
 * 
 * Este arquivo demonstra como usar o sistema de parsing de URLs
 */

import { MusicUrlParserFactory, SoundCloudParser } from './parsers/index.js';

// Criar e configurar o factory
const parser = new MusicUrlParserFactory();
parser.register(new SoundCloudParser());

// =====================================
// EXEMPLOS DE URLS DO SOUNDCLOUD
// =====================================

console.log('=== SOUNDCLOUD PARSER EXAMPLES ===\n');

// 1. Track público com https
console.log('1. Track público com https:');
const track1 = parser.parse('https://soundcloud.com/artist-name/track-name');
console.log(track1);
console.log('Sanitized:', track1.sanitizedUrl);
console.log('');

// 2. Track público sem protocolo
console.log('2. Track público sem protocolo:');
const track2 = parser.parse('soundcloud.com/artist-name/track-name');
console.log(track2);
console.log('');

// 3. Track público com query params desnecessários
console.log('3. Track com query params (utm, si):');
const track3 = parser.parse('https://soundcloud.com/artist-name/track-name?si=abc123&utm_source=clipboard&utm_medium=text');
console.log(track3);
console.log('Original:', track3.originalUrl);
console.log('Sanitized:', track3.sanitizedUrl);
console.log('');

// 4. Track com query param ?in= de playlist (deve ignorar a playlist)
console.log('4. Track com ?in= de playlist (ignora playlist):');
const track4 = parser.parse('https://soundcloud.com/artist-name/track-name?in=artist/sets/playlist-name');
console.log(track4);
console.log('Type:', track4.contentType); // Deve ser 'track'
console.log('');

// 5. Track privado com secret token
console.log('5. Track privado com secret token:');
const track5 = parser.parse('https://soundcloud.com/artist-name/track-name/s-SecretToken123');
console.log(track5);
console.log('Private:', track5.isPrivate);
console.log('Secret Token:', track5.metadata.secretToken);
console.log('');

// 6. Track privado com secret token + query params
console.log('6. Track privado com secret token + query params:');
const track6 = parser.parse('https://soundcloud.com/artist-name/track-name/s-SecretToken123?si=abc&utm_source=clipboard');
console.log(track6);
console.log('Private:', track6.isPrivate);
console.log('Sanitized:', track6.sanitizedUrl);
console.log('');

// 7. Playlist pública
console.log('7. Playlist pública:');
const playlist1 = parser.parse('https://soundcloud.com/artist-name/sets/playlist-name');
console.log(playlist1);
console.log('Type:', playlist1.contentType); // Deve ser 'playlist'
console.log('');

// 8. Playlist privada com secret token
console.log('8. Playlist privada com secret token:');
const playlist2 = parser.parse('https://soundcloud.com/drizion/sets/set-foda-atualizado-2026/s-Zny9PbEIV56');
console.log(playlist2);
console.log('Private:', playlist2.isPrivate);
console.log('Secret Token:', playlist2.metadata.secretToken);
console.log('');

// 9. Playlist privada (exemplo real) com query params
console.log('9. Playlist privada (exemplo real completo):');
const playlist3 = parser.parse('https://soundcloud.com/drizion/sets/set-foda-atualizado-2026/s-Zny9PbEIV56?si=189ab1eea268454abf941781bbe19d7d&utm_source=clipboard&utm_medium=text&utm_campaign=social_sharing');
console.log(playlist3);
console.log('Original URL length:', playlist3.originalUrl.length);
console.log('Sanitized URL length:', playlist3.sanitizedUrl.length);
console.log('Query params removed:', playlist3.originalUrl.length - playlist3.sanitizedUrl.length, 'chars');
console.log('');

// 10. Usar apenas sanitize (sem parse completo)
console.log('10. Apenas sanitizar URL:');
const sanitized = parser.sanitize('soundcloud.com/artist/track?si=abc&utm_source=test&random=param');
console.log('Sanitized:', sanitized);
console.log('');

// =====================================
// EXEMPLOS DE ERROS
// =====================================

console.log('=== ERROR HANDLING EXAMPLES ===\n');

// URL inválida
try {
  parser.parse('https://youtube.com/watch?v=abc123');
} catch (error: any) {
  console.log('Error (URL não suportada):', error.message);
}

// URL vazia
try {
  parser.parse('');
} catch (error: any) {
  console.log('Error (URL vazia):', error.message);
}

// URL do SoundCloud com formato errado
try {
  parser.parse('https://soundcloud.com/');
} catch (error: any) {
  console.log('Error (formato inválido):', error.message);
}

console.log('');

// =====================================
// DEMONSTRAÇÃO DE EXTENSIBILIDADE
// =====================================

console.log('=== EXTENSIBILITY DEMO ===\n');

console.log('Parsers registrados:', parser.getParsers().map(p => p.provider));
console.log('');

// Exemplo: verificar se pode parsear
const urlsToTest = [
  'https://soundcloud.com/artist/track',
  'https://spotify.com/track/abc123',
  'https://youtube.com/watch?v=123',
];

console.log('Can parse test:');
urlsToTest.forEach(url => {
  const soundcloudParser = parser.getParser('soundcloud');
  if (soundcloudParser) {
    console.log(`${url}: ${soundcloudParser.canParse(url)}`);
  }
});
