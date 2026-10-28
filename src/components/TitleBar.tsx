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
      className="h-12 bg-gunmetal-950 border-b border-gunmetal-700 flex items-center justify-between px-4 select-none z-50"
    >
      {/* Brand Identity */}
      <div className="flex items-center space-x-3 pointer-events-none">
        <div className="w-6 h-6 rounded bg-ember-500/10 border border-ember-500 flex items-center justify-center">
          <div className="w-2.5 h-2.5 bg-ember-500 rotate-45 transform" />
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="font-bold tracking-wider text-sm text-slate-100 font-mono">ONE<span className="text-ember-500">ENGINE</span></span>
          <span className="text-[10px] text-gunmetal-500 font-mono">CLIENT // v2.4</span>
        </div>
      </div>

      {/* Center Nav / Status */}
      <div className="hidden md:flex items-center space-x-6 text-xs font-mono tracking-widest text-slate-400">
        <span
          onClick={() => navigate('store')}
          className={`flex items-center gap-1.5 cursor-pointer transition-colors ${activeTab === 'store' ? 'text-ember-500' : 'hover:text-slate-200'}`}
        >
          {activeTab === 'store' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-ember-500 animate-pulse" />}
          STOREFRONT
        </span>
        <span
          onClick={() => navigate('library')}
          className={`cursor-pointer transition-colors ${activeTab === 'library' ? 'text-ember-500' : 'hover:text-slate-200'}`}
        >
          LIBRARY
        </span>
        <span
          onClick={() => navigate('community')}
          className={`cursor-pointer transition-colors ${activeTab === 'community' ? 'text-ember-500' : 'hover:text-slate-200'}`}
        >
          COMMUNITY
        </span>
        <span
          onClick={() => navigate('settings')}
          className={`cursor-pointer transition-colors ${activeTab === 'settings' ? 'text-ember-500' : 'hover:text-slate-200'}`}
        >
          SETTINGS
        </span>
      </div>

      {/* User Callsign Bar & Window Controls */}
      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-3 bg-gunmetal-800/80 border border-gunmetal-600 rounded px-3 py-1">
            <div className="relative">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-6 h-6 rounded object-cover border border-ember-500/50" />
              ) : (
                <div className="w-6 h-6 rounded bg-gunmetal-700 border border-ember-500/40 flex items-center justify-center text-ember-400">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-tactical-green border border-gunmetal-900" />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-200 font-mono tracking-tight leading-none">
                {user.callsign}
              </span>
              <span className="text-[9px] text-gunmetal-500 font-mono leading-none mt-0.5 flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5 text-tactical-green" /> AUTHENTICATED
              </span>
            </div>

            <button 
              onClick={onLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-ember-500 p-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-2 bg-ember-500/10 hover:bg-ember-500/20 text-ember-400 border border-ember-500/40 hover:border-ember-500 px-3 py-1 rounded text-xs font-mono transition-all"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>OPERATOR LOGIN</span>
          </button>
        )}

        {/* Window controls */}
        <div className="flex items-center space-x-1 pl-2 border-l border-gunmetal-700">
          <button 
            onClick={handleMinimize}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-gunmetal-800 rounded transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button 
            onClick={handleMaximize}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-gunmetal-800 rounded transition-colors"
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button 
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
