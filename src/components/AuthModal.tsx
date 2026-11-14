import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, LogOut, AlertCircle, Eye, EyeOff, MailCheck } from 'lucide-react';
import { platformApi } from '../lib/platformApi';

type View = 'signin' | 'register' | 'forgot' | 'reset';
type ServerStatus = 'CHECKING' | 'ONLINE' | 'OFFLINE';

const inputClass =
  'w-full px-3 py-2.5 rounded-input bg-bg-app border border-white/[0.1] focus:border-accent text-sm text-cream placeholder-slate-600 outline-none transition-surface select-text';
const primaryButton =
  'w-full h-11 rounded-full bg-accent hover:bg-accent-hover text-[#1b1510] text-sm font-bold transition-[background-color,transform] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 cursor-default';
const linkButton = 'text-slate-400 hover:text-cream cursor-default transition-colors';

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

const Field: React.FC<{ id: string; label: string; children: React.ReactNode; hint?: string }> = ({ id, label, children, hint }) => (
  <div>
    <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">
      {label}
    </label>
    {children}
    {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
  </div>
);

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    currentUser,
    isAuthenticated,
    signIn,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout,
  } = useStore();

  const [view, setView] = useState<View>('signin');
  const [email, setEmail] = useState(() => platformApi.lastEmail());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [resendWait, setResendWait] = useState(0);
  const [serverStatus, setServerStatus] = useState<ServerStatus>('CHECKING');
  const [serverMessage, setServerMessage] = useState('');
  const [showServerDetails, setShowServerDetails] = useState(false);

  const [closeWhenReady, setCloseWhenReady] = useState(false);

  const signedIn = isAuthenticated && !!currentUser.id;
  const needsVerification = signedIn && !currentUser.emailVerified;

  // After sign-in the window closes by itself, unless the email still needs confirming.
  useEffect(() => {
    if (closeWhenReady && signedIn) {
      setCloseWhenReady(false);
      if (currentUser.emailVerified) closeAuthModal();
    }
  }, [closeWhenReady, signedIn, currentUser.emailVerified, closeAuthModal]);

  useEffect(() => {
    if (!isAuthModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  // Signing out returns to the sign-in form with nothing typed left behind.
  useEffect(() => {
    if (signedIn) return;
    setView('signin');
    setErrorMessage(null);
    setNotice(null);
    setPassword('');
    setConfirmPassword('');
    setCode('');
  }, [signedIn]);

  // Each time the dialog opens it starts on sign-in, not on whichever form was left open last time.
  useEffect(() => {
    if (!isAuthModalOpen) return;
    setView('signin');
    setErrorMessage(null);
    setNotice(null);
    setPassword('');
    setConfirmPassword('');
    setCode('');
  }, [isAuthModalOpen]);

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
  }, [isAuthModalOpen]);

  useEffect(() => {
    if (resendWait <= 0) return;
    const t = setTimeout(() => setResendWait((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendWait]);

  if (!isAuthModalOpen) return null;

  const recheck = () => {
    setServerStatus('CHECKING');
    platformApi.health().then((r) => {
      setServerStatus(r.ok ? 'ONLINE' : 'OFFLINE');
      setServerMessage(r.message);
    });
  };

  const go = (next: View) => {
    setView(next);
    setErrorMessage(null);
    setNotice(null);
    setPassword('');
    setConfirmPassword('');
    setCode('');
  };

  const run = async (action: () => Promise<{ success: boolean; error?: string }>, onOk: () => void) => {
    setErrorMessage(null);
    setNotice(null);
    setLoading(true);
    try {
      const res = await action();
      if (res.success) onOk();
      else setErrorMessage(res.error || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (needsVerification) {
      if (!/^\d{6}$/.test(code.trim())) return setErrorMessage('Enter the 6 digit code from the email.');
      return run(() => verifyEmail(code.trim()), () => {
        setCode('');
        closeAuthModal();
      });
    }
    if (view === 'signin') {
      if (!email.trim() || !password) return setErrorMessage('Enter your email and password.');
      return run(() => signIn(email.trim(), password), () => {
        setPassword('');
        setCloseWhenReady(true);
      });
    }
    if (view === 'register') {
      const name = displayName.trim();
      if (name.length < 2 || name.length > 32 || !/^[\p{L}\p{N} _.-]+$/u.test(name)) {
        return setErrorMessage('Pick a callsign of 2 to 32 letters, numbers, spaces, dots, dashes or underscores.');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErrorMessage('Enter a valid email address.');
      if (password.length < 8) return setErrorMessage('Use a password of at least 8 characters.');
      if (password !== confirmPassword) return setErrorMessage('The two passwords do not match.');
      return run(() => register(email.trim(), password, name), () => {
        setPassword('');
        setConfirmPassword('');
        setCloseWhenReady(true);
      });
    }
    if (view === 'forgot') {
      if (!email.trim()) return setErrorMessage('Enter your email address.');
      return run(() => forgotPassword(email.trim()), () => {
        setView('reset');
        setNotice(`If an account exists for ${email.trim()}, we sent a 6 digit code. It works for 15 minutes.`);
      });
    }
    if (!/^\d{6}$/.test(code.trim())) return setErrorMessage('Enter the 6 digit code from the email.');
    if (password.length < 8) return setErrorMessage('Use a new password of at least 8 characters.');
    if (password !== confirmPassword) return setErrorMessage('The two passwords do not match.');
    return run(() => resetPassword(email.trim(), code.trim(), password), () => {
      go('signin');
      setNotice('Password changed. Sign in with the new one.');
    });
  };

  const handleResend = () => {
    setErrorMessage(null);
    void resendVerification().then((res) => {
      if (res.success) {
        setNotice('A new code is on its way.');
        setResendWait(30);
      } else setErrorMessage(res.error || 'Could not send a new code.');
    });
  };

  const statusLabel =
    serverStatus === 'ONLINE' ? 'Service online' : serverStatus === 'OFFLINE' ? 'Service unreachable' : 'Checking service…';
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

  const passwordField = (
    id: string,
    label: string,
    autoComplete: string,
    hint?: string,
    value = password,
    setValue: (v: string) => void = setPassword
  ) => (
    <Field id={id} label={label} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete={autoComplete}
          maxLength={128}
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
    </Field>
  );

  const emailField = (readOnly = false) => (
    <Field id="auth-email" label="Email">
      <input
        id="auth-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        autoFocus={!readOnly}
        readOnly={readOnly}
        className={inputClass}
        required
      />
    </Field>
  );

  const codeField = (
    <Field id="auth-code" label="6 digit code">
      <input
        id="auth-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
        placeholder="123456"
        autoFocus
        className={`${inputClass} font-mono tracking-[0.4em] text-center text-base`}
        required
      />
    </Field>
  );

  const title = needsVerification
    ? 'Confirm your email'
    : view === 'signin'
      ? 'Sign in to OneEngine'
      : view === 'register'
        ? 'Create your OneEngine account'
        : view === 'forgot'
          ? 'Reset your password'
          : 'Choose a new password';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 select-none"
      onClick={closeAuthModal}
    >
      {signedIn && !needsVerification ? (
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
                  <p className="text-xs text-[#1b1510]/60 truncate">{currentUser.email}</p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <dt className="text-[#1b1510]/50">Email</dt>
                  <dd className="font-semibold">Confirmed</dd>
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
                  Each launch hands the game a pass that works once for 60 seconds. Your password never reaches the game.
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
        /* Signed out, or signed in but the email still needs confirming */
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
              <p className="font-display text-3xl font-extrabold text-cream leading-[1.05]">Slot in.</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sign in to sync your library and launch Railbound with your account.
              </p>
            </div>
            <SlotArt />
          </aside>

          <form onSubmit={handleSubmit} className="p-7 space-y-5" noValidate>
            {!needsVerification && (view === 'signin' || view === 'register') ? (
              <div role="tablist" className="flex gap-6 border-b border-white/[0.08]">
                {(
                  [
                    ['signin', 'Sign in'],
                    ['register', 'Create account'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={view === id}
                    onClick={() => go(id)}
                    className={`-mb-px pb-3 text-sm font-semibold cursor-default border-b-2 transition-surface ${
                      view === id ? 'border-accent text-cream' : 'border-transparent text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            <h2 id="auth-title" className={!needsVerification && (view === 'signin' || view === 'register') ? 'sr-only' : 'text-lg font-semibold text-cream flex items-center gap-2'}>
              {needsVerification && <MailCheck className="w-5 h-5 text-accent" />}
              {title}
            </h2>

            {needsVerification && (
              <p className="text-xs text-slate-400 leading-relaxed -mt-2">
                We sent a 6 digit code to <span className="text-cream">{currentUser.email}</span>. Enter it to add games and play.
              </p>
            )}

            {notice && (
              <div role="status" className="p-3 rounded-input bg-success/10 border border-success/30 text-xs text-slate-200 leading-relaxed">
                {notice}
              </div>
            )}
            {errorMessage && (
              <div role="alert" className="p-3 rounded-input bg-danger/10 border border-danger/30 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
                <span className="leading-relaxed text-slate-200">{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              {needsVerification ? (
                codeField
              ) : view === 'signin' ? (
                <>
                  {emailField()}
                  {passwordField('auth-password', 'Password', 'current-password')}
                </>
              ) : view === 'register' ? (
                <>
                  <Field id="auth-username" label="Callsign">
                    <input
                      id="auth-username"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Spectre_01"
                      autoComplete="nickname"
                      maxLength={32}
                      autoFocus
                      className={inputClass}
                      required
                    />
                  </Field>
                  {emailField()}
                  {passwordField('auth-password', 'Password', 'new-password', 'At least 8 characters.')}
                  {passwordField('auth-confirm', 'Confirm password', 'new-password', undefined, confirmPassword, setConfirmPassword)}
                </>
              ) : view === 'forgot' ? (
                emailField()
              ) : (
                <>
                  {emailField(true)}
                  {codeField}
                  {passwordField('auth-password', 'New password', 'new-password', 'At least 8 characters.')}
                  {passwordField('auth-confirm', 'Confirm new password', 'new-password', undefined, confirmPassword, setConfirmPassword)}
                </>
              )}
            </div>

            <button type="submit" disabled={loading} className={primaryButton}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#1b1510] border-t-transparent rounded-full animate-spin" />
                  Please wait…
                </>
              ) : needsVerification ? (
                'Confirm email'
              ) : view === 'signin' ? (
                'Sign in'
              ) : view === 'register' ? (
                'Create account'
              ) : view === 'forgot' ? (
                'Send code'
              ) : (
                'Change password'
              )}
            </button>

            <div className="flex items-center justify-between text-xs pt-1 gap-4">
              {needsVerification ? (
                <>
                  <button type="button" onClick={handleResend} disabled={resendWait > 0} className={`${linkButton} disabled:opacity-50`}>
                    {resendWait > 0 ? `Send a new code in ${resendWait}s` : 'Send a new code'}
                  </button>
                  <button type="button" onClick={logout} className={linkButton}>
                    Sign out
                  </button>
                </>
              ) : view === 'signin' ? (
                <button type="button" onClick={() => go('forgot')} className={linkButton}>
                  Forgot password?
                </button>
              ) : view === 'register' ? (
                <span className="text-slate-500">We email a code to confirm your address.</span>
              ) : (
                <button type="button" onClick={() => go('signin')} className={linkButton}>
                  Back to sign in
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowServerDetails((prev) => !prev)}
                aria-expanded={showServerDetails}
                className="flex items-center gap-2 text-slate-400 hover:text-cream cursor-default transition-colors shrink-0"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                {statusLabel}
              </button>
            </div>

            {showServerDetails && (
              <div className="rounded-input border border-white/[0.08] p-3.5 text-xs space-y-2.5 animate-soft-enter">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">OneEngine service</span>
                  <button
                    type="button"
                    onClick={recheck}
                    className="text-[11px] text-accent hover:text-accent-hover cursor-default"
                  >
                    Check again
                  </button>
                </div>
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
