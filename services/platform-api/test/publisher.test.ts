import { existsSync, mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { openDb } from '../src/db.js';
import { buildServer } from '../src/server.js';
import { TicketStore } from '../src/tickets.js';

const env = { ALLOW_DEV_LOGIN: 'true', PLATFORM_SERVICE_KEY: 'test-service-key', LOG_LEVEL: 'silent' };

function setup() {
  const depotDir = mkdtempSync(join(tmpdir(), 'oe-pub-'));
  const cfg = loadConfig({ ...env, DEPOT_DIR: depotDir });
  const db = openDb(':memory:');
  const app = buildServer({ cfg, db, tickets: new TicketStore() });
  return { app, db, depotDir };
}

async function login(app: ReturnType<typeof setup>['app'], email: string) {
  const res = await app.inject({ method: 'POST', url: '/v1/dev/login', payload: { email, displayName: 'Dev' } });
  return { token: res.json().accessToken as string, userId: res.json().userId as string };
}

/** A minimal stored zip: local headers, central directory, end record. */
function zip(files: Record<string, string>): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const n = Buffer.from(name);
    const d = Buffer.from(text);
    const l = Buffer.alloc(30);
    l.writeUInt32LE(0x04034b50, 0);
    l.writeUInt32LE(d.length, 18);
    l.writeUInt32LE(d.length, 22);
    l.writeUInt16LE(n.length, 26);
    locals.push(l, n, d);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0);
    c.writeUInt32LE(d.length, 20);
    c.writeUInt32LE(d.length, 24);
    c.writeUInt16LE(n.length, 28);
    c.writeUInt32LE(offset, 42);
    centrals.push(c, n);
    offset += 30 + n.length + d.length;
  }
  const dir = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(dir.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, dir, end]);
}

const upload = (app: ReturnType<typeof setup>['app'], token: string, body: Buffer, version: string, executable = 'Railbound.exe') =>
  app.inject({
    method: 'POST',
    url: `/v1/publisher/products/railbound/builds?version=${encodeURIComponent(version)}&executable=${encodeURIComponent(executable)}&platform=win64`,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/zip' },
    payload: body,
  });

const good = () => zip({ 'Railbound/Railbound.exe': 'MZ', 'Railbound/Railbound_Data/level0': 'data' });

describe('publisher uploads', () => {
  it('refuses accounts that are not publishers', async () => {
    const { app } = setup();
    const { token } = await login(app, 'player@example.com');
    const res = await upload(app, token, good(), '1.0.0');
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('not_publisher');
  });

  it('refuses requests without a sign-in', async () => {
    const { app } = setup();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/publisher/products/railbound/builds?version=1.0.0&executable=Railbound.exe',
      headers: { 'content-type': 'application/zip' },
      payload: good(),
    });
    expect(res.statusCode).toBe(401);
  });

  it('publishes a build, then replaces it and deletes the old file', async () => {
    const { app, db, depotDir } = setup();
    const { token, userId } = await login(app, 'dev@example.com');
    db.prepare('INSERT INTO publishers (user_id, product_id) VALUES (?, ?)').run(userId, 'railbound');

    const first = await upload(app, token, good(), '1.0.0');
    expect(first.statusCode).toBe(201);
    expect(first.json().removed).toEqual([]);
    const firstId = first.json().buildId as string;
    expect(existsSync(join(depotDir, 'railbound', 'win64', `${firstId}.zip`))).toBe(true);

    const second = await upload(app, token, zip({ 'Railbound.exe': 'MZ2', 'Railbound_Data/x': 'y' }), '1.0.1');
    expect(second.statusCode).toBe(201);
    expect(second.json().removed).toEqual(['1.0.0']);
    expect(readdirSync(join(depotDir, 'railbound', 'win64'))).toEqual([`${second.json().buildId}.zip`]);

    const rows = db.prepare('SELECT version FROM builds WHERE product_id = ?').all('railbound') as { version: string }[];
    expect(rows.map((r) => r.version)).toEqual(['1.0.1']);
    const log = db.prepare('SELECT action, version FROM build_audit ORDER BY id').all() as { action: string; version: string }[];
    expect(log).toEqual([
      { action: 'published', version: '1.0.0' },
      { action: 'published', version: '1.0.1' },
      { action: 'removed', version: '1.0.0' },
    ]);

    const list = await app.inject({ method: 'GET', url: '/v1/publisher/products', headers: { authorization: `Bearer ${token}` } });
    expect(list.json().items[0].current.version).toBe('1.0.1');
  });

  it('refuses a version that is already published', async () => {
    const { app, db } = setup();
    const { token, userId } = await login(app, 'dev@example.com');
    db.prepare("INSERT INTO publishers (user_id, product_id) VALUES (?, '*')").run(userId);
    expect((await upload(app, token, good(), '2.0.0')).statusCode).toBe(201);
    const again = await upload(app, token, good(), '2.0.0');
    expect(again.statusCode).toBe(409);
  });

  it('refuses zips without the executable, with debug folders, unsafe paths, or that are not zips', async () => {
    const { app, db, depotDir } = setup();
    const { token, userId } = await login(app, 'dev@example.com');
    db.prepare('INSERT INTO publishers (user_id, product_id) VALUES (?, ?)').run(userId, 'railbound');

    expect((await upload(app, token, zip({ 'Other.exe': 'MZ' }), '1.0.0')).json().error.code).toBe('missing_executable');
    expect(
      (await upload(app, token, zip({ 'Railbound.exe': 'MZ', 'Railbound_BurstDebugInformation_DoNotShip/a': 'x' }), '1.0.0')).json().error.code
    ).toBe('debug_files');
    expect((await upload(app, token, zip({ 'Railbound.exe': 'MZ', '../evil.dll': 'x' }), '1.0.0')).json().error.code).toBe('unsafe_paths');
    expect((await upload(app, token, Buffer.from('not a zip at all'), '1.0.0')).json().error.code).toBe('not_a_zip');
    expect((await upload(app, token, good(), 'bad version!')).json().error.code).toBe('bad_version');

    // Nothing was published and no temporary file was left behind.
    expect(db.prepare('SELECT COUNT(*) AS n FROM builds').get()).toEqual({ n: 0 });
    const incoming = join(depotDir, '.incoming');
    expect(existsSync(incoming) ? readdirSync(incoming) : []).toEqual([]);
  });

  it('lists nothing for accounts that may not publish', async () => {
    const { app } = setup();
    const { token } = await login(app, 'player@example.com');
    const res = await app.inject({ method: 'GET', url: '/v1/publisher/products', headers: { authorization: `Bearer ${token}` } });
    expect(res.json().items).toEqual([]);
  });
});
