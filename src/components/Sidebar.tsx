import React from 'react';
import { useStore } from '../store/useStore';
import {
  ShoppingBag,
  Gamepad2,
  Download,
  Radio,
  Settings,
  Plus,
  Play,
} from 'lucide-react';
import { NavigationTab } from '../types/store';
import { NumberTicker } from './ui/NumberTicker';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    navigate,
    downloads,
    runningGameId,
    games,
    currentUser,
    launchGame,
  } = useStore();

  const activeDownload = downloads.find((d) => d.status === 'DOWNLOADING');
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
    { id: 'settings' as NavigationTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 bg-bg-sidebar border border-white/5 border-t-white/10 rounded-md flex flex-col justify-between select-none shrink-0 z-30 overflow-hidden">
      {/* Brand */}
      <div className="flex flex-col">
        <div className="px-4 py-3 flex items-center gap-3 border-b border-white/5">
          <img
            src="/images/logo.png"
            alt="OneEngine"
            className="w-5 h-5 object-contain shrink-0"
          />
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold tracking-tight text-white leading-none">
              One<span className="text-accent">Engine</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 leading-none">
              Desktop client
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col p-2 gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeTab === item.id ||
              (activeTab === 'game-detail' && item.id === 'store');

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`nav-item-active-wrapper relative w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-[background-color,color] duration-150 ease-out ${
                  isActive
                    ? 'nav-item-active bg-accent/10 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-bg-hover'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-slate-400'}`}
                    strokeWidth={1.5}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-accent text-bg-app tabular-nums leading-none">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Library section + footer */}
      <div className="flex-1 flex flex-col min-h-0 border-t border-white/5 overflow-hidden">
        {/* Section label */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <span className="text-[11px] font-semibold tracking-[0.06em] uppercase text-slate-500">
            Library
          </span>
          <button
            onClick={() => navigate('store')}
            className="text-slate-500 hover:text-white transition-colors p-0.5 rounded-md hover:bg-bg-hover"
            title="Browse store"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Owned games list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
          {ownedGames.slice(0, 6).map((game) => {
            const isPlayingThis = runningGameId === game.id;

            return (
              <div
                key={game.id}
                onClick={() => navigate('game-detail', game.id)}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-default transition-[background-color] duration-150 ${
                  isPlayingThis
                    ? 'bg-success/10 border border-success/20'
                    : 'hover:bg-bg-hover border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={game.coverImage}
                    alt={game.title}
                    className="w-7 h-7 rounded-md object-cover shrink-0"
                  />
                  <div className="flex flex-col min-w-0 text-left">
                    <span className="text-xs text-slate-300 group-hover:text-white font-medium truncate leading-none">
                      {game.title}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate mt-0.5 leading-none">
                      {isPlayingThis ? 'Running' : game.genre || 'Installed'}
                    </span>
                  </div>
                </div>

                {isPlayingThis ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0 mr-1" />
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      launchGame(game.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-accent rounded-md hover:bg-white/10 transition-[opacity,background-color] duration-150"
                    title="Launch"
                  >
                    <Play className="w-3 h-3 fill-current" strokeWidth={1.5} />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom: active download chip + user footer */}
        <div className="border-t border-white/5 p-2 space-y-2">
          {activeDownload && (
            <div
              onClick={() => navigate('downloads')}
              className="bg-bg-hover border border-white/10 rounded-md px-3 py-2 space-y-1.5 cursor-default transition-[background-color] duration-150 hover:bg-bg-pressed"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  <Download className="w-3 h-3 text-accent" strokeWidth={1.5} /> Downloading
                </span>
                <span className="text-slate-400 tabular-nums">
                  <NumberTicker value={activeDownload.speedMbps} decimalPlaces={1} suffix=" MB/s" />
                </span>
              </div>

              <div className="text-[11px] text-slate-400 truncate">
                {activeDownload.title}
              </div>

              <div className="w-full h-1 bg-bg-app rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-[width] duration-300"
                  style={{ width: `${activeDownload.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* User chip */}
          <div className="flex items-center gap-2 px-1">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.callsign}
                className="w-6 h-6 rounded-full border border-white/20 object-cover"
              />
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-success ring-1 ring-bg-sidebar" />
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs text-slate-200 font-medium truncate leading-none">
                {currentUser.callsign}
              </span>
              <span className="text-[10px] text-slate-500 truncate mt-0.5 leading-none">
                Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
