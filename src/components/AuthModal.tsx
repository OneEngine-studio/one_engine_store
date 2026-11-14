import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { X, LogOut, AlertCircle, Eye, EyeOff, MailCheck } from 'lucide-react';
import { platformApi } from '../lib/platformApi';

type View = 'signin' | 'register' | 'forgot' | 'reset';
type ServerStatus = 'CHECKING' | 'ONLINE' | 'OFFLINE';

const inputClass =
  'w-full px-3.5 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:border-white/[0.16] focus:border-accent focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(187,59,59,0.22)] text-sm text-cream placeholder-slate-500 outline-none transition-surface select-text';
const primaryButton =
  'w-full h-12 rounded-xl bg-gradient-to-b from-[#CC4545] to-accent hover:from-[#D45050] hover:to-[#B13636] text-white text-sm font-bold tracking-wide shadow-glow transition-[filter,transform] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60 cursor-default';
const linkButton = 'text-slate-400 hover:text-cream cursor-default transition-colors';

const SPARKS: Array<[number, number, number, number]> = [
  [96, 150, 3, 0],
  [318, 120, 2.4, 0.9],
  [330, 300, 3.2, 1.7],
  [78, 330, 2.2, 2.3],
  [250, 70, 2, 1.2],
  [150, 420, 2.6, 0.5],
];

/** Hero art for the sign-in card: a glowing crystal over a red orb, with a pointer parallax. Purely decorative. */
const HeroArt: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', String(((e.clientX - r.left) / r.width - 0.5) * 2));
    el.style.setProperty('--py', String(((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  const onLeave = () => {
    ref.current?.style.setProperty('--px', '0');
    ref.current?.style.setProperty('--py', '0');
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_30%,#5A1C20_0%,#2A1012_55%,#0B0405_100%)]" />
      <div className="auth-parallax absolute inset-0">
        <svg viewBox="0 0 400 560" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
          <defs>
            <radialGradient id="auth-orb" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#E25A5A" stopOpacity="0.85" />
              <stop offset="0.45" stopColor="#BB3B3B" stopOpacity="0.35" />
              <stop offset="1" stopColor="#BB3B3B" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="auth-gem-a" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FF8A8A" />
              <stop offset="1" stopColor="#BB3B3B" />
            </linearGradient>
            <linearGradient id="auth-gem-b" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#9C2B31" />
              <stop offset="1" stopColor="#4A1217" />
            </linearGradient>
          </defs>
          <circle className="auth-glow" cx="200" cy="230" r="190" fill="url(#auth-orb)" />
          <g className="auth-float-slow" opacity="0.9">
            <polygon points="70,250 98,196 120,262" fill="url(#auth-gem-b)" />
            <polygon points="98,196 120,262 112,228" fill="#E25A5A" opacity="0.55" />
            <polygon points="318,330 346,268 362,344" fill="url(#auth-gem-b)" />
            <polygon points="346,268 362,344 352,300" fill="#E25A5A" opacity="0.5" />
          </g>
          <g className="auth-float">
            <polygon points="120,170 200,110 200,200" fill="#7A1F25" />
            <polygon points="200,110 280,170 200,200" fill="url(#auth-gem-a)" />
            <polygon points="120,170 200,200 138,290" fill="#5A141A" />
            <polygon points="280,170 262,290 200,200" fill="#BB3B3B" />
            <polygon points="138,290 200,200 200,350" fill="#8E2A30" />
            <polygon points="262,290 200,350 200,200" fill="#A53232" />
            <path d="M120 170 200 110 280 170 262 290 200 350 138 290Z M200 110v90M120 170l80 30 80-30M138 290l62-90 62 90" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.2" strokeLinejoin="round" />
            <polygon points="200,110 232,134 200,152 168,134" fill="#fff" opacity="0.22" />
          </g>
          {SPARKS.map(([x, y, r, d]) => (
            <path
              key={x}
              className="auth-twinkle"
              style={{ animationDelay: `${d}s` }}
              d={`M${x} ${y - r * 3}L${x + r} ${y - r}L${x + r * 3} ${y}L${x + r} ${y + r}L${x} ${y + r * 3}L${x - r} ${y + r}L${x - r * 3} ${y}L${x - r} ${y - r}Z`}
              fill="#fff"
            />
          ))}
        </svg>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0B0405] via-[#0B0405]/60 to-transparent" />
    </div>
  );
};

/** Crystals that burst out of the card's left edge and a paint splash behind its corner. */
const PopOuts: React.FC = () => (
  <>
    <svg
      viewBox="0 0 170 230"
      className="hidden md:block absolute -left-[58px] top-[14%] w-[140px] h-auto z-20 pointer-events-none auth-shard-pop drop-shadow-[0_12px_24px_rgba(187,59,59,0.35)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="auth-shard-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF8A8A" />
          <stop offset="1" stopColor="#BB3B3B" />
        </linearGradient>
        <linearGradient id="auth-shard-b" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D24A4A" />
          <stop offset="1" stopColor="#5A141A" />
        </linearGradient>
      </defs>
      <g className="auth-float">
        <polygon points="4,96 112,18 150,120 70,148" fill="url(#auth-shard-b)" />
        <polygon points="112,18 150,120 70,148" fill="url(#auth-shard-a)" opacity="0.8" />
        <polygon points="4,96 70,148 30,176" fill="#7A1F25" />
        <path d="M4 96 112 18M70 148 150 120" stroke="#fff" strokeOpacity="0.3" strokeWidth="1.2" />
      </g>
      <g className="auth-float-slow">
        <polygon points="40,176 96,150 112,212 60,226" fill="url(#auth-shard-b)" />
        <polygon points="96,150 112,212 78,196" fill="#E25A5A" opacity="0.7" />
      </g>
    </svg>
    <svg
      viewBox="0 0 220 180"
      className="hidden md:block absolute -right-[46px] -bottom-[34px] w-[200px] h-auto pointer-events-none auth-pop"
      aria-hidden="true"
    >
      <path
        d="M30 120c-20-30 6-70 40-68 14-26 58-30 80-8 28-4 56 22 46 52 12 24-6 52-38 50-20 18-62 18-82-2-24 6-44-6-46-24z"
        fill="#BB3B3B"
        opacity="0.55"
      />
    </svg>
  </>
);

const strengthOf = (p: string) => {
  let n = 0;
  if (p.length >= 8) n++;
  if (p.length >= 12) n++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) n++;
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) n++;
  return p ? Math.max(1, n) : 0;
};

const StrengthMeter: React.FC<{ value: string }> = ({ value }) => {
  const n = strengthOf(value);
  const tone = n <= 1 ? 'bg-danger' : n === 2 ? 'bg-warning' : 'bg-success';
  return (
    <div className="flex gap-1 mt-2" aria-hidden="true">
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= n ? tone : 'bg-white/[0.1]'}`} />
      ))}
    </div>
  );
};

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
    signInWithGoogle,
    cancelGoogleSignIn,
    logout,
  } = useStore();

  const [view, setView] = useState<View>('signin');
  const [email, setEmail] = useState(() => platformApi.lastEmail());
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
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

  // The Google button only appears in the desktop app, and only when the service has it set up.
  useEffect(() => {
    if (!isAuthModalOpen) return;
    let active = true;
    void platformApi.googleAvailable().then((ok) => {
      if (active) setGoogleReady(ok);
    });
    return () => {
      active = false;
    };
  }, [isAuthModalOpen]);

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

  const handleGoogle = async () => {
    setErrorMessage(null);
    setNotice(null);
    setGoogleBusy(true);
    const res = await signInWithGoogle();
    setGoogleBusy(false);
    if (res.success) setCloseWhenReady(true);
    else setErrorMessage(res.error || 'Google sign-in did not finish.');
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
    serverStatus === 'ONLINE' ? 'bg-success' : serverStatus === 'OFFLINE' ? 'bg-slate-400' : 'bg-slate-500 led-pulse';

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
    setValue: (v: string) => void = setPassword,
    meter = false
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
      {meter && <StrengthMeter value={value} />}
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
        autoFocus={!readOnly && view !== 'register'}
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

  const heroTitle = needsVerification
    ? 'Almost there.'
    : view === 'signin'
      ? 'Welcome back.'
      : view === 'register'
        ? 'Join us and enjoy.'
        : "Let's get you in.";
  const heroText = needsVerification
    ? 'One quick code and your library is ready.'
    : view === 'register'
      ? 'Create an account to sync your library and launch games.'
      : view === 'signin'
        ? 'Sign in to sync your library and launch games with your account.'
        : 'We will email you a short code to set a new password.';

  return (
    <div
      className="auth-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[radial-gradient(70%_60%_at_50%_45%,rgba(120,28,34,0.45),rgba(0,0,0,0.82))] backdrop-blur-[3px] p-4 select-none"
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
          <div className="rounded-panel bg-cream text-[#0A0A0A] overflow-hidden shadow-modal">
            <div className="h-10 flex items-end justify-center bg-[#0A0A0A]">
              <span className="mb-2 w-16 h-2.5 rounded-full bg-bg-app ring-1 ring-white/10" />
            </div>
            <div className="p-6 pt-5 space-y-5">
              <div className="flex items-center gap-4">
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  className="w-16 h-16 rounded-2xl object-cover bg-[#0A0A0A]/10 ring-2 ring-[#0A0A0A]/20"
                />
                <div className="min-w-0">
                  <h2 id="auth-title" className="font-display text-2xl font-extrabold leading-tight truncate">
                    {currentUser.callsign}
                  </h2>
                  <p className="text-xs text-[#0A0A0A]/60 truncate">{currentUser.email}</p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                <div>
                  <dt className="text-[#0A0A0A]/50">Email</dt>
                  <dd className="font-semibold">Confirmed</dd>
                </div>
                <div>
                  <dt className="text-[#0A0A0A]/50">Games owned</dt>
                  <dd className="font-semibold tabular-nums">{currentUser.ownedGameIds.length}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[#0A0A0A]/50">Account ID</dt>
                  <dd className="font-mono text-[11px] truncate">{currentUser.id}</dd>
                </div>
              </dl>

              <div className="rounded-xl bg-[#0A0A0A]/[0.07] p-3.5">
                <div className="text-xs font-semibold">One-time launch pass</div>
                <p className="text-[11px] text-[#0A0A0A]/60 leading-snug mt-0.5">
                  Each launch hands the game a pass that works once for 60 seconds. Your password never reaches the game.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  onClick={logout}
                  className="px-3 h-10 rounded-full text-sm font-semibold text-[#E5484D] hover:bg-[#E5484D]/10 flex items-center gap-2 cursor-default transition-surface"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
                <button
                  onClick={closeAuthModal}
                  className="px-7 h-10 rounded-full bg-accent hover:bg-accent-hover text-sm font-bold text-white cursor-default active:scale-[0.97] transition-[background-color,transform]"
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
          className="relative w-full max-w-[880px] auth-pop"
        >
          <PopOuts />
          <div className="relative z-10 grid md:grid-cols-[1fr_1fr] rounded-[28px] overflow-hidden bg-[#1A0A0B] border border-white/[0.08] shadow-modal">
          {closeButton}
          <aside className="hidden md:block relative min-h-[520px] border-r border-white/[0.06]">
            <HeroArt />
            <div className="absolute inset-x-0 bottom-0 p-8">
              <p className="font-display text-[34px] text-white leading-[1.05]">{heroTitle}</p>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed max-w-[260px]">{heroText}</p>
            </div>
          </aside>

          <form key={needsVerification ? 'verify' : view} onSubmit={handleSubmit} className="auth-form p-8 space-y-5 self-center" noValidate>
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
                  {passwordField('auth-password', 'Password', 'new-password', 'At least 8 characters.', password, setPassword, true)}
                  {passwordField('auth-confirm', 'Confirm password', 'new-password', undefined, confirmPassword, setConfirmPassword)}
                </>
              ) : view === 'forgot' ? (
                emailField()
              ) : (
                <>
                  {emailField(true)}
                  {codeField}
                  {passwordField('auth-password', 'New password', 'new-password', 'At least 8 characters.', password, setPassword, true)}
                  {passwordField('auth-confirm', 'Confirm new password', 'new-password', undefined, confirmPassword, setConfirmPassword)}
                </>
              )}
            </div>

            <button type="submit" disabled={loading} className={primaryButton}>
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
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

            {googleReady && !needsVerification && (view === 'signin' || view === 'register') && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="h-px flex-1 bg-white/[0.08]" />
                  <span>or</span>
                  <span className="h-px flex-1 bg-white/[0.08]" />
                </div>
                {googleBusy ? (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.1] px-4 h-12 text-xs text-slate-300">
                    <span className="flex items-center gap-2.5">
                      <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                      Finish signing in with Google in your browser…
                    </span>
                    <button type="button" onClick={cancelGoogleSignIn} className={linkButton}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-white text-[#1f1f1f] hover:bg-slate-100 font-semibold text-sm flex items-center justify-center gap-2.5 transition-surface active:scale-[0.99] disabled:opacity-60 cursor-default"
                  >
                    <svg viewBox="0 0 48 48" className="w-[18px] h-[18px]" aria-hidden="true">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    Continue with Google
                  </button>
                )}
              </div>
            )}

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
        </div>
      )}
    </div>
  );
};
