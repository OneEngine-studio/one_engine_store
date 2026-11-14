import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { openDb } from '../src/db.js';
import { buildServer } from '../src/server.js';
import { TicketStore, TICKET_TTL_MS } from '../src/tickets.js';

const env = { ALLOW_DEV_LOGIN: 'true', PLATFORM_SERVICE_KEY: 'test-service-key', LOG_LEVEL: 'silent' };

function setup() {
  let clock = 1_800_000_000_000;
  const now = () => clock;
  const depotDir = mkdtempSync(join(tmpdir(), 'oe-depot-'));
  const cfg = loadConfig({ ...env, DEPOT_DIR: depotDir });
  const db = openDb(':memory:');
  const app = buildServer({ cfg, db, tickets: new TicketStore(now), now });
  const advance = (ms: number) => {
    clock += ms;
  };
  return { app, advance, cfg, db, depotDir };
}

async function login(app: ReturnType<typeof setup>['app'], email = 'a@example.com') {
  const res = await app.inject({ method: 'POST', url: '/v1/dev/login', payload: { email, displayName: 'Player One' } });
  expect(res.statusCode).toBe(200);
  return { token: res.json().accessToken as string, userId: res.json().userId as string };
}

const auth = (token: string) => ({ authorization: `Bearer ${token}` });
const device = 'device-1234567890';

describe('catalog', () => {
  it('lists Railbound with a discounted price', async () => {
    const { app } = setup();
    const res = await app.inject({ method: 'GET', url: '/v1/catalog' });
    expect(res.statusCode).toBe(200);
    const item = res.json().items[0];
    expect(item.productId).toBe('railbound');
    expect(item.price).toMatchObject({ amountMinor: 2999, discountPercent: 20, finalMinor: 2399 });
  });

  it('404s for an unknown product', async () => {
    const { app } = setup();
    const res = await app.inject({ method: 'GET', url: '/v1/catalog/nope' });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('not_found');
  });
});

describe('auth', () => {
  it('rejects requests without a token', async () => {
    const { app } = setup();
    const res = await app.inject({ method: 'GET', url: '/v1/me' });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('auth_required');
  });

  it('rejects a garbage token', async () => {
    const { app } = setup();
    const res = await app.inject({ method: 'GET', url: '/v1/me', headers: auth('not-a-jwt') });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('auth_invalid');
  });

  it('returns the profile for a valid token', async () => {
    const { app } = setup();
    const { token } = await login(app);
    const res = await app.inject({ method: 'GET', url: '/v1/me', headers: auth(token) });
    expect(res.json()).toMatchObject({ email: 'a@example.com', displayName: 'Player One' });
  });

  it('refuses to start in production with dev defaults', () => {
    expect(() => loadConfig({ NODE_ENV: 'production', ALLOW_DEV_LOGIN: 'true' })).toThrow(/Unsafe production config/);
  });
});

describe('library and launch tickets', () => {
  it('denies a ticket for a game you do not own', async () => {
    const { app } = setup();
    const { token } = await login(app);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/launch-tickets',
      headers: auth(token),
      payload: { productId: 'railbound', deviceId: device },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('not_entitled');
  });

  it('issues a ticket that Nakama can redeem exactly once', async () => {
    const { app } = setup();
    const { token, userId } = await login(app);
    await app.inject({ method: 'POST', url: '/v1/library/railbound/claim', headers: auth(token) });

    const lib = await app.inject({ method: 'GET', url: '/v1/library', headers: auth(token) });
    expect(lib.json().items.map((i: { productId: string }) => i.productId)).toEqual(['railbound']);

    const issued = await app.inject({
      method: 'POST',
      url: '/v1/launch-tickets',
      headers: auth(token),
      payload: { productId: 'railbound', deviceId: device },
    });
    expect(issued.statusCode).toBe(200);
    const { ticket } = issued.json();

    const redeem = () =>
      app.inject({
        method: 'POST',
        url: '/internal/tickets/redeem',
        headers: auth('test-service-key'),
        payload: { ticket },
      });
    const first = await redeem();
    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({ userId, productId: 'railbound', entitled: true });
    expect((await redeem()).statusCode).toBe(404);
  });

  it('expires tickets after 60 seconds', async () => {
    const { app, advance } = setup();
    const { token } = await login(app);
    await app.inject({ method: 'POST', url: '/v1/library/railbound/claim', headers: auth(token) });
    const { ticket } = (
      await app.inject({
        method: 'POST',
        url: '/v1/launch-tickets',
        headers: auth(token),
        payload: { productId: 'railbound', deviceId: device },
      })
    ).json();
    advance(TICKET_TTL_MS + 1);
    const res = await app.inject({
      method: 'POST',
      url: '/internal/tickets/redeem',
      headers: auth('test-service-key'),
      payload: { ticket },
    });
    expect(res.statusCode).toBe(404);
  });

  it('refuses redemption without the service key', async () => {
    const { app } = setup();
    const noKey = await app.inject({ method: 'POST', url: '/internal/tickets/redeem', payload: { ticket: 'x'.repeat(40) } });
    expect(noKey.statusCode).toBe(401);
    const wrong = await app.inject({
      method: 'POST',
      url: '/internal/tickets/redeem',
      headers: auth('wrong'),
      payload: { ticket: 'x'.repeat(40) },
    });
    expect(wrong.statusCode).toBe(401);
  });

  it('rate limits ticket requests', async () => {
    const { app } = setup();
    const { token } = await login(app);
    await app.inject({ method: 'POST', url: '/v1/library/railbound/claim', headers: auth(token) });
    let last = 200;
    for (let i = 0; i < 12; i++) {
      const r = await app.inject({
        method: 'POST',
        url: '/v1/launch-tickets',
        headers: auth(token),
        payload: { productId: 'railbound', deviceId: device },
      });
      last = r.statusCode;
    }
    expect(last).toBe(429);
  });

  it('gives download tokens only to owners', async () => {
    const { app } = setup();
    const { token } = await login(app);
    const denied = await app.inject({ method: 'POST', url: '/v1/products/railbound/download-token', headers: auth(token) });
    expect(denied.statusCode).toBe(403);
    await app.inject({ method: 'POST', url: '/v1/library/railbound/claim', headers: auth(token) });
    const ok = await app.inject({ method: 'POST', url: '/v1/products/railbound/download-token', headers: auth(token) });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().token.split('.')).toHaveLength(3);
  });
});

describe('builds and depot', () => {
  const content = Buffer.from('0123456789abcdefghij'); // 20 bytes

  function publish(ctx: ReturnType<typeof setup>, buildId: string, blocked = 0) {
    mkdirSync(join(ctx.depotDir, 'railbound', 'win64'), { recursive: true });
    writeFileSync(join(ctx.depotDir, 'railbound', 'win64', `${buildId}.zip`), content);
    ctx.db
      .prepare(
        `INSERT INTO builds (product_id, platform, build_id, manifest_url, total_size, version, sha256, blocked)
         VALUES ('railbound', 'win64', ?, 'x', ?, '2.4.0', 'abc123', ?)`
      )
      .run(buildId, content.length, blocked);
  }

  async function ownerToken(ctx: ReturnType<typeof setup>) {
    const { token } = await login(ctx.app);
    await ctx.app.inject({ method: 'POST', url: '/v1/library/railbound/claim', headers: auth(token) });
    return token;
  }

  const pathOf = (downloadUrl: string) => downloadUrl.replace(/^https?:\/\/[^/]+/, '');

  it('hides builds from players who do not own the game', async () => {
    const ctx = setup();
    publish(ctx, 'b1');
    const { token } = await login(ctx.app);
    const res = await ctx.app.inject({ method: 'GET', url: '/v1/products/railbound/builds/latest', headers: auth(token) });
    expect(res.statusCode).toBe(403);
  });

  it('returns the newest build that is not blocked', async () => {
    const ctx = setup();
    publish(ctx, 'b1');
    publish(ctx, 'b2');
    publish(ctx, 'b3-bad', 1);
    const token = await ownerToken(ctx);
    const res = await ctx.app.inject({ method: 'GET', url: '/v1/products/railbound/builds/latest', headers: auth(token) });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ buildId: 'b2', version: '2.4.0', sizeBytes: 20, sha256: 'abc123' });
  });

  it('404s when nothing is published', async () => {
    const ctx = setup();
    const token = await ownerToken(ctx);
    const res = await ctx.app.inject({ method: 'GET', url: '/v1/products/railbound/builds/latest', headers: auth(token) });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe('no_build');
  });

  it('serves the file through the signed link, with resumable ranges', async () => {
    const ctx = setup();
    publish(ctx, 'b1');
    const token = await ownerToken(ctx);
    const latest = (
      await ctx.app.inject({ method: 'GET', url: '/v1/products/railbound/builds/latest', headers: auth(token) })
    ).json();
    const url = pathOf(latest.downloadUrl);

    const full = await ctx.app.inject({ method: 'GET', url });
    expect(full.statusCode).toBe(200);
    expect(full.rawPayload.equals(content)).toBe(true);

    const part = await ctx.app.inject({ method: 'GET', url, headers: { range: 'bytes=5-9' } });
    expect(part.statusCode).toBe(206);
    expect(part.headers['content-range']).toBe('bytes 5-9/20');
    expect(part.rawPayload.toString()).toBe('56789');

    const tail = await ctx.app.inject({ method: 'GET', url, headers: { range: 'bytes=15-' } });
    expect(tail.rawPayload.toString()).toBe('fghij');

    const beyond = await ctx.app.inject({ method: 'GET', url, headers: { range: 'bytes=99-' } });
    expect(beyond.statusCode).toBe(416);
  });

  it('refuses a missing, forged, expired or wrong-product token', async () => {
    const ctx = setup();
    publish(ctx, 'b1');
    const token = await ownerToken(ctx);
    const latest = (
      await ctx.app.inject({ method: 'GET', url: '/v1/products/railbound/builds/latest', headers: auth(token) })
    ).json();
    const good = pathOf(latest.downloadUrl);
    const base = good.split('?')[0];

    expect((await ctx.app.inject({ method: 'GET', url: base })).statusCode).toBe(403);
    expect((await ctx.app.inject({ method: 'GET', url: `${base}?token=railbound.1.forged` })).statusCode).toBe(403);
    expect((await ctx.app.inject({ method: 'GET', url: base.replace('/railbound/', '/other/') + good.slice(good.indexOf('?')) })).statusCode).toBe(403);

    ctx.advance(11 * 60 * 1000);
    expect((await ctx.app.inject({ method: 'GET', url: good })).statusCode).toBe(403);
  });

  it('stops serving a build once it is blocked', async () => {
    const ctx = setup();
    publish(ctx, 'b1');
    const token = await ownerToken(ctx);
    const latest = (
      await ctx.app.inject({ method: 'GET', url: '/v1/products/railbound/builds/latest', headers: auth(token) })
    ).json();
    ctx.db.prepare("UPDATE builds SET blocked = 1 WHERE build_id = 'b1'").run();
    const res = await ctx.app.inject({ method: 'GET', url: pathOf(latest.downloadUrl) });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('build_blocked');
  });

  it('rejects path tricks in the file name', async () => {
    const ctx = setup();
    const res = await ctx.app.inject({ method: 'GET', url: '/v1/depot/railbound/win64/..%2F..%2Fsecret.zip?token=x' });
    expect([400, 403, 404]).toContain(res.statusCode);
    expect(res.statusCode).not.toBe(200);
  });
});
