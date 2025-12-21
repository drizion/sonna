import { useEffect, useState } from 'react';
import { FiSettings } from 'react-icons/fi';

type Theme = 'light' | 'dark' | 'auto';

export default function Settings() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'auto';
  });

  useEffect(() => {
    const applyTheme = (currentTheme: Theme) => {
      const root = document.documentElement;
      
      if (currentTheme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      } else if (currentTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);
    localStorage.setItem('theme', theme);

    // Listen for system theme changes when in auto mode
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme(theme);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as Theme);
  };

  return (
    <div className="bg-[rgb(var(--color-surface))]/60 backdrop-blur-2xl rounded-2xl md:rounded-3xl shadow-2xl border border-[rgb(var(--color-primary))]/20 p-3 md:p-8">
      <div className="flex items-center space-x-2 md:space-x-3 mb-6 md:mb-8">
        <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
          <FiSettings className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-[rgb(var(--color-on-surface))]">
          Configurações
        </h2>
      </div>

      <div className="space-y-6">
        {/* Default Download Format */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-[rgb(var(--color-on-surface))]/70 mb-2">
            Formato Padrão de Download
          </label>
          <select
            className="w-full px-4 md:px-5 py-3 md:py-4 border border-[rgb(var(--color-primary))]/20 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-[rgb(var(--color-primary))]/50 focus:border-[rgb(var(--color-primary))]/50 bg-[rgb(var(--color-surface))]/50 backdrop-blur-xl text-[rgb(var(--color-on-surface))] text-sm md:text-base transition-all duration-200"
            defaultValue="original"
          >
            <option value="original">Original (MP3)</option>
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="flac">FLAC</option>
            <option value="aac">AAC</option>
            <option value="m4a">M4A</option>
            <option value="ogg">OGG</option>
          </select>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-xs md:text-sm font-medium text-[rgb(var(--color-on-surface))]/70 mb-2">
            Tema
          </label>
          <select
            value={theme}
            onChange={handleThemeChange}
            className="w-full px-4 md:px-5 py-3 md:py-4 border border-[rgb(var(--color-primary))]/20 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-[rgb(var(--color-primary))]/50 focus:border-[rgb(var(--color-primary))]/50 bg-[rgb(var(--color-surface))]/50 backdrop-blur-xl text-[rgb(var(--color-on-surface))] text-sm md:text-base transition-all duration-200"
          >
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
            <option value="auto">Automático</option>
          </select>
        </div>

        {/* Auto Download Artwork */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-xs md:text-sm font-medium text-[rgb(var(--color-on-surface))]/70">
              Baixar Artwork Automaticamente
            </label>
            <p className="text-[10px] md:text-xs text-[rgb(var(--color-on-surface))]/50 mt-1">
              Salvar capas de álbum junto com as músicas
            </p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            className="w-5 h-5 text-[rgb(var(--color-primary))] rounded focus:ring-2 focus:ring-[rgb(var(--color-primary))]/50 accent-[rgb(var(--color-primary))]"
          />
        </div>

        {/* Delete Old Tracks */}
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-[rgb(var(--color-on-surface))]/70">
              Deletar Músicas Antigas
            </label>
            <p className="text-xs text-[rgb(var(--color-on-surface))]/50 mt-1">
              Apagar músicas antigas quando atingir limite de armazenamento
            </p>
          </div>
          <input
            type="checkbox"
            className="w-5 h-5 text-[rgb(var(--color-primary))] rounded focus:ring-2 focus:ring-[rgb(var(--color-primary))]/50 accent-[rgb(var(--color-primary))]"
          />
        </div>

        {/* Max Storage Usage */}
        <div>
          <label className="block text-sm font-medium text-[rgb(var(--color-on-surface))]/70 mb-2">
            Uso Máximo de Armazenamento
          </label>
          <input
            type="range"
            min="10"
            max="90"
            defaultValue="80"
            className="w-full accent-[rgb(var(--color-primary))]"
          />
          <div className="flex justify-between text-xs text-[rgb(var(--color-on-surface))]/50 mt-1">
            <span>10%</span>
            <span>80%</span>
            <span>90%</span>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button className="w-full px-6 py-4 bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] text-white rounded-2xl font-semibold hover:shadow-xl transition-all duration-200 shadow-lg">
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
