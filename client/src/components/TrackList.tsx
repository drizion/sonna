import { saveAs } from 'file-saver';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { FiDownload, FiEdit2, FiGrid, FiList, FiLoader, FiMusic, FiPlay, FiSquare, FiTrash2, FiX, FiMoreVertical, FiPlus, FiArrowUp, FiArrowDown, FiFilter } from 'react-icons/fi';
import { useDeleteTrack, useTracks } from '../hooks/useStorage';
import { useConvertAudio } from '../hooks/useFFmpeg';
import type { AudioFormat, StoredTrack } from '@music-downloader/shared';
import TrackMetadataEditor from './TrackMetadataEditor';
import { useModal } from '../layouts/MainLayout';

type ViewMode = 'list' | 'grid' | 'compact-grid';
type SortOption = 'download' | 'title' | 'artist' | 'bpm' | 'duration' | 'genre';

interface TrackListProps {
  selectedTracks: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;
  onPlayTrack?: (track: StoredTrack) => void;
  onBulkActionsChange?: (actions: {
    onDownload: () => void;
    onAddToPlaylist: () => void;
    onDelete: () => void;
  }) => void;
}

export default function TrackList({ selectedTracks, onSelectionChange, onPlayTrack, onBulkActionsChange }: TrackListProps) {
  const { data: tracks, isLoading } = useTracks();
  const deleteTrack = useDeleteTrack();
  const convertAudio = useConvertAudio();
  const { setIsModalOpen } = useModal();
  
  const [viewMode, setViewMode] = useState<ViewMode>('compact-grid');
  const [sortBy, setSortBy] = useState<SortOption>('download');
  const [isAscending, setIsAscending] = useState(true);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [isFormatModalAnimating, setIsFormatModalAnimating] = useState(false);
  const [selectedTrackForDownload, setSelectedTrackForDownload] = useState<StoredTrack | null>(null);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [editingTrack, setEditingTrack] = useState<StoredTrack | null>(null);
  const [isEditModalAnimating, setIsEditModalAnimating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sincroniza o estado dos modais com o contexto e bloqueia scroll
  useEffect(() => {
    const isOpen = showFormatModal || editingTrack !== null;
    setIsModalOpen(isOpen);
    
    // Bloquear scroll da página quando modal está aberto
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showFormatModal, editingTrack, setIsModalOpen]);

  // Anima entrada do modal de formato
  useEffect(() => {
    if (showFormatModal) {
      setTimeout(() => setIsFormatModalAnimating(true), 10);
    } else {
      setIsFormatModalAnimating(false);
    }
  }, [showFormatModal]);

  // Anima entrada do modal de edição
  useEffect(() => {
    if (editingTrack) {
      setTimeout(() => setIsEditModalAnimating(true), 10);
    } else {
      setIsEditModalAnimating(false);
    }
  }, [editingTrack]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Register bulk actions with parent
  useEffect(() => {
    if (onBulkActionsChange) {
      onBulkActionsChange({
        onDownload: handleBulkDownload,
        onAddToPlaylist: handleBulkAddToPlaylist,
        onDelete: handleBulkDelete,
      });
    }
  }, [selectedTracks, onBulkActionsChange]);

  const handleToggleSelect = (trackId: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    if (tracks && selectedTracks.size === tracks.length) {
      onSelectionChange(new Set());
    } else if (tracks) {
      onSelectionChange(new Set(tracks.map(t => t.id)));
    }
  };

  const handleDelete = async (trackId: string, trackTitle: string) => {
    // Close dropdown first
    setOpenDropdown(null);
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir "${trackTitle}"?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (!confirmed) return;

    toast.promise(
      deleteTrack.mutateAsync(trackId),
      {
        loading: 'Deletando...',
        success: `${trackTitle} deletada com sucesso!`,
        error: 'Erro ao deletar música',
      }
    );
  };

  const handleEdit = (track: StoredTrack) => {
    setOpenDropdown(null);
    setEditingTrack(track);
  };

  const handleAddToPlaylist = (track: StoredTrack) => {
    setOpenDropdown(null);
    toast('Funcionalidade de playlist em breve!', { icon: '📋' });
  };

  const handleBulkDelete = async () => {
    const count = selectedTracks.size;
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir ${count} música(s)?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (!confirmed) return;

    const promises = Array.from(selectedTracks).map(id => deleteTrack.mutateAsync(id));
    
    toast.promise(
      Promise.all(promises),
      {
        loading: `Deletando ${count} música(s)...`,
        success: `${count} música(s) deletada(s) com sucesso!`,
        error: 'Erro ao deletar músicas',
      }
    );

    onSelectionChange(new Set());
  };

  const handleBulkDownload = () => {
    toast('Download em massa em breve!', { icon: '📦' });
  };

  const handleBulkAddToPlaylist = () => {
    toast('Adicionar várias músicas à playlist em breve!', { icon: '📋' });
  };

  const handleDownloadTrack = (track: StoredTrack) => {
    setSelectedTrackForDownload(track);
    setShowFormatModal(true);
  };

  const handleCloseFormatModal = () => {
    setIsFormatModalAnimating(false);
    setTimeout(() => {
      setShowFormatModal(false);
      setSelectedTrackForDownload(null);
    }, 200);
  };

  const handleFormatSelection = async (format: AudioFormat) => {
    if (!selectedTrackForDownload) return;

    const track = selectedTrackForDownload;
    setShowFormatModal(false);

    // Se o formato for o mesmo do original, não precisa converter
    if (format === track.format || format === 'original') {
      saveAs(track.blob, `${track.artist} - ${track.title}.${track.format}`);
      setSelectedTrackForDownload(null);
      return;
    }

    // Converter formato
    setIsConverting(true);
    setConversionProgress(0);

    try {
      const convertedBlob = await convertAudio.mutateAsync({
        blob: track.blob,
        fromFormat: track.format,
        toFormat: format,
        onProgress: (progress) => setConversionProgress(progress),
      });

      saveAs(convertedBlob, `${track.artist} - ${track.title}.${format}`);
      toast.success(`Música convertida para ${format.toUpperCase()} e baixada!`);
    } catch (error) {
      console.error('Erro ao converter música:', error);
      toast.error('Erro ao converter música');
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
      setSelectedTrackForDownload(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Sort tracks based on selected option
  const sortedTracks = tracks ? [...tracks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'download':
        // Para download, mais recente = menor (createdAt maior = menor na ordem)
        comparison = (a.createdAt || 0) - (b.createdAt || 0);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'artist':
        comparison = a.artist.localeCompare(b.artist);
        break;
      case 'bpm':
        comparison = (a.bpm || 0) - (b.bpm || 0);
        break;
      case 'duration':
        comparison = a.duration - b.duration;
        break;
      case 'genre':
        comparison = (a.genre || '').localeCompare(b.genre || '');
        break;
    }
    
    return isAscending ? comparison : -comparison;
  }) : [];

  if (isLoading) {
    return (
      <div className="bg-[rgb(var(--color-surface))]/60 backdrop-blur-2xl rounded-2xl md:rounded-3xl shadow-2xl border border-[rgb(var(--color-primary))]/20 p-6 md:p-12 flex items-center justify-center">
        <FiLoader className="w-8 h-8 md:w-10 md:h-10 animate-spin text-[rgb(var(--color-primary))]" />
      </div>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <div className="bg-[rgb(var(--color-surface))]/60 backdrop-blur-2xl rounded-2xl md:rounded-3xl shadow-2xl border border-[rgb(var(--color-primary))]/20 p-6 md:p-12 text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[rgb(var(--color-surface-variant))] to-[rgb(var(--color-surface-variant))]/50 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6">
          <FiMusic className="w-8 h-8 md:w-10 md:h-10 text-[rgb(var(--color-on-surface))]/40" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-[rgb(var(--color-on-surface))] mb-2 md:mb-3">
          Nenhuma música baixada ainda
        </h3>
        <p className="text-sm md:text-base text-[rgb(var(--color-on-surface))]/60 font-medium">
          Adicione músicas do SoundCloud na aba Baixar
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[rgb(var(--color-surface))]/60 backdrop-blur-2xl rounded-2xl md:rounded-3xl shadow-2xl border border-[rgb(var(--color-primary))]/20 overflow-hidden relative">
      {/* Header with View Mode Switcher */}
      <div className="p-3 md:p-6 border-b border-[rgb(var(--color-primary))]/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-4">
          <div className="flex items-center space-x-2 md:space-x-4">
            <h2 className="text-xl md:text-2xl font-bold text-[rgb(var(--color-on-surface))]">
              Biblioteca <span className="text-[rgb(var(--color-on-surface))]/40">({tracks.length})</span>
            </h2>
            <button
              onClick={handleSelectAll}
              className="text-xs md:text-sm font-semibold text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-secondary))] px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl hover:bg-[rgb(var(--color-surface-variant))]/30 transition-all"
            >

              {selectedTracks.size === tracks.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Sort Controls - Modern Compact Design */}
            <div className="flex items-center gap-1.5 bg-[rgb(var(--color-surface-variant))]/40 p-1 rounded-lg md:rounded-xl">
              {/* Sort Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-2 md:px-3 md:py-2.5 hover:bg-[rgb(var(--color-surface-variant))]/60 rounded-lg transition-all text-[rgb(var(--color-on-surface))] text-xs md:text-sm font-medium"
                  title="Ordenar por"
                >
                  <FiFilter className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="hidden md:inline">
                    {sortBy === 'download' && 'Recentes'}
                    {sortBy === 'title' && 'Nome'}
                    {sortBy === 'artist' && 'Artista'}
                    {sortBy === 'bpm' && 'BPM'}
                    {sortBy === 'duration' && 'Duração'}
                    {sortBy === 'genre' && 'Gênero'}
                  </span>
                </button>
                
                {isSortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-[rgb(var(--color-surface))] rounded-xl shadow-2xl border border-[rgb(var(--color-on-surface))]/10 py-1 z-50">
                    <button
                      onClick={() => {
                        setSortBy('download');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        sortBy === 'download'
                          ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] font-semibold'
                          : 'text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30'
                      }`}
                    >
                      Recentes
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('title');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        sortBy === 'title'
                          ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] font-semibold'
                          : 'text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30'
                      }`}
                    >
                      Nome
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('artist');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        sortBy === 'artist'
                          ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] font-semibold'
                          : 'text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30'
                      }`}
                    >
                      Artista
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('bpm');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        sortBy === 'bpm'
                          ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] font-semibold'
                          : 'text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30'
                      }`}
                    >
                      BPM
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('duration');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        sortBy === 'duration'
                          ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] font-semibold'
                          : 'text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30'
                      }`}
                    >
                      Duração
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('genre');
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        sortBy === 'genre'
                          ? 'bg-[rgb(var(--color-primary))]/10 text-[rgb(var(--color-primary))] font-semibold'
                          : 'text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30'
                      }`}
                    >
                      Gênero
                    </button>
                  </div>
                )}
              </div>
              
              {/* Sort Order Toggle */}
              <button
                onClick={() => setIsAscending(!isAscending)}
                className="p-2 md:p-2.5 hover:bg-[rgb(var(--color-surface-variant))]/60 rounded-lg transition-all text-[rgb(var(--color-on-surface))]"
                title={isAscending ? 'Ordem crescente' : 'Ordem decrescente'}
              >
                {isAscending ? (
                  <FiArrowUp className="w-3.5 h-3.5 md:w-4 md:h-4" />
                ) : (
                  <FiArrowDown className="w-3.5 h-3.5 md:w-4 md:h-4" />
                )}
              </button>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center space-x-1 md:space-x-2 bg-[rgb(var(--color-surface-variant))]/40 p-1 rounded-lg md:rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 md:p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg'
                    : 'text-[rgb(var(--color-on-surface))]/60 hover:bg-[rgb(var(--color-surface-variant))]/60'
                }`}
                title="Visualização em Lista"
              >
                <FiList className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => setViewMode('compact-grid')}
                className={`p-2 md:p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'compact-grid'
                    ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg'
                    : 'text-[rgb(var(--color-on-surface))]/60 hover:bg-[rgb(var(--color-surface-variant))]/60'
                }`}
                title="Grid Compacto"
              >
                <FiSquare className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 md:p-2.5 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-[rgb(var(--color-primary))] text-white shadow-lg'
                    : 'text-[rgb(var(--color-on-surface))]/60 hover:bg-[rgb(var(--color-surface-variant))]/60'
                }`}
                title="Grid Expandido"
              >
                <FiGrid className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tracks Container */}
      <div className={`p-2 md:p-6 ${viewMode === 'list' ? 'space-y-2' : ''}`}>
        {viewMode === 'list' && (
          <div className="space-y-2">
            {sortedTracks.map((track) => (
              <div
                key={track.id}
                onMouseEnter={() => setHoveredTrack(track.id)}
                onMouseLeave={() => setHoveredTrack(null)}
                onClick={() => handleToggleSelect(track.id)}
                className={`group relative p-3 md:p-4 rounded-xl md:rounded-2xl transition-all duration-200 cursor-pointer ${
                  selectedTracks.has(track.id)
                    ? 'bg-[rgb(var(--color-primary))]/10 ring-2 ring-[rgb(var(--color-primary))]/30'
                    : 'hover:bg-[rgb(var(--color-surface-variant))]/40'
                }`}
              >
                <div className="flex items-center space-x-2 md:space-x-4">
                  {/* Checkbox & Play Button */}
                  <div className="hidden md:flex items-center justify-center w-12 h-12 flex-shrink-0">
                    {hoveredTrack === track.id ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayTrack?.(track);
                        }}
                        className="w-9 h-9 md:w-10 md:h-10 bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-secondary))] text-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                      >
                        <FiPlay className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
                      </button>
                    ) : (
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-md border-2 border-[rgb(var(--color-on-surface))]/20 flex items-center justify-center" style={{ backgroundColor: selectedTracks.has(track.id) ? 'rgb(var(--color-primary))' : 'transparent' }}>
                        {selectedTracks.has(track.id) && (
                          <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Artwork */}
                  <div className="w-14 h-14 bg-gradient-to-br from-[rgb(var(--color-surface-variant))] to-[rgb(var(--color-surface-variant))]/50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-lg relative">
                    {track.artwork ? (
                      <img src={track.artwork} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <FiMusic className="w-7 h-7 text-[rgb(var(--color-on-surface))]/30" />
                    )}
                    {/* Indicador de seleção mobile */}
                    {selectedTracks.has(track.id) && (
                      <div className="md:hidden absolute inset-0 bg-[rgb(var(--color-primary))]/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-[rgb(var(--color-primary))] flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm md:text-base text-[rgb(var(--color-on-surface))] truncate mb-0.5 md:mb-1">
                      {track.title}
                    </h3>
                    <p className="text-xs md:text-sm text-[rgb(var(--color-on-surface))]/60 truncate">
                      {track.artist}
                    </p>
                    {/* Info adicional apenas mobile */}
                    <div className="md:hidden flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[rgb(var(--color-on-surface))]/40">
                        {formatDuration(track.duration)}
                      </span>
                      {track.bpm && (
                        <span className="text-[10px] text-[rgb(var(--color-primary))]">
                          {track.bpm} BPM
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata - Desktop only */}
                  <div className="hidden lg:flex items-center space-x-4 text-sm text-[rgb(var(--color-on-surface))]/50 font-medium">
                    <span>{formatDuration(track.duration)}</span>
                    {track.bpm && <span>{track.bpm} BPM</span>}
                    <span className="uppercase text-xs">{track.format}</span>
                    <span>{formatFileSize(track.fileSize || 0)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    {/* Botão Play - Mobile */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayTrack?.(track);
                      }}
                      className="md:hidden p-2 text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/10 rounded-lg transition-all duration-200"
                      title="Tocar"
                    >
                      <FiPlay className="w-5 h-5" />
                    </button>
                    {/* Botão Download */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadTrack(track);
                      }}
                      disabled={selectedTracks.size > 0}
                      className="p-2 md:p-2.5 text-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary))]/10 rounded-lg md:rounded-xl transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:scale-100"
                      title="Download"
                    >
                      <FiDownload className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    {/* Dropdown de Ações */}
                    <div className="relative" ref={openDropdown === track.id ? dropdownRef : null}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(openDropdown === track.id ? null : track.id);
                        }}
                        disabled={selectedTracks.size > 0}
                        className="p-2 md:p-2.5 text-[rgb(var(--color-on-surface))]/60 hover:text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30 rounded-lg md:rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[rgb(var(--color-on-surface))]/60"
                        title="Mais opções"
                      >
                        <FiMoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                      {openDropdown === track.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-[rgb(var(--color-surface))] rounded-xl shadow-2xl border border-[rgb(var(--color-on-surface))]/10 py-1 z-50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(track);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30 flex items-center space-x-3 transition-colors"
                          >
                            <FiEdit2 className="w-4 h-4" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToPlaylist(track);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30 flex items-center space-x-3 transition-colors"
                          >
                            <FiPlus className="w-4 h-4" />
                            <span>Adicionar à Playlist</span>
                          </button>
                          <div className="h-px bg-[rgb(var(--color-on-surface))]/10 my-1" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(track.id, track.title);
                            }}
                            className="w-full px-4 py-2.5 text-left text-sm text-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/10 flex items-center space-x-3 transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'compact-grid' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {sortedTracks.map((track) => (
              <div
                key={track.id}
                onMouseEnter={() => setHoveredTrack(track.id)}
                onMouseLeave={() => setHoveredTrack(null)}
                onClick={() => handleToggleSelect(track.id)}
                className={`group relative rounded-xl md:rounded-2xl transition-all duration-200 cursor-pointer ${
                  selectedTracks.has(track.id)
                    ? 'ring-2 ring-[rgb(var(--color-primary))] ring-offset-2 ring-offset-[rgb(var(--color-background))] scale-[0.98]'
                    : 'hover:scale-[1.02]'
                } ${openDropdown === track.id ? 'z-50' : 'z-0'}`}
              >
                {/* Artwork */}
                <div className="aspect-square bg-gradient-to-br from-[rgb(var(--color-surface-variant))] to-[rgb(var(--color-surface-variant))]/50 rounded-xl md:rounded-2xl flex items-center justify-center shadow-xl relative">
                  <div className="absolute inset-0 overflow-hidden rounded-xl md:rounded-2xl">
                    {track.artwork ? (
                      <>
                        <img src={track.artwork} alt={track.title} className="w-full h-full object-cover" />
                        {/* Blurred background for overlay */}
                        <img 
                          src={track.artwork} 
                          alt="" 
                          className={`absolute inset-0 w-full h-full object-cover blur-md scale-110 transition-opacity duration-200 ${
                            hoveredTrack === track.id ? 'opacity-100' : 'opacity-0'
                          }`}
                          aria-hidden="true"
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiMusic className="w-8 h-8 md:w-12 md:h-12 text-[rgb(var(--color-on-surface))]/30" />
                      </div>
                    )}
                  
                    {/* Overlay with actions */}
                    <div className={`absolute inset-0 bg-black/60 flex items-center justify-center space-x-1.5 md:space-x-2 transition-opacity duration-200 ${
                      hoveredTrack === track.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayTrack?.(track);
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                      >
                        <FiPlay className="w-5 h-5 md:w-6 md:h-6 ml-0.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadTrack(track);
                        }}
                        disabled={selectedTracks.size > 0}
                        className="w-8 h-8 md:w-10 md:h-10 bg-[rgb(var(--color-primary))] text-white rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <FiDownload className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 pointer-events-none z-10">
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-md border-2 border-white/50 bg-black/30 backdrop-blur-sm shadow-lg flex items-center justify-center" style={{ backgroundColor: selectedTracks.has(track.id) ? 'rgb(var(--color-primary))' : 'rgba(0,0,0,0.3)' }}>
                      {selectedTracks.has(track.id) && (
                        <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Action menu button */}
                  <div className="absolute top-1.5 right-1.5 md:top-2 md:right-2 z-10" ref={openDropdown === track.id ? dropdownRef : null}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(openDropdown === track.id ? null : track.id);
                      }}
                      disabled={selectedTracks.size > 0}
                      className="w-7 h-7 md:w-8 md:h-8 bg-black/60 backdrop-blur-sm text-white rounded-lg flex items-center justify-center transition-all hover:scale-110 shadow-lg opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed"
                    >
                      <FiMoreVertical className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                    {openDropdown === track.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-[rgb(var(--color-surface))] rounded-xl shadow-2xl border border-[rgb(var(--color-on-surface))]/10 py-1 z-[100]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(track);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30 flex items-center space-x-3 transition-colors"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          <span>Editar</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToPlaylist(track);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30 flex items-center space-x-3 transition-colors"
                        >
                          <FiPlus className="w-4 h-4" />
                          <span>Adicionar à Playlist</span>
                        </button>
                        <div className="h-px bg-[rgb(var(--color-on-surface))]/10 my-1" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(track.id, track.title);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/10 flex items-center space-x-3 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          <span>Excluir</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Track Info */}
                <div className="mt-2 md:mt-3 px-0.5 md:px-1 pb-1 md:pb-2">
                  <h3 className="font-semibold text-[rgb(var(--color-on-surface))] text-xs md:text-sm truncate mb-0.5 md:mb-1">
                    {track.title}
                  </h3>
                  <p className="text-[10px] md:text-xs text-[rgb(var(--color-on-surface))]/60 truncate">
                    {track.artist}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
            {sortedTracks.map((track) => (
              <div
                key={track.id}
                onMouseEnter={() => setHoveredTrack(track.id)}
                onMouseLeave={() => setHoveredTrack(null)}
                onClick={() => handleToggleSelect(track.id)}
                className={`group relative bg-[rgb(var(--color-surface-variant))]/30 rounded-xl md:rounded-2xl p-3 md:p-4 pb-4 md:pb-5 transition-all duration-200 cursor-pointer ${
                  selectedTracks.has(track.id)
                    ? 'ring-2 ring-[rgb(var(--color-primary))] bg-[rgb(var(--color-primary))]/5'
                    : 'hover:bg-[rgb(var(--color-surface-variant))]/50'
                } hover:shadow-2xl hover:scale-[1.02]`}
              >
                <div className="flex space-x-2 md:space-x-4">
                  {/* Artwork */}
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[rgb(var(--color-surface-variant))] to-[rgb(var(--color-surface-variant))]/50 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 relative overflow-hidden">
                    {track.artwork ? (
                      <>
                        <img src={track.artwork} alt={track.title} className="w-full h-full object-cover" />
                        {/* Blurred background for overlay */}
                        <img 
                          src={track.artwork} 
                          alt="" 
                          className={`absolute inset-0 w-full h-full object-cover blur-md scale-110 transition-opacity duration-200 ${
                            hoveredTrack === track.id ? 'opacity-100' : 'opacity-0'
                          }`}
                          aria-hidden="true"
                        />
                      </>
                    ) : (
                      <FiMusic className="w-8 h-8 md:w-10 md:h-10 text-[rgb(var(--color-on-surface))]/30" />
                    )}
                    
                    {/* Play button overlay */}
                    <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-200 overflow-hidden rounded-lg md:rounded-xl ${
                      hoveredTrack === track.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayTrack?.(track);
                        }}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white text-black rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg"
                      >
                        <FiPlay className="w-5 h-5 md:w-6 md:h-6 ml-0.5" />
                      </button>
                    </div>

                    {/* Checkbox */}
                    <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2 pointer-events-none">
                      <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded border-2 border-white/50 bg-black/30 backdrop-blur-sm shadow-lg flex items-center justify-center" style={{ backgroundColor: selectedTracks.has(track.id) ? 'rgb(var(--color-primary))' : 'rgba(0,0,0,0.3)' }}>
                        {selectedTracks.has(track.id) && (
                          <svg className="w-2 h-2 md:w-2.5 md:h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Track Info & Actions */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-semibold text-sm md:text-base text-[rgb(var(--color-on-surface))] truncate mb-0.5 md:mb-1">
                        {track.title}
                      </h3>
                      <p className="text-xs md:text-sm text-[rgb(var(--color-on-surface))]/60 truncate mb-2 md:mb-3">
                        {track.artist}
                      </p>
                      
                      {/* Metadata Tags */}
                      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
                        <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-[rgb(var(--color-surface-variant))]/60 rounded-md md:rounded-lg text-[10px] md:text-xs font-medium text-[rgb(var(--color-on-surface))]/70">
                          {formatDuration(track.duration)}
                        </span>
                        {track.bpm && (
                          <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-[rgb(var(--color-primary))]/10 rounded-md md:rounded-lg text-[10px] md:text-xs font-medium text-[rgb(var(--color-primary))]">
                            {track.bpm} BPM
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 md:px-2 md:py-1 bg-[rgb(var(--color-surface-variant))]/60 rounded-md md:rounded-lg text-[10px] md:text-xs font-medium text-[rgb(var(--color-on-surface))]/70 uppercase">
                          {track.format}
                        </span>
                      </div>

                      <div className="text-[10px] md:text-xs text-[rgb(var(--color-on-surface))]/40 font-medium">
                        {formatFileSize(track.fileSize || 0)}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1.5 md:space-x-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadTrack(track);
                        }}
                        disabled={selectedTracks.size > 0}
                        className="flex-1 px-2 py-1.5 md:px-3 md:py-2 bg-[rgb(var(--color-primary))]/10 hover:bg-[rgb(var(--color-primary))]/20 text-[rgb(var(--color-primary))] rounded-lg md:rounded-xl transition-all duration-200 flex items-center justify-center space-x-1 md:space-x-2 font-medium text-xs md:text-sm disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[rgb(var(--color-primary))]/10"
                      >
                        <FiDownload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span>Baixar</span>
                      </button>
                      <div className="relative" ref={openDropdown === track.id ? dropdownRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === track.id ? null : track.id);
                          }}
                          disabled={selectedTracks.size > 0}
                          className="p-1.5 md:p-2 bg-[rgb(var(--color-surface-variant))]/30 hover:bg-[rgb(var(--color-surface-variant))]/50 text-[rgb(var(--color-on-surface))] rounded-lg md:rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-[rgb(var(--color-surface-variant))]/30"
                          title="Mais opções"
                        >
                          <FiMoreVertical className="w-4 h-4" />
                        </button>
                        {openDropdown === track.id && (
                          <div className="absolute right-0 bottom-full mb-1 w-48 bg-[rgb(var(--color-surface))] rounded-xl shadow-2xl border border-[rgb(var(--color-on-surface))]/10 py-1 z-50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(track);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30 flex items-center space-x-3 transition-colors"
                            >
                              <FiEdit2 className="w-4 h-4" />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToPlaylist(track);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/30 flex items-center space-x-3 transition-colors"
                            >
                              <FiPlus className="w-4 h-4" />
                              <span>Adicionar à Playlist</span>
                            </button>
                            <div className="h-px bg-[rgb(var(--color-on-surface))]/10 my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(track.id, track.title);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm text-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent))]/10 flex items-center space-x-3 transition-colors"
                            >
                              <FiTrash2 className="w-4 h-4" />
                              <span>Excluir</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Format Selection Modal */}
      {showFormatModal && selectedTrackForDownload && createPortal(
        <div 
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] px-3 py-4 md:p-4 transition-opacity duration-200 ${
            isFormatModalAnimating ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleCloseFormatModal}
        >
          <div 
            className={`bg-[rgb(var(--color-surface))] rounded-2xl md:rounded-3xl shadow-2xl border border-[rgb(var(--color-primary))]/20 max-w-md w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto transition-all duration-200 ${
              isFormatModalAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-[rgb(var(--color-on-surface))]">
                Escolher Formato
              </h3>
              <button
                onClick={handleCloseFormatModal}
                className="p-1.5 md:p-2 hover:bg-[rgb(var(--color-surface-variant))]/30 rounded-lg md:rounded-xl transition-all"
              >
                <FiX className="w-5 h-5 text-[rgb(var(--color-on-surface))]/60" />
              </button>
            </div>

            <div className="mb-4 md:mb-6">
              <p className="text-xs md:text-sm text-[rgb(var(--color-on-surface))]/60 mb-1 md:mb-2">
                Formato atual: <span className="font-semibold text-[rgb(var(--color-primary))]">{selectedTrackForDownload.format.toUpperCase()}</span>
              </p>
              <p className="text-xs md:text-sm text-[rgb(var(--color-on-surface))]/60">
                Escolha o formato para baixar a música:
              </p>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              {(['original', 'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'] as AudioFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => handleFormatSelection(format)}
                  className={`w-full p-3 md:p-4 rounded-lg md:rounded-xl text-left transition-all duration-200 ${
                    format === selectedTrackForDownload.format || format === 'original'
                      ? 'bg-[rgb(var(--color-primary))]/10 border-2 border-[rgb(var(--color-primary))]/30'
                      : 'bg-[rgb(var(--color-surface-variant))]/30 hover:bg-[rgb(var(--color-surface-variant))]/50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm md:text-base text-[rgb(var(--color-on-surface))] uppercase">
                        {format === 'original' ? `${selectedTrackForDownload.format} (original)` : format}
                      </div>
                      <div className="text-[10px] md:text-xs text-[rgb(var(--color-on-surface))]/60 mt-0.5 md:mt-1">
                        {format === 'original' && 'Sem conversão'}
                        {format === 'mp3' && 'Comprimido, compatível'}
                        {format === 'wav' && 'Sem compressão, qualidade máxima'}
                        {format === 'flac' && 'Sem perda, comprimido'}
                        {format === 'aac' && 'Comprimido, alta qualidade'}
                        {format === 'm4a' && 'Apple, alta qualidade'}
                        {format === 'ogg' && 'Open source, comprimido'}
                      </div>
                    </div>
                    {(format === selectedTrackForDownload.format || format === 'original') && (
                      <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[rgb(var(--color-primary))] flex items-center justify-center">
                        <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Conversion Progress Modal */}
      {isConverting && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 md:p-4">
          <div className="bg-[rgb(var(--color-surface))] rounded-2xl md:rounded-3xl shadow-2xl border border-[rgb(var(--color-primary))]/20 max-w-md w-full p-5 md:p-6">
            <div className="flex items-center justify-center mb-3 md:mb-4">
              <FiLoader className="w-10 h-10 md:w-12 md:h-12 animate-spin text-[rgb(var(--color-primary))]" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-[rgb(var(--color-on-surface))] text-center mb-1.5 md:mb-2">
              Convertendo Áudio
            </h3>
            <p className="text-xs md:text-sm text-[rgb(var(--color-on-surface))]/60 text-center mb-3 md:mb-4">
              Por favor, aguarde...
            </p>
            <div className="w-full bg-[rgb(var(--color-surface-variant))]/30 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] h-full transition-all duration-300"
                style={{ width: `${conversionProgress}%` }}
              />
            </div>
            <p className="text-center text-sm font-semibold text-[rgb(var(--color-on-surface))] mt-2">
              {conversionProgress}%
            </p>
          </div>
        </div>,
        document.body
      )}

      {/* Track Metadata Editor Modal */}
      {editingTrack && (
        <TrackMetadataEditor
          track={editingTrack}
          onClose={() => setEditingTrack(null)}
        />
      )}
    </div>
  );
}
