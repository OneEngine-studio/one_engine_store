const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const RESOLUTIONS = [
  { width: 1000, height: 640, name: '1000x640' },
  { width: 1280, height: 720, name: '1280x720' },
  { width: 1920, height: 1080, name: '1920x1080' },
];

const outDir = path.join(__dirname, '../screenshots');

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function captureScreen(win, route, gameId, filename) {
  return new Promise((resolve, reject) => {
    // Listen for the renderer to confirm navigation is complete
    ipcMain.once('navigation-complete', async () => {
      try {
        const img = await win.capturePage();
        fs.writeFileSync(path.join(outDir, filename), img.toPNG());
        console.log('Saved:', filename);
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    // Trigger navigation in the renderer
    win.webContents.send('navigate', { route, gameId });
  });
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    show: false,
    frame: false,
    backgroundColor: '#07090C',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const indexPath = path.join(__dirname, '../dist/index.html');
  await win.loadFile(indexPath);

  try {
    for (const res of RESOLUTIONS) {
      console.log(`Capturing resolution: ${res.name}`);
      win.setSize(res.width, res.height, false);
      
      // Small delay to allow layout to settle after resize
      await new Promise((r) => setTimeout(r, 200));

      // Store Home
      await captureScreen(win, 'store', undefined, `store-home-${res.name}.png`);

      // Game Detail
      await captureScreen(win, 'game-detail', 'railbound', `game-detail-${res.name}.png`);

      // Library
      await captureScreen(win, 'library', undefined, `library-${res.name}.png`);

      // Downloads
      await captureScreen(win, 'downloads', undefined, `downloads-${res.name}.png`);

      // Settings
      await captureScreen(win, 'settings', undefined, `settings-${res.name}.png`);

      // Community
      await captureScreen(win, 'community', undefined, `community-${res.name}.png`);

      // Auth modal
      await win.webContents.executeJavaScript(`
        document.querySelector('button[title="Switch account"]')?.click();
      `);
      await new Promise((r) => setTimeout(r, 600)); // Wait for animation
      const authImg = await win.capturePage();
      fs.writeFileSync(path.join(outDir, `auth-modal-${res.name}.png`), authImg.toPNG());
      console.log('Saved:', `auth-modal-${res.name}.png`);

      // Close modal
      await win.webContents.executeJavaScript(`
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      `);
      await new Promise((r) => setTimeout(r, 400));
    }

    console.log('All screens accurately captured.');
  } catch (error) {
    console.error('Error during capture:', error);
  } finally {
    win.close();
    app.quit();
  }
});
