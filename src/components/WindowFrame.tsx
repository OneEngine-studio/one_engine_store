import React from 'react';
import { useStore } from '../store/useStore';
import { 
  Minus, 
  Square, 
  X, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Bell
} from 'lucide-react';

export const WindowFrame: React.FC = () => {
  const { 
    currentUser, 
    openAuthModal, 
    searchQuery, 
    setSearchQuery, 
    navigate,
    minimizeWindow, 
    toggleMaximizeWindow, 
    closeWindow 
  } = useStore();

  return (
    <header 
      data-tauri-drag-region 
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      className="h-10 bg-void-black border-b border-border-stroke flex items-center justify-between px-3 select-none z-50 shrink-0"
    >
      {/* Left: Brand Glyph & Breadcrumb Navigation */}
      <div className="flex items-center space-x-3 pointer-events-none">
        <div className="flex items-center space-x-2">
          <img 
            src="/images/logo.png" 
            alt="OneEngine" 
            className="w-5 h-5 object-contain rounded"
          />
          <span className="font-mono text-xs font-bold tracking-widest text-slate-100 uppercase">
            ONE<span className="text-primary-accent">ENGINE</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400 border border-border-stroke px-1.5 py-0.2 rounded bg-tech-surface">
            DESKTOP // v2.6
          </span>
        </div>

        {/* Back / Forward Controls */}
        <div 
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          className="hidden sm:flex items-center space-x-1 pl-3 pointer-events-auto"
        >
          <button 
            onClick={() => navigate('store')}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-tech-surface text-slate-400 hover:text-slate-100 transition-colors"
            title="Back to Store"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            disabled 
            className="w-6 h-6 flex items-center justify-center rounded text-slate-400 cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Search Box & Tactical Command */}
      <div 
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex-1 max-w-md mx-4 pointer-events-auto"
      >
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tactical database... (Ctrl + K)"
            className="w-full bg-tech-surface border border-border-stroke rounded pl-8 pr-3 py-1 text-xs font-mono text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary-accent transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-slate-400 hover:text-slate-200 text-xs font-mono"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Right: Notification, Profile Chip, Native Window Controls */}
      <div 
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center space-x-2 pointer-events-auto"
      >
        <button 
          onClick={openAuthModal}
          className="flex items-center space-x-2 px-2.5 py-1 bg-tech-surface hover:bg-tech-elevated border border-border-stroke hover:border-slate-500 rounded text-xs font-mono transition-colors"
          title="Switch User Profile"
        >
          <img 
            src={currentUser.avatarUrl} 
            alt={currentUser.callsign} 
            className="w-4 h-4 rounded-full border border-primary-accent" 
          />
          <span className="text-slate-200 font-bold hidden md:inline">{currentUser.callsign}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-tactical-green" />
        </button>

        <button 
          onClick={() => navigate('community')}
          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-primary-accent hover:bg-tech-surface rounded transition-colors relative"
          title="System Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary-accent" />
        </button>

        {/* Windows OS Frame Buttons */}
        <div className="flex items-center space-x-1 pl-2 border-l border-border-stroke">
          <button
            onClick={minimizeWindow}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-tech-elevated rounded transition-colors"
            title="Minimize"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={toggleMaximizeWindow}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-tech-elevated rounded transition-colors"
            title="Maximize / Restore"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={closeWindow}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#E53935] rounded transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
