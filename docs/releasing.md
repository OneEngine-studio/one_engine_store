# Releasing the launcher

A tag push tests the code, builds the Windows installer and publishes it as a GitHub Release on the public
`oneenginedev/oneengine` repo (and on this repo). The download page (`download.html` on the website) reads releases
from the public repo, so a new version shows up there by itself, with its file, size and date.

## What the first public release contains

- Account creation, email confirmation, sign-in, password reset and change, display name, sign-out.
- The game catalog, read from the Platform API.
- **Not in this version:** game downloads, installs and play. The code is in the repo (`electron/installer.cjs`)
  and tested, but the build switches it off. The Library, Downloads and Play controls say "coming soon", and the
  main process does not register those channels or allow those API routes. To ship it later, build with
  `ENABLE_GAMES=true`.
- Community is a "coming soon" page.

## One-time setup

1. Create a fine-grained personal access token with **Contents: read and write** on `oneenginedev/oneengine`.
2. In this repo: **Settings > Secrets and variables > Actions**
   - Secret `RELEASES_TOKEN`: the token from step 1.
   - Variable `PLATFORM_API_URL` (**required**): the public address of your Platform API, for example
     `https://api.example.com`. The release stops if it is missing, not `https://`, or a local address. The address
     is written into the installer at build time (`electron/app-config.json`); the page cannot change it.
3. Host the Platform API first (`docs/go-live.md`): the app is only as real as the server behind it.

## Each release

```bash
# 1. set "version" in package.json, e.g. 1.0.1, and commit it
# 2. tag and push (the tag must equal v + the package.json version)
git tag v1.0.1
git push origin v1.0.1
```

The workflow (`.github/workflows/release.yml`):

1. checks the tag equals the package.json version and that `RELEASES_TOKEN` and an https `PLATFORM_API_URL` exist;
2. **refuses to continue if a release for the tag already exists** on either repo;
3. typechecks the launcher, typechecks and tests the Platform API;
4. builds the installer, then tests the launcher and the built page (a failing test stops the release);
5. checks the installer exists and carries no local address, writes a `.sha256` file;
6. publishes `OneEngine-Store-Setup-<version>.exe` and its checksum, with the commit subjects since the previous
   tag as notes. A tag with a dash (`v1.1.0-beta`) becomes a pre-release; the download page prefers the newest
   stable release.

Pushes and pull requests run `.github/workflows/ci.yml` (typecheck, build, tests) without publishing anything.

To rebuild a tag that already has a release, run **Actions > Release launcher > Run workflow**, enter the tag and
tick **replace_existing**. Nothing is replaced without that.

## Build locally

```powershell
$env:PLATFORM_API_URL = 'https://api.example.com'; npm run dist    # release\OneEngine-Store-Setup-<version>.exe (about 125 MB)
```

`npm run dist` refuses a missing, plain-http or localhost address. For a private test installer that talks to a
server on your own PC, set `ALLOW_LOCAL_BUILD=1` instead; never publish that file.

The installer is per-user (no administrator prompt), lets the player choose the folder, adds a Start Menu entry and
a Desktop shortcut, and shows up in Windows "Installed apps". The Desktop shortcut is created by default and can be
deleted afterwards (an install-time checkbox for it is not built). Uninstalling removes the program but keeps the
player's data.

## Code signing

The installer is **not signed**. Windows SmartScreen will warn the first time ("Windows protected your PC": More
info, then Run anyway). To remove the warning you need a code-signing certificate (an EV certificate gets trusted
immediately; a standard one builds reputation over time). With a certificate, set electron-builder's
`CSC_LINK` and `CSC_KEY_PASSWORD` secrets in the workflow environment and the same `npm run dist` signs it.
Until then, the release notes and download page say so.

## Updates

The launcher does **not** update itself. Players download the newer installer from the download page. Automatic
updates were left out on purpose: without a signed installer, an update feed fetched from GitHub would have no
publisher check, so whoever got hold of the releases token could push code to every player's PC. Add
`electron-updater` after the installer is code-signed.
