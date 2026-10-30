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
    icon: path.join(__dirname, '../public/images/logo.png'),
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

  if (process.env.NODE_ENV === 'production') {
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

  // Native HTTP dispatcher bypassing Chromium CORS
  ipcMain.handle('nakama-request', async (_event, payload) => {
    const { url, method = 'GET', headers = {}, body, timeoutMs = 8000 } = payload;
    const http = url.startsWith('https:') ? require('https') : require('http');

    return new Promise((resolve) => {
      try {
        const parsed = new URL(url);
        const req = http.request(
          {
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method: method,
            headers: headers,
            timeout: timeoutMs,
          },
          (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
              resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                statusText: res.statusMessage,
                data: data,
              });
            });
          }
        );

        req.on('timeout', () => {
          req.destroy();
          resolve({
            ok: false,
            status: 0,
            statusText: 'Connection timed out. Server or port 7350 might be firewalled.',
            data: '',
          });
        });

        req.on('error', (err) => {
          resolve({
            ok: false,
            status: 0,
            statusText: err.message,
            data: '',
          });
        });

        if (body) {
          req.write(typeof body === 'string' ? body : JSON.stringify(body));
        }
        req.end();
      } catch (err) {
        resolve({
          ok: false,
          status: 0,
          statusText: err.message,
          data: '',
        });
      }
    });
  });

  // Handle Game Process Execution with Headless Session Token Flags
  ipcMain.handle('launch-game', async (_event, payload) => {
    const { gamePath, authToken, playerName, userId, nakamaToken, nakamaRefreshToken } = payload;
    console.log(`[OneEngine Electron] Launching game for: ${playerName} (${userId})`);

    const effectiveToken = nakamaToken || authToken || '';
    const effectiveRefreshToken = nakamaRefreshToken || '';

    const args = [
      '--nakama-token', effectiveToken,
      '--nakama-refresh-token', effectiveRefreshToken,
      '--auth-token', effectiveToken,
      '--player-name', playerName || '',
      '--user-id', userId || '',
    ];

    try {
      let child;
      if (gamePath && fs.existsSync(gamePath)) {
        // Spawn real Unity game executable
        child = spawn(gamePath, args, { detached: false });
      } else {
        // Dev fallback simulation process (alive for 15s)
        console.log(`[OneEngine Electron] Target '${gamePath}' not found on disk. Spawning mock process.`);
        if (process.platform === 'win32') {
          child = spawn('cmd.exe', ['/c', `echo [Railbound Mock] Launched with token: ${authToken} & ping 127.0.0.1 -n 15 > nul`]);
        } else {
          child = spawn('sh', ['-c', `echo [Railbound Mock] Launched with token: ${authToken} && sleep 15`]);
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
