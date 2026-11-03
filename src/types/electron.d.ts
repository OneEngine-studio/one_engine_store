export interface DiskSpaceInfo {
  freeGb: number;
  totalGb: number;
  usedGb: number;
  drive: string;
}

export interface FileIntegrityResult {
  verified: boolean;
  simulated?: boolean;
  hash?: string;
  fileSizeMb?: number;
  message: string;
}

export interface SystemSpecs {
  cpuModel: string;
  cpuCores: number;
  totalRamGb: number;
  freeRamGb: number;
  os: string;
  arch: string;
}

export interface ElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  minimizeToTray: () => void;
  launchGame: (payload: {
    gamePath: string;
    authToken: string;
    playerName: string;
    userId: string;
  }) => Promise<{ success: boolean; pid?: number; message?: string }>;
  killGame: (pid: number) => Promise<boolean>;
  onGameExited: (callback: (data: { pid: number; code: number }) => void) => () => void;
  onTrayAction: (callback: (action: string) => void) => () => void;
  selectDirectory: (defaultPath?: string) => Promise<string | null>;
  getDiskSpace: (targetPath?: string) => Promise<DiskSpaceInfo>;
  verifyFileIntegrity: (filePath: string) => Promise<FileIntegrityResult>;
  getSystemSpecs: () => Promise<SystemSpecs>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

