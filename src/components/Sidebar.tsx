import React from 'react';
import { useStore } from '../store/useStore';
import { 
  ShoppingBag, 
  Gamepad2, 
  Download, 
  Radio, 
  Settings, 
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { NavigationTab } from '../types/store';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    navigate, 
    downloads, 
    runningGameId, 
    games 
  } = useStore();

  const activeDownload = downloads.find((d) => d.status === 'DOWNLOADING');
  const activeDownloadCount = downloads.filter((d) => d.status === 'DOWNLOADING').length;
  const runningGame = games.find((g) => g.id === runningGameId);

  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ReactNode; badge?: string | number }> = [
    { id: 'store', label: 'Storefront', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'library', label: 'Library', icon: <Gamepad2 className="w-4 h-4" /> },
    { 
      id: 'downloads', 
      label: 'Downloads', 
      icon: <Download className="w-4 h-4" />,
      badge: activeDownloadCount > 0 ? activeDownloadCount : undefined
    },
    { id: 'community', label: 'Community', icon: <Radio className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-60 bg-gunmetal-slate border-r border-border-stroke flex flex-col justify-between select-none shrink-0 z-30">
      {/* Top Section: Brand Identity & Nav Rail */}
      <div className="flex flex-col">
        {/* Brand Emblem */}
        <div className="p-4 border-b border-border-stroke flex items-center space-x-3">
          <img
            src="/images/logo.png"
            alt="OneEngine Studio"
            className="w-7 h-7 rounded-md object-contain border border-white/10 bg-void-black p-0.5"
          />
          <div className="flex flex-col text-left">
            <span className="text-sm font-semibold tracking-wide text-slate-100">
              One<span className="text-primary-accent">Engine</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Desktop Client
            </span>
          </div>
        </div>

        {/* In-Game Active Pill if playing */}
        {runningGame && (
          <div 
            onClick={() => navigate('library')}
            className="mx-3 mt-3 p-2.5 bg-tactical-green/10 border border-tactical-green/30 hover:border-tactical-green/50 rounded-md flex items-center space-x-2.5 cursor-pointer transition-colors"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tactical-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tactical-green"></span>
            </span>
            <div className="flex flex-col overflow-hidden text-left flex-1">
              <span className="text-[11px] text-tactical-green font-medium">
                Now Playing
              </span>
              <span className="text-xs text-slate-200 truncate">
                {runningGame.title}
              </span>
            </div>
          </div>
        )}

        {/* Primary Tabs */}
        <nav className="p-3 space-y-1 mt-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-tech-surface text-slate-100 border-l-2 border-primary-accent font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-tech-surface/40 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={isActive ? 'text-primary-accent' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full text-[11px] tabular-nums bg-primary-accent text-void-black font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Persistent Active Download Mini-Monitor */}
      <div className="p-3 border-t border-border-stroke bg-void-black/20">
        {activeDownload ? (
          <div
            onClick={() => navigate('downloads')}
            className="bg-tech-surface hover:bg-tech-elevated border border-border-stroke hover:border-slate-500 rounded-md p-3 space-y-2 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-primary-accent" /> Active Download
              </span>
              <span className="text-xs text-secondary-tech tabular-nums font-mono">
                {activeDownload.speedMbps.toFixed(1)} MB/s
              </span>
            </div>

            <div className="text-xs text-slate-300 truncate">
              {activeDownload.title}
            </div>

            {/* Mini Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-1 bg-void-black rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-primary-accent transition-all duration-300"
                  style={{ width: `${activeDownload.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 tabular-nums">
                <span>{activeDownload.progress}%</span>
                <span className="flex items-center gap-1 text-slate-300 group-hover:text-primary-accent transition-colors">
                  <span>View</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => navigate('downloads')}
            className="bg-tech-surface border border-border-stroke rounded-md p-3 text-left space-y-1 cursor-pointer hover:bg-tech-elevated transition-colors"
          >
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3 h-3 text-slate-400" /> Storage
              </span>
              <span className="text-tactical-green font-medium">Idle</span>
            </div>
            <span className="text-xs font-medium text-slate-200 block">
              All games up to date
            </span>
            <span className="text-[11px] text-slate-400 block">
              Manage library transfers & speeds
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
