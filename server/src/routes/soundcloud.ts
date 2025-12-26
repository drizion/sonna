import type { ResolveUrlRequest, ResolveUrlResponse } from '@music-downloader/shared';
import { MusicUrlParserFactory, SoundCloudParser } from '@music-downloader/shared';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { getSoundCloudInfo, getStreamUrl } from '../services/soundcloud-api.js';

const router = Router();

// Inicializar o parser factory
const parserFactory = new MusicUrlParserFactory();
parserFactory.register(new SoundCloudParser());

// Resolve SoundCloud URL (track or playlist)
// Token is automatically extracted from URL if present (e.g., ?secret_token=...)
router.post('/resolve', async (req: Request, res: Response) => {
  try {
    const { url } = req.body as ResolveUrlRequest;

    if (!url) {
      return res.status(400).json({
        message: 'URL is required',
        code: 'MISSING_URL'
      });
    }

    // Parse e sanitiza a URL
    const parsed = await parserFactory.parse(url);
    
    // Usa a URL sanitizada para buscar informações
    const info = await getSoundCloudInfo(parsed.sanitizedUrl);
    
    const response: ResolveUrlResponse = {
      provider: parsed.provider,
      type: parsed.contentType,
      isPrivate: parsed.isPrivate,
      sanitizedUrl: parsed.sanitizedUrl,
      data: info
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error resolving SoundCloud URL:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to resolve URL',
      code: error.code || 'RESOLVE_ERROR',
      details: error.details
    });
  }
});

// Get track info
router.get('/track/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trackInfo = await getSoundCloudInfo(
      `https://soundcloud.com/track/${id}`
    );

    res.json(trackInfo);
  } catch (error: any) {
    console.error('Error getting track info:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to get track info',
      code: 'TRACK_ERROR'
    });
  }
});

// Get playlist info
router.get('/playlist/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const playlistInfo = await getSoundCloudInfo(
      `https://soundcloud.com/playlist/${id}`
    );

    res.json(playlistInfo);
  } catch (error: any) {
    console.error('Error getting playlist info:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to get playlist info',
      code: 'PLAYLIST_ERROR'
    });
  }
});

// Get stream URL for a track
router.get('/track/:id/stream', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const streamUrl = await getStreamUrl(`https://soundcloud.com/track/${id}`);

    res.json({ streamUrl });
  } catch (error: any) {
    console.error('Error getting stream URL:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to get stream URL',
      code: 'STREAM_ERROR'
    });
  }
});

export default router;
