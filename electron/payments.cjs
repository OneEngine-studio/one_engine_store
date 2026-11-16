// Talks to the OneEngine payments service (coin bundles, wallet, Stripe checkout) on behalf of the page.
//
// Like platform.cjs, the page never holds a token. This process trades the player's OneEngine sign-in for a
// payments session (the service checks it with the Platform API), keeps that session in memory only, and adds
// it to each call. Only the routes below can be called, request bodies are rebuilt from known fields, and the
// Stripe checkout address is checked before the system browser is opened on it.
const { ipcMain, shell } = require('electron');
const appConfig = require('./config.cjs');
const { isTrustedSender } = require('./security.cjs');
const platform = require('./platform.cjs');

let pay = null; // { baseUrl, token, exp }
platform.onSignOut(() => {
  pay = null;
});

const problem = (status, code, message) => ({ status, data: { error: { code, message } } });
const ID = '[A-Za-z0-9_-]{1,64}';
// [method, path pattern, needs a signed-in session]
const ROUTES = [
  ['GET', /^\/api\/v1\/coin-bundles$/, false],
  ['GET', /^\/api\/v1\/shop\/items$/, false],
  ['GET', /^\/api\/v1\/wallet\/me$/, true],
  ['GET', /^\/api\/v1\/payments\/orders$/, true],
  ['GET', new RegExp(`^/api/v1/payments/orders/${ID}$`), true],
  ['POST', /^\/api\/v1\/payments\/checkout-sessions$/, true],
  ['POST', /^\/api\/v1\/shop\/purchases$/, true],
];

const findRoute = (method, route) => ROUTES.find(([m, pattern]) => m === method && pattern.test(route));
const isId = (v) => typeof v === 'string' && new RegExp(`^${ID}$`).test(v);

/** The only fields each POST may carry; anything else the page sends is dropped. */
function cleanBody(route, body) {
  if (route === '/api/v1/payments/checkout-sessions') {
    return isId(body && body.bundleSku) ? { bundleSku: body.bundleSku, provider: 'stripe' } : null;
  }
  if (route === '/api/v1/shop/purchases') {
    return isId(body && body.itemSku) ? { itemSku: body.itemSku } : null;
  }
  return undefined;
}

async function rawFetch(baseUrl, route, method, body, token, extraHeaders = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`${baseUrl}${route}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...extraHeaders,
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
      ? problem(0, 'timeout', 'The payments service did not answer in time.')
      : problem(0, 'unreachable', "Can't reach the payments service. Check your connection.");
  } finally {
    clearTimeout(timer);
  }
}

function jwtExpiry(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/** Trades the OneEngine sign-in for a payments session. Returns an error result, or null when a session is ready. */
async function ensureSession(baseUrl) {
  if (pay && pay.baseUrl === baseUrl && pay.exp - Date.now() > 60_000) return null;
  pay = null;
  const access = await platform.accessToken();
  if (!access) return problem(401, 'auth_required', 'Sign in to buy coins.');
  const res = await rawFetch(baseUrl, '/api/v1/auth/oneengine', 'POST', undefined, access);
  if (res.status === 200 && res.data && typeof res.data.token === 'string') {
    pay = { baseUrl, token: res.data.token, exp: jwtExpiry(res.data.token) || Date.now() + 10 * 60_000 };
    return null;
  }
  if (res.status === 0) return res;
  if (res.status === 401 || res.status === 403) {
    return problem(403, 'account_not_ready', (res.data && res.data.message) || 'Confirm your email before buying coins.');
  }
  return problem(res.status || 502, 'payments_unavailable', 'Payments are not available right now.');
}

/** Stripe's hosted page only: nothing else is ever opened for a checkout. */
function stripeCheckoutUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com' && !url.username && !url.password ? url.href : '';
  } catch {
    return '';
  }
}

async function request({ path: route, method = 'GET', body, idempotencyKey } = {}) {
  const baseUrl = appConfig.get().paymentsApiUrl;
  if (!baseUrl) return problem(0, 'not_configured', 'Payments are not set up in this build of OneEngine Store.');
  if (typeof route !== 'string' || typeof method !== 'string') return problem(0, 'bad_request', 'Invalid request.');
  const match = findRoute(method.toUpperCase(), route);
  if (!match) return problem(0, 'not_allowed', 'That request is not available from the app.');
  const clean = method.toUpperCase() === 'POST' ? cleanBody(route, body) : undefined;
  if (method.toUpperCase() === 'POST' && !clean) return problem(0, 'bad_request', 'Invalid request.');
  const headers = isId(idempotencyKey) ? { 'Idempotency-Key': idempotencyKey } : {};

  let res;
  if (match[2]) {
    const failed = await ensureSession(baseUrl);
    if (failed) return failed;
    res = await rawFetch(baseUrl, route, method, clean, pay.token, headers);
    if (res.status === 401) {
      pay = null;
      const again = await ensureSession(baseUrl);
      if (again) return again;
      res = await rawFetch(baseUrl, route, method, clean, pay.token, headers);
    }
  } else {
    res = await rawFetch(baseUrl, route, method, undefined);
  }

  if (route === '/api/v1/payments/checkout-sessions' && res.status === 201) {
    const url = stripeCheckoutUrl(res.data && res.data.checkoutUrl);
    if (!url) return problem(502, 'bad_checkout', 'The payment page could not be opened. Nothing was charged.');
    shell.openExternal(url);
    const { checkoutUrl, ...rest } = res.data;
    return { status: 201, data: { ...rest, opened: true } };
  }
  return res;
}

function registerPaymentsIpc() {
  ipcMain.handle('payments-request', (event, payload) =>
    isTrustedSender(event) ? request(payload || {}) : problem(0, 'forbidden', 'Request refused.')
  );
}

module.exports = { registerPaymentsIpc, findRoute, cleanBody, stripeCheckoutUrl };
