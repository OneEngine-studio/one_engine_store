// Development publisher: copies a game build (.zip) into the local depot and registers it.
//   npm run publish-build -- railbound 2.4.0 C:\builds\railbound.zip [win64]
import { createHash } from 'node:crypto';
import { copyFileSync, createReadStream, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../src/config.js';
import { openDb } from '../src/db.js';

const [productId, version, zipPath, platform = 'win64'] = process.argv.slice(2);
if (!productId || !version || !zipPath) {
  console.error('Usage: npm run publish-build -- <productId> <version> <path-to.zip> [platform]');
  process.exit(1);
}
if (!/^[A-Za-z0-9._-]{1,64}$/.test(version) || !/^[A-Za-z0-9._-]{1,32}$/.test(platform)) {
  console.error('version and platform may only contain letters, digits, dot, dash and underscore.');
  process.exit(1);
}

const cfg = loadConfig();
const db = openDb(cfg.dbPath);
if (!db.prepare('SELECT 1 FROM products WHERE product_id = ?').get(productId)) {
  console.error(`Unknown product "${productId}".`);
  process.exit(1);
}

const sha256 = await new Promise<string>((resolve, reject) => {
  const hash = createHash('sha256');
  createReadStream(zipPath)
    .on('data', (chunk) => hash.update(chunk))
    .on('end', () => resolve(hash.digest('hex')))
    .on('error', reject);
});
const size = statSync(zipPath).size;
const buildId = `${version}-${sha256.slice(0, 8)}`;

const dir = join(cfg.depotDir, productId, platform);
mkdirSync(dir, { recursive: true });
copyFileSync(zipPath, join(dir, `${buildId}.zip`));

db.prepare(
  `INSERT OR REPLACE INTO builds (product_id, platform, build_id, manifest_url, total_size, version, sha256)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
).run(productId, platform, buildId, `${productId}/${platform}/${buildId}.zip`, size, version, sha256);

console.log(`Published ${productId} ${version} (${platform}) as build ${buildId}: ${size} bytes, sha256 ${sha256}`);
