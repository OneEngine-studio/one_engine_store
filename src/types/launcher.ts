export type GameStatus = 'UNINSTALLED' | 'DOWNLOADING' | 'UPDATING' | 'READY' | 'RUNNING';

export interface UserSession {
  userId: string;
  email: string;
  callsign: string;
  authToken: string;
  avatarUrl?: string;
  isOnline: boolean;
}

export interface GameInfo {
  id: string;
  title: string;
  tagline: string;
  version: string;
  installedVersion?: string;
  executableName: string;
  installPath: string;
  bannerImage: string;
  status: GameStatus;
  downloadProgress: number; // 0 - 100
  sizeGb: number;
  patchNotes: Array<{
    version: string;
    date: string;
    notes: string[];
  }>;
  systemRequirements: {
    os: string;
    processor: string;
    memory: string;
    graphics: string;
    storage: string;
  };
}

export interface LaunchGamePayload {
  gamePath: string;
  authToken: string;
  playerName: string;
  userId: string;
}

export interface LaunchResult {
  success: boolean;
  pid?: number;
  message?: string;
}
