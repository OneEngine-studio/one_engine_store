import { loadConfig } from './config.js';
import { openDb } from './db.js';
import { buildServer } from './server.js';

const cfg = loadConfig();
const app = buildServer({ cfg, db: openDb(cfg.dbPath) });

app
  .listen({ port: cfg.port, host: cfg.production ? '0.0.0.0' : '127.0.0.1' })
  .then(() => {
    if (cfg.allowDevLogin) app.log.warn('ALLOW_DEV_LOGIN is on: development sign-in is enabled. Never use this in production.');
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
