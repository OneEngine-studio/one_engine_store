export interface InstallRecord {
  gameId: string;
  buildId: string;
  version: string;
  executable: string;
  executablePath: string;
  sha256: string;
  sizeBytes: number;
  installedAt: string;
}

export interface InstallBuild {
  buildId: string;
  version: string;
  executable: string;
  sha256: string;
  sizeBytes: number;
  downloadUrl: string;
}

export type InstallPhase = 'downloading' | 'verifying' | 'extracting' | 'paused' | 'cancelled' | 'error' | 'done';

export interface InstallProgress {
  gameId: string;
  phase: InstallPhase;
  total: number;
  received?: number;
  speedBps?: number;
  message?: string;
}

export interface InstallResult {
  ok: boolean;
  status: 'done' | 'paused' | 'cancelled' | 'error';
  message?: string;
  install?: InstallRecord | null;
}

export interface LaunchGamePayload {
  libraryDir: string;
  gameId: string;
  /** Single-use launch ticket from the Platform API; the game trades it for a Nakama session. */
  ticket: string;
  playerName: string;
  userId: string;
}

export interface LaunchResult {
  success: boolean;
  pid?: number;
  message?: string;
}
