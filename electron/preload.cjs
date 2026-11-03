const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  minimizeToTray: () => ipcRenderer.send('window-minimize-to-tray'),
  launchGame: (payload) => ipcRenderer.invoke('launch-game', payload),
  killGame: (pid) => ipcRenderer.invoke('kill-game', pid),
  onGameExited: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('game-exited', handler);
    return () => ipcRenderer.removeListener('game-exited', handler);
  },
  onTrayAction: (callback) => {
    const handler = (_event, action) => callback(action);
    ipcRenderer.on('tray-action', handler);
    return () => ipcRenderer.removeListener('tray-action', handler);
  },
  selectDirectory: (defaultPath) => ipcRenderer.invoke('select-directory', defaultPath),
  getDiskSpace: (targetPath) => ipcRenderer.invoke('get-disk-space', targetPath),
  verifyFileIntegrity: (filePath) => ipcRenderer.invoke('verify-file-integrity', filePath),
  getSystemSpecs: () => ipcRenderer.invoke('get-system-specs'),
});
