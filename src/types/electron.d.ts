export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  launchGame: (payload: {
    gamePath: string;
    authToken: string;
    playerName: string;
    userId: string;
  }) => Promise<{ success: boolean; pid?: number; message?: string }>;
  killGame: (pid: number) => Promise<boolean>;
  nakamaRequest: (payload: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
    timeoutMs?: number;
  }) => Promise<{ ok: boolean; status: number; statusText: string; data: string }>;
  onGameExited: (callback: (data: { pid: number; code: number }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
