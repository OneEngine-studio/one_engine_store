import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { openDb } from '../src/db.js';
import { buildServer } from '../src/server.js';
import type { Mailer } from '../src/mailer.js';

const env = { PASSWORD_COST: '1024', REQUIRE_EMAIL_VERIFICATION: 'true', LOG_LEVEL: 'silent' };
const GOOD = 'correct horse battery';

function setup(extra: Record<string, string> = {}) {
  let clock = 1_800_000_000_000;
  const now = () => clock;
  const sent: { to: string; subject: string; text: string }[] = [];
  const mailer: Mailer = {
    async send(to, subject, text) {
      sent.push({ to, subject, text });
    },
  };
  const db = openDb(':memory:');
  const app = buildServer({ cfg: loadConfig({ ...env, ...extra }), db, mailer, now });
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
    expect(row.password_hash.startsWith('scrypt$')).toBe(true);
    expect(row.password_hash).not.toContain(GOOD);
  });

  it('rejects a bad email, a weak password and a duplicate', async () => {
    const ctx = setup();
    expect((await post(ctx, '/v1/auth/register', { email: 'nope', password: GOOD, displayName: 'Abc' })).statusCode).toBe(400);
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
