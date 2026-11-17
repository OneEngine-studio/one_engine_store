// "Continue with Google" for a desktop app: OAuth 2.0 authorization code with PKCE, received on a loopback
// address (RFC 8252). The person signs in to Google in their own browser, never inside this app. This file only
// obtains the authorization code; the Platform API redeems it with Google and decides who the player is.
const http = require('http');
const crypto = require('crypto');

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const DEFAULT_TIMEOUT_MS = 3 * 60 * 1000;

const b64url = (buffer) => buffer.toString('base64url');

const page = (title, message) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title>` +
  `<meta name="viewport" content="width=device-width,initial-scale=1"><style>` +
  `body{margin:0;min-height:100vh;display:grid;place-items:center;background:#13171D;color:#ffffff;font:16px/1.5 system-ui,sans-serif}` +
  `main{max-width:26rem;padding:2rem;text-align:center}h1{font-size:1.25rem;margin:0 0 .5rem}p{margin:0;color:#B9C1CC}</style></head>` +
  `<body><main><h1>${title}</h1><p>${message}</p></main></body></html>`;

let active = null;

/** Stops a sign-in that is still waiting for the browser. */
function cancel() {
  if (active) active.cancel();
}

/**
 * Opens Google in the system browser and waits for it to call back on 127.0.0.1.
 * Resolves with what the Platform API needs to redeem the code.
 */
function authorize({ clientId, openUrl, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  cancel();
  const verifier = b64url(crypto.randomBytes(48)); // 64 characters
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  const state = b64url(crypto.randomBytes(24));
  const nonce = b64url(crypto.randomBytes(24));

  return new Promise((resolve, reject) => {
    let settled = false;
    let timer = null;
    const server = http.createServer();

    const finish = (err, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      active = null;
      // let the browser finish loading the last page before the port closes
      setTimeout(() => server.close(), 500).unref();
      server.closeIdleConnections?.();
      if (err) reject(err);
      else resolve(value);
    };
    const fail = (code, message) => finish(Object.assign(new Error(message), { code }));

    active = { cancel: () => fail('cancelled', 'Sign-in was cancelled.') };

    server.on('request', (req, res) => {
      const port = server.address().port;
      const reply = (status, title, message) => {
        res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
        res.end(page(title, message));
      };
      // Only our own loopback address may talk to this listener (guards against DNS rebinding).
      if (req.headers.host !== `127.0.0.1:${port}`) return reply(400, 'Not available', 'This address is only for OneEngine Store.');
      const url = new URL(req.url, `http://127.0.0.1:${port}`);
      if (req.method !== 'GET' || url.pathname !== '/callback') return reply(404, 'Not found', 'Nothing here.');

      if (url.searchParams.get('state') !== state) {
        return reply(400, 'Sign-in could not be checked', 'Go back to OneEngine Store and try again.');
      }
      const error = url.searchParams.get('error');
      if (error) {
        reply(200, 'Sign-in cancelled', 'You can close this tab and return to OneEngine Store.');
        return fail(error === 'access_denied' ? 'cancelled' : 'google_error', error === 'access_denied' ? 'Sign-in was cancelled.' : 'Google reported an error.');
      }
      const code = url.searchParams.get('code');
      if (!code) return reply(400, 'Sign-in incomplete', 'Go back to OneEngine Store and try again.');
      reply(200, 'You are signed in', 'You can close this tab and return to OneEngine Store.');
      finish(null, { code, codeVerifier: verifier, nonce, redirectUri: `http://127.0.0.1:${port}/callback` });
    });

    server.on('error', (err) => fail('listen_failed', `Could not start the sign-in listener: ${err.message}`));
    server.listen(0, '127.0.0.1', () => {
      const redirectUri = `http://127.0.0.1:${server.address().port}/callback`;
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state,
        nonce,
        prompt: 'select_account',
      });
      timer = setTimeout(() => fail('timeout', 'Google sign-in took too long. Try again.'), timeoutMs);
      Promise.resolve(openUrl(`${AUTH_URL}?${params}`)).catch((err) => fail('open_failed', `Could not open your browser: ${err.message}`));
    });
  });
}

module.exports = { authorize, cancel, AUTH_URL };
