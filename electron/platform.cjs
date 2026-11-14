// Talks to the OneEngine Platform API on behalf of the page.
//
// The page never sees an access or refresh token. Sign-in and sign-up responses are cut down to the
// user's details here, the refresh token is encrypted with the operating system's key store
// (Windows DPAPI) before it touches the disk, and every signed-in call gets its bearer token added
// in this process. A web page that was somehow compromised therefore cannot copy the session.
const { app, ipcMain, safeStorage } = require('electron');
const fs = require('fs');
const path = require('path');

let session = null; // { baseUrl, access, accessExp, refresh }
let stored = null; // { baseUrl, refresh } read from disk, used once by restore

const sessionFile = () => path.join(app.getPath('userData'), 'session.bin');

function persist() {
  try {
    if (!session || !session.refresh || !safeStorage.isEncryptionAvailable()) {
      fs.rmSync(sessionFile(), { force: true });
      return;
    }
    const blob = safeStorage.encryptString(JSON.stringify({ baseUrl: session.baseUrl, refresh: session.refresh }));
    fs.writeFileSync(sessionFile(), blob, { mode: 0o600 });
  } catch (err) {
    console.warn('[OneEngine] Could not save the session:', err.message);
  }
}

function loadStored() {
  try {
    if (!safeStorage.isEncryptionAvailable() || !fs.existsSync(sessionFile())) return null;
    const parsed = JSON.parse(safeStorage.decryptString(fs.readFileSync(sessionFile())));
    return parsed && parsed.baseUrl && parsed.refresh ? parsed : null;
  } catch {
    return null;
  }
}

const problem = (status, code, message) => ({ status, data: { error: { code, message } } });
const signedOut = () => problem(401, 'auth_required', 'Sign in to continue.');

async function rawFetch(baseUrl, route, method, body, token, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}${route}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    return { status: res.status, data };
  } catch (err) {
    return err && err.name === 'AbortError'
      ? problem(0, 'timeout', `The OneEngine service at ${baseUrl} did not answer in time.`)
      : problem(0, 'unreachable', `Can't reach the OneEngine service at ${baseUrl}. Check the address and your connection.`);
  } finally {
    clearTimeout(timer);
  }
}

/** Keeps tokens here and hands the page only the user's details. */
function adopt(baseUrl, data) {
  session = { baseUrl, access: data.accessToken, accessExp: data.accessExpiresAt, refresh: data.refreshToken };
  persist();
  const { accessToken, refreshToken, accessExpiresAt, refreshExpiresAt, ...safe } = data;
  return safe;
}

let refreshing = null;
function refresh(baseUrl) {
  if (!session || session.baseUrl !== baseUrl || !session.refresh) return Promise.resolve(false);
  if (!refreshing) {
    refreshing = (async () => {
      const res = await rawFetch(baseUrl, '/v1/auth/refresh', 'POST', { refreshToken: session.refresh });
      if (res.status === 200 && res.data.accessToken) {
        adopt(baseUrl, res.data);
        return true;
      }
      if (res.status === 401) {
        session = null;
        persist();
      }
      return false;
    })().finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

async function request({ baseUrl, path: route, method = 'GET', body, auth = false }) {
  if (typeof baseUrl !== 'string' || !/^https?:\/\//.test(baseUrl) || typeof route !== 'string' || !route.startsWith('/')) {
    return problem(0, 'bad_request', 'Invalid request.');
  }

  let res;
  if (auth) {
    if (!session || session.baseUrl !== baseUrl) return signedOut();
    if (session.accessExp - Date.now() < 30_000) await refresh(baseUrl);
    if (!session) return signedOut();
    res = await rawFetch(baseUrl, route, method, body, session.access);
    if (res.status === 401 && session && (await refresh(baseUrl))) {
      res = await rawFetch(baseUrl, route, method, body, session.access);
    }
    if (res.status === 401 && !session) return signedOut();
  } else {
    res = await rawFetch(baseUrl, route, method, body);
  }

  if (res.status === 200 && route.startsWith('/v1/auth/') && res.data && res.data.accessToken && res.data.refreshToken) {
    res.data = adopt(baseUrl, res.data);
  }
  return res;
}

function registerPlatformIpc() {
  ipcMain.handle('platform-request', (_event, payload) => request(payload || {}));

  // Signs back in from the encrypted refresh token saved by an earlier run.
  ipcMain.handle('platform-restore', async (_event, { baseUrl } = {}) => {
    if (!session) {
      stored = stored || loadStored();
      if (stored && stored.baseUrl === baseUrl) session = { baseUrl, access: '', accessExp: 0, refresh: stored.refresh };
    }
    if (!session || session.baseUrl !== baseUrl) return { ok: false };
    return { ok: await refresh(baseUrl) };
  });

  ipcMain.handle('platform-sign-out', async (_event, { baseUrl } = {}) => {
    const refreshToken = session && session.refresh;
    if (refreshToken && typeof baseUrl === 'string') {
      await rawFetch(baseUrl, '/v1/auth/logout', 'POST', { refreshToken }, undefined, 4000);
    }
    session = null;
    stored = null;
    persist();
    return { ok: true };
  });
}

module.exports = { registerPlatformIpc };
