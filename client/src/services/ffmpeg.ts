import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import type { AudioFormat } from '@music-downloader/shared';

let ffmpeg: FFmpeg | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

/**
 * Load FFmpeg WASM
 */
async function loadFFmpeg(): Promise<void> {
  if (ffmpeg) return;
  
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      ffmpeg = new FFmpeg();
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      console.log('[FFmpeg] Loaded successfully');
    } catch (error) {
      console.error('[FFmpeg] Failed to load:', error);
      ffmpeg = null;
      throw error;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

/**
 * Get FFmpeg extension for format
 */
function getExtension(format: AudioFormat): string {
  if (format === 'original') return 'mp3';
  return format;
}

/**
 * Convert audio blob to different format
 */
export async function convertAudio(
  blob: Blob,
  fromFormat: AudioFormat,
  toFormat: AudioFormat,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  if (fromFormat === toFormat) {
    return blob;
  }

  await loadFFmpeg();
  
  if (!ffmpeg) {
    throw new Error('FFmpeg not loaded');
  }

  const inputExt = getExtension(fromFormat);
  const outputExt = getExtension(toFormat);
  const inputName = `input.${inputExt}`;
  const outputName = `output.${outputExt}`;

  try {
    // Write input file
    const arrayBuffer = await blob.arrayBuffer();
    await ffmpeg.writeFile(inputName, new Uint8Array(arrayBuffer));

    // Set progress handler
    if (onProgress) {
      ffmpeg.on('progress', ({ progress }) => {
        onProgress(Math.round(progress * 100));
      });
    }

    // Convert based on target format
    const args = ['-i', inputName];
    
    switch (toFormat) {
      case 'mp3':
        args.push('-codec:a', 'libmp3lame', '-q:a', '2');
        break;
      case 'wav':
        args.push('-codec:a', 'pcm_s16le');
        break;
      case 'flac':
        args.push('-codec:a', 'flac', '-compression_level', '5');
        break;
      case 'aac':
      case 'm4a':
        args.push('-codec:a', 'aac', '-b:a', '256k');
        break;
      case 'ogg':
        args.push('-codec:a', 'libvorbis', '-q:a', '6');
        break;
    }
    
    args.push(outputName);

    // Execute conversion
    await ffmpeg.exec(args);

    // Read output file
    const data = await ffmpeg.readFile(outputName);
    
    // Clean up
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // Create blob with correct MIME type
    const mimeTypes: Record<AudioFormat, string> = {
      'original': 'audio/mpeg',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      'm4a': 'audio/mp4',
      'ogg': 'audio/ogg',
    };

    // Create blob from the data
    // @ts-expect-error - FFmpeg FileData type compatibility
    return new Blob([data], { type: mimeTypes[toFormat] || 'audio/mpeg' });
  } catch (error) {
    console.error('[FFmpeg] Conversion failed:', error);
    throw error;
  }
}

/**
 * Check if FFmpeg is available
 */
export function isFFmpegAvailable(): boolean {
  return ffmpeg !== null || !isLoading;
}

/**
 * Preload FFmpeg
 */
export async function preloadFFmpeg(): Promise<void> {
  return loadFFmpeg();
}
