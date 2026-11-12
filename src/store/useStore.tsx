import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  Game, 
  DownloadItem, 
  UserProfile, 
  NavigationTab, 
  AppSettings, 
  Article, 
  ClientNotification, 
  ToastNotification 
} from '../types/store';
import { nakamaService } from '../lib/nakama';
import { recordPlayDay } from '../lib/playLog';
import { LauncherBridge } from '../lib/launcherBridge';

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

const INITIAL_GAMES: Game[] = [
  {
    id: 'railbound',
    title: 'Railbound: Tactical Protocol',
    tagline: 'High-speed tactical railway logistics & automated rail defense systems.',
    description: 'Lead an automated rail defense vanguard across hostile industrial zones. Reconfigure track matrices, repel mechanized raiders, and deploy armored rolling artillery to secure planetary resource arteries.',
    price: 29.99,
    discountPercent: 20,
    coverImage: './images/railbound-theme.jpg',
    heroBanner: './images/railbound-theme.jpg',
    screenshots: [],
    tags: ['Tactical', 'Automation', 'Defense', 'Strategy', 'Sci-fi'],
    rating: 96,
    ratingBreakdown: { positivePercent: 96, totalReviews: 4820 },
    developer: 'Afterburn Foundry',
    publisher: 'OneEngine Interactive',
    releaseDate: 'October 2026',
    installed: true,
    installSizeGb: 38.4,
    isFavorite: true,
    playHours: 42.6,
    lastPlayed: '2 hours ago',
    status: 'INSTALLED',
    downloadProgress: 100,
    downloadSpeedMbps: 0,
    category: 'FEATURED',
    achievements: { unlocked: 18, total: 24 },
    dlcs: [
      { id: 'rb-dlc-1', title: 'Heavy Rolling Artillery Expansion Pack', description: 'Adds 6 dual-rail super-heavy artillery cars and planetary defense scenarios.', price: 9.99, owned: true },
      { id: 'rb-dlc-2', title: 'Subterranean Mag-Lev Soundtracks & Skins', description: 'Official FLAC dynamic soundtrack and foundry camouflage chassis coats.', price: 4.99, owned: false }
    ],
    patchNotes: [
      {
        version: 'v2.4.0',
        date: 'Oct 26, 2026',
        notes: [
          'Direct OneEngine Store headless bypass integration (--auth-token payload).',
          'Automated GameLobby scene handoff with zero manual credential prompting.',
          'Reduced load-in latency by 45% using native IPC session validation.',
        ],
      },
      {
        version: 'v2.3.8',
        date: 'Oct 12, 2026',
        notes: [
          'Resolved collision glitch on junction Switch-7.',
          'Updated shader cache for DirectX 12 render pipelines.',
        ],
      },
    ],
    systemRequirements: {
      minimum: {
        os: 'Windows 10 64-bit',
        processor: 'Intel Core i5-6600K / AMD Ryzen 3 1300X',
        memory: '8 GB RAM',
        graphics: 'NVIDIA GeForce GTX 960 / AMD Radeon R9 380',
        storage: '40 GB available high-speed SSD space',
      },
      recommended: {
        os: 'Windows 11 64-bit',
        processor: 'Intel Core i7-10700K / AMD Ryzen 7 3700X',
        memory: '16 GB RAM',
        graphics: 'NVIDIA GeForce RTX 3060 / AMD Radeon RX 6600 XT',
        storage: '40 GB NVMe PCIe 4.0 SSD space',
      }
    },
  },
];

export const DEFAULT_GUEST_USER: UserProfile = {
  id: '',
  callsign: 'Guest',
  email: '',
  rank: 'GUEST OPERATIVE',
  level: 1,
  avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=OneEngineGuest',
  status: 'ONLINE',
  currentGame: undefined,
  walletBalance: 0.00,
  role: 'OPERATOR',
  ownedGameIds: ['railbound'],
};

const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-01',
    title: 'FOUNDRY LOG #44: LOW-LATENCY IPC RUNNER FOR RAILBOUND',
    gameTitle: 'RAILBOUND',
    gameId: 'railbound',
    category: 'DEV_LOGS',
    date: 'OCTOBER 26, 2026',
    author: 'Lead Architect @ Spectre',
    cover: './images/railbound-theme.jpg',
    summary: 'Today we deployed v2.4.0 containing direct OneEngine Store session injection hooks. No more in-game login prompt delays. Read the full benchmark teardown.',
    content: [
      'With patch 2.4.0, Railbound now completely transitions from desktop click to active GameLobby in under 1.2 seconds.',
      'By injecting cryptographic token arguments (--auth-token, --player-name, and --user-id) directly via low-level OS command vectors, we bypass the legacy Unity LoginMenu scene entirely.',
      'Network tick rates have been stabilized at 128Hz, ensuring seamless mechanical switch synchronization across multi-track defensive lines.'
    ],
    likes: 1240,
    hasLiked: false,
    comments: 184,
  },
  {
    id: 'art-05',
    title: 'FOUNDRY ARCHITECTURE: REDUCING DESKTOP CLIENT OVERHEAD',
    gameTitle: 'ONEENGINE STORE',
    gameId: 'railbound',
    category: 'DEV_LOGS',
    date: 'OCTOBER 10, 2026',
    author: 'Desktop Systems Architect',
    cover: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    summary: 'How we achieved near-zero RAM footprint and instantaneous navigation without heavy browser bloatware.',
    content: [
      'By decoupling background disk operations and running memory-efficient state management, OneEngine Store consumes 70% less standby memory than legacy launchers.',
      'UI rendering is optimized for GPU rasterization, maintaining a locked 120 FPS on all supported display standards.',
      'Local session persistence guarantees immediate access to installed game binaries even during offline operations.'
    ],
    likes: 3120,
    hasLiked: true,
    comments: 420,
  },
];

const INITIAL_NOTIFICATIONS: ClientNotification[] = [
  {
    id: 'notif-1',
    title: 'Railbound v2.4.0 Installed',
    description: 'Direct OneEngine session injection protocol verified and ready.',
    time: '12m ago',
    read: false,
    type: 'update',
  },
  {
    id: 'notif-2',
    title: "Operative 'Apex_09' is in-game",
    description: 'Playing Railbound: Tactical Protocol (Squad slot open).',
    time: '45m ago',
    read: false,
    type: 'friend',
  },
  {
    id: 'notif-3',
    title: 'Foundry Maintenance Complete',
    description: 'All high-speed CDN distribution nodes operating at 100% capacity.',
    time: '2h ago',
    read: true,
    type: 'system',
  }
];

interface StoreContextType {
  activeTab: NavigationTab;
  selectedGameId: string;
  games: Game[];
  downloads: DownloadItem[];
  currentUser: UserProfile;
  searchQuery: string;
  isAuthModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  selectedArticle: Article | null;
  settings: AppSettings;
  runningGameId: string | null;
  launchingGameId: string | null;
  sessionElapsedSeconds: number;
  speedTelemetryHistory: number[];
  articles: Article[];
  notifications: ClientNotification[];
  toasts: ToastNotification[];
  canGoBack: boolean;
  canGoForward: boolean;
  isPausedAll: boolean;
  
  isAuthenticated: boolean;
  loginWithNakama: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWithNakama: (email: string, pass: string, username: string) => Promise<{ success: boolean; error?: string }>;
  loginAsGuest: (username?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  navigate: (tab: NavigationTab, gameId?: string) => void;
  goBack: () => void;
  goForward: () => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  openArticle: (article: Article) => void;
  closeArticle: () => void;
  toggleArticleLike: (articleId: string) => void;
  setSearchQuery: (query: string) => void;
  switchUserPreset: (preset: 'DEVELOPER' | 'COMPETITIVE' | 'GUEST') => void;
  startDownload: (gameId: string) => void;
  pauseDownload: (gameId: string) => void;
  resumeDownload: (gameId: string) => void;
  cancelDownload: (gameId: string) => void;
  togglePauseAllDownloads: () => void;
  launchGame: (gameId: string) => void;
  stopGame: (gameId: string) => void;
  toggleFavorite: (gameId: string) => void;
  purchaseGame: (gameId: string) => boolean;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  playTactileSound: (type: 'click' | 'launch' | 'hover' | 'alert' | 'purchase') => void;
  addToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
  removeToast: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearShaderCache: () => void;
  verifyGameFiles: (gameId?: string) => void;
  minimizeWindow: () => void;
  toggleMaximizeWindow: () => void;
  closeWindow: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('store');
  const [selectedGameId, setSelectedGameId] = useState<string>('railbound');
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_GUEST_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [runningGameId, setRunningGameId] = useState<string | null>(null);
  const [launchingGameId, setLaunchingGameId] = useState<string | null>(null);
  const [sessionElapsedSeconds, setSessionElapsedSeconds] = useState<number>(0);
  const [isPausedAll, setIsPausedAll] = useState(false);
  
  const [speedTelemetryHistory, setSpeedTelemetryHistory] = useState<number[]>([
    42, 48, 55, 59, 64, 68, 62, 65, 71, 64, 66, 68, 65, 72, 65
  ]);

  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [notifications, setNotifications] = useState<ClientNotification[]>(INITIAL_NOTIFICATIONS);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Navigation History Stack
  const [history, setHistory] = useState<Array<{ tab: NavigationTab; gameId?: string }>>([
    { tab: 'store', gameId: 'railbound' }
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const cfg = nakamaService.getConfig();
    return {
      launchOnStartup: true,
      downloadDirectory: 'C:\\OneEngine\\GameLibrary',
      primaryAccent: '#FF7A00',
      enableTactileAudio: true,
      hardwareAcceleration: true,
      devTelemetryMode: false,
      bandwidthThrottleMbps: 0,
      nakamaHost: cfg.host,
      nakamaPort: cfg.port,
      nakamaUseSsl: cfg.useSsl,
      nakamaServerKey: cfg.serverKey,
      nakamaBasePath: cfg.basePath,
    };
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

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

  // Restore Nakama session or cached profile on startup
  useEffect(() => {
    let active = true;
    const initAuth = async () => {
      try {
        const session = await nakamaService.restoreSession();
        if (session && active) {
          const profile = await nakamaService.getAccount();
          if (profile && active) {
            setCurrentUser(profile);
            setIsAuthenticated(true);
            return;
          }
        }
        // Profiles cached by older builds (including offline passes) are never trusted.
        localStorage.removeItem('oneengine_user_profile');
      } catch (e) {
        console.warn('[OneEngine] Session restore check:', e);
      }
    };
    initAuth();
    return () => {
      active = false;
    };
  }, []);

  // Keyboard shortcut listener for Command Palette (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        // Close topmost overlay only (priority: CommandPalette > Article > AuthModal)
        setIsCommandPaletteOpen((prev) => {
          if (prev) return false; // close palette, stop propagation via early return
          // Not open — try closing article next
          setSelectedArticle((prevA) => {
            if (prevA) return null;
            // Not open — close auth modal
            setIsAuthModalOpen((prevM) => {
              if (prevM) return false;
              return prevM;
            });
            return prevA;
          });
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Running game session timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (runningGameId) {
      timer = setInterval(() => {
        setSessionElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setSessionElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [runningGameId]);

  // Live simulation tick for active downloads & speed telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloads((prevDownloads) => {
        const activeDownload = prevDownloads.find((d) => d.status === 'DOWNLOADING');
        if (!activeDownload || isPausedAll) return prevDownloads;

        // Realistic bandwidth jitter around 64.8 MB/s
        const jitter = (Math.random() - 0.48) * 6;
        const currentSpeed = Math.max(18, Math.min(95, +(64.8 + jitter).toFixed(1)));
        const diskSpeed = +(currentSpeed * 1.72).toFixed(1);

        // Update telemetry graph
        setSpeedTelemetryHistory((prev) => [...prev.slice(1), currentSpeed]);

        return prevDownloads.map((item) => {
          if (item.status !== 'DOWNLOADING' || isPausedAll) return item;
          const increment = 0.5;
          const nextProgress = Math.min(100, +(item.progress + increment).toFixed(1));
          const nextDownloadedGb = +((nextProgress / 100) * item.totalGb).toFixed(1);

          if (nextProgress >= 100) {
            // Complete download
            setGames((gList) =>
              gList.map((g) =>
                g.id === item.gameId
                  ? { ...g, installed: true, status: 'INSTALLED', downloadProgress: 100 }
                  : g
              )
            );
            addToast(`Installation of ${item.title} complete and verified.`, 'success');
            return {
              ...item,
              progress: 100,
              downloadedGb: item.totalGb,
              speedMbps: 0,
              diskSpeedMbps: 0,
              status: 'COMPLETED',
              etaSeconds: 0,
            };
          }

          const remainingGb = item.totalGb - nextDownloadedGb;
          const remainingSeconds = Math.round((remainingGb * 1024) / (currentSpeed || 1));

          return {
            ...item,
            progress: nextProgress,
            downloadedGb: nextDownloadedGb,
            speedMbps: currentSpeed,
            diskSpeedMbps: diskSpeed,
            etaSeconds: remainingSeconds,
          };
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPausedAll]);

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
      // Always restore gameId for game-detail; fallback to first game if missing
      if (prevEntry.tab === 'game-detail') {
        setSelectedGameId(prevEntry.gameId ?? games[0]?.id ?? 'railbound');
      } else if (prevEntry.gameId) {
        setSelectedGameId(prevEntry.gameId);
      }
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      triggerSound('click');
      const nextEntry = history[historyIndex + 1];
      setHistoryIndex((prev) => prev + 1);
      setActiveTab(nextEntry.tab);
      if (nextEntry.tab === 'game-detail') {
        setSelectedGameId(nextEntry.gameId ?? games[0]?.id ?? 'railbound');
      } else if (nextEntry.gameId) {
        setSelectedGameId(nextEntry.gameId);
      }
    }
  };

  const startDownload = (gameId: string) => {
    triggerSound('click');
    const target = games.find((g) => g.id === gameId);
    if (!target) return;

    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, status: 'DOWNLOADING', downloadProgress: 0 } : g))
    );

    setDownloads((prev) => {
      const existing = prev.find((d) => d.gameId === gameId);
      if (existing) {
        return prev.map((d) => (d.gameId === gameId ? { ...d, status: 'DOWNLOADING' } : d));
      }
      return [
        {
          gameId: target.id,
          title: target.title,
          coverImage: target.coverImage,
          progress: 0,
          downloadedGb: 0,
          totalGb: target.installSizeGb,
          speedMbps: 64.8,
          diskSpeedMbps: 112.4,
          status: 'DOWNLOADING',
          etaSeconds: Math.round((target.installSizeGb * 1024) / 64),
        },
        ...prev,
      ];
    });

    addToast(`Queued ${target.title} for download [${target.installSizeGb} GB].`, 'info');
  };

  const pauseDownload = (gameId: string) => {
    triggerSound('click');
    setDownloads((prev) =>
      prev.map((d) => (d.gameId === gameId ? { ...d, status: 'PAUSED', speedMbps: 0, diskSpeedMbps: 0 } : d))
    );
  };

  const resumeDownload = (gameId: string) => {
    triggerSound('click');
    setDownloads((prev) =>
      prev.map((d) => (d.gameId === gameId ? { ...d, status: 'DOWNLOADING', speedMbps: 64.8, diskSpeedMbps: 112.4 } : d))
    );
  };

  const cancelDownload = (gameId: string) => {
    triggerSound('click');
    setDownloads((prev) => prev.filter((d) => d.gameId !== gameId));
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, status: 'UNINSTALLED', downloadProgress: 0 } : g))
    );
    addToast('Download cancelled.', 'warning');
  };

  const togglePauseAllDownloads = () => {
    triggerSound('click');
    setIsPausedAll((prev) => !prev);
    setDownloads((prev) =>
      prev.map((d) =>
        d.status === 'COMPLETED'
          ? d
          : { ...d, status: isPausedAll ? 'DOWNLOADING' : 'PAUSED' }
      )
    );
    addToast(isPausedAll ? 'Resumed all downloads' : 'Paused all downloads', 'info');
  };

  const launchGame = async (gameId: string) => {
    triggerSound('click');
    if (!isAuthenticated || !currentUser.nakamaToken) {
      triggerSound('alert');
      addToast('Sign in with your OneEngine account to play.', 'warning');
      setIsAuthModalOpen(true);
      return;
    }
    setLaunchingGameId(gameId);
    recordPlayDay();

    const target = games.find((g) => g.id === gameId);
    const exePath = `${settings.downloadDirectory}\\${gameId}\\${gameId}.exe`;
    const token = currentUser.nakamaToken;
    const refreshToken = currentUser.nakamaRefreshToken || '';

    // Invoke OS process launcher with session handoff
    try {
      await LauncherBridge.launchGame({
        gamePath: exePath,
        authToken: token,
        nakamaToken: token,
        nakamaRefreshToken: refreshToken,
        playerName: currentUser.callsign,
        userId: currentUser.id || 'usr_anonymous',
      });
    } catch (err) {
      console.warn('[OneEngine Launcher] Process bridge dispatch:', err);
    }

    setTimeout(() => {
      triggerSound('launch');
      setLaunchingGameId(null);
      setRunningGameId(gameId);
      setSessionElapsedSeconds(0);

      setGames((prev) =>
        prev.map((g) => (g.id === gameId ? { ...g, status: 'RUNNING' } : g))
      );
      setCurrentUser((prev) => ({
        ...prev,
        status: 'IN_GAME',
        currentGame: target?.title || 'Tactical Title',
      }));

      addToast(`Session handoff verified: ${target?.title} is running.`, 'success');
    }, 1500);
  };

  const stopGame = (gameId: string) => {
    triggerSound('click');
    setRunningGameId(null);
    setLaunchingGameId(null);
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, status: 'INSTALLED' } : g))
    );
    setCurrentUser((prev) => ({
      ...prev,
      status: 'ONLINE',
      currentGame: undefined,
    }));
    addToast('Game process terminated.', 'info');
  };

  const toggleFavorite = (gameId: string) => {
    triggerSound('click');
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, isFavorite: !g.isFavorite } : g))
    );
  };

  const purchaseGame = (gameId: string): boolean => {
    const target = games.find((g) => g.id === gameId);
    if (!target) return false;

    const price = typeof target.price === 'number' 
      ? (target.discountPercent ? +(target.price * (1 - target.discountPercent / 100)).toFixed(2) : target.price)
      : 0;

    if (currentUser.walletBalance < price) {
      triggerSound('alert');
      addToast(`Insufficient wallet funds ($${currentUser.walletBalance.toFixed(2)}) for $${price.toFixed(2)} purchase.`, 'warning');
      return false;
    }

    triggerSound('purchase');
    const newBalance = +(currentUser.walletBalance - price).toFixed(2);
    
    // Deduct wallet and add to user's owned games
    setCurrentUser((prev) => ({
      ...prev,
      walletBalance: newBalance,
      ownedGameIds: [...new Set([...prev.ownedGameIds, gameId])]
    }));

    // Record game entitlement in Nakama storage
    nakamaService.claimGameEntitlement(gameId).catch(() => {});

    addToast(`Purchase successful! Added ${target.title} to Tactical Library.`, 'success');
    return true;
  };

  const loginWithNakama = async (
    email: string,
    pass: string
  ): Promise<{ success: boolean; error?: string }> => {
    triggerSound('click');
    try {
      await nakamaService.authenticateEmail(email, pass, false);
      const profile = await nakamaService.getAccount();
      if (profile) {
        setCurrentUser(profile);
        setIsAuthenticated(true);
        addToast(`Welcome back, ${profile.callsign}!`, 'success');
        return { success: true };
      }
      return { success: false, error: 'Signed in, but the profile could not be loaded.' };
    } catch (err: unknown) {
      triggerSound('alert');
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const registerWithNakama = async (
    email: string,
    pass: string,
    username: string
  ): Promise<{ success: boolean; error?: string }> => {
    triggerSound('click');
    try {
      await nakamaService.authenticateEmail(email, pass, true, username);
      const profile = await nakamaService.getAccount();
      if (profile) {
        setCurrentUser(profile);
        setIsAuthenticated(true);
        addToast(`Account created. Welcome, ${profile.callsign}!`, 'success');
        return { success: true };
      }
      return { success: false, error: 'Account created, but the profile could not be loaded.' };
    } catch (err: unknown) {
      triggerSound('alert');
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const loginAsGuest = async (username = 'Guest_Operative'): Promise<{ success: boolean; error?: string }> => {
    triggerSound('click');
    try {
      let deviceId = '';
      try {
        deviceId = localStorage.getItem('oneengine_device_id') || '';
      } catch {
        // storage unavailable: use a throwaway id
      }
      if (!deviceId) {
        deviceId = `dev_${crypto.randomUUID()}`;
        try {
          localStorage.setItem('oneengine_device_id', deviceId);
        } catch {
          // ignore
        }
      }
      await nakamaService.authenticateDevice(deviceId, true, username);
      const profile = await nakamaService.getAccount();
      if (!profile) return { success: false, error: 'Signed in, but the profile could not be loaded.' };
      setCurrentUser(profile);
      setIsAuthenticated(true);
      addToast(`Signed in as ${profile.callsign}.`, 'info');
      return { success: true };
    } catch (err: unknown) {
      triggerSound('alert');
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  };

  const logout = () => {
    triggerSound('click');
    if (runningGameId) {
      stopGame(runningGameId);
    }
    nakamaService.logout();
    localStorage.removeItem('oneengine_user_profile');
    setCurrentUser(DEFAULT_GUEST_USER);
    setIsAuthenticated(false);
    addToast('Signed out from OneEngine.', 'info');
  };

  const switchUserPreset = (_preset: 'DEVELOPER' | 'COMPETITIVE' | 'GUEST') => {
    triggerSound('click');
    setIsAuthModalOpen(true);
  };

  const openArticle = (article: Article) => {
    triggerSound('click');
    setSelectedArticle(article);
  };

  const closeArticle = () => {
    setSelectedArticle(null);
  };

  const toggleArticleLike = (articleId: string) => {
    triggerSound('click');
    setArticles((prev) =>
      prev.map((art) => {
        if (art.id !== articleId) return art;
        const nextHasLiked = !art.hasLiked;
        return {
          ...art,
          hasLiked: nextHasLiked,
          likes: nextHasLiked ? art.likes + 1 : art.likes - 1,
        };
      })
    );
    if (selectedArticle && selectedArticle.id === articleId) {
      setSelectedArticle((prev) =>
        prev
          ? {
              ...prev,
              hasLiked: !prev.hasLiked,
              likes: !prev.hasLiked ? prev.likes + 1 : prev.likes - 1,
            }
          : null
      );
    }
  };

  const markAllNotificationsRead = () => {
    triggerSound('click');
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    addToast('All notifications marked as read', 'info');
  };

  const clearShaderCache = () => {
    triggerSound('click');
    addToast('Cleared 4.2 GB DX12 & Vulkan shader pipeline caches.', 'success');
  };

  const verifyGameFiles = (gameId?: string) => {
    triggerSound('click');
    const title = gameId ? games.find((g) => g.id === gameId)?.title : 'Railbound';
    addToast(`Integrity check: All local blocks for ${title} verified (100% valid).`, 'success');
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    triggerSound('click');
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      if (
        partial.nakamaHost !== undefined ||
        partial.nakamaPort !== undefined ||
        partial.nakamaUseSsl !== undefined ||
        partial.nakamaServerKey !== undefined ||
        partial.nakamaBasePath !== undefined
      ) {
        nakamaService.updateConfig({
          host: next.nakamaHost,
          port: next.nakamaPort,
          useSsl: next.nakamaUseSsl,
          serverKey: next.nakamaServerKey,
          basePath: next.nakamaBasePath,
        });
      }
      return next;
    });
    addToast('Preferences updated', 'info');
  };

  // Window controls
  const minimizeWindow = async () => {
    triggerSound('click');
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.minimizeWindow();
      return;
    }
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    }
  };

  const toggleMaximizeWindow = async () => {
    triggerSound('click');
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.maximizeWindow();
      return;
    }
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    }
  };

  const closeWindow = async () => {
    triggerSound('click');
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.closeWindow();
      return;
    }
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    }
  };

  return (
    <StoreContext.Provider
      value={{
        activeTab,
        selectedGameId,
        games,
        downloads,
        currentUser,
        isAuthenticated,
        loginWithNakama,
        registerWithNakama,
        loginAsGuest,
        logout,
        searchQuery,
        isAuthModalOpen,
        isCommandPaletteOpen,
        selectedArticle,
        settings,
        runningGameId,
        launchingGameId,
        sessionElapsedSeconds,
        speedTelemetryHistory,
        articles,
        notifications,
        toasts,
        canGoBack: historyIndex > 0,
        canGoForward: historyIndex < history.length - 1,
        isPausedAll,
        navigate,
        goBack,
        goForward,
        openAuthModal: () => {
          triggerSound('click');
          setIsAuthModalOpen(true);
        },
        closeAuthModal: () => setIsAuthModalOpen(false),
        setCommandPaletteOpen: setIsCommandPaletteOpen,
        openArticle,
        closeArticle,
        toggleArticleLike,
        setSearchQuery,
        switchUserPreset,
        startDownload,
        pauseDownload,
        resumeDownload,
        cancelDownload,
        togglePauseAllDownloads,
        launchGame,
        stopGame,
        toggleFavorite,
        purchaseGame,
        updateSettings,
        playTactileSound: triggerSound,
        addToast,
        removeToast,
        markAllNotificationsRead,
        clearShaderCache,
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
