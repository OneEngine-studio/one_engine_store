import React, { useEffect } from 'react';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
export { useShallow } from 'zustand/react/shallow';
import { 
  Game, 
  DownloadItem, 
  UserProfile, 
  NavigationTab, 
  AppSettings, 
  Article, 
  ClientNotification, 
  ToastNotification,
  UserReview 
} from '../types/store';
import { LauncherBridge } from '../lib/launcherBridge';
import { DiskSpaceInfo } from '../types/electron';
import { playSynthesizerSound, TactileSoundType } from '../lib/soundEngine';
import { 
  INITIAL_GAMES, 
  INITIAL_ARTICLES, 
  INITIAL_NOTIFICATIONS, 
  PRESET_USERS, 
  DEFAULT_SETTINGS 
} from '../data/mockData';

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

const syncAccentCss = (accentHex: string) => {
  if (typeof document === 'undefined') return;
  const clean = accentHex.replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    document.documentElement.style.setProperty('--primary-accent-rgb', `${r} ${g} ${b}`);
  }
};

export interface AppStoreState {
  // Navigation
  activeTab: NavigationTab;
  selectedGameId: string;
  searchQuery: string;
  history: Array<{ tab: NavigationTab; gameId?: string }>;
  historyIndex: number;
  canGoBack: boolean;
  canGoForward: boolean;

  // Games & Execution
  games: Game[];
  runningGameId: string | null;
  runningGamePid: number | null;
  launchingGameId: string | null;
  sessionElapsedSeconds: number;

  // Downloads & Telemetry
  downloads: DownloadItem[];
  speedTelemetryHistory: number[];
  isPausedAll: boolean;
  diskSpace: DiskSpaceInfo;

  // User Profile
  currentUser: UserProfile;

  // Settings & Overlays
  settings: AppSettings;
  isAuthModalOpen: boolean;
  isCommandPaletteOpen: boolean;
  selectedArticle: Article | null;
  articles: Article[];
  notifications: ClientNotification[];
  toasts: ToastNotification[];

  // Internal tick helper
  _tickDownloads: () => void;

  // Actions
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
  launchGame: (gameId: string) => Promise<void>;
  stopGame: (gameId: string) => Promise<void>;
  uninstallGame: (gameId: string) => Promise<void>;
  toggleFavorite: (gameId: string) => void;
  purchaseGame: (gameId: string) => boolean;
  purchaseDLC: (gameId: string, dlcId: string) => boolean;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  refreshDiskSpace: () => Promise<void>;
  playTactileSound: (type: TactileSoundType) => void;
  addToast: (message: string, type?: 'info' | 'success' | 'warning') => void;
  removeToast: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearShaderCache: () => void;
  verifyGameFiles: (gameId?: string) => Promise<void>;
  submitGameReview: (gameId: string, isRecommended: boolean, content: string) => void;
  voteReviewHelpful: (gameId: string, reviewId: string) => void;
  minimizeWindow: () => Promise<void>;
  minimizeToTray: () => Promise<void>;
  toggleMaximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  activeTab: 'store',
  selectedGameId: 'railbound',
  searchQuery: '',
  history: [{ tab: 'store', gameId: 'railbound' }],
  historyIndex: 0,
  canGoBack: false,
  canGoForward: false,

  games: loadFromStorage('oe_games', INITIAL_GAMES),
  runningGameId: null,
  runningGamePid: null,
  launchingGameId: null,
  sessionElapsedSeconds: 0,

  downloads: [
    {
      gameId: 'rust-protocol',
      title: 'RUST PROTOCOL: MECH DIVISION',
      coverImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=400&auto=format&fit=crop',
      progress: 68.4,
      downloadedGb: 32.8,
      totalGb: 48.0,
      speedMbps: 64.8,
      diskSpeedMbps: 112.4,
      status: 'DOWNLOADING',
      etaSeconds: 210,
    }
  ],
  speedTelemetryHistory: [42, 48, 55, 59, 64, 68, 62, 65, 71, 64, 66, 68, 65, 72, 65],
  isPausedAll: false,
  diskSpace: {
    freeGb: 44.3,
    totalGb: 254.5,
    usedGb: 210.2,
    drive: 'C:\\'
  },

  currentUser: loadFromStorage('oe_user', PRESET_USERS.DEVELOPER),
  settings: loadFromStorage('oe_settings', DEFAULT_SETTINGS),

  isAuthModalOpen: false,
  isCommandPaletteOpen: false,
  selectedArticle: null,
  articles: INITIAL_ARTICLES,
  notifications: INITIAL_NOTIFICATIONS,
  toasts: [],

  // Telemetry & Download Simulation Tick
  _tickDownloads: () => {
    const { downloads, isPausedAll, settings, addToast } = get();
    const activeDownload = downloads.find((d) => d.status === 'DOWNLOADING');
    if (!activeDownload || isPausedAll) return;

    let targetSpeed = 64.8;
    const throttle = settings.bandwidthThrottleMbps;
    if (throttle > 0) {
      targetSpeed = Math.min(throttle, targetSpeed);
    }
    const jitter = (Math.random() - 0.48) * (targetSpeed * 0.08);
    const currentSpeed = Math.max(1, +(targetSpeed + jitter).toFixed(1));
    const diskSpeed = +(currentSpeed * 1.72).toFixed(1);

    let completedGameId: string | null = null;
    let completedGameTitle = '';

    const nextDownloads = downloads.map((item) => {
      if (item.status !== 'DOWNLOADING' || isPausedAll) return item;
      const increment = +(currentSpeed / 1024).toFixed(3);
      const nextDownloadedGb = Math.min(item.totalGb, +(item.downloadedGb + increment).toFixed(2));
      const nextProgress = Math.min(100, +((nextDownloadedGb / item.totalGb) * 100).toFixed(1));

      if (nextProgress >= 100) {
        completedGameId = item.gameId;
        completedGameTitle = item.title;
        return {
          ...item,
          progress: 100,
          downloadedGb: item.totalGb,
          speedMbps: 0,
          diskSpeedMbps: 0,
          status: 'COMPLETED' as const,
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

    set((state) => ({
      downloads: nextDownloads,
      speedTelemetryHistory: [...state.speedTelemetryHistory.slice(1), currentSpeed],
      games: completedGameId
        ? state.games.map((g) =>
            g.id === completedGameId
              ? { ...g, installed: true, status: 'INSTALLED', downloadProgress: 100 }
              : g
          )
        : state.games,
    }));

    if (completedGameId) {
      addToast(`Installation of ${completedGameTitle} complete and verified.`, 'success');
      get().refreshDiskSpace();
    }
  },

  refreshDiskSpace: async () => {
    try {
      const { settings } = get();
      const info = await LauncherBridge.getDiskSpace(settings.downloadDirectory);
      set({ diskSpace: info });
    } catch {}
  },

  // Navigation
  navigate: (tab: NavigationTab, gameId?: string) => {
    get().playTactileSound('click');
    const { history, historyIndex, selectedGameId } = get();
    const targetGameId = gameId || selectedGameId;

    const newHistory = history.slice(0, historyIndex + 1);
    const nextHistory = [...newHistory, { tab, gameId: targetGameId }];
    const nextIndex = nextHistory.length - 1;

    set({
      activeTab: tab,
      selectedGameId: targetGameId,
      history: nextHistory,
      historyIndex: nextIndex,
      canGoBack: nextIndex > 0,
      canGoForward: false,
    });
  },

  goBack: () => {
    const { historyIndex, history, games } = get();
    if (historyIndex > 0) {
      get().playTactileSound('click');
      const nextIndex = historyIndex - 1;
      const prevEntry = history[nextIndex];
      const targetGameId = prevEntry.tab === 'game-detail'
        ? (prevEntry.gameId ?? games[0]?.id ?? 'railbound')
        : (prevEntry.gameId ?? get().selectedGameId);

      set({
        historyIndex: nextIndex,
        activeTab: prevEntry.tab,
        selectedGameId: targetGameId,
        canGoBack: nextIndex > 0,
        canGoForward: true,
      });
    }
  },

  goForward: () => {
    const { historyIndex, history, games } = get();
    if (historyIndex < history.length - 1) {
      get().playTactileSound('click');
      const nextIndex = historyIndex + 1;
      const nextEntry = history[nextIndex];
      const targetGameId = nextEntry.tab === 'game-detail'
        ? (nextEntry.gameId ?? games[0]?.id ?? 'railbound')
        : (nextEntry.gameId ?? get().selectedGameId);

      set({
        historyIndex: nextIndex,
        activeTab: nextEntry.tab,
        selectedGameId: targetGameId,
        canGoBack: true,
        canGoForward: nextIndex < history.length - 1,
      });
    }
  },

  openAuthModal: () => {
    get().playTactileSound('click');
    set({ isAuthModalOpen: true });
  },

  closeAuthModal: () => {
    set({ isAuthModalOpen: false });
  },

  setCommandPaletteOpen: (open: boolean) => {
    set({ isCommandPaletteOpen: open });
  },

  openArticle: (article: Article) => {
    get().playTactileSound('click');
    set({ selectedArticle: article });
  },

  closeArticle: () => {
    set({ selectedArticle: null });
  },

  toggleArticleLike: (articleId: string) => {
    get().playTactileSound('click');
    set((state) => {
      const updatedArticles = state.articles.map((art) => {
        if (art.id !== articleId) return art;
        const nextHasLiked = !art.hasLiked;
        return {
          ...art,
          hasLiked: nextHasLiked,
          likes: nextHasLiked ? art.likes + 1 : art.likes - 1,
        };
      });

      const updatedSelected = state.selectedArticle && state.selectedArticle.id === articleId
        ? {
            ...state.selectedArticle,
            hasLiked: !state.selectedArticle.hasLiked,
            likes: !state.selectedArticle.hasLiked ? state.selectedArticle.likes + 1 : state.selectedArticle.likes - 1,
          }
        : state.selectedArticle;

      return {
        articles: updatedArticles,
        selectedArticle: updatedSelected,
      };
    });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  switchUserPreset: (preset: 'DEVELOPER' | 'COMPETITIVE' | 'GUEST') => {
    get().playTactileSound('click');
    const selected = PRESET_USERS[preset];
    const { runningGameId, stopGame } = get();

    if (runningGameId) {
      stopGame(runningGameId);
    }

    set({
      currentUser: selected,
      isAuthModalOpen: false,
    });

    get().addToast(`Active Operative switched to ${selected.callsign} (${selected.role})`, 'info');
  },

  startDownload: (gameId: string) => {
    get().playTactileSound('click');
    const target = get().games.find((g) => g.id === gameId);
    if (!target) return;

    // Real Pre-allocation disk space verification
    const { diskSpace } = get();
    if (diskSpace && diskSpace.freeGb < target.installSizeGb) {
      get().playTactileSound('alert');
      get().addToast(
        `Pre-allocation failed: Insufficient disk space on ${diskSpace.drive}. Needed: ${target.installSizeGb} GB, Available: ${diskSpace.freeGb} GB.`,
        'warning'
      );
      return;
    }

    set((state) => ({
      games: state.games.map((g) => (g.id === gameId ? { ...g, status: 'DOWNLOADING', downloadProgress: 0 } : g)),
      downloads: state.downloads.some((d) => d.gameId === gameId)
        ? state.downloads.map((d) => (d.gameId === gameId ? { ...d, status: 'DOWNLOADING' } : d))
        : [
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
            ...state.downloads,
          ],
    }));

    get().addToast(`Pre-allocation verified. Queued ${target.title} [${target.installSizeGb} GB] on ${diskSpace?.drive || 'C:\\'}.`, 'info');
  },

  pauseDownload: (gameId: string) => {
    get().playTactileSound('click');
    set((state) => ({
      downloads: state.downloads.map((d) => (d.gameId === gameId ? { ...d, status: 'PAUSED', speedMbps: 0, diskSpeedMbps: 0 } : d)),
    }));
  },

  resumeDownload: (gameId: string) => {
    get().playTactileSound('click');
    set((state) => ({
      downloads: state.downloads.map((d) => (d.gameId === gameId ? { ...d, status: 'DOWNLOADING', speedMbps: 64.8, diskSpeedMbps: 112.4 } : d)),
    }));
  },

  cancelDownload: (gameId: string) => {
    get().playTactileSound('click');
    set((state) => ({
      downloads: state.downloads.filter((d) => d.gameId !== gameId),
      games: state.games.map((g) => (g.id === gameId ? { ...g, status: 'UNINSTALLED', downloadProgress: 0 } : g)),
    }));
    get().addToast('Download cancelled.', 'warning');
  },

  togglePauseAllDownloads: () => {
    get().playTactileSound('click');
    const nextPaused = !get().isPausedAll;
    set((state) => ({
      isPausedAll: nextPaused,
      downloads: state.downloads.map((d) =>
        d.status === 'COMPLETED' ? d : { ...d, status: nextPaused ? 'PAUSED' : 'DOWNLOADING' }
      ),
    }));
    get().addToast(nextPaused ? 'Paused all downloads' : 'Resumed all downloads', 'info');
  },

  launchGame: async (gameId: string) => {
    get().playTactileSound('click');
    set({ launchingGameId: gameId });

    const target = get().games.find((g) => g.id === gameId);
    const currentUser = get().currentUser;
    const gamePath = target?.id === 'railbound' ? 'C:\\Games\\Railbound\\Railbound.exe' : `C:\\Games\\${target?.title}\\game.exe`;

    try {
      const result = await LauncherBridge.launchGame({
        gamePath,
        authToken: currentUser.authToken || `oe_jwt_${currentUser.id}_bypass`,
        playerName: currentUser.callsign,
        userId: currentUser.id,
      });

      get().playTactileSound('launch');
      set((state) => ({
        launchingGameId: null,
        runningGameId: gameId,
        runningGamePid: result?.pid || null,
        sessionElapsedSeconds: 0,
        games: state.games.map((g) => (g.id === gameId ? { ...g, status: 'RUNNING' } : g)),
        currentUser: {
          ...state.currentUser,
          status: 'IN_GAME',
          currentGame: target?.title || 'Tactical Title',
        },
      }));

      LauncherBridge.updateRichPresence({
        gameTitle: target?.title || 'Tactical Title',
        details: 'In Combat Operation',
        startTimestamp: Date.now(),
      });

      get().addToast(`Direct headless bypass active: ${target?.title} is running.`, 'success');
    } catch (err) {
      set({ launchingGameId: null });
      get().addToast('Game launch failed: ' + (err as Error).message, 'warning');
    }
  },

  stopGame: async (gameId: string) => {
    get().playTactileSound('click');
    const { runningGamePid } = get();
    if (runningGamePid) {
      await LauncherBridge.killGameProcess(runningGamePid);
    }

    LauncherBridge.updateRichPresence(null);

    set((state) => ({
      runningGameId: null,
      runningGamePid: null,
      launchingGameId: null,
      sessionElapsedSeconds: 0,
      games: state.games.map((g) => (g.id === gameId ? { ...g, status: 'INSTALLED' } : g)),
      currentUser: {
        ...state.currentUser,
        status: 'ONLINE',
        currentGame: undefined,
      },
    }));

    get().addToast('Game process terminated.', 'info');
  },

  uninstallGame: async (gameId: string) => {
    const { games, runningGameId, stopGame, playTactileSound, addToast, refreshDiskSpace } = get();
    const target = games.find((g) => g.id === gameId);
    if (!target) return;

    if (runningGameId === gameId) {
      await stopGame(gameId);
    }

    playTactileSound('alert');
    set((state) => ({
      games: state.games.map((g) =>
        g.id === gameId
          ? { ...g, installed: false, status: 'UNINSTALLED', downloadProgress: 0 }
          : g
      ),
      downloads: state.downloads.filter((d) => d.gameId !== gameId),
    }));

    addToast(`Uninstalled ${target.title}. Local packages and cache purged.`, 'info');
    await refreshDiskSpace();
  },

  toggleFavorite: (gameId: string) => {
    get().playTactileSound('click');
    set((state) => ({
      games: state.games.map((g) => (g.id === gameId ? { ...g, isFavorite: !g.isFavorite } : g)),
    }));
  },

  purchaseGame: (gameId: string): boolean => {
    const { games, currentUser } = get();
    const target = games.find((g) => g.id === gameId);
    if (!target) return false;

    const price = typeof target.price === 'number'
      ? (target.discountPercent ? +(target.price * (1 - target.discountPercent / 100)).toFixed(2) : target.price)
      : 0;

    if (currentUser.walletBalance < price) {
      get().playTactileSound('alert');
      get().addToast(`Insufficient wallet funds ($${currentUser.walletBalance.toFixed(2)}) for $${price.toFixed(2)} purchase.`, 'warning');
      return false;
    }

    get().playTactileSound('purchase');
    const newBalance = +(currentUser.walletBalance - price).toFixed(2);

    set((state) => ({
      currentUser: {
        ...state.currentUser,
        walletBalance: newBalance,
        ownedGameIds: [...new Set([...state.currentUser.ownedGameIds, gameId])],
      },
    }));

    get().addToast(`Purchase successful! Added ${target.title} to Tactical Library.`, 'success');
    return true;
  },

  purchaseDLC: (gameId: string, dlcId: string): boolean => {
    const { games, currentUser } = get();
    const targetGame = games.find((g) => g.id === gameId);
    if (!targetGame) return false;

    const dlc = targetGame.dlcs.find((d) => d.id === dlcId);
    if (!dlc) return false;

    if (currentUser.walletBalance < dlc.price) {
      get().playTactileSound('alert');
      get().addToast(`Insufficient wallet funds ($${currentUser.walletBalance.toFixed(2)}) for $${dlc.price.toFixed(2)} DLC.`, 'warning');
      return false;
    }

    get().playTactileSound('purchase');
    const newBalance = +(currentUser.walletBalance - dlc.price).toFixed(2);

    set((state) => ({
      currentUser: {
        ...state.currentUser,
        walletBalance: newBalance,
      },
      games: state.games.map((g) => {
        if (g.id !== gameId) return g;
        return {
          ...g,
          dlcs: g.dlcs.map((d) => (d.id === dlcId ? { ...d, owned: true } : d)),
        };
      }),
    }));

    get().addToast(`Purchase successful! Added ${dlc.title} to Tactical Library.`, 'success');
    return true;
  },

  updateSettings: (partial: Partial<AppSettings>) => {
    get().playTactileSound('click');
    set((state) => ({
      settings: { ...state.settings, ...partial },
    }));
    get().addToast('Preferences updated', 'info');
    if (partial.downloadDirectory) {
      get().refreshDiskSpace();
    }
  },

  playTactileSound: (type: TactileSoundType) => {
    playSynthesizerSound(type, get().settings.enableTactileAudio);
  },

  addToast: (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },

  removeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  markAllNotificationsRead: () => {
    get().playTactileSound('click');
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
    get().addToast('All notifications marked as read', 'info');
  },

  clearShaderCache: () => {
    get().playTactileSound('click');
    get().addToast('Cleared 4.2 GB DX12 & Vulkan shader pipeline caches.', 'success');
  },

  verifyGameFiles: async (gameId?: string) => {
    get().playTactileSound('click');
    const { games, settings } = get();
    const target = gameId ? games.find((g) => g.id === gameId) : games[0];
    const title = target?.title || 'Railbound';
    const gamePath = target?.id === 'railbound' 
      ? 'C:\\Games\\Railbound\\Railbound.exe' 
      : `${settings.downloadDirectory}\\${target?.title}\\game.exe`;

    const result = await LauncherBridge.verifyFileIntegrity(gamePath);
    if (result.verified) {
      get().addToast(`Integrity check: ${title} — ${result.message}`, 'success');
    } else {
      get().addToast(`Integrity warning: ${title} — ${result.message}`, 'warning');
    }
  },

  submitGameReview: (gameId: string, isRecommended: boolean, content: string) => {
    get().playTactileSound('click');
    const { currentUser, games } = get();
    const target = games.find((g) => g.id === gameId);
    if (!target) return;

    const newReview: UserReview = {
      id: 'rev_' + Date.now(),
      gameId,
      author: currentUser.callsign,
      avatarUrl: currentUser.avatarUrl,
      role: currentUser.rank || currentUser.role,
      isRecommended,
      content: content.trim(),
      date: 'JUST NOW',
      playHours: target.playHours || 2.5,
      helpfulCount: 0,
      hasVotedHelpful: false,
    };

    set((state) => ({
      games: state.games.map((g) => {
        if (g.id !== gameId) return g;
        const currentReviews = g.reviews || [];
        const nextReviews = [newReview, ...currentReviews];
        const positiveCount = nextReviews.filter((r) => r.isRecommended).length;
        const total = nextReviews.length;
        const positivePercent = Math.round((positiveCount / total) * 100);

        return {
          ...g,
          rating: positivePercent,
          ratingBreakdown: {
            positivePercent,
            totalReviews: g.ratingBreakdown.totalReviews + 1,
          },
          reviews: nextReviews,
        };
      }),
    }));

    get().addToast('Operational review submitted to Tactical Network.', 'success');
  },

  voteReviewHelpful: (gameId: string, reviewId: string) => {
    get().playTactileSound('click');
    set((state) => ({
      games: state.games.map((g) => {
        if (g.id !== gameId || !g.reviews) return g;
        return {
          ...g,
          reviews: g.reviews.map((r) => {
            if (r.id !== reviewId) return r;
            const nextVoted = !r.hasVotedHelpful;
            return {
              ...r,
              hasVotedHelpful: nextVoted,
              helpfulCount: nextVoted ? r.helpfulCount + 1 : r.helpfulCount - 1,
            };
          }),
        };
      }),
    }));
  },

  minimizeWindow: async () => {
    get().playTactileSound('click');
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.minimizeWindow();
      return;
    }
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().minimize();
    }
  },

  minimizeToTray: async () => {
    get().playTactileSound('click');
    await LauncherBridge.minimizeToTray();
  },

  toggleMaximizeWindow: async () => {
    get().playTactileSound('click');
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.maximizeWindow();
      return;
    }
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().toggleMaximize();
    }
  },

  closeWindow: async () => {
    get().playTactileSound('click');
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.closeWindow();
      return;
    }
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().close();
    }
  },
}));

// Backward-compatible hook with optional selector
export function useStore(): AppStoreState;
export function useStore<T>(selector: (state: AppStoreState) => T): T;
export function useStore<T>(selector?: (state: AppStoreState) => T) {
  if (selector) {
    return useAppStore(selector);
  }
  return useAppStore();
}

// Slice hooks for maximum performance
export const useNavigationState = () =>
  useAppStore(
    useShallow((s) => ({
      activeTab: s.activeTab,
      selectedGameId: s.selectedGameId,
      canGoBack: s.canGoBack,
      canGoForward: s.canGoForward,
      searchQuery: s.searchQuery,
      navigate: s.navigate,
      goBack: s.goBack,
      goForward: s.goForward,
      setSearchQuery: s.setSearchQuery,
    }))
  );

export const useTelemetryState = () =>
  useAppStore(
    useShallow((s) => ({
      speedTelemetryHistory: s.speedTelemetryHistory,
      downloads: s.downloads,
      isPausedAll: s.isPausedAll,
      diskSpace: s.diskSpace,
      pauseDownload: s.pauseDownload,
      resumeDownload: s.resumeDownload,
      cancelDownload: s.cancelDownload,
      togglePauseAllDownloads: s.togglePauseAllDownloads,
    }))
  );

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // 1. Accent color & localStorage synchronization
    const unsubAccent = useAppStore.subscribe((state, prevState) => {
      if (state.settings.primaryAccent !== prevState?.settings?.primaryAccent) {
        syncAccentCss(state.settings.primaryAccent);
      }
      if (state.settings !== prevState?.settings) {
        saveToStorage('oe_settings', state.settings);
      }
      if (state.games !== prevState?.games) {
        saveToStorage('oe_games', state.games);
      }
      if (state.currentUser !== prevState?.currentUser) {
        saveToStorage('oe_user', state.currentUser);
      }
      if (state.settings.downloadDirectory !== prevState?.settings?.downloadDirectory) {
        useAppStore.getState().refreshDiskSpace();
      }
    });

    syncAccentCss(useAppStore.getState().settings.primaryAccent);
    useAppStore.getState().refreshDiskSpace();

    // 2. Process exit listener from native bridge
    let unlistenFn: (() => void) | undefined;
    LauncherBridge.onProcessExit((payload) => {
      console.log('[OneEngine] Game process exited:', payload);
      const { runningGameId, addToast } = useAppStore.getState();
      if (runningGameId) {
        LauncherBridge.updateRichPresence(null);
        useAppStore.setState((prev) => ({
          runningGameId: null,
          runningGamePid: null,
          sessionElapsedSeconds: 0,
          games: prev.games.map((g) => (g.id === runningGameId ? { ...g, status: 'INSTALLED' } : g)),
          currentUser: {
            ...prev.currentUser,
            status: 'ONLINE',
            currentGame: undefined,
          },
        }));
        addToast(`Game process exited (Code: ${payload.code}).`, 'info');
      }
    }).then((cleanup) => {
      if (typeof cleanup === 'function') unlistenFn = cleanup;
    });

    // 2b. Tray quick-launch action listener
    let unlistenTrayFn: (() => void) | undefined;
    LauncherBridge.onTrayAction((action) => {
      if (action === 'launch-railbound') {
        useAppStore.getState().launchGame('railbound');
      }
    }).then((cleanup) => {
      if (typeof cleanup === 'function') unlistenTrayFn = cleanup;
    });

    // 2c. Deep-link protocol listener (oneengine://)
    let unlistenDeepLinkFn: (() => void) | undefined;
    LauncherBridge.onDeepLink((rawUrl) => {
      console.log('[OneEngine] Deep link received:', rawUrl);
      try {
        const urlStr = rawUrl.replace(/^oneengine:\/\//i, '');
        const segments = urlStr.split('/').filter(Boolean);
        const route = segments[0]?.toLowerCase();
        const param = segments[1];

        if (route === 'game' && param) {
          useAppStore.getState().navigate('game-detail', param);
        } else if (route === 'launch' && param) {
          useAppStore.getState().launchGame(param);
        } else if (route === 'library' || route === 'downloads' || route === 'settings' || route === 'community' || route === 'store') {
          useAppStore.getState().navigate(route as NavigationTab);
        }
      } catch (err) {
        console.error('[OneEngine] Failed to parse deep-link URL:', err);
      }
    }).then((cleanup) => {
      if (typeof cleanup === 'function') unlistenDeepLinkFn = cleanup;
    });

    // 3. Global keyboard shortcut listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        useAppStore.setState((s) => ({ isCommandPaletteOpen: !s.isCommandPaletteOpen }));
      } else if (e.key === 'Escape') {
        const { isCommandPaletteOpen, selectedArticle, isAuthModalOpen } = useAppStore.getState();
        if (isCommandPaletteOpen) {
          useAppStore.setState({ isCommandPaletteOpen: false });
        } else if (selectedArticle) {
          useAppStore.setState({ selectedArticle: null });
        } else if (isAuthModalOpen) {
          useAppStore.setState({ isAuthModalOpen: false });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 4. Download and telemetry simulation interval
    const downloadInterval = setInterval(() => {
      useAppStore.getState()._tickDownloads();
    }, 1000);

    // 5. Running game session timer
    const sessionInterval = setInterval(() => {
      const { runningGameId } = useAppStore.getState();
      if (runningGameId) {
        useAppStore.setState((s) => ({ sessionElapsedSeconds: s.sessionElapsedSeconds + 1 }));
      }
    }, 1000);

    return () => {
      unsubAccent();
      if (unlistenFn) unlistenFn();
      if (unlistenTrayFn) unlistenTrayFn();
      if (unlistenDeepLinkFn) unlistenDeepLinkFn();
      window.removeEventListener('keydown', handleKeyDown);
      clearInterval(downloadInterval);
      clearInterval(sessionInterval);
    };
  }, []);

  return <>{children}</>;
};
