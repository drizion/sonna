import { FiDownload, FiDisc, FiSettings } from 'react-icons/fi';

type Tab = 'download' | 'library' | 'settings';

interface TabMenuProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function TabMenu({ activeTab, onTabChange }: TabMenuProps) {
  const tabs = [
    { id: 'download' as Tab, label: 'Baixar', icon: FiDownload },
    { id: 'library' as Tab, label: 'Biblioteca', icon: FiDisc },
    { id: 'settings' as Tab, label: 'Configurações', icon: FiSettings },
  ];

  const activeIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="max-w-md mx-auto px-2 md:px-4 pb-3 md:pb-6">
        <nav className="relative bg-[rgb(var(--color-surface))]/60 backdrop-blur-[20px] rounded-2xl md:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-[rgb(var(--color-on-surface))]/[0.08] overflow-hidden">
          {/* Background blur effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-[rgb(var(--color-surface))]/20 to-transparent pointer-events-none" />
          
          <div className="relative flex items-stretch">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    flex-1 relative group px-2 md:px-4 py-3 md:py-4
                    transition-all duration-500 ease-out
                    ${index !== 0 ? 'border-l border-[rgb(var(--color-on-surface))]/[0.06]' : ''}
                  `}
                  aria-label={tab.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Content */}
                  <div className="relative flex flex-col items-center gap-0.5 md:gap-1">
                    <div className="relative">
                      <Icon 
                        className={`
                          w-5 h-5 md:w-6 md:h-6 transition-all duration-500 ease-out
                          ${isActive 
                            ? 'text-[rgb(var(--color-primary))] scale-100' 
                            : 'text-[rgb(var(--color-on-surface))]/60 scale-90 group-hover:scale-100 group-hover:text-[rgb(var(--color-on-surface))]/80'
                          }
                        `}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </div>
                    <span className={`
                      text-[10px] md:text-[11px] font-medium tracking-tight
                      transition-all duration-500 ease-out
                      ${isActive 
                        ? 'text-[rgb(var(--color-primary))] opacity-100' 
                        : 'text-[rgb(var(--color-on-surface))]/50 opacity-80 group-hover:opacity-100'
                      }
                    `}>
                      {tab.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
