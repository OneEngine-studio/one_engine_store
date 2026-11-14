export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  launchGame: (payload: {
    gamePath: string;
    ticket: string;
    playerName: string;
    userId: string;
  }) => Promise<{ success: boolean; pid?: number; message?: string }>;
  killGame: (pid: number) => Promise<boolean>;
  onGameExited: (callback: (data: { pid: number; code: number }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
