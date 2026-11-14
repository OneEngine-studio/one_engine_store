# Going live: what only you can do

The launcher, accounts, downloads, installs and launch tickets are built and tested. A player can only use
them once these five things exist. Do them in this order.

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

Back up the `oneengine-data` Docker volume: it holds every account and every published build.

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
- The launcher does not update itself yet; players download a newer installer.
- One API instance only (SQLite). Fine for a launch; move to Postgres before it needs to scale.
- Railbound is free. Paid games need the checkout flow, which is not built.
