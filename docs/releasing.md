# Releasing the launcher

A tag push builds the Windows installer and publishes it as a GitHub Release on the public
`oneenginedev/oneengine` repo. The download page (`download.html` on the website) reads releases from that
repo, so the new version shows up there by itself, with its file, size and date.

## One-time setup

1. Create a fine-grained personal access token with **Contents: read and write** on `oneenginedev/oneengine`.
2. In this repo: **Settings > Secrets and variables > Actions**
   - Secret `RELEASES_TOKEN`: the token from step 1.
   - Variable `PLATFORM_API_URL` (**required**): the public address of your Platform API, for example
     `https://api.example.com`. It is built into the installer; the release stops if it is missing or not
     `https://`, because an app pointing at the player's own PC cannot sign anyone in. Players can still change
     it in Settings, but they should never have to.
3. Host the Platform API first (`docs/go-live.md`): the app is only as real as the server behind it.

## Each release

```bash
# 1. set "version" in package.json, e.g. 1.0.1, and commit it
# 2. tag and push (the tag must equal v + the package.json version)
git tag v1.0.1
git push origin v1.0.1
```

The workflow (`.github/workflows/release.yml`) checks the tag, runs `npm run dist`, attaches the installer to a release on this repo (private) and creates the public release
with the commit subjects since the previous tag as notes. A tag with a dash (`v1.1.0-beta`) becomes a
pre-release. The download page prefers the newest non-pre-release.

To rebuild a tag that already exists (for example after adding the secret): **Actions > Release launcher >
Run workflow**, enter the tag. Existing releases get the installer replaced, not duplicated.

## Build locally

```bash
VITE_PLATFORM_API_URL=https://api.example.com npm run dist    # release/OneEngine-Store-Setup-<version>.exe (about 125 MB)
```

On Windows PowerShell: `$env:VITE_PLATFORM_API_URL='https://api.example.com'; npm run dist`.

## Known limits

- The installer is not code-signed yet, so Windows SmartScreen shows a warning. Buy a signing certificate
  before a public launch.
- No auto-update yet. Players download the new installer from the page.
