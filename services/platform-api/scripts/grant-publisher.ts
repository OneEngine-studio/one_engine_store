// Lets an account publish builds from the launcher, or takes that right away again.
//   npm run grant-publisher -- someone@example.com railbound      (one game)
//   npm run grant-publisher -- someone@example.com '*'            (every game)
//   npm run grant-publisher -- someone@example.com railbound --revoke
//   npm run grant-publisher -- --list
import { loadConfig } from '../src/config.js';
import { openDb } from '../src/db.js';

const args = process.argv.slice(2);
const db = openDb(loadConfig().dbPath);

if (args[0] === '--list') {
  const rows = db
    .prepare('SELECT a.email, p.product_id, p.granted_at FROM publishers p JOIN accounts a ON a.user_id = p.user_id ORDER BY a.email')
    .all() as { email: string; product_id: string; granted_at: string }[];
  if (!rows.length) console.log('No publishers yet.');
  for (const r of rows) console.log(`${r.email}  ${r.product_id}  (since ${r.granted_at})`);
  process.exit(0);
}

const [email, productId] = args;
const revoke = args.includes('--revoke');
if (!email || !productId) {
  console.error('Usage: npm run grant-publisher -- <email> <productId|*> [--revoke]   or   -- --list');
  process.exit(1);
}
const account = db.prepare('SELECT user_id FROM accounts WHERE lower(email) = lower(?)').get(email) as { user_id: string } | undefined;
if (!account) {
  console.error(`No account with the email ${email}. They must sign up in the launcher first.`);
  process.exit(1);
}
if (productId !== '*' && !db.prepare('SELECT 1 FROM products WHERE product_id = ?').get(productId)) {
  console.error(`Unknown product "${productId}".`);
  process.exit(1);
}
if (revoke) {
  const r = db.prepare('DELETE FROM publishers WHERE user_id = ? AND product_id = ?').run(account.user_id, productId);
  console.log(r.changes ? `${email} can no longer publish ${productId}.` : `${email} was not a publisher for ${productId}.`);
} else {
  db.prepare('INSERT OR IGNORE INTO publishers (user_id, product_id) VALUES (?, ?)').run(account.user_id, productId);
  console.log(`${email} can now publish builds for ${productId === '*' ? 'every game' : productId}.`);
}
