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
    info: () => Promise<{ version: string; serviceConfigured: boolean; serviceUrl: string; paymentsEnabled?: boolean; gamesEnabled: boolean }>;
    openExternal: (url: string) => Promise<boolean>;
  };
  updates: {
    check: (payload?: { force?: boolean }) => Promise<{
      available: boolean;
      current?: string;
      latest?: string;
      pageUrl?: string;
      downloadUrl?: string;
      sizeBytes?: number;
      notes?: string;
      offline?: boolean;
    }>;
    open: () => Promise<boolean>;
  };
  publisher: {
    products: () => Promise<{ status: number; data: Record<string, unknown> }>;
    pickZip: () => Promise<{
      ok: boolean;
      message?: string;
      name?: string;
      size?: number;
      files?: number;
      executables?: string[];
      hasDebugFolders?: boolean;
    }>;
    upload: (payload: { productId: string; version: string; executable: string }) => Promise<{ status: number; data: Record<string, unknown> }>;
    cancel: () => Promise<{ ok: boolean }>;
    onProgress: (callback: (data: { phase: 'uploading' | 'checking' | 'done'; sent: number; total: number; speedBps?: number }) => void) => () => void;
  };
  payments: {
    request: (payload: {
      path: string;
      method?: string;
      body?: unknown;
      idempotencyKey?: string;
    }) => Promise<{ status: number; data: Record<string, unknown> }>;
  };
  platform: {
    request: (payload: {
      path: string;
      method?: string;
      body?: unknown;
    }) => Promise<{ status: number; data: Record<string, unknown> }>;
    restore: () => Promise<{ ok: boolean }>;
    signOut: () => Promise<{ ok: boolean }>;
    googleSignIn: () => Promise<{ status: number; data: Record<string, unknown> }>;
    googleCancel: () => Promise<{ ok: boolean }>;
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
