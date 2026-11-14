# Going live: what only you can do

The launcher, accounts and the catalog are built and tested, and so are game downloads, installs and launch tickets,
which the first public launcher release keeps switched off (see `docs/releasing.md`). Nothing below has been done for
you: the API is not hosted anywhere yet. A player can only use the launcher once these things exist. Do them in this order.

## 1. Host the Platform API

You need a small server (any VPS with Docker) and a domain name, for example `api.yourdomain.com`.

1. Point a DNS record for that name at the server.
2. Copy `services/platform-api` to the server.
3. Create the settings file and fill every value:
   ```bash
   cp .env.production.example .env.production
   openssl rand -hex 32      # run three times: JWT_SECRET, PLATFORM_SERVICE_KEY, PLATFORM_DOWNLOAD_KEY
   ```
4. **Email.** Verification and password-reset codes are sent by SMTP, so you need a mail account for the
   sender: your domain's mailbox, Brevo, Mailgun, Amazon SES and so on. Put its address in `SMTP_URL`, for example
   `smtps://user:password@smtp.example.com:465` (URL-encode special characters in the password), and set
   `MAIL_FROM`. Add the provider's SPF/DKIM records to your domain or the codes will land in spam.
5. Start it:
   ```bash
   docker compose --env-file .env.production up -d --build
   ```
6. Check `https://api.yourdomain.com/healthz` in a browser. It must show `{"ok":true}`.

Passwords are stored as Argon2id hashes (older scrypt hashes are upgraded when that player next signs in). Verification
codes are only ever sent by email; they are never returned by the API or written to the production log.

**Backups.** The volume `oneengine-data` holds every account and every published build. Take a consistent copy of the
database while the API runs, daily, and copy it off the server:

```bash
docker compose exec api npx tsx scripts/backup.ts /data/backups
```

It writes `platform-<time>.db`, checks the copy opens cleanly and keeps the 14 newest. Restore by stopping the API,
replacing `/data/platform.db` with a copy (and deleting `platform.db-wal` and `-shm`), then starting it. Published
builds live in `/data/depot` as plain files: back those up too.

## 2. Connect Nakama

On the Nakama server that Railbound uses (`restapinakama.kushanherath.me`):

1. Set these environment values for Nakama:
   - `PLATFORM_API_URL` = `https://api.yourdomain.com`
   - `PLATFORM_SERVICE_KEY` = the same value as in `.env.production`
2. Load `services/nakama-modules/index.js` as a runtime module, then restart Nakama. Its log must say
   `OneEngine ticket sign-in loaded (direct auth blocked)`.
3. Change the console password if it is still the Nakama default, and change the default socket server key
   `defaultkey`. Put the new key in the Unity receiver's server key setting.

Until step 2 is done, anyone can still sign in to Nakama directly and skip the store.

## 3. Publish Railbound

Zip the Windows build with the game `.exe` at the top level of the zip, then on the server:

```bash
docker compose exec api npx tsx scripts/publish-build.ts railbound 1.0.0 /data/railbound.zip Railbound.exe
```

(copy the zip into the container's `/data` first, for example with `docker compose cp railbound.zip api:/data/`).

Each new version is the same command with a higher version number. Players who already installed the game
see an **Update** button and must update before they can play.

## 4. Release the launcher

1. In the launcher repo: **Settings > Secrets and variables > Actions**
   - Variable `PLATFORM_API_URL` = `https://api.yourdomain.com`
   - Secret `RELEASES_TOKEN` (see `docs/releasing.md`)
2. Set `version` in `package.json`, commit, then `git tag v1.0.0` and `git push origin v1.0.0`.
3. The installer appears on the download page by itself.

## 5. Try it as a stranger

On a PC that has never seen the project: download the installer from the page, install, create an account,
enter the emailed code, add Railbound, install it, press Play. If any step fails, the message in the app says
which part (service unreachable, email not confirmed, no build published, checksum mismatch, and so on).

## Known limits for a first public release

- The installer is not code-signed, so Windows SmartScreen shows a warning the first time.
- The launcher does not update itself; players download a newer installer (reasons in `docs/releasing.md`).
- One API instance only, on SQLite with scripted backups. Fine for a launch; moving to PostgreSQL (with migrations) is
  the next step before running several instances. That migration is not written.
- Rate limits and launch tickets are kept in memory, so they reset when the API restarts.
- Game downloads, installs and play are not part of the first launcher release.
- Railbound is free. Paid games need the checkout flow, which is not built.
