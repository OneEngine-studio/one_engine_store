import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Minus, 
  Square, 
  X, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Bell, 
  CreditCard
} from 'lucide-react';
import { NotificationPopover } from './NotificationPopover';

export const WindowFrame: React.FC = () => {
  const { 
    currentUser, 
    openAuthModal, 
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    setCommandPaletteOpen,
    notifications,
    runningGameId,
    games,
    sessionElapsedSeconds,
    minimizeWindow, 
    toggleMaximizeWindow, 
    closeWindow 
  } = useStore();

  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const runningGame = games.find((g) => g.id === runningGameId);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header 
      data-tauri-drag-region 
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      className="h-11 bg-void-black border-b border-border-stroke flex items-center justify-between px-3 select-none z-40 shrink-0 relative"
    >
      {/* Left: Brand Glyph & History Controls */}
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
          className="hidden sm:flex items-center space-x-1 pl-2 pointer-events-auto"
        >
          <button 
            onClick={goBack}
            disabled={!canGoBack}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
              canGoBack 
                ? 'hover:bg-tech-surface text-slate-300 hover:text-white cursor-pointer' 
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={goForward}
            disabled={!canGoForward}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
              canGoForward 
                ? 'hover:bg-tech-surface text-slate-300 hover:text-white cursor-pointer' 
                : 'text-slate-600 cursor-not-allowed'
            }`}
            title="Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <div 
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex-1 max-w-md mx-4 pointer-events-auto"
      >
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full bg-tech-surface hover:bg-tech-elevated border border-border-stroke rounded px-3 py-1 flex items-center justify-between text-xs font-sans text-slate-400 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-primary-accent" />
            <span>Search tactical database, catalog, or articles...</span>
          </div>
          <kbd className="px-1.5 py-0.2 text-[10px] font-mono bg-void-black border border-border-stroke rounded text-slate-400">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Right: Live Session Status, Wallet, Profile Chip, Notifications, OS Window Controls */}
      <div 
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center space-x-2.5 pointer-events-auto relative"
      >
        {/* Live Running Status Pill */}
        {runningGame && (
          <div className="hidden lg:flex items-center space-x-1.5 px-2 py-0.5 rounded bg-tactical-green/15 border border-tactical-green/40 text-tactical-green text-[10px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-tactical-green animate-ping" />
            <span>IN-GAME: {runningGame.title.split(':')[0]}</span>
            <span className="text-slate-300">({formatTimer(sessionElapsedSeconds)})</span>
          </div>
        )}

        {/* User Wallet Pill */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-tech-surface border border-border-stroke rounded text-xs font-mono">
          <CreditCard className="w-3 h-3 text-primary-accent" />
          <span className="text-slate-400 text-[10px]">WALLET:</span>
          <span className="text-slate-100 font-bold">${currentUser.walletBalance.toFixed(2)}</span>
        </div>

        {/* Profile Switcher Trigger */}
        <button 
          onClick={openAuthModal}
          className="flex items-center space-x-2 px-2.5 py-1 bg-tech-surface hover:bg-tech-elevated border border-border-stroke hover:border-slate-500 rounded text-xs font-mono transition-colors"
          title="Switch Operative Account"
        >
          <img 
            src={currentUser.avatarUrl} 
            alt={currentUser.callsign} 
            className="w-4 h-4 rounded-full border border-primary-accent" 
          />
          <span className="text-slate-200 font-bold hidden sm:inline">{currentUser.callsign}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${currentUser.status === 'ONLINE' ? 'bg-tactical-green' : 'bg-primary-accent'}`} />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-primary-accent hover:bg-tech-surface rounded transition-colors relative"
            title="System Communications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-accent ring-2 ring-void-black" />
            )}
          </button>
          
          <NotificationPopover 
            isOpen={isNotifOpen} 
            onClose={() => setIsNotifOpen(false)} 
          />
        </div>

        {/* Windows OS Frame Controls */}
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
