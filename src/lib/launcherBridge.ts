import type { InstallBuild, InstallProgress, InstallRecord, InstallResult, LaunchGamePayload, LaunchResult } from '../types/launcher';

// Everything that touches the player's disk or starts a process lives in the Electron main process
// (electron/installer.cjs). Opened in a plain browser there is no disk access, so these calls report
// that plainly instead of pretending: the page itself is only used that way for UI development.

const api = () => (typeof window !== 'undefined' ? window.electronAPI : undefined);

const NEEDS_DESKTOP = 'Installing and playing games needs the OneEngine Store desktop app.';

export const LauncherBridge = {
  /** True inside the desktop app, where games can be installed and started. */
  isAvailable(): boolean {
    return !!api()?.library;
  },

  async defaultLibraryDir(): Promise<string> {
    return (await api()?.library.defaultDir()) ?? '';
  },

  async scan(libraryDir: string): Promise<InstallRecord[]> {
    const res = await api()?.library.scan({ libraryDir });
    return res?.ok ? (res.installs ?? []) : [];
  },

  async install(gameId: string, libraryDir: string, build: InstallBuild, throttleMBps: number): Promise<InstallResult> {
    const bridge = api();
    if (!bridge) return { ok: false, status: 'error', message: NEEDS_DESKTOP };
    return bridge.library.install({ gameId, libraryDir, build, throttleMBps });
  },

  async pauseInstall(gameId: string): Promise<boolean> {
    return (await api()?.library.pause({ gameId })) ?? false;
  },

  async cancelInstall(libraryDir: string, gameId: string): Promise<boolean> {
    return (await api()?.library.cancel({ libraryDir, gameId }))?.ok ?? false;
  },

  async uninstall(libraryDir: string, gameId: string): Promise<{ ok: boolean; message?: string }> {
    return (await api()?.library.uninstall({ libraryDir, gameId })) ?? { ok: false, message: NEEDS_DESKTOP };
  },

  async verify(libraryDir: string, gameId: string): Promise<{ ok: boolean; message?: string }> {
    return (await api()?.library.verify({ libraryDir, gameId })) ?? { ok: false, message: NEEDS_DESKTOP };
  },

  onInstallProgress(callback: (progress: InstallProgress) => void): () => void {
    return api()?.library.onProgress(callback) ?? (() => {});
  },

  async launchGame(payload: LaunchGamePayload): Promise<LaunchResult> {
    const bridge = api();
    if (!bridge) return { success: false, message: NEEDS_DESKTOP };
    return bridge.launchGame(payload);
  },

  async killGame(gameId: string): Promise<boolean> {
    return (await api()?.killGame({ gameId })) ?? false;
  },

  onGameExited(callback: (status: { code: number; pid: number; gameId: string }) => void): () => void {
    return api()?.onGameExited(callback) ?? (() => {});
  },
};
