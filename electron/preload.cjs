const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  launchGame: (payload) => ipcRenderer.invoke('launch-game', payload),
  killGame: (pid) => ipcRenderer.invoke('kill-game', pid),
  nakamaRequest: (payload) => ipcRenderer.invoke('nakama-request', payload),
  onGameExited: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('game-exited', handler);
    return () => ipcRenderer.removeListener('game-exited', handler);
  }
});
