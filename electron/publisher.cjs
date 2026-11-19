// Uploads a game build for accounts the Platform API lists as publishers.
//
// The page never picks a file path or sees a token: the zip is chosen in a native dialog here, its contents are
// checked here (the server checks again), and it is streamed to the Platform API with the player's own sign-in.
// Progress is sent back to the page; nothing is held in memory, so multi-GB builds are fine.
const { BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const appConfig = require('./config.cjs');
const { isTrustedSender } = require('./security.cjs');
const platform = require('./platform.cjs');

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const VERSION = /^[A-Za-z0-9._-]{1,64}$/;
const EXECUTABLE = /^[A-Za-z0-9._ -]{1,64}\.exe$/i;

let picked = null; // { file, name, size }
let active = null; // the request in flight

const problem = (status, code, message) => ({ status, data: { error: { code, message } } });

/** Names inside a zip, read from its central directory only (Zip64 aware). Mirrors the server's src/zip.ts. */
function zipEntryNames(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const size = fs.fstatSync(fd).size;
    const readAt = (pos, len) => {
      const b = Buffer.alloc(len);
      return b.subarray(0, fs.readSync(fd, b, 0, len, pos));
    };
    const tailLen = Math.min(size, 22 + 0xffff);
    const tail = readAt(size - tailLen, tailLen);
    let e = -1;
    for (let i = tail.length - 22; i >= 0; i--) if (tail.readUInt32LE(i) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error('not a zip');
    let count = tail.readUInt16LE(e + 10);
    let dirSize = tail.readUInt32LE(e + 12);
    let dirOffset = tail.readUInt32LE(e + 16);
    if (count === 0xffff || dirSize === 0xffffffff || dirOffset === 0xffffffff) {
      const loc = e - 20;
      if (loc < 0 || tail.readUInt32LE(loc) !== 0x07064b50) throw new Error('bad zip64');
      const z = readAt(Number(tail.readBigUInt64LE(loc + 8)), 56);
      count = Number(z.readBigUInt64LE(32));
      dirSize = Number(z.readBigUInt64LE(40));
      dirOffset = Number(z.readBigUInt64LE(48));
    }
    const dir = readAt(dirOffset, dirSize);
    const names = [];
    let p = 0;
    for (let i = 0; i < count; i++) {
      if (dir.readUInt32LE(p) !== 0x02014b50) throw new Error('bad directory');
      const n = dir.readUInt16LE(p + 28);
      names.push(dir.subarray(p + 46, p + 46 + n).toString('utf8'));
      p += 46 + n + dir.readUInt16LE(p + 30) + dir.readUInt16LE(p + 32);
    }
    return names;
  } finally {
    fs.closeSync(fd);
  }
}

/** The .exe files a launcher could start: at the top, or inside one wrapping folder. Crash handlers are left out. */
function exeCandidates(names) {
  const tops = new Set(names.map((n) => n.split('/')[0]));
  const prefix = tops.size === 1 ? `${[...tops][0]}/` : '';
  return names
    .map((n) => (prefix && n.startsWith(prefix) ? n.slice(prefix.length) : n))
    .filter((n) => !n.includes('/') && /\.exe$/i.test(n) && !/crashhandler/i.test(n));
}

async function pickZip(win) {
  const res = await dialog.showOpenDialog(win, {
    title: 'Choose the game build (.zip)',
    filters: [{ name: 'Zip archive', extensions: ['zip'] }],
    properties: ['openFile'],
  });
  if (res.canceled || !res.filePaths[0]) return { ok: false };
  const file = res.filePaths[0];
  let names;
  try {
    names = zipEntryNames(file);
  } catch {
    picked = null;
    return { ok: false, message: 'That file is not a readable zip.' };
  }
  const debug = names.some((n) => /DoNotShip|BurstDebugInformation/i.test(n));
  picked = { file, name: path.basename(file), size: fs.statSync(file).size };
  return { ok: true, name: picked.name, size: picked.size, files: names.length, executables: exeCandidates(names), hasDebugFolders: debug };
}

async function authed(route, method = 'GET') {
  const base = appConfig.get().platformApiUrl;
  const token = await platform.accessToken();
  if (!base || !token) return problem(401, 'auth_required', 'Sign in to publish builds.');
  try {
    const res = await fetch(`${base}${route}`, { method, headers: { authorization: `Bearer ${token}` } });
    const text = await res.text();
    return { status: res.status, data: text ? JSON.parse(text) : {} };
  } catch {
    return problem(0, 'unreachable', "Can't reach the OneEngine service.");
  }
}

async function upload(win, { productId, version, executable } = {}) {
  if (!picked) return problem(0, 'no_file', 'Choose a zip first.');
  if (active) return problem(0, 'busy', 'An upload is already running.');
  if (!ID.test(productId || '')) return problem(0, 'bad_request', 'Choose a game.');
  if (!VERSION.test(version || '')) return problem(0, 'bad_version', 'Version may only use letters, digits, dot, dash and underscore.');
  if (!EXECUTABLE.test(executable || '')) return problem(0, 'bad_executable', 'Name the game .exe, for example Railbound.exe.');
  const base = appConfig.get().platformApiUrl;
  const token = await platform.accessToken();
  if (!base || !token) return problem(401, 'auth_required', 'Sign in to publish builds.');

  const url = new URL(`${base}/v1/publisher/products/${encodeURIComponent(productId)}/builds`);
  url.searchParams.set('version', version);
  url.searchParams.set('executable', executable);
  url.searchParams.set('platform', 'win64');
  const { file, size } = picked;
  const lib = url.protocol === 'https:' ? https : http;
  const send = (data) => win && !win.isDestroyed() && win.webContents.send('publisher-progress', data);

  return new Promise((resolve) => {
    const req = lib.request(url, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/zip', 'content-length': size },
    });
    active = req;
    let sent = 0;
    let lastEmit = 0;
    const started = Date.now();
    const stream = fs.createReadStream(file, { highWaterMark: 1024 * 1024 });
    stream.on('data', (chunk) => {
      sent += chunk.length;
      const now = Date.now();
      if (now - lastEmit > 250 || sent === size) {
        lastEmit = now;
        send({ phase: sent === size ? 'checking' : 'uploading', sent, total: size, speedBps: sent / Math.max(0.001, (now - started) / 1000) });
      }
    });
    stream.on('error', () => req.destroy(new Error('read_failed')));
    stream.pipe(req);
    req.on('response', (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        active = null;
        let data = {};
        try {
          data = body ? JSON.parse(body) : {};
        } catch {
          data = problem(res.statusCode || 502, 'bad_response', 'The service sent an unexpected answer.').data;
        }
        if (res.statusCode === 201) picked = null;
        send({ phase: 'done', sent, total: size });
        resolve({ status: res.statusCode || 0, data });
      });
    });
    req.on('error', (err) => {
      active = null;
      stream.destroy();
      send({ phase: 'done', sent, total: size });
      resolve(
        err.message === 'cancelled'
          ? problem(0, 'cancelled', 'Upload cancelled. Nothing was published.')
          : problem(0, 'upload_failed', 'The upload did not finish. Check your connection and try again.')
      );
    });
  });
}

function registerPublisherIpc() {
  const guarded = (fn) => (event, payload) => (isTrustedSender(event) ? fn(BrowserWindow.fromWebContents(event.sender), payload) : problem(0, 'forbidden', 'Request refused.'));
  ipcMain.handle('publisher-products', guarded(() => authed('/v1/publisher/products')));
  ipcMain.handle('publisher-pick-zip', guarded((win) => pickZip(win)));
  ipcMain.handle('publisher-upload', guarded((win, payload) => upload(win, payload || {})));
  ipcMain.handle('publisher-cancel', guarded(() => {
    if (active) active.destroy(new Error('cancelled'));
    return { ok: true };
  }));
}

module.exports = { registerPublisherIpc, exeCandidates, zipEntryNames };
