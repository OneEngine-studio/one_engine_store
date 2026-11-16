# Publishing a game build

How a game build gets from a Unity export to "Install" in the launcher. Railbound 1.0.0 was published this way.

## 1. Make the zip

- Zip the Windows build folder. `Game.exe` may sit at the top of the zip or inside one folder that wraps everything.
- Leave out Unity's `*_BurstDebugInformation_DoNotShip` folder. `publish-build` refuses a zip that still has it.

## 2. Copy it to the server

```bash
scp -i key.pem railbound-win64.zip ec2-user@<server>:/home/ec2-user/
ssh -i key.pem ec2-user@<server> sha256sum railbound-win64.zip
```

Compare the hash with the local file before going on.

## 3. Register it

On the server, in `services/platform-api`:

```bash
set -a; . ./.env.production; set +a
npm run -s publish-build -- railbound 1.0.0 /home/ec2-user/railbound-win64.zip Railbound.exe win64
rm /home/ec2-user/railbound-win64.zip
```

The script checks the zip, copies it into the depot (`DEPOT_DIR`), records its size and SHA-256, and makes it the
latest build. No restart is needed.

## 4. Who can download it

- Build details need a signed-in account; the file itself needs a short-lived token from that call.
- A free game is claimed with "Add to library"; a paid one is granted by the payment webhook.
- Installers only offer Install when built with `ENABLE_GAMES=true` (`docs/releasing.md`).

## Disk space

Each build stays in the depot. Railbound 1.0.0 is 1.09 GB on an 8 GB disk, so delete old builds from
`data/depot/<product>/<platform>/` (and their rows) or grow the volume before publishing many versions.
