import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  Game,
  DownloadItem,
  UserProfile,
  NavigationTab,
  AppSettings,
  ClientNotification,
  ToastNotification,
} from '../types/store';
import { platformApi, PlatformError, type AppInfo, type PlatformProduct, type PlatformUser } from '../lib/platformApi';
import { recordPlayDay } from '../lib/playLog';
import { LauncherBridge } from '../lib/launcherBridge';
import type { InstallProgress, InstallRecord } from '../types/launcher';

// Synthetic Tactical Audio Engine via Web Audio API (zero audio files needed)
const playSynthesizerSound = (type: 'click' | 'launch' | 'hover' | 'alert' | 'purchase', enabled: boolean) => {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'hover') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'launch') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(640, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } else if (type === 'purchase') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // Audio autoplay restrictions
  }
};

const GB = 1024 ** 3;
const MB = 1024 ** 2;
const ACTIVE_STATUSES: DownloadItem['status'][] = ['DOWNLOADING', 'VERIFYING', 'EXTRACTING'];

// Artwork that ships with the launcher, by product id. Games without any simply show no picture.
const ARTWORK: Record<string, string> = {
  railbound: './images/railbound-theme.jpg',
};

export const DEFAULT_GUEST_USER: UserProfile = {
  id: '',
  callsign: 'Guest',
  email: '',
  avatarUrl: initialsAvatar('Guest'),
  status: 'ONLINE',
  currentGame: undefined,
  ownedGameIds: [],
  emailVerified: false,
};

// A local avatar made from the display name: no third-party image service ever sees it.
function initialsAvatar(name: string): string {
  const initials = (name.trim().split(/s+/).map((w) => Array.from(w)[0] ?? '').join('').slice(0, 2) || '?').toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2a1a10"/><text x="32" y="41" font-family="Inter,Arial,sans-serif" font-size="26" font-weight="700" text-anchor="middle" fill="#ff9a3c">${initials.replace(/[<>&"']/g, '')}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const profileFrom = (me: PlatformUser, library: PlatformProduct[]): UserProfile => ({
  ...DEFAULT_GUEST_USER,
  id: me.userId,
  callsign: me.displayName,
  email: me.email,
  emailVerified: me.emailVerified,
  avatarUrl: initialsAvatar(me.displayName),
  ownedGameIds: library.map((p) => p.productId),
});

// What the launcher itself remembers per game on this PC: favourite, and play time counted while it runs.
interface LocalGameState {
  favorite?: boolean;
  playSeconds?: number;
  lastPlayedAt?: string;
}

const LOCAL_KEY = 'oneengine_game_local';
const SETTINGS_KEY = 'oneengine_settings';

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === 'object' ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable: nothing is remembered between runs
  }
};

const toGame = (
  product: PlatformProduct,
  local: LocalGameState,
  install: InstallRecord | undefined,
  download: DownloadItem | undefined,
  latestBuildId: string | undefined,
  running: boolean
): Game => {
  const art = ARTWORK[product.productId] ?? '';
  const price = product.price;
  const active = download && ACTIVE_STATUSES.includes(download.status);
  const status: Game['status'] = running
    ? 'RUNNING'
    : active
      ? 'DOWNLOADING'
      : download?.status === 'PAUSED'
        ? 'PAUSED'
        : install
          ? 'INSTALLED'
          : 'UNINSTALLED';
  return {
    id: product.productId,
    title: product.title,
    tagline: product.summary ?? '',
    description: product.summary ?? '',
    price: !price || price.amountMinor === 0 ? 'FREE' : price.amountMinor / 100,
    discountPercent: price?.discountPercent || undefined,
    coverImage: art,
    heroBanner: art,
    tags: product.tags,
    developer: product.developer ?? '',
    installed: !!install,
    installedVersion: install?.version,
    updateAvailable: !!install && !!latestBuildId && latestBuildId !== install.buildId,
    installSizeGb: install ? +(install.sizeBytes / GB).toFixed(2) : 0,
    isFavorite: !!local.favorite,
    playHours: +((local.playSeconds ?? 0) / 3600).toFixed(1),
    lastPlayed: local.lastPlayedAt,
    status,
    downloadProgress: download && download.status !== 'COMPLETED' ? download.progress : install ? 100 : 0,
  };
};

const applyProgress = (item: DownloadItem, p: InstallProgress): DownloadItem => {
  const received = p.received ?? item.receivedBytes;
  const total = p.total || item.totalBytes;
  const base = { ...item, receivedBytes: received, totalBytes: total };
  switch (p.phase) {
    case 'downloading': {
      const speed = p.speedBps ?? 0;
      return {
        ...base,
        status: 'DOWNLOADING',
        speedBps: speed,
        progress: total ? Math.min(100, (received / total) * 100) : 0,
        etaSeconds: speed > 0 ? Math.round((total - received) / speed) : 0,
        message: undefined,
      };
    }
    case 'verifying':
      return { ...base, status: 'VERIFYING', speedBps: 0, progress: 100, etaSeconds: 0 };
    case 'extracting':
      return { ...base, status: 'EXTRACTING', speedBps: 0, progress: 100, etaSeconds: 0 };
    case 'paused':
      return { ...base, status: 'PAUSED', speedBps: 0, etaSeconds: 0 };
    case 'error':
      return { ...base, status: 'FAILED', speedBps: 0, etaSeconds: 0, message: p.message };
    case 'done':
      return { ...base, status: 'COMPLETED', speedBps: 0, progress: 100, etaSeconds: 0 };
    default:
      return base;
  }
};

export type AuthResult = { success: boolean; error?: string };
export type CatalogStatus = 'loading' | 'ready' | 'error';

interface StoreContextType {
  activeTab: NavigationTab;
  selectedGameId: string;
  games: Game[];
  catalogStatus: CatalogStatus;
  catalogError: string;
  refreshCatalog: () => void;
  /** True inside the desktop app when this build includes game installs. */
  desktopAvailable: boolean;
  /** Game download, install and play are a later release; this build ships with them switched off. */
  gamesEnabled: boolean;
  appVersion: string;
  serviceConfigured: boolean;
  updateDisplayName: (displayName: string) => Promise<AuthResult>;
  downloads: DownloadItem[];
  currentUser: UserProfile;
  searchQuery: string;
  isAuthModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  settings: AppSettings;
  runningGameId: string | null;
  launchingGameId: string | null;
  sessionElapsedSeconds: number;
  /** Recent download speed samples in MB/s, one per second while something downloads. */
  speedTelemetryHistory: number[];
  notifications: ClientNotification[];
  toasts: ToastNotification[];
  canGoBack: boolean;
  canGoForward: boolean;

  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  register: (email: string, password: string, displayName: string) => Promise<AuthResult>;
  verifyEmail: (code: string) => Promise<AuthResult>;
  resendVerification: () => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  logout: () => void;

  navigate: (tab: NavigationTab, gameId?: string) => void;
  goBack: () => void;
  goForward: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  startDownload: (gameId: string) => void;
  pauseDownload: (gameId: string) => void;
  resumeDownload: (gameId: string) => void;
  cancelDownload: (gameId: string) => void;
  launchGame: (gameId: string) => void;
  stopGame: (gameId: string) => void;
  uninstallGame: (gameId: string) => Promise<void>;
  toggleFavorite: (gameId: string) => void;
  purchaseGame: (gameId: string) => Promise<boolean>;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  playTactileSound: (type: 'click' | 'launch' | 'hover' | 'alert' | 'purchase') => void;
  addToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
  removeToast: (id: string) => void;
  markAllNotificationsRead: () => void;
  verifyGameFiles: (gameId?: string) => Promise<void>;
  minimizeWindow: () => void;
  toggleMaximizeWindow: () => void;
  closeWindow: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('store');
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [catalog, setCatalog] = useState<PlatformProduct[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<CatalogStatus>('loading');
  const [catalogError, setCatalogError] = useState('');
  const [catalogTick, setCatalogTick] = useState(0);
  const [installs, setInstalls] = useState<Record<string, InstallRecord>>({});
  const [latestBuilds, setLatestBuilds] = useState<Record<string, string>>({});
  const [localState, setLocalState] = useState<Record<string, LocalGameState>>(() => readJson(LOCAL_KEY, {}));
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_GUEST_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [runningGameId, setRunningGameId] = useState<string | null>(null);
  const [launchingGameId, setLaunchingGameId] = useState<string | null>(null);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState<number>(0);
  const [speedTelemetryHistory, setSpeedTelemetryHistory] = useState<number[]>([]);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Navigation History Stack
  const [history, setHistory] = useState<Array<{ tab: NavigationTab; gameId?: string }>>([{ tab: 'store' }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = readJson<Partial<AppSettings>>(SETTINGS_KEY, {});
    return {
      downloadDirectory: typeof saved.downloadDirectory === 'string' ? saved.downloadDirectory : '',
      enableTactileAudio: saved.enableTactileAudio !== false,
      bandwidthLimitMBps: typeof saved.bandwidthLimitMBps === 'number' ? saved.bandwidthLimitMBps : 0,
    };
  });

  // What this installation says about itself (version, service address, which features are switched on).
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  useEffect(() => {
    let active = true;
    void platformApi.init().then((info) => {
      LauncherBridge.setEnabled(info.gamesEnabled);
      if (active) setAppInfo(info);
    });
    return () => {
      active = false;
    };
  }, []);
  const gamesEnabled = !!appInfo?.gamesEnabled;

  const games = useMemo<Game[]>(
    () =>
      catalog.map((p) =>
        toGame(
          p,
          localState[p.productId] ?? {},
          installs[p.productId],
          downloads.find((d) => d.gameId === p.productId),
          latestBuilds[p.productId],
          runningGameId === p.productId
        )
      ),
    [catalog, localState, installs, downloads, latestBuilds, runningGameId]
  );

  // Event handlers registered once need the latest values without re-subscribing.
  const settingsRef = useRef(settings);
  const gamesRef = useRef(games);
  const downloadsRef = useRef(downloads);
  const userRef = useRef(currentUser);
  const launchedAt = useRef<Record<string, number>>({});
  const stoppedByUser = useRef<Set<string>>(new Set());
  const lastSpeedSample = useRef(0);
  useEffect(() => {
    settingsRef.current = settings;
    gamesRef.current = games;
    downloadsRef.current = downloads;
    userRef.current = currentUser;
  });

  useEffect(() => {
    writeJson(LOCAL_KEY, localState);
  }, [localState]);

  useEffect(() => {
    writeJson(SETTINGS_KEY, {
      downloadDirectory: settings.downloadDirectory,
      enableTactileAudio: settings.enableTactileAudio,
      bandwidthLimitMBps: settings.bandwidthLimitMBps,
    });
  }, [settings.downloadDirectory, settings.enableTactileAudio, settings.bandwidthLimitMBps]);

  // Sound wrapper
  const triggerSound = (type: 'click' | 'launch' | 'hover' | 'alert' | 'purchase') => {
    playSynthesizerSound(type, settingsRef.current.enableTactileAudio);
  };

  const addToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const notify = (title: string, description: string, type: ClientNotification['type'] = 'system') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNotifications((prev) =>
      [{ id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, title, description, time, read: false, type }, ...prev].slice(0, 30)
    );
  };

  // The catalog (titles, prices, discounts) is the server's.
  useEffect(() => {
    let active = true;
    setCatalogStatus('loading');
    platformApi
      .catalog()
      .then((items) => {
        if (!active) return;
        setCatalog(items.filter((i) => i.kind === 'game'));
        setCatalogStatus('ready');
        setCatalogError('');
      })
      .catch((e) => {
        if (!active) return;
        setCatalogStatus('error');
        setCatalogError(e instanceof Error ? e.message : 'The game catalog could not be loaded.');
      });
    return () => {
      active = false;
    };
  }, [catalogTick]);

  // Open the first game when the page has none selected yet.
  useEffect(() => {
    if (!selectedGameId && catalog.length > 0) setSelectedGameId(catalog[0].productId);
  }, [catalog, selectedGameId]);

  // The install folder defaults to a per-user folder chosen by the desktop app.
  useEffect(() => {
    if (settings.downloadDirectory || !LauncherBridge.isAvailable()) return;
    void LauncherBridge.defaultLibraryDir().then((dir) => {
      if (dir) setSettings((prev) => (prev.downloadDirectory ? prev : { ...prev, downloadDirectory: dir }));
    });
  }, [settings.downloadDirectory, gamesEnabled]);

  // What is installed is read from the disk, never remembered.
  const rescanInstalls = async (dir: string) => {
    if (!dir || !LauncherBridge.isAvailable()) {
      setInstalls({});
      return;
    }
    const found = await LauncherBridge.scan(dir);
    setInstalls(Object.fromEntries(found.map((r) => [r.gameId, r])));
  };
  useEffect(() => {
    void rescanInstalls(settings.downloadDirectory);
  }, [settings.downloadDirectory, gamesEnabled]);

  // Sign back in on startup from the session the desktop app saved (encrypted) last time.
  useEffect(() => {
    // Profiles cached by older builds (including offline passes) are never trusted.
    try {
      localStorage.removeItem('oneengine_user_profile');
      localStorage.removeItem('oneengine_dev_identity');
    } catch {
      // ignore
    }
    let active = true;
    (async () => {
      try {
        if (!(await platformApi.restore())) return;
        const me = await platformApi.me();
        const library = me.emailVerified ? await platformApi.library() : [];
        if (active) {
          setCurrentUser(profileFrom(me, library));
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.warn('[OneEngine] Session restore:', e);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // For every installed game the player owns, ask the server whether a newer build exists.
  const installedKey = Object.values(installs)
    .map((r) => r.gameId)
    .sort()
    .join(',');
  useEffect(() => {
    if (!isAuthenticated || !currentUser.emailVerified || !installedKey) return;
    let active = true;
    const owned = installedKey.split(',').filter((id) => currentUser.ownedGameIds.includes(id));
    owned.forEach((id) => {
      platformApi
        .latestBuild(id)
        .then((b) => {
          if (active) setLatestBuilds((prev) => (prev[id] === b.buildId ? prev : { ...prev, [id]: b.buildId }));
        })
        .catch(() => {
          // no build published, or the service is unreachable: nothing to offer
        });
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated, currentUser.emailVerified, currentUser.ownedGameIds, installedKey]);

  // Keyboard shortcut listener for Command Palette (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        // Close topmost overlay only (priority: CommandPalette > AuthModal)
        setIsCommandPaletteOpen((prev) => {
          if (prev) return false;
          setIsAuthModalOpen((prevM) => (prevM ? false : prevM));
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Running game session timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (runningGameId) {
      timer = setInterval(() => {
        setSessionElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSessionElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [runningGameId]);

  // Live progress from the installer in the desktop app's main process.
  useEffect(() => {
    return LauncherBridge.onInstallProgress((p) => {
      setDownloads((prev) => prev.map((d) => (d.gameId === p.gameId ? applyProgress(d, p) : d)));
      const now = Date.now();
      if (p.phase === 'downloading' && p.speedBps && now - lastSpeedSample.current >= 1000) {
        lastSpeedSample.current = now;
        setSpeedTelemetryHistory((prev) => [...prev.slice(-59), +(p.speedBps! / MB).toFixed(1)]);
      }
    });
  }, []);

  // A game process ended, whether the player closed it or we did: bank the play time.
  useEffect(() => {
    return LauncherBridge.onGameExited(({ gameId, code }) => {
      const startedAt = launchedAt.current[gameId];
      delete launchedAt.current[gameId];
      if (startedAt) {
        const seconds = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
        setLocalState((prev) => ({
          ...prev,
          [gameId]: {
            ...prev[gameId],
            playSeconds: (prev[gameId]?.playSeconds ?? 0) + seconds,
            lastPlayedAt: new Date().toISOString(),
          },
        }));
      }
      setRunningGameId((current) => (current === gameId ? null : current));
      setLaunchingGameId((current) => (current === gameId ? null : current));
      setCurrentUser((prev) => ({ ...prev, status: 'ONLINE', currentGame: undefined }));
      if (stoppedByUser.current.delete(gameId)) return;
      if (code !== 0 && code !== null) {
        addToast(`The game closed unexpectedly (exit code ${code}).`, 'warning');
      }
    });
  }, []);

  const navigate = (tab: NavigationTab, gameId?: string) => {
    triggerSound('click');
    const targetGameId = gameId || selectedGameId;
    if (gameId) {
      setSelectedGameId(gameId);
    }
    setActiveTab(tab);

    // Push to history stack (truncate forward history if branched)
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, { tab, gameId: targetGameId }];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { __navigate?: typeof navigate; __openAuthModal?: () => void }).__navigate = navigate;
      (window as unknown as { __navigate?: typeof navigate; __openAuthModal?: () => void }).__openAuthModal = () => setIsAuthModalOpen(true);
    }
  }, [navigate]);

  const goBack = () => {
    if (historyIndex > 0) {
      triggerSound('click');
      const prevEntry = history[historyIndex - 1];
      setHistoryIndex((prev) => prev - 1);
      setActiveTab(prevEntry.tab);
      if (prevEntry.gameId) setSelectedGameId(prevEntry.gameId);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      triggerSound('click');
      const nextEntry = history[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      setActiveTab(nextEntry.tab);
      if (nextEntry.gameId) setSelectedGameId(nextEntry.gameId);
    }
  };

  // ---------------------------------------------------------------- install / update
  const GAMES_LATER = 'Game downloads and play arrive in a later update.';

  const startDownload = async (gameId: string) => {
    triggerSound('click');
    if (!gamesEnabled) {
      addToast(GAMES_LATER, 'info');
      return;
    }
    const game = gamesRef.current.find((g) => g.id === gameId);
    if (!game) return;
    if (!LauncherBridge.isAvailable()) {
      addToast('Installing games needs the OneEngine Store desktop app.', 'warning');
      return;
    }
    if (!isAuthenticated) {
      addToast('Sign in to install games.', 'warning');
      setIsAuthModalOpen(true);
      return;
    }
    if (!userRef.current.ownedGameIds.includes(gameId)) {
      addToast('Add this game to your library first.', 'warning');
      return;
    }
    if (downloadsRef.current.some((d) => d.gameId === gameId && ACTIVE_STATUSES.includes(d.status))) return;

    const libraryDir = settingsRef.current.downloadDirectory;
    let build;
    try {
      build = await platformApi.latestBuild(gameId);
    } catch (err) {
      reportApiError(err, 'Could not get the download.');
      return;
    }

    setDownloads((prev) => [
      {
        gameId,
        title: game.title,
        coverImage: game.coverImage,
        progress: 0,
        receivedBytes: 0,
        totalBytes: build.sizeBytes,
        speedBps: 0,
        status: 'DOWNLOADING',
        etaSeconds: 0,
        version: build.version,
      },
      ...prev.filter((d) => d.gameId !== gameId),
    ]);
    addToast(`${game.installed ? 'Updating' : 'Installing'} ${game.title}…`, 'info');

    const result = await LauncherBridge.install(gameId, libraryDir, build, settingsRef.current.bandwidthLimitMBps);

    if (result.status === 'done') {
      if (result.install) setInstalls((prev) => ({ ...prev, [gameId]: result.install! }));
      setLatestBuilds((prev) => ({ ...prev, [gameId]: build.buildId }));
      setDownloads((prev) =>
        prev.map((d) => (d.gameId === gameId ? { ...d, status: 'COMPLETED', progress: 100, speedBps: 0, etaSeconds: 0 } : d))
      );
      triggerSound('purchase');
      addToast(`${game.title} is installed and verified.`, 'success');
      notify(`${game.title} ${build.version} installed`, 'The download matched its checksum and is ready to play.', 'update');
    } else if (result.status === 'cancelled') {
      setDownloads((prev) => prev.filter((d) => d.gameId !== gameId));
    } else if (result.status === 'error') {
      const message = result.message || 'The install failed.';
      setDownloads((prev) =>
        prev.map((d) => (d.gameId === gameId ? { ...d, status: 'FAILED', speedBps: 0, etaSeconds: 0, message } : d))
      );
      triggerSound('alert');
      addToast(message, 'warning');
      notify(`${game.title} could not be installed`, message);
    }
  };

  const pauseDownload = (gameId: string) => {
    triggerSound('click');
    void LauncherBridge.pauseInstall(gameId);
  };

  // A paused download continues from the partial file, with a fresh download link from the server.
  const resumeDownload = (gameId: string) => {
    void startDownload(gameId);
  };

  const cancelDownload = async (gameId: string) => {
    triggerSound('click');
    const item = downloadsRef.current.find((d) => d.gameId === gameId);
    if (item?.status === 'COMPLETED') {
      setDownloads((prev) => prev.filter((d) => d.gameId !== gameId));
      return;
    }
    await LauncherBridge.cancelInstall(settingsRef.current.downloadDirectory, gameId);
    setDownloads((prev) => prev.filter((d) => d.gameId !== gameId));
    addToast('Download cancelled.', 'warning');
  };

  const uninstallGame = async (gameId: string) => {
    triggerSound('click');
    const title = gamesRef.current.find((g) => g.id === gameId)?.title ?? 'the game';
    const res = await LauncherBridge.uninstall(settingsRef.current.downloadDirectory, gameId);
    if (!res.ok) {
      triggerSound('alert');
      addToast(res.message || `Could not uninstall ${title}.`, 'warning');
      return;
    }
    setInstalls((prev) => {
      const { [gameId]: _removed, ...rest } = prev;
      return rest;
    });
    setDownloads((prev) => prev.filter((d) => d.gameId !== gameId));
    addToast(`${title} was uninstalled.`, 'info');
  };

  const verifyGameFiles = async (gameId?: string) => {
    triggerSound('click');
    const targets = gameId ? gamesRef.current.filter((g) => g.id === gameId) : gamesRef.current.filter((g) => g.installed);
    if (targets.length === 0) {
      addToast('No installed games to check.', 'info');
      return;
    }
    for (const g of targets) {
      const res = await LauncherBridge.verify(settingsRef.current.downloadDirectory, g.id);
      addToast(res.ok ? `${g.title}: files are intact.` : `${g.title}: ${res.message}`, res.ok ? 'success' : 'warning');
    }
  };

  // ---------------------------------------------------------------- play
  const launchGame = async (gameId: string) => {
    triggerSound('click');
    if (!gamesEnabled) {
      addToast(GAMES_LATER, 'info');
      return;
    }
    if (!isAuthenticated || !currentUser.id) {
      triggerSound('alert');
      addToast('Sign in with your OneEngine account to play.', 'warning');
      setIsAuthModalOpen(true);
      return;
    }
    const target = gamesRef.current.find((g) => g.id === gameId);
    if (!target?.installed) {
      addToast('Install the game first.', 'warning');
      return;
    }
    if (target.updateAvailable) {
      addToast(`${target.title} has an update. Update it before playing.`, 'info');
      return;
    }
    if (runningGameId) return;
    setLaunchingGameId(gameId);

    // The server decides whether this player owns the game and hands back a one-time ticket.
    // The game trades the ticket for a Nakama session; no password or session token is passed on.
    let ticket: string;
    try {
      ticket = (await platformApi.launchTicket(gameId)).ticket;
    } catch (err) {
      setLaunchingGameId(null);
      reportApiError(err, 'Could not start the game.');
      return;
    }

    const result = await LauncherBridge.launchGame({
      libraryDir: settingsRef.current.downloadDirectory,
      gameId,
      ticket,
      playerName: currentUser.callsign,
      userId: currentUser.id,
    });
    setLaunchingGameId(null);
    if (!result.success) {
      triggerSound('alert');
      addToast(result.message || 'The game did not start.', 'warning');
      return;
    }

    recordPlayDay();
    launchedAt.current[gameId] = Date.now();
    triggerSound('launch');
    setRunningGameId(gameId);
    setSessionElapsedSeconds(0);
    setCurrentUser((prev) => ({ ...prev, status: 'IN_GAME', currentGame: target.title }));
    addToast(`${target.title} is starting.`, 'success');
  };

  const stopGame = async (gameId: string) => {
    triggerSound('click');
    stoppedByUser.current.add(gameId);
    const killed = await LauncherBridge.killGame(gameId);
    if (!killed) {
      // Nothing to kill (already gone): make sure the launcher does not keep showing it as running.
      stoppedByUser.current.delete(gameId);
      setRunningGameId((current) => (current === gameId ? null : current));
      setCurrentUser((prev) => ({ ...prev, status: 'ONLINE', currentGame: undefined }));
    } else {
      addToast('Closing the game…', 'info');
    }
  };

  const toggleFavorite = (gameId: string) => {
    triggerSound('click');
    setLocalState((prev) => ({ ...prev, [gameId]: { ...prev[gameId], favorite: !prev[gameId]?.favorite } }));
  };

  // Ownership is the server's call. In development the API lets any signed-in player claim a game;
  // in production it answers "payment required" until the checkout flow exists.
  const purchaseGame = async (gameId: string): Promise<boolean> => {
    const target = gamesRef.current.find((g) => g.id === gameId);
    if (!target) return false;
    if (!gamesEnabled) {
      addToast(GAMES_LATER, 'info');
      return false;
    }
    if (!isAuthenticated) {
      triggerSound('alert');
      addToast('Sign in to add games to your library.', 'warning');
      setIsAuthModalOpen(true);
      return false;
    }
    try {
      await platformApi.claim(gameId);
      const library = await platformApi.library();
      triggerSound('purchase');
      setCurrentUser((prev) => ({ ...prev, ownedGameIds: library.map((p) => p.productId) }));
      addToast(`${target.title} added to your library.`, 'success');
      return true;
    } catch (err) {
      reportApiError(err, 'Could not add this game.');
      return false;
    }
  };

  // ---------------------------------------------------------------- account
  const failure = (err: unknown): AuthResult => {
    triggerSound('alert');
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  };

  const startSession = async (me: PlatformUser) => {
    const library = me.emailVerified ? await platformApi.library() : [];
    const profile = profileFrom(me, library);
    setCurrentUser(profile);
    setIsAuthenticated(true);
    return profile;
  };

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    triggerSound('click');
    try {
      const profile = await startSession(await platformApi.login(email, password));
      addToast(`Welcome back, ${profile.callsign}!`, 'success');
      return { success: true };
    } catch (err) {
      return failure(err);
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<AuthResult> => {
    triggerSound('click');
    try {
      const profile = await startSession(await platformApi.register(email, password, displayName));
      addToast(
        profile.emailVerified ? `Account created. Welcome, ${profile.callsign}!` : 'Account created. Check your email for a code.',
        'success'
      );
      return { success: true };
    } catch (err) {
      return failure(err);
    }
  };

  const updateDisplayName = async (displayName: string): Promise<AuthResult> => {
    triggerSound('click');
    try {
      const me = await platformApi.updateProfile(displayName);
      setCurrentUser((prev) => ({ ...prev, callsign: me.displayName, avatarUrl: initialsAvatar(me.displayName) }));
      addToast('Display name updated.', 'success');
      return { success: true };
    } catch (err) {
      return failure(err);
    }
  };

  const refreshProfile = async () => {
    const me = await platformApi.me();
    await startSession(me);
  };

  const verifyEmail = async (code: string): Promise<AuthResult> => {
    triggerSound('click');
    try {
      await platformApi.verifyEmail(code);
      await refreshProfile();
      addToast('Email confirmed. You can add games and play now.', 'success');
      return { success: true };
    } catch (err) {
      return failure(err);
    }
  };

  const resendVerification = async (): Promise<AuthResult> => {
    try {
      await platformApi.resendVerification();
      addToast('A new code is on its way.', 'info');
      return { success: true };
    } catch (err) {
      return failure(err);
    }
  };

  const forgotPassword = async (email: string): Promise<AuthResult> => {
    try {
      await platformApi.forgotPassword(email);
      return { success: true };
    } catch (err) {
      return failure(err);
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<AuthResult> => {
    try {
      await platformApi.resetPassword(email, code, newPassword);
      addToast('Password changed. Sign in with the new one.', 'success');
      return { success: true };
    } catch (err) {
      return failure(err);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
    try {
      await platformApi.changePassword(currentPassword, newPassword);
      addToast('Password changed. Other devices were signed out.', 'success');
      return { success: true };
    } catch (err) {
      return failure(err);
    }
  };

  /** Shows an API error as a toast; a lost session or an unconfirmed email also opens the sign-in window. */
  const reportApiError = (err: unknown, fallback: string) => {
    triggerSound('alert');
    const message = err instanceof Error ? err.message : fallback;
    addToast(message, 'warning');
    if (err instanceof PlatformError) {
      if (err.code === 'auth_required' || err.code === 'auth_invalid') {
        setIsAuthenticated(false);
        setCurrentUser(DEFAULT_GUEST_USER);
        setIsAuthModalOpen(true);
      } else if (err.code === 'email_not_verified') {
        setCurrentUser((prev) => ({ ...prev, emailVerified: false }));
        setIsAuthModalOpen(true);
      }
    }
  };

  const logout = () => {
    triggerSound('click');
    if (runningGameId) {
      void stopGame(runningGameId);
    }
    void platformApi.logout();
    setCurrentUser(DEFAULT_GUEST_USER);
    setIsAuthenticated(false);
    setLatestBuilds({});
    addToast('Signed out from OneEngine.', 'info');
  };

  const markAllNotificationsRead = () => {
    triggerSound('click');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    triggerSound('click');
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      return next;
    });
    addToast('Preferences updated', 'info');
  };

  // Window controls
  const minimizeWindow = async () => {
    triggerSound('click');
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.minimizeWindow();
    }
  };

  const toggleMaximizeWindow = async () => {
    triggerSound('click');
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.maximizeWindow();
    }
  };

  const closeWindow = async () => {
    triggerSound('click');
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.closeWindow();
    }
  };

  return (
    <StoreContext.Provider
      value={{
        activeTab,
        selectedGameId,
        games,
        catalogStatus,
        catalogError,
        refreshCatalog: () => setCatalogTick((n) => n + 1),
        desktopAvailable: LauncherBridge.isAvailable(),
        gamesEnabled,
        appVersion: appInfo?.version ?? '',
        serviceConfigured: appInfo ? appInfo.serviceConfigured : true,
        updateDisplayName,
        downloads,
        currentUser,
        isAuthenticated,
        signIn,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        changePassword,
        logout,
        searchQuery,
        isAuthModalOpen,
        isCommandPaletteOpen,
        settings,
        runningGameId,
        launchingGameId,
        sessionElapsedSeconds,
        speedTelemetryHistory,
        notifications,
        toasts,
        canGoBack: historyIndex > 0,
        canGoForward: historyIndex < history.length - 1,
        navigate,
        goBack,
        goForward,
        openAuthModal: () => {
          triggerSound('click');
          setIsAuthModalOpen(true);
        },
        closeAuthModal: () => setIsAuthModalOpen(false),
        setCommandPaletteOpen: setIsCommandPaletteOpen,
        setSearchQuery,
        startDownload,
        pauseDownload,
        resumeDownload,
        cancelDownload,
        launchGame,
        stopGame,
        uninstallGame,
        toggleFavorite,
        purchaseGame,
        updateSettings,
        playTactileSound: triggerSound,
        addToast,
        removeToast,
        markAllNotificationsRead,
        verifyGameFiles,
        minimizeWindow,
        toggleMaximizeWindow,
        closeWindow,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
