import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiEdit2, FiHeart, FiMusic, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import type { Playlist } from '@music-downloader/shared';
import { useDeletePlaylist, usePlaylists, useSavePlaylist } from '../hooks/usePlaylist';

interface PlaylistManagerProps {
  onSelectPlaylist: (playlistId: string | null) => void;
  selectedPlaylistId: string | null;
}

export default function PlaylistManager({ onSelectPlaylist, selectedPlaylistId }: PlaylistManagerProps) {
  const { data: playlists } = usePlaylists();
  const savePlaylist = useSavePlaylist();
  const deletePlaylist = useDeletePlaylist();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [playlistColor, setPlaylistColor] = useState('#007AFF');

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      toast.error('Digite um nome para a playlist');
      return;
    }

    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: playlistName,
      description: playlistDescription,
      trackIds: [],
      source: 'local',
      createdDate: new Date(),
      updatedDate: new Date(),
      color: playlistColor,
      isFavorite: false,
    };

    toast.promise(
      savePlaylist.mutateAsync(newPlaylist),
      {
        loading: 'Criando playlist...',
        success: 'Playlist criada com sucesso!',
        error: 'Erro ao criar playlist',
      }
    );

    setShowCreateModal(false);
    setPlaylistName('');
    setPlaylistDescription('');
    setPlaylistColor('#8B5CF6');
  };

  const handleEditPlaylist = async () => {
    if (!editingPlaylist || !playlistName.trim()) return;

    const updated: Playlist = {
      ...editingPlaylist,
      name: playlistName,
      description: playlistDescription,
      color: playlistColor,
      updatedDate: new Date(),
    };

    toast.promise(
      savePlaylist.mutateAsync(updated),
      {
        loading: 'Salvando...',
        success: 'Playlist atualizada!',
        error: 'Erro ao atualizar playlist',
      }
    );

    setEditingPlaylist(null);
    setPlaylistName('');
    setPlaylistDescription('');
  };

  const handleDeletePlaylist = async (playlist: Playlist) => {
    if (!confirm(`Deseja deletar a playlist "${playlist.name}"?`)) return;

    toast.promise(
      deletePlaylist.mutateAsync(playlist.id),
      {
        loading: 'Deletando...',
        success: 'Playlist deletada!',
        error: 'Erro ao deletar playlist',
      }
    );

    if (selectedPlaylistId === playlist.id) {
      onSelectPlaylist(null);
    }
  };

  const handleToggleFavorite = async (playlist: Playlist) => {
    const updated: Playlist = {
      ...playlist,
      isFavorite: !playlist.isFavorite,
      updatedDate: new Date(),
    };

    await savePlaylist.mutateAsync(updated);
  };

  const startEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist);
    setPlaylistName(playlist.name);
    setPlaylistDescription(playlist.description || '');
    setPlaylistColor(playlist.color || '#8B5CF6');
  };

  const colors = [
    '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', 
    '#EF4444', '#14B8A6', '#F97316', '#6366F1', '#A855F7'
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[rgb(var(--color-on-surface))]">
          Coleções
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          <FiPlus className="w-4 h-4" />
          <span className="hidden md:inline">Nova Coleção</span>
        </button>
      </div>

      {/* All Downloads Option */}
      <button
        onClick={() => onSelectPlaylist(null)}
        className={`w-full p-4 rounded-xl transition-all ${
          selectedPlaylistId === null
            ? 'bg-gradient-to-r from-[rgb(var(--color-primary))]/20 to-[rgb(var(--color-secondary))]/20 border-2 border-[rgb(var(--color-primary))]'
            : 'bg-[rgb(var(--color-surface-variant))]/30 hover:bg-[rgb(var(--color-surface-variant))]/50 border-2 border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] flex items-center justify-center">
            <FiMusic className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="font-bold text-[rgb(var(--color-on-surface))]">Todos os Downloads</h4>
            <p className="text-sm text-[rgb(var(--color-on-surface))]/60">
              Todas as músicas
            </p>
          </div>
        </div>
      </button>

      {/* Playlists List */}
      <div className="space-y-2">
        {playlists?.map((playlist) => (
          <div
            key={playlist.id}
            className={`group p-4 rounded-xl transition-all relative z-10 ${
              selectedPlaylistId === playlist.id
                ? 'bg-[rgb(var(--color-surface-variant))]/50 border-2 border-[rgb(var(--color-primary))]'
                : 'bg-[rgb(var(--color-surface-variant))]/30 hover:bg-[rgb(var(--color-surface-variant))]/50 border-2 border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSelectPlaylist(playlist.id)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: playlist.color || '#8B5CF6' }}
                >
                  <FiMusic className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-[rgb(var(--color-on-surface))]">{playlist.name}</h4>
                    {playlist.isFavorite && (
                      <FiHeart className="w-4 h-4 fill-red-500 text-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-[rgb(var(--color-on-surface))]/60">
                    {playlist.trackIds.length} {playlist.trackIds.length === 1 ? 'música' : 'músicas'}
                  </p>
                </div>
              </button>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleToggleFavorite(playlist)}
                  className="p-2 hover:bg-[rgb(var(--color-surface-variant))]/50 rounded-lg transition-colors"
                  title={playlist.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                >
                  <FiHeart className={`w-4 h-4 ${playlist.isFavorite ? 'fill-red-500 text-red-500' : 'text-[rgb(var(--color-on-surface))]/60'}`} />
                </button>
                <button
                  onClick={() => startEdit(playlist)}
                  className="p-2 hover:bg-[rgb(var(--color-surface-variant))]/50 rounded-lg transition-colors"
                  title="Editar playlist"
                >
                  <FiEdit2 className="w-4 h-4 text-[rgb(var(--color-on-surface))]/60" />
                </button>
                <button
                  onClick={() => handleDeletePlaylist(playlist)}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Deletar playlist"
                >
                  <FiTrash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPlaylist) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--color-surface))] rounded-2xl p-6 max-w-md w-full border border-[rgb(var(--color-primary))]/20">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[rgb(var(--color-on-surface))]">
                {editingPlaylist ? 'Editar Playlist' : 'Nova Playlist'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingPlaylist(null);
                  setPlaylistName('');
                  setPlaylistDescription('');
                }}
                className="p-2 hover:bg-[rgb(var(--color-surface-variant))]/50 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Ex: Favoritas, Treino, Estudo..."
                  className="w-full px-4 py-3 bg-[rgb(var(--color-surface-variant))]/30 border border-[rgb(var(--color-primary))]/20 rounded-xl text-[rgb(var(--color-on-surface))] placeholder:text-[rgb(var(--color-on-surface))]/40 focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  placeholder="Adicione uma descrição..."
                  rows={3}
                  className="w-full px-4 py-3 bg-[rgb(var(--color-surface-variant))]/30 border border-[rgb(var(--color-primary))]/20 rounded-xl text-[rgb(var(--color-on-surface))] placeholder:text-[rgb(var(--color-on-surface))]/40 focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
                  Cor
                </label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setPlaylistColor(color)}
                      className={`w-10 h-10 rounded-lg transition-all ${
                        playlistColor === color ? 'ring-2 ring-[rgb(var(--color-primary))] ring-offset-2 ring-offset-[rgb(var(--color-surface))]' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={editingPlaylist ? handleEditPlaylist : handleCreatePlaylist}
                className="w-full py-3 bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                {editingPlaylist ? 'Salvar' : 'Criar Playlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
