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
} from 'lucide-react';
import { NotificationPopover } from './NotificationPopover';
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
    closeWindow,
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
      className="h-12 bg-bg-app flex items-center justify-between px-3 select-none z-40 shrink-0"
    >
      {/* Left: history nav */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center gap-1.5 pl-1"
      >
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-surface ${
            canGoBack
              ? 'text-slate-300 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] cursor-default'
              : 'text-slate-600 cursor-not-allowed opacity-35'
          }`}
          title="Back (Alt+Left or Esc)"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.75} />
        </button>
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-surface ${
            canGoForward
              ? 'text-slate-300 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] cursor-default'
              : 'text-slate-600 cursor-not-allowed opacity-35'
          }`}
          title="Forward (Alt+Right)"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Center: pill search bar */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex-1 max-w-md mx-4 pointer-events-auto"
      >
        <button
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Search games (Ctrl+K or /)"
          title="Search games (Ctrl+K or /)"
          className="w-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] hover:border-white/[0.18] rounded-full px-4 py-1.5 flex items-center justify-between text-xs text-slate-300 hover:text-white transition-surface cursor-default shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
            <span className="truncate text-slate-400">Search games…</span>
          </div>
          <Kbd className="bg-white/[0.06] border-white/10 text-slate-300 rounded-full px-2 py-0.5 text-xs">
            Ctrl K
          </Kbd>
        </button>
      </div>

      {/* Right: status + profile + notifications + window controls */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center gap-2 pointer-events-auto relative"
      >
        {/* Running game status indicator */}
        {runningGame && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 border border-success/25 text-success text-xs tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="truncate max-w-[120px] font-medium">{runningGame.title}</span>
            <span className="text-slate-400 text-xs">({formatTimer(sessionElapsedSeconds)})</span>
          </div>
        )}

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] rounded-full transition-surface cursor-default relative"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" strokeWidth={1.75} />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent ring-2 ring-bg-app shadow-[0_0_8px_rgba(255,255,255,0.45)]" />
            )}
          </button>

          <NotificationPopover
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
          />
        </div>

        {/* Profile chip or Sign in button */}
        {currentUser.id ? (
          <button
            onClick={openAuthModal}
            className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.09] hover:border-white/[0.18] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] rounded-full text-xs transition-surface cursor-default"
            title="Account"
          >
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.callsign}
                className="w-5 h-5 rounded-full border border-white/20 object-cover"
              />
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-success ring-1 ring-bg-app" />
            </div>
            <span className="text-slate-200 font-medium hidden sm:inline">{currentUser.callsign}</span>
          </button>
        ) : (
          <button
            onClick={openAuthModal}
            className="px-3.5 py-1 bg-accent hover:bg-accent-hover text-white rounded-full text-xs font-semibold shadow-sm transition-surface cursor-default"
            title="Sign in to OneEngine Store"
          >
            Sign in
          </button>
        )}

        {/* Window controls */}
        <div className="flex items-center pl-2 ml-1 border-l border-white/[0.08] gap-1">
          <button
            onClick={minimizeWindow}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-full transition-surface cursor-default"
            title="Minimize"
          >
            <Minus className="w-3 h-3" strokeWidth={1.75} />
          </button>
          <button
            onClick={toggleMaximizeWindow}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-full transition-surface cursor-default"
            title="Maximize"
          >
            <Square className="w-2.5 h-2.5" strokeWidth={1.75} />
          </button>
          <button
            onClick={closeWindow}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-danger rounded-full transition-surface cursor-default"
            title="Close"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </header>
  );
};
