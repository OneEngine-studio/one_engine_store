// Build publishing for approved accounts. A publisher uploads a zip from the launcher; the server checks it,
// makes it the latest build and removes the older ones, so nobody needs SSH or the server key.
//
// Who may publish is a server-side grant (scripts/grant-publisher.ts), per product or for every product ('*').
// Every publish and every removed build is written to build_audit.
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream, mkdirSync, renameSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import type { DatabaseSync } from 'node:sqlite';
import type { Config } from './config.js';
import { zipEntryNames, zipHasExecutable } from './zip.js';

type Hook = (req: FastifyRequest, reply: FastifyReply) => Promise<unknown>;

const VERSION = /^[A-Za-z0-9._-]{1,64}$/;
const PLATFORM = /^[A-Za-z0-9._-]{1,32}$/;
const EXECUTABLE = /^[A-Za-z0-9._ -]{1,64}\.exe$/i;
const DEBUG_FOLDERS = /DoNotShip|BurstDebugInformation/i;

const fail = (reply: FastifyReply, status: number, code: string, message: string) =>
  reply.code(status).send({ error: { code, message } });

export function canPublish(db: DatabaseSync, userId: string, productId: string): boolean {
  return !!db
    .prepare("SELECT 1 FROM publishers WHERE user_id = ? AND (product_id = ? OR product_id = '*')")
    .get(userId, productId);
}

interface Deps {
  cfg: Config;
  db: DatabaseSync;
  requireUser: Hook;
  requireVerified: Hook;
  /** Largest zip accepted, in bytes. */
  maxBytes?: number;
}

export function registerPublisherRoutes(app: FastifyInstance, { cfg, db, requireUser, requireVerified, maxBytes = 8 * 1024 ** 3 }: Deps) {
  const audit = db.prepare(
    `INSERT INTO build_audit (user_id, product_id, platform, build_id, version, size, sha256, action)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // Which products this account may publish, with the build players get today.
  app.get('/v1/publisher/products', { preHandler: [requireUser, requireVerified] }, async (req) => {
    const userId = req.user!.sub;
    const rows = db
      .prepare(
        `SELECT p.product_id, p.title FROM products p
         WHERE EXISTS (SELECT 1 FROM publishers g WHERE g.user_id = ? AND (g.product_id = p.product_id OR g.product_id = '*'))
         ORDER BY p.title`
      )
      .all(userId) as { product_id: string; title: string }[];
    const latest = db.prepare(
      `SELECT build_id, version, total_size, created_at FROM builds
       WHERE product_id = ? AND platform = 'win64' AND blocked = 0 ORDER BY rowid DESC LIMIT 1`
    );
    return {
      items: rows.map((r) => {
        const b = latest.get(r.product_id) as { build_id: string; version: string; total_size: number; created_at: string } | undefined;
        return {
          productId: r.product_id,
          title: r.title,
          current: b ? { buildId: b.build_id, version: b.version, sizeBytes: b.total_size, publishedAt: b.created_at } : null,
        };
      }),
    };
  });

  app.register(async (scope) => {
    // The zip is streamed straight to disk: never parsed or held in memory.
    scope.addContentTypeParser(['application/zip', 'application/octet-stream'], (_req, payload, done) => done(null, payload));

    scope.post(
      '/v1/publisher/products/:productId/builds',
      // Checked from headers alone, before a single byte of the upload is read.
      { onRequest: [requireUser, requireVerified] },
      async (req, reply) => {
        const { productId } = req.params as { productId: string };
        const q = req.query as Record<string, string | undefined>;
        const version = q.version ?? '';
        const platform = q.platform ?? 'win64';
        const executable = q.executable ?? '';
        const userId = req.user!.sub;

        if (!db.prepare('SELECT 1 FROM products WHERE product_id = ?').get(productId)) {
          return fail(reply, 404, 'unknown_product', 'There is no such game.');
        }
        if (!canPublish(db, userId, productId)) return fail(reply, 403, 'not_publisher', 'You are not allowed to publish builds for this game.');
        if (!VERSION.test(version)) return fail(reply, 400, 'bad_version', 'Version may only use letters, digits, dot, dash and underscore.');
        if (!PLATFORM.test(platform)) return fail(reply, 400, 'bad_platform', 'Invalid platform.');
        if (!EXECUTABLE.test(executable)) return fail(reply, 400, 'bad_executable', 'Name the game .exe, for example Railbound.exe.');
        if (db.prepare('SELECT 1 FROM builds WHERE product_id = ? AND platform = ? AND version = ?').get(productId, platform, version)) {
          return fail(reply, 409, 'version_exists', `Version ${version} is already published. Use a new version number.`);
        }
        const declared = Number(req.headers['content-length'] ?? 0);
        if (declared > maxBytes) return fail(reply, 413, 'too_large', 'The zip is larger than the server accepts.');

        const incoming = join(cfg.depotDir, '.incoming');
        mkdirSync(incoming, { recursive: true });
        const temp = join(incoming, `${randomUUID()}.zip`);
        const hash = createHash('sha256');
        let size = 0;
        const meter = new Transform({
          transform(chunk: Buffer, _enc, cb) {
            size += chunk.length;
            if (size > maxBytes) return cb(new Error('too_large'));
            hash.update(chunk);
            cb(null, chunk);
          },
        });

        try {
          await pipeline(req.body as Readable, meter, createWriteStream(temp));
        } catch (err) {
          rmSync(temp, { force: true });
          if ((err as Error).message === 'too_large') return fail(reply, 413, 'too_large', 'The zip is larger than the server accepts.');
          return fail(reply, 400, 'upload_failed', 'The upload did not finish. Try again.');
        }
        if (size === 0) {
          rmSync(temp, { force: true });
          return fail(reply, 400, 'empty', 'The upload was empty.');
        }

        // The same checks as the command-line publisher: a build the launcher can actually start, nothing that must not ship.
        let names: string[];
        try {
          names = zipEntryNames(temp);
        } catch {
          rmSync(temp, { force: true });
          return fail(reply, 422, 'not_a_zip', 'That file is not a readable zip.');
        }
        if (names.some((n) => n.includes('..') || n.startsWith('/') || /^[A-Za-z]:/.test(n))) {
          rmSync(temp, { force: true });
          return fail(reply, 422, 'unsafe_paths', 'The zip contains file paths that point outside the game folder.');
        }
        if (!zipHasExecutable(names, executable)) {
          rmSync(temp, { force: true });
          return fail(reply, 422, 'missing_executable', `${executable} is not in the zip (top level or inside one folder).`);
        }
        if (names.some((n) => DEBUG_FOLDERS.test(n))) {
          rmSync(temp, { force: true });
          return fail(reply, 422, 'debug_files', 'The zip still contains Unity DoNotShip debug folders. Remove them and upload again.');
        }

        const sha256 = hash.digest('hex');
        const buildId = `${version}-${sha256.slice(0, 8)}`;
        const dir = join(cfg.depotDir, productId, platform);
        mkdirSync(dir, { recursive: true });
        renameSync(temp, join(dir, `${buildId}.zip`));

        const older = db
          .prepare('SELECT build_id, version, total_size, sha256 FROM builds WHERE product_id = ? AND platform = ?')
          .all(productId, platform) as { build_id: string; version: string; total_size: number; sha256: string }[];

        db.prepare(
          `INSERT INTO builds (product_id, platform, build_id, manifest_url, total_size, version, sha256, executable)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(productId, platform, buildId, `${productId}/${platform}/${buildId}.zip`, size, version, sha256, executable);
        audit.run(userId, productId, platform, buildId, version, size, sha256, 'published');

        // Only the newest build is kept: the server disk is small and players always get the latest.
        const removed: string[] = [];
        for (const old of older) {
          db.prepare('DELETE FROM builds WHERE product_id = ? AND platform = ? AND build_id = ?').run(productId, platform, old.build_id);
          const file = join(dir, `${old.build_id}.zip`);
          if (existsSync(file)) rmSync(file, { force: true });
          audit.run(userId, productId, platform, old.build_id, old.version, old.total_size, old.sha256, 'removed');
          removed.push(old.version);
        }

        req.log.info({ productId, platform, buildId, size, userId }, 'build published');
        return reply.code(201).send({ productId, platform, buildId, version, sizeBytes: size, sha256, executable, removed });
      }
    );
  });
}
