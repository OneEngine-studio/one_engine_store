# OneEngine Store

Desktop game store and launcher for OneEngine games (Electron + React + Vite + Tailwind), with its own Platform API
(`services/platform-api`).

## Features

- Accounts: email sign-up with confirmation, sign-in, password reset, "Continue with Google", add a password to a
  Google account.
- Store: spotlight banner, category cards, a focus carousel of new games, game pages with key art and a price card.
- Library, Downloads and Activity: install with checksum verification, resumable downloads, bandwidth limit,
  play-time calendar.
- Coins: buy coin bundles through Stripe Checkout via the payments service (see `docs/payments.md`).
- Keyboard: `Ctrl+K` or `/` to search, `Esc` to go back or close, arrow keys in carousels.

## Run it

```bash
npm install
npm run electron:dev
```

The dev app reads its service address from `electron/app-config.json` (not committed) or `ONEENGINE_API_URL`.

## Checks

```bash
npx tsc --noEmit
npm test
npm run build
```

## Docs

| Topic | File |
| --- | --- |
| Visual design and motion rules | `DESIGN.md` |
| Hosting the Platform API on AWS | `docs/aws-deploy.md`, `docs/go-live.md` |
| Google sign-in | `docs/google-login.md` |
| Releasing the installer | `docs/releasing.md` |
| Publishing a game build | `docs/publishing-builds.md` |
| Coin purchases (Stripe) | `docs/payments.md` |
