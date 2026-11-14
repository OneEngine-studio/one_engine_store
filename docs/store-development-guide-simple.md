# OneEngine Store: simple development guide

A short version of `oneengine-store-development-guide.md`. Read that one for the full detail and the decisions still open.

## The idea in one picture

```
Player -> Launcher (Electron) -> Platform API -> asks "does this player own the game?"
                                      |
                                      +--> launch ticket (60 s, one use)
Launcher starts Railbound with the ticket
Railbound -> Nakama (sign in with ticket) -> Nakama asks Platform API to redeem it -> session
```

The game never sees a password. The ticket is useless after one use, so a stolen or old command line is harmless.

## The four pieces

| Piece | Job | State |
|---|---|---|
| Launcher | Account sign-in, store, library, installs, starts the game | **Real**: accounts, library and launch tickets come from the API; builds are downloaded, checked against their SHA-256, unpacked and started from disk |
| Platform API | Accounts, catalog, library, ownership, downloads, launch tickets | **Built**: `services/platform-api` (Docker kit included) |
| Nakama | Game sign-in, matchmaking, friends, chat | Running; ticket hook **written**: `services/nakama-modules/index.js` |
| Game SDK | Reads the ticket, signs in, no login screen in store builds | Receiver written: `unity/LauncherAuthReceiver.cs` |

Later: file hosting for game builds on a CDN, payments.

## What the API does today

| Endpoint | Purpose |
|---|---|
| `GET /v1/catalog`, `GET /v1/catalog/:id` | Browse games and prices |
| `POST /v1/auth/register`, `/login`, `/refresh`, `/logout` | Email + password accounts, rotating refresh tokens |
| `POST /v1/auth/verify-email`, `/forgot-password`, `/reset-password`, `/change-password` | 6-digit email codes and password changes |
| `POST /v1/dev/login` | Test shortcut, off unless `ALLOW_DEV_LOGIN=true`, refused in production |
| `GET /v1/me`, `GET /v1/library` | Profile and owned games |
| `POST /v1/library/:id/claim` | Add a free game (Railbound is free for now); paid games answer "payment required" |
| `POST /v1/products/:id/download-token` | Short-lived download token, owners only |
| `GET /v1/products/:id/builds/latest` | Newest allowed build with size, sha256 and a signed download link, owners only |
| `GET /v1/depot/:id/:platform/:file` | Dev file server for builds (a CDN does this in production) |
| `POST /v1/launch-tickets` | Ticket for starting the game, owners only |
| `POST /internal/tickets/redeem` | Nakama only, needs the service key |

Run it: see `services/platform-api/README.md`.

## Build order

Done: launcher, accounts, library, downloads, install, launch tickets, Railbound receiver, deploy kit.

Still needs you (see `docs/go-live.md` for the exact steps):

1. **Host the API** with a domain, HTTPS and SMTP for the email codes.
2. **Nakama:** load the hook, set `PLATFORM_API_URL` and `PLATFORM_SERVICE_KEY`, change the console password and server key, block direct sign-in.
3. **Publish a Railbound build** with `npm run publish-build`.
4. **Release the launcher** (GitHub Release) built against your API address.
5. **Later:** hosted checkout and webhooks, move builds to a CDN, sign the launcher.

## Rules that must not be skipped

- Change all default secrets (`defaultkey` and friends) before any public build.
- The dev login shortcut and direct Nakama sign-in exist for development only.
- Prices, ownership and tickets are decided on the server, never in the launcher.
- Tokens stay in the launcher's main process, never in the web page.
