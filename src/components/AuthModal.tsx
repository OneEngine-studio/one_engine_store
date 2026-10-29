import React from 'react';
import { useStore } from '../store/useStore';
import { Shield, X, UserCheck, Terminal, Award, Zap } from 'lucide-react';
import { Kbd } from './ui/Kbd';
import { NumberTicker } from './ui/NumberTicker';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, switchUserPreset, currentUser, settings } = useStore();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-lg bg-bg-sidebar border border-white/10 border-t-white/15 rounded-[10px] shadow-overlay p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-accent/10 border border-accent/30 rounded-md flex items-center justify-center">
              <Shield className="w-4 h-4 text-accent" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Switch account
              </h2>
              <span className="text-xs text-slate-400 tabular-nums">
                Active: {currentUser.callsign} · <NumberTicker value={currentUser.walletBalance} decimalPlaces={2} prefix="$" />
              </span>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-bg-hover transition-[background-color,color] duration-150 flex items-center gap-1.5 cursor-default"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
            <Kbd className="text-[10px]">ESC</Kbd>
          </button>
        </div>

        <p className="text-xs text-slate-400 my-4 leading-relaxed">
          Switch between accounts to test library ownership, wallet balances, and store states.
        </p>

        {/* Presets */}
        <div className="space-y-2">
          {/* Developer */}
          <button
            onClick={() => switchUserPreset('DEVELOPER')}
            className={`w-full p-3 rounded-md border text-left flex items-start gap-3 transition-[background-color,border-color] duration-150 active:scale-[0.98] cursor-default ${
              currentUser.callsign === 'Spectre_07'
                ? 'bg-bg-pressed border-accent/60'
                : 'bg-bg-card border-white/10 hover:border-white/20 hover:bg-bg-hover'
            }`}
          >
            <div className="w-8 h-8 rounded-md bg-bg-app border border-white/10 flex items-center justify-center text-accent shrink-0">
              <Terminal className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-100">Developer — Spectre_07</span>
                <span className="text-[11px] text-slate-300 border border-white/10 bg-bg-hover px-1.5 py-0.5 rounded-md tabular-nums shrink-0">
                  $149.50
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Full 4-game library, developer tools, $149.50 wallet credit.
              </p>
            </div>
          </button>

          {/* Competitive */}
          <button
            onClick={() => switchUserPreset('COMPETITIVE')}
            className={`w-full p-3 rounded-md border text-left flex items-start gap-3 transition-[background-color,border-color] duration-150 active:scale-[0.98] cursor-default ${
              currentUser.callsign === 'Valkyrie_9'
                ? 'bg-bg-pressed border-white/30'
                : 'bg-bg-card border-white/10 hover:border-white/20 hover:bg-bg-hover'
            }`}
          >
            <div className="w-8 h-8 rounded-md bg-bg-app border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
              <Award className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-100">Competitive — Valkyrie_9</span>
                <span className="text-[11px] text-slate-300 border border-white/10 bg-bg-hover px-1.5 py-0.5 rounded-md tabular-nums shrink-0">
                  $42.00
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                2 tactical titles owned, rank 42, $42.00 wallet credit.
              </p>
            </div>
          </button>

          {/* Guest */}
          <button
            onClick={() => switchUserPreset('GUEST')}
            className={`w-full p-3 rounded-md border text-left flex items-start gap-3 transition-[background-color,border-color] duration-150 active:scale-[0.98] cursor-default ${
              currentUser.callsign === 'Ghost_Operative'
                ? 'bg-bg-pressed border-white/30'
                : 'bg-bg-card border-white/10 hover:border-white/20 hover:bg-bg-hover'
            }`}
          >
            <div className="w-8 h-8 rounded-md bg-bg-app border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
              <UserCheck className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-100">Guest — Ghost_Operative</span>
                <span className="text-[11px] text-slate-400 border border-white/10 bg-bg-hover px-1.5 py-0.5 rounded-md tabular-nums shrink-0">
                  $0.00
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Clean state with zero owned titles. Tests store purchases and empty library.
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <div>
            {settings.devTelemetryMode && (
              <span className="flex items-center gap-1.5 text-success">
                <Zap className="w-3.5 h-3.5" strokeWidth={1.5} /> Dev mode active
              </span>
            )}
          </div>
          <button
            onClick={closeAuthModal}
            className="px-3 py-1.5 bg-bg-hover hover:bg-bg-pressed text-slate-200 border border-white/10 rounded-md text-xs transition-[background-color] duration-150 active:scale-[0.98] cursor-default"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
