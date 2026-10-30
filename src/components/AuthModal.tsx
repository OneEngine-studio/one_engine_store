import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  Server,
  LogOut,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { nakamaService } from '../lib/nakama';

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

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<'CHECKING' | 'ONLINE' | 'OFFLINE'>('CHECKING');
  const [copiedToken, setCopiedToken] = useState(false);
  const [showServerDetails, setShowServerDetails] = useState(false);

  // Esc key listener
  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Check server connectivity status whenever modal opens
  useEffect(() => {
    if (!isAuthModalOpen) return;
    let isMounted = true;
    setServerStatus('CHECKING');

    nakamaService.testConnection().then((res) => {
      if (isMounted) {
        setServerStatus(res.ok ? 'ONLINE' : 'OFFLINE');
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isAuthModalOpen, settings.nakamaHost, settings.nakamaPort]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'LOGIN') {
        const res = await loginWithNakama(email.trim(), password);
        if (res.success) {
          closeAuthModal();
        } else {
          setErrorMessage(res.error || 'Failed to authenticate with Nakama.');
        }
      } else {
        if (!username.trim()) {
          setErrorMessage('Please choose a callsign / username.');
          setLoading(false);
          return;
        }
        const res = await registerWithNakama(email.trim(), password, username.trim());
        if (res.success) {
          closeAuthModal();
        } else {
          setErrorMessage(res.error || 'Registration failed. Username or email may already be taken.');
        }
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
      if (res.success) {
        closeAuthModal();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (currentUser.nakamaToken) {
      navigator.clipboard.writeText(currentUser.nakamaToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
      addToast('Nakama JWT copied to clipboard.', 'info');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none animate-fade-in"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-md bg-bg-panel border border-white/[0.08] rounded-panel p-6 relative shadow-modal animate-modal-in flex flex-col gap-5 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-tight">
                {isAuthenticated ? 'Active operative' : 'OneEngine identification'}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    serverStatus === 'ONLINE'
                      ? 'bg-success animate-pulse'
                      : serverStatus === 'OFFLINE'
                      ? 'bg-amber-400'
                      : 'bg-slate-400 animate-ping'
                  }`}
                />
                <span>
                  Nakama ({settings.nakamaHost}:{settings.nakamaPort}) ·{' '}
                  {serverStatus === 'ONLINE'
                    ? 'Online'
                    : serverStatus === 'OFFLINE'
                    ? 'Standby'
                    : 'Verifying...'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] transition-surface cursor-default"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Authenticated State Display */}
        {isAuthenticated && currentUser.id ? (
          <div className="space-y-4">
            {/* User Profile Card */}
            <div className="p-4 rounded-card bg-bg-card border border-white/[0.06] flex items-center gap-3.5">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-accent/40 shadow-sm shrink-0">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.callsign}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success ring-1 ring-bg-panel" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white truncate">
                    {currentUser.callsign}
                  </span>
                  <span className="text-xs text-accent font-semibold tabular-nums">
                    ${currentUser.walletBalance.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {currentUser.email || 'Verified Operative'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-[10px] text-slate-300 font-medium">
                    {currentUser.rank}
                  </span>
                  <span className="text-[10px] text-slate-500 tabular-nums">
                    UID: {currentUser.id.slice(0, 12)}…
                  </span>
                </div>
              </div>
            </div>

            {/* Session Token Card */}
            <div className="p-3.5 rounded-card bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <Server className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nakama launcher handoff</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                  {currentUser.nakamaToken ? `${currentUser.nakamaToken.slice(0, 32)}…` : 'Session ready'}
                </p>
              </div>
              {currentUser.nakamaToken && (
                <button
                  onClick={handleCopyToken}
                  className="px-2.5 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-xs text-slate-300 flex items-center gap-1 transition-surface"
                  title="Copy session token"
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3 h-3 text-success" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                onClick={logout}
                className="px-4 py-2 rounded-full bg-danger/15 hover:bg-danger/25 border border-danger/30 text-xs font-medium text-danger flex items-center gap-1.5 transition-surface"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign out</span>
              </button>

              <button
                onClick={closeAuthModal}
                className="px-6 py-2 rounded-full bg-accent hover:bg-accent-hover text-xs font-semibold text-bg-app transition-surface"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Login & Registration Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Segmented Mode Selector */}
            <div className="flex p-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => {
                  setMode('LOGIN');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-surface ${
                  mode === 'LOGIN'
                    ? 'bg-accent text-bg-app font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('REGISTER');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-surface ${
                  mode === 'REGISTER'
                    ? 'bg-accent text-bg-app font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create account
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 rounded-thumb bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <span>{errorMessage}</span>
                  {serverStatus === 'OFFLINE' && (
                    <p className="mt-1 text-[11px] text-slate-300">
                      Tip: If behind a firewall/proxy, you can click &quot;Continue as guest&quot; below to launch games in local simulation mode.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-3">
              {mode === 'REGISTER' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Callsign / Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Spectre_01"
                      className="w-full pl-9 pr-3 py-2 rounded-thumb bg-white/[0.04] border border-white/[0.08] focus:border-accent text-xs text-white placeholder-slate-500 outline-none transition-surface"
                      required={mode === 'REGISTER'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="player@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-thumb bg-white/[0.04] border border-white/[0.08] focus:border-accent text-xs text-white placeholder-slate-500 outline-none transition-surface"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2 rounded-thumb bg-white/[0.04] border border-white/[0.08] focus:border-accent text-xs text-white placeholder-slate-500 outline-none transition-surface"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Primary CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-full bg-accent hover:bg-accent-hover text-bg-app text-xs font-semibold shadow-md transition-surface flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-bg-app border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Nakama…</span>
                </>
              ) : mode === 'LOGIN' ? (
                <span>Sign in to store</span>
              ) : (
                <span>Create operative account</span>
              )}
            </button>

            {/* Offline / Guest Fallback Option */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleGuestLogin}
                className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span>Continue as guest</span>
              </button>

              <button
                type="button"
                onClick={() => setShowServerDetails((prev) => !prev)}
                className="text-slate-400 hover:text-slate-200 text-[11px] underline"
              >
                {showServerDetails ? 'Hide server info' : 'Server details'}
              </button>
            </div>

            {/* Server details dropdown */}
            {showServerDetails && (
              <div className="p-3.5 rounded-card bg-bg-card border border-white/[0.08] text-xs space-y-2.5 animate-soft-enter">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>Backend connection settings</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    serverStatus === 'ONLINE' ? 'bg-success/20 text-success' : 'bg-amber-400/20 text-amber-300'
                  }`}>
                    {serverStatus === 'ONLINE' ? 'ONLINE' : 'UNREACHABLE'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400 block mb-0.5">Host / IP</label>
                    <input
                      type="text"
                      value={settings.nakamaHost}
                      onChange={(e) => updateSettings({ nakamaHost: e.target.value.trim() })}
                      onBlur={() => {
                        setServerStatus('CHECKING');
                        nakamaService.testConnection().then((r) => setServerStatus(r.ok ? 'ONLINE' : 'OFFLINE'));
                      }}
                      className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-accent rounded-thumb px-2.5 py-1 text-xs text-slate-200 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Port</label>
                    <input
                      type="text"
                      value={settings.nakamaPort}
                      onChange={(e) => updateSettings({ nakamaPort: e.target.value.trim() })}
                      onBlur={() => {
                        setServerStatus('CHECKING');
                        nakamaService.testConnection().then((r) => setServerStatus(r.ok ? 'ONLINE' : 'OFFLINE'));
                      }}
                      className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-accent rounded-thumb px-2.5 py-1 text-xs text-slate-200 outline-none font-mono tabular-nums"
                    />
                  </div>
                </div>

                {serverStatus === 'OFFLINE' && (
                  <p className="text-[11px] text-amber-300/90 leading-tight">
                    Port 7350 timed out. If running on Oracle Cloud/VPS, verify that TCP 7350 is allowed in Oracle VCN Ingress Rules and Linux firewall (`sudo ufw allow 7350/tcp`).
                  </p>
                )}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
