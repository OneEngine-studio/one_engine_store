import { LaunchGamePayload, LaunchResult } from '../types/launcher';
import { DiskSpaceInfo, FileIntegrityResult } from '../types/electron';

// Dynamic invoke helper that checks if running inside Tauri runtime
async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<T>(cmd, args);
  }
  
  // Dev / Browser mock fallback
  console.log(`[Browser Mock Invoke] ${cmd}:`, args);
  if (cmd === 'launch_game') {
    return { success: true, pid: 1337, message: 'Game launched in simulation mode' } as T;
  }
  if (cmd === 'check_game_installed') {
    return true as T;
  }
  if (cmd === 'select_directory') {
    return null as T;
  }
  return null as T;
}

export const LauncherBridge = {
  async launchGame(payload: LaunchGamePayload): Promise<LaunchResult> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.launchGame(payload);
    }
    return tauriInvoke<LaunchResult>('launch_game', {
      gamePath: payload.gamePath,
      authToken: payload.authToken,
      playerName: payload.playerName,
      userId: payload.userId,
    });
  },

  async checkInstalled(gamePath: string): Promise<boolean> {
    return tauriInvoke<boolean>('check_game_installed', { gamePath });
  },

  async killGameProcess(pid: number): Promise<boolean> {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.killGame(pid);
    }
    return tauriInvoke<boolean>('kill_game_process', { pid });
  },

  async onProcessExit(callback: (status: { code: number; pid: number }) => void) {
    if (typeof window !== 'undefined' && window.electronAPI) {
      return window.electronAPI.onGameExited(callback);
    }
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { listen } = await import('@tauri-apps/api/event');
      return listen<{ code: number; pid: number }>('game-process-exited', (event) => {
        callback(event.payload);
      });
    }
    return () => {};
  },

  async onTrayAction(callback: (action: string) => void) {
    if (typeof window !== 'undefined' && window.electronAPI?.onTrayAction) {
      return window.electronAPI.onTrayAction(callback);
    }
    return () => {};
  },

  async minimizeToTray(): Promise<void> {
    if (typeof window !== 'undefined' && window.electronAPI?.minimizeToTray) {
      window.electronAPI.minimizeToTray();
      return;
    }
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().hide();
    }
  },

  async selectDirectory(defaultPath?: string): Promise<string | null> {
    if (typeof window !== 'undefined' && window.electronAPI?.selectDirectory) {
      return window.electronAPI.selectDirectory(defaultPath);
    }
    if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
      return tauriInvoke<string | null>('select_directory', { defaultPath });
    }
    return null;
  },

  async getDiskSpace(targetPath?: string): Promise<DiskSpaceInfo> {
    if (typeof window !== 'undefined' && window.electronAPI?.getDiskSpace) {
      return window.electronAPI.getDiskSpace(targetPath);
    }
    return {
      freeGb: 44.3,
      totalGb: 254.5,
      usedGb: 210.2,
      drive: 'C:\\'
    };
  },

  async verifyFileIntegrity(filePath: string): Promise<FileIntegrityResult> {
    if (typeof window !== 'undefined' && window.electronAPI?.verifyFileIntegrity) {
      return window.electronAPI.verifyFileIntegrity(filePath);
    }
    return {
      verified: true,
      simulated: true,
      message: 'Integrity check: Local blocks verified (100% valid manifest).',
    };
  }
};
