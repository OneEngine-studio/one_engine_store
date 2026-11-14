# OneEngine Platform API

The server behind OneEngine Store: player accounts, the game catalog, ownership, game downloads and the
one-time launch tickets that let a game sign in to Nakama.

Node 22.5+ (uses the built-in `node:sqlite`), Fastify, TypeScript.

```bash
npm install
npm test            # accounts, catalog, library, tickets, rate limits, builds, depot
npm run dev         # http://127.0.0.1:8080
```

## How a player gets from the launcher into the game

1. The player creates an account in the launcher (email + password). The server stores only a scrypt hash,
   emails a 6-digit code to confirm the address, and returns a short-lived access token plus a rotating
   refresh token. The launcher keeps the refresh token encrypted with the operating system's key store.
2. The player adds a game to their library (`POST /v1/library/:id/claim`). Railbound is free for now; a paid
   game answers "payment required" until checkout exists. Ownership is always checked on the server.
3. Install: the launcher asks for `GET /v1/products/:id/builds/latest`, gets a 10-minute signed link, downloads
   the zip with byte-range resume, checks its SHA-256 against the one the server published, and unpacks it.
4. Play: `POST /v1/launch-tickets` returns a single-use ticket valid for 60 seconds. The launcher starts the
   game with it; the game calls Nakama's custom authentication with the ticket; the Nakama hook
   (`services/nakama-modules/index.js`) redeems it at `/internal/tickets/redeem` and signs the player in as
   `oe:<userId>`. No password or session token is ever put on a command line.

## Account rules

- Passwords: at least 8 characters, hashed with scrypt (cost 2^16). Production refuses a lower cost.
- Email codes: 6 digits, hashed at rest, valid 15 minutes, 5 attempts.
- Refresh tokens rotate on every use; reusing an old one signs that device out of the whole family.
  Changing or resetting a password signs out every other device.
- Rate limits per address and per account on sign-up, sign-in, code entry and email sending.
- With `REQUIRE_EMAIL_VERIFICATION=true` (the production default) an unconfirmed email cannot get a game,
  download it or start it.

## Publishing a build

```bash
npm run publish-build -- railbound 1.0.0 /path/to/railbound.zip Railbound.exe
```

`Railbound.exe` is the file inside the zip (at the top level) that the launcher starts. The command copies the
zip into `DEPOT_DIR`, records its size and SHA-256, and makes it the newest build. Players who already have
the game see an **Update** button. Set `PUBLIC_BASE_URL` when the API sits behind a proxy so download links
use the public address. In a larger setup a CDN can check the same signed token and serve the same path.

## Running it for real

```bash
cp .env.production.example .env.production      # fill every value (generate secrets with: openssl rand -hex 32)
docker compose --env-file .env.production up -d --build
```

That starts the API plus Caddy, which gets an HTTPS certificate for `API_DOMAIN` automatically. Point a DNS
record for that name at the server first. Data (accounts, builds) lives in the `oneengine-data` volume: back
it up. With `NODE_ENV=production` the server refuses to start unless the secrets are random 32+ character
values, `SMTP_URL` is set while email verification is on, and `ALLOW_DEV_LOGIN` is off.

Check it from anywhere: `https://<API_DOMAIN>/healthz` should answer `{"ok":true}`.

## Nakama

Give the Nakama server `PLATFORM_API_URL` (this API's public address) and `PLATFORM_SERVICE_KEY` (the same
value as here) and load `services/nakama-modules/index.js`. Set `ALLOW_DIRECT_AUTH` only for local testing;
without it players cannot skip the launcher and sign in to Nakama directly. Change the Nakama console
password and the default server key (`defaultkey`) at the same time.

## Not built yet

Postgres and Redis (SQLite and in-memory tickets stand in, which means one API instance), payments,
reviews, admin portal. The table layout follows the full guide.
