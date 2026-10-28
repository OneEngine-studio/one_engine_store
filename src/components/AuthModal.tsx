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
      <div className="w-full max-w-lg bg-gunmetal-slate border border-border-stroke border-t border-white/15 rounded-md shadow-2xl p-6 relative transition-all duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-stroke">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 bg-primary-accent/10 border border-primary-accent/40 rounded-md flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Switch Account
              </h2>
              <span className="text-xs text-slate-400 tabular-nums">
                Active: {currentUser.callsign} • <NumberTicker value={currentUser.walletBalance} decimalPlaces={2} prefix="$" />
              </span>
            </div>
          </div>
          <button 
            onClick={closeAuthModal} 
            className="text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-tech-surface transition-colors active:scale-[0.98] flex items-center gap-1.5"
            title="Close (ESC)"
          >
            <X className="w-4 h-4" />
            <Kbd className="text-[10px]">ESC</Kbd>
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 my-4 leading-relaxed">
          Switch between operator accounts to test individual library ownership, wallet balances, and store states.
        </p>

        {/* Quick Presets */}
        <div className="space-y-3">
          {/* Preset 1: Developer */}
          <button
            onClick={() => switchUserPreset('DEVELOPER')}
            className={`w-full p-3.5 rounded-md border text-left flex items-start space-x-3.5 transition-all active:scale-[0.98] ${
              currentUser.callsign === 'Spectre_07'
                ? 'bg-tech-elevated border-primary-accent'
                : 'bg-tech-surface border-border-stroke hover:border-slate-500 hover:bg-tech-elevated'
            }`}
          >
            <div className="w-8 h-8 rounded-md bg-void-black border border-white/10 flex items-center justify-center text-primary-accent shrink-0">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-100">
                  Developer [Spectre_07]
                </span>
                <span className="text-[11px] font-mono bg-tech-surface text-primary-accent border border-primary-accent/40 px-1.5 py-0.5 rounded-md tabular-nums">
                  $149.50
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Full 4-game library unlocked, developer tools enabled, and $149.50 store wallet credit.
              </p>
            </div>
          </button>

          {/* Preset 2: Competitive Player */}
          <button
            onClick={() => switchUserPreset('COMPETITIVE')}
            className={`w-full p-3.5 rounded-md border text-left flex items-start space-x-3.5 transition-all active:scale-[0.98] ${
              currentUser.callsign === 'Valkyrie_9'
                ? 'bg-tech-elevated border-secondary-tech'
                : 'bg-tech-surface border-border-stroke hover:border-slate-500 hover:bg-tech-elevated'
            }`}
          >
            <div className="w-8 h-8 rounded-md bg-void-black border border-white/10 flex items-center justify-center text-secondary-tech shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-100">
                  Competitive [Valkyrie_9]
                </span>
                <span className="text-[11px] font-mono bg-tech-surface text-secondary-tech border border-secondary-tech/40 px-1.5 py-0.5 rounded-md tabular-nums">
                  $42.00
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                2 tactical titles owned (Railbound & Cyber Siege), rank level 42, and $42.00 wallet credit.
              </p>
            </div>
          </button>

          {/* Preset 3: Guest Operative */}
          <button
            onClick={() => switchUserPreset('GUEST')}
            className={`w-full p-3.5 rounded-md border text-left flex items-start space-x-3.5 transition-all active:scale-[0.98] ${
              currentUser.callsign === 'Ghost_Operative'
                ? 'bg-tech-elevated border-slate-300'
                : 'bg-tech-surface border-border-stroke hover:border-slate-500 hover:bg-tech-elevated'
            }`}
          >
            <div className="w-8 h-8 rounded-md bg-void-black border border-white/10 flex items-center justify-center text-slate-400 shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-100">
                  Guest [Ghost_Operative]
                </span>
                <span className="text-[11px] font-mono bg-tech-surface text-slate-300 border border-border-stroke px-1.5 py-0.5 rounded-md tabular-nums">
                  $0.00
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Clean state with zero owned titles to test store purchases, empty library onboarding, and downloads.
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-border-stroke flex items-center justify-between text-xs text-slate-400">
          <div>
            {settings.devTelemetryMode && (
              <span className="flex items-center gap-1.5 text-tactical-green">
                <Zap className="w-3.5 h-3.5" /> In-Memory Mode
              </span>
            )}
          </div>
          <button
            onClick={closeAuthModal}
            className="px-4 py-1.5 bg-tech-elevated hover:bg-[#232B38] text-slate-200 border border-border-stroke rounded-md text-xs transition-colors active:scale-[0.98]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
