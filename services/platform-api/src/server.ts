import Fastify, { type FastifyReply, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { createReadStream, statSync } from 'node:fs';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import { z } from 'zod';
import type { Config } from './config.js';
import { makeVerifier, signAccessToken, type AuthUser, type TokenVerifier } from './auth.js';
import { accountValidationError, displayNameSchema, registerAccountRoutes } from './accounts.js';
import { makeMailer, type Mailer } from './mailer.js';
import { RateLimiter, TicketStore } from './tickets.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser | null;
    emailVerified: boolean;
  }
}

interface Deps {
  cfg: Config;
  db: DatabaseSync;
  tickets?: TicketStore;
  verify?: TokenVerifier;
  mailer?: Mailer;
  now?: () => number;
}

type ProductRow = {
  product_id: string;
  kind: string;
  title: string;
  summary: string | null;
  developer: string | null;
  tags: string;
  visibility: string;
};
type PriceRow = { amount_minor: number; discount_percent: number; currency: string };

const fail = (reply: FastifyReply, status: number, code: string, message: string) =>
  reply.code(status).send({ error: { code, message } });

const safeEqual = (a: string, b: string) => {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
};

export function buildServer({ cfg, db, tickets, verify, mailer, now = Date.now }: Deps) {
  const app = Fastify({
    logger: { level: cfg.logLevel, redact: ['req.headers.authorization'] },
    trustProxy: cfg.production,
    bodyLimit: 64 * 1024,
  });
  const store = tickets ?? new TicketStore(now);
  const verifier = verify ?? makeVerifier(cfg);
  const ticketLimiter = new RateLimiter(10, 60_000, now);

  app.register(cors, { origin: cfg.corsOrigins });
  app.decorateRequest('user', null);
  app.decorateRequest('emailVerified', false);
  app.addHook('onSend', async (_req, reply) => {
    reply.header('x-content-type-options', 'nosniff');
  });

  // ---------- helpers ----------
  const getPrice = (productId: string, currency: string): PriceRow | undefined =>
    db
      .prepare('SELECT amount_minor, discount_percent, currency FROM prices WHERE product_id = ? AND currency = ?')
      .get(productId, currency) as PriceRow | undefined;

  const priceView = (p?: PriceRow) =>
    p
      ? {
          currency: p.currency,
          amountMinor: p.amount_minor,
          discountPercent: p.discount_percent,
          finalMinor: Math.round(p.amount_minor * (1 - p.discount_percent / 100)),
        }
      : null;

  const productView = (r: ProductRow, currency: string) => ({
    productId: r.product_id,
    kind: r.kind,
    title: r.title,
    summary: r.summary,
    developer: r.developer,
    tags: JSON.parse(r.tags) as string[],
    price: priceView(getPrice(r.product_id, currency)),
  });

  const isFree = (productId: string) => {
    const p = getPrice(productId, 'USD');
    return !p || p.amount_minor === 0;
  };

  const hasEntitlement = (userId: string, productId: string) =>
    !!db
      .prepare('SELECT 1 FROM entitlements WHERE user_id = ? AND product_id = ? AND revoked_at IS NULL')
      .get(userId, productId);

  type AccountState = { user_id: string; status: string; email_verified: number };

  // With our own accounts a valid token for a deleted account must fail. Only an external identity
  // provider may create accounts on first sight.
  const loadAccount = (u: AuthUser): AccountState | undefined => {
    const byId = db.prepare('SELECT user_id, status, email_verified FROM accounts WHERE user_id = ?').get(u.sub) as
      | AccountState
      | undefined;
    if (byId || !cfg.idpJwksUrl) return byId;
    db.prepare('INSERT INTO accounts (user_id, email, display_name, email_verified) VALUES (?, ?, ?, 1)').run(
      u.sub,
      u.email || `${u.sub}@unknown.invalid`,
      u.name
    );
    return { user_id: u.sub, status: 'active', email_verified: 1 };
  };

  async function requireUser(req: FastifyRequest, reply: FastifyReply) {
    const header = req.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return fail(reply, 401, 'auth_required', 'Sign in to continue.');
    try {
      req.user = await verifier(token);
    } catch {
      return fail(reply, 401, 'auth_invalid', 'Your session is invalid or expired.');
    }
    const account = loadAccount(req.user);
    if (!account) return fail(reply, 401, 'auth_invalid', 'Your session is invalid or expired.');
    if (account.status !== 'active') return fail(reply, 403, 'account_suspended', 'This account is suspended.');
    req.emailVerified = !!account.email_verified;
  }

  // Getting, downloading and starting games needs a confirmed email when verification is on.
  async function requireVerified(req: FastifyRequest, reply: FastifyReply) {
    if (cfg.requireVerifiedEmail && !req.emailVerified) {
      return fail(reply, 403, 'email_not_verified', 'Confirm your email address first. We sent you a 6 digit code.');
    }
  }
  const owner = [requireUser, requireVerified];

  // ---------- public ----------
  app.get('/healthz', async () => ({ ok: true }));

  app.get('/v1/catalog', async (req) => {
    const currency = z.string().length(3).catch('USD').parse((req.query as Record<string, string>).currency);
    const rows = db.prepare("SELECT * FROM products WHERE visibility = 'public' ORDER BY title").all() as ProductRow[];
    return { items: rows.map((r) => productView(r, currency.toUpperCase())) };
  });

  app.get('/v1/catalog/:productId', async (req, reply) => {
    const { productId } = req.params as { productId: string };
    const currency = z.string().length(3).catch('USD').parse((req.query as Record<string, string>).currency);
    const row = db.prepare("SELECT * FROM products WHERE product_id = ? AND visibility = 'public'").get(productId) as
      | ProductRow
      | undefined;
    if (!row) return fail(reply, 404, 'not_found', 'Product not found.');
    return productView(row, currency.toUpperCase());
  });

  // ---------- development login (disabled unless ALLOW_DEV_LOGIN=true) ----------
  if (cfg.allowDevLogin) {
    const body = z.object({ email: z.email(), displayName: z.string().min(2).max(32) });
    app.post('/v1/dev/login', async (req, reply) => {
      const parsed = body.safeParse(req.body);
      if (!parsed.success) return fail(reply, 400, 'bad_request', 'Provide a valid email and display name.');
      const { email, displayName } = parsed.data;
      const existing = db.prepare('SELECT user_id FROM accounts WHERE email = ?').get(email) as
        | { user_id: string }
        | undefined;
      const userId = existing?.user_id ?? randomUUID();
      if (!existing) {
        db.prepare('INSERT INTO accounts (user_id, email, display_name, email_verified) VALUES (?, ?, ?, 1)').run(
          userId,
          email,
          displayName
        );
      }
      const accessToken = await signAccessToken(cfg, { sub: userId, email, name: displayName }, 600);
      return { accessToken, expiresInSeconds: 600, userId };
    });
  }

  // ---------- signed-in ----------
  app.get('/v1/me', { preHandler: requireUser }, async (req) => {
    const row = db.prepare('SELECT user_id, email, email_verified, display_name FROM accounts WHERE user_id = ?').get(
      req.user!.sub
    ) as { user_id: string; email: string; email_verified: number; display_name: string };
    return {
      userId: row.user_id,
      email: row.email,
      emailVerified: !!row.email_verified,
      displayName: row.display_name,
    };
  });

  app.patch('/v1/me', { preHandler: requireUser }, async (req, reply) => {
    const parsed = z.object({ displayName: displayNameSchema }).safeParse(req.body, { error: accountValidationError });
    if (!parsed.success) {
      return fail(reply, 400, 'bad_request', parsed.error.issues[0]?.message || 'Enter a display name of 2 to 32 characters.');
    }
    db.prepare('UPDATE accounts SET display_name = ? WHERE user_id = ?').run(parsed.data.displayName, req.user!.sub);
    const row = db.prepare('SELECT user_id, email, email_verified, display_name FROM accounts WHERE user_id = ?').get(
      req.user!.sub
    ) as { user_id: string; email: string; email_verified: number; display_name: string };
    return { userId: row.user_id, email: row.email, emailVerified: !!row.email_verified, displayName: row.display_name };
  });

  app.get('/v1/library', { preHandler: requireUser }, async (req) => {
    const rows = db
      .prepare(
        `SELECT p.* FROM entitlements e JOIN products p ON p.product_id = e.product_id
         WHERE e.user_id = ? AND e.revoked_at IS NULL ORDER BY e.granted_at`
      )
      .all(req.user!.sub) as ProductRow[];
    return { items: rows.map((r) => productView(r, 'USD')) };
  });

  app.post('/v1/library/:productId/claim', { preHandler: owner }, async (req, reply) => {
    const { productId } = req.params as { productId: string };
    const exists = db.prepare("SELECT 1 FROM products WHERE product_id = ? AND visibility = 'public'").get(productId);
    if (!exists) return fail(reply, 404, 'not_found', 'Product not found.');
    // Paid products are granted by the payment webhook. Dev mode may claim anything for testing.
    if (!isFree(productId) && !cfg.allowDevLogin) {
      return fail(reply, 402, 'payment_required', 'This product must be purchased.');
    }
    if (!hasEntitlement(req.user!.sub, productId)) {
      db.prepare('INSERT INTO entitlements (user_id, product_id, source) VALUES (?, ?, ?)').run(
        req.user!.sub,
        productId,
        isFree(productId) ? 'free' : 'dev'
      );
    }
    return { ok: true };
  });

  // Short-lived CDN access token: "<productId>.<expiresAtSeconds>.<hmac>"
  const signDownloadToken = (productId: string) => {
    const expires = Math.floor(now() / 1000) + 600;
    const payload = `${productId}.${expires}`;
    const sig = createHmac('sha256', cfg.downloadKey).update(payload).digest('base64url');
    return { token: `${payload}.${sig}`, expiresAt: expires * 1000 };
  };

  const downloadTokenValid = (token: string, productId: string) => {
    const [id, expires, sig] = token.split('.');
    if (!id || !expires || !sig || id !== productId || Number(expires) * 1000 < now()) return false;
    const expected = createHmac('sha256', cfg.downloadKey).update(`${id}.${expires}`).digest('base64url');
    return safeEqual(sig, expected);
  };

  app.post('/v1/products/:productId/download-token', { preHandler: owner }, async (req, reply) => {
    const { productId } = req.params as { productId: string };
    if (!hasEntitlement(req.user!.sub, productId)) return fail(reply, 403, 'not_entitled', 'You do not own this game.');
    return signDownloadToken(productId);
  });

  type BuildRow = {
    build_id: string;
    version: string;
    executable: string;
    total_size: number;
    sha256: string;
    blocked: number;
  };
  const SAFE_NAME = /^[A-Za-z0-9._-]{1,128}$/;

  // Newest allowed build plus a short-lived link to fetch it. Owners only.
  app.get('/v1/products/:productId/builds/latest', { preHandler: owner }, async (req, reply) => {
    const { productId } = req.params as { productId: string };
    const platform = z.string().regex(SAFE_NAME).catch('win64').parse((req.query as Record<string, string>).platform);
    if (!hasEntitlement(req.user!.sub, productId)) return fail(reply, 403, 'not_entitled', 'You do not own this game.');

    const build = db
      .prepare(
        `SELECT build_id, version, executable, total_size, sha256, blocked FROM builds
         WHERE product_id = ? AND platform = ? AND blocked = 0 ORDER BY rowid DESC LIMIT 1`
      )
      .get(productId, platform) as BuildRow | undefined;
    if (!build) return fail(reply, 404, 'no_build', 'No downloadable build has been published yet.');

    const base = cfg.publicBaseUrl || `${req.protocol}://${req.headers.host}`;
    const { token, expiresAt } = signDownloadToken(productId);
    return {
      buildId: build.build_id,
      version: build.version,
      executable: build.executable || `${productId}.exe`,
      platform,
      sizeBytes: build.total_size,
      sha256: build.sha256,
      downloadUrl: `${base}/v1/depot/${encodeURIComponent(productId)}/${encodeURIComponent(platform)}/${encodeURIComponent(build.build_id)}.zip?token=${encodeURIComponent(token)}`,
      expiresAt,
    };
  });

  // Local depot for development. In production a CDN checks the same token and serves the same path.
  app.get('/v1/depot/:productId/:platform/:file', async (req, reply) => {
    const { productId, platform, file } = req.params as { productId: string; platform: string; file: string };
    const token = (req.query as Record<string, string>).token ?? '';
    if (!SAFE_NAME.test(productId) || !SAFE_NAME.test(platform) || !/^[A-Za-z0-9._-]{1,128}\.zip$/.test(file)) {
      return fail(reply, 400, 'bad_request', 'Invalid path.');
    }
    if (!downloadTokenValid(token, productId)) return fail(reply, 403, 'token_invalid', 'Download link is invalid or expired.');

    const buildId = file.slice(0, -4);
    const build = db
      .prepare('SELECT blocked FROM builds WHERE product_id = ? AND platform = ? AND build_id = ?')
      .get(productId, platform, buildId) as { blocked: number } | undefined;
    if (!build) return fail(reply, 404, 'not_found', 'Build not found.');
    if (build.blocked) return fail(reply, 403, 'build_blocked', 'This version is no longer available.');

    const path = join(cfg.depotDir, productId, platform, file);
    let size: number;
    try {
      size = statSync(path).size;
    } catch {
      return fail(reply, 404, 'not_found', 'Build file is missing from the depot.');
    }

    // One byte range is enough for resumable downloads.
    let start = 0;
    let end = size - 1;
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
    if (range && (range[1] || range[2])) {
      if (range[1]) {
        start = Number(range[1]);
        if (range[2]) end = Math.min(Number(range[2]), size - 1);
      } else {
        start = Math.max(size - Number(range[2]), 0);
      }
      if (start > end || start >= size) {
        return reply.code(416).header('content-range', `bytes */${size}`).send();
      }
      reply.code(206).header('content-range', `bytes ${start}-${end}/${size}`);
    }
    return reply
      .header('content-type', 'application/zip')
      .header('accept-ranges', 'bytes')
      .header('content-length', end - start + 1)
      .send(createReadStream(path, { start, end }));
  });

  const ticketBody = z.object({
    productId: z.string().min(1).max(64),
    buildId: z.string().max(64).optional(),
    platform: z.string().max(16).default('win64'),
    deviceId: z.string().min(8).max(128),
  });

  app.post('/v1/launch-tickets', { preHandler: owner }, async (req, reply) => {
    const parsed = ticketBody.safeParse(req.body);
    if (!parsed.success) return fail(reply, 400, 'bad_request', 'productId and deviceId are required.');
    const { productId, buildId, platform, deviceId } = parsed.data;
    const user = req.user!;

    if (!ticketLimiter.allow(user.sub)) return fail(reply, 429, 'rate_limited', 'Too many launch attempts. Wait a minute.');
    if (!hasEntitlement(user.sub, productId)) return fail(reply, 403, 'not_entitled', 'You do not own this game.');
    if (buildId) {
      const blocked = db
        .prepare('SELECT blocked FROM builds WHERE product_id = ? AND platform = ? AND build_id = ?')
        .get(productId, platform, buildId) as { blocked: number } | undefined;
      if (blocked?.blocked) return fail(reply, 403, 'build_blocked', 'This version is no longer allowed. Update the game.');
    }

    const account = db.prepare('SELECT display_name FROM accounts WHERE user_id = ?').get(user.sub) as {
      display_name: string;
    };
    const issued = store.issue({ userId: user.sub, displayName: account.display_name, productId, deviceId });
    db.prepare(
      'INSERT INTO ticket_audit (ticket_hash, user_id, product_id, device_id, issued_at) VALUES (?, ?, ?, ?, ?)'
    ).run(issued.ticketHash, user.sub, productId, deviceId, new Date(now()).toISOString());
    return { ticket: issued.ticket, expiresAt: issued.expiresAt };
  });

  // ---------- internal: called by Nakama, never exposed publicly ----------
  app.post('/internal/tickets/redeem', async (req, reply) => {
    const header = req.headers.authorization ?? '';
    const key = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!key || !safeEqual(key, cfg.serviceKey)) return fail(reply, 401, 'auth_invalid', 'Service key required.');
    const parsed = z.object({ ticket: z.string().min(20).max(128) }).safeParse(req.body);
    if (!parsed.success) return fail(reply, 400, 'bad_request', 'ticket is required.');

    const payload = store.redeem(parsed.data.ticket);
    if (!payload) return fail(reply, 404, 'ticket_invalid', 'Ticket is invalid, used or expired.');

    db.prepare('UPDATE ticket_audit SET redeemed_at = ? WHERE ticket_hash = ?').run(
      new Date(now()).toISOString(),
      TicketStore.hash(parsed.data.ticket)
    );
    // Re-check at redemption time: a refund or ban between issue and redeem must win.
    const entitled = hasEntitlement(payload.userId, payload.productId);
    const account = db.prepare('SELECT status, email_verified FROM accounts WHERE user_id = ?').get(payload.userId) as
      | { status: string; email_verified: number }
      | undefined;
    if (!entitled || !account || account.status !== 'active') return fail(reply, 403, 'not_entitled', 'Access has been revoked.');
    if (cfg.requireVerifiedEmail && !account.email_verified) return fail(reply, 403, 'email_not_verified', 'Email not confirmed.');
    return { userId: payload.userId, displayName: payload.displayName, productId: payload.productId, entitled: true };
  });

  registerAccountRoutes(app, {
    cfg,
    db,
    mailer: mailer ?? makeMailer(cfg, app.log),
    now,
    requireUser,
  });

  return app;
}
