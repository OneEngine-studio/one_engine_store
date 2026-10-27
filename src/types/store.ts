export type GameStatus = 'UNINSTALLED' | 'DOWNLOADING' | 'INSTALLED' | 'RUNNING' | 'PAUSED';

export interface GameDLC {
  id: string;
  title: string;
  description: string;
  price: number;
  owned: boolean;
}

export interface Game {
  id: string;
  title: string;
  tagline: string;
  description: string;
  price: number | 'FREE';
  discountPercent?: number;
  coverImage: string;
  heroBanner: string;
  screenshots: string[];
  tags: string[];
  rating: number; // 0 - 100
  ratingBreakdown: {
    positivePercent: number;
    totalReviews: number;
  };
  developer: string;
  publisher: string;
  releaseDate: string;
  installed: boolean;
  installSizeGb: number;
  isFavorite: boolean;
  playHours: number;
  lastPlayed?: string;
  status: GameStatus;
  downloadProgress: number; // 0 - 100
  downloadSpeedMbps: number;
  category: 'FEATURED' | 'TRENDING_TACTICAL' | 'EARLY_ACCESS' | 'RECOMMENDED';
  achievements: {
    unlocked: number;
    total: number;
  };
  dlcs: GameDLC[];
  patchNotes: Array<{
    version: string;
    date: string;
    notes: string[];
  }>;
  systemRequirements: {
    minimum: {
      os: string;
      processor: string;
      memory: string;
      graphics: string;
      storage: string;
    };
    recommended: {
      os: string;
      processor: string;
      memory: string;
      graphics: string;
      storage: string;
    };
  };
}

export interface DownloadItem {
  gameId: string;
  title: string;
  coverImage: string;
  progress: number;
  downloadedGb: number;
  totalGb: number;
  speedMbps: number;
  diskSpeedMbps: number;
  status: 'DOWNLOADING' | 'PAUSED' | 'COMPLETED';
  etaSeconds: number;
}

export interface UserProfile {
  id: string;
  callsign: string;
  rank: string;
  level: number;
  avatarUrl: string;
  status: 'ONLINE' | 'IN_GAME' | 'AWAY';
  currentGame?: string;
  walletBalance: number;
  role: 'OPERATOR' | 'DEVELOPER' | 'ADMIN';
  ownedGameIds: string[];
}

export type NavigationTab = 'store' | 'game-detail' | 'library' | 'downloads' | 'community' | 'settings';

export interface AppSettings {
  launchOnStartup: boolean;
  downloadDirectory: string;
  primaryAccent: string;
  enableTactileAudio: boolean;
  hardwareAcceleration: boolean;
  devTelemetryMode: boolean;
  bandwidthThrottleMbps: number;
}

export interface Article {
  id: string;
  title: string;
  gameTitle: string;
  gameId: string;
  category: 'PATCH_NOTES' | 'DEV_LOGS' | 'COMMUNITY_SPOTLIGHT';
  date: string;
  author: string;
  cover: string;
  summary: string;
  content: string[];
  likes: number;
  hasLiked: boolean;
  comments: number;
}

export interface ClientNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'update' | 'friend' | 'system';
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}
