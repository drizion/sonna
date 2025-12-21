export type AudioFormat = 'original' | 'mp3' | 'wav' | 'flac' | 'aac' | 'm4a' | 'ogg';
export type MusicSource = 'soundcloud' | 'local';
export interface Track {
    id: string;
    title: string;
    artist: string;
    duration: number;
    artwork?: string;
    sourceUrl: string;
    source: MusicSource;
    format: AudioFormat;
    downloadDate: Date;
    fileSize?: number;
    bpm?: number;
    key?: string;
    genre?: string;
    tags?: string[];
    sourcePlaylistId?: string;
}
export interface StoredTrack extends Track {
    blob: Blob;
}
export interface Playlist {
    id: string;
    name: string;
    description?: string;
    trackIds: string[];
    source: MusicSource;
    sourceUrl?: string;
    artwork?: string;
    syncDate: Date;
    category?: string;
    tags?: string[];
    isPrivate?: boolean;
}
export interface StorageMetadata {
    quotaUsed: number;
    quotaAvailable: number;
    totalTracks: number;
    totalPlaylists: number;
    lastSync?: Date;
    settings: UserSettings;
}
export interface UserSettings {
    defaultDownloadFormat: AudioFormat;
    autoDownloadArtwork: boolean;
    deleteOldTracks: boolean;
    maxStorageUsagePercent: number;
    theme: 'light' | 'dark' | 'auto';
}
export interface DownloadProgress {
    trackId: string;
    title: string;
    status: 'pending' | 'downloading' | 'converting' | 'storing' | 'completed' | 'failed';
    progress: number;
    error?: string;
}
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
export interface ResolveUrlRequest {
    url: string;
}
export interface ResolveUrlResponse {
    type: 'track' | 'playlist';
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
export interface ApiError {
    message: string;
    code: string;
    details?: any;
}
export interface Category {
    id: string;
    name: string;
    color?: string;
    icon?: string;
}
//# sourceMappingURL=types.d.ts.map