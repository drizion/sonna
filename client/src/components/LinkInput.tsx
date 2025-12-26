import type { SoundCloudPlaylistInfo, SoundCloudTrackInfo, Track } from '@music-downloader/shared';
import { useState } from 'react';
import { FiDownload, FiList, FiLoader, FiMusic } from 'react-icons/fi';
import { useDownloadPlaylist, useDownloadTrack, useResolveUrl } from '../hooks/useDownload';

export default function LinkInput() {
  const [url, setUrl] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [playlistProgress, setPlaylistProgress] = useState<{ current: number; total: number; trackTitle: string } | null>(null);

  const resolveUrl = useResolveUrl();
  const downloadTrack = useDownloadTrack();
  const downloadPlaylist = useDownloadPlaylist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) return;

    try {
      console.log('[LinkInput] Starting URL resolution:', url.trim());
      
      // Resolve the URL (token will be extracted from URL automatically)
      const resolveResult = await resolveUrl.mutateAsync({
        url: url.trim(),
      });

      console.log('[LinkInput] URL resolved:', resolveResult);

      if (resolveResult.type === 'track') {
        const trackInfo = resolveResult.data as SoundCloudTrackInfo;
        
        console.log('[LinkInput] Track info:', trackInfo);
        
        // Create Track object
        const track: Track = {
          id: trackInfo.id.toString(),
          title: trackInfo.title,
          artist: trackInfo.user.username,
          duration: Math.floor(trackInfo.duration / 1000),
          artwork: trackInfo.artwork_url,
          sourceUrl: trackInfo.permalink_url,
          source: 'soundcloud',
          format: 'mp3', // Sempre baixa no formato original (mp3)
          downloadDate: new Date(),
          genre: trackInfo.genre,
          bpm: trackInfo.bpm,
        };

        console.log('[LinkInput] Starting download for track:', track);

        // Download and save the track (will be skipped if already exists)
        const downloadResult = await downloadTrack.mutateAsync({
          trackUrl: trackInfo.permalink_url,
          trackInfo: track,
        });

        console.log('[LinkInput] Download result:', downloadResult);

        // Clear form
        setUrl('');
      } else if (resolveResult.type === 'playlist') {
        const playlistInfo = resolveResult.data as SoundCloudPlaylistInfo;
        
        console.log('[LinkInput] Playlist info:', playlistInfo);

        // Download the entire playlist
        const result = await downloadPlaylist.mutateAsync({
          playlistInfo,
          onProgress: (current, total, trackTitle) => {
            setPlaylistProgress({ current, total, trackTitle });
          },
        });

        console.log('[LinkInput] Playlist download result:', result);

        setPlaylistProgress(null);

        // Clear form
        setUrl('');
      }
    } catch (error: any) {
      console.error('[LinkInput] Error details:', {
        error,
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      setPlaylistProgress(null);
    }
  };

  const isLoading = resolveUrl.isPending || downloadTrack.isPending || downloadPlaylist.isPending;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12 space-y-3">
        <h1 className="text-3xl md:text-5xl font-semibold text-[rgb(var(--color-on-surface))] tracking-tight">
          Music
        </h1>
        <p className="text-[rgb(var(--color-on-surface))]/60 text-base md:text-lg">
          SoundCloud Downloader
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-[rgb(var(--color-surface))]/40 backdrop-blur-3xl rounded-[20px] md:rounded-[28px] border border-[rgb(var(--color-on-surface))]/[0.08] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300 hover:shadow-[0_12px_48px_rgba(0,0,0,0.12)]">
        <form onSubmit={handleSubmit} className="px-4 md:px-8 py-8">
          {/* Input Container */}
          <div className="relative mb-6">
            <div 
              className={`
                relative rounded-[20px] border-2 transition-all duration-300 overflow-hidden
                ${isFocused 
                  ? 'border-[rgb(var(--color-primary))] shadow-[0_0_0_4px_rgba(var(--color-primary),0.1)]' 
                  : 'border-[rgb(var(--color-on-surface))]/[0.12] hover:border-[rgb(var(--color-on-surface))]/[0.2]'
                }
                ${isLoading ? 'opacity-60 pointer-events-none' : ''}
              `}
            >
              <input
                type="text"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="soundcloud.com/artist/track"
                className="w-full px-4 md:px-6 py-4 md:py-5 bg-transparent text-[rgb(var(--color-on-surface))] placeholder-[rgb(var(--color-on-surface))]/30 text-sm md:text-base outline-none"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className={`
              w-full px-4 md:px-6 py-4 md:py-5 rounded-[16px] md:rounded-[20px] font-medium text-sm md:text-base
              transition-all duration-300 flex items-center justify-center gap-2 md:gap-3
              ${isLoading || !url.trim()
                ? 'bg-[rgb(var(--color-on-surface))]/[0.06] text-[rgb(var(--color-on-surface))]/30 cursor-not-allowed'
                : 'bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] text-white shadow-[0_4px_16px_rgba(var(--color-primary),0.3)] hover:shadow-[0_8px_24px_rgba(var(--color-primary),0.4)] hover:scale-[1.02] active:scale-[0.98]'
              }
            `}
          >
            {isLoading ? (
              <>
                <FiLoader className="w-5 h-5 animate-spin" />
                <span>
                  {playlistProgress 
                    ? `Baixando ${playlistProgress.current}/${playlistProgress.total}` 
                    : 'Baixando'}
                </span>
              </>
            ) : (
              <>
                <FiDownload className="w-5 h-5" />
                <span>Download</span>
              </>
            )}
          </button>

          {/* Playlist Progress */}
          {playlistProgress && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-[rgb(var(--color-on-surface))]/60">
                <span className="flex items-center gap-2">
                  <FiMusic className="w-4 h-4" />
                  {playlistProgress.trackTitle}
                </span>
                <span>{playlistProgress.current} / {playlistProgress.total}</span>
              </div>
              <div className="h-1.5 bg-[rgb(var(--color-on-surface))]/[0.08] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] transition-all duration-300"
                  style={{ width: `${(playlistProgress.current / playlistProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </form>

        {/* Info Pills */}
        {!isLoading && (
          <div className="px-4 md:px-8 pb-8 flex flex-wrap gap-2 justify-center">
            <div className="px-4 py-2 bg-[rgb(var(--color-on-surface))]/[0.04] rounded-full text-xs text-[rgb(var(--color-on-surface))]/60 flex items-center gap-1.5">
              <FiMusic className="w-3.5 h-3.5" />
              Músicas
            </div>
            <div className="px-4 py-2 bg-[rgb(var(--color-on-surface))]/[0.04] rounded-full text-xs text-[rgb(var(--color-on-surface))]/60 flex items-center gap-1.5">
              <FiList className="w-3.5 h-3.5" />
              Playlists
            </div>
            <div className="px-4 py-2 bg-[rgb(var(--color-on-surface))]/[0.04] rounded-full text-xs text-[rgb(var(--color-on-surface))]/60">
              Links privados
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
