import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { UserCheck, X, User } from 'lucide-react';
import { NumberTicker } from './ui/NumberTicker';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, switchUserPreset, currentUser, settings } = useStore();

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-lg win11-acrylic rounded-3xl p-6 relative animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_16px_rgba(255,122,0,0.2)]">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Switch account
              </h2>
              <span className="text-xs text-slate-400 tabular-nums">
                Active account: {currentUser.callsign} · <NumberTicker value={currentUser.walletBalance} decimalPlaces={2} prefix="$" />
              </span>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-surface cursor-default"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User-facing description (No test jargon) */}
        <p className="text-xs text-slate-400 my-4 leading-relaxed">
          Select an account to access its personalized game library and wallet credit.
        </p>

        {/* Account selection list */}
        <div className="space-y-3">
          {/* Main Account */}
          <button
            onClick={() => {
              switchUserPreset('DEVELOPER');
              closeAuthModal();
            }}
            className={`w-full p-4 win11-tile text-left flex items-center gap-3.5 cursor-default ${
              currentUser.callsign === 'Spectre_07' ? 'win11-tile-active' : ''
            }`}
          >
            <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/20 shrink-0 shadow-sm">
              <img
                src="https://api.dicebear.com/7.x/bottts/svg?seed=Spectre_07"
                alt="Spectre_07"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white">Spectre_07</span>
                <span className="text-xs text-slate-200 font-semibold tabular-nums">
                  $149.50
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Primary library · 4 titles installed
              </p>
            </div>
          </button>

          {/* Secondary Account */}
          <button
            onClick={() => {
              switchUserPreset('COMPETITIVE');
              closeAuthModal();
            }}
            className={`w-full p-4 win11-tile text-left flex items-center gap-3.5 cursor-default ${
              currentUser.callsign === 'Valkyrie_9' ? 'win11-tile-active' : ''
            }`}
          >
            <div className="relative w-11 h-11 rounded-full overflow-hidden border border-white/20 shrink-0 shadow-sm">
              <img
                src="https://api.dicebear.com/7.x/bottts/svg?seed=Valkyrie_9"
                alt="Valkyrie_9"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-white">Valkyrie_9</span>
                <span className="text-xs text-slate-200 font-semibold tabular-nums">
                  $42.00
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tactical loadout · 2 titles installed
              </p>
            </div>
          </button>

          {/* Guest Account (behind dev flag or standard option) */}
          {settings.devTelemetryMode && (
            <button
              onClick={() => {
                switchUserPreset('GUEST');
                closeAuthModal();
              }}
              className={`w-full p-4 win11-tile text-left flex items-center gap-3.5 cursor-default ${
                currentUser.callsign === 'Ghost_Operative' ? 'win11-tile-active' : ''
              }`}
            >
              <div className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">Ghost_Operative</span>
                  <span className="text-xs text-slate-200 font-semibold tabular-nums">
                    $0.00
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Guest session
                </p>
              </div>
            </button>
          )}
        </div>

        <div className="pt-5 mt-4 border-t border-white/[0.08] flex justify-end">
          <button
            onClick={closeAuthModal}
            className="px-6 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs font-medium text-slate-200 transition-surface cursor-default"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
