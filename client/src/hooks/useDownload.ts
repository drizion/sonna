import type { AudioFormat, StoredTrack, Track } from '@music-downloader/shared';
import { useMutation } from '@tanstack/react-query';
import { downloadTrack as apiDownloadTrack, resolveUrl } from '../services/api';
import { trackExists } from '../services/storage';
import { useSaveTrack } from './useStorage';

interface DownloadTrackOptions {
  trackUrl: string;
  trackInfo: Track;
  onProgress?: (progress: number) => void;
}

export interface DownloadNotification {
  type: 'progress' | 'complete';
  track: { title: string; artist: string; artwork?: string };
  progress?: number;
}

// Global download state manager
let globalDownloadListener: ((notification: DownloadNotification | null) => void) | null = null;

export function setDownloadListener(listener: (notification: DownloadNotification | null) => void) {
  globalDownloadListener = listener;
}

export function clearDownloadNotification() {
  globalDownloadListener?.(null);
}

/**
 * Download and save a track
 */
export function useDownloadTrack() {
  const saveTrack = useSaveTrack();

  return useMutation({
    mutationFn: async ({ trackUrl, trackInfo, onProgress }: DownloadTrackOptions) => {
      console.log('[useDownloadTrack] Starting download process:', { trackUrl, trackInfo });
      
      // Notifica que o download começou
      globalDownloadListener?.({
        type: 'progress',
        track: {
          title: trackInfo.title,
          artist: trackInfo.artist,
          artwork: trackInfo.artwork,
        },
        progress: 0,
      });
      
      // Check if track already exists
      console.log('[useDownloadTrack] Checking if track exists:', trackInfo.id);
      const exists = await trackExists(trackInfo.id);
      console.log('[useDownloadTrack] Track exists:', exists);
      
      if (exists) {
        console.log('[useDownloadTrack] Track already exists, skipping download:', trackInfo.title);
        globalDownloadListener?.(null);
        return { skipped: true, track: null };
      }

      // Download the track com callback de progresso
      console.log('[useDownloadTrack] Downloading track from API...');
      const { blob, actualFormat } = await apiDownloadTrack(trackUrl, (progress) => {
        // Atualiza o progresso
        globalDownloadListener?.({
          type: 'progress',
          track: {
            title: trackInfo.title,
            artist: trackInfo.artist,
            artwork: trackInfo.artwork,
          },
          progress,
        });
        onProgress?.(progress);
      });
      console.log('[useDownloadTrack] Track downloaded:', { blobSize: blob.size, actualFormat });

      // Create stored track with the actual format from the server
      const storedTrack: StoredTrack = {
        ...trackInfo,
        blob,
        format: actualFormat as AudioFormat,
        fileSize: blob.size,
      };

      console.log('[useDownloadTrack] Saving track to IndexedDB...');
      // Save to IndexedDB
      await saveTrack.mutateAsync(storedTrack);
      console.log('[useDownloadTrack] Track saved successfully');

      // Notifica que o download foi concluído
      globalDownloadListener?.({
        type: 'complete',
        track: {
          title: trackInfo.title,
          artist: trackInfo.artist,
          artwork: trackInfo.artwork,
        },
      });

      // Limpa a notificação após 3 segundos
      setTimeout(() => {
        globalDownloadListener?.(null);
      }, 3000);

      return { skipped: false, track: storedTrack };
    },
  });
}

/**
/**
 * Resolve a SoundCloud URL
 */
export function useResolveUrl() {
  return useMutation({
    mutationFn: ({ url }: { url: string }) => 
      resolveUrl(url),
  });
}