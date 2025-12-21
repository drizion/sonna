import type { Playlist, StoredTrack } from '@music-downloader/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    clearAllData,
    deletePlaylist,
    deleteTrack,
    deleteTracks,
    getAllPlaylists,
    getAllTracks,
    getStorageQuota,
    getTotalTracksSize,
    savePlaylist,
    saveTrack,
} from '../services/storage';

// ==================== QUERIES ====================

/**
 * Get all tracks
 */
export function useTracks() {
  return useQuery({
    queryKey: ['tracks'],
    queryFn: getAllTracks,
  });
}

/**
 * Get all playlists
 */
export function usePlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: getAllPlaylists,
  });
}

/**
 * Get storage quota
 */
export function useStorageQuota() {
  return useQuery({
    queryKey: ['storage-quota'],
    queryFn: getStorageQuota,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

/**
 * Get total tracks size
 */
export function useTracksSize() {
  return useQuery({
    queryKey: ['tracks-size'],
    queryFn: getTotalTracksSize,
  });
}

// ==================== MUTATIONS ====================

/**
 * Save a track
 */
export function useSaveTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (track: StoredTrack) => saveTrack(track),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['storage-quota'] });
      queryClient.invalidateQueries({ queryKey: ['tracks-size'] });
    },
  });
}

/**
 * Delete a track
 */
export function useDeleteTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackId: string) => deleteTrack(trackId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['storage-quota'] });
      queryClient.invalidateQueries({ queryKey: ['tracks-size'] });
    },
  });
}

/**
 * Delete multiple tracks
 */
export function useDeleteTracks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (trackIds: string[]) => deleteTracks(trackIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['storage-quota'] });
      queryClient.invalidateQueries({ queryKey: ['tracks-size'] });
    },
  });
}

/**
 * Save a playlist
 */
export function useSavePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playlist: Playlist) => savePlaylist(playlist),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
}

/**
 * Delete a playlist
 */
export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playlistId: string) => deletePlaylist(playlistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
}

/**
 * Clear all data
 */
export function useClearAllData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearAllData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['storage-quota'] });
      queryClient.invalidateQueries({ queryKey: ['tracks-size'] });
    },
  });
}
