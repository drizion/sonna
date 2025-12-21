import type { ConvertRequest, DownloadRequest } from '@music-downloader/shared';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { convertAudio } from '../services/converter.js';
import { downloadTrack } from '../services/soundcloud-api.js';

const router = Router();

// Download track
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { trackUrl } = req.body as DownloadRequest;

    if (!trackUrl) {
      return res.status(400).json({
        message: 'Track URL is required',
        code: 'MISSING_TRACK_URL'
      });
    }

    // Always download in original format
    const audioBuffer = await downloadTrack(trackUrl);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Disposition': 'attachment; filename="track.mp3"'
    });
    res.send(audioBuffer);
  } catch (error: any) {
    console.error('Error downloading track:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to download track',
      code: 'DOWNLOAD_ERROR'
    });
  }
});

// Convert audio format
router.post('/convert', async (req: Request, res: Response) => {
  try {
    const { fromFormat, toFormat } = req.body as ConvertRequest;

    if (!req.body.audioData) {
      return res.status(400).json({
        message: 'Audio data is required',
        code: 'MISSING_AUDIO_DATA'
      });
    }

    const audioBuffer = Buffer.from(req.body.audioData, 'base64');
    const convertedBuffer = await convertAudio(audioBuffer, toFormat);

    res.set({
      'Content-Type': `audio/${toFormat}`,
      'Content-Disposition': `attachment; filename="converted.${toFormat}"`
    });
    res.send(convertedBuffer);
  } catch (error: any) {
    console.error('Error converting audio:', error);
    res.status(error.status || 500).json({
      message: error.message || 'Failed to convert audio',
      code: 'CONVERT_ERROR'
    });
  }
});

export default router;
