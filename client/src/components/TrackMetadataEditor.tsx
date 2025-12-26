import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { FiCheck, FiX } from 'react-icons/fi';
import type { StoredTrack } from '@music-downloader/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTrackMetadata } from '../services/storage';

interface TrackMetadataEditorProps {
  track: StoredTrack;
  onClose: () => void;
}

const musicalKeys = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
];

const genres = [
  'House', 'Techno', 'Trance', 'Dubstep', 'Drum & Bass', 'Future Bass',
  'Trap', 'Hip Hop', 'Pop', 'Rock', 'Indie', 'Electronic', 'Ambient',
  'Deep House', 'Tech House', 'Progressive House', 'Melodic Techno',
  'Hardstyle', 'Bass House', 'Future House', 'UK Garage', 'Outro'
];

const moods = [
  'Energético', 'Relaxante', 'Melancólico', 'Feliz', 'Intenso',
  'Calmo', 'Misterioso', 'Épico', 'Sombrio', 'Inspirador'
];

export default function TrackMetadataEditor({ track, onClose }: TrackMetadataEditorProps) {
  const queryClient = useQueryClient();
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [title, setTitle] = useState(track.title);
  const [artist, setArtist] = useState(track.artist);
  const [album, setAlbum] = useState(track.album || '');
  const [genre, setGenre] = useState(track.genre || '');
  const [customGenre, setCustomGenre] = useState('');
  const [bpm, setBpm] = useState(track.bpm?.toString() || '');
  const [key, setKey] = useState(track.key || '');
  const [year, setYear] = useState(track.year?.toString() || '');
  const [label, setLabel] = useState(track.label || '');
  const [energy, setEnergy] = useState(track.energy || 5);
  const [mood, setMood] = useState(track.mood || '');
  const [notes, setNotes] = useState(track.notes || '');
  const [tags, setTags] = useState(track.tags?.join(', ') || '');
  const [rating, setRating] = useState(track.rating || 0);

  // Anima entrada e bloqueia scroll
  useEffect(() => {
    setTimeout(() => setIsAnimating(true), 10);
    
    // Bloquear scroll da página quando modal está aberto
    document.body.classList.add('modal-open');
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const finalGenre = genre === 'Outro' ? customGenre : genre;
      
      await updateTrackMetadata(track.id, {
        title,
        artist,
        album: album || undefined,
        genre: finalGenre || undefined,
        bpm: bpm ? parseInt(bpm) : undefined,
        key: key || undefined,
        year: year ? parseInt(year) : undefined,
        label: label || undefined,
        energy,
        mood: mood || undefined,
        notes: notes || undefined,
        tags: tags ? tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : undefined,
        rating: rating || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracks'] });
      queryClient.invalidateQueries({ queryKey: ['playlist-tracks'] });
      toast.success('Metadados atualizados!');
      onClose();
    },
    onError: () => {
      toast.error('Erro ao atualizar metadados');
    },
  });

  const handleSave = () => {
    if (!title.trim() || !artist.trim()) {
      toast.error('Título e artista são obrigatórios');
      return;
    }
    updateMutation.mutate();
  };

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  };

  return createPortal(
    <div 
      className={`fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[9999] p-4 overflow-y-auto transition-opacity duration-200 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-[rgb(var(--color-surface))] rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-[rgb(var(--color-on-surface))]/5 my-8 transition-all duration-200 ${
          isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-[rgb(var(--color-on-surface))]">
            Editar Metadados
          </h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[rgb(var(--color-surface-variant))]/30 rounded-full transition-colors"
          >
            <FiX className="w-6 h-6 text-[rgb(var(--color-on-surface))]/60" />
          </button>
        </div>

        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--color-on-surface))]/60 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3.5 bg-[rgb(var(--color-surface-variant))]/20 border border-[rgb(var(--color-on-surface))]/10 rounded-2xl text-[rgb(var(--color-on-surface))] focus:outline-none focus:border-[rgb(var(--color-primary))]/50 focus:bg-[rgb(var(--color-surface-variant))]/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
                Artista *
              </label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-4 py-3 bg-[rgb(var(--color-surface-variant))]/30 border border-[rgb(var(--color-primary))]/20 rounded-xl text-[rgb(var(--color-on-surface))] focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
              />
            </div>
          </div>

          {/* Album & Year */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
                Álbum
              </label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                className="w-full px-4 py-3 bg-[rgb(var(--color-surface-variant))]/30 border border-[rgb(var(--color-primary))]/20 rounded-xl text-[rgb(var(--color-on-surface))] focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
                Ano
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                className="w-full px-4 py-3 bg-[rgb(var(--color-surface-variant))]/30 border border-[rgb(var(--color-primary))]/20 rounded-xl text-[rgb(var(--color-on-surface))] focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
              />
            </div>
          </div>

          {/* Genre & Label */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
                Gênero
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-4 py-3 bg-[rgb(var(--color-surface-variant))]/30 border border-[rgb(var(--color-primary))]/20 rounded-xl text-[rgb(var(--color-on-surface))] focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
              >
                <option value="">Selecione...</option>
                {genres.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              {genre === 'Outro' && (
                <input
                  type="text"
                  value={customGenre}
                  onChange={(e) => setCustomGenre(e.target.value)}
                  placeholder="Digite o gênero"
                  className="w-full px-4 py-3 mt-2 bg-[rgb(var(--color-surface-variant))]/30 border border-[rgb(var(--color-primary))]/20 rounded-xl text-[rgb(var(--color-on-surface))] focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
                Gravadora/Label
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-4 py-3 bg-[rgb(var(--color-surface-variant))]/30 border border-[rgb(var(--color-primary))]/20 rounded-xl text-[rgb(var(--color-on-surface))] focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
              />
            </div>
          </div>

          {/* BPM & Key */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
                BPM
              </label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="128"
                className="w-full px-4 py-3 bg-[rgb(var(--color-surface-variant))]/30 border border-[rgb(var(--color-primary))]/20 rounded-xl text-[rgb(var(--color-on-surface))] focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
                Tonalidade
              </label>
              <select
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-4 py-3 bg-[rgb(var(--color-surface-variant))]/30 border border-[rgb(var(--color-primary))]/20 rounded-xl text-[rgb(var(--color-on-surface))] focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
              >
                <option value="">Selecione...</option>
                {musicalKeys.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
              Mood/Clima
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full px-4 py-3 bg-[rgb(var(--color-surface-variant))]/30 border border-[rgb(var(--color-primary))]/20 rounded-xl text-[rgb(var(--color-on-surface))] focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
            >
              <option value="">Selecione...</option>
              {moods.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Energy Level */}
          <div>
            <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
              Nível de Energia: {energy}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full h-2 bg-[rgb(var(--color-surface-variant))]/30 rounded-lg appearance-none cursor-pointer accent-[rgb(var(--color-primary))]"
            />
            <div className="flex justify-between text-xs text-[rgb(var(--color-on-surface))]/50 mt-1">
              <span>Calmo</span>
              <span>Energético</span>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
              Avaliação
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-3xl transition-all ${
                    star <= rating ? 'text-yellow-400' : 'text-[rgb(var(--color-on-surface))]/20'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
              Tags (separadas por vírgula)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="dançante, verão, festa"
              className="w-full px-4 py-3 bg-[rgb(var(--color-surface-variant))]/30 border border-[rgb(var(--color-primary))]/20 rounded-xl text-[rgb(var(--color-on-surface))] focus:outline-none focus:border-[rgb(var(--color-primary))] transition-colors"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-[rgb(var(--color-on-surface))]/70 mb-2">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione notas sobre esta música..."
              rows={3}
                className="w-full px-4 py-3.5 bg-[rgb(var(--color-surface-variant))]/20 border border-[rgb(var(--color-on-surface))]/10 rounded-2xl text-[rgb(var(--color-on-surface))] focus:outline-none focus:border-[rgb(var(--color-primary))]/50 focus:bg-[rgb(var(--color-surface-variant))]/30 transition-all resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-[rgb(var(--color-on-surface))]/5">
          <button
            onClick={handleClose}
            className="flex-1 py-3.5 bg-[rgb(var(--color-surface-variant))]/20 text-[rgb(var(--color-on-surface))] rounded-2xl font-semibold hover:bg-[rgb(var(--color-surface-variant))]/30 active:scale-[0.98] transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex-1 py-3.5 bg-[rgb(var(--color-primary))] text-white rounded-2xl font-semibold hover:bg-[rgb(var(--color-primary))]/90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[rgb(var(--color-primary))]/20"
          >
            <FiCheck className="w-5 h-5" />
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
