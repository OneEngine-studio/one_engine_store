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
| Launcher | Store UI, library, downloads, starts the game | **Connected**: sign-in, library, prices and launch tickets come from the API. Downloads are still simulated |
| Platform API | Catalog, library, ownership, download tokens, launch tickets | **Built (dev version)**: `services/platform-api` |
| Nakama | Game sign-in, matchmaking, friends, chat | Running; ticket hook **written**: `services/nakama-modules/index.js` |
| Game SDK | Reads the ticket, signs in, no login screen in store builds | Not started (lives in the Railbound repo) |

Later: sign-in page (OneEngine ID), file hosting for game builds (CDN), payments.

## What the API does today

| Endpoint | Purpose |
|---|---|
| `GET /v1/catalog`, `GET /v1/catalog/:id` | Browse games and prices |
| `POST /v1/dev/login` | Development sign-in (off unless `ALLOW_DEV_LOGIN=true`) |
| `GET /v1/me`, `GET /v1/library` | Profile and owned games |
| `POST /v1/library/:id/claim` | Add a free game (any game, in dev mode) |
| `POST /v1/products/:id/download-token` | Short-lived download token, owners only |
| `GET /v1/products/:id/builds/latest` | Newest allowed build with size, sha256 and a signed download link, owners only |
| `GET /v1/depot/:id/:platform/:file` | Dev file server for builds (a CDN does this in production) |
| `POST /v1/launch-tickets` | Ticket for starting the game, owners only |
| `POST /internal/tickets/redeem` | Nakama only, needs the service key |

Run it: see `services/platform-api/README.md`.

## Build order

1. **Now:** run the API, then connect the launcher's library and launch button to it.
2. **Game:** add ticket sign-in to Railbound (`--oe-ticket=...`), hide guest and email login in store builds.
3. **Nakama:** load the hook, set the three environment values, block direct sign-in outside dev.
4. **Downloads:** the API side is built (publish script, latest build, signed link). Next: the launcher downloads, checks the sha256 and unpacks; later move builds to a CDN.
5. **Accounts:** replace dev login with a real sign-in service (email check, password reset).
6. **Money:** hosted checkout and webhooks.
7. **Before public:** change every default secret, sign the launcher, security review.

## Rules that must not be skipped

- Change all default secrets (`defaultkey` and friends) before any public build.
- Dev login and direct Nakama sign-in exist for development only.
- Prices, ownership and tickets are decided on the server, never in the launcher.
- Tokens stay in the launcher's main process, never in the web page.
