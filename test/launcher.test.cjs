// Launcher checks that need no window: address policy, the request allowlist, the build-time config writer
// and the installer settings in package.json. Run with "npm test".
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const root = path.join(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

// electron/platform.cjs and security.cjs require 'electron'; give them a stand-in.
const originalLoad = Module._load;
Module._load = function (request, ...rest) {
  if (request === 'electron') {
    return { app: { isPackaged: true, getPath: () => root, getVersion: () => pkg.version }, ipcMain: { handle() {}, on() {} }, safeStorage: {} };
  }
  return originalLoad.call(this, request, ...rest);
};
const { cleanUrl } = require('../electron/url-policy.cjs');
const { findRoute } = require('../electron/platform.cjs');
const { isAppUrl } = require('../electron/security.cjs');

test('service address: https only, no localhost, no credentials', () => {
  assert.equal(cleanUrl('https://api.example.com'), 'https://api.example.com');
  assert.equal(cleanUrl('https://api.example.com/base/'), 'https://api.example.com/base');
  for (const bad of ['', 'api.example.com', 'http://api.example.com', 'ftp://api.example.com', 'https://user:pw@api.example.com', 'http://localhost:8080', 'https://127.0.0.1', 'https://[::1]']) {
    assert.equal(cleanUrl(bad), '', `${bad} must be refused`);
  }
  assert.equal(cleanUrl('http://127.0.0.1:8080', { allowLocal: true }), 'http://127.0.0.1:8080');
});

test('the page can only reach the listed routes', () => {
  const ok = (m, p, games = false) => !!findRoute(m, p, games);
  assert.ok(ok('GET', '/healthz'));
  assert.ok(ok('GET', '/v1/catalog'));
  assert.ok(ok('POST', '/v1/auth/login'));
  assert.ok(ok('PATCH', '/v1/me'));
  assert.ok(!ok('POST', '/v1/auth/refresh'), 'token refresh is main-process only');
  assert.ok(!ok('POST', '/v1/auth/logout'));
  assert.ok(!ok('POST', '/v1/dev/login'));
  assert.ok(!ok('POST', '/internal/tickets/redeem'));
  assert.ok(!ok('DELETE', '/v1/me'));
  assert.ok(!ok('GET', 'http://evil.example/v1/catalog'));
  assert.ok(!ok('GET', '/v1/catalog/../../etc/passwd'));
  assert.ok(!ok('POST', '/v1/library/railbound/claim'), 'game routes are closed while games are off');
  assert.ok(ok('POST', '/v1/library/railbound/claim', true));
  assert.ok(ok('GET', '/v1/products/railbound/builds/latest?platform=win64', true));
  assert.ok(!ok('GET', '/v1/depot/railbound/win64/x.zip', true));
});

test('only the packaged index.html counts as the app', () => {
  const index = require('node:url').pathToFileURL(path.join(root, 'dist', 'index.html')).href;
  assert.ok(isAppUrl(index));
  assert.ok(!isAppUrl('https://evil.example/'));
  assert.ok(!isAppUrl('file:///C:/Users/someone/Downloads/evil.html'));
  assert.ok(!isAppUrl(undefined));
});

function runWriter(env) {
  const config = path.join(root, 'electron', 'app-config.json');
  const previous = fs.existsSync(config) ? fs.readFileSync(config) : null;
  fs.rmSync(config, { force: true });
  try {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts', 'write-app-config.cjs')], {
      env: { PATH: process.env.PATH, ...env },
      encoding: 'utf8',
    });
    const written = fs.existsSync(config) ? JSON.parse(fs.readFileSync(config, 'utf8')) : null;
    return { status: result.status, stderr: result.stderr, written };
  } finally {
    if (previous) fs.writeFileSync(config, previous);
    else fs.rmSync(config, { force: true });
  }
}

test('a release build refuses a missing, plain-http or localhost service address', () => {
  assert.notEqual(runWriter({}).status, 0);
  assert.notEqual(runWriter({ PLATFORM_API_URL: 'http://api.example.com' }).status, 0);
  assert.notEqual(runWriter({ PLATFORM_API_URL: 'https://localhost:8080' }).status, 0);
  assert.notEqual(runWriter({ PLATFORM_API_URL: 'http://127.0.0.1:8080' }).status, 0);
});

test('a release build records the https address and leaves games off by default', () => {
  const out = runWriter({ PLATFORM_API_URL: 'https://api.example.com' });
  assert.equal(out.status, 0, out.stderr);
  assert.deepEqual(out.written, { platformApiUrl: 'https://api.example.com', gamesEnabled: false, allowLocal: false });
  assert.equal(runWriter({ PLATFORM_API_URL: 'https://api.example.com', ENABLE_GAMES: 'true' }).written.gamesEnabled, true);
});

test('a local test build must be asked for explicitly', () => {
  const out = runWriter({ ALLOW_LOCAL_BUILD: '1' });
  assert.equal(out.status, 0, out.stderr);
  assert.equal(out.written.allowLocal, true);
});

test('installer settings', () => {
  const b = pkg.build;
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  assert.equal(b.win.artifactName, 'OneEngine-Store-Setup-${version}.${ext}');
  assert.equal(b.nsis.oneClick, false);
  assert.equal(b.nsis.createStartMenuShortcut, true);
  assert.equal(b.nsis.createDesktopShortcut, true);
  assert.equal(b.nsis.deleteAppDataOnUninstall, false, 'uninstalling must not delete the player data');
  assert.ok(b.files.includes('electron/**/*'));
  assert.ok(!pkg.dependencies['extract-zip'], 'extract-zip silently truncates archives');
});

test('the shipped page has a content security policy and no local server address', { skip: !fs.existsSync(path.join(root, 'dist', 'index.html')) }, () => {
  const html = fs.readFileSync(path.join(root, 'dist', 'index.html'), 'utf8');
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /script-src 'self'/);
  assert.doesNotMatch(html, /unsafe-eval/);
  const assets = path.join(root, 'dist', 'assets');
  for (const file of fs.readdirSync(assets).filter((n) => n.endsWith('.js'))) {
    const code = fs.readFileSync(path.join(assets, file), 'utf8');
    assert.doesNotMatch(code, /127\.0\.0\.1|localhost/, `${file} must not point at a local server`);
  }
});

test('the window is created with the hardened settings', () => {
  const main = fs.readFileSync(path.join(root, 'electron', 'main.cjs'), 'utf8');
  for (const setting of ['contextIsolation: true', 'nodeIntegration: false', 'sandbox: true', 'webSecurity: true']) {
    assert.ok(main.includes(setting), `${setting} missing in main.cjs`);
  }
  assert.ok(main.includes('setWindowOpenHandler') && main.includes('will-navigate'));
});

// ---- payments client ----
const payments = require('../electron/payments.cjs');

test('payments: only the listed routes are reachable', () => {
  assert.ok(payments.findRoute('GET', '/api/v1/coin-bundles'));
  assert.ok(payments.findRoute('GET', '/api/v1/wallet/me'));
  assert.ok(payments.findRoute('POST', '/api/v1/payments/checkout-sessions'));
  assert.ok(payments.findRoute('GET', '/api/v1/payments/orders/ord_123-abc'));
  assert.equal(payments.findRoute('POST', '/api/v1/payments/mock-complete/ord_1'), undefined);
  assert.equal(payments.findRoute('POST', '/api/v1/auth/mock-token'), undefined);
  assert.equal(payments.findRoute('GET', '/api/v1/admin/orders'), undefined);
  assert.equal(payments.findRoute('POST', '/api/v1/payments/webhooks/stripe'), undefined);
  assert.equal(payments.findRoute('GET', '/api/v1/payments/orders/../admin'), undefined);
});

test('payments: request bodies are rebuilt from known fields only', () => {
  assert.deepEqual(payments.cleanBody('/api/v1/payments/checkout-sessions', { bundleSku: 'coins_500', provider: 'mock', amount: 1 }), {
    bundleSku: 'coins_500',
    provider: 'stripe',
  });
  assert.equal(payments.cleanBody('/api/v1/payments/checkout-sessions', { bundleSku: '../x' }), null);
  assert.equal(payments.cleanBody('/api/v1/payments/checkout-sessions', {}), null);
  assert.deepEqual(payments.cleanBody('/api/v1/shop/purchases', { itemSku: 'skin_01', price: 0 }), { itemSku: 'skin_01' });
});

test('payments: only Stripe\'s hosted checkout page is ever opened', () => {
  assert.ok(payments.stripeCheckoutUrl('https://checkout.stripe.com/c/pay/cs_test_abc'));
  for (const bad of ['http://checkout.stripe.com/x', 'https://checkout.stripe.com.evil.example/x', 'https://evil.example/checkout.stripe.com', 'https://u:p@checkout.stripe.com/x', 'file:///c:/x', '', 'nope']) {
    assert.equal(payments.stripeCheckoutUrl(bad), '', bad);
  }
});

test('a release build records an https payments address and refuses a local or plain-http one', () => {
  const ok = runWriter({ PLATFORM_API_URL: 'https://api.example.com', PAYMENTS_API_URL: 'https://pay.example.com/' });
  assert.equal(ok.status, 0, ok.stderr);
  assert.equal(ok.written.paymentsApiUrl, 'https://pay.example.com');
  assert.notEqual(runWriter({ PLATFORM_API_URL: 'https://api.example.com', PAYMENTS_API_URL: 'http://pay.example.com' }).status, 0);
  assert.notEqual(runWriter({ PLATFORM_API_URL: 'https://api.example.com', PAYMENTS_API_URL: 'https://localhost:9000' }).status, 0);
  const none = runWriter({ PLATFORM_API_URL: 'https://api.example.com' });
  assert.equal(none.written.paymentsApiUrl, undefined);
});

test('the page loads no fonts from the internet (they are bundled)', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
});
