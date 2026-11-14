import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, LogOut, AlertCircle } from 'lucide-react';
import { platformApi } from '../lib/platformApi';
import { ServerAddressField } from './ui/ServerAddressField';

type ServerStatus = 'CHECKING' | 'ONLINE' | 'OFFLINE';

const inputClass =
  'w-full px-3 py-2.5 rounded-input bg-bg-app border border-white/[0.1] focus:border-accent text-sm text-cream placeholder-slate-600 outline-none transition-surface select-text';

/** Cartridge sliding into a console slot. Purely decorative. */
const SlotArt: React.FC = () => (
  <svg viewBox="0 0 220 260" className="w-full h-auto" aria-hidden="true">
    <g style={{ animation: 'cartDrop 700ms cubic-bezier(0.23, 1, 0.32, 1) both' }}>
      <path d="M62 20h96l10 12v118H52V32z" fill="#9a4a14" />
      <path d="M62 20h96l10 12v118H52V32z" fill="url(#shine)" />
      <rect x="68" y="30" width="84" height="8" rx="2" fill="rgba(0,0,0,0.35)" />
      <rect x="64" y="48" width="92" height="70" rx="5" fill="#F2E8D5" />
      <rect x="70" y="54" width="80" height="40" rx="3" fill="#1d1914" />
      <path d="M70 84l20-18 14 10 18-14 28 22v10H70z" fill="#FF7A00" opacity="0.85" />
      <rect x="72" y="100" width="46" height="5" rx="1" fill="#1b1510" />
      <rect x="72" y="108" width="28" height="3" rx="1" fill="#1b1510" opacity="0.5" />
      {Array.from({ length: 9 }).map((_, i) => (
        <rect key={i} x={72 + i * 9.5} y="136" width="4" height="14" fill="#C9A24B" />
      ))}
    </g>
    {/* console slot */}
    <rect x="34" y="150" width="152" height="86" rx="10" fill="#241e17" />
    <rect x="34" y="150" width="152" height="86" rx="10" fill="none" stroke="rgba(242,232,213,0.12)" />
    <rect x="46" y="150" width="128" height="14" rx="3" fill="#0C0A08" />
    <rect x="46" y="164" width="128" height="3" fill="#C9A24B" opacity="0.7" />
    <circle cx="58" cy="214" r="4" fill="#FF7A00" />
    <rect x="72" y="211" width="60" height="6" rx="3" fill="rgba(242,232,213,0.1)" />
    <defs>
      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
        <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.3" />
      </linearGradient>
    </defs>
  </svg>
);

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    currentUser,
    isAuthenticated,
    signIn,
    logout,
    settings,
  } = useStore();

  const last = platformApi.lastIdentity();
  const [email, setEmail] = useState(last?.email ?? '');
  const [displayName, setDisplayName] = useState(last?.displayName ?? '');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('CHECKING');
  const [serverMessage, setServerMessage] = useState('');
  const [showServerDetails, setShowServerDetails] = useState(false);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    let isMounted = true;
    setServerStatus('CHECKING');
    platformApi.health().then((res) => {
      if (!isMounted) return;
      setServerStatus(res.ok ? 'ONLINE' : 'OFFLINE');
      setServerMessage(res.message);
    });
    return () => {
      isMounted = false;
    };
  }, [isAuthModalOpen, settings.platformApiUrl]);

  if (!isAuthModalOpen) return null;

  const recheck = () => {
    setServerStatus('CHECKING');
    platformApi.health().then((r) => {
      setServerStatus(r.ok ? 'ONLINE' : 'OFFLINE');
      setServerMessage(r.message);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const name = displayName.trim();
    if (!email.trim() || name.length < 2) {
      setErrorMessage('Enter your email and a callsign of at least 2 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(email.trim(), name);
      if (res.success) closeAuthModal();
      else setErrorMessage(res.error || 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  const statusLabel =
    serverStatus === 'ONLINE' ? 'Server online' : serverStatus === 'OFFLINE' ? 'Server unreachable' : 'Checking server…';
  const statusDot =
    serverStatus === 'ONLINE' ? 'bg-success' : serverStatus === 'OFFLINE' ? 'bg-amber-400' : 'bg-slate-500 led-pulse';

  const closeButton = (
    <button
      onClick={closeAuthModal}
      aria-label="Close"
      title="Close (Esc)"
      className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-surface cursor-default z-10"
    >
      <X className="w-4 h-4" strokeWidth={1.75} />
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none"
      onClick={closeAuthModal}
    >
      {isAuthenticated && currentUser.id ? (
        /* Signed in: an operator pass */
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm animate-modal-in"
        >
          {closeButton}
          <div className="rounded-panel bg-cream text-[#1b1510] overflow-hidden shadow-modal">
            <div className="h-10 flex items-end justify-center bg-[#1b1510]">
              <span className="mb-2 w-16 h-2.5 rounded-full bg-bg-app ring-1 ring-white/10" />
            </div>
            <div className="p-6 pt-5 space-y-5">
              <div className="flex items-center gap-4">
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover bg-[#1b1510]/10 ring-2 ring-[#1b1510]/20"
                />
                <div className="min-w-0">
                  <h2 id="auth-title" className="font-display text-2xl font-extrabold leading-tight truncate">
                    {currentUser.callsign}
                  </h2>
                  <p className="text-xs text-[#1b1510]/60 truncate">{currentUser.email || 'Verified account'}</p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <dt className="text-[#1b1510]/50">Rank</dt>
                  <dd className="font-semibold capitalize">{currentUser.rank.toLowerCase()}</dd>
                </div>
                <div>
                  <dt className="text-[#1b1510]/50">Games owned</dt>
                  <dd className="font-semibold tabular-nums">{currentUser.ownedGameIds.length}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[#1b1510]/50">Account ID</dt>
                  <dd className="font-mono text-[11px] truncate">{currentUser.id}</dd>
                </div>
              </dl>

              <div className="rounded-xl bg-[#1b1510]/[0.07] p-3.5">
                <div className="text-xs font-semibold">One-time launch pass</div>
                <p className="text-[11px] text-[#1b1510]/60 leading-snug mt-0.5">
                  Each launch hands the game a pass that works once for 60 seconds. Your sign-in never reaches the game.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  onClick={logout}
                  className="px-3 h-10 rounded-full text-sm font-semibold text-[#b3261e] hover:bg-[#b3261e]/10 flex items-center gap-2 cursor-default transition-surface"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
                <button
                  onClick={closeAuthModal}
                  className="px-7 h-10 rounded-full bg-accent hover:bg-accent-hover text-sm font-bold text-[#1b1510] cursor-default active:scale-[0.97] transition-[background-color,transform]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Signed out: slot-in screen */
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl grid md:grid-cols-[270px_1fr] rounded-panel overflow-hidden bg-bg-panel border border-white/[0.08] shadow-modal animate-modal-in"
        >
          {closeButton}
          <aside className="hidden md:flex flex-col justify-between p-7 bg-bg-app border-r border-white/[0.06]">
            <div>
              <p className="font-display text-3xl font-extrabold text-cream leading-[1.05]">
                Slot in.
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sign in to sync your library and launch Railbound with your account.
              </p>
            </div>
            <SlotArt />
          </aside>

          <form onSubmit={handleSubmit} className="p-7 space-y-5">
            <div className="border-b border-white/[0.08] pb-3">
              <h2 id="auth-title" className="text-sm font-semibold text-cream">
                Sign in to OneEngine
              </h2>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Development sign-in: no password yet. The real OneEngine ID replaces this before release.
              </p>
            </div>

            {errorMessage && (
              <div role="alert" className="p-3 rounded-input bg-danger/10 border border-danger/30 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
                <div className="leading-relaxed text-slate-200">
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="auth-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label htmlFor="auth-username" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Callsign
                </label>
                <input
                  id="auth-username"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Spectre_01"
                  autoComplete="nickname"
                  minLength={2}
                  maxLength={32}
                  className={inputClass}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-full bg-accent hover:bg-accent-hover text-[#1b1510] text-sm font-bold transition-[background-color,transform] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 cursor-default"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#1b1510] border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>

            <div className="flex items-center justify-end text-xs pt-1">
              <button
                type="button"
                onClick={() => setShowServerDetails((prev) => !prev)}
                aria-expanded={showServerDetails}
                className="flex items-center gap-2 text-slate-400 hover:text-cream cursor-default transition-colors"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                {statusLabel}
              </button>
            </div>

            {showServerDetails && (
              <div className="rounded-input border border-white/[0.08] p-3.5 text-xs space-y-2.5 animate-soft-enter">
                <label htmlFor="nk-address" className="text-[11px] text-slate-400 block">
                  Service address
                </label>
                <ServerAddressField
                  id="nk-address"
                  inputClassName={`${inputClass} font-mono text-xs py-1.5`}
                  onApplied={recheck}
                />
                {serverStatus === 'OFFLINE' && serverMessage && (
                  <p role="status" className="text-[11px] text-slate-400 leading-snug">
                    {serverMessage}
                  </p>
                )}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};
