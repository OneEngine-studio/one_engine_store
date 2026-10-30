const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const RESOLUTIONS = [
  { width: 1000, height: 640, name: '1000x640' },
  { width: 1280, height: 720, name: '1280x720' },
  { width: 1920, height: 1080, name: '1920x1080' },
];

const outDir = path.join(__dirname, '../screenshots');

async function captureScreen(win, route, gameId, filename) {
  await win.webContents.executeJavaScript(`
    window.__navigate("${route}", ${gameId ? `"${gameId}"` : 'undefined'});
  `);
  await new Promise((r) => setTimeout(r, 800));
  const img = await win.capturePage();
  fs.writeFileSync(path.join(outDir, filename), img.toPNG());
  console.log('Saved:', filename);
}

app.whenReady().then(async () => {
  for (const res of RESOLUTIONS) {
    const win = new BrowserWindow({
      width: res.width,
      height: res.height,
      show: false,
      frame: false,
      backgroundColor: '#07090C',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    const indexPath = path.join(__dirname, '../dist/index.html');
    await win.loadFile(indexPath);
    await new Promise((r) => setTimeout(r, 1500));

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
    await new Promise((r) => setTimeout(r, 600));
    const authImg = await win.capturePage();
    fs.writeFileSync(path.join(outDir, `auth-modal-${res.name}.png`), authImg.toPNG());
    console.log('Saved:', `auth-modal-${res.name}.png`);

    // Close modal
    await win.webContents.executeJavaScript(`
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    `);
    await new Promise((r) => setTimeout(r, 400));

    win.close();
  }

  console.log('All screens accurately captured.');
  app.quit();
});
