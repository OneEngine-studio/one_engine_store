import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createHash, createHmac, randomBytes, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import type { Config } from './config.js';
import { signAccessToken } from './auth.js';
import { hashPassword, needsRehash, passwordProblem, verifyPassword } from './passwords.js';
import { resetMail, verificationMail, type Mailer } from './mailer.js';
import { RateLimiter } from './tickets.js';

export const ACCESS_TTL_SECONDS = 15 * 60;
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_CODE_ATTEMPTS = 5;

interface Deps {
  cfg: Config;
  db: DatabaseSync;
  mailer: Mailer;
  now: () => number;
  requireUser: (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>;
}

type AccountRow = {
  user_id: string;
  email: string;
  display_name: string;
  email_verified: number;
  status: string;
};

const fail = (reply: FastifyReply, status: number, code: string, message: string) =>
  reply.code(status).send({ error: { code, message } });

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(1).max(128);
export const displayNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(32)
  .regex(/^[\p{L}\p{N} _.-]+$/u, 'Use letters, numbers, spaces, dots, dashes and underscores.');
const displayName = displayNameSchema;
const code = z.string().trim().regex(/^\d{6}$/);

export function registerAccountRoutes(app: FastifyInstance, { cfg, db, mailer, now, requireUser }: Deps) {
  const loginLimiter = new RateLimiter(8, 15 * 60_000, now); // per ip + email
  const loginIpLimiter = new RateLimiter(40, 15 * 60_000, now);
  const registerLimiter = new RateLimiter(5, 60 * 60_000, now);
  const mailLimiter = new RateLimiter(5, 60 * 60_000, now); // per account
  const mailIpLimiter = new RateLimiter(20, 60 * 60_000, now);
  const codeLimiter = new RateLimiter(30, 15 * 60_000, now); // per ip, wrong-code spraying

  // Hashing a password for an unknown email keeps response times alike.
  let dummyHash: Promise<string> | null = null;
  const dummy = () => (dummyHash ??= hashPassword('not-a-real-password', cfg.passwordCost));

  app.addHook('onSend', async (req, reply) => {
    if (req.url.startsWith('/v1/auth/')) reply.header('cache-control', 'no-store');
  });

  const findByEmail = (value: string) =>
    db
      .prepare(
        `SELECT a.user_id, a.email, a.display_name, a.email_verified, a.status, c.password_hash
         FROM accounts a LEFT JOIN credentials c ON c.user_id = a.user_id WHERE a.email = ?`
      )
      .get(value) as (AccountRow & { password_hash: string | null }) | undefined;

  const userView = (a: AccountRow) => ({
    userId: a.user_id,
    email: a.email,
    displayName: a.display_name,
    emailVerified: !!a.email_verified,
  });

  async function issueSession(account: AccountRow, familyId: string = randomUUID()) {
    const accessToken = await signAccessToken(
      cfg,
      { sub: account.user_id, email: account.email, name: account.display_name },
      ACCESS_TTL_SECONDS
    );
    const refreshToken = randomBytes(32).toString('base64url');
    const t = now();
    db.prepare(
      'INSERT INTO refresh_tokens (token_hash, user_id, family_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).run(sha256(refreshToken), account.user_id, familyId, t, t + REFRESH_TTL_MS);
    return {
      accessToken,
      accessExpiresAt: t + ACCESS_TTL_SECONDS * 1000,
      refreshToken,
      refreshExpiresAt: t + REFRESH_TTL_MS,
      user: userView(account),
    };
  }

  const revokeAllSessions = (userId: string) =>
    db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(now(), userId);

  // ---- email codes ----
  const codeHash = (userId: string, kind: string, value: string) =>
    createHmac('sha256', cfg.jwtSecret).update(`${userId}:${kind}:${value}`).digest('hex');

  function createCode(userId: string, kind: 'verify' | 'reset'): string {
    db.prepare('UPDATE email_codes SET used_at = ? WHERE user_id = ? AND kind = ? AND used_at IS NULL').run(
      now(),
      userId,
      kind
    );
    const value = String(randomInt(0, 1_000_000)).padStart(6, '0');
    db.prepare('INSERT INTO email_codes (user_id, kind, code_hash, expires_at) VALUES (?, ?, ?, ?)').run(
      userId,
      kind,
      codeHash(userId, kind, value),
      now() + CODE_TTL_MS
    );
    return value;
  }

  function checkCode(userId: string, kind: 'verify' | 'reset', value: string): boolean {
    const row = db
      .prepare(
        'SELECT id, code_hash, expires_at, attempts FROM email_codes WHERE user_id = ? AND kind = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1'
      )
      .get(userId, kind) as { id: number; code_hash: string; expires_at: number; attempts: number } | undefined;
    if (!row || row.expires_at < now() || row.attempts >= MAX_CODE_ATTEMPTS) return false;
    db.prepare('UPDATE email_codes SET attempts = attempts + 1 WHERE id = ?').run(row.id);
    const a = Buffer.from(row.code_hash);
    const b = Buffer.from(codeHash(userId, kind, value));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
    db.prepare('UPDATE email_codes SET used_at = ? WHERE id = ?').run(now(), row.id);
    return true;
  }

  async function sendCode(account: AccountRow, kind: 'verify' | 'reset') {
    const value = createCode(account.user_id, kind);
    const mail = kind === 'verify' ? verificationMail(value) : resetMail(value);
    try {
      await mailer.send(account.email, mail.subject, mail.text);
    } catch (err) {
      app.log.error({ err, kind }, 'could not send email');
      throw err;
    }
  }

  const badRequest = (reply: FastifyReply, message: string) => fail(reply, 400, 'bad_request', message);
  const firstIssue = (err: z.ZodError) => err.issues[0]?.message ?? 'Check the details and try again.';

  // ---- register ----
  app.post('/v1/auth/register', async (req, reply) => {
    const parsed = z.object({ email, password, displayName }).safeParse(req.body);
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      const message =
        field === 'email'
          ? 'Enter a valid email address.'
          : field === 'displayName'
            ? 'Callsign must be 2 to 32 letters, numbers, spaces, dots, dashes or underscores.'
            : firstIssue(parsed.error);
      return badRequest(reply, message);
    }
    if (!registerLimiter.allow(req.ip)) return fail(reply, 429, 'rate_limited', 'Too many sign-ups from here. Try again later.');

    const { email: addr, password: pw, displayName: name } = parsed.data;
    const problem = passwordProblem(pw, addr);
    if (problem) return badRequest(reply, problem);
    if (findByEmail(addr)) return fail(reply, 409, 'email_taken', 'An account with this email already exists. Sign in instead.');

    const userId = randomUUID();
    const hash = await hashPassword(pw, cfg.passwordCost);
    db.prepare('INSERT INTO accounts (user_id, email, display_name) VALUES (?, ?, ?)').run(userId, addr, name);
    db.prepare('INSERT INTO credentials (user_id, password_hash) VALUES (?, ?)').run(userId, hash);

    const account = { user_id: userId, email: addr, display_name: name, email_verified: 0, status: 'active' };
    try {
      await sendCode(account, 'verify');
    } catch {
      // The account exists; the player can ask for another code once mail works.
    }
    return issueSession(account);
  });

  // ---- login ----
  app.post('/v1/auth/login', async (req, reply) => {
    const parsed = z.object({ email, password }).safeParse(req.body);
    if (!parsed.success) return fail(reply, 401, 'invalid_credentials', 'Wrong email or password.');
    const { email: addr, password: pw } = parsed.data;
    if (!loginIpLimiter.allow(req.ip) || !loginLimiter.allow(`${req.ip}|${addr}`)) {
      return fail(reply, 429, 'rate_limited', 'Too many sign-in attempts. Wait 15 minutes and try again.');
    }

    const row = findByEmail(addr);
    const ok = await verifyPassword(pw, row?.password_hash ?? (await dummy()));
    if (!row || !row.password_hash || !ok) return fail(reply, 401, 'invalid_credentials', 'Wrong email or password.');
    if (row.status !== 'active') return fail(reply, 403, 'account_suspended', 'This account is suspended.');
    if (needsRehash(row.password_hash, cfg.passwordCost)) {
      // Older accounts and lower-cost hashes are upgraded to the current Argon2id settings now that the password is known.
      const upgraded = await hashPassword(pw, cfg.passwordCost);
      db.prepare("UPDATE credentials SET password_hash = ?, updated_at = datetime('now') WHERE user_id = ?").run(upgraded, row.user_id);
    }
    return issueSession(row);
  });

  // ---- refresh (rotating, reuse revokes the whole chain) ----
  app.post('/v1/auth/refresh', async (req, reply) => {
    const parsed = z.object({ refreshToken: z.string().min(20).max(128) }).safeParse(req.body);
    if (!parsed.success) return fail(reply, 401, 'refresh_invalid', 'Sign in again.');
    if (!loginIpLimiter.allow(`refresh|${req.ip}`)) return fail(reply, 429, 'rate_limited', 'Too many requests.');

    const row = db
      .prepare('SELECT user_id, family_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ?')
      .get(sha256(parsed.data.refreshToken)) as
      | { user_id: string; family_id: string; expires_at: number; revoked_at: number | null }
      | undefined;
    if (!row) return fail(reply, 401, 'refresh_invalid', 'Sign in again.');
    if (row.revoked_at) {
      // A used token came back: someone copied it. End every session in this chain.
      db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE family_id = ? AND revoked_at IS NULL').run(
        now(),
        row.family_id
      );
      return fail(reply, 401, 'refresh_invalid', 'Sign in again.');
    }
    if (row.expires_at < now()) return fail(reply, 401, 'refresh_invalid', 'Your session expired. Sign in again.');

    const account = db
      .prepare('SELECT user_id, email, display_name, email_verified, status FROM accounts WHERE user_id = ?')
      .get(row.user_id) as AccountRow | undefined;
    if (!account || account.status !== 'active') return fail(reply, 401, 'refresh_invalid', 'Sign in again.');

    db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE token_hash = ?').run(now(), sha256(parsed.data.refreshToken));
    return issueSession(account, row.family_id);
  });

  app.post('/v1/auth/logout', async (req) => {
    const parsed = z.object({ refreshToken: z.string().min(20).max(128) }).safeParse(req.body);
    if (parsed.success) {
      const row = db
        .prepare('SELECT family_id FROM refresh_tokens WHERE token_hash = ?')
        .get(sha256(parsed.data.refreshToken)) as { family_id: string } | undefined;
      if (row) {
        db.prepare('UPDATE refresh_tokens SET revoked_at = ? WHERE family_id = ? AND revoked_at IS NULL').run(
          now(),
          row.family_id
        );
      }
    }
    return { ok: true };
  });

  // ---- email verification ----
  app.post('/v1/auth/verify-email', { preHandler: requireUser }, async (req, reply) => {
    const parsed = z.object({ code }).safeParse(req.body);
    if (!parsed.success) return badRequest(reply, 'Enter the 6 digit code from the email.');
    if (!codeLimiter.allow(req.ip)) return fail(reply, 429, 'rate_limited', 'Too many attempts. Try again later.');
    const userId = req.user!.sub;
    if (!checkCode(userId, 'verify', parsed.data.code)) {
      return fail(reply, 400, 'code_invalid', 'That code is wrong or has expired. Ask for a new one.');
    }
    db.prepare('UPDATE accounts SET email_verified = 1 WHERE user_id = ?').run(userId);
    return { ok: true, emailVerified: true };
  });

  app.post('/v1/auth/resend-verification', { preHandler: requireUser }, async (req, reply) => {
    const userId = req.user!.sub;
    const account = db
      .prepare('SELECT user_id, email, display_name, email_verified, status FROM accounts WHERE user_id = ?')
      .get(userId) as AccountRow;
    if (account.email_verified) return { ok: true, emailVerified: true };
    if (!mailLimiter.allow(`verify|${userId}`) || !mailIpLimiter.allow(req.ip)) {
      return fail(reply, 429, 'rate_limited', 'Too many codes requested. Try again in an hour.');
    }
    try {
      await sendCode(account, 'verify');
    } catch {
      return fail(reply, 502, 'mail_failed', 'We could not send the email. Try again later.');
    }
    return { ok: true, emailVerified: false };
  });

  // ---- password reset ----
  app.post('/v1/auth/forgot-password', async (req, reply) => {
    const parsed = z.object({ email }).safeParse(req.body);
    if (!parsed.success) return badRequest(reply, 'Enter a valid email address.');
    if (!mailIpLimiter.allow(`forgot|${req.ip}`)) return fail(reply, 429, 'rate_limited', 'Too many requests. Try again later.');
    const row = findByEmail(parsed.data.email);
    // Same answer whether or not the address has an account.
    if (row && row.password_hash && row.status === 'active' && mailLimiter.allow(`reset|${row.user_id}`)) {
      try {
        await sendCode(row, 'reset');
      } catch {
        // swallowed on purpose: the response must not reveal anything
      }
    }
    return { ok: true };
  });

  app.post('/v1/auth/reset-password', async (req, reply) => {
    const parsed = z.object({ email, code, newPassword: password }).safeParse(req.body);
    if (!parsed.success) return badRequest(reply, 'Enter your email, the 6 digit code and a new password.');
    if (!codeLimiter.allow(req.ip)) return fail(reply, 429, 'rate_limited', 'Too many attempts. Try again later.');
    const { email: addr, code: c, newPassword } = parsed.data;
    const problem = passwordProblem(newPassword, addr);
    if (problem) return badRequest(reply, problem);

    const row = findByEmail(addr);
    if (!row || !checkCode(row.user_id, 'reset', c)) {
      return fail(reply, 400, 'code_invalid', 'That code is wrong or has expired. Ask for a new one.');
    }
    const hash = await hashPassword(newPassword, cfg.passwordCost);
    db.prepare(
      `INSERT INTO credentials (user_id, password_hash) VALUES (?, ?)
       ON CONFLICT(user_id) DO UPDATE SET password_hash = excluded.password_hash, updated_at = datetime('now')`
    ).run(row.user_id, hash);
    db.prepare('UPDATE accounts SET email_verified = 1 WHERE user_id = ?').run(row.user_id); // the code proves the mailbox
    revokeAllSessions(row.user_id);
    return { ok: true };
  });

  app.post('/v1/auth/change-password', { preHandler: requireUser }, async (req, reply) => {
    const parsed = z.object({ currentPassword: password, newPassword: password }).safeParse(req.body);
    if (!parsed.success) return badRequest(reply, 'Enter your current and new password.');
    const userId = req.user!.sub;
    if (!loginLimiter.allow(`change|${userId}`)) return fail(reply, 429, 'rate_limited', 'Too many attempts. Try again later.');
    const row = db
      .prepare('SELECT a.email, c.password_hash FROM accounts a LEFT JOIN credentials c ON c.user_id = a.user_id WHERE a.user_id = ?')
      .get(userId) as { email: string; password_hash: string | null };
    if (!row.password_hash || !(await verifyPassword(parsed.data.currentPassword, row.password_hash))) {
      return fail(reply, 403, 'invalid_credentials', 'Your current password is wrong.');
    }
    const problem = passwordProblem(parsed.data.newPassword, row.email);
    if (problem) return badRequest(reply, problem);
    const hash = await hashPassword(parsed.data.newPassword, cfg.passwordCost);
    db.prepare("UPDATE credentials SET password_hash = ?, updated_at = datetime('now') WHERE user_id = ?").run(hash, userId);
    // Every other device is signed out; this one gets a fresh session so the player stays in.
    revokeAllSessions(userId);
    const account = db
      .prepare('SELECT user_id, email, display_name, email_verified, status FROM accounts WHERE user_id = ?')
      .get(userId) as AccountRow;
    return issueSession(account);
  });
}
