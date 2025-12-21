import { useState, useEffect, useRef } from 'react';
import { FiMusic, FiPlay, FiPause, FiX, FiDownload, FiCheck } from 'react-icons/fi';
import type { StoredTrack } from '@music-downloader/shared';

type IslandState = 'idle' | 'player' | 'downloading' | 'download-complete';

interface DynamicIslandProps {
  // Player props
  currentTrack?: StoredTrack | null;
  isPlaying?: boolean;
  currentTime?: number;
  duration?: number;
  onPlayPause?: () => void;
  onClose?: () => void;
  onSeek?: (time: number) => void;
  
  // Download props
  downloadProgress?: number;
  downloadingTrack?: { title: string; artist: string; artwork?: string } | null;
  completedDownload?: { title: string; artwork?: string } | null;
  onDismissDownload?: () => void;
  
  // State callback
  onStateChange?: (state: IslandState) => void;
}

export default function DynamicIsland({
  currentTrack,
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  onPlayPause,
  onClose,
  onSeek,
  downloadProgress,
  downloadingTrack,
  completedDownload,
  onDismissDownload,
  onStateChange,
}: DynamicIslandProps) {
  const [state, setState] = useState<IslandState>('idle');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // Determina o estado baseado nas props
  useEffect(() => {
    const newState = completedDownload
      ? 'download-complete'
      : downloadingTrack && downloadProgress !== undefined
      ? 'downloading'
      : currentTrack
      ? 'player'
      : 'idle';

    if (newState !== state) {
      // Transições que não devem piscar (mantém conteúdo visível)
      const isDownloadingToComplete = state === 'downloading' && newState === 'download-complete';
      const isCompleteToPlayer = state === 'download-complete' && newState === 'player';
      const isCompleteToIdle = state === 'download-complete' && newState === 'idle';
      const shouldKeepContentVisible = isDownloadingToComplete || isCompleteToPlayer || isCompleteToIdle;
      
      // Notifica o componente pai sobre a mudança de estado
      onStateChange?.(newState as IslandState);
      
      if (shouldKeepContentVisible) {
        // Transição suave sem piscar - apenas troca o conteúdo
        setIsTransitioning(true);
        setState(newState as IslandState);
        setShowContent(true);
        setTimeout(() => {
          setIsTransitioning(false);
        }, 300);
      } else {
        // Fade out completo para outras transições
        setIsTransitioning(true);
        setShowContent(false);
        
        setTimeout(() => {
          setState(newState as IslandState);
          
          setTimeout(() => {
            setIsTransitioning(false);
            if (newState !== 'idle') {
              setShowContent(true);
            }
          }, newState === 'idle' ? 150 : 400);
        }, 150);
      }
    }
  }, [currentTrack, downloadingTrack, downloadProgress, completedDownload, state, onStateChange]);

  // Verifica se o título está transbordando
  useEffect(() => {
    if (!titleRef.current || state !== 'player' || !showContent) {
      setIsOverflowing(false);
      return;
    }
    
    const checkOverflow = () => {
      if (titleRef.current) {
        const isOverflow = titleRef.current.scrollWidth > titleRef.current.clientWidth;
        setIsOverflowing(isOverflow);
      }
    };
    
    // Espera um pouco após o conteúdo aparecer
    const timer = setTimeout(checkOverflow, 100);
    
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [currentTrack, state, showContent]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !onSeek || duration === 0) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    
    onSeek(newTime);
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration === 0 || !onSeek) return;
    setIsDragging(true);
    handleProgressClick(e);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressBarRef.current || !onSeek || duration === 0) return;
      
      const rect = progressBarRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;
      
      onSeek(newTime);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration, onSeek]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed top-2 md:top-4 left-1/2 -translate-x-1/2 z-50 px-3 md:px-0">
      <div
        className={`
          relative overflow-hidden
          bg-[rgb(var(--color-surface))]/60 backdrop-blur-[20px]
          border border-[rgb(var(--color-on-surface))]/[0.08]
          shadow-[0_8px_32px_rgba(0,0,0,0.06)]
          transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${state === 'idle' 
            ? 'w-[120px] md:w-[140px] h-[32px] md:h-[37px] rounded-full' 
            : 'w-[calc(100vw-24px)] md:w-[380px] h-[76px] md:h-[88px] rounded-[38px] md:rounded-[44px]'
          }
        `}
      >
        {/* Idle State - com fade in e out */}
        {state === 'idle' && (
          <div className={`
            flex items-center justify-center h-full
            transition-opacity duration-300 ease-out
            ${isTransitioning ? 'opacity-0' : 'opacity-100'}
          `}>
            <FiMusic className="w-4 h-4 md:w-5 md:h-5 text-[rgb(var(--color-primary))]" />
          </div>
        )}

        {/* Content wrapper com fade transition - apenas para estados expandidos */}
        {state !== 'idle' && (
          <div className={`
            h-full
            transition-opacity duration-300 ease-out
            ${showContent ? 'opacity-100' : 'opacity-0'}
          `}>
        {/* Player State */}
        {state === 'player' && currentTrack && (
          <div className="relative h-full">
            {/* Background Progress - Clicável */}
            <div
              ref={progressBarRef}
              className="absolute inset-0 cursor-pointer"
              onMouseDown={handleProgressMouseDown}
              onClick={handleProgressClick}
            >
              <div
                className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 transition-all duration-500 ease-out pointer-events-none"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="relative flex items-center h-full px-2 md:px-4 gap-2 md:gap-3 pointer-events-none">
              {/* Artwork */}
              {currentTrack.artwork && (
                <img
                  src={currentTrack.artwork}
                  alt={currentTrack.title}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl object-cover shadow-lg flex-shrink-0"
                />
              )}
              {!currentTrack.artwork && (
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <FiMusic className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              )}

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <div className="relative overflow-hidden">
                  <div
                    ref={titleRef}
                    className={`text-[rgb(var(--color-on-surface))] text-xs md:text-sm font-semibold whitespace-nowrap truncate transition-opacity duration-150 ${
                      isOverflowing ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    {currentTrack.title}
                  </div>
                  {isOverflowing && (
                    <div className="absolute top-0 left-0 overflow-hidden">
                      <div className="text-[rgb(var(--color-on-surface))] text-xs md:text-sm font-semibold whitespace-nowrap animate-marquee">
                        {currentTrack.title}
                        <span className="inline-block w-12" aria-hidden="true" />
                        {currentTrack.title}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-[rgb(var(--color-on-surface))]/60 text-[10px] md:text-xs truncate">
                  {currentTrack.artist}
                </div>
                <div className="text-[rgb(var(--color-on-surface))]/40 text-[10px] md:text-xs mt-0.5 md:mt-1">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0 relative pointer-events-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayPause?.();
                  }}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[rgb(var(--color-surface-variant))]/50 hover:bg-[rgb(var(--color-surface-variant))] flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-95"
                >
                  {isPlaying ? (
                    <FiPause className="w-4 h-4 md:w-5 md:h-5 text-[rgb(var(--color-on-surface))] transition-transform duration-200" />
                  ) : (
                    <FiPlay className="w-4 h-4 md:w-5 md:h-5 text-[rgb(var(--color-on-surface))] ml-0.5 transition-transform duration-200" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose?.();
                  }}
                  className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-[rgb(var(--color-surface-variant))]/50 hover:bg-[rgb(var(--color-surface-variant))] flex items-center justify-center transition-all duration-300 ease-out hover:scale-105 active:scale-95"
                >
                  <FiX className="w-3.5 h-3.5 md:w-4 md:h-4 text-[rgb(var(--color-on-surface))] transition-transform duration-200" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Downloading State */}
        {state === 'downloading' && downloadingTrack && (
          <div className="relative h-full">
            {/* Progress Background */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 transition-all duration-500 ease-out"
              style={{ width: `${downloadProgress}%` }}
            />

            <div className="relative flex items-center h-full px-2 md:px-4 gap-2 md:gap-3">
              {/* Icon/Artwork */}
              {downloadingTrack.artwork ? (
                <img
                  src={downloadingTrack.artwork}
                  alt={downloadingTrack.title}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl object-cover shadow-lg flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
                  <FiDownload className="w-5 h-5 md:w-6 md:h-6 text-white animate-pulse" style={{ animationDuration: '2s' }} />
                </div>
              )}

              {/* Download Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[rgb(var(--color-on-surface))] text-xs md:text-sm font-semibold truncate">
                  {downloadingTrack.title}
                </div>
                <div className="text-[rgb(var(--color-on-surface))]/60 text-[10px] md:text-xs truncate">
                  {downloadingTrack.artist}
                </div>
                <div className="text-[rgb(var(--color-on-surface))]/40 text-[10px] md:text-xs mt-0.5 md:mt-1">
                  Baixando... {Math.round(downloadProgress || 0)}%
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="flex-shrink-0">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[rgb(var(--color-surface-variant))]/50 flex items-center justify-center">
                  <div className="text-[rgb(var(--color-on-surface))] text-[10px] md:text-xs font-bold">
                    {Math.round(downloadProgress || 0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Download Complete State */}
        {state === 'download-complete' && completedDownload && (
          <div className="relative h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20" />

            <div className="relative flex items-center h-full px-2 md:px-4 gap-2 md:gap-3">
              {/* Artwork */}
              {completedDownload.artwork ? (
                <img
                  src={completedDownload.artwork}
                  alt={completedDownload.title}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl object-cover shadow-lg flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <FiCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              )}

              {/* Success Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[rgb(var(--color-on-surface))] text-xs md:text-sm font-semibold truncate">
                  Download concluído!
                </div>
                <div className="text-[rgb(var(--color-on-surface))]/60 text-[10px] md:text-xs truncate">
                  {completedDownload.title}
                </div>
              </div>

              {/* Check Icon */}
              <div className="flex-shrink-0">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-green-600 flex items-center justify-center animate-scale-in">
                  <FiCheck className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
        )}
      </div>
    </div>
  );
}
