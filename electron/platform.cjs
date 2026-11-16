// Talks to the OneEngine Platform API on behalf of the page.
//
// The page never sees an access or refresh token. Sign-in and sign-up responses are cut down to the
// user's details here, the refresh token is encrypted with the operating system's key store
// (Windows DPAPI) before it touches the disk, and every signed-in call gets its bearer token added
// in this process. A web page that was somehow compromised therefore cannot copy the session.
//
// The page does not choose where requests go either: the address comes from the build (config.cjs) and
// only the routes listed in ROUTES can be called, so this is not a general HTTP proxy.
const { app, ipcMain, safeStorage, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const appConfig = require('./config.cjs');
const { isTrustedSender } = require('./security.cjs');
const google = require('./google.cjs');

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

// Other modules (payments) can ask for a fresh access token without ever handing it to the page,
// and are told when the player signs out.
const signOutListeners = [];
const onSignOut = (fn) => signOutListeners.push(fn);

async function accessToken() {
  const baseUrl = appConfig.get().platformApiUrl;
  if (!baseUrl || !session || session.baseUrl !== baseUrl) return '';
  if (session.accessExp - Date.now() < 30_000) await refresh(baseUrl);
  return session && session.baseUrl === baseUrl ? session.access : '';
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

const ID = '[A-Za-z0-9_-]{1,64}';
// [method, path pattern, needs a signed-in session, only when games are enabled]
const ROUTES = [
  ['GET', /^\/healthz$/, false],
  ['GET', /^\/v1\/auth\/providers$/, false],
  ['GET', /^\/v1\/catalog$/, false],
  ['GET', new RegExp(`^/v1/catalog/${ID}$`), false],
  ['POST', /^\/v1\/auth\/(register|login|forgot-password|reset-password)$/, false],
  ['POST', /^\/v1\/auth\/(verify-email|resend-verification|change-password|set-password)$/, true],
  ['GET', /^\/v1\/me$/, true],
  ['PATCH', /^\/v1\/me$/, true],
  ['GET', /^\/v1\/library$/, true],
  ['POST', new RegExp(`^/v1/library/${ID}/claim$`), true, true],
  ['GET', new RegExp(`^/v1/products/${ID}/builds/latest[?]platform=win64$`), true, true],
  ['POST', /^\/v1\/launch-tickets$/, true, true],
];
const MAX_BODY_BYTES = 16 * 1024;

function findRoute(method, route, gamesEnabled) {
  return ROUTES.find(([m, pattern, , gamesOnly]) => m === method && pattern.test(route) && (!gamesOnly || gamesEnabled));
}

async function request({ path: route, method = 'GET', body } = {}) {
  const cfg = appConfig.get();
  if (!cfg.platformApiUrl) {
    return problem(0, 'not_configured', 'This build of OneEngine Store has no service address. Install the latest version from the download page.');
  }
  const baseUrl = cfg.platformApiUrl;
  if (typeof route !== 'string' || typeof method !== 'string') return problem(0, 'bad_request', 'Invalid request.');
  const match = findRoute(method.toUpperCase(), route, cfg.gamesEnabled);
  if (!match) return problem(0, 'not_allowed', 'That request is not available from the app.');
  if (body !== undefined && JSON.stringify(body).length > MAX_BODY_BYTES) return problem(0, 'bad_request', 'The request is too large.');
  const auth = match[2];

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

/**
 * Google sign-in: the browser step runs here, the code goes to the Platform API, and the tokens that come back
 * stay in this process like any other sign-in. The page only learns who signed in.
 */
async function googleSignIn() {
  const baseUrl = appConfig.get().platformApiUrl;
  if (!baseUrl) return problem(0, 'not_configured', 'This build of OneEngine Store has no service address.');

  const providers = await rawFetch(baseUrl, '/v1/auth/providers', 'GET');
  if (providers.status !== 200) return providers.status === 0 ? providers : problem(providers.status, 'google_unavailable', 'Google sign-in is not available right now.');
  const clientId = providers.data.google && providers.data.google.clientId;
  if (!clientId) return problem(404, 'google_unavailable', 'Google sign-in is not set up on this service yet.');

  let grant;
  try {
    grant = await google.authorize({ clientId, openUrl: (url) => shell.openExternal(url) });
  } catch (err) {
    return problem(0, err.code || 'google_error', err.message || 'Google sign-in did not finish.');
  }

  const res = await rawFetch(baseUrl, '/v1/auth/google', 'POST', grant, undefined, 20000);
  if (res.status === 200 && res.data && res.data.accessToken && res.data.refreshToken) {
    return { status: 200, data: adopt(baseUrl, res.data) };
  }
  return res;
}

function registerPlatformIpc() {
  const guarded = (handler) => (event, payload) =>
    isTrustedSender(event) ? handler(payload) : problem(0, 'forbidden', 'Request refused.');

  ipcMain.handle('platform-request', guarded((payload) => request(payload || {})));

  ipcMain.handle('platform-google-sign-in', guarded(() => googleSignIn()));
  ipcMain.handle('platform-google-cancel', guarded(() => {
    google.cancel();
    return { ok: true };
  }));

  // Signs back in from the encrypted refresh token saved by an earlier run.
  ipcMain.handle('platform-restore', guarded(async () => {
    const baseUrl = appConfig.get().platformApiUrl;
    if (!baseUrl) return { ok: false };
    if (!session) {
      stored = stored || loadStored();
      if (stored && stored.baseUrl === baseUrl) session = { baseUrl, access: '', accessExp: 0, refresh: stored.refresh };
    }
    if (!session || session.baseUrl !== baseUrl) return { ok: false };
    return { ok: await refresh(baseUrl) };
  }));

  ipcMain.handle('platform-sign-out', guarded(async () => {
    const baseUrl = appConfig.get().platformApiUrl;
    const refreshToken = session && session.refresh;
    if (refreshToken && baseUrl) {
      await rawFetch(baseUrl, '/v1/auth/logout', 'POST', { refreshToken }, undefined, 4000);
    }
    session = null;
    stored = null;
    persist();
    signOutListeners.forEach((fn) => fn());
    return { ok: true };
  }));
}

module.exports = { registerPlatformIpc, findRoute, onSignOut, accessToken };
