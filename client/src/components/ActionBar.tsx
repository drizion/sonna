import { FiDownload, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

interface ActionBarProps {
  selectedCount: number;
  onDownload: () => void;
  onAddToPlaylist: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

export default function ActionBar({
  selectedCount,
  onDownload,
  onAddToPlaylist,
  onDelete,
  onCancel,
}: ActionBarProps) {
  return (
    <div className="pb-safe">
      <div className="max-w-md mx-auto px-2 md:px-4 pb-3 md:pb-6">
        <div className="relative bg-[rgb(var(--color-surface))]/60 backdrop-blur-[20px] rounded-2xl md:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-[rgb(var(--color-primary))]/20 overflow-hidden animate-scale-in">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--color-primary))]/5 to-transparent pointer-events-none" />
          
          <div className="relative px-3 md:px-4 py-3 md:py-4 flex items-center gap-2 md:gap-3">
            {/* Selected Count */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[rgb(var(--color-primary))]/10 rounded-xl flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-[rgb(var(--color-primary))] animate-pulse" />
              <span className="text-sm md:text-base font-bold text-[rgb(var(--color-on-surface))]">
                {selectedCount}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-[rgb(var(--color-on-surface))]/10 flex-shrink-0" />

            {/* Actions */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-1 overflow-x-auto no-scrollbar">
              <button
                onClick={onDownload}
                className="px-3 md:px-4 py-2 bg-[rgb(var(--color-primary))]/10 hover:bg-[rgb(var(--color-primary))]/20 text-[rgb(var(--color-primary))] rounded-xl transition-all duration-200 flex items-center gap-2 text-sm md:text-base font-medium hover:scale-105 whitespace-nowrap flex-shrink-0"
                title="Baixar selecionados"
              >
                <FiDownload className="w-4 h-4" />
                <span className="hidden sm:inline">Baixar</span>
              </button>
              
              <button
                onClick={onAddToPlaylist}
                className="px-3 md:px-4 py-2 bg-[rgb(var(--color-surface-variant))]/50 hover:bg-[rgb(var(--color-surface-variant))]/70 text-[rgb(var(--color-on-surface))] rounded-xl transition-all duration-200 flex items-center gap-2 text-sm md:text-base font-medium hover:scale-105 whitespace-nowrap flex-shrink-0"
                title="Adicionar à playlist"
              >
                <FiPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Playlist</span>
              </button>

              <button
                onClick={onDelete}
                className="px-3 md:px-4 py-2 bg-[rgb(var(--color-accent))]/10 hover:bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))] rounded-xl transition-all duration-200 flex items-center gap-2 text-sm md:text-base font-medium hover:scale-105 whitespace-nowrap flex-shrink-0"
                title="Excluir selecionados"
              >
                <FiTrash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Excluir</span>
              </button>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-[rgb(var(--color-on-surface))]/10 flex-shrink-0" />

            {/* Cancel Button */}
            <button
              onClick={onCancel}
              className="p-2 hover:bg-[rgb(var(--color-surface-variant))]/30 rounded-lg transition-all duration-200 flex-shrink-0"
              title="Cancelar"
            >
              <FiX className="w-5 h-5 text-[rgb(var(--color-on-surface))]/60" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
