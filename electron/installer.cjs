// Downloads, verifies and installs game builds, and starts them.
//
// A build is a zip served by the Platform API depot. It is downloaded to a partial file (resumable),
// checked against the SHA-256 the server published, unpacked into a staging folder and only then moved
// into place, so a half-finished or tampered download never ends up as a playable install.
//
// Layout under the library folder:
//   <library>/<gameId>/current/...      the unpacked game
//   <library>/<gameId>/install.json     what is installed (version, executable, size)
//   <library>/.downloads/<gameId>__<buildId>.zip  partial or finished download, removed after install
const { ipcMain } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const yauzl = require('yauzl');
const { pipeline } = require('stream/promises');

const GAME_ID = /^[a-z0-9][a-z0-9_-]{0,63}$/i;
const SHA256 = /^[0-9a-f]{64}$/i;
const PROGRESS_INTERVAL_MS = 250;
// A build far bigger than this is not a game; refusing it also stops a zip bomb from filling the disk.
const MAX_UNPACKED_BYTES = 64 * 1024 ** 3;

const jobs = new Map(); // gameId -> { abort: AbortController, intent: 'pause' | 'cancel' | null }
const running = new Map(); // gameId -> child process

let getWindow = () => null;

const send = (channel, payload) => {
  const win = getWindow();
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
};

const defaultLibraryDir = () => path.join(os.homedir(), 'OneEngine', 'Games');

function libraryRoot(input) {
  const dir = typeof input === 'string' && input.trim() ? input.trim() : defaultLibraryDir();
  if (!path.isAbsolute(dir)) throw new Error('The install folder must be a full path.');
  const resolved = path.resolve(dir);
  if (resolved === path.parse(resolved).root) throw new Error('Choose a folder, not a whole drive.');
  return resolved;
}

function gameDir(root, gameId) {
  if (typeof gameId !== 'string' || !GAME_ID.test(gameId)) throw new Error('Unknown game.');
  return path.join(root, gameId);
}

/** The executable path from the server must stay inside the unpacked game folder. */
function executableIn(currentDir, executable) {
  if (typeof executable !== 'string' || !executable || path.isAbsolute(executable)) {
    throw new Error('The build does not name a valid executable.');
  }
  const full = path.resolve(currentDir, executable);
  if (!full.startsWith(currentDir + path.sep)) throw new Error('The build does not name a valid executable.');
  return full;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retry(fn, attempts = 6) {
  for (let i = 0; ; i++) {
    try {
      return fn();
    } catch (err) {
      // Windows keeps folders locked for a moment while antivirus scans freshly written files.
      if (i >= attempts - 1 || !['EPERM', 'EBUSY', 'EACCES', 'ENOTEMPTY'].includes(err.code)) throw err;
      await sleep(250 * (i + 1));
    }
  }
}

function readInstall(root, gameId) {
  try {
    const dir = gameDir(root, gameId);
    const record = JSON.parse(fs.readFileSync(path.join(dir, 'install.json'), 'utf8'));
    const exe = executableIn(path.join(dir, 'current'), record.executable);
    if (!fs.existsSync(exe)) return null;
    return { ...record, gameId, executablePath: exe };
  } catch {
    return null;
  }
}

function freeBytes(dir) {
  let probe = dir;
  while (!fs.existsSync(probe)) {
    const parent = path.dirname(probe);
    if (parent === probe) return Infinity;
    probe = parent;
  }
  try {
    const stat = fs.statfsSync(probe);
    return stat.bavail * stat.bsize;
  } catch {
    return Infinity;
  }
}

function dirSize(dir) {
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSize(full) : fs.statSync(full).size;
  }
  return total;
}

async function sha256Of(file, signal) {
  const hash = crypto.createHash('sha256');
  for await (const chunk of fs.createReadStream(file)) {
    if (signal.aborted) throw abortError();
    hash.update(chunk);
  }
  return hash.digest('hex');
}

const abortError = () => Object.assign(new Error('aborted'), { name: 'AbortError' });

/**
 * Unpacks a zip into `destDir`. Every entry is resolved against the destination and refused if it would
 * land outside it (zip-slip); links are skipped rather than created.
 */
function unzip(zipFile, destDir, signal) {
  return new Promise((resolve, reject) => {
    yauzl.open(zipFile, { lazyEntries: true, autoClose: true }, (openErr, zip) => {
      if (openErr) return reject(openErr);
      let unpacked = 0;
      let finished = false;
      const fail = (err) => {
        if (finished) return;
        finished = true;
        zip.close();
        reject(err);
      };
      zip.on('error', fail);
      zip.on('end', () => {
        if (finished) return;
        finished = true;
        resolve();
      });
      zip.on('entry', async (entry) => {
        try {
          if (signal.aborted) throw abortError();
          unpacked += entry.uncompressedSize;
          if (unpacked > MAX_UNPACKED_BYTES) throw new Error('The build is unreasonably large and was refused.');

          const target = path.resolve(destDir, entry.fileName);
          if (target !== destDir && !target.startsWith(destDir + path.sep)) {
            throw new Error('The build contains a file outside its folder and was refused.');
          }
          const isDirectory = entry.fileName.endsWith('/');
          const isLink = ((entry.externalFileAttributes >>> 16) & 0o170000) === 0o120000;

          if (isDirectory) {
            fs.mkdirSync(target, { recursive: true });
          } else if (!isLink) {
            fs.mkdirSync(path.dirname(target), { recursive: true });
            const read = await new Promise((res, rej) => zip.openReadStream(entry, (e, stream) => (e ? rej(e) : res(stream))));
            await pipeline(read, fs.createWriteStream(target), { signal });
          }
          zip.readEntry();
        } catch (err) {
          fail(err);
        }
      });
      zip.readEntry();
    });
  });
}

/** Streams the zip to `file`, continuing a partial file when the server honours Range. */
async function download({ url, file, total, throttleBps, signal, onProgress }) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  let have = fs.existsSync(file) ? fs.statSync(file).size : 0;
  if (have > total) {
    fs.rmSync(file, { force: true });
    have = 0;
  }
  if (have === total) return;

  const res = await fetch(url, { headers: have > 0 ? { range: `bytes=${have}-` } : {}, signal });
  if (res.status === 416) {
    fs.rmSync(file, { force: true });
    throw new Error('The partial download was out of date. Try again.');
  }
  if (res.status === 401 || res.status === 403) throw new Error('The download link expired. Try again.');
  if (!res.ok && res.status !== 206) throw new Error(`The download server answered ${res.status}.`);
  if (have > 0 && res.status !== 206) {
    // Server ignored Range and is sending everything again.
    have = 0;
  }
  if (!res.body) throw new Error('The download server sent no data.');

  const out = fs.createWriteStream(file, { flags: have > 0 ? 'a' : 'w' });
  const started = Date.now();
  let received = have;
  let sinceTick = 0;
  let lastTick = started;
  let speed = 0;
  let lastEmit = 0;

  try {
    for await (const chunk of res.body) {
      if (!out.write(chunk)) await new Promise((resolve) => out.once('drain', resolve));
      received += chunk.length;
      sinceTick += chunk.length;

      const now = Date.now();
      if (now - lastTick >= 1000) {
        speed = (sinceTick * 1000) / (now - lastTick);
        sinceTick = 0;
        lastTick = now;
      }
      if (now - lastEmit >= PROGRESS_INTERVAL_MS) {
        lastEmit = now;
        onProgress(received, speed);
      }
      if (throttleBps > 0) {
        const expectedMs = ((received - have) / throttleBps) * 1000;
        const wait = expectedMs - (now - started);
        if (wait > 5) await sleep(wait);
      }
    }
  } finally {
    await new Promise((resolve) => out.end(resolve));
  }
  onProgress(received, speed);
  if (received !== total) throw new Error('The download ended early. Try again to continue it.');
}

// Builds are only fetched from the Platform API that signed the download link, never from an address the page names.
let allowedDownloadOrigin = '';

async function install({ gameId, libraryDir, build, throttleMBps }) {
  const root = libraryRoot(libraryDir);
  const dir = gameDir(root, gameId);
  if (jobs.has(gameId)) throw new Error('This game is already being installed.');
  if (running.has(gameId)) throw new Error('Close the game before updating it.');
  if (!build || typeof build.downloadUrl !== 'string' || !/^https?:\/\//.test(build.downloadUrl)) {
    throw new Error('The service sent no download link.');
  }
  if (allowedDownloadOrigin && new URL(build.downloadUrl).origin !== new URL(allowedDownloadOrigin).origin) {
    throw new Error('The download link does not belong to the OneEngine service and was refused.');
  }
  if (!SHA256.test(build.sha256 || '')) throw new Error('The service sent no checksum for this build.');
  if (!Number.isFinite(build.sizeBytes) || build.sizeBytes <= 0) throw new Error('The service sent no size for this build.');
  if (typeof build.buildId !== 'string' || !/^[\w.-]{1,80}$/.test(build.buildId)) throw new Error('Invalid build.');
  executableIn(path.join(dir, 'current'), build.executable);

  const zip = path.join(root, '.downloads', `${gameId}__${build.buildId}.zip`);
  const staging = path.join(dir, `.staging-${build.buildId}`);
  const partial = fs.existsSync(zip) ? fs.statSync(zip).size : 0;
  const needed = (build.sizeBytes - partial) + build.sizeBytes * 1.5;
  if (freeBytes(root) < needed) {
    throw new Error(`Not enough free space in ${root}. About ${(needed / 1024 ** 3).toFixed(1)} GB is needed.`);
  }

  const job = { abort: new AbortController(), intent: null };
  jobs.set(gameId, job);
  const emit = (phase, extra = {}) => send('install-progress', { gameId, phase, total: build.sizeBytes, ...extra });

  try {
    emit('downloading', { received: partial, speedBps: 0 });
    await download({
      url: build.downloadUrl,
      file: zip,
      total: build.sizeBytes,
      throttleBps: throttleMBps > 0 ? throttleMBps * 1024 * 1024 : 0,
      signal: job.abort.signal,
      onProgress: (received, speedBps) => emit('downloading', { received, speedBps }),
    });

    emit('verifying', { received: build.sizeBytes });
    const actual = await sha256Of(zip, job.abort.signal);
    if (actual.toLowerCase() !== build.sha256.toLowerCase()) {
      fs.rmSync(zip, { force: true });
      throw new Error('The downloaded file does not match its checksum, so it was discarded. Try again.');
    }

    emit('extracting', { received: build.sizeBytes });
    fs.rmSync(staging, { recursive: true, force: true });
    fs.mkdirSync(staging, { recursive: true });
    await unzip(zip, staging, job.abort.signal);

    // Some zips wrap everything in one folder; the executable path from the server is relative to the build root.
    let buildRoot = staging;
    if (!fs.existsSync(path.join(staging, build.executable))) {
      const entries = fs.readdirSync(staging, { withFileTypes: true });
      if (entries.length === 1 && entries[0].isDirectory()) buildRoot = path.join(staging, entries[0].name);
    }
    if (!fs.existsSync(path.join(buildRoot, build.executable))) {
      throw new Error(`The build does not contain ${build.executable}.`);
    }

    const current = path.join(dir, 'current');
    await retry(() => fs.rmSync(current, { recursive: true, force: true }));
    await retry(() => fs.renameSync(buildRoot, current));
    fs.rmSync(staging, { recursive: true, force: true });
    fs.rmSync(zip, { force: true });

    const record = {
      buildId: build.buildId,
      version: build.version,
      executable: build.executable,
      sha256: build.sha256.toLowerCase(),
      sizeBytes: dirSize(current),
      installedAt: new Date().toISOString(),
    };
    const tmpRecord = path.join(dir, 'install.json.tmp');
    fs.writeFileSync(tmpRecord, JSON.stringify(record, null, 2));
    fs.renameSync(tmpRecord, path.join(dir, 'install.json'));

    const installed = readInstall(root, gameId);
    emit('done', { received: build.sizeBytes });
    return { ok: true, status: 'done', install: installed };
  } catch (err) {
    const aborted = err && err.name === 'AbortError';
    if (aborted && job.intent === 'pause') {
      emit('paused', { received: fs.existsSync(zip) ? fs.statSync(zip).size : 0 });
      return { ok: false, status: 'paused' };
    }
    fs.rmSync(staging, { recursive: true, force: true });
    if (aborted) {
      fs.rmSync(zip, { force: true });
      emit('cancelled');
      return { ok: false, status: 'cancelled' };
    }
    const message = err instanceof Error ? err.message : String(err);
    emit('error', { message });
    return { ok: false, status: 'error', message };
  } finally {
    jobs.delete(gameId);
  }
}

function stopJob(gameId, intent) {
  const job = jobs.get(gameId);
  if (!job) return false;
  job.intent = intent;
  job.abort.abort();
  return true;
}

function launch({ libraryDir, gameId, ticket, playerName, userId }) {
  if (!ticket || typeof ticket !== 'string') return { success: false, message: 'No launch ticket. Sign in and try again.' };
  if (running.has(gameId)) return { success: false, message: 'The game is already running.' };

  const record = readInstall(libraryRoot(libraryDir), gameId);
  if (!record) return { success: false, message: 'The game is not installed. Install it first.' };

  // The ticket is single use and expires in 60 s, so it is safe on a command line.
  const args = [`--oe-ticket=${ticket}`, `--oe-user=${userId || ''}`, `--oe-name=${playerName || ''}`];
  const child = spawn(record.executablePath, args, { cwd: path.dirname(record.executablePath), detached: false });
  running.set(gameId, child);

  return new Promise((resolve) => {
    child.once('error', (err) => {
      running.delete(gameId);
      resolve({ success: false, message: `The game could not start: ${err.message}` });
    });
    child.once('spawn', () => {
      const pid = child.pid;
      child.on('close', (code) => {
        running.delete(gameId);
        send('game-exited', { pid, gameId, code });
      });
      resolve({ success: true, pid, message: `Started (PID ${pid}).` });
    });
  });
}

function registerInstallerIpc(windowGetter, { isTrustedSender = () => true, downloadOrigin = '' } = {}) {
  getWindow = windowGetter;
  allowedDownloadOrigin = downloadOrigin;

  const guard = (fn) => async (event, payload) => {
    if (!isTrustedSender(event)) return { ok: false, status: 'error', success: false, message: 'Request refused.' };
    try {
      return await fn(payload || {});
    } catch (err) {
      return { ok: false, status: 'error', success: false, message: err instanceof Error ? err.message : String(err) };
    }
  };

  ipcMain.handle('library-default-dir', (event) => (isTrustedSender(event) ? defaultLibraryDir() : ''));

  ipcMain.handle(
    'library-scan',
    guard(({ libraryDir }) => {
      const root = libraryRoot(libraryDir);
      if (!fs.existsSync(root)) return { ok: true, installs: [] };
      const installs = fs
        .readdirSync(root, { withFileTypes: true })
        .filter((e) => e.isDirectory() && GAME_ID.test(e.name))
        .map((e) => readInstall(root, e.name))
        .filter(Boolean);
      return { ok: true, installs };
    })
  );

  ipcMain.handle('install-game', guard((payload) => install(payload)));
  ipcMain.handle('install-pause', (event, { gameId } = {}) => isTrustedSender(event) && stopJob(gameId, 'pause'));
  // A running download is stopped; a paused one has no job, so its partial file is deleted here.
  ipcMain.handle(
    'install-cancel',
    guard(({ libraryDir, gameId }) => {
      if (stopJob(gameId, 'cancel')) return { ok: true };
      const downloads = path.join(libraryRoot(libraryDir), '.downloads');
      gameDir(libraryRoot(libraryDir), gameId);
      if (fs.existsSync(downloads)) {
        for (const name of fs.readdirSync(downloads)) {
          if (name.startsWith(`${gameId}__`)) fs.rmSync(path.join(downloads, name), { force: true });
        }
      }
      return { ok: true };
    })
  );

  ipcMain.handle(
    'library-uninstall',
    guard(async ({ libraryDir, gameId }) => {
      if (running.has(gameId)) throw new Error('Close the game before uninstalling it.');
      if (jobs.has(gameId)) throw new Error('Finish or cancel the download first.');
      const dir = gameDir(libraryRoot(libraryDir), gameId);
      await retry(() => fs.rmSync(dir, { recursive: true, force: true }));
      return { ok: true };
    })
  );

  ipcMain.handle(
    'library-verify',
    guard(async ({ libraryDir, gameId }) => {
      const record = readInstall(libraryRoot(libraryDir), gameId);
      if (!record) return { ok: false, status: 'error', message: 'The game is not installed.' };
      // The zip is gone after install, so integrity is checked by size: anything added, removed or truncated shows up.
      const actual = dirSize(path.join(gameDir(libraryRoot(libraryDir), gameId), 'current'));
      if (actual !== record.sizeBytes) {
        return { ok: false, status: 'error', message: 'Some game files are missing or changed. Reinstall to repair them.' };
      }
      return { ok: true, install: record };
    })
  );

  ipcMain.handle('launch-game', guard((payload) => launch(payload)));

  ipcMain.handle('kill-game', (event, { gameId } = {}) => {
    if (!isTrustedSender(event)) return false;
    const child = running.get(gameId);
    if (!child) return false;
    return child.kill();
  });
}

function stopEverything() {
  for (const gameId of jobs.keys()) stopJob(gameId, 'pause');
}

module.exports = { registerInstallerIpc, stopEverything };
