const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const appConfig = require('./config.cjs');
const { isAppUrl, isTrustedSender, DEV_ORIGIN } = require('./security.cjs');
const { registerPlatformIpc } = require('./platform.cjs');
const { registerInstallerIpc, stopEverything } = require('./installer.cjs');

let mainWindow = null;

// The Windows installer and the taskbar group the app under this id.
app.setAppUserModelId('dev.oneengine.store');

// Only one launcher at a time: a second start brings the first window forward.
if (!app.requestSingleInstanceLock()) {
  app.quit();
}
app.on('second-instance', () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

/** Opens a link in the person's own browser. Only https links are ever handed to the system. */
function openExternal(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' && !parsed.username && !parsed.password) {
      shell.openExternal(parsed.href);
      return true;
    }
  } catch {
    // not a URL
  }
  return false;
}

function lockDownSession() {
  // The launcher needs no camera, microphone, location, notifications or device access.
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 780,
    minWidth: 960,
    minHeight: 640,
    frame: false,
    // vite copies public/ into dist/, which is what ships in the installer
    icon: path.join(__dirname, app.isPackaged ? '../dist/images/logo.png' : '../public/images/logo.png'),
    backgroundColor: '#050505',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false,
      devTools: !app.isPackaged,
    },
  });

  const contents = mainWindow.webContents;
  // Links that want a new window go to the system browser; the app window itself never navigates away.
  contents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  contents.on('will-navigate', (event, url) => {
    if (isAppUrl(url)) return;
    event.preventDefault();
    openExternal(url);
  });
  contents.on('will-attach-webview', (event) => event.preventDefault());

  if (app.isPackaged || process.env.NODE_ENV === 'production') {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL(DEV_ORIGIN);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Window controls and the few facts the page may ask for.
function registerAppIpc() {
  const fromApp = (fn) => (event, ...args) => (isTrustedSender(event) ? fn(...args) : undefined);

  ipcMain.on('window-minimize', fromApp(() => mainWindow && mainWindow.minimize()));
  ipcMain.on('window-maximize', fromApp(() => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }));
  ipcMain.on('window-close', fromApp(() => mainWindow && mainWindow.close()));

  ipcMain.handle('app-info', fromApp(() => {
    const cfg = appConfig.get();
    return { version: cfg.version, serviceConfigured: !!cfg.platformApiUrl, serviceUrl: cfg.platformApiUrl, gamesEnabled: cfg.gamesEnabled };
  }));
  ipcMain.handle('open-external', fromApp((url) => openExternal(url)));
}

app.whenReady().then(() => {
  lockDownSession();
  registerAppIpc();
  registerPlatformIpc();
  const cfg = appConfig.get();
  if (cfg.gamesEnabled) {
    registerInstallerIpc(() => mainWindow, { isTrustedSender, downloadOrigin: cfg.platformApiUrl });
  }
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', stopEverything);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
