export type GameStatus = 'UNINSTALLED' | 'DOWNLOADING' | 'INSTALLED' | 'RUNNING' | 'PAUSED';

/** A game as shown in the launcher: catalog data from the server plus what is on this PC. */
export interface Game {
  id: string;
  title: string;
  tagline: string;
  description: string;
  genre?: string;
  price: number | 'FREE';
  discountPercent?: number;
  /** Empty when the game has no artwork bundled with the launcher. */
  coverImage: string;
  heroBanner: string;
  tags: string[];
  developer: string;
  installed: boolean;
  installedVersion?: string;
  /** The server has a newer build than the one installed. */
  updateAvailable?: boolean;
  /** Size on disk in GB; 0 until the game is installed. */
  installSizeGb: number;
  isFavorite: boolean;
  /** Hours played on this PC, counted by the launcher while the game runs. */
  playHours: number;
  lastPlayed?: string;
  status: GameStatus;
  downloadProgress: number; // 0 - 100
}

export type DownloadStatus = 'DOWNLOADING' | 'VERIFYING' | 'EXTRACTING' | 'PAUSED' | 'FAILED' | 'COMPLETED';

export interface DownloadItem {
  gameId: string;
  title: string;
  coverImage: string;
  progress: number;
  receivedBytes: number;
  totalBytes: number;
  speedBps: number;
  status: DownloadStatus;
  etaSeconds: number;
  message?: string;
  version?: string;
}

export interface UserProfile {
  id: string;
  callsign: string;
  email?: string;
  avatarUrl: string;
  status: 'ONLINE' | 'IN_GAME' | 'AWAY';
  currentGame?: string;
  ownedGameIds: string[];
  emailVerified: boolean;
}

export type NavigationTab = 'store' | 'game-detail' | 'library' | 'downloads' | 'activity' | 'community' | 'settings';

export interface AppSettings {
  downloadDirectory: string;
  enableTactileAudio: boolean;
  /** Download speed cap in MB/s; 0 means no cap. */
  bandwidthLimitMBps: number;
}

export interface ClientNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'update' | 'system';
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}
