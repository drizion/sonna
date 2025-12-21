import { FiGithub, FiMusic } from 'react-icons/fi';

export default function Header() {
  return (
    <header className="bg-[rgb(var(--color-surface))]/40 backdrop-blur-2xl border-b border-[rgb(var(--color-primary))]/10 sticky top-0 z-40">
      <div className="container mx-auto px-3 md:px-6 py-4 md:py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] rounded-2xl flex items-center justify-center shadow-lg">
              <FiMusic className="w-5 h-5 md:w-7 md:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-[rgb(var(--color-primary))] to-[rgb(var(--color-secondary))] bg-clip-text text-transparent">
                Music Downloader
              </h1>
              <p className="text-xs md:text-sm font-medium text-[rgb(var(--color-on-surface))]/60">
                DJ Edition
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[rgb(var(--color-on-surface))]/60 hover:text-[rgb(var(--color-on-surface))] hover:bg-[rgb(var(--color-surface-variant))]/50 rounded-xl transition-all"
            >
              <FiGithub className="w-5 h-5 md:w-6 md:h-6" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
