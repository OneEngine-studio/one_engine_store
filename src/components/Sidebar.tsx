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
  ArrowRight
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
    launchGame
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
      badge: activeDownloadCount > 0 ? activeDownloadCount : undefined
    },
    { id: 'community' as NavigationTab, label: 'Community', icon: Radio },
    { id: 'settings' as NavigationTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-56 lg:w-60 bg-[#0D111A]/80 backdrop-blur-xl border border-white/5 border-t-white/10 rounded-2xl shadow-2xl flex flex-col justify-between select-none shrink-0 z-30 p-3 overflow-hidden">
      {/* Top Section: Brand & Minimalist Rounded Navigation Rail */}
      <div className="flex flex-col space-y-4">
        {/* Brand Emblem */}
        <div className="px-2 py-1.5 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-accent/20 to-tech-elevated border border-white/10 p-1 flex items-center justify-center shadow-inner">
            <img
              src="/images/logo.png"
              alt="OneEngine"
              className="w-5 h-5 object-contain"
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold tracking-tight text-white">
              One<span className="text-primary-accent">Engine</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              Desktop Studio
            </span>
          </div>
        </div>

        {/* Minimalist Rounded Pill Navigation Rail */}
        <nav className="flex flex-col space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || (activeTab === 'game-detail' && item.id === 'store');

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 ${
                  isActive
                    ? 'bg-white/10 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 font-normal'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary-accent' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary-accent text-void-black tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Middle/Bottom: Pinned Library & Download Status */}
      <div className="flex-1 flex flex-col min-h-0 pt-4 mt-3 border-t border-white/5 justify-between">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between px-2 mb-2 text-slate-400">
            <span className="text-[11px] font-medium tracking-wide uppercase">
              Library
            </span>
            <button 
              onClick={() => navigate('store')}
              className="text-slate-500 hover:text-white transition-colors p-0.5 rounded-md hover:bg-white/5"
              title="Browse Store"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Pinned / Owned Games List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {ownedGames.slice(0, 5).map((game) => {
              const isPlayingThis = runningGameId === game.id;

              return (
                <div
                  key={game.id}
                  onClick={() => navigate('game-detail', game.id)}
                  className={`group flex items-center justify-between p-1.5 rounded-xl cursor-pointer transition-all ${
                    isPlayingThis 
                      ? 'bg-tactical-green/10 border border-tactical-green/30' 
                      : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img
                      src={game.coverImage}
                      alt={game.title}
                      className="w-8 h-8 rounded-lg object-cover shrink-0 shadow-sm"
                    />
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-xs text-slate-200 group-hover:text-white font-medium truncate">
                        {game.title}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {isPlayingThis ? 'Running' : game.genre || 'Installed'}
                      </span>
                    </div>
                  </div>

                  {isPlayingThis ? (
                    <span className="w-2 h-2 rounded-full bg-tactical-green animate-pulse mr-1" />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        launchGame(game.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-primary-accent rounded-md hover:bg-white/10 transition-all"
                      title="Launch"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Active Download Mini Card or User Footer */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          {activeDownload && (
            <div
              onClick={() => navigate('downloads')}
              className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl p-2.5 space-y-1.5 cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-200 flex items-center gap-1.5">
                  <Download className="w-3 h-3 text-primary-accent" /> Downloading
                </span>
                <span className="text-secondary-tech tabular-nums font-mono">
                  <NumberTicker value={activeDownload.speedMbps} decimalPlaces={1} suffix=" MB/s" />
                </span>
              </div>

              <div className="text-[11px] text-slate-300 truncate">
                {activeDownload.title}
              </div>

              <div className="space-y-1">
                <div className="w-full h-1 bg-void-black/80 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="h-full bg-primary-accent transition-all duration-300"
                    style={{ width: `${activeDownload.progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
                  <span>
                    <NumberTicker value={activeDownload.progress} suffix="%" />
                  </span>
                  <span className="flex items-center gap-1 text-slate-300 group-hover:text-primary-accent transition-colors">
                    <span>Queue</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* User Status Footer Chip */}
          <div className="flex items-center space-x-2 px-1">
            <div className="relative">
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.callsign} 
                className="w-6 h-6 rounded-full border border-white/20"
              />
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-tactical-green ring-1 ring-[#0D111A]" />
            </div>
            <div className="flex flex-col text-left overflow-hidden">
              <span className="text-xs text-slate-200 font-medium truncate">
                {currentUser.callsign}
              </span>
              <span className="text-[9px] text-slate-500 font-mono uppercase">
                {currentUser.rank}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
