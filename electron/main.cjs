const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

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
      webSecurity: false,
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

  // Start the game with a one-time launch ticket
  ipcMain.handle('launch-game', async (_event, payload) => {
    const { gamePath, ticket, playerName, userId } = payload;
    console.log(`[OneEngine Electron] Launching game for: ${playerName} (${userId})`);

    if (!ticket) {
      return { success: false, message: 'No launch ticket. Sign in and try again.' };
    }

    // The ticket is single use and expires in 60 s, so it is safe on a command line.
    const args = [`--oe-ticket=${ticket}`, `--oe-user=${userId || ''}`, `--oe-name=${playerName || ''}`];

    try {
      let child;
      if (gamePath && fs.existsSync(gamePath)) {
        // Spawn real Unity game executable
        child = spawn(gamePath, args, { detached: false });
      } else {
        // Dev fallback simulation process (alive for 15s)
        console.log(`[OneEngine Electron] Target '${gamePath}' not found on disk. Spawning mock process.`);
        if (process.platform === 'win32') {
          child = spawn('cmd.exe', ['/c', 'echo [Railbound Mock] Launched with a ticket & ping 127.0.0.1 -n 15 > nul']);
        } else {
          child = spawn('sh', ['-c', 'echo [Railbound Mock] Launched with a ticket && sleep 15']);
        }
      }

      const pid = child.pid;
      console.log(`[OneEngine Electron] Process spawned successfully. PID: ${pid}`);

      child.on('close', (code) => {
        console.log(`[OneEngine Electron] Game process (PID: ${pid}) exited with code ${code}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('game-exited', { pid, code });
        }
      });

      return { success: true, pid, message: `Process spawned. PID: ${pid}` };
    } catch (err) {
      console.error('[OneEngine Electron] Launch failed:', err);
      return { success: false, message: err.message };
    }
  });

  ipcMain.handle('kill-game', async (_event, pid) => {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/PID', pid.toString(), '/F']);
      } else {
        process.kill(pid, 'SIGKILL');
      }
      return true;
    } catch {
      return false;
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
