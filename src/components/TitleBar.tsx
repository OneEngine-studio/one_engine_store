import React from 'react';
import { UserSession } from '../types/launcher';
import { Shield, User, LogOut, Minus, Square, X, Wifi } from 'lucide-react';
import { useStore } from '../store/useStore';

interface TitleBarProps {
  user: UserSession | null;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ user, onOpenAuth, onLogout }) => {
  const { navigate, activeTab } = useStore();
  const handleMinimize = async () => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    }
  };

  const handleMaximize = async () => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    }
  };

  const handleClose = async () => {
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    }
  };

  return (
    <header 
      data-tauri-drag-region 
      className="h-10 bg-bg-sidebar border-b border-white/5 flex items-center justify-between px-3 select-none z-50"
    >
      {/* Brand Identity */}
      <div className="flex items-center gap-2 pointer-events-none">
        <img
          src="/images/logo.png"
          alt="OneEngine"
          className="w-4 h-4 object-contain"
        />
        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-xs text-slate-100">One<span className="text-accent">Engine</span></span>
          <span className="text-[10px] text-slate-400">v2.6</span>
        </div>
      </div>

      {/* Center Nav / Status */}
      <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
        <span
          onClick={() => navigate('store')}
          className={`flex items-center gap-1.5 cursor-default transition-colors ${activeTab === 'store' ? 'text-accent font-medium' : 'hover:text-slate-200'}`}
        >
          Store
        </span>
        <span
          onClick={() => navigate('library')}
          className={`cursor-default transition-colors ${activeTab === 'library' ? 'text-accent font-medium' : 'hover:text-slate-200'}`}
        >
          Library
        </span>
        <span
          onClick={() => navigate('community')}
          className={`cursor-default transition-colors ${activeTab === 'community' ? 'text-accent font-medium' : 'hover:text-slate-200'}`}
        >
          Community
        </span>
        <span
          onClick={() => navigate('settings')}
          className={`cursor-default transition-colors ${activeTab === 'settings' ? 'text-accent font-medium' : 'hover:text-slate-200'}`}
        >
          Settings
        </span>
      </div>

      {/* User Callsign Bar & Window Controls */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-2 bg-bg-card border border-white/10 rounded-md px-2.5 py-1">
            <div className="relative">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover border border-white/20" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-bg-app border border-white/20 flex items-center justify-center text-slate-300">
                  <User className="w-3 h-3" />
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-success ring-1 ring-bg-sidebar" />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-medium text-slate-200 leading-none">
                {user.callsign}
              </span>
              <span className="text-[9px] text-slate-400 leading-none mt-0.5 flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5 text-success" /> Online
              </span>
            </div>

            <button 
              onClick={onLogout}
              title="Sign out"
              className="text-slate-400 hover:text-white p-1 transition-colors ml-1 cursor-default"
            >
              <LogOut className="w-3 h-3" strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 hover:border-accent/50 px-2.5 py-1 rounded-md text-xs transition-[background-color] duration-150 cursor-default"
          >
            <Shield className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>Sign in</span>
          </button>
        )}

        {/* Window controls */}
        <div className="flex items-center gap-0.5 pl-2 border-l border-white/10">
          <button 
            onClick={handleMinimize}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-bg-hover rounded-md transition-colors cursor-default"
          >
            <Minus className="w-3 h-3" strokeWidth={1.5} />
          </button>
          <button 
            onClick={handleMaximize}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-bg-hover rounded-md transition-colors cursor-default"
          >
            <Square className="w-2.5 h-2.5" strokeWidth={1.5} />
          </button>
          <button 
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-danger hover:bg-danger/10 rounded-md transition-colors cursor-default"
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
};
