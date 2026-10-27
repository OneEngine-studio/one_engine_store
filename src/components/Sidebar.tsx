import React from 'react';
import { useStore } from '../store/useStore';
import { 
  ShoppingBag, 
  Gamepad2, 
  Download, 
  Radio, 
  Settings, 
  Activity,
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
    { id: 'store', label: 'STOREFRONT', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'library', label: 'TACTICAL LIBRARY', icon: <Gamepad2 className="w-4 h-4" /> },
    { 
      id: 'downloads', 
      label: 'DOWNLOADS', 
      icon: <Download className="w-4 h-4" />,
      badge: activeDownloadCount > 0 ? activeDownloadCount : undefined
    },
    { id: 'community', label: 'COMMUNITY // DISPATCH', icon: <Radio className="w-4 h-4" /> },
    { id: 'settings', label: 'CLIENT SETTINGS', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-gunmetal-slate border-r border-border-stroke flex flex-col justify-between select-none shrink-0 z-30">
      {/* Top Section: Brand Identity & Nav Rail */}
      <div className="flex flex-col">
        {/* Brand Emblem */}
        <div className="p-4 border-b border-border-stroke/70 flex items-center space-x-3">
          <img
            src="/images/logo.png"
            alt="OneEngine Studio"
            className="w-8 h-8 rounded object-contain border border-primary-accent/60 bg-void-black p-0.5 shadow-ember-glow"
          />
          <div className="flex flex-col text-left">
            <span className="font-mono text-sm font-extrabold tracking-widest text-slate-100 uppercase">
              ONE<span className="text-primary-accent">ENGINE</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 tracking-wider">
              TACTICAL DISTRIBUTION
            </span>
          </div>
        </div>

        {/* In-Game Active Pill if playing */}
        {runningGame && (
          <div 
            onClick={() => navigate('library')}
            className="mx-3 mt-3 p-2.5 bg-tactical-green/10 border border-tactical-green/40 hover:border-tactical-green rounded flex items-center space-x-2 cursor-pointer transition-colors"
          >
            <Activity className="w-3.5 h-3.5 text-tactical-green shrink-0 animate-spin" />
            <div className="flex flex-col overflow-hidden text-left flex-1">
              <span className="text-[9px] font-mono text-tactical-green font-bold uppercase tracking-wider">
                EXECUTING // CLICK TO INSPECT
              </span>
              <span className="text-xs font-mono text-slate-100 truncate">
                {runningGame.title}
              </span>
            </div>
          </div>
        )}

        {/* Primary Tabs */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded text-xs font-mono tracking-wider transition-all duration-150 ${
                  isActive
                    ? 'bg-tech-surface text-primary-accent border-l-2 border-primary-accent shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-tech-surface/50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={isActive ? 'text-primary-accent' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-primary-accent text-gunmetal-slate font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Persistent Active Download Mini-Monitor */}
      <div className="p-3 border-t border-border-stroke bg-tech-surface/30">
        {activeDownload ? (
          <div
            onClick={() => navigate('downloads')}
            className="bg-tech-surface hover:bg-tech-elevated border border-primary-accent/50 hover:border-primary-accent rounded-lg p-3 space-y-2 cursor-pointer transition-all shadow-sm group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-primary-accent uppercase tracking-wider flex items-center gap-1.5">
                <Download className="w-3 h-3 animate-bounce" /> ACTIVE DOWNLOAD
              </span>
              <span className="text-[10px] font-mono text-secondary-tech font-bold">
                {activeDownload.speedMbps.toFixed(1)} MB/s
              </span>
            </div>

            <div className="text-xs font-mono font-bold text-slate-100 truncate">
              {activeDownload.title}
            </div>

            {/* Mini Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-1.5 bg-void-black rounded-full overflow-hidden border border-border-stroke">
                <div
                  className="h-full bg-gradient-to-r from-primary-accent to-secondary-tech transition-all duration-300"
                  style={{ width: `${activeDownload.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>{activeDownload.progress}%</span>
                <span className="flex items-center gap-0.5 text-primary-accent group-hover:underline">
                  <span>QUEUE</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => navigate('downloads')}
            className="bg-tech-surface border border-border-stroke rounded-lg p-3 text-left space-y-1 cursor-pointer hover:border-slate-500 transition-colors"
          >
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-secondary-tech" /> STORAGE ALLOCATION
              </span>
              <span className="text-tactical-green">IDLE</span>
            </div>
            <span className="text-xs font-mono font-bold text-slate-300 block">
              100% SYNCHRONIZED
            </span>
            <span className="text-[10px] font-sans text-slate-500 block">
              Click to view transfer logs & throttle controls
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
