// Writes electron/app-config.json for the installer from the build environment.
//
//   PLATFORM_API_URL   public https:// address of the Platform API (required for a release build)
//   ENABLE_GAMES       "true" to ship game download, install and launch (off by default)
//   ALLOW_LOCAL_BUILD  "1" to build a test installer that points at localhost (never publish it)
//
// A release build refuses a missing, non-https or localhost address, so an installer that nobody
// outside this PC could sign in with is never produced by accident.
const fs = require('fs');
const path = require('path');
const { cleanUrl } = require('../electron/url-policy.cjs');

const allowLocal = process.env.ALLOW_LOCAL_BUILD === '1';
const raw = process.env.PLATFORM_API_URL || process.env.VITE_PLATFORM_API_URL || (allowLocal ? 'http://127.0.0.1:8080' : '');
const url = cleanUrl(raw, { allowLocal });

if (!url) {
  console.error(
    'PLATFORM_API_URL must be the public https:// address of the Platform API (not localhost).\n' +
      'Example: PLATFORM_API_URL=https://api.example.com npm run dist\n' +
      'For a private test installer only, set ALLOW_LOCAL_BUILD=1.'
  );
  process.exit(1);
}

const config = { platformApiUrl: url, gamesEnabled: process.env.ENABLE_GAMES === 'true', allowLocal };
fs.writeFileSync(path.join(__dirname, '..', 'electron', 'app-config.json'), JSON.stringify(config, null, 2) + '\n');
console.log(`app-config.json written: ${url}${config.gamesEnabled ? ' (games enabled)' : ''}${allowLocal ? ' (LOCAL TEST BUILD, do not publish)' : ''}`);
