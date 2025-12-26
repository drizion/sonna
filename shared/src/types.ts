// Audio Formats
export type AudioFormat = 'original' | 'mp3' | 'wav' | 'flac' | 'aac' | 'm4a' | 'ogg';

// Source platforms
export type MusicSource = 'soundcloud' | 'local';

// Music providers
export type MusicProvider = 'soundcloud' | 'spotify' | 'youtube' | 'apple-music';

// Content types
export type ContentType = 'track' | 'playlist' | 'album' | 'artist';

// Parsed music URL result
export interface ParsedMusicUrl {
  provider: MusicProvider;
  contentType: ContentType;
  isPrivate: boolean;
  sanitizedUrl: string;  // URL limpa sem query params desnecessários
  metadata: {
    artistSlug?: string;
    trackSlug?: string;
    playlistSlug?: string;
    albumSlug?: string;
    secretToken?: string;  // Para conteúdo privado
  };
  originalUrl: string;
}

// Invalid music URL error
export class InvalidMusicUrlError extends Error {
  constructor(
    public url: string,
    public reason: string
  ) {
    super(`Invalid music URL: ${reason}`);
    this.name = 'InvalidMusicUrlError';
  }
}

// Track metadata
export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  artwork?: string;
  sourceUrl: string;
  source: MusicSource;
  format: AudioFormat;
  downloadDate: Date;
  createdAt?: number; // timestamp para ordenação
  fileSize?: number; // in bytes
  // User editable metadata
  bpm?: number;
  key?: string;
  genre?: string;
  tags?: string[];
  album?: string;
  year?: number;
  label?: string;
  energy?: number; // 1-10
  mood?: string;
  notes?: string;
  rating?: number; // 1-5 stars
  playCount?: number;
  lastPlayed?: Date;
  sourcePlaylistId?: string;
}

// Track with audio blob (for storage)
export interface StoredTrack extends Track {
  blob: Blob;
}

// Playlist
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  source: MusicSource;
  sourceUrl?: string;
  artwork?: string;
  createdDate: Date;
  updatedDate: Date;
  syncDate?: Date;
  category?: string;
  tags?: string[];
  color?: string; // Hex color for visual organization
  isPrivate?: boolean;
  isFavorite?: boolean;
}

// Storage metadata
export interface StorageMetadata {
  quotaUsed: number; // in bytes
  quotaAvailable: number; // in bytes
  totalTracks: number;
  totalPlaylists: number;
  lastSync?: Date;
  settings: UserSettings;
}

// User settings
export interface UserSettings {
  defaultDownloadFormat: AudioFormat;
  autoDownloadArtwork: boolean;
  deleteOldTracks: boolean;
  maxStorageUsagePercent: number;
  theme: 'light' | 'dark' | 'auto';
}

// Download progress
export interface DownloadProgress {
  trackId: string;
  title: string;
  status: 'pending' | 'downloading' | 'converting' | 'storing' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
}

// SoundCloud specific types
export interface SoundCloudTrackInfo {
  id: number;
  title: string;
  user: {
    username: string;
  };
  artwork_url?: string;
  duration: number;
  permalink_url: string;
  stream_url?: string;
  download_url?: string;
  genre?: string;
  bpm?: number;
}

export interface SoundCloudPlaylistInfo {
  id: number;
  title: string;
  description?: string;
  user: {
    username: string;
  };
  artwork_url?: string;
  permalink_url: string;
  tracks: SoundCloudTrackInfo[];
  track_count: number;
  is_private?: boolean;
}

// API request/response types
export interface ResolveUrlRequest {
  url: string;
  provider?: MusicProvider;  // Force specific provider
  preferredType?: ContentType;  // Prefer track over playlist when ambiguous
}

export interface ResolveUrlResponse {
  provider: MusicProvider;
  type: ContentType;
  isPrivate: boolean;
  sanitizedUrl: string;
  data: SoundCloudTrackInfo | SoundCloudPlaylistInfo;
}

export interface DownloadRequest {
  trackUrl: string;
}

export interface ConvertRequest {
  trackId: string;
  fromFormat: AudioFormat;
  toFormat: AudioFormat;
}

export interface CreateZipRequest {
  trackIds: string[];
  format: AudioFormat;
  playlistName?: string;
}

// Error types
export interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Category for organizing music
export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}
