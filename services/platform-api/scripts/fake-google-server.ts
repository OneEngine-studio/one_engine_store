// Development only: the real API with a stand-in for Google, so the launcher's whole Google sign-in path can be
// exercised without a Google Cloud project. The "authorization code" is read as the email's local part:
//   code "alice-code-xxxx" signs in alice@gmail.com.
// It refuses to start when NODE_ENV=production.
import { loadConfig } from '../src/config.js';
import { openDb } from '../src/db.js';
import { buildServer } from '../src/server.js';

if (process.env.NODE_ENV === 'production') throw new Error('The fake Google server is for development only.');

const cfg = loadConfig({
  ...process.env,
  GOOGLE_CLIENT_ID: 'fake-client.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'fake-secret',
});
const db = openDb(cfg.dbPath);
const app = buildServer({
  cfg,
  db,
  googleExchange: async ({ code }) => {
    const local = code.split('-')[0] ?? 'player';
    return { subject: `fake-${local}`, email: `${local}@gmail.com`, emailVerified: true, name: `${local[0]?.toUpperCase()}${local.slice(1)} Tester` };
  },
});
await app.listen({ port: cfg.port, host: '127.0.0.1' });
console.log(`fake-google API on ${cfg.port}`);
