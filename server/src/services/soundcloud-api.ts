import { SoundCloud } from 'scdl-core';

// Initialize SoundCloud connection
let isConnected = false;

async function ensureConnected() {
  if (!isConnected) {
    await SoundCloud.connect();
    isConnected = true;
    console.log('✅ SoundCloud connected via scdl-core');
  }
}

/**
 * Get info about a SoundCloud track or playlist
 * Token is automatically extracted from URL if present (e.g., ?secret_token=...)
 */
export async function getSoundCloudInfo(url: string) {
  try {
    await ensureConnected();
    
    // Check if it's a playlist or track
    if (url.includes('/sets/')) {
      const playlist = await SoundCloud.playlists.getPlaylist(url);
      return playlist;
    } else {
      const track = await SoundCloud.tracks.getTrack(url);
      return track;
    }
  } catch (error: any) {
    console.error('Error getting SoundCloud info:', error);
    throw {
      message: 'Failed to get SoundCloud info. The URL may be invalid or the track/playlist may be private.',
      code: 'SOUNDCLOUD_INFO_ERROR',
      status: 400,
      details: error.message
    };
  }
}

/**
 * Get stream URL for a track
 */
export async function getStreamUrl(trackUrl: string): Promise<string> {
  try {
    await ensureConnected();
    
    const track = await SoundCloud.tracks.getTrack(trackUrl);
    
    if (!track) {
      throw new Error('Invalid track');
    }

    // Return the permalink URL for download
    return track.permalink_url;
  } catch (error: any) {
    console.error('Error getting stream URL:', error);
    throw {
      message: 'Failed to get stream URL',
      code: 'STREAM_URL_ERROR',
      status: 400,
      details: error.message
    };
  }
}

/**
 * Download a track from SoundCloud
 * @param trackUrl - Full SoundCloud track URL (permalink)
 * @returns Buffer containing the audio data
 */
export async function downloadTrack(trackUrl: string): Promise<Buffer> {
  try {
    await ensureConnected();
    
    // Get the audio stream - scdl-core expects the full permalink URL
    const stream = await SoundCloud.download(trackUrl);
    
    // Convert stream to buffer
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      
      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      stream.on('error', (error: Error) => {
        reject(error);
      });
    });
  } catch (error: any) {
    console.error('Error downloading track:', error);
    throw {
      message: 'Failed to download track from SoundCloud',
      code: 'DOWNLOAD_ERROR',
      status: 500,
      details: error.message
    };
  }
}
