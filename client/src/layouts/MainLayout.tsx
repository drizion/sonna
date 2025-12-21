import { useEffect, useState, createContext, useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import DynamicIsland from '../components/DynamicIsland';
import TabMenu from '../components/TabMenu';
import ActionBar from '../components/ActionBar';
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext';
import { setDownloadListener } from '../hooks/useDownload';
import { useFFmpegPreload } from '../hooks/useFFmpeg';
import { useStorageQuota } from '../hooks/useStorage';

interface SelectionContextType {
  selectedTracks: Set<string>;
  setSelectedTracks: (tracks: Set<string>) => void;
  bulkActions: {
    onDownload: () => void;
    onAddToPlaylist: () => void;
    onDelete: () => void;
  };
  setBulkActions: (actions: SelectionContextType['bulkActions']) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within SelectionContext');
  }
  return context;
};

export default function MainLayout() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    pause,
    resume,
    stop,
    seek,
    downloadNotification,
    setDownloadNotification,
    clearDownloadNotification,
    isIslandExpanded,
    setIsIslandExpanded,
  } = useAudioPlayerContext();

  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [bulkActions, setBulkActions] = useState<SelectionContextType['bulkActions']>({
    onDownload: () => {},
    onAddToPlaylist: () => {},
    onDelete: () => {},
  });

  const { data: quota } = useStorageQuota();

  // Preload FFmpeg for audio conversion
  useFFmpegPreload();

  // Setup download listener
  useEffect(() => {
    setDownloadListener((notification) => {
      setDownloadNotification(notification);
    });
  }, [setDownloadNotification]);

  // Apply theme on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    const root = document.documentElement;
    
    if (savedTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
      }
    } else if (savedTheme === 'dark') {
      root.classList.add('dark');
    }
  }, []);

  // Global spacebar handler for play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if spacebar is pressed in an input, textarea, or contenteditable element
      if (e.code === 'Space') {
        const target = e.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.isContentEditable;
        
        if (!isInput && currentTrack) {
          e.preventDefault();
          if (isPlaying) {
            pause();
          } else {
            resume();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTrack, isPlaying, pause, resume]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleCancelSelection = () => {
    setSelectedTracks(new Set());
  };

  const hasSelection = selectedTracks.size > 0;

  return (
    <SelectionContext.Provider value={{ selectedTracks, setSelectedTracks, bulkActions, setBulkActions }}>
      <div className={`min-h-screen bg-[rgb(var(--color-background))] pb-24 md:pb-32 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        isIslandExpanded ? 'pt-24 md:pt-28' : 'pt-12 md:pt-14'
      }`}>
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'backdrop-blur-xl bg-[rgb(var(--color-surface))]/80 border border-[rgb(var(--color-primary))]/20',
          style: {
            borderRadius: '16px',
            padding: '16px',
          },
        }}
      />
      
      {/* Dynamic Island */}
      <DynamicIsland
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onPlayPause={handlePlayPause}
        onStateChange={(state) => setIsIslandExpanded(state !== 'idle')}
        onClose={stop}
        onSeek={seek}
        downloadProgress={downloadNotification?.type === 'progress' ? downloadNotification.progress : undefined}
        downloadingTrack={downloadNotification?.type === 'progress' ? downloadNotification.track : null}
        completedDownload={downloadNotification?.type === 'complete' ? downloadNotification.track : null}
        onDismissDownload={clearDownloadNotification}
      />
      
      <main className="container mx-auto px-3 md:px-6 py-12 max-w-6xl">
        {/* Storage quota indicator - Only shows when storage is getting full (>70%) */}
        {quota && (quota.usage / quota.quota) > 0.7 && (
          <div className="mb-6 flex items-center justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-[rgb(var(--color-surface))]/40 backdrop-blur-xl rounded-full border border-[rgb(var(--color-primary))]/10">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))]" />
                <span className="text-xs font-medium text-[rgb(var(--color-on-surface))]/50">
                  {(quota.usage / 1024 / 1024).toFixed(0)} MB
                </span>
              </div>
              <div className="w-20 bg-[rgb(var(--color-surface-variant))]/30 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] h-1 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((quota.usage / quota.quota) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium text-[rgb(var(--color-on-surface))]/30">
                {((quota.usage / quota.quota) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* Route Content */}
        <div className="transition-all duration-300 ease-in-out">
          <Outlet />
        </div>
      </main>

      {/* Floating Tab Menu with integrated Action Bar */}
      <TabMenu 
        hasSelection={hasSelection}
        selectedCount={selectedTracks.size}
        onDownload={bulkActions.onDownload}
        onAddToPlaylist={bulkActions.onAddToPlaylist}
        onDelete={bulkActions.onDelete}
        onCancel={handleCancelSelection}
      />
    </div>
    </SelectionContext.Provider>
  );
}
