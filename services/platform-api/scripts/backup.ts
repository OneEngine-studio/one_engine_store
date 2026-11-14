// Writes a consistent copy of the database while the API keeps running.
//   npx tsx scripts/backup.ts [destination-folder]      (default: <db folder>/backups)
// Keeps the 14 newest copies. The depot folder (published game builds) is plain files: copy it separately.
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';

const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');

const KEEP = 14;
const dbPath = resolve(process.env.DB_PATH ?? './data/platform.db');
const dest = resolve(process.argv[2] ?? join(dirname(dbPath), 'backups'));
mkdirSync(dest, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const file = join(dest, `platform-${stamp}.db`);

const db = new DatabaseSync(dbPath);
db.exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`);
db.close();

// A copy that cannot be opened is not a backup: check it before trusting it.
const copy = new DatabaseSync(file, { readOnly: true });
const check = copy.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
const accounts = (copy.prepare('SELECT COUNT(*) AS n FROM accounts').get() as { n: number }).n;
copy.close();
if (check.integrity_check !== 'ok') {
  rmSync(file, { force: true });
  console.error(`Backup failed its integrity check: ${check.integrity_check}`);
  process.exit(1);
}

const old = readdirSync(dest)
  .filter((n) => /^platform-.*\.db$/.test(n))
  .map((n) => ({ n, t: statSync(join(dest, n)).mtimeMs }))
  .sort((a, b) => b.t - a.t)
  .slice(KEEP);
for (const o of old) rmSync(join(dest, o.n), { force: true });

console.log(`Backup written: ${file} (${accounts} accounts, ${Math.round(statSync(file).size / 1024)} KB)`);
