import { NavLink } from 'react-router-dom';
import { FiDownload, FiDisc, FiSettings, FiList, FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface TabMenuProps {
  hasSelection?: boolean;
  selectedCount?: number;
  onDownload?: () => void;
  onAddToPlaylist?: () => void;
  onDelete?: () => void;
  onCancel?: () => void;
}

export default function TabMenu({
  hasSelection = false,
  selectedCount = 0,
  onDownload = () => {},
  onAddToPlaylist = () => {},
  onDelete = () => {},
  onCancel = () => {},
}: TabMenuProps) {
  const [showActions, setShowActions] = useState(false);
  const [showTabs, setShowTabs] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const tabs = [
    { path: '/', label: 'Baixar', icon: FiDownload },
    { path: '/library', label: 'Biblioteca', icon: FiDisc },
    { path: '/playlists', label: 'Playlists', icon: FiList },
    { path: '/settings', label: 'Configurações', icon: FiSettings },
  ];

  // Controla a transição entre tabs e ações com mesma duração da Dynamic Island
  useEffect(() => {
    if (hasSelection) {
      setIsTransitioning(true);
      setShowTabs(false);
      
      // Fade out current content (100ms)
      setTimeout(() => {
        // Fade in new content após expansão (200ms)
        setTimeout(() => {
          setShowActions(true);
          setIsTransitioning(false);
        }, 200);
      }, 100);
    } else {
      setIsTransitioning(true);
      setShowActions(false);
      
      // Fade out current content (100ms)
      setTimeout(() => {
        // Fade in new content após expansão (200ms)
        setTimeout(() => {
          setShowTabs(true);
          setIsTransitioning(false);
        }, 200);
      }, 100);
    }
  }, [hasSelection]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="max-w-md mx-auto px-2 md:px-4 pb-3 md:pb-6">
        <nav 
          className={`
            relative bg-[rgb(var(--color-surface))]/60 backdrop-blur-[20px] 
            rounded-2xl md:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] 
            overflow-hidden mx-auto
            border
            transition-all duration-[400ms] ease-[cubic-bezier(0.4,0.0,0.2,1)]
            ${hasSelection 
              ? 'w-[280px] md:w-[320px] border-[rgb(var(--color-primary))]/20' 
              : 'w-full border-[rgb(var(--color-on-surface))]/[0.08]'
            }
          `}
        >
          {/* Background blur effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--color-surface))]/20 to-transparent pointer-events-none" />
          
          {/* Action Bar - substitui as tabs quando ativo */}
          {hasSelection && (
            <div 
              className={`
                relative
                transition-opacity duration-[200ms] ease-[cubic-bezier(0.4,0.0,0.2,1)]
                ${showActions ? 'opacity-100' : 'opacity-0'}
              `}
            >
              <div className="px-3 md:px-4 py-3 md:py-4 flex items-center gap-2 md:gap-3">
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
                <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                  <button
                    onClick={onDownload}
                    className="p-2.5 md:p-3 bg-[rgb(var(--color-primary))]/10 hover:bg-[rgb(var(--color-primary))]/20 text-[rgb(var(--color-primary))] rounded-xl transition-all duration-[400ms] ease-[cubic-bezier(0.4,0.0,0.2,1)] flex items-center justify-center hover:scale-105 flex-shrink-0"
                    aria-label="Baixar"
                  >
                    <FiDownload className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={onAddToPlaylist}
                    className="p-2.5 md:p-3 bg-[rgb(var(--color-surface-variant))]/50 hover:bg-[rgb(var(--color-surface-variant))]/70 text-[rgb(var(--color-on-surface))] rounded-xl transition-all duration-[400ms] ease-[cubic-bezier(0.4,0.0,0.2,1)] flex items-center justify-center hover:scale-105 flex-shrink-0"
                    aria-label="Adicionar à playlist"
                  >
                    <FiPlus className="w-5 h-5" />
                  </button>

                  <button
                    onClick={onDelete}
                    className="p-2.5 md:p-3 bg-[rgb(var(--color-accent))]/10 hover:bg-[rgb(var(--color-accent))]/20 text-[rgb(var(--color-accent))] rounded-xl transition-all duration-[400ms] ease-[cubic-bezier(0.4,0.0,0.2,1)] flex items-center justify-center hover:scale-105 flex-shrink-0"
                    aria-label="Excluir"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-[rgb(var(--color-on-surface))]/10 flex-shrink-0" />

                {/* Cancel Button */}
                <button
                  onClick={onCancel}
                  className="p-2 hover:bg-[rgb(var(--color-surface-variant))]/30 rounded-lg transition-all duration-[400ms] ease-[cubic-bezier(0.4,0.0,0.2,1)] flex-shrink-0"
                >
                  <FiX className="w-5 h-5 text-[rgb(var(--color-on-surface))]/60" />
                </button>
              </div>
            </div>
          )}

          {/* Tab Navigation - some quando hasSelection */}
          {!hasSelection && (
            <div className={`
              relative flex items-stretch
              transition-opacity duration-[200ms] ease-[cubic-bezier(0.4,0.0,0.2,1)]
              ${showTabs ? 'opacity-100' : 'opacity-0'}
            `}>
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                
                return (
                  <NavLink
                    key={tab.path}
                    to={tab.path}
                    end={tab.path === '/'}
                    className={({ isActive }) => `
                      flex-1 relative group px-2 md:px-4 py-3 md:py-4
                      transition-all duration-[400ms] ease-[cubic-bezier(0.4,0.0,0.2,1)]
                      ${index !== 0 ? 'border-l border-[rgb(var(--color-on-surface))]/[0.06]' : ''}
                    `}
                    aria-label={tab.label}
                  >
                    {({ isActive }) => (
                      <div className="relative flex flex-col items-center gap-0.5 md:gap-1">
                        <div className="relative">
                          <Icon 
                            className={`
                              w-5 h-5 md:w-6 md:h-6 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0.0,0.2,1)]
                              ${isActive 
                                ? 'text-[rgb(var(--color-primary))] scale-110' 
                                : 'text-[rgb(var(--color-on-surface))]/60 scale-90 group-hover:scale-100 group-hover:text-[rgb(var(--color-on-surface))]/80'
                              }
                            `}
                            strokeWidth={isActive ? 2.5 : 2}
                          />
                        </div>
                        <span className={`
                          text-[10px] md:text-[11px] font-medium tracking-tight
                          transition-all duration-[400ms] ease-[cubic-bezier(0.4,0.0,0.2,1)]
                          ${isActive 
                            ? 'text-[rgb(var(--color-primary))] opacity-100' 
                            : 'text-[rgb(var(--color-on-surface))]/50 opacity-70 group-hover:opacity-100'
                          }
                        `}>
                          {tab.label}
                        </span>
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
