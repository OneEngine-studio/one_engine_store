// Build-time settings of this installation, read by the main process only.
//
// `npm run dist` writes electron/app-config.json (see scripts/write-app-config.cjs) with the public
// address of the OneEngine Platform API. The page cannot change it: it asks the main process.
// During development (not packaged) ONEENGINE_API_URL or the local default is used instead.
const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { cleanUrl } = require('./url-policy.cjs');

function readShipped() {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'app-config.json'), 'utf8'));
  } catch {
    return {};
  }
}

function load() {
  const packaged = app.isPackaged;
  const shipped = readShipped();
  const env = packaged ? {} : process.env;

  const platformApiUrl = packaged
    ? cleanUrl(shipped.platformApiUrl, { allowLocal: shipped.allowLocal === true })
    : cleanUrl(env.ONEENGINE_API_URL || shipped.platformApiUrl || 'http://127.0.0.1:8080', { allowLocal: true });

  // Game download, install and launch ship switched off until that phase is released.
  const gamesEnabled = packaged ? shipped.gamesEnabled === true : env.ONEENGINE_ENABLE_GAMES === 'true' || shipped.gamesEnabled === true;

  return { packaged, platformApiUrl, gamesEnabled, version: app.getVersion() };
}

let cached = null;
module.exports = { get: () => (cached ??= load()) };
