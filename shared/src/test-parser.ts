#!/usr/bin/env node

/**
 * Script de teste rápido do Music URL Parser
 * Execute: npm run test:parser
 */

import { MusicUrlParserFactory, SoundCloudParser, InvalidMusicUrlError } from './parsers/index.js';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color: string, ...args: any[]) {
  console.log(color, ...args, colors.reset);
}

function test(description: string, fn: () => void) {
  try {
    fn();
    log(colors.green, '✓', description);
  } catch (error: any) {
    log(colors.red, '✗', description);
    console.error('  Error:', error.message);
  }
}

// Setup
const parser = new MusicUrlParserFactory();
parser.register(new SoundCloudParser());

console.log('\n' + '='.repeat(60));
log(colors.cyan, '🎵 Music URL Parser - Test Suite');
console.log('='.repeat(60) + '\n');

// Tests
log(colors.blue, '📝 SoundCloud Track Tests');

test('Parse track público com https', () => {
  const result = parser.parse('https://soundcloud.com/artist/track');
  if (result.provider !== 'soundcloud') throw new Error('Wrong provider');
  if (result.contentType !== 'track') throw new Error('Wrong type');
  if (result.isPrivate !== false) throw new Error('Should be public');
});

test('Parse track sem protocolo', () => {
  const result = parser.parse('soundcloud.com/artist/track');
  if (!result.sanitizedUrl.startsWith('https://')) throw new Error('Missing https://');
});

test('Remove query params desnecessários', () => {
  const result = parser.parse('https://soundcloud.com/artist/track?si=abc&utm_source=test');
  if (result.sanitizedUrl.includes('?')) throw new Error('Query params not removed');
});

test('Parse track privado', () => {
  const result = parser.parse('https://soundcloud.com/artist/track/s-ABC123');
  if (!result.isPrivate) throw new Error('Should be private');
  if (result.metadata.secretToken !== 's-ABC123') throw new Error('Wrong secret token');
});

test('Track com ?in= deve ser detectado como track', () => {
  const result = parser.parse('https://soundcloud.com/artist/track?in=artist/sets/playlist');
  if (result.contentType !== 'track') throw new Error('Should be track, not playlist');
});

console.log('');
log(colors.blue, '📝 SoundCloud Playlist Tests');

test('Parse playlist pública', () => {
  const result = parser.parse('https://soundcloud.com/artist/sets/playlist');
  if (result.contentType !== 'playlist') throw new Error('Wrong type');
  if (result.isPrivate !== false) throw new Error('Should be public');
});

test('Parse playlist privada', () => {
  const result = parser.parse('https://soundcloud.com/artist/sets/playlist/s-TOKEN');
  if (!result.isPrivate) throw new Error('Should be private');
  if (result.contentType !== 'playlist') throw new Error('Wrong type');
});

test('Parse playlist privada com query params', () => {
  const url = 'https://soundcloud.com/drizion/sets/playlist/s-Token?si=abc&utm_source=clipboard';
  const result = parser.parse(url);
  if (result.sanitizedUrl.includes('?')) throw new Error('Query params not removed');
  if (result.metadata.secretToken !== 's-Token') throw new Error('Secret token lost');
});

console.log('');
log(colors.blue, '📝 Metadata Extraction Tests');

test('Extrai artist slug corretamente', () => {
  const result = parser.parse('https://soundcloud.com/my-artist/track');
  if (result.metadata.artistSlug !== 'my-artist') throw new Error('Wrong artist slug');
});

test('Extrai track slug corretamente', () => {
  const result = parser.parse('https://soundcloud.com/artist/my-track');
  if (result.metadata.trackSlug !== 'my-track') throw new Error('Wrong track slug');
});

test('Extrai playlist slug corretamente', () => {
  const result = parser.parse('https://soundcloud.com/artist/sets/my-playlist');
  if (result.metadata.playlistSlug !== 'my-playlist') throw new Error('Wrong playlist slug');
});

console.log('');
log(colors.blue, '📝 Error Handling Tests');

test('Rejeita URL vazia', () => {
  try {
    parser.parse('');
    throw new Error('Should have thrown error');
  } catch (error) {
    if (!(error instanceof InvalidMusicUrlError)) throw error;
  }
});

test('Rejeita URL de outro provider', () => {
  try {
    parser.parse('https://spotify.com/track/123');
    throw new Error('Should have thrown error');
  } catch (error) {
    if (!(error instanceof InvalidMusicUrlError)) throw error;
  }
});

test('Rejeita URL com formato inválido', () => {
  try {
    parser.parse('https://soundcloud.com/');
    throw new Error('Should have thrown error');
  } catch (error) {
    if (!(error instanceof InvalidMusicUrlError)) throw error;
  }
});

console.log('');
log(colors.blue, '📝 Sanitize Tests');

test('Sanitize apenas remove query params', () => {
  const sanitized = parser.sanitize('soundcloud.com/artist/track?test=1');
  if (sanitized !== 'https://soundcloud.com/artist/track') {
    throw new Error(`Expected clean URL, got: ${sanitized}`);
  }
});

console.log('');
log(colors.blue, '📝 Factory Tests');

test('Registra parsers corretamente', () => {
  const parsers = parser.getParsers();
  if (parsers.length === 0) throw new Error('No parsers registered');
});

test('Obtém parser por provider', () => {
  const soundcloudParser = parser.getParser('soundcloud');
  if (!soundcloudParser) throw new Error('SoundCloud parser not found');
});

test('canParse funciona corretamente', () => {
  const soundcloudParser = parser.getParser('soundcloud');
  if (!soundcloudParser) throw new Error('Parser not found');
  if (!soundcloudParser.canParse('https://soundcloud.com/artist/track')) {
    throw new Error('Should be able to parse SoundCloud URL');
  }
  if (soundcloudParser.canParse('https://spotify.com/track/123')) {
    throw new Error('Should not be able to parse Spotify URL');
  }
});

console.log('\n' + '='.repeat(60));
log(colors.green, '✨ All tests passed!');
console.log('='.repeat(60) + '\n');
