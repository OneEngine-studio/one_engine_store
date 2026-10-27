import React from 'react';
import { useStore } from '../store/useStore';
import { 
  ShoppingBag, 
  Gamepad2, 
  Download, 
  Radio, 
  Settings, 
  Shield, 
  Activity,
  CreditCard
} from 'lucide-react';
import { NavigationTab } from '../types/store';

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    navigate, 
    downloads, 
    currentUser, 
    openAuthModal,
    runningGameId,
    games 
  } = useStore();

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
    <aside className="w-64 bg-gunmetal-slate border-r border-border-stroke flex flex-col justify-between select-none shrink-0 z-40">
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

        {/* In-Game Active Banner if playing */}
        {runningGame && (
          <div className="mx-3 mt-3 p-2.5 bg-tactical-green/10 border border-tactical-green/40 rounded flex items-center space-x-2 animate-pulse-subtle">
            <Activity className="w-3.5 h-3.5 text-tactical-green shrink-0 animate-spin" />
            <div className="flex flex-col overflow-hidden text-left">
              <span className="text-[10px] font-mono text-tactical-green font-bold uppercase tracking-wider">
                CURRENTLY EXECUTING
              </span>
              <span className="text-xs font-mono text-slate-200 truncate">
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

      {/* Bottom Profile Summary Card */}
      <div className="p-3 border-t border-border-stroke bg-tech-surface/30">
        <div className="bg-tech-surface border border-border-stroke rounded p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="relative">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.callsign}
                  className="w-8 h-8 rounded border border-primary-accent/70 object-cover"
                />
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-tech-surface ${
                  currentUser.status === 'ONLINE' ? 'bg-tactical-green' : 'bg-primary-accent'
                }`} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-mono font-bold text-slate-100 flex items-center gap-1">
                  {currentUser.callsign}
                  <Shield className="w-3 h-3 text-secondary-tech" />
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  LVL {currentUser.level} // {currentUser.rank}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('settings')}
              className="text-slate-400 hover:text-primary-accent p-1 transition-colors"
              title="Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-2 border-t border-border-stroke/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-primary-accent" /> WALLET
            </span>
            <span className="text-slate-200 font-bold">
              ${currentUser.walletBalance.toFixed(2)}
            </span>
          </div>

          <button
            onClick={openAuthModal}
            className="w-full py-1 text-center bg-tech-elevated hover:bg-border-stroke border border-border-stroke rounded text-[10px] font-mono text-slate-300 hover:text-white transition-colors"
          >
            SWITCH OPERATIVE PRESET
          </button>
        </div>
      </div>
    </aside>
  );
};
