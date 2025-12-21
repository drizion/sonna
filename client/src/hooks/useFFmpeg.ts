import { useMutation } from '@tanstack/react-query';
import type { AudioFormat } from '@music-downloader/shared';
import { convertAudio, preloadFFmpeg } from '../services/ffmpeg';
import { useEffect } from 'react';

interface ConvertAudioOptions {
  blob: Blob;
  fromFormat: AudioFormat;
  toFormat: AudioFormat;
  onProgress?: (progress: number) => void;
}

/**
 * Hook to convert audio format using FFmpeg WASM
 */
export function useConvertAudio() {
  return useMutation({
    mutationFn: async ({ blob, fromFormat, toFormat, onProgress }: ConvertAudioOptions) => {
      console.log('[useConvertAudio] Converting audio:', { fromFormat, toFormat });
      
      const convertedBlob = await convertAudio(blob, fromFormat, toFormat, onProgress);
      
      console.log('[useConvertAudio] Conversion complete:', {
        originalSize: blob.size,
        convertedSize: convertedBlob.size,
      });
      
      return convertedBlob;
    },
  });
}

/**
 * Hook to preload FFmpeg on component mount
 */
export function useFFmpegPreload() {
  useEffect(() => {
    // Preload FFmpeg in the background
    preloadFFmpeg().catch((error) => {
      console.error('[FFmpeg] Preload failed:', error);
    });
  }, []);
}
