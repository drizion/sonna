import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Playlist } from '@music-downloader/shared';
import {
  getAllPlaylists,
  savePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  getPlaylistTracks,
} from '../services/storage';

/**
 * Hook to get all playlists
 */
export function usePlaylists() {
  return useQuery({
    queryKey: ['playlists'],
    queryFn: getAllPlaylists,
  });
}

/**
 * Hook to get tracks in a specific playlist
 */
export function usePlaylistTracks(playlistId: string | null) {
  return useQuery({
    queryKey: ['playlist-tracks', playlistId],
    queryFn: () => (playlistId ? getPlaylistTracks(playlistId) : Promise.resolve([])),
    enabled: !!playlistId,
  });
}

/**
 * Hook to create or update a playlist
 */
export function useSavePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: savePlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
}

/**
 * Hook to delete a playlist
 */
export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
}

/**
 * Hook to add a track to a playlist
 */
export function useAddTrackToPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, trackId }: { playlistId: string; trackId: string }) =>
      addTrackToPlaylist(playlistId, trackId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks', variables.playlistId] });
    },
  });
}

/**
 * Hook to remove a track from a playlist
 */
export function useRemoveTrackFromPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ playlistId, trackId }: { playlistId: string; trackId: string }) =>
      removeTrackFromPlaylist(playlistId, trackId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks', variables.playlistId] });
    },
  });
}
