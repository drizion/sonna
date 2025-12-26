import type { AudioFormat } from '@music-downloader/shared';
import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';

// Set FFmpeg path if provided in env
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
}

/**
 * Convert audio buffer to different format
 */
export async function convertAudio(
  inputBuffer: Buffer,
  outputFormat: AudioFormat
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const inputStream = Readable.from(inputBuffer);

    let command = ffmpeg(inputStream);

    // Set output format and codec
    switch (outputFormat) {
      case 'mp3':
        command = command
          .audioBitrate('320k')
          .format('mp3')
          .audioCodec('libmp3lame');
        break;
      case 'wav':
        command = command
          .format('wav')
          .audioCodec('pcm_s16le');
        break;
      case 'flac':
        command = command
          .format('flac')
          .audioCodec('flac');
        break;
      case 'aac':
        command = command
          .audioBitrate('256k')
          .format('adts')
          .audioCodec('aac');
        break;
      case 'm4a':
        command = command
          .audioBitrate('256k')
          .format('ipod')
          .audioCodec('aac');
        break;
      case 'ogg':
        command = command
          .audioBitrate('256k')
          .format('ogg')
          .audioCodec('libvorbis');
        break;
      default:
        return reject(new Error(`Unsupported format: ${outputFormat}`));
    }

    command
      .on('error', (err) => {
        console.error('FFmpeg conversion error:', err);
        reject({
          message: 'Audio conversion failed',
          code: 'CONVERSION_ERROR',
          details: err.message
        });
      })
      .on('end', () => {
        resolve(Buffer.concat(chunks));
      })
      .pipe()
      .on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
  });
}

/**
 * Get audio metadata (duration, bitrate, etc.)
 */
export async function getAudioMetadata(inputBuffer: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const inputStream = Readable.from(inputBuffer);

    ffmpeg.ffprobe(inputStream as any, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
}
