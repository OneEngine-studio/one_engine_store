import { LaunchGamePayload, LaunchResult } from '../types/launcher';

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
      nakamaToken: payload.nakamaToken,
      nakamaRefreshToken: payload.nakamaRefreshToken,
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
  }
};
