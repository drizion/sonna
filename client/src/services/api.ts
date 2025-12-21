import type {
    ResolveUrlRequest,
    ResolveUrlResponse,
    SoundCloudPlaylistInfo,
    SoundCloudTrackInfo
} from '@music-downloader/shared';
import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Resolve a SoundCloud URL (track or playlist)
 * Token is automatically extracted from URL if present (e.g., ?secret_token=...)
 */
export async function resolveUrl(url: string): Promise<ResolveUrlResponse> {
  const response = await api.post<ResolveUrlResponse>('/soundcloud/resolve', {
    url,
  } as ResolveUrlRequest);
  return response.data;
}

/**
 * Get track information
 */
export async function getTrackInfo(trackId: string): Promise<SoundCloudTrackInfo> {
  const response = await api.get<SoundCloudTrackInfo>(`/soundcloud/track/${trackId}`);
  return response.data;
}

/**
 * Get playlist information
 */
export async function getPlaylistInfo(playlistId: string): Promise<SoundCloudPlaylistInfo> {
  const response = await api.get<SoundCloudPlaylistInfo>(`/soundcloud/playlist/${playlistId}`);
  return response.data;
}

/**
 * Download a track as blob
 */
export async function downloadTrack(
  trackUrl: string,
  onProgress?: (progress: number) => void
): Promise<{ blob: Blob; actualFormat: string }> {
  console.log('[API] Starting download request:', { trackUrl });
  
  // Variáveis para controlar o progresso smooth
  const minDownloadTime = 2000; // Mínimo de 2 segundos
  const startTime = Date.now();
  let lastProgress = 0;
  let downloadComplete = false;
  let responseData: any = null;
  
  // Função de easing para simular velocidade de download realista
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  };
  
  // Inicia a animação de progresso independente
  const progressInterval = setInterval(() => {
    const elapsedTime = Date.now() - startTime;
    const rawProgress = Math.min(elapsedTime / minDownloadTime, 1);
    
    // Aplica curva de easing para progresso mais realista
    // Começa rápido e desacelera no final
    const easedProgress = easeOutCubic(rawProgress);
    const timeProgress = Math.min(easedProgress * 99, 99);
    
    if (timeProgress > lastProgress && !downloadComplete) {
      lastProgress = Math.floor(timeProgress);
      onProgress?.(lastProgress);
    }
  }, 33); // ~30fps
  
  try {
    const response = await api.post(
      '/download/track',
      { trackUrl },
      {
        responseType: 'blob',
      }
    );
    
    responseData = response;
    
    // Espera o tempo mínimo se necessário
    const elapsedTime = Date.now() - startTime;
    if (elapsedTime < minDownloadTime) {
      await new Promise(resolve => setTimeout(resolve, minDownloadTime - elapsedTime));
    }
    
    downloadComplete = true;
    clearInterval(progressInterval);
    
    // Garante 100% no final
    onProgress?.(100);
    
    console.log('[API] Download response received:', {
      status: response.status,
      headers: response.headers,
      blobSize: response.data.size
    });
    
    // Extract actual format from Content-Type header and map to file extension
    const contentType = response.headers['content-type'] || 'audio/mpeg';
    const mimeType = contentType.split('/')[1]?.split(';')[0] || 'mpeg';
    
    console.log('[API] Content-Type:', contentType, 'MIME type:', mimeType);
    
    // Map MIME types to file extensions
    const mimeToExtension: Record<string, string> = {
      'mpeg': 'mp3',
      'mp3': 'mp3',
      'wav': 'wav',
      'x-wav': 'wav',
      'flac': 'flac',
      'aac': 'aac',
      'x-m4a': 'm4a',
      'mp4': 'm4a',
      'ogg': 'ogg',
      'vorbis': 'ogg'
    };
    
    const actualFormat = mimeToExtension[mimeType] || mimeType;
    console.log('[API] Mapped format:', actualFormat);
    
    return { blob: response.data, actualFormat };
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}

/**
 * Get stream URL for a track
 */
export async function getStreamUrl(trackId: string): Promise<string> {
  const response = await api.get<{ streamUrl: string }>(`/soundcloud/track/${trackId}/stream`);
  return response.data.streamUrl;
}
