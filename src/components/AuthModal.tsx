import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, LogOut, AlertCircle, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { nakamaService } from '../lib/nakama';

type Mode = 'LOGIN' | 'REGISTER';
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
    loginWithNakama,
    registerWithNakama,
    loginAsGuest,
    logout,
    settings,
    updateSettings,
    addToast,
  } = useStore();

  const [mode, setMode] = useState<Mode>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('CHECKING');
  const [copiedToken, setCopiedToken] = useState(false);
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
    nakamaService.testConnection().then((res) => {
      if (isMounted) setServerStatus(res.ok ? 'ONLINE' : 'OFFLINE');
    });
    return () => {
      isMounted = false;
    };
  }, [isAuthModalOpen, settings.nakamaHost, settings.nakamaPort]);

  if (!isAuthModalOpen) return null;

  const recheck = () => {
    setServerStatus('CHECKING');
    nakamaService.testConnection().then((r) => setServerStatus(r.ok ? 'ONLINE' : 'OFFLINE'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'LOGIN') {
        const res = await loginWithNakama(email.trim(), password);
        if (res.success) closeAuthModal();
        else setErrorMessage(res.error || 'Could not sign in to Nakama.');
      } else {
        if (!username.trim()) {
          setErrorMessage('Choose a callsign to create your account.');
          return;
        }
        const res = await registerWithNakama(email.trim(), password, username.trim());
        if (res.success) closeAuthModal();
        else setErrorMessage(res.error || 'Could not create the account. The callsign or email may already be taken.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await loginAsGuest(username.trim() || 'Operative_Guest');
      if (res.success) closeAuthModal();
    } finally {
      setLoading(false);
    }
  };

  const isOfflineSession = !!currentUser.nakamaToken?.startsWith('offline_jwt');

  const handleCopyToken = () => {
    if (currentUser.nakamaToken && !isOfflineSession) {
      navigator.clipboard.writeText(currentUser.nakamaToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      addToast('Launcher key copied.', 'info');
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
                  <dt className="text-[#1b1510]/50">Wallet</dt>
                  <dd className="font-semibold tabular-nums">${currentUser.walletBalance.toFixed(2)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[#1b1510]/50">Account ID</dt>
                  <dd className="font-mono text-[11px] truncate">{currentUser.id}</dd>
                </div>
              </dl>

              <div className="rounded-xl bg-[#1b1510]/[0.07] p-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold">
                    {isOfflineSession ? 'Offline pass' : 'Launcher key'}
                  </div>
                  <p className="text-[11px] text-[#1b1510]/60 leading-snug mt-0.5">
                    {isOfflineSession
                      ? 'Not verified by Nakama. Games start in local mode.'
                      : 'Hands your session to the game when it starts.'}
                  </p>
                </div>
                {!isOfflineSession && currentUser.nakamaToken && (
                  <button
                    onClick={handleCopyToken}
                    className="shrink-0 px-3 h-8 rounded-full bg-[#1b1510] text-cream text-xs font-semibold flex items-center gap-1.5 cursor-default active:scale-[0.97] transition-transform"
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedToken ? 'Copied' : 'Copy'}
                  </button>
                )}
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
            <div role="tablist" className="flex gap-6 border-b border-white/[0.08]">
              {(
                [
                  ['LOGIN', 'Sign in'],
                  ['REGISTER', 'Create account'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={mode === id}
                  onClick={() => {
                    setMode(id);
                    setErrorMessage(null);
                  }}
                  className={`-mb-px pb-3 text-sm font-semibold cursor-default border-b-2 transition-surface ${
                    mode === id ? 'border-accent text-cream' : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <h2 id="auth-title" className="sr-only">
              {mode === 'LOGIN' ? 'Sign in to OneEngine' : 'Create a OneEngine account'}
            </h2>

            {errorMessage && (
              <div role="alert" className="p-3 rounded-input bg-danger/10 border border-danger/30 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
                <div className="leading-relaxed text-slate-200">
                  <span>{errorMessage}</span>
                  {serverStatus === 'OFFLINE' && (
                    <p className="mt-1 text-slate-400">
                      You can still continue as a guest to play in local mode.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {mode === 'REGISTER' && (
                <div>
                  <label htmlFor="auth-username" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Callsign
                  </label>
                  <input
                    id="auth-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Spectre_01"
                    autoComplete="username"
                    className={inputClass}
                    required
                  />
                </div>
              )}
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
                <label htmlFor="auth-password" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'LOGIN' ? 'current-password' : 'new-password'}
                    className={`${inputClass} pr-11`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white cursor-default"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
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
                  Connecting…
                </>
              ) : mode === 'LOGIN' ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="text-slate-400 hover:text-cream cursor-default transition-colors"
              >
                Continue as guest
              </button>
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
              <div className="rounded-input border border-white/[0.08] p-3.5 text-xs space-y-3 animate-soft-enter">
                <div className="grid grid-cols-[1fr_88px] gap-2.5">
                  <div>
                    <label htmlFor="nk-host" className="text-[11px] text-slate-400 block mb-1">Host</label>
                    <input
                      id="nk-host"
                      type="text"
                      value={settings.nakamaHost}
                      onChange={(e) => updateSettings({ nakamaHost: e.target.value.trim() })}
                      onBlur={recheck}
                      className={`${inputClass} font-mono text-xs py-1.5`}
                    />
                  </div>
                  <div>
                    <label htmlFor="nk-port" className="text-[11px] text-slate-400 block mb-1">Port</label>
                    <input
                      id="nk-port"
                      type="text"
                      value={settings.nakamaPort}
                      onChange={(e) => updateSettings({ nakamaPort: e.target.value.trim() })}
                      onBlur={recheck}
                      className={`${inputClass} font-mono text-xs py-1.5 tabular-nums`}
                    />
                  </div>
                </div>
                {serverStatus === 'OFFLINE' && (
                  <p className="text-[11px] text-slate-400 leading-snug">
                    No reply from {settings.nakamaHost}:{settings.nakamaPort}. Check that Nakama is running and that TCP{' '}
                    {settings.nakamaPort} is open in the cloud firewall and on the server.
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
