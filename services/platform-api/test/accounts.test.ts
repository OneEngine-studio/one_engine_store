import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { openDb } from '../src/db.js';
import { buildServer } from '../src/server.js';
import { makeMailer, type Mailer } from '../src/mailer.js';
import { legacyScryptHash, needsRehash } from '../src/passwords.js';
import type { GoogleExchange, GoogleIdentity } from '../src/google.js';

const env = { PASSWORD_COST: '1024', REQUIRE_EMAIL_VERIFICATION: 'true', LOG_LEVEL: 'silent' };
const GOOD = 'correct horse battery';

function setup(extra: Record<string, string> = {}, googleExchange?: GoogleExchange) {
  let clock = 1_800_000_000_000;
  const now = () => clock;
  const sent: { to: string; subject: string; text: string }[] = [];
  const mailer: Mailer = {
    async send(to, subject, text) {
      sent.push({ to, subject, text });
    },
  };
  const db = openDb(':memory:');
  const app = buildServer({ cfg: loadConfig({ ...env, ...extra }), db, mailer, now, googleExchange });
  const lastCode = () => /\b(\d{6})\b/.exec(sent[sent.length - 1]?.text ?? '')?.[1] ?? '';
  const advance = (ms: number) => {
    clock += ms;
  };
  return { app, db, sent, lastCode, advance };
}
type Ctx = ReturnType<typeof setup>;

const post = (ctx: Ctx, url: string, payload: unknown, token?: string) =>
  ctx.app.inject({ method: 'POST', url, payload: payload as object, headers: token ? { authorization: `Bearer ${token}` } : {} });

async function register(ctx: Ctx, email = 'new@example.com', password = GOOD) {
  const res = await post(ctx, '/v1/auth/register', { email, password, displayName: 'Spectre 01' });
  return { res, body: res.json() };
}

describe('registration', () => {
  it('creates an unverified account, signs the player in and emails a code', async () => {
    const ctx = setup();
    const { res, body } = await register(ctx);
    expect(res.statusCode).toBe(200);
    expect(body.user).toMatchObject({ email: 'new@example.com', displayName: 'Spectre 01', emailVerified: false });
    expect(body.accessToken.split('.')).toHaveLength(3);
    expect(body.refreshToken.length).toBeGreaterThan(30);
    expect(ctx.sent).toHaveLength(1);
    expect(ctx.sent[0].to).toBe('new@example.com');
    expect(ctx.lastCode()).toMatch(/^\d{6}$/);
  });

  it('never stores the password in clear text', async () => {
    const ctx = setup();
    await register(ctx);
    const row = ctx.db.prepare('SELECT password_hash FROM credentials').get() as { password_hash: string };
    expect(row.password_hash.startsWith('$argon2id$')).toBe(true);
    expect(row.password_hash).not.toContain(GOOD);
  });

  it('rejects a bad email, a weak password and a duplicate', async () => {
    const ctx = setup();
    expect((await post(ctx, '/v1/auth/register', { email: 'nope', password: GOOD, displayName: 'Abc' })).statusCode).toBe(400);
    const missingPassword = await post(ctx, '/v1/auth/register', { email: 'a@example.com', displayName: 'Abc' });
    expect(missingPassword.statusCode).toBe(400);
    expect(missingPassword.json().error).toEqual({ code: 'bad_request', message: 'Required' });
    const weak = await post(ctx, '/v1/auth/register', { email: 'a@example.com', password: 'password123', displayName: 'Abc' });
    expect(weak.statusCode).toBe(400);
    expect(weak.json().error.message).toMatch(/common/);
    expect((await post(ctx, '/v1/auth/register', { email: 'a@example.com', password: 'short', displayName: 'Abc' })).statusCode).toBe(400);
    await register(ctx, 'dup@example.com');
    const again = await register(ctx, 'DUP@example.com');
    expect(again.res.statusCode).toBe(409);
    expect(again.body.error.code).toBe('email_taken');
  });
});

describe('login', () => {
  it('accepts the right password and gives the same refusal for wrong password and unknown email', async () => {
    const ctx = setup();
    await register(ctx);
    const ok = await post(ctx, '/v1/auth/login', { email: 'new@example.com', password: GOOD });
    expect(ok.statusCode).toBe(200);
    const wrong = await post(ctx, '/v1/auth/login', { email: 'new@example.com', password: 'wrong password!' });
    const unknown = await post(ctx, '/v1/auth/login', { email: 'ghost@example.com', password: GOOD });
    expect(wrong.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(wrong.json()).toEqual(unknown.json());
  });

  it('locks out after repeated failures', async () => {
    const ctx = setup();
    await register(ctx);
    let last = 0;
    for (let i = 0; i < 10; i++) {
      last = (await post(ctx, '/v1/auth/login', { email: 'new@example.com', password: 'wrong password!' })).statusCode;
    }
    expect(last).toBe(429);
    // even the right password is refused while locked
    expect((await post(ctx, '/v1/auth/login', { email: 'new@example.com', password: GOOD })).statusCode).toBe(429);
  });

  it('refuses suspended accounts', async () => {
    const ctx = setup();
    await register(ctx);
    ctx.db.prepare("UPDATE accounts SET status = 'suspended'").run();
    const res = await post(ctx, '/v1/auth/login', { email: 'new@example.com', password: GOOD });
    expect(res.statusCode).toBe(403);
  });

  it('rejects a token whose account no longer exists', async () => {
    const ctx = setup();
    const { body } = await register(ctx);
    ctx.db.exec('DELETE FROM email_codes; DELETE FROM refresh_tokens; DELETE FROM credentials; DELETE FROM accounts;');
    const me = await ctx.app.inject({ method: 'GET', url: '/v1/me', headers: { authorization: `Bearer ${body.accessToken}` } });
    expect(me.statusCode).toBe(401);
  });
});

describe('password hashing', () => {
  it('still accepts an older scrypt hash and upgrades it to Argon2id on sign-in', async () => {
    const ctx = setup();
    const { body } = await register(ctx, 'legacy@example.com');
    ctx.db.prepare('UPDATE credentials SET password_hash = ? WHERE user_id = ?').run(await legacyScryptHash(GOOD), body.user.userId);
    expect(needsRehash((ctx.db.prepare('SELECT password_hash h FROM credentials').get() as { h: string }).h, 1024)).toBe(true);

    expect((await post(ctx, '/v1/auth/login', { email: 'legacy@example.com', password: 'wrong password here' })).statusCode).toBe(401);
    expect((await post(ctx, '/v1/auth/login', { email: 'legacy@example.com', password: GOOD })).statusCode).toBe(200);

    const after = (ctx.db.prepare('SELECT password_hash h FROM credentials').get() as { h: string }).h;
    expect(after.startsWith('$argon2id$')).toBe(true);
    expect((await post(ctx, '/v1/auth/login', { email: 'legacy@example.com', password: GOOD })).statusCode).toBe(200);
  });
});

describe('profile', () => {
  const patch = (ctx: Ctx, payload: unknown, token?: string) =>
    ctx.app.inject({ method: 'PATCH', url: '/v1/me', payload: payload as object, headers: token ? { authorization: `Bearer ${token}` } : {} });

  it('lets a signed-in player change their display name and nothing else', async () => {
    const ctx = setup();
    const { body } = await register(ctx);
    expect((await patch(ctx, { displayName: 'Nova' })).statusCode).toBe(401);
    const ok = await patch(ctx, { displayName: '  Nova Prime ', email: 'evil@example.com', emailVerified: true }, body.accessToken);
    expect(ok.statusCode).toBe(200);
    expect(ok.json()).toMatchObject({ displayName: 'Nova Prime', email: 'new@example.com', emailVerified: false });
    const tooShort = await patch(ctx, { displayName: 'x' }, body.accessToken);
    expect(tooShort.statusCode).toBe(400);
    expect(tooShort.json().error.message).toBe('String must contain at least 2 character(s)');
    const invalidCharacters = await patch(ctx, { displayName: '<script>' }, body.accessToken);
    expect(invalidCharacters.statusCode).toBe(400);
    expect(invalidCharacters.json().error.message).toBe('Use letters, numbers, spaces, dots, dashes and underscores.');
  });
});

describe('Google sign-in', () => {
  const google = { GOOGLE_CLIENT_ID: 'client.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'secret' };
  const body = {
    code: 'authorization-code-from-google',
    codeVerifier: 'v'.repeat(64),
    nonce: 'n'.repeat(32),
    redirectUri: 'http://127.0.0.1:53682/callback',
  };
  const identity = (over: Partial<GoogleIdentity> = {}): GoogleIdentity => ({
    subject: 'google-sub-1',
    email: 'gamer@gmail.com',
    emailVerified: true,
    name: 'Gamer Girl',
    ...over,
  });
  const withGoogle = (who: () => GoogleIdentity | Promise<GoogleIdentity> = () => identity()) =>
    setup(google, async () => who());
  const signIn = (ctx: Ctx, payload: unknown = body) => post(ctx, '/v1/auth/google', payload);

  it('advertises Google only when it is set up, and never returns the secret', async () => {
    const off = setup();
    expect((await off.app.inject({ method: 'GET', url: '/v1/auth/providers' })).json()).toEqual({ google: null });
    expect((await signIn(off)).statusCode).toBe(404);

    const on = withGoogle();
    const res = await on.app.inject({ method: 'GET', url: '/v1/auth/providers' });
    expect(res.json()).toEqual({ google: { clientId: google.GOOGLE_CLIENT_ID } });
    expect(res.body).not.toContain(google.GOOGLE_CLIENT_SECRET);
  });

  it('creates a verified account on first sign-in and the same one on the next', async () => {
    const ctx = withGoogle();
    const first = await signIn(ctx);
    expect(first.statusCode).toBe(200);
    expect(first.json().user).toMatchObject({ email: 'gamer@gmail.com', displayName: 'Gamer Girl', emailVerified: true });
    expect(first.json().accessToken.split('.')).toHaveLength(3);
    const again = await signIn(ctx);
    expect(again.json().user.userId).toBe(first.json().user.userId);
    expect((ctx.db.prepare('SELECT COUNT(*) AS n FROM accounts').get() as { n: number }).n).toBe(1);
    // the new session works like any other
    const me = await ctx.app.inject({ method: 'GET', url: '/v1/me', headers: { authorization: `Bearer ${first.json().accessToken}` } });
    expect(me.statusCode).toBe(200);
  });

  it('lets a signed-in Google player add a password without an email code, once', async () => {
    const ctx = withGoogle();
    const first = await signIn(ctx);
    const token = first.json().accessToken;
    const meOf = async (t: string) =>
      (await ctx.app.inject({ method: 'GET', url: '/v1/me', headers: { authorization: `Bearer ${t}` } })).json();
    expect((await meOf(token)).hasPassword).toBe(false);

    expect((await post(ctx, '/v1/auth/set-password', { newPassword: 'short' }, token)).statusCode).toBe(400);
    expect((await post(ctx, '/v1/auth/set-password', { newPassword: GOOD })).statusCode).toBe(401); // needs a session

    const set = await post(ctx, '/v1/auth/set-password', { newPassword: GOOD }, token);
    expect(set.statusCode).toBe(200);
    expect(set.json().refreshToken).toBeTruthy();
    expect((await meOf(set.json().accessToken)).hasPassword).toBe(true);
    expect((await post(ctx, '/v1/auth/refresh', { refreshToken: first.json().refreshToken })).statusCode).toBe(401);

    // email and password now works, and a second set is refused
    expect((await post(ctx, '/v1/auth/login', { email: 'gamer@gmail.com', password: GOOD })).statusCode).toBe(200);
    expect((await post(ctx, '/v1/auth/set-password', { newPassword: 'another good pass' }, set.json().accessToken)).statusCode).toBe(409);
  });

  it('points a failed password sign-in at Google without saying whether the email exists', async () => {
    const ctx = withGoogle();
    await signIn(ctx);
    const known = await post(ctx, '/v1/auth/login', { email: 'gamer@gmail.com', password: GOOD });
    const unknown = await post(ctx, '/v1/auth/login', { email: 'nobody@gmail.com', password: GOOD });
    expect(known.statusCode).toBe(401);
    expect(known.json()).toEqual(unknown.json());
    expect(known.json().message ?? known.json().error?.message ?? '').toContain('Continue with Google');
  });

  it('has no password until the player sets one, which the reset flow allows', async () => {
    const ctx = withGoogle();
    await signIn(ctx);
    expect((await post(ctx, '/v1/auth/login', { email: 'gamer@gmail.com', password: GOOD })).statusCode).toBe(401);
    await post(ctx, '/v1/auth/forgot-password', { email: 'gamer@gmail.com' });
    const reset = await post(ctx, '/v1/auth/reset-password', { email: 'gamer@gmail.com', code: ctx.lastCode(), newPassword: GOOD });
    expect(reset.statusCode).toBe(200);
    expect((await post(ctx, '/v1/auth/login', { email: 'gamer@gmail.com', password: GOOD })).statusCode).toBe(200);
  });

  it('joins an existing password account that has the same email', async () => {
    const ctx = withGoogle();
    const { body: reg } = await register(ctx, 'gamer@gmail.com');
    await post(ctx, '/v1/auth/verify-email', { code: ctx.lastCode() }, reg.accessToken);
    const res = await signIn(ctx);
    expect(res.json().user.userId).toBe(reg.user.userId);
    expect((await post(ctx, '/v1/auth/login', { email: 'gamer@gmail.com', password: GOOD })).statusCode).toBe(200);
  });

  it('does not let someone who pre-registered an address they do not own keep access', async () => {
    const ctx = withGoogle();
    const { body: attacker } = await register(ctx, 'gamer@gmail.com'); // never confirmed the mailbox
    const res = await signIn(ctx);
    expect(res.json().user.userId).toBe(attacker.user.userId);
    expect(res.json().user.emailVerified).toBe(true);
    expect((await post(ctx, '/v1/auth/login', { email: 'gamer@gmail.com', password: GOOD })).statusCode).toBe(401);
    expect((await post(ctx, '/v1/auth/refresh', { refreshToken: attacker.refreshToken })).statusCode).toBe(401);
  });

  it('refuses an unverified Google email, a failed exchange, a suspended account and a non-loopback redirect', async () => {
    expect((await signIn(withGoogle(() => identity({ emailVerified: false })))).statusCode).toBe(403);

    const failing = withGoogle(() => {
      throw new Error('bad code');
    });
    const failed = await signIn(failing);
    expect(failed.statusCode).toBe(401);
    expect(failed.json().error.code).toBe('google_failed');

    const ctx = withGoogle();
    await signIn(ctx);
    ctx.db.prepare("UPDATE accounts SET status = 'suspended'").run();
    expect((await signIn(ctx)).statusCode).toBe(403);

    expect((await signIn(withGoogle(), { ...body, redirectUri: 'https://evil.example/callback' })).statusCode).toBe(400);
    expect((await signIn(withGoogle(), { ...body, redirectUri: 'http://127.0.0.1:53682/other' })).statusCode).toBe(400);
    expect((await signIn(withGoogle(), { code: 'short' })).statusCode).toBe(400);
  });

  it('makes a valid display name out of whatever Google sends', async () => {
    const odd = await signIn(withGoogle(() => identity({ name: '<script>alert(1)</script>' })));
    expect(odd.json().user.displayName).toMatch(/^[\p{L}\p{N} _.-]{2,32}$/u);
    const none = await signIn(withGoogle(() => identity({ name: '', email: 'x.y@gmail.com' })));
    expect(none.json().user.displayName).toBe('x.y');
  });

  it('requires both Google settings together in production', () => {
    const prod = {
      NODE_ENV: 'production',
      JWT_SECRET: 'j'.repeat(40),
      PLATFORM_SERVICE_KEY: 's'.repeat(40),
      PLATFORM_DOWNLOAD_KEY: 'd'.repeat(40),
      SMTP_URL: 'smtps://user:pass@smtp.example.com',
    };
    expect(() => loadConfig({ ...prod, GOOGLE_CLIENT_ID: 'x' })).toThrow(/GOOGLE_CLIENT/);
    expect(() => loadConfig({ ...prod, GOOGLE_CLIENT_ID: 'x', GOOGLE_CLIENT_SECRET: 'y' })).not.toThrow();
  });
});

describe('email verification', () => {
  it('blocks games until the code is confirmed', async () => {
    const ctx = setup();
    const { body } = await register(ctx);
    const token = body.accessToken as string;

    const blocked = await post(ctx, '/v1/library/railbound/claim', {}, token);
    expect(blocked.statusCode).toBe(403);
    expect(blocked.json().error.code).toBe('email_not_verified');

    const wrong = await post(ctx, '/v1/auth/verify-email', { code: '000000' }, token);
    expect(wrong.statusCode).toBe(400);

    const ok = await post(ctx, '/v1/auth/verify-email', { code: ctx.lastCode() }, token);
    expect(ok.statusCode).toBe(200);
    expect((await post(ctx, '/v1/library/railbound/claim', {}, token)).statusCode).toBe(200);
  });

  it('burns the code after five wrong guesses', async () => {
    const ctx = setup();
    const { body } = await register(ctx);
    const real = ctx.lastCode();
    const guess = real === '123456' ? '654321' : '123456';
    for (let i = 0; i < 5; i++) await post(ctx, '/v1/auth/verify-email', { code: guess }, body.accessToken);
    const late = await post(ctx, '/v1/auth/verify-email', { code: real }, body.accessToken);
    expect(late.statusCode).toBe(400);
  });

  it('expires the code after 15 minutes and sends a fresh one on request', async () => {
    const ctx = setup();
    const { body } = await register(ctx);
    const old = ctx.lastCode();
    ctx.advance(16 * 60_000);
    expect((await post(ctx, '/v1/auth/verify-email', { code: old }, body.accessToken)).statusCode).toBe(400);
    expect((await post(ctx, '/v1/auth/resend-verification', {}, body.accessToken)).statusCode).toBe(200);
    expect(ctx.sent).toHaveLength(2);
    expect((await post(ctx, '/v1/auth/verify-email', { code: ctx.lastCode() }, body.accessToken)).statusCode).toBe(200);
  });

  it('is not required when verification is switched off', async () => {
    const ctx = setup({ REQUIRE_EMAIL_VERIFICATION: 'false' });
    const { body } = await register(ctx);
    expect((await post(ctx, '/v1/library/railbound/claim', {}, body.accessToken)).statusCode).toBe(200);
  });
});

describe('sessions', () => {
  it('rotates the refresh token and treats reuse as theft', async () => {
    const ctx = setup();
    const { body } = await register(ctx);
    const first = body.refreshToken as string;

    const rotated = await post(ctx, '/v1/auth/refresh', { refreshToken: first });
    expect(rotated.statusCode).toBe(200);
    const second = rotated.json().refreshToken as string;
    expect(second).not.toBe(first);

    // the old token comes back: the whole chain is revoked
    expect((await post(ctx, '/v1/auth/refresh', { refreshToken: first })).statusCode).toBe(401);
    expect((await post(ctx, '/v1/auth/refresh', { refreshToken: second })).statusCode).toBe(401);
  });

  it('expires refresh tokens after 30 days', async () => {
    const ctx = setup();
    const { body } = await register(ctx);
    ctx.advance(31 * 24 * 60 * 60 * 1000);
    expect((await post(ctx, '/v1/auth/refresh', { refreshToken: body.refreshToken })).statusCode).toBe(401);
  });

  it('logout ends the session', async () => {
    const ctx = setup();
    const { body } = await register(ctx);
    expect((await post(ctx, '/v1/auth/logout', { refreshToken: body.refreshToken })).statusCode).toBe(200);
    expect((await post(ctx, '/v1/auth/refresh', { refreshToken: body.refreshToken })).statusCode).toBe(401);
  });
});

describe('password reset and change', () => {
  it('resets with an emailed code, signs everything out and answers the same for unknown emails', async () => {
    const ctx = setup();
    const { body } = await register(ctx);
    ctx.sent.length = 0;

    const unknown = await post(ctx, '/v1/auth/forgot-password', { email: 'ghost@example.com' });
    expect(unknown.statusCode).toBe(200);
    expect(ctx.sent).toHaveLength(0);

    const known = await post(ctx, '/v1/auth/forgot-password', { email: 'new@example.com' });
    expect(known.json()).toEqual(unknown.json());
    expect(ctx.sent).toHaveLength(1);

    const bad = await post(ctx, '/v1/auth/reset-password', { email: 'new@example.com', code: '000000', newPassword: 'a brand new pass' });
    expect(bad.statusCode).toBe(400);
    const reset = await post(ctx, '/v1/auth/reset-password', {
      email: 'new@example.com',
      code: ctx.lastCode(),
      newPassword: 'a brand new pass',
    });
    expect(reset.statusCode).toBe(200);

    expect((await post(ctx, '/v1/auth/login', { email: 'new@example.com', password: GOOD })).statusCode).toBe(401);
    expect((await post(ctx, '/v1/auth/login', { email: 'new@example.com', password: 'a brand new pass' })).statusCode).toBe(200);
    expect((await post(ctx, '/v1/auth/refresh', { refreshToken: body.refreshToken })).statusCode).toBe(401);
  });

  it('changes the password for a signed-in player and keeps this device signed in', async () => {
    const ctx = setup();
    const { body } = await register(ctx);
    const wrong = await post(ctx, '/v1/auth/change-password', { currentPassword: 'nope nope nope', newPassword: 'another good pass' }, body.accessToken);
    expect(wrong.statusCode).toBe(403);

    const ok = await post(ctx, '/v1/auth/change-password', { currentPassword: GOOD, newPassword: 'another good pass' }, body.accessToken);
    expect(ok.statusCode).toBe(200);
    expect(ok.json().refreshToken).toBeTruthy();
    expect((await post(ctx, '/v1/auth/refresh', { refreshToken: body.refreshToken })).statusCode).toBe(401);
    expect((await post(ctx, '/v1/auth/refresh', { refreshToken: ok.json().refreshToken })).statusCode).toBe(200);
  });
});

describe('mail without a server', () => {
  const logged: string[] = [];
  const log = { info: (obj: unknown, msg?: string) => logged.push(JSON.stringify(obj) + (msg ?? '')), error: () => {} };

  it('writes the code to the log in development only', async () => {
    logged.length = 0;
    await makeMailer(loadConfig({ ...env }), log).send('a@example.com', 'Subject', 'Your code is 123456');
    expect(logged.join(' ')).toContain('123456');
  });

  it('never writes it in production', async () => {
    logged.length = 0;
    const prod = loadConfig({
      NODE_ENV: 'production', JWT_SECRET: 'j'.repeat(40), PLATFORM_SERVICE_KEY: 's'.repeat(40),
      PLATFORM_DOWNLOAD_KEY: 'd'.repeat(40), REQUIRE_EMAIL_VERIFICATION: 'false', LOG_LEVEL: 'silent',
    });
    await makeMailer(prod, log).send('a@example.com', 'Subject', 'Your code is 123456');
    expect(logged.join(' ')).not.toContain('123456');
  });
});

describe('production config', () => {
  const base = {
    NODE_ENV: 'production',
    JWT_SECRET: 'j'.repeat(40),
    PLATFORM_SERVICE_KEY: 's'.repeat(40),
    PLATFORM_DOWNLOAD_KEY: 'd'.repeat(40),
    SMTP_URL: 'smtps://user:pass@smtp.example.com',
  };

  it('starts with a complete config', () => {
    expect(() => loadConfig(base)).not.toThrow();
    expect(loadConfig(base).requireVerifiedEmail).toBe(true);
  });

  it('refuses defaults, a missing mail server and dev login', () => {
    expect(() => loadConfig({ ...base, JWT_SECRET: undefined })).toThrow(/JWT_SECRET/);
    expect(() => loadConfig({ ...base, SMTP_URL: undefined })).toThrow(/SMTP_URL/);
    expect(() => loadConfig({ ...base, ALLOW_DEV_LOGIN: 'true' })).toThrow(/ALLOW_DEV_LOGIN/);
    expect(() => loadConfig({ ...base, PASSWORD_COST: '1024' })).toThrow(/PASSWORD_COST/);
  });

  it('has no dev login route unless asked for', async () => {
    const ctx = setup();
    const res = await post(ctx, '/v1/dev/login', { email: 'a@example.com', displayName: 'Abc' });
    expect(res.statusCode).toBe(404);
  });
});
