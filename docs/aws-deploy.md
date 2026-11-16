# Hosting the Platform API on AWS with HTTPS

Nothing here has been done for you: there is no AWS account access in this project, and the API that runs on port
8080 on your own PC is not reachable from outside. This is the shortest path to a public `https://` address using what
is already in `services/platform-api` (Docker, and Caddy, which gets and renews the certificate by itself).

You need: an AWS account, a domain name you control, and about an hour.

## 1. Server (EC2)

1. **EC2 > Launch instance**: Ubuntu 24.04, `t3.small` (2 GB RAM; Argon2id hashing uses 64 MiB per sign-in), 20 GB gp3
   disk, a key pair for SSH.
2. **Security group** inbound: TCP 22 from *your IP only*, TCP 80 and 443 from anywhere. Do **not** open 8080: Caddy
   reaches the API on the private Docker network, and only 80 and 443 are published.
3. **Allocate an Elastic IP** and attach it, so the address survives a reboot.

## 2. Domain

Create an `A` record `api.yourdomain.com` pointing to the Elastic IP (Route 53 or your registrar). Wait until
`nslookup api.yourdomain.com` returns that IP; Caddy cannot get a certificate before that.

## 3. Install Docker and copy the API

```bash
ssh -i key.pem ubuntu@api.yourdomain.com
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-v2
sudo usermod -aG docker ubuntu     # log out and back in once
```

From your PC, copy the folder (not `node_modules`, not `data`):

```bash
scp -i key.pem -r services/platform-api ubuntu@api.yourdomain.com:~/platform-api
```

## 4. Email (Amazon SES)

Verification and reset codes are sent by SMTP.

1. **SES > Verified identities**: verify your domain (add the DKIM records it shows).
2. **SES > SMTP settings > Create SMTP credentials**. Note the SMTP user and password and the region's host,
   e.g. `email-smtp.eu-west-1.amazonaws.com`.
3. New SES accounts are in the *sandbox* (they can only email verified addresses). **Request production access**
   before real players sign up.
4. `SMTP_URL=smtps://SMTPUSER:URL-ENCODED-PASSWORD@email-smtp.REGION.amazonaws.com:465`

## 5. Settings and start

```bash
cd ~/platform-api
cp .env.production.example .env.production
nano .env.production        # fill every value; secrets: openssl rand -hex 32 (three times)
docker compose --env-file .env.production up -d --build
docker compose logs -f api  # Ctrl+C to leave
```

Set `API_DOMAIN`, `PUBLIC_BASE_URL`, `JWT_SECRET`, `PLATFORM_SERVICE_KEY`, `PLATFORM_DOWNLOAD_KEY`, `SMTP_URL`,
`MAIL_FROM`, and (when ready, see `docs/google-login.md`) `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
The API refuses to start in production with weak or missing secrets, which is intended.

Check from any browser: `https://api.yourdomain.com/healthz` must show `{"ok":true}` with a valid padlock, and
`https://api.yourdomain.com/v1/catalog` must list the games.

## 6. Backups

Account data lives in the Docker volume `oneengine-data`. Daily, as a cron job on the server:

```bash
docker compose -f ~/platform-api/docker-compose.yml exec -T api npx tsx scripts/backup.ts /data/backups
```

then copy `/data/backups` somewhere else (for example `aws s3 sync` to a private bucket with versioning). Also enable
EBS snapshots of the instance volume. Test a restore once (`docs/go-live.md`).

## 7. Point the launcher at it

In the launcher repo (GitHub **Settings > Secrets and variables > Actions > Variables**) set
`PLATFORM_API_URL=https://api.yourdomain.com`. The installer has this address built in; a release build fails if it is
missing, not https, or local.

## Known limits of this setup

- Game builds live in the depot on the same disk (`DEPOT_DIR`). Each version of Railbound adds about 1.1 GB, so
  prune old builds or grow the volume (`docs/publishing-builds.md`).
- One instance on SQLite. Rate limits and launch tickets are in memory and reset on restart. Do not run two copies.
- Updates: copy the new files and run `docker compose --env-file .env.production up -d --build`; the data volume is
  kept.
- No monitoring or alerting yet; add an uptime check on `/healthz` (Route 53 health check, or a free uptime service).
