import React from 'react';
import { useStore } from '../store/useStore';
import { Shield, X, UserCheck, Terminal, Award, Zap } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, switchUserPreset, currentUser, settings } = useStore();

  if (!isAuthModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void-black/85 backdrop-blur-md p-4 select-none">
      <div className="w-full max-w-lg bg-gunmetal-slate border border-white/10 border-t-white/20 rounded-lg shadow-2xl p-6 relative tactical-cut-sm transition-all duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-stroke">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 bg-primary-accent/15 border border-primary-accent rounded flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-primary-accent" />
            </div>
            <div>
              <h2 className="font-mono text-sm font-bold tracking-widest text-slate-100 uppercase">
                SWITCH ACCOUNT
              </h2>
              <span className="text-[10px] font-mono text-slate-400">
                CURRENT OPERATIVE: {currentUser.callsign} // ${currentUser.walletBalance.toFixed(2)}
              </span>
            </div>
          </div>
          <button 
            onClick={closeAuthModal} 
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-tech-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 font-sans my-4 leading-relaxed">
          Switch between operator accounts to test individual library ownership, wallet balances, and competitive states.
        </p>

        {/* Quick Presets */}
        <div className="space-y-3">
          {/* Preset 1: Developer */}
          <button
            onClick={() => switchUserPreset('DEVELOPER')}
            className={`w-full p-3.5 rounded-lg border text-left flex items-start space-x-3.5 transition-all ${
              currentUser.callsign === 'Spectre_07'
                ? 'bg-tech-surface border-primary-accent shadow-ember-glow'
                : 'bg-tech-surface/50 border-border-stroke hover:border-slate-500 hover:bg-tech-surface'
            }`}
          >
            <div className="w-9 h-9 rounded bg-void-black border border-primary-accent flex items-center justify-center text-primary-accent shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-100">
                  DEVELOPER / ARCHITECT [Spectre_07]
                </span>
                <span className="text-[10px] font-mono bg-primary-accent/20 text-primary-accent border border-primary-accent/40 px-1.5 py-0.5 rounded font-bold">
                  $149.50
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Full 4-game library unlocked, developer tools enabled, and $149.50 store wallet credit.
              </p>
            </div>
          </button>

          {/* Preset 2: Competitive Player */}
          <button
            onClick={() => switchUserPreset('COMPETITIVE')}
            className={`w-full p-3.5 rounded-lg border text-left flex items-start space-x-3.5 transition-all ${
              currentUser.callsign === 'Valkyrie_9'
                ? 'bg-tech-surface border-secondary-tech shadow-cyan-glow'
                : 'bg-tech-surface/50 border-border-stroke hover:border-slate-500 hover:bg-tech-surface'
            }`}
          >
            <div className="w-9 h-9 rounded bg-void-black border border-secondary-tech flex items-center justify-center text-secondary-tech shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-100">
                  COMPETITIVE OPERATOR [Valkyrie_9]
                </span>
                <span className="text-[10px] font-mono bg-secondary-tech/20 text-secondary-tech border border-secondary-tech/40 px-1.5 py-0.5 rounded font-bold">
                  $42.00
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                2 tactical titles owned (Railbound & Cyber Siege), competitive rank level 42, and $42.00 wallet credit.
              </p>
            </div>
          </button>

          {/* Preset 3: Guest Operative */}
          <button
            onClick={() => switchUserPreset('GUEST')}
            className={`w-full p-3.5 rounded-lg border text-left flex items-start space-x-3.5 transition-all ${
              currentUser.callsign === 'Ghost_Operative'
                ? 'bg-tech-surface border-slate-300'
                : 'bg-tech-surface/50 border-border-stroke hover:border-slate-500 hover:bg-tech-surface'
            }`}
          >
            <div className="w-9 h-9 rounded bg-void-black border border-slate-500 flex items-center justify-center text-slate-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-100">
                  RECON GUEST [Ghost_Operative]
                </span>
                <span className="text-[10px] font-mono bg-border-stroke text-slate-300 px-1.5 py-0.5 rounded font-bold">
                  $0.00
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans mt-1">
                Clean state with zero owned titles to test store purchases, empty library onboarding, and downloads.
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-border-stroke flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            {settings.devTelemetryMode && (
              <span className="flex items-center gap-1.5 text-tactical-green">
                <Zap className="w-3.5 h-3.5 text-tactical-green" /> IN-MEMORY LOCAL DATA
              </span>
            )}
          </div>
          <button
            onClick={closeAuthModal}
            className="px-4 py-1.5 bg-tech-elevated hover:bg-border-stroke text-slate-200 rounded text-xs transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
