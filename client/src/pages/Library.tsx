import { useEffect } from 'react';
import TrackList from '../components/TrackList';
import { useAudioPlayerContext } from '../contexts/AudioPlayerContext';
import { useSelection } from '../layouts/MainLayout';
import type { StoredTrack } from '@music-downloader/shared';

export default function Library() {
  const { selectedTracks, setSelectedTracks, setBulkActions } = useSelection();
  const { play } = useAudioPlayerContext();

  const handlePlayTrack = (track: StoredTrack) => {
    play(track);
  };

  // Register bulk actions from TrackList
  useEffect(() => {
    return () => {
      // Cleanup: reset selection when leaving library
      setSelectedTracks(new Set());
    };
  }, [setSelectedTracks]);

  return (
    <TrackList
      selectedTracks={selectedTracks}
      onSelectionChange={setSelectedTracks}
      onPlayTrack={handlePlayTrack}
      onBulkActionsChange={setBulkActions}
    />
  );
}
