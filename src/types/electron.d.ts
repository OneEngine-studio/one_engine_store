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
  onGameExited: (callback: (data: { pid: number; code: number }) => void) => () => void;
  selectDirectory: (defaultPath?: string) => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
