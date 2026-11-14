const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { registerPlatformIpc } = require('./platform.cjs');
const { registerInstallerIpc, stopEverything } = require('./installer.cjs');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    // vite copies public/ into dist/, which is what ships in the installer
    icon: path.join(__dirname, app.isPackaged ? '../dist/images/logo.png' : '../public/images/logo.png'),
    backgroundColor: '#090B0E',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: true,
    },
  });

  const devUrl = 'http://localhost:1420';

  if (app.isPackaged || process.env.NODE_ENV === 'production') {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL(devUrl);
  }

  // Handle native window controls
  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.close();
  });
}

app.whenReady().then(() => {
  registerPlatformIpc();
  registerInstallerIpc(() => mainWindow);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', stopEverything);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
