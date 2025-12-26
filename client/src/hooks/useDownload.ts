import type { AudioFormat, Playlist, SoundCloudPlaylistInfo, StoredTrack, Track } from '@music-downloader/shared';
import { useMutation } from '@tanstack/react-query';
import { downloadTrack as apiDownloadTrack, resolveUrl } from '../services/api';
import { trackExists } from '../services/storage';
import { useSavePlaylist } from './usePlaylist';
import { useSaveTrack } from './useStorage';

interface DownloadTrackOptions {
  trackUrl: string;
  trackInfo: Track;
  onProgress?: (progress: number) => void;
}

interface DownloadPlaylistOptions {
  playlistInfo: SoundCloudPlaylistInfo;
  onProgress?: (current: number, total: number, trackTitle: string) => void;
}

export interface DownloadNotification {
  type: 'progress' | 'complete' | 'playlist-progress';
  track?: { title: string; artist: string; artwork?: string };
  playlist?: { title: string; current: number; total: number; currentTrack: string };
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
 * Download and save an entire playlist
 */
export function useDownloadPlaylist() {
  const saveTrack = useSaveTrack();
  const savePlaylist = useSavePlaylist();

  return useMutation({
    mutationFn: async ({ playlistInfo, onProgress }: DownloadPlaylistOptions) => {
      console.log('[useDownloadPlaylist] Starting playlist download:', playlistInfo.title);
      
      const totalTracks = playlistInfo.tracks.length;
      const downloadedTrackIds: string[] = [];
      const skippedCount: number = 0;
      
      // Criar a playlist no banco primeiro
      const playlist: Playlist = {
        id: playlistInfo.id.toString(),
        name: playlistInfo.title,
        description: playlistInfo.description,
        trackIds: [],
        source: 'soundcloud',
        sourceUrl: playlistInfo.permalink_url,
        artwork: playlistInfo.artwork_url,
        createdDate: new Date(),
        updatedDate: new Date(),
        isPrivate: playlistInfo.is_private,
      };

      console.log('[useDownloadPlaylist] Created playlist object:', playlist);

      // Download cada track
      for (let i = 0; i < playlistInfo.tracks.length; i++) {
        const trackInfo = playlistInfo.tracks[i];
        const currentIndex = i + 1;

        console.log(`[useDownloadPlaylist] Processing track ${currentIndex}/${totalTracks}:`, trackInfo.title);

        // Notificar progresso
        globalDownloadListener?.({
          type: 'playlist-progress',
          playlist: {
            title: playlistInfo.title,
            current: currentIndex,
            total: totalTracks,
            currentTrack: trackInfo.title,
          },
        });

        onProgress?.(currentIndex, totalTracks, trackInfo.title);

        // Verificar se a track já existe
        const exists = await trackExists(trackInfo.id.toString());
        
        if (exists) {
          console.log('[useDownloadPlaylist] Track already exists, skipping:', trackInfo.title);
          downloadedTrackIds.push(trackInfo.id.toString());
          continue;
        }

        try {
          // Download da track
          const { blob, actualFormat } = await apiDownloadTrack(
            trackInfo.permalink_url,
            (progress) => {
              console.log(`[useDownloadPlaylist] Track ${currentIndex}/${totalTracks} progress: ${progress}%`);
            }
          );

          // Criar Track object
          const track: Track = {
            id: trackInfo.id.toString(),
            title: trackInfo.title,
            artist: trackInfo.user.username,
            duration: Math.floor(trackInfo.duration / 1000),
            artwork: trackInfo.artwork_url,
            sourceUrl: trackInfo.permalink_url,
            source: 'soundcloud',
            format: actualFormat as AudioFormat,
            downloadDate: new Date(),
            fileSize: blob.size,
            genre: trackInfo.genre,
            bpm: trackInfo.bpm,
            sourcePlaylistId: playlistInfo.id.toString(),
          };

          const storedTrack: StoredTrack = {
            ...track,
            blob,
          };

          // Salvar track
          await saveTrack.mutateAsync(storedTrack);
          downloadedTrackIds.push(track.id);

          console.log(`[useDownloadPlaylist] Track ${currentIndex}/${totalTracks} saved:`, track.title);
        } catch (error) {
          console.error(`[useDownloadPlaylist] Error downloading track ${trackInfo.title}:`, error);
          // Continuar com as próximas tracks mesmo se uma falhar
        }
      }

      // Atualizar playlist com os IDs das tracks
      playlist.trackIds = downloadedTrackIds;
      await savePlaylist.mutateAsync(playlist);

      console.log('[useDownloadPlaylist] Playlist saved with', downloadedTrackIds.length, 'tracks');

      // Notificar conclusão
      globalDownloadListener?.({
        type: 'complete',
        track: {
          title: `Playlist: ${playlistInfo.title}`,
          artist: `${downloadedTrackIds.length} músicas baixadas`,
          artwork: playlistInfo.artwork_url,
        },
      });

      // Limpar notificação após 5 segundos
      setTimeout(() => {
        globalDownloadListener?.(null);
      }, 5000);

      return {
        playlist,
        downloadedCount: downloadedTrackIds.length,
        skippedCount,
        totalCount: totalTracks,
      };
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