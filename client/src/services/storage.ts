import type { Playlist, StorageMetadata, StoredTrack } from '@music-downloader/shared';
import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface MusicDB extends DBSchema {
  tracks: {
    key: string;
    value: StoredTrack;
    indexes: {
      'by-date': Date;
      'by-artist': string;
      'by-source': string;
    };
  };
  playlists: {
    key: string;
    value: Playlist;
    indexes: {
      'by-created': Date;
      'by-updated': Date;
      'by-source': string;
    };
  };
  metadata: {
    key: string;
    value: StorageMetadata;
  };
}

const DB_NAME = 'music-downloader-db';
const DB_VERSION = 2;

let dbInstance: IDBPDatabase<MusicDB> | null = null;

/**
 * Initialize and get database instance
 */
export async function getDB(): Promise<IDBPDatabase<MusicDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<MusicDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create tracks store
      if (oldVersion < 1) {
        const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
        trackStore.createIndex('by-date', 'downloadDate');
        trackStore.createIndex('by-artist', 'artist');
        trackStore.createIndex('by-source', 'source');

        // Create playlists store
        const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
        playlistStore.createIndex('by-date', 'syncDate');
        playlistStore.createIndex('by-source', 'source');

        // Create metadata store
        db.createObjectStore('metadata', { keyPath: 'id' });
      }

      // Upgrade to version 2: update playlist indexes
      if (oldVersion < 2 && oldVersion >= 1) {
        // Get the playlist store from transaction
        const playlistStore = transaction.objectStore('playlists');
        
        // Delete old indexes if they exist
        if (playlistStore.indexNames.contains('by-date')) {
          playlistStore.deleteIndex('by-date');
        }
        
        // Create new indexes
        playlistStore.createIndex('by-created', 'createdDate');
        playlistStore.createIndex('by-updated', 'updatedDate');
      }

      console.log('Database initialized/upgraded');
    },
  });

  return dbInstance;
}

// ==================== TRACKS ====================

/**
 * Add or update a track
 */
export async function saveTrack(track: StoredTrack): Promise<void> {
  const db = await getDB();
  await db.put('tracks', track);
}

/**
 * Get a track by ID
 */
export async function getTrack(id: string): Promise<StoredTrack | undefined> {
  const db = await getDB();
  return db.get('tracks', id);
}

/**
 * Check if a track exists by ID
 */
export async function trackExists(id: string): Promise<boolean> {
  const db = await getDB();
  const track = await db.get('tracks', id);
  return !!track;
}

/**
 * Get all tracks
 */
export async function getAllTracks(): Promise<StoredTrack[]> {
  const db = await getDB();
  return db.getAll('tracks');
}

/**
 * Get tracks by artist
 */
export async function getTracksByArtist(artist: string): Promise<StoredTrack[]> {
  const db = await getDB();
  return db.getAllFromIndex('tracks', 'by-artist', artist);
}

/**
 * Delete a track
 */
export async function deleteTrack(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tracks', id);
}

/**
 * Delete multiple tracks
 */
export async function deleteTracks(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('tracks', 'readwrite');
  await Promise.all(ids.map(id => tx.store.delete(id)));
  await tx.done;
}

// ==================== PLAYLISTS ====================

/**
 * Add or update a playlist
 */
export async function savePlaylist(playlist: Playlist): Promise<void> {
  const db = await getDB();
  await db.put('playlists', playlist);
}

/**
 * Get a playlist by ID
 */
export async function getPlaylist(id: string): Promise<Playlist | undefined> {
  const db = await getDB();
  return db.get('playlists', id);
}

/**
 * Get all playlists
 */
export async function getAllPlaylists(): Promise<Playlist[]> {
  const db = await getDB();
  return db.getAll('playlists');
}

/**
 * Delete a playlist
 */
export async function deletePlaylist(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('playlists', id);
}

/**
 * Add track to playlist
 */
export async function addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
  const db = await getDB();
  const playlist = await db.get('playlists', playlistId);
  if (!playlist) throw new Error('Playlist not found');
  
  if (!playlist.trackIds.includes(trackId)) {
    playlist.trackIds.push(trackId);
    playlist.updatedDate = new Date();
    await db.put('playlists', playlist);
  }
}

/**
 * Remove track from playlist
 */
export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const db = await getDB();
  const playlist = await db.get('playlists', playlistId);
  if (!playlist) throw new Error('Playlist not found');
  
  playlist.trackIds = playlist.trackIds.filter(id => id !== trackId);
  playlist.updatedDate = new Date();
  await db.put('playlists', playlist);
}

/**
 * Get tracks in a playlist
 */
export async function getPlaylistTracks(playlistId: string): Promise<StoredTrack[]> {
  const db = await getDB();
  const playlist = await db.get('playlists', playlistId);
  if (!playlist) return [];
  
  const tracks = await Promise.all(
    playlist.trackIds.map(id => db.get('tracks', id))
  );
  
  return tracks.filter((track): track is StoredTrack => track !== undefined);
}

/**
 * Update track metadata
 */
export async function updateTrackMetadata(
  trackId: string, 
  metadata: Partial<Omit<Track, 'id' | 'blob'>>
): Promise<void> {
  const db = await getDB();
  const track = await db.get('tracks', trackId);
  if (!track) throw new Error('Track not found');
  
  const updated = { ...track, ...metadata };
  await db.put('tracks', updated);
}

// ==================== METADATA ====================

/**
 * Get storage metadata
 */
export async function getMetadata(): Promise<StorageMetadata | undefined> {
  const db = await getDB();
  return db.get('metadata', 'app-metadata');
}

/**
 * Update storage metadata
 */
export async function updateMetadata(metadata: Partial<StorageMetadata>): Promise<void> {
  const db = await getDB();
  const existing = await getMetadata();
  
  const updated: StorageMetadata = {
    ...existing,
    ...metadata,
  } as StorageMetadata;

  await db.put('metadata', { ...updated, id: 'app-metadata' } as any);
}

// ==================== UTILITY ====================

/**
 * Get storage quota information
 */
export async function getStorageQuota(): Promise<{ usage: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return { usage: 0, quota: 0 };
}

/**
 * Clear all data
 */
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['tracks', 'playlists', 'metadata'], 'readwrite');
  await Promise.all([
    tx.objectStore('tracks').clear(),
    tx.objectStore('playlists').clear(),
    tx.objectStore('metadata').clear(),
  ]);
  await tx.done;
}

/**
 * Get total size of stored tracks
 */
export async function getTotalTracksSize(): Promise<number> {
  const tracks = await getAllTracks();
  return tracks.reduce((total, track) => total + (track.blob.size || 0), 0);
}
