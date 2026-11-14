// The browser half of "Continue with Google": PKCE, state, the loopback listener. A fake browser plays Google.
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const http = require('node:http');
const google = require('../electron/google.cjs');

const get = (url, headers = {}) =>
  new Promise((resolve, reject) => {
    const u = new URL(url);
    http
      .get({ host: u.hostname, port: u.port, path: u.pathname + u.search, headers, agent: false }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      })
      .on('error', reject);
  });

/** Starts a sign-in whose "browser" runs `onOpen(authUrl, params)` once Google would be shown. */
function run(onOpen, options = {}) {
  let seen;
  const promise = google.authorize({
    clientId: 'client-123.apps.googleusercontent.com',
    timeoutMs: options.timeoutMs,
    openUrl: (url) => {
      const parsed = new URL(url);
      seen = { url: parsed, params: parsed.searchParams };
      setImmediate(() => onOpen && onOpen(seen));
    },
  });
  return { promise, seen: () => seen };
}

test('asks Google for an authorization code with PKCE on a loopback address', async () => {
  const flow = run(async ({ params }) => {
    await get(`${params.get('redirect_uri')}?code=the-code&state=${params.get('state')}`);
  });
  const result = await flow.promise;
  const { url, params } = flow.seen();

  assert.equal(url.origin + url.pathname, google.AUTH_URL);
  assert.equal(params.get('client_id'), 'client-123.apps.googleusercontent.com');
  assert.equal(params.get('response_type'), 'code');
  assert.equal(params.get('scope'), 'openid email profile');
  assert.equal(params.get('code_challenge_method'), 'S256');
  assert.match(params.get('redirect_uri'), /^http:\/\/127\.0\.0\.1:\d+\/callback$/);

  const challenge = crypto.createHash('sha256').update(result.codeVerifier).digest('base64url');
  assert.equal(params.get('code_challenge'), challenge, 'the challenge is the SHA-256 of the verifier we keep');
  assert.ok(result.codeVerifier.length >= 43 && result.codeVerifier.length <= 128);
  assert.equal(result.code, 'the-code');
  assert.equal(result.nonce, params.get('nonce'));
  assert.equal(result.redirectUri, params.get('redirect_uri'));
});

test('ignores a callback with the wrong state and keeps waiting for the real one', async () => {
  let wrong;
  const flow = run(async ({ params }) => {
    wrong = await get(`${params.get('redirect_uri')}?code=stolen&state=not-the-state`);
    await get(`${params.get('redirect_uri')}?code=real&state=${params.get('state')}`);
  });
  const result = await flow.promise;
  assert.equal(wrong.status, 400);
  assert.equal(result.code, 'real');
});

test('refuses requests that are not for our loopback address or path', async () => {
  let rebinding;
  let elsewhere;
  const flow = run(async ({ params }) => {
    const redirect = params.get('redirect_uri');
    rebinding = await get(`${redirect}?code=x&state=${params.get('state')}`, { host: 'evil.example' });
    elsewhere = await get(redirect.replace('/callback', '/admin'));
    await get(`${redirect}?code=ok&state=${params.get('state')}`);
  });
  await flow.promise;
  assert.equal(rebinding.status, 400);
  assert.equal(elsewhere.status, 404);
});

test('a refusal on Google\'s page ends the sign-in as cancelled', async () => {
  const flow = run(({ params }) => get(`${params.get('redirect_uri')}?error=access_denied&state=${params.get('state')}`));
  await assert.rejects(flow.promise, (err) => err.code === 'cancelled');
});

test('cancel() stops a sign-in that is waiting', async () => {
  const flow = run(() => setImmediate(() => google.cancel()));
  await assert.rejects(flow.promise, (err) => err.code === 'cancelled');
});

test('gives up after the timeout and frees the port', async () => {
  let redirect;
  const flow = run(({ params }) => (redirect = params.get('redirect_uri')), { timeoutMs: 150 });
  await assert.rejects(flow.promise, (err) => err.code === 'timeout');
  await new Promise((r) => setTimeout(r, 800));
  await assert.rejects(get(redirect), /ECONNREFUSED/, 'the listener is closed');
});

test('starting a second sign-in cancels the first', async () => {
  const first = run(() => {});
  const firstDone = assert.rejects(first.promise, (err) => err.code === 'cancelled');
  await new Promise((r) => setTimeout(r, 50));
  const second = run(({ params }) => get(`${params.get('redirect_uri')}?code=two&state=${params.get('state')}`));
  await firstDone;
  assert.equal((await second.promise).code, 'two');
});
