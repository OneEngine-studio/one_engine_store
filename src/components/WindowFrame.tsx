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
  CreditCard,
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
      className="h-10 bg-bg-sidebar border-b border-white/5 flex items-center justify-between px-3 select-none z-40 shrink-0"
    >
      {/* Left: brand + history controls */}
      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 pointer-events-none"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <img
            src="/images/logo.png"
            alt="OneEngine"
            className="w-4 h-4 object-contain"
          />
          <span className="text-xs font-semibold text-slate-200">
            One<span className="text-accent">Engine</span>
          </span>
          <span className="text-[10px] text-slate-500 border border-white/10 px-1.5 rounded-md bg-white/5 tabular-nums">
            v2.6
          </span>
        </div>

        {/* History nav */}
        <div
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          className="hidden sm:flex items-center gap-1 pointer-events-auto"
        >
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className={`w-6 h-6 flex items-center justify-center rounded-md transition-[background-color,color] duration-150 ${
              canGoBack
                ? 'text-slate-400 hover:text-white hover:bg-bg-hover cursor-default'
                : 'text-slate-600 cursor-not-allowed opacity-40'
            }`}
            title="Back"
          >
            <ChevronLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className={`w-6 h-6 flex items-center justify-center rounded-md transition-[background-color,color] duration-150 ${
              canGoForward
                ? 'text-slate-400 hover:text-white hover:bg-bg-hover cursor-default'
                : 'text-slate-600 cursor-not-allowed opacity-40'
            }`}
            title="Forward"
          >
            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Center: command palette trigger */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex-1 max-w-sm mx-4 pointer-events-auto"
      >
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full bg-bg-hover border border-white/10 rounded-md px-3 py-1.5 flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 hover:border-white/20 transition-[border-color,color] duration-150 cursor-default"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span className="truncate">Search games, library…</span>
          </div>
          <Kbd className="bg-white/10 border-white/10 text-slate-400">Ctrl K</Kbd>
        </button>
      </div>

      {/* Right: status + wallet + profile + notifications + window controls */}
      <div
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        className="flex items-center gap-2 pointer-events-auto relative"
      >
        {/* Running game pill */}
        {runningGame && (
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/10 border border-success/20 text-success text-xs tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="truncate max-w-[100px]">{runningGame.title}</span>
            <span className="text-slate-400">({formatTimer(sessionElapsedSeconds)})</span>
          </div>
        )}

        {/* Wallet */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-bg-hover border border-white/10 rounded-md text-xs tabular-nums">
          <CreditCard className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
          <span className="text-slate-400">
            <NumberTicker
              value={currentUser.walletBalance}
              decimalPlaces={2}
              prefix="$"
              className="text-slate-200 font-medium"
            />
          </span>
        </div>

        {/* Profile chip */}
        <button
          onClick={openAuthModal}
          className="flex items-center gap-2 px-2 py-1 bg-bg-hover hover:bg-bg-pressed border border-white/10 hover:border-white/20 rounded-md text-xs transition-[background-color,border-color] duration-150 cursor-default"
          title="Switch account"
        >
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.callsign}
            className="w-4 h-4 rounded-full border border-white/20 object-cover"
          />
          <span className="text-slate-200 font-medium hidden sm:inline">{currentUser.callsign}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-200 bg-bg-hover hover:bg-bg-pressed border border-white/10 rounded-md transition-[background-color,color] duration-150 cursor-default relative"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent ring-1 ring-bg-sidebar" />
            )}
          </button>

          <NotificationPopover
            isOpen={isNotifOpen}
            onClose={() => setIsNotifOpen(false)}
          />
        </div>

        {/* Window controls */}
        <div className="flex items-center pl-2 border-l border-white/10 gap-0.5">
          <button
            onClick={minimizeWindow}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-bg-hover rounded-md transition-[background-color,color] duration-150 cursor-default"
            title="Minimize"
          >
            <Minus className="w-3 h-3" strokeWidth={1.5} />
          </button>
          <button
            onClick={toggleMaximizeWindow}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-bg-hover rounded-md transition-[background-color,color] duration-150 cursor-default"
            title="Maximize"
          >
            <Square className="w-2.5 h-2.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={closeWindow}
            className="w-8 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-danger rounded-md transition-[background-color,color] duration-150 cursor-default"
            title="Close"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
};
