// Tells the player when a newer launcher has been released, and opens its download.
//
// The launcher does not replace itself: the installer is unsigned, so silently running a downloaded file would give
// whoever controls the releases repo code execution on every PC. Instead it reads the public release list, compares
// versions, and opens the official installer link in the browser, where the player chooses to run it.
const { app, ipcMain, shell } = require('electron');
const { isTrustedSender } = require('./security.cjs');

const RELEASES_REPO = 'oneenginedev/oneengine';
const LATEST_URL = `https://api.github.com/repos/${RELEASES_REPO}/releases/latest`;
const ALLOWED_PREFIX = `https://github.com/${RELEASES_REPO}/releases/`;

let cached = null; // { at, result }

/** -1, 0 or 1 for dotted numeric versions ("1.10.0" > "1.9.3"); a leading "v" is ignored. */
function compareVersions(a, b) {
  const parse = (v) => String(v).replace(/^v/i, '').split(/[.+-]/).slice(0, 3).map((n) => parseInt(n, 10) || 0);
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) {
    if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) > (y[i] ?? 0) ? 1 : -1;
  }
  return 0;
}

/** Turns GitHub's release JSON into what the page needs, keeping only links on the official releases repo. */
function summarize(release, current) {
  if (!release || typeof release.tag_name !== 'string' || release.draft || release.prerelease) return { available: false, current };
  const latest = release.tag_name.replace(/^v/i, '');
  const installer = (release.assets || []).find((a) => /\.exe$/i.test(a.name || ''));
  const downloadUrl = installer && String(installer.browser_download_url || '').startsWith(ALLOWED_PREFIX) ? installer.browser_download_url : '';
  const pageUrl = String(release.html_url || '').startsWith(ALLOWED_PREFIX) ? release.html_url : '';
  return {
    available: compareVersions(latest, current) > 0 && !!(downloadUrl || pageUrl),
    current,
    latest,
    pageUrl,
    downloadUrl,
    sizeBytes: installer ? installer.size || 0 : 0,
    notes: typeof release.body === 'string' ? release.body.slice(0, 2000) : '',
  };
}

async function check(force = false) {
  if (!force && cached && Date.now() - cached.at < 30 * 60 * 1000) return cached.result;
  const current = app.getVersion();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(LATEST_URL, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': `OneEngine-Store/${current}` },
      signal: ctrl.signal,
    });
    const result = res.ok ? summarize(await res.json(), current) : { available: false, current };
    cached = { at: Date.now(), result };
    return result;
  } catch {
    return { available: false, current, offline: true };
  } finally {
    clearTimeout(timer);
  }
}

function registerUpdateIpc() {
  ipcMain.handle('update-check', (event, payload) => (isTrustedSender(event) ? check(!!(payload && payload.force)) : { available: false }));
  ipcMain.handle('update-open', async (event) => {
    if (!isTrustedSender(event)) return false;
    const info = await check();
    const url = info.downloadUrl || info.pageUrl;
    if (!info.available || !url || !url.startsWith(ALLOWED_PREFIX)) return false;
    await shell.openExternal(url);
    return true;
  });
}

module.exports = { registerUpdateIpc, compareVersions, summarize };
