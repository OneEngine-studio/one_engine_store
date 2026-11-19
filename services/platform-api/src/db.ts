import type { DatabaseSync as DatabaseSyncType } from 'node:sqlite';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// Loaded with require so bundlers (vitest) don't try to resolve the "node:sqlite" built-in.
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
type DatabaseSync = DatabaseSyncType;

/**
 * Local development store (SQLite via node:sqlite). The tables follow the Postgres model in the
 * development guide so the queries move over without redesign.
 */
export function openDb(path: string): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      user_id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      display_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS products (
      product_id TEXT PRIMARY KEY,
      kind TEXT NOT NULL DEFAULT 'game',
      parent_product_id TEXT REFERENCES products(product_id),
      title TEXT NOT NULL,
      summary TEXT,
      developer TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      visibility TEXT NOT NULL DEFAULT 'hidden'
    );
    CREATE TABLE IF NOT EXISTS prices (
      product_id TEXT NOT NULL REFERENCES products(product_id),
      currency TEXT NOT NULL,
      amount_minor INTEGER NOT NULL,
      discount_percent INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (product_id, currency)
    );
    CREATE TABLE IF NOT EXISTS builds (
      product_id TEXT NOT NULL REFERENCES products(product_id),
      platform TEXT NOT NULL,
      build_id TEXT NOT NULL,
      manifest_url TEXT NOT NULL,
      total_size INTEGER NOT NULL,
      blocked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (product_id, platform, build_id)
    );
    CREATE TABLE IF NOT EXISTS entitlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES accounts(user_id),
      product_id TEXT NOT NULL REFERENCES products(product_id),
      source TEXT NOT NULL,
      granted_at TEXT NOT NULL DEFAULT (datetime('now')),
      revoked_at TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS entitlements_active
      ON entitlements (user_id, product_id) WHERE revoked_at IS NULL;
    CREATE TABLE IF NOT EXISTS credentials (
      user_id TEXT PRIMARY KEY REFERENCES accounts(user_id),
      password_hash TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS identities (
      provider TEXT NOT NULL,
      subject TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES accounts(user_id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (provider, subject)
    );
    CREATE INDEX IF NOT EXISTS identities_user ON identities (user_id);
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES accounts(user_id),
      family_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      revoked_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS refresh_tokens_user ON refresh_tokens (user_id);
    CREATE TABLE IF NOT EXISTS email_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES accounts(user_id),
      kind TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      used_at INTEGER
    );
    -- Accounts allowed to publish builds: one row per product, or product_id '*' for every product.
    CREATE TABLE IF NOT EXISTS publishers (
      user_id TEXT NOT NULL REFERENCES accounts(user_id),
      product_id TEXT NOT NULL,
      granted_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, product_id)
    );
    -- Every published or removed build, with who did it.
    CREATE TABLE IF NOT EXISTS build_audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      platform TEXT NOT NULL,
      build_id TEXT NOT NULL,
      version TEXT NOT NULL,
      size INTEGER NOT NULL,
      sha256 TEXT NOT NULL,
      action TEXT NOT NULL,
      at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS ticket_audit (
      ticket_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      issued_at TEXT NOT NULL,
      redeemed_at TEXT
    );
  `);
  migrate(db);
  seed(db);
  return db;
}

/** Adds columns introduced after a database file was first created. */
function migrate(db: DatabaseSync) {
  const cols = (db.prepare('PRAGMA table_info(builds)').all() as { name: string }[]).map((c) => c.name);
  if (!cols.includes('version')) db.exec("ALTER TABLE builds ADD COLUMN version TEXT NOT NULL DEFAULT ''");
  if (!cols.includes('sha256')) db.exec("ALTER TABLE builds ADD COLUMN sha256 TEXT NOT NULL DEFAULT ''");
  if (!cols.includes('executable')) db.exec("ALTER TABLE builds ADD COLUMN executable TEXT NOT NULL DEFAULT ''");
}

function seed(db: DatabaseSync) {
  const has = db.prepare('SELECT 1 FROM products WHERE product_id = ?').get('railbound');
  if (has) return;
  db.prepare(
    `INSERT INTO products (product_id, kind, title, summary, developer, tags, visibility)
     VALUES (?, 'game', ?, ?, ?, ?, 'public')`
  ).run(
    'railbound',
    'Railbound: Tactical Protocol',
    'High-speed tactical railway logistics & automated rail defense systems.',
    'OneEngine Studio',
    JSON.stringify(['Tactical', 'Automation'])
  );
  db.prepare('INSERT INTO prices (product_id, currency, amount_minor, discount_percent) VALUES (?, ?, ?, ?)').run(
    'railbound',
    'USD',
    0,
    0
  );
}
