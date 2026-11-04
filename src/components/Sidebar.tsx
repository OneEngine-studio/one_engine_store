import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  ShoppingBag,
  Gamepad2,
  Download,
  Radio,
  Settings,
  Image as ImageIcon,
} from 'lucide-react';
import { NavigationTab, Game } from '../types/store';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    navigate,
    downloads,
    runningGameId,
    games,
    currentUser,
    openAuthModal,
  } = useStore();

  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const activeDownloadCount = downloads.filter((d) => d.status === 'DOWNLOADING').length;
  const ownedGames = games.filter((g) => currentUser.ownedGameIds.includes(g.id));

  const navItems = [
    { id: 'store' as NavigationTab, label: 'Store', icon: ShoppingBag },
    { id: 'library' as NavigationTab, label: 'Library', icon: Gamepad2 },
    {
      id: 'downloads' as NavigationTab,
      label: 'Downloads',
      icon: Download,
      badge: activeDownloadCount > 0 ? activeDownloadCount : undefined,
    },
    { id: 'community' as NavigationTab, label: 'Community', icon: Radio },
  ];

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <aside className="w-[76px] bg-bg-app flex flex-col items-center py-2 select-none shrink-0 z-30 justify-between h-full">
      {/* Brand logo at top */}
      <div className="flex flex-col items-center gap-3 w-full">
        <button
          onClick={() => navigate('store')}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/[0.06] transition-surface cursor-default mb-1"
          title="OneEngine Store"
        >
          <img
            src="./images/logo.png"
            alt="OneEngine"
            className="w-6 h-6 object-contain"
          />
        </button>

        {/* Primary nav rail */}
        <nav className="flex flex-col items-center gap-2 w-full px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (activeTab === 'game-detail' && item.id === 'store');

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`relative w-[60px] h-[52px] rounded-full flex flex-col items-center justify-center gap-1 transition-surface cursor-default group ${
                  isActive
                    ? 'bg-accent/15 text-accent border border-accent/35 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] border border-transparent'
                }`}
                title={item.label}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-accent' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                    strokeWidth={isActive ? 2 : 1.75}
                  />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-3.5 flex items-center justify-center text-[9px] font-bold rounded-full bg-accent text-bg-app tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] tracking-tight leading-none ${
                  isActive ? 'font-semibold text-accent' : 'font-medium text-slate-400 group-hover:text-slate-200'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Divider before library quick art icons */}
        <div className="w-8 h-px bg-white/[0.08] my-1" />

        {/* Quick library games 40px rounded art icons */}
        <div className="flex flex-col items-center gap-2.5 w-full py-1.5 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-380px)] no-scrollbar">
          {ownedGames.slice(0, 6).map((game: Game) => {
            const isPlaying = runningGameId === game.id;
            const isDownloading = downloads.some(
              (d) => d.gameId === game.id && d.status === 'DOWNLOADING'
            );
            const hasError = imageErrors[game.id];

            return (
              <div
                key={game.id}
                className="relative group"
                onMouseEnter={() => setHoveredGameId(game.id)}
                onMouseLeave={() => setHoveredGameId(null)}
              >
                <button
                  onClick={() => navigate('game-detail', game.id)}
                  className={`relative w-10 h-10 rounded-[12px] overflow-hidden border transition-surface cursor-default flex items-center justify-center bg-bg-card ${
                    isPlaying
                      ? 'border-success ring-2 ring-success/30'
                      : isDownloading
                      ? 'border-accent ring-2 ring-accent/30'
                      : 'border-white/10 hover:border-white/30 hover:scale-105'
                  }`}
                >
                  {!hasError ? (
                    <img
                      src={game.coverImage}
                      alt={game.title}
                      onError={() => handleImageError(game.id)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-bg-panel text-slate-400">
                      <ImageIcon className="w-4 h-4 opacity-60" strokeWidth={1.5} />
                    </div>
                  )}

                  {/* Status dot badge */}
                  {isPlaying && (
                    <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-success ring-1 ring-bg-app animate-pulse" />
                  )}
                  {isDownloading && !isPlaying && (
                    <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-accent ring-1 ring-bg-app" />
                  )}
                </button>

                {/* Floating tooltip */}
                {hoveredGameId === game.id && (
                  <div className="absolute left-[52px] top-1/2 -translate-y-1/2 z-50 bg-bg-card border border-white/15 rounded-md px-2.5 py-1 text-xs text-slate-100 shadow-popover whitespace-nowrap pointer-events-none animate-soft-enter flex items-center gap-1.5">
                    <span className="font-medium">{game.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {isPlaying ? '(Running)' : isDownloading ? '(Updating)' : '(Installed)'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom rail: Settings & avatar */}
      <div className="flex flex-col items-center gap-2 w-full px-2 pb-1">
        <button
          onClick={() => navigate('settings')}
          className={`w-[60px] h-[52px] rounded-full flex flex-col items-center justify-center gap-1 transition-surface cursor-default group ${
            activeTab === 'settings'
              ? 'bg-accent/15 text-accent border border-accent/35'
              : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] border border-transparent'
          }`}
          title="Settings"
        >
          <Settings
            className={`w-5 h-5 ${
              activeTab === 'settings' ? 'text-accent' : 'text-slate-400 group-hover:text-slate-200'
            }`}
            strokeWidth={activeTab === 'settings' ? 2 : 1.75}
          />
          <span className={`text-[10px] tracking-tight leading-none ${
            activeTab === 'settings' ? 'font-semibold text-accent' : 'font-medium text-slate-400 group-hover:text-slate-200'
          }`}>
            Settings
          </span>
        </button>

        {/* User avatar with presence dot */}
        <button
          onClick={openAuthModal}
          className="relative w-10 h-10 rounded-full p-0.5 border border-white/15 hover:border-accent/60 transition-surface cursor-default group"
          title={currentUser.id ? `Signed in as ${currentUser.callsign}` : 'Sign in to OneEngine Store'}
        >
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.callsign}
            className="w-full h-full rounded-full object-cover"
          />
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-bg-app ${
            currentUser.id ? 'bg-success' : 'bg-slate-500'
          }`} />
        </button>
      </div>
    </aside>
  );
};
