import type {
  InstallBuild,
  InstallProgress,
  InstallRecord,
  InstallResult,
  LaunchGamePayload,
  LaunchResult,
} from './launcher';

export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  platform: {
    request: (payload: {
      baseUrl: string;
      path: string;
      method?: string;
      body?: unknown;
      auth?: boolean;
    }) => Promise<{ status: number; data: Record<string, unknown> }>;
    restore: (payload: { baseUrl: string }) => Promise<{ ok: boolean }>;
    signOut: (payload: { baseUrl: string }) => Promise<{ ok: boolean }>;
  };
  library: {
    defaultDir: () => Promise<string>;
    scan: (payload: { libraryDir: string }) => Promise<{ ok: boolean; installs?: InstallRecord[]; message?: string }>;
    install: (payload: {
      gameId: string;
      libraryDir: string;
      build: InstallBuild;
      throttleMBps?: number;
    }) => Promise<InstallResult>;
    pause: (payload: { gameId: string }) => Promise<boolean>;
    cancel: (payload: { libraryDir: string; gameId: string }) => Promise<{ ok: boolean; message?: string }>;
    uninstall: (payload: { libraryDir: string; gameId: string }) => Promise<{ ok: boolean; message?: string }>;
    verify: (payload: { libraryDir: string; gameId: string }) => Promise<{ ok: boolean; message?: string }>;
    onProgress: (callback: (progress: InstallProgress) => void) => () => void;
  };
  launchGame: (payload: LaunchGamePayload) => Promise<LaunchResult>;
  killGame: (payload: { gameId: string }) => Promise<boolean>;
  onGameExited: (callback: (data: { pid: number; gameId: string; code: number }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
