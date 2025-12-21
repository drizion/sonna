import { createContext, useContext, useState, type ReactNode } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import type { StoredTrack } from '@music-downloader/shared';
import type { DownloadNotification } from '../hooks/useDownload';

interface AudioPlayerContextType {
  // Audio player state
  currentTrack: StoredTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: (track: StoredTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
  
  // Download notification state
  downloadNotification: DownloadNotification | null;
  setDownloadNotification: (notification: DownloadNotification | null) => void;
  clearDownloadNotification: () => void;
  
  // Dynamic Island expansion state
  isIslandExpanded: boolean;
  setIsIslandExpanded: (expanded: boolean) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioPlayer = useAudioPlayer();
  const [downloadNotification, setDownloadNotification] = useState<DownloadNotification | null>(null);
  const [isIslandExpanded, setIsIslandExpanded] = useState(false);

  const clearDownloadNotification = () => {
    setDownloadNotification(null);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        ...audioPlayer,
        downloadNotification,
        setDownloadNotification,
        clearDownloadNotification,
        isIslandExpanded,
        setIsIslandExpanded,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayerContext() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayerContext must be used within an AudioPlayerProvider');
  }
  return context;
}
