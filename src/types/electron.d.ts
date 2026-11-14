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
  app: {
    info: () => Promise<{ version: string; serviceConfigured: boolean; serviceUrl: string; gamesEnabled: boolean }>;
    openExternal: (url: string) => Promise<boolean>;
  };
  platform: {
    request: (payload: {
      path: string;
      method?: string;
      body?: unknown;
    }) => Promise<{ status: number; data: Record<string, unknown> }>;
    restore: () => Promise<{ ok: boolean }>;
    signOut: () => Promise<{ ok: boolean }>;
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
