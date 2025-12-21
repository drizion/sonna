import { useState, useRef, useEffect, useCallback } from 'react';
import type { StoredTrack } from '@music-downloader/shared';

interface UseAudioPlayerReturn {
  currentTrack: StoredTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: (track: StoredTrack) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  seek: (time: number) => void;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [currentTrack, setCurrentTrack] = useState<StoredTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
      
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const play = useCallback((track: StoredTrack) => {
    if (!audioRef.current) return;

    // Se for uma música diferente, carrega a nova
    if (currentTrack?.id !== track.id) {
      const url = URL.createObjectURL(track.blob);
      audioRef.current.src = url;
      setCurrentTrack(track);
    }

    audioRef.current.play();
    setIsPlaying(true);
  }, [currentTrack]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
    setCurrentTrack(null);
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    resume,
    stop,
    seek,
  };
}
