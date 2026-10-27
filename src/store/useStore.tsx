import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Game, DownloadItem, UserProfile, NavigationTab, AppSettings } from '../types/store';

// Synthetic Tactical Audio Engine via Web Audio API (zero audio files needed)
const playSynthesizerSound = (type: 'click' | 'launch' | 'hover' | 'alert', enabled: boolean) => {
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
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
};

const INITIAL_GAMES: Game[] = [
  {
    id: 'railbound',
    title: 'RAILBOUND: TACTICAL PROTOCOL',
    tagline: 'High-speed tactical railway logistics & automated rail defense systems.',
    description: 'Lead an automated rail defense vanguard across hostile industrial zones. Reconfigure track matrices, repel mechanized raiders, and deploy armored rolling artillery to secure planetary resource arteries.',
    price: 29.99,
    discountPercent: 20,
    coverImage: '/images/railbound-theme.jpg',
    heroBanner: '/images/railbound-theme.jpg',
    screenshots: [
      '/images/railbound-theme.jpg',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop'
    ],
    tags: ['TACTICAL', 'AUTOMATION', 'DEFENSE', 'STRATEGY', 'SCI-FI'],
    rating: 96,
    developer: 'Afterburn Foundry',
    publisher: 'OneEngine Interactive',
    releaseDate: 'OCTOBER 2026',
    installed: true,
    installSizeGb: 38.4,
    isFavorite: true,
    playHours: 42.6,
    lastPlayed: '2 HOURS AGO',
    status: 'INSTALLED',
    downloadProgress: 100,
    downloadSpeedMbps: 0,
    category: 'FEATURED',
    achievements: { unlocked: 18, total: 24 },
    patchNotes: [
      {
        version: 'v1.4.2-rel',
        date: 'OCT 26, 2026',
        notes: [
          'Direct OneEngine Store headless bypass integration (--auth-token payload).',
          'Automated GameLobby scene handoff with zero manual credential prompting.',
          'Reduced load-in latency by 45% using native IPC session validation.',
        ],
      },
      {
        version: 'v1.4.1-hotfix',
        date: 'OCT 12, 2026',
        notes: [
          'Resolved collision glitch on junction Switch-7.',
          'Updated shader cache for DirectX 12 render pipelines.',
        ],
      },
    ],
    systemRequirements: {
      os: 'Windows 10 / 11 64-bit',
      processor: 'Intel Core i5-8400 / AMD Ryzen 5 2600',
      memory: '8 GB RAM',
      graphics: 'NVIDIA GeForce GTX 1060 / AMD Radeon RX 580',
      storage: '40 GB available high-speed SSD space',
    },
  },
  {
    id: 'cyber-siege',
    title: 'CYBER SIEGE: OPERATIVE',
    tagline: 'Hardcore CQB tactical extraction shooter in a neon-drenched megacity.',
    description: 'Infiltrate corporate arcologies, breach reinforced bio-vaults, and extract classified zero-day exploits before defense teams lock down the perimeter.',
    price: 39.99,
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop',
    heroBanner: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop'
    ],
    tags: ['EXTRACTION', 'MULTIPLAYER', 'HARDCORE', 'FIRST-PERSON'],
    rating: 91,
    developer: 'Hexagon Tactical Labs',
    publisher: 'OneEngine Interactive',
    releaseDate: 'SEPTEMBER 2026',
    installed: true,
    installSizeGb: 62.1,
    isFavorite: false,
    playHours: 114.8,
    lastPlayed: 'YESTERDAY',
    status: 'INSTALLED',
    downloadProgress: 100,
    downloadSpeedMbps: 0,
    category: 'TRENDING_TACTICAL',
    achievements: { unlocked: 34, total: 50 },
    patchNotes: [
      {
        version: 'v2.1.0',
        date: 'OCT 18, 2026',
        notes: ['Added subterranean Sector 4 map.', 'Improved thermal sight balance.'],
      }
    ],
    systemRequirements: {
      os: 'Windows 11 64-bit',
      processor: 'AMD Ryzen 7 5800X',
      memory: '16 GB RAM',
      graphics: 'NVIDIA RTX 3070',
      storage: '65 GB NVMe SSD',
    },
  },
  {
    id: 'project-void',
    title: 'PROJECT VOID: DRIFT',
    tagline: 'Zero-G Newtonian physics fighter & capital ship escort simulation.',
    description: 'Pilot next-generation vector-thrust interceptors through dense planetary debris rings and execute tactical fleet coordination in deep space.',
    price: 24.99,
    discountPercent: 15,
    coverImage: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop',
    heroBanner: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1200&auto=format&fit=crop'
    ],
    tags: ['SPACE SIM', 'PHYSICS', 'FLIGHT', 'SCI-FI'],
    rating: 88,
    developer: 'AstroCore Studios',
    publisher: 'OneEngine Interactive',
    releaseDate: 'AUGUST 2026',
    installed: false,
    installSizeGb: 28.5,
    isFavorite: false,
    playHours: 0,
    status: 'UNINSTALLED',
    downloadProgress: 0,
    downloadSpeedMbps: 0,
    category: 'TRENDING_TACTICAL',
    achievements: { unlocked: 0, total: 30 },
    patchNotes: [
      {
        version: 'v1.0.4',
        date: 'OCT 05, 2026',
        notes: ['HOTAS joystick calibration profile updates.'],
      }
    ],
    systemRequirements: {
      os: 'Windows 10 64-bit',
      processor: 'Intel i7-9700K',
      memory: '16 GB RAM',
      graphics: 'NVIDIA GTX 1080Ti',
      storage: '30 GB SSD',
    },
  },
  {
    id: 'rust-protocol',
    title: 'RUST PROTOCOL: MECH DIVISION',
    tagline: 'High-lethality real-time mechanical combat & planetary warfare.',
    description: 'Assemble modular war mechs with specialized reactor cores, rail-accelerators, and active electronic countermeasures in massive 32-player battlefield engagements.',
    price: 'FREE',
    coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=800&auto=format&fit=crop',
    heroBanner: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1600&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=1200&auto=format&fit=crop'
    ],
    tags: ['FREE TO PLAY', 'MECH', 'PVP', 'ACTION'],
    rating: 94,
    developer: 'Vanguard Dynamics',
    publisher: 'OneEngine Interactive',
    releaseDate: 'EARLY ACCESS',
    installed: false,
    installSizeGb: 48.0,
    isFavorite: true,
    playHours: 0,
    status: 'UNINSTALLED',
    downloadProgress: 0,
    downloadSpeedMbps: 0,
    category: 'EARLY_ACCESS',
    achievements: { unlocked: 0, total: 40 },
    patchNotes: [
      {
        version: 'v0.8.9',
        date: 'OCT 22, 2026',
        notes: ['Added Titan-class siege walkers.'],
      }
    ],
    systemRequirements: {
      os: 'Windows 10 / 11 64-bit',
      processor: 'Intel Core i5-11400',
      memory: '16 GB RAM',
      graphics: 'NVIDIA RTX 3060',
      storage: '50 GB SSD',
    },
  },
  {
    id: 'ghost-recon-delta',
    title: 'SPEC-OPS: IRONCLAD',
    tagline: 'Cooperative stealth tactical infiltrations under harsh electromagnetic jamming.',
    description: 'Coordinate simultaneous thermal breaches and silence hostile SAM sites across black-budget mountain bases.',
    price: 49.99,
    discountPercent: 10,
    coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop',
    heroBanner: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop'
    ],
    tags: ['CO-OP', 'STEALTH', 'MILITARY', 'TACTICAL'],
    rating: 89,
    developer: 'Blackwatch Software',
    publisher: 'OneEngine Interactive',
    releaseDate: 'JULY 2026',
    installed: false,
    installSizeGb: 54.2,
    isFavorite: false,
    playHours: 0,
    status: 'UNINSTALLED',
    downloadProgress: 0,
    downloadSpeedMbps: 0,
    category: 'RECOMMENDED',
    achievements: { unlocked: 0, total: 35 },
    patchNotes: [
      {
        version: 'v1.2.0',
        date: 'SEP 28, 2026',
        notes: ['New Night Operations loadout pack.'],
      }
    ],
    systemRequirements: {
      os: 'Windows 10 64-bit',
      processor: 'AMD Ryzen 5 3600',
      memory: '16 GB RAM',
      graphics: 'NVIDIA GTX 1660 Super',
      storage: '55 GB SSD',
    },
  },
  {
    id: 'neon-drifter',
    title: 'KINETIC 2099: DRIFT',
    tagline: 'Anti-gravity supersonic combat racing through subterranean foundry tunnels.',
    description: 'Speeds exceeding Mach 1 on magnetic rails with onboard missile counter-batteries and dynamic tunnel collapses.',
    price: 19.99,
    coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
    heroBanner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1600&auto=format&fit=crop',
    screenshots: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1200&auto=format&fit=crop'
    ],
    tags: ['RACING', 'CYBERPUNK', 'HIGH SPEED', 'ACTION'],
    rating: 92,
    developer: 'Apex Forge',
    publisher: 'OneEngine Interactive',
    releaseDate: 'JUNE 2026',
    installed: true,
    installSizeGb: 22.0,
    isFavorite: false,
    playHours: 19.4,
    lastPlayed: '3 DAYS AGO',
    status: 'INSTALLED',
    downloadProgress: 100,
    downloadSpeedMbps: 0,
    category: 'RECOMMENDED',
    achievements: { unlocked: 12, total: 20 },
    patchNotes: [
      {
        version: 'v1.1.2',
        date: 'AUG 14, 2026',
        notes: ['Ultra-wide monitor support enhancement.'],
      }
    ],
    systemRequirements: {
      os: 'Windows 10 64-bit',
      processor: 'Intel Core i3-10100',
      memory: '8 GB RAM',
      graphics: 'NVIDIA GTX 1050Ti',
      storage: '25 GB SSD',
    },
  }
];

const PRESET_USERS: Record<string, UserProfile> = {
  DEVELOPER: {
    id: 'usr_spectre_07',
    callsign: 'Spectre_07',
    rank: 'LEAD SYSTEMS ARCHITECT',
    level: 74,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Spectre_07',
    status: 'ONLINE',
    currentGame: undefined,
    walletBalance: 148.50,
    role: 'DEVELOPER',
  },
  COMPETITIVE: {
    id: 'usr_valkyrie_9',
    callsign: 'Valkyrie_9',
    rank: 'ELITE VANGUARD',
    level: 42,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Valkyrie_9',
    status: 'IN_GAME',
    currentGame: 'Railbound',
    walletBalance: 32.00,
    role: 'OPERATOR',
  },
  GUEST: {
    id: 'usr_guest_recon',
    callsign: 'Ghost_Operative',
    rank: 'RECON SCOUT',
    level: 1,
    avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ghost_Operative',
    status: 'ONLINE',
    currentGame: undefined,
    walletBalance: 0.00,
    role: 'OPERATOR',
  }
};

interface StoreContextType {
  activeTab: NavigationTab;
  selectedGameId: string;
  games: Game[];
  downloads: DownloadItem[];
  currentUser: UserProfile;
  searchQuery: string;
  isAuthModalOpen: boolean;
  settings: AppSettings;
  runningGameId: string | null;
  speedTelemetryHistory: number[];
  
  navigate: (tab: NavigationTab, gameId?: string) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  setSearchQuery: (query: string) => void;
  switchUserPreset: (preset: 'DEVELOPER' | 'COMPETITIVE' | 'GUEST') => void;
  startDownload: (gameId: string) => void;
  pauseDownload: (gameId: string) => void;
  resumeDownload: (gameId: string) => void;
  cancelDownload: (gameId: string) => void;
  launchGame: (gameId: string) => void;
  stopGame: (gameId: string) => void;
  toggleFavorite: (gameId: string) => void;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  playTactileSound: (type: 'click' | 'launch' | 'hover' | 'alert') => void;
  minimizeWindow: () => void;
  toggleMaximizeWindow: () => void;
  closeWindow: () => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('store');
  const [selectedGameId, setSelectedGameId] = useState<string>('railbound');
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    {
      gameId: 'rust-protocol',
      title: 'RUST PROTOCOL: MECH DIVISION',
      coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=400&auto=format&fit=crop',
      progress: 64,
      downloadedGb: 30.7,
      totalGb: 48.0,
      speedMbps: 48.2,
      status: 'DOWNLOADING',
      etaSeconds: 360,
    }
  ]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(PRESET_USERS.DEVELOPER);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [runningGameId, setRunningGameId] = useState<string | null>(null);
  const [speedTelemetryHistory, setSpeedTelemetryHistory] = useState<number[]>([
    38, 42, 45, 41, 48, 52, 49, 47, 51, 48, 49, 50, 48, 53, 48
  ]);

  const [settings, setSettings] = useState<AppSettings>({
    launchOnStartup: true,
    downloadDirectory: 'C:\\OneEngine\\GameLibrary',
    primaryAccent: '#FF7A00',
    enableTactileAudio: true,
    hardwareAcceleration: true,
  });

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Sound wrapper
  const triggerSound = (type: 'click' | 'launch' | 'hover' | 'alert') => {
    playSynthesizerSound(type, settingsRef.current.enableTactileAudio);
  };

  // Live simulation tick for active downloads & speed telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloads((prevDownloads) => {
        const activeDownload = prevDownloads.find((d) => d.status === 'DOWNLOADING');
        if (!activeDownload) return prevDownloads;

        // Generate natural jitter around 48 MB/s
        const jitter = (Math.random() - 0.48) * 4;
        const currentSpeed = Math.max(12, Math.min(85, +(48.2 + jitter).toFixed(1)));

        // Update telemetry graph
        setSpeedTelemetryHistory((prev) => [...prev.slice(1), currentSpeed]);

        return prevDownloads.map((item) => {
          if (item.status !== 'DOWNLOADING') return item;
          const increment = 0.4;
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
            return {
              ...item,
              progress: 100,
              downloadedGb: item.totalGb,
              speedMbps: 0,
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
            etaSeconds: remainingSeconds,
          };
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const navigate = (tab: NavigationTab, gameId?: string) => {
    triggerSound('click');
    if (gameId) {
      setSelectedGameId(gameId);
    }
    setActiveTab(tab);
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
        ...prev,
        {
          gameId: target.id,
          title: target.title,
          coverImage: target.coverImage,
          progress: 0,
          downloadedGb: 0,
          totalGb: target.installSizeGb,
          speedMbps: 48.2,
          status: 'DOWNLOADING',
          etaSeconds: Math.round((target.installSizeGb * 1024) / 48),
        },
      ];
    });
  };

  const pauseDownload = (gameId: string) => {
    triggerSound('click');
    setDownloads((prev) =>
      prev.map((d) => (d.gameId === gameId ? { ...d, status: 'PAUSED', speedMbps: 0 } : d))
    );
  };

  const resumeDownload = (gameId: string) => {
    triggerSound('click');
    setDownloads((prev) =>
      prev.map((d) => (d.gameId === gameId ? { ...d, status: 'DOWNLOADING', speedMbps: 48.2 } : d))
    );
  };

  const cancelDownload = (gameId: string) => {
    triggerSound('click');
    setDownloads((prev) => prev.filter((d) => d.gameId !== gameId));
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, status: 'UNINSTALLED', downloadProgress: 0 } : g))
    );
  };

  const launchGame = (gameId: string) => {
    triggerSound('launch');
    setRunningGameId(gameId);
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, status: 'RUNNING' } : g))
    );
    setCurrentUser((prev) => {
      const g = games.find((item) => item.id === gameId);
      return {
        ...prev,
        status: 'IN_GAME',
        currentGame: g?.title || 'Tactical Title',
      };
    });
  };

  const stopGame = (gameId: string) => {
    triggerSound('click');
    setRunningGameId(null);
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, status: 'INSTALLED' } : g))
    );
    setCurrentUser((prev) => ({
      ...prev,
      status: 'ONLINE',
      currentGame: undefined,
    }));
  };

  const toggleFavorite = (gameId: string) => {
    triggerSound('click');
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, isFavorite: !g.isFavorite } : g))
    );
  };

  const switchUserPreset = (preset: 'DEVELOPER' | 'COMPETITIVE' | 'GUEST') => {
    triggerSound('click');
    setCurrentUser(PRESET_USERS[preset]);
    setIsAuthModalOpen(false);
  };

  const updateSettings = (partial: Partial<AppSettings>) => {
    triggerSound('click');
    setSettings((prev) => ({ ...prev, ...partial }));
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
        searchQuery,
        isAuthModalOpen,
        settings,
        runningGameId,
        speedTelemetryHistory,
        navigate,
        openAuthModal: () => {
          triggerSound('click');
          setIsAuthModalOpen(true);
        },
        closeAuthModal: () => setIsAuthModalOpen(false),
        setSearchQuery,
        switchUserPreset,
        startDownload,
        pauseDownload,
        resumeDownload,
        cancelDownload,
        launchGame,
        stopGame,
        toggleFavorite,
        updateSettings,
        playTactileSound: triggerSound,
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
