const { contextBridge, ipcRenderer } = require('electron');

const subscribe = (channel, callback) => {
  const handler = (_event, data) => callback(data);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
};

// Everything the page can do is listed here. Requests to the service go through a fixed set of routes in
// the main process; the page never receives a token and cannot pick the address.
contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  app: {
    info: () => ipcRenderer.invoke('app-info'),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
  },
  platform: {
    request: (payload) => ipcRenderer.invoke('platform-request', payload),
    restore: () => ipcRenderer.invoke('platform-restore'),
    signOut: () => ipcRenderer.invoke('platform-sign-out'),
    googleSignIn: () => ipcRenderer.invoke('platform-google-sign-in'),
    googleCancel: () => ipcRenderer.invoke('platform-google-cancel'),
  },
  library: {
    defaultDir: () => ipcRenderer.invoke('library-default-dir'),
    scan: (payload) => ipcRenderer.invoke('library-scan', payload),
    install: (payload) => ipcRenderer.invoke('install-game', payload),
    pause: (payload) => ipcRenderer.invoke('install-pause', payload),
    cancel: (payload) => ipcRenderer.invoke('install-cancel', payload),
    uninstall: (payload) => ipcRenderer.invoke('library-uninstall', payload),
    verify: (payload) => ipcRenderer.invoke('library-verify', payload),
    onProgress: (callback) => subscribe('install-progress', callback),
  },
  launchGame: (payload) => ipcRenderer.invoke('launch-game', payload),
  killGame: (payload) => ipcRenderer.invoke('kill-game', payload),
  onGameExited: (callback) => subscribe('game-exited', callback),
});
