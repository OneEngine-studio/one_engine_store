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
import { NumberTicker } from './ui/NumberTicker';
import { Kbd } from './ui/Kbd';

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
      className="h-11 bg-transparent flex items-center justify-between px-3 select-none z-40 shrink-0 relative"
    >
      {/* Left: Brand Glyph & History Controls */}
      <div className="flex items-center space-x-3 pointer-events-none">
        <div className="flex items-center space-x-2">
          <img 
            src="/images/logo.png" 
            alt="OneEngine" 
            className="w-4 h-4 object-contain rounded"
          />
          <span className="text-xs font-semibold tracking-wide text-slate-200">
            One<span className="text-primary-accent">Engine</span>
          </span>
          <span className="text-[10px] text-slate-400 border border-white/5 px-1.5 py-0.2 rounded-full bg-white/[0.04]">
            v2.6
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
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
              canGoBack 
                ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer active:scale-95' 
                : 'text-slate-600 cursor-not-allowed opacity-40'
            }`}
            title="Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={goForward}
            disabled={!canGoForward}
            className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
              canGoForward 
                ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer active:scale-95' 
                : 'text-slate-600 cursor-not-allowed opacity-40'
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
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full px-4 py-1.5 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-all shadow-inner"
        >
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Search games, library, community...</span>
          </div>
          <Kbd className="bg-white/10 border-white/10 text-slate-300">Ctrl K</Kbd>
        </button>
      </div>

      {/* Right: Live Session Status, Wallet, Profile Chip, Notifications, OS Window Controls */}
      <div 
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center space-x-2 pointer-events-auto relative"
      >
        {/* Live Running Status Pill */}
        {runningGame && (
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-tactical-green/10 border border-tactical-green/30 text-tactical-green text-xs tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-tactical-green animate-pulse" />
            <span className="truncate max-w-[120px]">{runningGame.title}</span>
            <span className="text-slate-400">({formatTimer(sessionElapsedSeconds)})</span>
          </div>
        )}

        {/* User Wallet Pill */}
        <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-xs tabular-nums">
          <CreditCard className="w-3 h-3 text-slate-400" />
          <span className="text-slate-400 text-[11px]">Wallet:</span>
          <NumberTicker
            value={currentUser.walletBalance}
            decimalPlaces={2}
            prefix="$"
            className="text-slate-100 font-medium"
          />
        </div>

        {/* Profile Switcher Trigger */}
        <button 
          onClick={openAuthModal}
          className="flex items-center space-x-2 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-xs transition-colors active:scale-95"
          title="Switch Account"
        >
          <img 
            src={currentUser.avatarUrl} 
            alt={currentUser.callsign} 
            className="w-4 h-4 rounded-full border border-white/20" 
          />
          <span className="text-slate-200 font-medium hidden sm:inline">{currentUser.callsign}</span>
          <span className={`w-1.5 h-1.5 rounded-full ${currentUser.status === 'ONLINE' ? 'bg-tactical-green' : 'bg-primary-accent'}`} />
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-200 bg-white/5 hover:bg-white/10 rounded-full transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-accent ring-2 ring-[#0A0507]" />
            )}
          </button>
          
          <NotificationPopover 
            isOpen={isNotifOpen} 
            onClose={() => setIsNotifOpen(false)} 
          />
        </div>

        {/* Windows OS Frame Controls */}
        <div className="flex items-center pl-1 border-l border-white/10">
          <button
            onClick={minimizeWindow}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Minimize"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={toggleMaximizeWindow}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Maximize / Restore"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            onClick={closeWindow}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#E53935] rounded-md transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
